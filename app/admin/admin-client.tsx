"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Programme = {
  id: number; slug: string; title: string; description: string;
  department: string; duration: string; delivery_mode: string; location: string;
  available_intake: string | null; image_url: string | null;
  price_cents: number; registration_fee_cents: number;
  sort_order: number; is_published: boolean; is_available: boolean;
};
type Data = {
  mode: "supabase" | "local-preview";
  programmes: Programme[]; enquiryCount: number | null;
  enrolmentCount: number | null; paymentCount: number | null;
};
type Draft = Omit<Programme, "id" | "price_cents" | "registration_fee_cents"> & {
  id?: number; price_rands: number; registration_fee_rands: number;
};
type Tab = "overview" | "programmes" | "enrolments" | "enquiries" | "settings";
const tabs: {id: Tab; title: string; short: string}[] = [
  {id: "overview", title: "Overview", short: "01"},
  {id: "programmes", title: "Programmes", short: "02"},
  {id: "enrolments", title: "Enrolments", short: "03"},
  {id: "enquiries", title: "Enquiries", short: "04"},
  {id: "settings", title: "Settings", short: "05"},
];
const blank: Draft = {
  slug: "", title: "", description: "", department: "Agricultural Training",
  duration: "To be confirmed", delivery_mode: "Contact learning", location: "To be confirmed",
  available_intake: null, image_url: null, price_rands: 0, registration_fee_rands: 0,
  sort_order: 10, is_published: false, is_available: false,
};

async function parse(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}


