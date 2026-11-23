import { isSameOrigin, noStore } from "../../../lib/admin-auth";
import { createLoginCode, studentInfo, verifyLoginCode } from "../../../lib/institute-store";
import { deliverStudentEmail, mailDeliveryReady } from "../../../lib/student-mail";
import { expireStudentCookie, getStudentFromRequest, studentCookie } from "../../../lib/student-session";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const requests = new Map<string,{count:number;until:number}>();

function allowAttempt(request:Request){
  const ip=(request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")||"local").split(",")[0].slice(0,70);
  const now=Date.now();
  const item=requests.get(ip)||{count:0,until:now+15*60_000};
  if(item.until<now){item.count=0;item.until=now+15*60_000;}
  item.count++;
  requests.set(ip,item);
  return item.count<=10;
}
export async function GET(request:Request){
  const studentNumber=getStudentFromRequest(request);
  if(!studentNumber)return noStore(Response.json({authenticated:false,emailDeliveryReady:mailDeliveryReady()}));
  try{const me=await studentInfo(studentNumber);
    if(!me)return noStore(Response.json({authenticated:false,emailDeliveryReady:mailDeliveryReady()}));
    return noStore(Response.json({authenticated:true,student:me.student}));
  }catch{return noStore(Response.json({authenticated:false,emailDeliveryReady:mailDeliveryReady()}));}
}
export async function POST(request:Request){
  if(!isSameOrigin(request))return noStore(Response.json({error:"Invalid origin."},{status:403}));
  if(!allowAttempt(request))return noStore(Response.json({error:"Too many attempts. Please try later."},{status:429}));
  let input:unknown;try{input=await request.json();}catch{return noStore(Response.json({error:"Invalid request."},{status:400}));}
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  try{
    if(data.action==="requestCode"){
      try {
        const result=await createLoginCode(data.studentNumber,data.email);
        if(result.exists)await deliverStudentEmail(result.notification);
      } catch(e) {
        // Never disclose whether a student number/email combination exists
        // through repeated-code or account lookup differences.
        if(!(e instanceof Error) || !e.message.includes("requested recently")) throw e;
      }
      return noStore(Response.json({message:mailDeliveryReady() ?
        "If the details match, a verification email has been requested." :
        "Local preview: if the details match, a code is available for the administrator to review. No email was sent.",
        emailDeliveryReady:mailDeliveryReady()}));
    }
    if(data.action==="verifyCode"){
      const valid=await verifyLoginCode(data.studentNumber,data.code);
      if(!valid)return noStore(Response.json({error:"Invalid or expired sign-in code."},{status:401}));
      const number=String(data.studentNumber).trim().toUpperCase();
      const response=noStore(Response.json({authenticated:true}));
      response.headers.set("Set-Cookie",studentCookie(number,request));
      return response;
    }
    return noStore(Response.json({error:"Unsupported action."},{status:400}));
  }catch(e){
    const error=e instanceof Error?e.message:"Unable to sign in.";
    const status=/not configured|Online student storage/.test(error)?503:400;
    return noStore(Response.json({error},{status}));
  }
}
export async function DELETE(request:Request){
  if(!isSameOrigin(request))return noStore(Response.json({error:"Invalid origin."},{status:403}));
  const response=noStore(Response.json({authenticated:false}));
  response.headers.set("Set-Cookie",expireStudentCookie());
  return response;
}
