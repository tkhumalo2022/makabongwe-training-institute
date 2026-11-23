import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "mti_student_session";
const SESSION_SECONDS = 4 * 60 * 60;

function secret(){
  const value=process.env.MAKABONGWE_STUDENT_SESSION_SECRET || (process.env.NODE_ENV==="development" ? process.env.MAKABONGWE_ADMIN_SESSION_SECRET : undefined);
  if(!value || value.length<32)throw new Error("Student session signing key is missing.");
  return value;
}
function sign(number:string,expiry:number){
  return createHmac("sha256",secret()).update(number+":"+expiry+":mti-session-v1").digest("hex");
}
export function studentCookie(number:string,request:Request) {
  const expires=Math.floor(Date.now()/1000)+SESSION_SECONDS;
  const value=number+"."+expires+"."+sign(number,expires);
  const secure=new URL(request.url).protocol==="https:" ? "; Secure" : "";
  return COOKIE_NAME+"="+value+"; Path=/api/learn; HttpOnly; SameSite=Strict; Max-Age="+SESSION_SECONDS+secure;
}
export function expireStudentCookie(){
  return COOKIE_NAME+"=; Path=/api/learn; HttpOnly; SameSite=Strict; Max-Age=0";
}
export function getStudentFromRequest(request:Request){
  const cookie=request.headers.get("cookie")||"";
  const token=cookie.split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE_NAME+"="));
  if(!token)return null;
  const m=token.slice(COOKIE_NAME.length+1).match(/^(MTI-[0-9]{4}-[0-9]{6,})\.([0-9]{10,12})\.([a-f0-9]{64})$/);
  if(!m)return null;
  const expiry=Number(m[2]);
  const now=Math.floor(Date.now()/1000);
  if(expiry<=now || expiry>now+SESSION_SECONDS)return null;
  const left=Buffer.from(m[3],"hex"),right=Buffer.from(sign(m[1],expiry),"hex");
  return timingSafeEqual(left,right) ? m[1] : null;
}
