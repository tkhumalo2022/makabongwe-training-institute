import Link from "next/link";
import { deliverySteps, services } from "./data";

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="pattern pattern-left" aria-hidden="true" />
        <div className="shell hero-grid">
          <div className="hero-copy reveal">
            <p className="ownership-badge"><span>✦</span> From Training to Business Ownership</p>
            <h1>Practical Agricultural Skills<span>.</span><br />Sustainable Enterprises<span>.</span><br />Stronger Communities<span>.</span></h1>
            <p className="hero-intro">Makabongwe equips individuals, farmers and communities with practical agricultural skills, enterprise support and structured mentorship—turning learning into productive livelihoods.</p>
            <div className="button-row">
              <Link href="/programmes" className="button">Explore our programmes <span>→</span></Link>
              <Link href="/partners" className="button button-outline">Partner with us <span>↗</span></Link>
            </div>
          </div>
          <div className="hero-visual reveal-late">
            <img src="/images/hero-agriculture.webp" alt="Agricultural trainees learning practical crop production with a mentor" />
            <div className="hero-tags" aria-label="Our core approach"><span>Practical skills</span><span>Enterprise support</span><span>Mentorship</span></div>
          </div>
        </div>
        <div className="shell stat-bar">
          <div><strong>100</strong><span>Beneficiary target<br />Flagship programme</span></div>
          <div><strong>10</strong><span>Day journey<br />Skills to action plan</span></div>
          <div><strong>07</strong><span>Delivery stages<br />Diagnose to measure</span></div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="shell split-heading">
          <div><p className="eyebrow dark"><span />What we do</p><h2>More than training.<br /><em>A pathway to production.</em></h2></div>
          <div><p>Makabongwe connects agricultural learning to practical production, business discipline, mentorship and measurable community impact. Funding partners gain a reliable implementation and reporting partner; beneficiaries gain a route from knowledge to action.</p><Link href="/about" className="text-link">Why Makabongwe <span>→</span></Link></div>
        </div>
      </section>

      <section className="section services-preview">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow dark"><span />Our service pillars</p><h2>Built for real agricultural outcomes.</h2></div><Link href="/services" className="button button-dark">View all services <span>→</span></Link></div>
          <div className="service-grid">
            {services.map((service) => (
              <Link className="service-card" href="/services" key={service.number}>
                <span className="card-number">{service.number}</span><h3>{service.title}</h3><p>{service.summary}</p><span className="card-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="feature-band">
        <div className="feature-image"><img src="/images/poultry-programme.webp" alt="Emerging poultry farmer working with a healthy flock" /></div>
        <div className="feature-copy">
          <p className="eyebrow"><span />Flagship programme</p>
          <h2>Azibuye Emasisweni</h2>
          <p className="feature-lead">A structured poultry enterprise-development programme for 100 unemployed youth and families.</p>
          <p>Five cohorts of 20 beneficiaries move through practical training, enterprise preparation, starter support and post-training mentorship.</p>
          <div className="mini-stats"><div><strong>5</strong><span>Cohorts</span></div><div><strong>20</strong><span>People each</span></div><div><strong>10</strong><span>Training days</span></div></div>
          <Link href="/programmes#azibuye" className="button">Explore the programme <span>→</span></Link>
        </div>
      </section>

      <section className="section journey-section">
        <div className="shell">
          <div className="split-heading"><div><p className="eyebrow dark"><span />How we deliver</p><h2>One accountable journey.<br /><em>Seven connected stages.</em></h2></div><p>Every engagement is shaped around the client, the beneficiary and the outcome—not a one-size-fits-all classroom schedule.</p></div>
          <div className="journey-grid">{deliverySteps.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="partner-cta">
        <div className="pattern pattern-right" aria-hidden="true" />
        <div className="shell partner-cta-grid">
          <div><p className="eyebrow"><span />Work with Makabongwe</p><h2>Let&apos;s build practical agricultural opportunity together.</h2></div>
          <div><p>We welcome municipalities, government departments, companies, CSI programmes, schools, NGOs, churches, cooperatives and development partners.</p><div className="button-row"><Link href="/contact#enquiry" className="button">Request a proposal <span>↗</span></Link><a className="button button-outline" href="tel:+27812148384">Call 081 214 8384</a></div></div>
        </div>
      </section>
    </main>
  );
}
