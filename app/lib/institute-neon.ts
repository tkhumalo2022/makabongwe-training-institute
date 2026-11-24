import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { Student, Membership, Module, Announcement, Resource, OutboxItem } from "./institute-store";

// Database-backed student registry: preview-only until owner reviews authentication,
// backups, audit logging and recipient delivery. Every query uses bound SQL parameters.
type Value = string | number | boolean | null;
type Row = Record<string, unknown>;
type Course = {id:number;slug:string;title:string;description:string};
function connection() {
  const value=process.env.NEON_DATABASE_URL || process.env.INSTITUTE_DATABASE_URL;
  if(process.env.MAKABONGWE_INSTITUTE_MODE!=="neon" || !value || !/^postgres(?:ql)?:\/\//.test(value))
    throw new Error("Neon preview database not configured.");
  return neon(value);
}
async function query<T extends Row>(statement:string,parameters:Value[]=[]):Promise<T[]> {
  return await connection().query(statement,parameters) as unknown as T[];
}
function required(input:unknown,label:string,min=2,max=160) {
  if(typeof input!=="string" || input.trim().length<min || input.trim().length>max)
    throw new Error("Enter a valid "+label.toLowerCase()+".");
  return input.trim();
}
function validEmail(input:unknown){
  const address=required(input,"Email address",5,254).toLowerCase();
  if(!/^[^\s@]{1,80}@[^\s@]+\.[^\s@]+$/.test(address))throw new Error("Enter a valid email address.");
  return address;
}
function date(value:unknown){return new Date(String(value)).toISOString();}
const person=(r:Row):Student=>({studentNumber:String(r.student_number),fullName:String(r.full_name),
  email:String(r.email),status:r.status==="suspended"?"suspended":"active",createdAt:date(r.created_at)});
const member=(r:Row):Membership=>({studentNumber:String(r.student_number),courseId:Number(r.course_id),
  status:r.status==="completed"?"completed":"enrolled",enrolledAt:date(r.enrolled_at)});
const lesson=(r:Row):Module=>({id:String(r.id),courseId:Number(r.course_id),title:String(r.title),
  summary:String(r.summary),content:String(r.content),order:Number(r.sort_order),published:r.is_published===true,createdAt:date(r.created_at)});
const alert=(r:Row):Announcement=>({id:String(r.id),courseId:Number(r.course_id),title:String(r.title),
  body:String(r.body),published:r.is_published===true,createdAt:date(r.created_at)});
const document=(r:Row):Resource=>({id:String(r.id),courseId:Number(r.course_id),moduleId:r.module_id?String(r.module_id):null,
  title:String(r.title),url:String(r.url),published:r.is_published===true,createdAt:date(r.created_at)});
const mail=(r:Row):OutboxItem=>({id:String(r.id),studentNumber:String(r.student_number),
  courseId:r.course_id===null?null:Number(r.course_id),recipient:String(r.recipient),
  kind:r.kind as OutboxItem["kind"],subject:String(r.subject),body:String(r.body),
  state:r.state as OutboxItem["state"],createdAt:date(r.created_at),
  ...(r.sent_at?{sentAt:date(r.sent_at)}:{}),
  ...(r.provider_message_id?{providerMessageId:String(r.provider_message_id)}:{}),
  ...(r.error_summary?{error:String(r.error_summary)}:{})});
const course=(r:Row):Course=>({id:Number(r.id),slug:String(r.slug),title:String(r.title),description:String(r.description)});
function secret(){
  const value=process.env.MAKABONGWE_STUDENT_SESSION_SECRET ||
    (process.env.NODE_ENV==="development"?process.env.MAKABONGWE_ADMIN_SESSION_SECRET:undefined);
  if(!value || value.length<32)throw new Error("Student session signing key not configured.");
  return value;
}
function hashCode(number:string,code:string){
  return createHmac("sha256",secret()).update("student-login:"+number+":"+code).digest("hex");
}
export async function courses():Promise<Course[]>{
  return (await query<Row>("SELECT id,slug,title,description FROM public.mti_courses WHERE status<>'archived' ORDER BY id")).map(course);
}
async function chosenCourse(input:unknown){
  const id=Number(input);
  if(!Number.isSafeInteger(id)||id<=0)throw new Error("Choose a course.");
  const found=(await courses()).find(c=>c.id===id);
  if(!found)throw new Error("Course is not available.");
  return found;
}
export async function instituteOverview(){
  const [courseList,students,memberships,modules,announcements,resources,outbox]=await Promise.all([
    courses(),
    query<Row>("SELECT student_number,full_name,email,status,created_at FROM public.mti_students ORDER BY created_at DESC LIMIT 500"),
    query<Row>("SELECT student_number,course_id,status,enrolled_at FROM public.mti_course_enrolments ORDER BY enrolled_at DESC LIMIT 2500"),
    query<Row>("SELECT id,course_id,title,summary,content,sort_order,is_published,created_at FROM public.mti_course_modules ORDER BY course_id,sort_order LIMIT 2000"),
    query<Row>("SELECT id,course_id,title,body,is_published,created_at FROM public.mti_course_announcements ORDER BY created_at DESC LIMIT 500"),
    query<Row>("SELECT id,course_id,module_id,title,url,is_published,created_at FROM public.mti_course_resources ORDER BY created_at DESC LIMIT 500"),
    query<Row>("SELECT id,student_number,course_id,recipient,kind,subject,body,state,created_at,sent_at,provider_message_id,error_summary FROM public.mti_email_outbox WHERE kind<>'login-code' ORDER BY created_at DESC LIMIT 50")
  ]);
  const messages=outbox.map(mail);
  return {courses:courseList,students:students.map(person),memberships:memberships.map(member),modules:modules.map(lesson),
    announcements:announcements.map(alert),resources:resources.map(document),
    outbox:messages.map(({body,...item})=>({...item,preview:body.slice(0,180)})),
    counts:{students:students.length,memberships:memberships.length,courses:courseList.length,
      messagesQueued:messages.filter(m=>m.state==="queued").length},
    mode:"neon-preview" as const};
}
export async function registerStudent(input:unknown){
  const v=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const name=required(v.fullName,"Full name",3,160),email=validEmail(v.email),selected=await chosenCourse(v.courseId);
  const intro="Dear "+name+",\n\nYour student number is ";
  const ending=".\nYou are enrolled for "+selected.title+".\nRequest a one-time sign-in code using this number and your registered email.\n\nMakabongwe Training Institute";
  const sql=[
    "WITH selected_course AS (SELECT id FROM public.mti_courses WHERE id=$1 AND status<>'archived'),",
    "student AS (INSERT INTO public.mti_students(full_name,email) SELECT $2,$3 FROM selected_course",
    " RETURNING student_number),",
    "enrol AS (INSERT INTO public.mti_course_enrolments(student_number,course_id)",
    " SELECT student.student_number,selected_course.id FROM student CROSS JOIN selected_course RETURNING student_number),",
    "notice AS (INSERT INTO public.mti_email_outbox(student_number,course_id,recipient,kind,subject,body)",
    " SELECT student.student_number,$1,$3,'welcome','Welcome to Makabongwe Training Institute',",
    " $4 || student.student_number || $5 FROM student JOIN enrol USING(student_number) RETURNING id)",
    "SELECT student.student_number,notice.id AS message_id FROM student CROSS JOIN notice"
  ].join(" ");
  let created:Row[];
  try {created=await query<Row>(sql,[selected.id,name,email,intro,ending]);}
  catch(e){
    if(e instanceof Error && /unique|duplicate|23505|mti_students_email_ci/i.test(e.message))
      throw new Error("This email is already registered. Enrol the existing student instead.");
    throw e;
  }
  if(!created.length)throw new Error("Selected course is no longer available.");
  const [students,notices]=await Promise.all([
    query<Row>("SELECT student_number,full_name,email,status,created_at FROM public.mti_students WHERE student_number=$1",[String(created[0].student_number)]),
    query<Row>("SELECT * FROM public.mti_email_outbox WHERE id=$1",[String(created[0].message_id)])
  ]);
  return {student:person(students[0]),notification:mail(notices[0])};
}
export async function enrolStudent(input:unknown){
  const v=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const number=required(v.studentNumber,"Student number",12,32).toUpperCase(),selected=await chosenCourse(v.courseId);
  const body="You are enrolled in "+selected.title+". Sign in using your permanent student number: "+number+".";
  const sql=[
    "WITH student AS (SELECT student_number,email FROM public.mti_students",
    " WHERE student_number=$1 AND status='active'),",
    "enrol AS (INSERT INTO public.mti_course_enrolments(student_number,course_id)",
    " SELECT student_number,$2 FROM student WHERE true ON CONFLICT DO NOTHING RETURNING student_number),",
    "notice AS (INSERT INTO public.mti_email_outbox(student_number,course_id,recipient,kind,subject,body)",
    " SELECT student.student_number,$2,student.email,'course-enrolment',$3,$4",
    " FROM student JOIN enrol USING(student_number) RETURNING id)",
    "SELECT enrol.student_number,notice.id AS message_id FROM enrol CROSS JOIN notice"
  ].join(" ");
  const created=await query<Row>(sql,[number,selected.id,"Course enrolment confirmed: "+selected.title,body]);
  if(!created.length)throw new Error("Student not found or already enrolled.");
  const [students,notices]=await Promise.all([
    query<Row>("SELECT student_number,full_name,email,status,created_at FROM public.mti_students WHERE student_number=$1",[number]),
    query<Row>("SELECT * FROM public.mti_email_outbox WHERE id=$1",[String(created[0].message_id)])
  ]);
  return {student:person(students[0]),notification:mail(notices[0])};
}
export async function saveModule(input:unknown){
  const v=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const selected=await chosenCourse(v.courseId),title=required(v.title,"Module title",2,160);
  const summary=required(v.summary||"Course module","Module summary",2,800);
  const content=typeof v.content==="string"?v.content.trim().slice(0,15000):"";
  const result=await query<Row>(
    "INSERT INTO public.mti_course_modules(course_id,title,summary,content,sort_order,is_published) "+
    "VALUES($1,$2,$3,$4,(SELECT coalesce(max(sort_order)+1,0) FROM public.mti_course_modules WHERE course_id=$1),$5) RETURNING *",
    [selected.id,title,summary,content,v.published===true]);
  return lesson(result[0]);
}
export async function publishAnnouncement(input:unknown){
  const v=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const selected=await chosenCourse(v.courseId),title=required(v.title,"Title",2,160),body=required(v.body,"Announcement",2,4000);
  const statement=[
    "WITH added AS (INSERT INTO public.mti_course_announcements(course_id,title,body,is_published)",
    " VALUES($1,$2,$3,$4) RETURNING *),",
    "messages AS (INSERT INTO public.mti_email_outbox(student_number,course_id,recipient,kind,subject,body)",
    " SELECT s.student_number,$1,s.email,'announcement',$5,$3 FROM added",
    " JOIN public.mti_course_enrolments e ON e.course_id=added.course_id AND e.status='enrolled'",
    " JOIN public.mti_students s ON s.student_number=e.student_number AND s.status='active'",
    " WHERE added.is_published=true RETURNING *),",
    "summary AS (SELECT coalesce(json_agg(messages),'[]'::json) AS notices FROM messages)",
    "SELECT added.*,summary.notices FROM added CROSS JOIN summary"
  ].join(" ");
  const result=await query<Row>(statement,[selected.id,title,body,v.published===true,selected.title+": "+title]);
  return {announcement:alert(result[0]),notifications:((result[0].notices||[]) as Row[]).map(mail)};
}
export async function addResource(input:unknown){
  const v=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const selected=await chosenCourse(v.courseId),title=required(v.title,"Resource title",2,160),url=required(v.url,"Resource URL",2,1000);
  if(!((url.startsWith("/")&&!url.startsWith("//"))||/^https:\/\//i.test(url)))throw new Error("Use HTTPS links or local paths.");
  const result=await query<Row>("INSERT INTO public.mti_course_resources(course_id,title,url,is_published) VALUES($1,$2,$3,$4) RETURNING *",
    [selected.id,title,url,v.published===true]);return document(result[0]);
}
export async function studentInfo(number:string){
  const people=await query<Row>("SELECT student_number,full_name,email,status,created_at FROM public.mti_students WHERE student_number=$1 AND status='active' LIMIT 1",[number]);
  if(!people.length)return null;
  const records=await query<Row>(
    "SELECT c.id,c.slug,c.title,c.description FROM public.mti_courses c "+
    "JOIN public.mti_course_enrolments e ON e.course_id=c.id "+
    "WHERE e.student_number=$1 AND e.status='enrolled' AND c.status<>'archived' ORDER BY c.title",
    [number]);
  return {student:person(people[0]),courseSpaces:records.map(course)};
}
export async function studentCourseSpace(number:string,slug:string){
  const account=await studentInfo(number);
  const selected=account?.courseSpaces.find(c=>c.slug===slug);
  if(!account||!selected)return null;
  const [modules,announcements,resources]=await Promise.all([
    query<Row>("SELECT * FROM public.mti_course_modules WHERE course_id=$1 AND is_published=true ORDER BY sort_order",[selected.id]),
    query<Row>("SELECT * FROM public.mti_course_announcements WHERE course_id=$1 AND is_published=true ORDER BY created_at DESC",[selected.id]),
    query<Row>("SELECT * FROM public.mti_course_resources WHERE course_id=$1 AND is_published=true ORDER BY created_at DESC",[selected.id])
  ]);
  return {student:account.student,course:selected,modules:modules.map(lesson),announcements:announcements.map(alert),resources:resources.map(document)};
}
export async function createLoginCode(number:unknown,address:unknown){
  const id=required(number,"Student number",12,32).toUpperCase(),email=validEmail(address);
  const student=await query<Row>("SELECT student_number,full_name,email FROM public.mti_students WHERE student_number=$1 AND lower(email)=$2 AND status='active' LIMIT 1",[id,email]);
  if(!student.length)return {exists:false as const};
  const active=await query<Row>("SELECT id FROM public.mti_student_login_codes WHERE student_number=$1 AND expires_at>now() AND consumed_at IS NULL LIMIT 1",[id]);
  if(active.length)throw new Error("A code was requested recently. Try again after it expires.");
  const code=String(randomInt(100000,1000000)),hash=hashCode(id,code);
  const text="Dear "+student[0].full_name+",\n\nYour Makabongwe sign-in code is "+code+". It expires in 10 minutes. Never share it.";
  const statement=[
    "WITH challenge AS (INSERT INTO public.mti_student_login_codes(student_number,code_hash,expires_at)",
    "VALUES($1,$2,now()+interval '10 minutes') RETURNING student_number),",
    "outbox AS (INSERT INTO public.mti_email_outbox(student_number,recipient,kind,subject,body)",
    "SELECT student_number,$3,'login-code','Makabongwe verification code',$4 FROM challenge RETURNING *)",
    "SELECT * FROM outbox"
  ].join(" ");
  const result=await query<Row>(statement,[id,hash,email,text]);
  return {exists:true as const,notification:mail(result[0])};
}
export async function verifyLoginCode(number:unknown,code:unknown){
  const id=required(number,"Student number",12,32).toUpperCase();
  if(typeof code!=="string"||!/^[0-9]{6}$/.test(code))return false;
  const hash=hashCode(id,code);
  const result=await query<Row>(
    "UPDATE public.mti_student_login_codes SET attempts=attempts+1,"+
    "consumed_at=CASE WHEN code_hash=$2 THEN now() ELSE consumed_at END "+
    "WHERE id=(SELECT id FROM public.mti_student_login_codes WHERE student_number=$1 "+
    "AND expires_at>now() AND consumed_at IS NULL AND attempts<5 ORDER BY created_at DESC LIMIT 1) "+
    "RETURNING code_hash,consumed_at",
    [id,hash]);
  if(!result.length||!result[0].consumed_at)return false;
  const left=Buffer.from(hash,"hex"),right=Buffer.from(String(result[0].code_hash),"hex");
  return left.length===right.length&&timingSafeEqual(left,right);
}
// Unlike local preview, database login codes are never rendered back to an administrator.
export async function localLoginOutbox():Promise<OutboxItem[]>{
  if(process.env.NODE_ENV==="production")return [];
  const result=await query<Row>("SELECT * FROM public.mti_email_outbox WHERE kind='login-code' ORDER BY created_at DESC LIMIT 25");
  return result.map(mail);
}
export async function markDelivery(id:string,state:"sent"|"failed",messageId?:string,error?:string){
  const result=await query<Row>(
    "UPDATE public.mti_email_outbox SET state=$2,provider_message_id=coalesce($3,provider_message_id),"+
    "error_summary=coalesce($4,error_summary),sent_at=CASE WHEN $2='sent' THEN now() ELSE sent_at END "+
    "WHERE id=$1 RETURNING *",
    [id,state,messageId||null,error?.slice(0,160)||null]);
  if(!result.length)throw new Error("Email record missing.");
  return mail(result[0]);
}
