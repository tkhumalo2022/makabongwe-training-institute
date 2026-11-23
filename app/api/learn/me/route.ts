import { noStore } from "../../../lib/admin-auth";
import { studentInfo } from "../../../lib/institute-store";
import { getStudentFromRequest } from "../../../lib/student-session";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const studentNumber=getStudentFromRequest(request);
  if(!studentNumber)return noStore(Response.json({error:"Student sign-in required."},{status:401}));
  try{const me=await studentInfo(studentNumber);
    if(!me)return noStore(Response.json({error:"Student account not found."},{status:404}));
    return noStore(Response.json(me));
  }catch{return noStore(Response.json({error:"Student records are not available."},{status:503}));}
}
