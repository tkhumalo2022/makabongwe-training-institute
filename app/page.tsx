import Link from "next/link";
import { deliverySteps, services } from "./data";

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="pattern pattern-left" aria-hidden="true" />
        <div className="shell hero-grid">
          <div className="hero-copy reveal">
            <p className="hero-kicker">Agricultural training that goes beyond the classroom</p>
            <h1>Learn the skill.<br /><em>Grow the future.</em></h1>
            <p className="hero-intro">We help young people, farmers and communities turn agricultural learning into something useful: food on the table, a stronger farm or a business of their own.</p>
            <div className="button-row">
              <Link href="/programmes" className="button">Explore our programmes <span>→</span></Link>
              <Link href="/contact#enquiry" className="button button-outline">Talk to our team <span>↗</span></Link>
            </div>
          </div>
          <div className="hero-visual reveal-late">
            <img src="/images/hero-agriculture.webp" alt="Agricultural trainees learning practical crop production with a mentor" />
            <p className="hero-caption"><span>Our approach</span> Learn by doing, build a plan, then keep moving with mentorship.</p>
          </div>
        </div>
        <div className="shell hero-grounding" aria-label="Makabongwe at a glance">
          <p><strong>Richards Bay, KwaZulu-Natal</strong><span>Locally rooted agricultural development</span></p>
          <p><strong>Training + application</strong><span>Practical learning connected to real production</span></p>
          <p><strong>Support after class</strong><span>Enterprise guidance, mentorship and monitoring</span></p>
        </div>
      </section>

      <section className="accreditation-strip" id="accreditation-partner" aria-labelledby="accreditation-title">
        <div className="shell accreditation-strip-grid">
          <Link className="partner-logo-card" href="/agriseta" aria-label="View Makabongwe's AgriSETA accreditation">
            <img src="/images/agriseta-logo.png" alt="AgriSETA logo" />
          </Link>
          <div>
            <p className="eyebrow dark"><span />Accredited agricultural learning</p>
            <h2 id="accreditation-title">Five qualifications. Accredited through June 2028.</h2>
          </div>
          <div className="accreditation-summary">
            <p>Our approved scope covers animal production, plant production, poultry production and horticulture. Each national certificate programme runs for 12 months.</p>
            <Link href="/agriseta" className="text-link">See our accreditation and courses <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="shell split-heading">
          <div><p className="eyebrow dark"><span />What we do</p><h2>People need more than a certificate.<br /><em>They need a way forward.</em></h2></div>
          <div><p>That is why our work does not stop when a class ends. We connect learning to production, business habits, mentorship and the practical next steps that help people keep going.</p><Link href="/about" className="text-link">Get to know Makabongwe <span>→</span></Link></div>
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
