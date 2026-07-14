import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { values } from "../data";

export const metadata: Metadata = { title: "About Us", description: "Meet Makabongwe Training Institute, its leadership, purpose, values and approach to agricultural development." };

export default function AboutPage() {
  return (
    <main>
      <PageHero eyebrow="About Makabongwe" title="Learning that grows into livelihoods." intro="A Richards Bay–based agricultural skills and enterprise-development partner helping people move beyond attendance certificates towards productive farming, business ownership and sustainable livelihoods." />

      <section className="section">
        <div className="shell story-grid">
          <div className="story-mark"><span>Our purpose</span><strong>Training<br />→ Production<br />→ Enterprise</strong></div>
          <div className="prose-large"><p>Makabongwe Project (Pty) Ltd, trading as Makabongwe Training Institute, provides practical and accredited agricultural learning, poultry enterprise development, food-security programmes, business incubation, mentorship and full programme implementation.</p><p>We were built to solve a familiar gap: people often receive once-off training but remain without the systems, infrastructure, business skills, market guidance and follow-up needed to turn knowledge into sustainable income.</p><p>Our answer is an integrated model—practical learning, application, enterprise preparation, mentorship and evidence-based reporting.</p></div>
        </div>
      </section>

      <section className="mission-band">
        <div className="shell mission-grid">
          <article><span>01 / Vision</span><h2>To become a leading African agricultural skills and enterprise-development institute.</h2><p>Recognised for transforming practical training into sustainable livelihoods, food security and local economic growth.</p></article>
          <article><span>02 / Mission</span><h2>To equip people with practical, accredited and enterprise-focused skills.</h2><p>Supported by mentorship, partnerships and implementation systems that enable long-term success.</p></article>
        </div>
      </section>

      <section className="section values-section">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow dark"><span />What guides us</p><h2>Values made visible in delivery.</h2></div></div>
          <div className="values-grid">{values.map(([title, text], i) => <article key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="section leadership-section">
        <div className="shell leadership-grid">
          <div className="leader-card"><img src="/images/makabongwe-logo.webp" alt="Makabongwe Training Institute official logo" /><span>Owner & Managing Director</span><h2>Mr Hlakaniphani Pius Buthelezi</h2></div>
          <div className="leader-copy"><p className="eyebrow dark"><span />Leadership</p><h2>Educational depth. Programme discipline. Community focus.</h2><p>Mr H.P. Buthelezi brings more than 20 years of experience in education, programme coordination, learner support and stakeholder engagement. He holds a Master&apos;s degree in Educational Psychology and is pursuing a Doctor of Education at the University of Zululand.</p><p>This background strengthens Makabongwe&apos;s ability to design structured learning programmes, manage beneficiaries, coordinate public and community stakeholders, and maintain a strong focus on development and measurable outcomes.</p><p>Agricultural delivery is supported by suitably qualified facilitators, assessors, moderators, technical specialists, mentors and project personnel according to each programme and the institute&apos;s approved accreditation scope.</p></div>
        </div>
      </section>

      <section className="section quality-section">
        <div className="shell split-heading"><div><p className="eyebrow dark"><span />Quality & accreditation</p><h2>Credibility is built through clear scope and strong controls.</h2></div><div><p>Makabongwe publishes and delivers accredited learning only within its current approved scope. Accredited programmes are clearly distinguished from non-credit-bearing practical workshops.</p><ul className="check-list"><li>Registered facilitators, assessors and moderators where required</li><li>Learner enrolment, attendance, assessment and moderation records</li><li>Health, safety, accessibility and biosecurity controls</li><li>Secure beneficiary data and consent-based evidence collection</li><li>Programme files, issue logs and close-out reporting</li></ul><Link href="/contact#enquiry" className="text-link">Discuss a compliant programme <span>→</span></Link></div></div>
      </section>
    </main>
  );
}
