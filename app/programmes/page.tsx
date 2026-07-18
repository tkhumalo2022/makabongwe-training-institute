import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import {
  getAccreditedQualifications,
  getProgrammes,
  getTrainingDays,
} from "../lib/cms";

export const metadata: Metadata = { title: "Programmes", description: "Explore Azibuye Emasisweni and Makabongwe's packaged poultry, food garden and agricultural upskilling programmes." };

export default async function ProgrammesPage() {
  const [accreditedQualifications, programmes, trainingDays] =
    await Promise.all([
      getAccreditedQualifications(),
      getProgrammes(),
      getTrainingDays(),
    ]);

  return (
    <main>
      <PageHero eyebrow="Programmes" title="From practical workshops to 12-month qualifications." intro="AgriSETA-accredited national certificates, focused practical programmes and enterprise pathways that connect agricultural learning to productive outcomes." action="Book a programme discussion" />

      <section className="section accredited-programmes" id="accredited-programmes">
        <div className="shell">
          <div className="accreditation-profile">
            <div className="accreditation-profile-logo"><img src="/images/agriseta-logo.png" alt="AgriSETA logo" /></div>
            <div><p className="eyebrow dark"><span />Accredited 12-month programmes</p><h2>Five recognised agricultural qualifications.</h2><p>Makabongwe Projects is accredited by the AgriSETA ETQA as an agricultural education and training provider. These national certificate programmes form part of the institute&apos;s approved accreditation scope.</p></div>
            <dl><div><dt>Provider code</dt><dd>AGRI/c prov/2859/24</dd></div><div><dt>ETQA ID</dt><dd>694</dd></div><div><dt>Accreditation period</dt><dd>30 June 2026 - 30 June 2028</dd></div><div><dt>Programme duration</dt><dd>12 months</dd></div></dl>
          </div>
          <div className="qualification-grid">
            {accreditedQualifications.map((qualification, index) => (
              <article className="qualification-card" key={qualification.code}>
                <div className="qualification-top"><span>{String(index + 1).padStart(2, "0")}</span><strong>{qualification.duration}</strong></div>
                <p>SAQA qualification {qualification.code}</p>
                <h3>{qualification.title}</h3>
                <div className="qualification-bottom"><span>{qualification.nqf}</span><Link href={`/enrol?course=${encodeURIComponent(qualification.code)}`}>Enrol Now ↗</Link></div>
              </article>
            ))}
          </div>
          <div className="scope-note"><strong>Important scope note</strong><p>Accredited qualifications follow applicable enrolment, facilitation, assessment, moderation and certification requirements. Admission, delivery dates and learner funding arrangements are confirmed per intake.</p></div>
        </div>
      </section>

      <section className="flagship-section" id="azibuye">
        <div className="shell flagship-grid">
          <div className="flagship-photo"><img src="/images/poultry-programme.webp" alt="Emerging poultry farmer in a clean small-scale poultry operation" /><span>Flagship programme / 2026</span></div>
          <div className="flagship-copy"><p className="eyebrow dark"><span />Azibuye Emasisweni</p><h2>100 youth and family poultry entrepreneurs.</h2><p className="lead">A programme for unemployed youth and families that moves participants from foundational learning to small-scale business ownership.</p><p>The model combines practical poultry production, housing, feeding, biosecurity, recordkeeping, budgeting, financial management and business planning with starter guidance and post-training mentorship.</p><dl className="programme-facts"><div><dt>Target</dt><dd>100 beneficiaries</dd></div><div><dt>Cohorts</dt><dd>5 groups of 20</dd></div><div><dt>Journey</dt><dd>10 training days</dd></div><div><dt>Support</dt><dd>Mentorship & monitoring</dd></div></dl><Link href="/contact?service=Azibuye%20Emasisweni#enquiry" className="button button-dark">Fund or host this programme <span>↗</span></Link></div>
        </div>
      </section>
      <section className="section curriculum-section">
        <div className="shell">
          <div className="split-heading"><div><p className="eyebrow dark"><span />Azibuye practical journey</p><h2>Ten days. Ten practical outcomes.</h2></div><p>This focused enterprise programme is separate from the accredited 12-month qualifications. Each day builds technical and business foundations for disciplined poultry action.</p></div>
          <div className="curriculum-grid">{trainingDays.map(([day, title, text]) => <article key={day}><span>Day {day}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>
      <section className="section packaged-programmes">
        <div className="shell"><div className="section-heading"><div><p className="eyebrow dark"><span />Other packaged programmes</p><h2>Ready to adapt to your context.</h2></div></div><div className="programme-list">{programmes.map(([title, text], i) => <article key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p><Link href={`/enrol?course=${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))}`}>Enrol Now ↗</Link></article>)}</div></div>
      </section>
      <section className="mentor-feature"><div className="shell"><img src="/images/mentorship.webp" alt="Agricultural mentor reviewing enterprise plans with young entrepreneurs" /><div><p className="eyebrow"><span />After the classroom</p><h2>Mentorship keeps momentum alive.</h2><p>Production monitoring, recordkeeping support, site visits and market-readiness guidance help participants apply their learning and respond to real challenges.</p><Link href="/services" className="text-link light">Explore enterprise support <span>→</span></Link></div></div></section>
    </main>
  );
}
