"use client";

import { useMemo, useState } from "react";
import styles from "./dashboard.module.css";

type Status = "New" | "Contacted" | "Planning" | "Confirmed";
type View = "Overview" | "Enquiries" | "Programmes";
type DemoEnquiry = {
  id: string;
  organisation: string;
  programme: string;
  area: string;
  learners: number;
  status: Status;
  received: string;
};

/** Entirely fictional showcase data. Never treat these records as applications or customers. */
const examples: DemoEnquiry[] = [
  { id: "DEMO-101", organisation: "Sample cooperative 01", programme: "Poultry Starter Workshop", area: "Richards Bay", learners: 18, status: "New", received: "04 Nov" },
  { id: "DEMO-102", organisation: "Sample school 02", programme: "School Food Garden Package", area: "Empangeni", learners: 32, status: "Contacted", received: "03 Nov" },
  { id: "DEMO-103", organisation: "Sample group 03", programme: "Broiler Business Bootcamp", area: "Esikhawini", learners: 15, status: "Planning", received: "02 Nov" },
  { id: "DEMO-104", organisation: "Sample cooperative 04", programme: "Farm & Cooperative Upskilling", area: "Mtubatuba", learners: 24, status: "Confirmed", received: "31 Oct" },
  { id: "DEMO-105", organisation: "Sample group 05", programme: "Poultry Starter Workshop", area: "Richards Bay", learners: 12, status: "New", received: "30 Oct" },
  { id: "DEMO-106", organisation: "Sample school 06", programme: "School Food Garden Package", area: "Hluhluwe", learners: 28, status: "Contacted", received: "28 Oct" },
  { id: "DEMO-107", organisation: "Sample group 07", programme: "Broiler Business Bootcamp", area: "Empangeni", learners: 16, status: "Planning", received: "27 Oct" },
  { id: "DEMO-108", organisation: "Sample cooperative 08", programme: "Farm & Cooperative Upskilling", area: "Esikhawini", learners: 20, status: "Confirmed", received: "24 Oct" },
  { id: "DEMO-109", organisation: "Sample group 09", programme: "Poultry Starter Workshop", area: "KwaMsane", learners: 14, status: "New", received: "23 Oct" },
  { id: "DEMO-110", organisation: "Sample group 10", programme: "Broiler Business Bootcamp", area: "Richards Bay", learners: 17, status: "Contacted", received: "22 Oct" },
];

const views: View[] = ["Overview", "Enquiries", "Programmes"];
const statuses: Array<"All" | Status> = ["All", "New", "Contacted", "Planning", "Confirmed"];

