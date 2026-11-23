import "server-only";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listManagedProgrammes } from "./admin-programmes";

export type Student = { studentNumber: string; fullName: string; email: string; status: "active" | "suspended"; createdAt: string };
export type Membership = {studentNumber: string; courseId: number; status: "enrolled" | "completed"; enrolledAt: string };
export type Module = {id: string; courseId: number; title: string; summary: string; content: string; order: number; published: boolean; createdAt: string};
export type Announcement = {id: string; courseId: number; title: string; body: string; published: boolean; createdAt: string};
export type Resource = {id: string; courseId: number; moduleId: string | null; title: string; url: string; published: boolean; createdAt: string};
export type OutboxItem = {id: string; studentNumber: string; courseId: number | null; recipient: string; kind: "welcome"|"course-enrolment"|"announcement"|"login-code"; subject: string; body: string; state: "queued"|"sent"|"failed"; createdAt: string; sentAt?: string; providerMessageId?: string; error?: string};
type LoginChallenge = {studentNumber: string; codeHash: string; expiresAt: number; attempts: number};
type Store = {nextNumber: number; students: Student[]; memberships: Membership[]; modules: Module[]; announcements: Announcement[]; resources: Resource[]; outbox: OutboxItem[]; challenges: LoginChallenge[]};
type Course = {id:number;slug:string;title:string;description:string};
const directory = join(process.cwd(), ".admin-local");
const filename = join(directory, "institute.json");
const initial = ():Store => ({nextNumber:1,students:[],memberships:[],modules:[],announcements:[],resources:[],outbox:[],challenges:[]});
const localOnly = () => {
  if (process.env.NODE_ENV === "production" || process.env.MAKABONGWE_INSTITUTE_MODE === "neon")
    throw new Error("Online student storage is not configured. Complete the Neon database migration before enabling production learner access.");
};
const studentKey = () => process.env.MAKABONGWE_ADMIN_SESSION_SECRET || "";
const hashCode = (studentNumber:string, code:string) => createHmac("sha256",studentKey()).update("student-login:"+studentNumber+":"+code).digest("hex");
const dateYear = () => new Intl.DateTimeFormat("en-ZA",{year:"numeric",timeZone:"Africa/Johannesburg"}).format(new Date());
export function validateEmail(email:unknown) {if(typeof email!=="string")throw new Error("Student email is required.");const e=email.trim().toLowerCase();if(!/^[^\s@]{1,80}@[^\s@]+\.[^\s@]+$/.test(e)||e.length>254)throw new Error("Enter a valid student email.");return e;}
function required(v:unknown,label:string,min=2,max=160){if(typeof v!=="string"||v.trim().length<min||v.trim().length>max)throw new Error(label+" must contain "+min+" to "+max+" characters.");return v.trim();}
async function read():Promise<Store>{
  localOnly();
  try {const data=JSON.parse(await readFile(filename,"utf8")) as Store;return data;}
  catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return initial();throw e;}
}
async function save(s:Store){await mkdir(directory,{recursive:true});const tmp=join(directory,randomUUID()+".tmp");await writeFile(tmp,JSON.stringify(s,null,2),{encoding:"utf8",mode:0o600});await rename(tmp,filename);}
let chain:Promise<unknown>=Promise.resolve();
async function modify<T>(change:(store:Store)=>Promise<T>|T):Promise<T>{
  const run=async()=>{const store=await read();const value=await change(store);await save(store);return value;};
  const next=chain.then(run,run);chain=next.catch(()=>{});return next;
}
export async function courses():Promise<Course[]>{
  const rows=await listManagedProgrammes();
  return rows.map(p=>({id:p.id,slug:p.slug,title:p.title,description:p.description}));
}
async function validCourse(courseId:unknown):Promise<Course>{
  const id=Number(courseId);
  if(!Number.isSafeInteger(id)||id<=0)throw new Error("Select a valid course.");
  const course=(await courses()).find(c=>c.id===id);
  if(!course)throw new Error("Course not found.");
  return course;
}
function queue(s:Store,student:Student,courseId:number|null,kind:OutboxItem["kind"],subject:string,body:string){
  const item:OutboxItem={id:randomUUID(),studentNumber:student.studentNumber,courseId,recipient:student.email,kind,subject,body,state:"queued",createdAt:new Date().toISOString()};
  s.outbox.push(item);
  return item;
}
export async function instituteOverview(){
  const courseList=await courses();const s=await read();
  return {courses:courseList,students:s.students, memberships:s.memberships, modules:s.modules,announcements:s.announcements, resources:s.resources,
    outbox:s.outbox.filter(e=>e.kind!=="login-code").slice(-50).reverse().map(({body,...item})=>({...item,preview:body.slice(0,180)})),
    counts:{students:s.students.length,memberships:s.memberships.length,courses:courseList.length,messagesQueued:s.outbox.filter(e=>e.state==="queued"&&e.kind!=="login-code").length},
    mode:"local-preview" as const};
}
export async function registerStudent(input:unknown){
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const fullName=required(data.fullName,"Full name",3,160);
  const email=validateEmail(data.email);
  const course=await validCourse(data.courseId);
  return modify(s=>{
    const existing=s.students.find(x=>x.email===email);
    if(existing)throw new Error("Student email already exists. Use the enrol-existing-student action.");
    const number="MTI-"+dateYear()+"-"+String(s.nextNumber++).padStart(6,"0");
    const student:Student={studentNumber:number,fullName,email,status:"active",createdAt:new Date().toISOString()};
    s.students.push(student);
    s.memberships.push({studentNumber:number,courseId:course.id,status:"enrolled",enrolledAt:new Date().toISOString()});
    const notification=queue(s,student,course.id,"welcome","Welcome to Makabongwe Training Institute",
      "Dear "+fullName+",\n\nYour student number is "+number+".\nYou are enrolled for "+course.title+".\nVisit the student portal and request a one-time sign-in code with this number and email address.\n\nMakabongwe Training Institute");
    return {student,notification};
  });
}
export async function enrolStudent(input:unknown){
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const studentNumber=required(data.studentNumber,"Student number",12,32).toUpperCase();
  const course=await validCourse(data.courseId);
  return modify(s=>{
    const student=s.students.find(x=>x.studentNumber===studentNumber&&x.status==="active");
    if(!student)throw new Error("Student not found.");
    if(s.memberships.some(x=>x.studentNumber===studentNumber&&x.courseId===course.id))throw new Error("Student is already enrolled in this course.");
    s.memberships.push({studentNumber,courseId:course.id,status:"enrolled",enrolledAt:new Date().toISOString()});
    return {student,notification:queue(s,student,course.id,"course-enrolment","Course enrolment confirmed — "+course.title,
      "Dear "+student.fullName+",\n\nYou have been added to "+course.title+".\nLog in to the Makabongwe student portal using "+studentNumber+" and your email address to access your course space.\n\nMakabongwe Training Institute")};
  });
}
export async function saveModule(input:unknown){
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const course=await validCourse(data.courseId);
  const title=required(data.title,"Module title",2,160);
  const summary=required(data.summary||"Course module", "Module summary",2,800);
  const content=typeof data.content==="string"?data.content.trim().slice(0,15000):"";
  const published=data.published===true;
  return modify(s=>{
    const lesson:Module={id:randomUUID(),courseId:course.id,title,summary,content,order:s.modules.filter(x=>x.courseId===course.id).length,published,createdAt:new Date().toISOString()};
    s.modules.push(lesson);return lesson;
  });
}
export async function publishAnnouncement(input:unknown){
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const course=await validCourse(data.courseId);
  const title=required(data.title,"Announcement title",2,160);
  const body=required(data.body,"Announcement",2,4000);
  const published=data.published===true;
  return modify(s=>{
    const item:Announcement={id:randomUUID(),courseId:course.id,title,body,published,createdAt:new Date().toISOString()};
    s.announcements.push(item);
    const notifications:OutboxItem[]=[];
    if(published)for(const membership of s.memberships.filter(x=>x.courseId===course.id&&x.status==="enrolled")){
      const student=s.students.find(x=>x.studentNumber===membership.studentNumber&&x.status==="active");
      if(student)notifications.push(queue(s,student,course.id,"announcement",course.title+": "+title,
        "Dear "+student.fullName+",\n\n"+body+"\n\nVisit your "+course.title+" course space for details.\n\nMakabongwe Training Institute"));
    }
    return {announcement:item,notifications};
  });
}
export async function addResource(input:unknown){
  const data=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
  const course=await validCourse(data.courseId);
  const title=required(data.title,"Resource title",2,160);
  const url=required(data.url,"Resource URL",2,1000);
  if(!(url.startsWith("/")&&!url.startsWith("//")) && !/^https:\/\//i.test(url))throw new Error("Resources must use HTTPS links or local paths.");
  return modify(s=>{
    const resource:Resource={id:randomUUID(),courseId:course.id,title,url,moduleId:null,published:data.published===true,createdAt:new Date().toISOString()};
    s.resources.push(resource);return resource;
  });
}
export async function studentInfo(number:string){
  const s=await read();
  const student=s.students.find(x=>x.studentNumber===number&&x.status==="active");
  if(!student) return null;
  const enrolled=s.memberships.filter(x=>x.studentNumber===number&&x.status==="enrolled");
  const list=await courses();
  return {student,courseSpaces:enrolled.map(x=>list.find(c=>c.id===x.courseId)).filter((c):c is Course=>Boolean(c))};
}
export async function studentCourseSpace(number:string,slug:string){
  const me=await studentInfo(number);if(!me)return null;
  const course=me.courseSpaces.find(x=>x.slug===slug);if(!course)return null;
  const s=await read();
  return {course,student:me.student,modules:s.modules.filter(x=>x.courseId===course.id&&x.published).sort((a,b)=>a.order-b.order),
   announcements:s.announcements.filter(x=>x.courseId===course.id&&x.published).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
   resources:s.resources.filter(x=>x.courseId===course.id&&x.published)};
}
export async function createLoginCode(number:unknown,email:unknown){
  const studentNumber=required(number,"Student number",12,32).toUpperCase();
  const address=validateEmail(email);
  return modify(s=>{
    const student=s.students.find(x=>x.studentNumber===studentNumber&&x.email===address&&x.status==="active");
    if(!student)return {exists:false as const};
    const now=Date.now();
    const current=s.challenges.find(x=>x.studentNumber===studentNumber&&x.expiresAt>now);
    if(current)throw new Error("A code was requested recently. Try again after it expires.");
    s.challenges=s.challenges.filter(x=>x.expiresAt>now).slice(-100);
    const code=String(randomInt(100000,999999));
    s.challenges.push({studentNumber,codeHash:hashCode(studentNumber,code),expiresAt:now+10*60_000,attempts:0});
    const item=queue(s,student,null,"login-code","Your Makabongwe sign-in code",
      "Dear "+student.fullName+",\n\nYour one-time sign-in code is "+code+". It expires in 10 minutes.\nNever share this code.\n\nMakabongwe Training Institute");
    return {exists:true as const,notification:item};
  });
}
export async function verifyLoginCode(number:unknown,code:unknown){
  const studentNumber=required(number,"Student number",12,32).toUpperCase();
  if(typeof code!=="string"||!/^[0-9]{6}$/.test(code))return false;
  return modify(s=>{
    const challenge=s.challenges.find(x=>x.studentNumber===studentNumber&&x.expiresAt>Date.now());
    if(!challenge||challenge.attempts>=5)return false;
    challenge.attempts++;
    const submitted=Buffer.from(hashCode(studentNumber,code),"hex"),actual=Buffer.from(challenge.codeHash,"hex");
    if(!timingSafeEqual(submitted,actual))return false;
    s.challenges=s.challenges.filter(x=>x.studentNumber!==studentNumber);
    return s.students.some(x=>x.studentNumber===studentNumber&&x.status==="active");
  });
}
export async function localLoginOutbox(){
  const s=await read();
  return s.outbox.filter(x=>x.kind==="login-code").slice(-25).reverse();
}
export async function markDelivery(id:string,state:"sent"|"failed",messageId?:string,error?:string){
  return modify(s=>{const item=s.outbox.find(x=>x.id===id);if(!item)throw new Error("Email record missing.");
    item.state=state;if(messageId)item.providerMessageId=messageId;if(error)item.error=error.slice(0,160);if(state==="sent")item.sentAt=new Date().toISOString();return item;});
}
