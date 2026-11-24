"use client";

import { AdminGreeting } from "./admin-greeting";

type Programme = {
  id:number; slug:string; title:string; description:string;department:string;available_intake:string|null;
  delivery_mode:string;location:string;image_url:string|null;sort_order:number;
  duration:string;price_cents:number;registration_fee_cents:number;
  is_published:boolean;is_available:boolean;
};
type AdminData={
  programmes:Programme[];mode:"local-preview"|"supabase"|"neon";enrolmentCount:number|null;
};
type Panel="overview"|"programmes"|"students"|"course-spaces"|"communications";
type Props={data:AdminData|null; onNew:()=>void;onEdit:(row:Programme)=>void;onNavigate:(tab:Panel)=>void};

export default function AdminOverview({data,onNew,onEdit,onNavigate}:Props){
  const programmes=data?.programmes||[];
  const published=programmes.filter(p=>p.is_published).length;
  const open=programmes.filter(p=>p.is_available).length;
  const unconfirmed=programmes.filter(p=>!p.available_intake).length;
  const formatRand=(value:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(value/100);
  return <section className="mk-section mk-institute-overview">
    <div className="mk-headline mk-greeting-headline"><AdminGreeting/></div>
    <div className="mk-institute-strip" aria-label="Programme register overview">
      <span><strong>{programmes.length}</strong> programmes</span>
      <span><strong>{published}</strong> visible in local preview</span>
      <span><strong>{open}</strong> enrolment open</span>
      <span><strong>{unconfirmed}</strong> intake dates to confirm</span>
      <button type="button" onClick={()=>onNavigate("programmes")}>View all programmes</button>
    </div>
    <div className="mk-overview-toolbar">
      <div><p className="mk-eyebrow">TRAINING OPERATIONS</p><h2>Programme readiness</h2><p>Current records, enrolment status and intake plans. Select a programme to make changes.</p></div>
      <button className="mk-primary" type="button" onClick={onNew}>+ New programme</button>
    </div>
    <div className="mk-panel mk-overview-table">
      <div className="mk-table-scroll">
        <table className="mk-record-table">
          <thead><tr><th>Programme</th><th>Intake</th><th>Publication</th><th>Enrolment</th><th>Fees</th><th>Manage</th></tr></thead>
          <tbody>
            {programmes.map(p=><tr key={p.id}>
              <td><strong>{p.title}</strong><small>{p.department} · {p.duration}</small></td>
              <td>{p.available_intake||<span className="mk-unconfirmed">To confirm</span>}</td>
              <td><span className={"mk-record-status "+(!p.is_published?"mk-status-draft":"")}>{p.is_published?"Published":"Draft"}</span></td>
              <td><span className={"mk-record-status "+(!p.is_available?"mk-status-draft":"")}>{p.is_available?"Open":"Closed"}</span></td>
              <td>{p.price_cents+p.registration_fee_cents>0?formatRand(p.price_cents+p.registration_fee_cents):"Not configured"}</td>
              <td><button className="mk-overview-link" type="button" onClick={()=>onEdit(p)}>Manage</button></td>
            </tr>)}
            {programmes.length===0&&<tr><td colSpan={6}>No programmes have been added to this environment.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <div className="mk-overview-workflow">
      <div className="mk-panel"><p className="mk-eyebrow">NEXT STEPS</p><h2>Prepare for delivery</h2>
        <p>{unconfirmed>0?unconfirmed+" programme"+(unconfirmed===1?" has":"s have")+" no confirmed intake value yet.":"All programme intake values have been recorded."}</p>
        <button type="button" className="mk-overview-link" onClick={()=>onNavigate("programmes")}>Review intake settings</button>
      </div>
      <div className="mk-panel"><p className="mk-eyebrow">LEARNER ADMINISTRATION</p><h2>Start the student register</h2>
        <p>Assign students a permanent number, then place them in one or more dedicated course spaces.</p>
        <button type="button" className="mk-overview-link" onClick={()=>onNavigate("students")}>Open student register</button>
      </div>
      <div className="mk-panel"><p className="mk-eyebrow">COURSE CONTENT</p><h2>Prepare the learning spaces</h2>
        <p>Publish course modules, resources and notices when trainers have verified the learning content.</p>
        <button type="button" className="mk-overview-link" onClick={()=>onNavigate("course-spaces")}>Manage course spaces</button>
      </div>
    </div>
  </section>;
}
