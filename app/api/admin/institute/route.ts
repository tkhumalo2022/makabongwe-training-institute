import { hasAdminSession, isSameOrigin, noStore } from "../../../lib/admin-auth";
import { instituteOverview, registerStudent, enrolStudent, saveModule, publishAnnouncement, addResource, localLoginOutbox } from "../../../lib/institute-store";
import { deliverStudentEmail, mailDeliveryReady } from "../../../lib/student-mail";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
  if(!hasAdminSession(request)) return noStore(Response.json({error:"Administrator sign-in required."},{status:401}));
  try{
    const overview=await instituteOverview();
    const url=new URL(request.url);
    // Private testing tool only. Never expose one-time passwords on hosted production.
    const loginPreviews=url.searchParams.get("previewCodes")==="true"&&process.env.NODE_ENV!=="production" ?
      (await localLoginOutbox()).map(x=>({studentNumber:x.studentNumber,subject:x.subject,body:x.body,createdAt:x.createdAt,state:x.state})):undefined;
    return noStore(Response.json({...overview,emailDeliveryReady:mailDeliveryReady(),loginPreviews}));
  }catch{
    return noStore(Response.json({error:"Student administration data is not configured for this environment."},{status:503}));
  }
}
export async function POST(request:Request){
  if(!isSameOrigin(request))return noStore(Response.json({error:"Invalid request origin."},{status:403}));
  if(!hasAdminSession(request))return noStore(Response.json({error:"Administrator sign-in required."},{status:401}));
  if(Number(request.headers.get("content-length")||0)>20_000)return noStore(Response.json({error:"Request too large."},{status:413}));
  let value:unknown;
  try{value=await request.json();}catch{return noStore(Response.json({error:"Invalid JSON."},{status:400}));}
  const data=(value&&typeof value==="object"?value:{}) as Record<string,unknown>;
  const action=data.action;
  try{
    if(action==="registerStudent"){
      const result=await registerStudent(data);
      const delivery=await deliverStudentEmail(result.notification);
      return noStore(Response.json({student:result.student,delivery}, {status:201}));
    }
    if(action==="enrolStudent"){
      const result=await enrolStudent(data);
      const delivery=await deliverStudentEmail(result.notification);
      return noStore(Response.json({student:result.student,delivery},{status:201}));
    }
    if(action==="addModule"){
      const lesson=await saveModule(data);return noStore(Response.json({module:lesson},{status:201}));
    }
    if(action==="publishAnnouncement"){
      const result=await publishAnnouncement(data);
      const delivery=await Promise.all(result.notifications.map(deliverStudentEmail));
      return noStore(Response.json({announcement:result.announcement,queued:delivery.filter(x=>x.state==="queued").length,sent:delivery.filter(x=>x.state==="sent").length},{status:201}));
    }
    if(action==="addResource"){
      const resource=await addResource(data);return noStore(Response.json({resource},{status:201}));
    }
    return noStore(Response.json({error:"Unknown administrator action."},{status:400}));
  }catch(e){
    const error=e instanceof Error?e.message:"Could not complete the request.";
    const status=/not configured|Online student storage/i.test(error)?503:400;
    return noStore(Response.json({error},{status}));
  }
}
