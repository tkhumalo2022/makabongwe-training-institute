"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Course={id:number;slug:string;title:string;description:string};
type Student={studentNumber:string;fullName:string;email:string;status:string;createdAt:string};
type Membership={studentNumber:string;courseId:number;status:string;enrolledAt:string};
type CourseModule={id:string;courseId:number;title:string;summary:string;content:string;order:number;published:boolean};
type Announcement={id:string;courseId:number;title:string;body:string;published:boolean;createdAt:string};
type Resource={id:string;courseId:number;title:string;url:string;published:boolean};
type EmailItem={id:string;recipient:string;kind:string;subject:string;state:string;preview:string;createdAt:string};
type InstituteData={mode:string;emailDeliveryReady:boolean;students:Student[];memberships:Membership[];courses:Course[];modules:CourseModule[];announcements:Announcement[];resources:Resource[];outbox:EmailItem[];counts:{students:number;memberships:number;courses:number;messagesQueued:number};loginPreviews?:{studentNumber:string;subject:string;body:string;createdAt:string}[]};
type View="students"|"course-spaces"|"communications";
async function receive(response:Response){
  let data:Record<string,unknown>={};
  try{data=await response.json() as Record<string,unknown>;}catch{}
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Request failed.");
  return data;
}
export default function InstitutePanel({view}:{view:View}){
  const [data,setData]=useState<InstituteData|null>(null);
  const [selectedId,setSelectedId]=useState<number|null>(null);
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [existingNumber,setExistingNumber]=useState("");
  const [assignCourse,setAssignCourse]=useState("");
  const [moduleTitle,setModuleTitle]=useState("");
  const [moduleSummary,setModuleSummary]=useState("");
  const [moduleContent,setModuleContent]=useState("");
  const [modulePublish,setModulePublish]=useState(false);
  const [announcementTitle,setAnnouncementTitle]=useState("");
  const [announcementBody,setAnnouncementBody]=useState("");
  const [announcementPublish,setAnnouncementPublish]=useState(false);
  const [resourceTitle,setResourceTitle]=useState("");
  const [resourceUrl,setResourceUrl]=useState("");
  const [resourcePublish,setResourcePublish]=useState(false);
  const [showCodes,setShowCodes]=useState(false);
  const fetchData=useCallback(async(codes=false)=>{
    const result=await receive(await fetch("/api/admin/institute"+(codes?"?previewCodes=true":""),{cache:"no-store"})) as unknown as InstituteData;
    setData(result);
    setSelectedId(current=> current ?? result.courses[0]?.id ?? null);
    return result;
  },[]);
  useEffect(()=>{
    let ok=true;
    const load=async()=>{try{await fetchData(false);}catch(e){if(ok)setError(e instanceof Error?e.message:"Student records unavailable.");}};
    void load();
    const timer=setInterval(()=>{if(document.visibilityState==="visible")void load();},60_000);
    return()=>{ok=false;clearInterval(timer);};
  },[fetchData]);
  const courses=data?.courses||[];
  const selected=courses.find(c=>c.id===selectedId);
  const registered=useMemo(()=>data?.students.filter(s=> (s.fullName+" "+s.studentNumber+" "+s.email).toLowerCase().includes(search.toLowerCase()))||[],[data,search]);
  async function action(payload:Record<string,unknown>){
    setPending(true);setError("");setNotice("");
    try{
      const result=await receive(await fetch("/api/admin/institute",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)}));
      await fetchData(showCodes);
      const delivery=result.delivery as {state?:string}|undefined;
      const description=delivery?.state==="sent"?" Email sent.":delivery?.state==="queued"?" Email added to preview outbox; not sent.":"";
      setNotice("Saved successfully."+description);
      return true;
    }catch(e){setError(e instanceof Error?e.message:"Unable to save.");return false;}
    finally{setPending(false);}
  }
  const selectedEnrolled=data?.memberships.filter(m=>m.courseId===selectedId).length||0;
  return <section className="mk-section mk-institute-section">
    <div className="mk-headline">
      <p className="mk-eyebrow">MAKABONGWE / ONLINE INSTITUTE</p>
      <h1>{view==="students"?"Student register":view==="course-spaces"?"Dedicated course spaces":"Student communications"}<span className="mk-title-period">.</span></h1>
      <p>{view==="students"?"Each student receives one permanent student number across all programmes.":view==="course-spaces"?"Manage learning materials and announcements for each course separately.":"Email invitations and announcements are recorded before delivery."}</p>
    </div>
    <div className="mk-institute-strip">
      <span><strong>{data?.counts.students??"–"}</strong> students</span>
      <span><strong>{data?.counts.memberships??"–"}</strong> course enrolments</span>
      <span><strong>{data?.counts.courses??"–"}</strong> course spaces</span>
      <span><strong>{data?.counts.messagesQueued??"–"}</strong> preview emails</span>
      <button type="button" onClick={()=>void fetchData(showCodes)} disabled={pending}>Refresh</button>
    </div>
    <div className="mk-institute-note"><strong>LOCAL TEST DATA</strong> — Student records and email drafts remain on this laptop. No student email is sent unless a verified server-side mail provider is explicitly enabled.</div>
    {error&&<p className="mk-alert" role="alert">{error}</p>}
    {notice&&<p className="mk-success" role="status">{notice}</p>}
    {!data ? <div className="mk-panel">Loading institute data…</div> : view==="students" ? <div className="mk-student-columns">
      <div className="mk-panel mk-student-registry">
        <div className="mk-panel-heading"><div><span>STUDENT DIRECTORY</span><h2>Registered learners</h2></div><span className="mk-count-subtle">{registered.length} records</span></div>
        <label className="mk-search-label" htmlFor="student-search">SEARCH RECORDS</label>
        <input id="student-search" value={search} onChange={e=>setSearch(e.target.value)} type="search" placeholder="Student number, name or email" className="mk-institute-input"/>
        <div className="mk-table-scroll">
          <table className="mk-record-table"><thead><tr><th>Student no.</th><th>Full name</th><th>Programmes</th><th>Status</th></tr></thead>
          <tbody>{registered.length?registered.map(student=><tr key={student.studentNumber}>
            <td><strong>{student.studentNumber}</strong></td><td><span>{student.fullName}</span><small>{student.email}</small></td>
            <td>{data.memberships.filter(m=>m.studentNumber===student.studentNumber).length}</td>
            <td><span className="mk-record-status">{student.status}</span></td>
          </tr>):<tr><td colSpan={4}>No students registered yet.</td></tr>}</tbody></table>
        </div>
      </div>
      <div className="mk-panel mk-new-student">
        <div className="mk-panel-heading"><div><span>ADMISSIONS</span><h2>Register a student</h2></div></div>
        <p className="mk-institute-helper">A unique MTI student number is generated automatically. Welcome email enters the preview queue.</p>
        <form onSubmit={async e=>{e.preventDefault();if(await action({action:"registerStudent",fullName:name,email,courseId:Number(assignCourse)})){setName("");setEmail("");}}} className="mk-institute-form">
          <label>Full name<input className="mk-institute-input" required minLength={3} maxLength={160} value={name} onChange={e=>setName(e.target.value)} placeholder="Student's legal full name" /></label>
          <label>Email address<input className="mk-institute-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="student@example.com" /></label>
          <label>Initial programme<select required className="mk-institute-input" value={assignCourse} onChange={e=>setAssignCourse(e.target.value)}><option value="">Select programme</option>{courses.map(course=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <button type="submit" className="mk-primary" disabled={pending}>{pending?"Registering…":"Register student"}</button>
        </form>
        <div className="mk-institute-divider"/>
        <h3>Assign an existing student</h3>
        <form className="mk-institute-form" onSubmit={async e=>{e.preventDefault();if(await action({action:"enrolStudent",studentNumber:existingNumber,courseId:Number(assignCourse)}))setExistingNumber("");}}>
          <label>Student number<input className="mk-institute-input" value={existingNumber} onChange={e=>setExistingNumber(e.target.value)} required placeholder="MTI-2026-000001"/></label>
          <button className="mk-secondary" type="submit" disabled={pending||!assignCourse}>Add to selected programme</button>
        </form>
      </div>
    </div> : view==="course-spaces" ? <div className="mk-course-admin-grid">
      <aside className="mk-panel mk-course-selector"><div className="mk-panel-heading"><div><span>COURSE DIRECTORY</span><h2>Programmes</h2></div></div>
      {courses.map(c=><button key={c.id} className={"mk-course-pick "+(c.id===selectedId?"is-current":"")} onClick={()=>setSelectedId(c.id)} type="button"><strong>{c.title}</strong><small>{data.memberships.filter(m=>m.courseId===c.id).length} students · {data.modules.filter(m=>m.courseId===c.id).length} modules</small></button>)}
      </aside>
      <div className="mk-course-editor">
        {selected?<><div className="mk-panel mk-course-summary"><p className="mk-eyebrow">COURSE SPACE / {selected.slug.toUpperCase()}</p><h2>{selected.title}</h2><p>{selected.description}</p><div className="mk-course-summary-footer"><span>{selectedEnrolled} enrolled students</span><Link href={"/learn/course/"+selected.slug}>Student view →</Link></div></div>
        <div className="mk-panel"><div className="mk-panel-heading"><div><span>CURRICULUM</span><h2>Modules</h2></div><span className="mk-count-subtle">{data.modules.filter(m=>m.courseId===selected.id).length} modules</span></div>
        <div className="mk-institute-records">{data.modules.filter(m=>m.courseId===selected.id).map(m=><div key={m.id}><strong>{m.title}</strong><small>{m.published?"Published to students":"Draft"}</small></div>)}</div>
        <form className="mk-institute-form" onSubmit={async e=>{e.preventDefault();if(await action({action:"addModule",courseId:selected.id,title:moduleTitle,summary:moduleSummary,content:moduleContent,published:modulePublish})){setModuleTitle("");setModuleSummary("");setModuleContent("");setModulePublish(false);}}}>
          <label>Module title<input className="mk-institute-input" required minLength={2} maxLength={160} value={moduleTitle} onChange={e=>setModuleTitle(e.target.value)} placeholder="e.g. Introduction to Poultry Care"/></label>
          <label>Learning objective<input className="mk-institute-input" required value={moduleSummary} onChange={e=>setModuleSummary(e.target.value)} placeholder="What should learners know?"/></label>
          <label>Lesson content<textarea className="mk-institute-input" value={moduleContent} onChange={e=>setModuleContent(e.target.value)} rows={4} maxLength={15000} placeholder="Lesson text, steps and guidance"/></label>
          <label className="mk-institute-check"><input type="checkbox" checked={modulePublish} onChange={e=>setModulePublish(e.target.checked)}/> Publish to enrolled learners</label>
          <button className="mk-primary" type="submit" disabled={pending}>Add module</button>
        </form></div>
        <div className="mk-panel"><div className="mk-panel-heading"><div><span>COURSE UPDATES</span><h2>Announcements</h2></div></div>
        <div className="mk-institute-records">{data.announcements.filter(a=>a.courseId===selected.id).map(a=><div key={a.id}><strong>{a.title}</strong><small>{a.published?"Published — notification queued":"Unpublished draft"}</small></div>)}</div>
        <form className="mk-institute-form" onSubmit={async e=>{e.preventDefault();if(await action({action:"publishAnnouncement",courseId:selected.id,title:announcementTitle,body:announcementBody,published:announcementPublish})){setAnnouncementTitle("");setAnnouncementBody("");setAnnouncementPublish(false);}}}>
          <label>Announcement title<input className="mk-institute-input" required value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)} /></label>
          <label>Message<textarea className="mk-institute-input" required rows={4} value={announcementBody} onChange={e=>setAnnouncementBody(e.target.value)}/></label>
          <label className="mk-institute-check"><input type="checkbox" checked={announcementPublish} onChange={e=>setAnnouncementPublish(e.target.checked)}/> Publish to this course and queue email notifications</label>
          <button className="mk-primary" type="submit" disabled={pending}>Save announcement</button>
        </form></div>
        <div className="mk-panel"><div className="mk-panel-heading"><div><span>LEARNING MATERIALS</span><h2>Resources</h2></div></div>
        <div className="mk-institute-records">{data.resources.filter(r=>r.courseId===selected.id).map(r=><div key={r.id}><strong>{r.title}</strong><small>{r.published?"Visible to students":"Draft"}</small></div>)}</div>
        <form className="mk-institute-form" onSubmit={async e=>{e.preventDefault();if(await action({action:"addResource",courseId:selected.id,title:resourceTitle,url:resourceUrl,published:resourcePublish})){setResourceTitle("");setResourceUrl("");setResourcePublish(false);}}}>
          <label>Resource title<input className="mk-institute-input" required value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)}/></label>
          <label>Secure HTTPS link<input className="mk-institute-input" required value={resourceUrl} onChange={e=>setResourceUrl(e.target.value)} placeholder="https://..."/></label>
          <label className="mk-institute-check"><input type="checkbox" checked={resourcePublish} onChange={e=>setResourcePublish(e.target.checked)}/> Publish resource</label>
          <button className="mk-primary" type="submit" disabled={pending}>Add resource</button>
        </form></div>
        </>:<div className="mk-panel">Select a course to begin.</div>}
      </div>
    </div> : <div className="mk-panel mk-communication-panel">
      <div className="mk-panel-heading"><div><span>STUDENT CORRESPONDENCE</span><h2>Email notification outbox</h2></div></div>
      <p className="mk-institute-helper">Welcome messages, new-course confirmations and announcements are recorded here. Queued does not mean delivered.</p>
      <div className="mk-mail-state">Delivery provider: <strong>{data.emailDeliveryReady?"Configured":"Preview only — emails not sent"}</strong></div>
      <div className="mk-table-scroll"><table className="mk-record-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Type</th><th>Delivery</th></tr></thead><tbody>
        {data.outbox.length?data.outbox.map(m=><tr key={m.id}><td>{m.recipient}</td><td>{m.subject}</td><td>{m.kind}</td><td><span className="mk-record-status">{m.state}</span></td></tr>):<tr><td colSpan={4}>No messages queued.</td></tr>}
      </tbody></table></div>
      <div className="mk-institute-divider"/>
      <h3>Local student login test</h3><p className="mk-institute-helper">During localhost testing, an administrator can inspect one-time codes without sending real emails. This control is unavailable in production.</p>
      <button className="mk-secondary" type="button" onClick={async()=>{setShowCodes(x=>!x);if(!showCodes)await fetchData(true);}}>{showCodes?"Hide test codes":"Show local test sign-in codes"}</button>
      {showCodes&&<div className="mk-code-preview">{data.loginPreviews?.map(x=><div key={x.studentNumber+x.createdAt}><strong>{x.studentNumber}</strong><pre>{x.body}</pre></div>)||"No test sign-in codes."}</div>}
    </div>}
  </section>;
}