export default function AdminConceptPage() {
  const [view, setView] = useState<View>("Overview");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return examples.filter((item) =>
      (filter === "All" || item.status === filter) &&
      (!term || [item.id, item.organisation, item.programme, item.area]
        .some((value) => value.toLocaleLowerCase().includes(term)))
    );
  }, [filter, search]);

  const demand = useMemo(() => {
    const grouped = new Map<string, { requests: number; learners: number }>();
    examples.forEach((item) => {
      const current = grouped.get(item.programme) || { requests: 0, learners: 0 };
      grouped.set(item.programme, { requests: current.requests + 1, learners: current.learners + item.learners });
    });
    return [...grouped.entries()].map(([name, totals]) => ({ name, ...totals }))
      .sort((a, b) => b.learners - a.learners);
  }, []);
  const peakDemand = Math.max(1, ...demand.map((item) => item.learners));
  const newRequests = examples.filter((item) => item.status === "New").length;
  const estimatedLearners = examples.reduce((total, item) => total + item.learners, 0);

  const changeView = (next: View) => {
    setView(next);
    if (next === "Overview") { setFilter("All"); setSearch(""); }
  };

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Concept navigation">
        <div className={styles.wordmark}><span className={styles.brandMark}>M</span><span>MAKABONGWE<small>TRAINING INSTITUTE</small></span></div>
        <p className={styles.railLabel}>OPERATIONS</p>
        <nav className={styles.railNav} aria-label="Dashboard views">
          {views.map((item, index) => (
            <button key={item} type="button" aria-current={view === item ? "page" : undefined}
              className={view === item ? styles.activeNav : styles.navButton}
              onClick={() => changeView(item)}>
              <span className={styles.navIndex}>0{index + 1}</span>{item}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFoot}><span className={styles.dot} /> Design prototype<br /><small>No live learner or enquiry data</small></div>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>INSTITUTE OPERATIONS / DESIGN CONCEPT</p>
            <h1>Training, clearly managed<span>.</span></h1>
            <p className={styles.subtitle}>An intelligent home for enquiries, programmes and delivery planning.</p>
          </div>
          <span className={styles.demoPill}>SAMPLE DATA ONLY</span>
        </header>

        <div className={styles.disclaimer} role="note">
          <strong>Interface prototype.</strong> Every figure below is calculated from fictional example enquiries.
          This page is not an authenticated admin area and cannot read or change institute records.
        </div>

        <section aria-labelledby="snapshotTitle">
          <div className={styles.sectionIntro}><div><p className={styles.eyebrow}>THE BIG PICTURE</p><h2 id="snapshotTitle">Operations snapshot</h2></div><span>Illustrative data set</span></div>
          <div className={styles.kpis}>
            <article><span>Total enquiries</span><strong>{examples.length.toLocaleString("en-ZA")}</strong><small>Example requests received</small></article>
            <article><span>Awaiting first reply</span><strong>{newRequests.toLocaleString("en-ZA")}</strong><small>Sample enquiries marked new</small></article>
            <article><span>Potential learners</span><strong>{estimatedLearners.toLocaleString("en-ZA")}</strong><small>Sum of estimated group sizes</small></article>
            <article><span>Programme interests</span><strong>{demand.length}</strong><small>Different programme types</small></article>
          </div>
        </section>

        <div className={styles.contentGrid}>
          {view !== "Enquiries" && (
            <section className={styles.panel} aria-labelledby="demandTitle">
              <div className={styles.panelHeading}><div><p className={styles.eyebrow}>PROGRAMME INTEREST</p><h2 id="demandTitle">Learner demand</h2></div><span>Estimated learners</span></div>
              <div className={styles.programmeBars}>
                {demand.map((item) => (
                  <div className={styles.barRow} key={item.name}>
                    <div className={styles.barLabel}><strong>{item.name}</strong><span>{item.learners} learners · {item.requests} requests</span></div>
                    <div className={styles.track} role="img" aria-label={`${item.name}: ${item.learners} estimated learners`}>
                      <span style={{ width: `${(item.learners / peakDemand * 100).toFixed(1)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.panelNote}>Interest is not enrolment. Use actual enquiry records and signed registrations before reporting confirmed learners.</p>
            </section>
          )}

          {view !== "Enquiries" && (
            <section className={styles.panel} aria-labelledby="followupTitle">
              <div className={styles.panelHeading}><div><p className={styles.eyebrow}>PIPELINE</p><h2 id="followupTitle">Enquiry progress</h2></div></div>
              <div className={styles.statusStack}>
                {statuses.filter((item) => item !== "All").map((item) => {
                  const count = examples.filter((entry) => entry.status === item).length;
                  return <button type="button" key={item} className={styles.statusButton} onClick={() => { setFilter(item); setView("Enquiries"); }}>
                    <span className={styles.statusDot} /><span>{item}</span><strong>{count}</strong><span className={styles.viewCue}>View →</span>
                  </button>;
                })}
              </div>
              <p className={styles.panelNote}>Select a stage to open its matching sample enquiries.</p>
            </section>
          )}
        </div>

        {view !== "Programmes" && (
          <section className={styles.tablePanel} aria-labelledby="enquiriesTitle">
            <div className={styles.tableHead}>
              <div><p className={styles.eyebrow}>ENQUIRY DESK</p><h2 id="enquiriesTitle">{view === "Overview" ? "Recent enquiries" : "All example enquiries"}</h2><span>Fictional records for design and workflow testing</span></div>
              <button type="button" className={styles.moreButton} onClick={() => { setView("Enquiries"); setFilter("All"); setSearch(""); }}>Browse all enquiries</button>
            </div>
            {view === "Enquiries" && (
              <div className={styles.toolbar}>
                <label className={styles.searchLabel}>Search enquiries
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a programme, area or reference" />
                </label>
                <div className={styles.filterButtons} role="group" aria-label="Filter enquiry status">
                  {statuses.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
                </div>
              </div>
            )}
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr><th>Reference</th><th>Organisation</th><th>Programme</th><th>Area</th><th>Est. learners</th><th>Status</th></tr></thead>
                <tbody>
                  {(view === "Overview" ? filtered.slice(0, 5) : filtered).map((item) => (
                    <tr key={item.id}>
                      <td className={styles.reference}>{item.id}</td>
                      <td><strong>{item.organisation}</strong><small>Received {item.received}</small></td>
                      <td>{item.programme}</td><td>{item.area}</td><td className={styles.numeric}>{item.learners}</td>
                      <td><span className={styles.statusPill} data-status={item.status}>{item.status}</span></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className={styles.noMatches}>No sample enquiries match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <footer className={styles.footer}>MAKABONGWE TRAINING INSTITUTE <span>Concept 01 · Operations intelligence · Not connected to production</span></footer>
      </div>
    </main>
  );
}
