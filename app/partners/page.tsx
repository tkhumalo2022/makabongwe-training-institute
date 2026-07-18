import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { getDeliverySteps } from "../lib/cms";

export const metadata: Metadata = { title: "For Partners", description: "Partner with Makabongwe on practical agricultural training, food security, youth enterprise and community development programmes." };

const clients = [
  ["Municipalities", "Local economic development, youth opportunity, food security, poverty alleviation and cooperative support."],
  ["Government departments", "Agriculture, education, social development, youth and community initiatives."],
  ["SETAs & skills funders", "Accredited and workplace-linked skills programmes within approved scope."],
  ["Companies & CSI partners", "Community development, youth employment, supplier development and measurable local impact."],
  ["Schools, ECDs & churches", "Food gardens, youth skills, community poultry and practical awareness programmes."],
  ["NGOs & foundations", "Livelihood, nutrition, inclusion and enterprise programmes with reliable reporting."],
];

const kpis = ["Learner reach & inclusion", "Attendance & participation", "Completion & skills gain", "Enterprise activation", "Production & recordkeeping", "Income & food security", "3, 6 & 12-month sustainability", "Partner satisfaction"];

export default async function PartnersPage() {
  const deliverySteps = await getDeliverySteps();

  return (
    <main>
      <PageHero eyebrow="For partners" title="A practical delivery partner for measurable community impact." intro="Makabongwe designs, mobilises, delivers, mentors and reports—giving institutions one accountable pathway from programme idea to beneficiary outcome." action="Request a partnership meeting" />
      <section className="accreditation-partner-feature">
        <div className="shell partner-feature-grid">
          <Link className="partner-logo-card partner-logo-card-large" href="/agriseta" aria-label="View Makabongwe's AgriSETA accreditation"><img src="/images/agriseta-logo.png" alt="AgriSETA logo" /></Link>
          <div><p className="eyebrow"><span />Accreditation partner</p><h2>AgriSETA</h2><p>Makabongwe is accredited by the AgriSETA ETQA to deliver five 12-month national certificate programmes across animal production, plant production, poultry production and horticulture.</p></div>
          <div className="partner-feature-actions"><p>Provider code: <strong>AGRI/c prov/2859/24</strong><br />Accreditation valid: <strong>30 June 2026 - 30 June 2028</strong></p><Link href="/agriseta" className="button">View accreditation <span>→</span></Link></div>
        </div>
      </section>
      <section className="section clients-section" id="who-we-work-with"><div className="shell"><div className="section-heading"><div><p className="eyebrow dark"><span />Who we work with</p><h2>Programmes shaped around public and community priorities.</h2></div></div><div className="client-grid">{clients.map(([title, text], i) => <article key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="delivery-dark"><div className="shell"><div className="split-heading light-copy"><div><p className="eyebrow"><span />Delivery model</p><h2>From need to evidence.</h2></div><p>Our structured process keeps objectives, responsibilities, beneficiaries, logistics, practical activities and reporting connected from day one.</p></div><div className="delivery-track">{deliverySteps.map(([title, text], i) => <article key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="section partnership-model"><div className="shell partnership-grid"><div><p className="eyebrow dark"><span />Partnership model</p><h2>Clear roles. Shared outcomes.</h2><p className="lead">Every programme is stronger when responsibilities are agreed before mobilisation.</p></div><div className="role-list"><article><h3>Makabongwe</h3><p>Design, training, learner support, technical guidance, mentorship, monitoring and reporting.</p></article><article><h3>Funding partner</h3><p>Funding, strategic oversight, beneficiary criteria and impact expectations.</p></article><article><h3>Community or municipality</h3><p>Local mobilisation, venues, verification, infrastructure support and coordination.</p></article><article><h3>Suppliers & markets</h3><p>Quality inputs, equipment, specialist support, market information and buying pathways where available.</p></article></div></div></section>
      <section className="impact-band"><div className="shell impact-grid"><div><p className="eyebrow"><span />Monitoring & evaluation</p><h2>Impact that can be seen, tracked and reported.</h2><p>We track practical progress through learner evidence, assessments, production records, site visits, case studies and milestone reports.</p></div><div className="kpi-cloud">{kpis.map(kpi => <span key={kpi}>{kpi}</span>)}</div></div></section>
      <section className="section centre-cta"><div className="shell"><p className="eyebrow dark"><span />Build with us</p><h2>Have a community, youth, food-security or enterprise objective?</h2><p>Let&apos;s shape a credible programme around the people, place, budget and outcomes.</p><Link href="/contact#enquiry" className="button button-dark">Request a tailored proposal <span>↗</span></Link></div></section>
    </main>
  );
}
