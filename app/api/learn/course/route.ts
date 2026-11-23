import { noStore } from "../../../lib/admin-auth";
import { studentCourseSpace } from "../../../lib/institute-store";
import { getStudentFromRequest } from "../../../lib/student-session";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const studentNumber=getStudentFromRequest(request);
  if(!studentNumber)return noStore(Response.json({error:"Student sign-in required."},{status:401}));
  const slug=new URL(request.url).searchParams.get("slug")||"";
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return noStore(Response.json({error:"Invalid course."},{status:400}));
  try{
    const course=await studentCourseSpace(studentNumber,slug);
    if(!course)return noStore(Response.json({error:"Course not found or student not enrolled."},{status:404}));
    return noStore(Response.json(course));
  }catch{return noStore(Response.json({error:"Student course unavailable."},{status:503}));}
}
