import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { programmes, trainingDays } from "../data";

export const metadata: Metadata = { title: "Programmes", description: "Explore Azibuye Emasisweni and Makabongwe's packaged poultry, food garden and agricultural upskilling programmes." };

export default function ProgrammesPage() {
  return (
    <main>
      <PageHero eyebrow="Programmes" title="Structured pathways from learning to ownership." intro="Practical programme models that combine technical skills, business discipline, starter support, mentorship and measurable outcomes." action="Book a programme discussion" />
      <section className="flagship-section" id="azibuye">
        <div className="shell flagship-grid">
          <div className="flagship-photo"><img src="/images/poultry-programme.webp" alt="Emerging poultry farmer in a clean small-scale poultry operation" /><span>Flagship programme / 2026</span></div>
          <div className="flagship-copy"><p className="eyebrow dark"><span />Azibuye Emasisweni</p><h2>100 youth and family poultry entrepreneurs.</h2><p className="lead">A programme for unemployed youth and families that moves participants from foundational learning to small-scale business ownership.</p><p>The model combines practical poultry production, housing, feeding, biosecurity, recordkeeping, budgeting, financial management and business planning with starter guidance and post-training mentorship.</p><dl className="programme-facts"><div><dt>Target</dt><dd>100 beneficiaries</dd></div><div><dt>Cohorts</dt><dd>5 groups of 20</dd></div><div><dt>Journey</dt><dd>10 training days</dd></div><div><dt>Support</dt><dd>Mentorship & monitoring</dd></div></dl><Link href="/contact?service=Azibuye%20Emasisweni#enquiry" className="button button-dark">Fund or host this programme <span>↗</span></Link></div>
        </div>
      </section>
      <section className="section curriculum-section">
        <div className="shell">
          <div className="split-heading"><div><p className="eyebrow dark"><span />The learning journey</p><h2>Ten days. Ten practical outcomes.</h2></div><p>Each day builds the technical and business foundations needed to move a poultry idea towards disciplined action.</p></div>
          <div className="curriculum-grid">{trainingDays.map(([day, title, text]) => <article key={day}><span>Day {day}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>
      <section className="section packaged-programmes">
        <div className="shell"><div className="section-heading"><div><p className="eyebrow dark"><span />Other packaged programmes</p><h2>Ready to adapt to your context.</h2></div></div><div className="programme-list">{programmes.map(([title, text], i) => <article key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p><Link href={`/contact?service=${encodeURIComponent(title)}#enquiry`}>Enquire ↗</Link></article>)}</div></div>
      </section>
      <section className="mentor-feature"><div className="shell"><img src="/images/mentorship.webp" alt="Agricultural mentor reviewing enterprise plans with young entrepreneurs" /><div><p className="eyebrow"><span />After the classroom</p><h2>Mentorship keeps momentum alive.</h2><p>Production monitoring, recordkeeping support, site visits and market-readiness guidance help participants apply their learning and respond to real challenges.</p><Link href="/services" className="text-link light">Explore enterprise support <span>→</span></Link></div></div></section>
    </main>
  );
}
