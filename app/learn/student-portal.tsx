"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Student={studentNumber:string;fullName:string;email:string};
type Course={id:number;slug:string;title:string;description:string};
type Module={id:string;title:string;summary:string;content:string;order:number};
type Announcement={id:string;title:string;body:string;createdAt:string};
type Resource={id:string;title:string;url:string};
type Me={student:Student;courseSpaces:Course[]};
type CourseSpace={student:Student;course:Course;modules:Module[];announcements:Announcement[];resources:Resource[]};
async function body(response:Response) {
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||"The portal is temporarily unavailable.");
  return result;
}
export default function StudentPortal({slug}:{slug?:string}){
  const [checking,setChecking]=useState(true);
  const [me,setMe]=useState<Me|null>(null);
  const [space,setSpace]=useState<CourseSpace|null>(null);
  const [stage,setStage]=useState<"identify"|"verify">("identify");
  const [number,setNumber]=useState("");
  const [email,setEmail]=useState("");
  const [otp,setOtp]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [info,setInfo]=useState("");
  const fetchMe=useCallback(async()=>{
    const response=await fetch("/api/learn/me",{cache:"no-store",credentials:"same-origin"});
    if(response.status===401){setMe(null);setSpace(null);return null;}
    const data=await body(response) as Me;
    setMe(data);return data;
  },[]);
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{const result=await fetchMe();if(result&&slug){
        const payload=await body(await fetch("/api/learn/course?slug="+encodeURIComponent(slug),{cache:"no-store",credentials:"same-origin"})) as CourseSpace;
        if(active)setSpace(payload);
      }}catch(e){if(active)setError(e instanceof Error?e.message:"Unable to load student account.");}
      finally{if(active)setChecking(false);}
    })();
    return()=>{active=false;};
  },[slug,fetchMe]);
  async function requestCode(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");setInfo("");
    try{
      const res=await body(await fetch("/api/learn/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"requestCode",studentNumber:number,email})}));
      setInfo(res.message||"Check your email for a one-time code.");
      setStage("verify");
    }catch(e){setError(e instanceof Error?e.message:"Unable to request a code.");}
    finally{setBusy(false);}
  }
  async function verifyCode(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      await body(await fetch("/api/learn/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"verifyCode",studentNumber:number,code:otp})}));
      await fetchMe();setOtp("");setInfo("");
      if(slug){
        const data=await body(await fetch("/api/learn/course?slug="+encodeURIComponent(slug),{cache:"no-store"})) as CourseSpace;
        setSpace(data);
      }
    }catch(e){setError(e instanceof Error?e.message:"Invalid or expired sign-in code.");}
    finally{setBusy(false);}
  }
  async function signOut(){
    await fetch("/api/learn/auth",{method:"DELETE"});
    setMe(null);setSpace(null);setStage("identify");setError("");setInfo("");
  }
  return <main className="mti-learner">
    <header className="mti-student-header">
      <Link className="mti-student-brand" href="/"><span><Image src="/images/makabongwe-logo.webp" alt="" width={42} height={42}/></span><span><strong>MAKABONGWE</strong><small>LEARNER PORTAL</small></span></Link>
      <div className="mti-student-header-actions"><span>Learning administration</span>{me?<button type="button" onClick={signOut}>Sign out</button>:<Link href="/">Main website</Link>}</div>
    </header>
    <div className="mti-student-wrap">
      <aside className="mti-student-intro">
        <p className="mti-student-kicker">MAKABONGWE TRAINING INSTITUTE</p>
        <h1>{me ? <>Your learning <em>starts here.</em></> : <>A dedicated place for <em>your learning.</em></>}</h1>
        <p>View your courses, learning material and official programme announcements in one secure workspace.</p>
        <div className="mti-student-rule"/>
        <div className="mti-student-inform"><strong>One student number.</strong><span>Keep the same student identity across every Makabongwe programme you enrol in.</span></div>
      </aside>
      <section className="mti-student-content">
        {checking?<div className="mti-student-panel">Checking your student session…</div>:
          !me?<div className="mti-student-panel mti-signin">
            <p className="mti-student-kicker">PRIVATE STUDENT ACCESS</p>
            <h2>{stage==="identify"?"Student sign in":"Verify your email"}</h2>
            <p className="mti-subtext">{stage==="identify"?"Enter your student number and registered email address.":"Use the six-digit verification code sent to your registered email."}</p>
            {error&&<div className="mti-student-error" role="alert">{error}</div>}
            {info&&<div className="mti-student-message" role="status">{info}</div>}
            {stage==="identify"?<form onSubmit={requestCode} className="mti-student-form">
              <label>Student number<input autoComplete="username" required value={number} onChange={e=>setNumber(e.target.value.toUpperCase())} placeholder="MTI-2026-000001" minLength={12} maxLength={32}/></label>
              <label>Registered email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="student@example.com"/></label>
              <button disabled={busy} className="mti-student-primary" type="submit">{busy?"Requesting code…":"Send verification code"}</button>
            </form>:<form onSubmit={verifyCode} className="mti-student-form">
              <label>One-time verification code<input type="text" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="6 digits"/></label>
              <button disabled={busy} className="mti-student-primary" type="submit">{busy?"Verifying…":"Open my courses"}</button>
              <button className="mti-student-text-button" type="button" onClick={()=>{setStage("identify");setError("");setInfo("");}}>Change student details</button>
            </form>}
            <div className="mti-student-footnote">Only registered students can access their courses. Codes expire after ten minutes.</div>
          </div>:<div className="mti-student-panel">
            <div className="mti-student-welcome"><p className="mti-student-kicker">SIGNED IN AS {me.student.studentNumber}</p><h2>Welcome back, {me.student.fullName}.</h2><p>{me.student.email}</p></div>
            {slug?space?<div className="mti-student-course">
              <div className="mti-student-breadcrumb"><Link href="/learn">My courses</Link><span>/</span><strong>{space.course.title}</strong></div>
              <p className="mti-student-kicker">COURSE WORKSPACE</p><h3>{space.course.title}</h3><p>{space.course.description}</p>
              <div className="mti-student-block"><h4>Learning modules</h4>{space.modules.length?space.modules.map((module,index)=><article key={module.id}><span>{String(index+1).padStart(2,"0")}</span><div><strong>{module.title}</strong><p>{module.summary}</p>{module.content&&<div className="mti-module-content">{module.content}</div>}</div></article>):<p className="mti-empty">Materials for this course are being prepared. Check back for updates.</p>}</div>
              <div className="mti-student-block"><h4>Course announcements</h4>{space.announcements.length?space.announcements.map(a=><article key={a.id}><span>NOTE</span><div><strong>{a.title}</strong><p>{a.body}</p></div></article>):<p className="mti-empty">No published announcements yet.</p>}</div>
              <div className="mti-student-block"><h4>Learning resources</h4>{space.resources.length?space.resources.map(r=><article key={r.id}><span>FILE</span><div><a target="_blank" rel="noopener noreferrer" href={r.url}>{r.title} ↗</a></div></article>):<p className="mti-empty">No learning resources published yet.</p>}</div>
            </div>:<div><p className="mti-student-error">You are not enrolled in this course or it is unavailable.</p><Link href="/learn">Return to my courses</Link></div>:
              <><div className="mti-student-breadcrumb">MY ENROLLED PROGRAMMES</div><div className="mti-student-course-list">
                {me.courseSpaces.length?me.courseSpaces.map((course,index)=><Link className="mti-course-tile" href={"/learn/course/"+course.slug} key={course.id}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{course.title}</h3><p>{course.description}</p></div><strong aria-hidden="true">↗</strong></Link>):<p className="mti-empty">No course enrolments have been assigned to this student account.</p>}
              </div></>}
          </div>}
      </section>
    </div>
    <footer className="mti-student-footer"><span>MAKABONGWE PROJECTS (PTY) LTD</span><span>Private learning space</span></footer>
  </main>;
}