export default function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState<Tab>("overview");
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    const latest = await parse(await fetch("/api/admin/programmes", {cache:"no-store", credentials:"same-origin"})) as Data;
    setData(latest);
    return latest;
  }
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const response = await fetch("/api/admin/session", {cache:"no-store", credentials:"same-origin"});
        const status = await response.json();
        if (!live) return;
        setAuthenticated(status.authenticated === true);
        setConfigured(status.configured === true);
        if (status.authenticated) {
          const next = await parse(await fetch("/api/admin/programmes", {cache:"no-store", credentials:"same-origin"}));
          if (live) setData(next);
        }
      } catch {
        if (live) setError("Cannot connect to the local admin server.");
      } finally {if (live) setChecking(false);}
    })();
    return () => {live = false;};
  }, []);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      await parse(await fetch("/api/admin/session", {method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({password})}));
      setAuthenticated(true); setPassword(""); await reload();
    } catch(e) {setError(e instanceof Error ? e.message : "Sign-in failed.");}
    finally {setWorking(false);}
  }
  async function logout() {
    await fetch("/api/admin/session", {method:"DELETE", credentials:"same-origin"});
    setAuthenticated(false); setData(null); setDraft(null); setActive("overview");
  }
  const filtered = useMemo(() => (data?.programmes || []).filter(p =>
    (p.title + " " + p.department + " " + p.location).toLowerCase().includes(filter.toLowerCase())
  ), [data, filter]);
  const published = data?.programmes.filter(p => p.is_published).length || 0;
  const intakeOpen = data?.programmes.filter(p => p.is_available).length || 0;
  function edit(row: Programme) {
    setDraft({...row, price_rands: row.price_cents / 100, registration_fee_rands: row.registration_fee_cents / 100});
    setActive("programmes");setMessage("");setError("");
  }
  function startNew() {
    setDraft({...blank, sort_order: data?.programmes.length || 0});
    setActive("programmes");setMessage("");setError("");
  }
  function field<K extends keyof Draft>(name: K, value: Draft[K]) {
    setDraft(previous => previous ? {...previous, [name]: value} : previous);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    setWorking(true);setError("");setMessage("");
    try {
      const edited = draft.id !== undefined;
      const result = await parse(await fetch("/api/admin/programmes",{
        method:edited?"PATCH":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(draft),
      }));
      await reload();
      edit(result.programme as Programme);
      setMessage(edited ? "Programme changes saved." : "Programme added successfully.");
    } catch(e) {setError(e instanceof Error ? e.message : "Programme could not be saved.");}
    finally {setWorking(false);}
  }
  return (
    <main className="mk-admin">
      <div className="mk-ambient" aria-hidden="true"/>
      {checking ? <div className="mk-auth-wrap"><div className="mk-auth-card">Connecting to Makabongwe administration…</div></div> :
        !authenticated ? (
          <div className="mk-auth-wrap">
            <div className="mk-auth-intro"><div className="mk-mark">M<span>.</span></div><p className="mk-eyebrow">PRIVATE WORKSPACE · MAKABONGWE</p><h1>Your training operations, <em>in one place.</em></h1><p>Prepare programmes, confirm intakes, manage publication and keep your enrolment pathway organised.</p></div>
            <form className="mk-auth-card" onSubmit={login}>
              <p className="mk-eyebrow">ADMINISTRATION ACCESS</p><h2>Welcome back.</h2>
              <label htmlFor="admin-secret">Administrator password</label>
              <input id="admin-secret" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} placeholder="Enter your admin password"/>
              {!configured && <p className="mk-alert">Admin password has not been configured for this environment.</p>}
              {error && <p className="mk-alert" role="alert">{error}</p>}
              <button className="mk-primary" type="submit" disabled={working || !configured}>{working?"Signing in…":"Open dashboard"} <span aria-hidden="true">↗</span></button>
              <p className="mk-muted">Authorised staff only. This dashboard is not part of the public website.</p>
              <Link href="/">← Back to website</Link>
            </form>
          </div>
        ) : (
          <div className="mk-shell">
            <aside className="mk-sidebar">
              <div className="mk-brand"><div className="mk-mark">M<span>.</span></div><div><strong>Makabongwe</strong><small>ADMINISTRATION</small></div></div>
              <div className="mk-nav-label">WORKSPACE</div>
              <nav className="mk-nav" aria-label="Admin sections">
                {tabs.map(tab=><button key={tab.id} type="button" className={active===tab.id?"is-active":""} onClick={()=>{setActive(tab.id);setError("");setMessage("");}}>
                  <span className="mk-nav-number">{tab.short}</span>{tab.title}<span className="mk-arrow" aria-hidden="true">↗</span>
                </button>)}
              </nav>
              <div className="mk-sidebar-bottom"><p>Training institute<br/>Richards Bay, KZN</p><Link href="/programmes">Public programmes ↗</Link><button type="button" onClick={logout}>Sign out</button></div>
            </aside>
            <div className="mk-main">
              <header className="mk-header"><div><p className="mk-eyebrow">OPERATIONS / {active.toUpperCase()}</p><p className="mk-date">Makabongwe Projects (Pty) Ltd</p></div><div className="mk-header-status"><span className="mk-dot"/>{data?.mode==="local-preview"?"Local draft mode":"Supabase connected"}</div></header>
              {data?.mode==="local-preview" && <div className="mk-preview-note" role="note"><strong>LOCAL PREVIEW.</strong> Changes are saved on this laptop and appear on the localhost programmes page. Nothing changes on the live website or payment system.</div>}
              {error && <div className="mk-alert" role="alert">{error}</div>}
              {message && <div className="mk-success" role="status">{message}</div>}
              {active==="overview" && <section className="mk-section">
                <div className="mk-headline"><p className="mk-eyebrow">YOUR WORKSPACE</p><h1>Good morning, <em>let’s get organised.</em></h1><p>Everything that matters as Makabongwe prepares its next programmes.</p></div>
                <div className="mk-metrics">
                  <article><span>01 / PROGRAMMES</span><strong>{data?.programmes.length||0}</strong><p>On the programme register</p></article>
                  <article><span>02 / PUBLISHED</span><strong>{published}</strong><p>Visible on the website</p></article>
                  <article><span>03 / OPEN FOR ENROLMENT</span><strong>{intakeOpen}</strong><p>Available for applications</p></article>
                  <article><span>04 / ENROLMENTS</span><strong>{data?.enrolmentCount ?? "—"}</strong><p>{data?.mode==="supabase"?"Private learner records":"Connect Supabase to view"}</p></article>
                </div>
                <div className="mk-grid">
                  <div className="mk-panel"><div className="mk-panel-heading"><div><span>QUICK ACTIONS</span><h2>What needs attention?</h2></div></div><div className="mk-action-list">
                    <button type="button" onClick={startNew}>Create a new programme <span>↗</span></button>
                    <button type="button" onClick={()=>setActive("programmes")}>Review programmes and dates <span>↗</span></button>
                    <button type="button" onClick={()=>setActive("enrolments")}>Check enrolment readiness <span>↗</span></button>
                  </div></div>
                  <div className="mk-panel mk-panel-dark"><span>FROM DRAFT TO DELIVERY</span><h2>Prepare your next intake with confidence.</h2><p>Set the training location, duration, cost and intake details. Keep enrolment disabled until pricing and operations are confirmed.</p><button type="button" onClick={startNew}>Add programme <span>↗</span></button></div>
                </div>
                <div className="mk-panel mk-recent"><div className="mk-panel-heading"><div><span>PROGRAMME REGISTER</span><h2>Current programmes</h2></div><button type="button" onClick={()=>setActive("programmes")}>Manage all ↗</button></div>
                {(data?.programmes||[]).slice(0,5).map(p=><button className="mk-programme-row" type="button" onClick={()=>edit(p)} key={p.id}><span>{String(p.sort_order+1).padStart(2,"0")}</span><strong>{p.title}</strong><small>{p.is_published?"Published":"Draft"}</small><span aria-hidden="true">↗</span></button>)}
                </div>
              </section>}
              {active==="programmes" && <section className="mk-section">
                <div className="mk-headline mk-headline-row"><div><p className="mk-eyebrow">PROGRAMME MANAGEMENT</p><h1>Programmes <em>& intakes.</em></h1><p>Create, edit, publish and manage your training catalogue.</p></div><button className="mk-primary" type="button" onClick={startNew}>+ Add programme</button></div>
                <div className="mk-editor-layout">
                  <div className="mk-panel mk-list-panel"><label className="mk-search-label" htmlFor="search-programmes">SEARCH PROGRAMMES</label><input id="search-programmes" type="search" placeholder="Search name, location, department…" value={filter} onChange={e=>setFilter(e.target.value)}/>
                    <p className="mk-list-total">{filtered.length} programme{filtered.length===1?"":"s"}</p>
                    {filtered.map((p)=><button key={p.id} type="button" onClick={()=>edit(p)} className={"mk-list-item "+(draft?.id===p.id?"selected":"")}><strong>{p.title}</strong><span>{p.department} · {p.location}</span><small className={p.is_published?"published":""}>{p.is_published?"Published":"Draft"}{p.is_available?" · Enrolment open":""}</small></button>)}
                    {filtered.length===0 && <p className="mk-muted">No matching programmes.</p>}
                  </div>
                  <div className="mk-panel mk-editor">{draft ? <form onSubmit={save}>
                    <div className="mk-panel-heading"><div><span>{draft.id?"EDIT PROGRAMME":"NEW PROGRAMME"}</span><h2>{draft.id?"Edit programme details":"Create a programme"}</h2></div><button type="button" onClick={()=>setDraft(null)} aria-label="Close editor">✕</button></div>
                    <div className="mk-field-grid">
                      <label className="wide">Programme name<input required maxLength={160} minLength={2} value={draft.title} onChange={e=>field("title",e.target.value)} placeholder="e.g. Poultry Production Essentials"/></label>
                      <label className="wide">Programme description<textarea required minLength={10} maxLength={1000} rows={4} value={draft.description} onChange={e=>field("description",e.target.value)} placeholder="Explain what learners will gain"/></label>
                      <label>Department<input required value={draft.department} onChange={e=>field("department",e.target.value)} /></label>
                      <label>Duration<input required value={draft.duration} onChange={e=>field("duration",e.target.value)} placeholder="e.g. 10 training days"/></label>
                      <label>Delivery mode<select value={draft.delivery_mode} onChange={e=>field("delivery_mode",e.target.value)}><option>Contact learning</option><option>Hybrid</option><option>Online</option><option>On-site training</option></select></label>
                      <label>Location<input required value={draft.location} onChange={e=>field("location",e.target.value)} placeholder="e.g. Richards Bay"/></label>
                      <label className="wide">Intake or start date<input value={draft.available_intake||""} onChange={e=>field("available_intake",e.target.value||null)} placeholder="e.g. March 2027 — dates to be confirmed"/></label>
                      <label>Course price (R)<input type="number" min={0} step="0.01" value={draft.price_rands} onChange={e=>field("price_rands",Number(e.target.value))}/></label>
                      <label>Registration fee (R)<input type="number" min={0} step="0.01" value={draft.registration_fee_rands} onChange={e=>field("registration_fee_rands",Number(e.target.value))}/></label>
                      <label className="wide">URL slug<input value={draft.slug} onChange={e=>field("slug",e.target.value)} placeholder="Automatically generated from the title"/></label>
                      <label>Display order<input type="number" min={0} step={1} value={draft.sort_order} onChange={e=>field("sort_order",Number(e.target.value))}/></label>
                      <label>Image URL (optional)<input value={draft.image_url||""} onChange={e=>field("image_url",e.target.value||null)} placeholder="/images/poultry-programme.webp"/></label>
                    </div>
                    <div className="mk-toggle-list">
                      <label><span><strong>Published on website</strong><small>Show this programme on the public programmes page.</small></span><input type="checkbox" checked={draft.is_published} onChange={e=>{field("is_published",e.target.checked);if(!e.target.checked)field("is_available",false)}}/></label>
                      <label><span><strong>Open for enrolment</strong><small>Only after confirmed intake details and a payment amount are set.</small></span><input type="checkbox" checked={draft.is_available} onChange={e=>field("is_available",e.target.checked)} disabled={!draft.is_published || draft.price_rands+draft.registration_fee_rands<=0}/></label>
                    </div>
                    <div className="mk-editor-actions"><button className="mk-primary" type="submit" disabled={working}>{working?"Saving…":draft.id?"Save changes":"Create programme"} <span>↗</span></button><button className="mk-secondary" type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
                  </form> : <div className="mk-empty"><span>PROGRAMME EDITOR</span><h2>Choose a programme or create something new.</h2><p>Edit training details, decide what is published and plan future intake availability.</p><button className="mk-primary" type="button" onClick={startNew}>+ Create programme</button></div>}
                  </div>
                </div>
              </section>}
              {active==="enrolments" && <section className="mk-section"><div className="mk-headline"><p className="mk-eyebrow">LEARNER ADMINISTRATION</p><h1>Enrolments <em>& registers.</em></h1><p>Safeguard private learner records and prepare for the next cohort.</p></div><div className="mk-metrics"><article><span>RECORDED ENROLMENTS</span><strong>{data?.enrolmentCount??"—"}</strong><p>{data?.mode==="supabase"?"Live database count":"Requires Supabase connection"}</p></article><article><span>OPEN PROGRAMMES</span><strong>{intakeOpen}</strong><p>Configured for enrolment</p></article></div><div className="mk-panel mk-inform"><span>PRIVACY FIRST</span><h2>Learner data stays protected.</h2><p>Existing enrolments and course registers are stored in Supabase. This preview exposes aggregate counts only; private identification, payment details and student records are not copied to local draft files.</p><button type="button" onClick={()=>setActive("programmes")}>Review programme readiness ↗</button></div></section>}
              {active==="enquiries" && <section className="mk-section"><div className="mk-headline"><p className="mk-eyebrow">ENQUIRY TRACKING</p><h1>Incoming <em>opportunities.</em></h1><p>Track programme interest before committing to delivery dates.</p></div><div className="mk-metrics"><article><span>ENQUIRIES RECEIVED</span><strong>{data?.enquiryCount??"—"}</strong><p>{data?.mode==="supabase"?"Live database count":"Requires Supabase connection"}</p></article><article><span>PAYMENT RECORDS</span><strong>{data?.paymentCount??"—"}</strong><p>{data?.mode==="supabase"?"Live database count":"Requires Supabase connection"}</p></article></div><div className="mk-panel mk-inform"><span>SERVER-SIDE RECORDS</span><h2>No sensitive details in the browser until roles are set up.</h2><p>The website&apos;s existing enquiry and payment endpoints remain unchanged. Review individual records using authorised Supabase access, not a public API.</p><Link href="/contact">View public enquiry form ↗</Link></div></section>}
              {active==="settings" && <section className="mk-section"><div className="mk-headline"><p className="mk-eyebrow">ADMINISTRATION SETTINGS</p><h1>System <em>readiness.</em></h1></div><div className="mk-panel mk-settings"><h2>Current connection</h2><dl><div><dt>Environment</dt><dd>{data?.mode==="local-preview"?"Local draft / preview":"Supabase server connection"}</dd></div><div><dt>Administrator authentication</dt><dd>Protected session · HttpOnly cookie</dd></div><div><dt>Publishing</dt><dd>{data?.mode==="local-preview"?"Localhost only":"Supabase CMS"}</dd></div><div><dt>Payment settings</dt><dd>Existing payment routes unchanged</dd></div></dl><p>Live publishing needs the Supabase server configuration and an explicitly enabled admin mode. The repository contains no production keys.</p><button className="mk-secondary" type="button" onClick={logout}>Sign out safely</button></div></section>}
              <footer className="mk-footer">MAKABONGWE PROJECTS <span>Internal operations dashboard · {new Date().getFullYear()}</span></footer>
            </div>
          </div>
        )}
    </main>
  );
}
