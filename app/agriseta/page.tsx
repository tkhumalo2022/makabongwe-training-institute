import type { Metadata } from "next";
import Link from "next/link";
import { accreditedQualifications } from "../data";

export const metadata: Metadata = {
  title: "AgriSETA Accreditation",
  description:
    "View Makabongwe Projects' AgriSETA accreditation and five accredited 12-month agricultural qualifications, valid through 30 June 2028.",
};

export default function AgriSetaPage() {
  return (
    <main>
      <section className="agriseta-hero">
        <div className="pattern pattern-right" aria-hidden="true" />
        <div className="shell agriseta-hero-grid">
          <div className="agriseta-hero-copy">
            <p className="eyebrow"><span />AgriSETA accreditation</p>
            <h1>Five agricultural qualifications. <em>Accredited through 2028.</em></h1>
            <p>Makabongwe Projects is accredited by the AgriSETA ETQA as an agricultural education and training provider. Our current approved scope includes five 12-month national certificate qualifications.</p>
            <div className="button-row">
              <a className="button" href="#qualifications">View the qualifications <span>↓</span></a>
              <a className="button button-outline" href="https://www.agriseta.co.za/" target="_blank" rel="noreferrer">Visit AgriSETA <span>↗</span></a>
            </div>
          </div>
          <aside className="accreditation-document" aria-label="Accreditation details">
            <div className="accreditation-document-logo"><img src="/images/agriseta-logo.png" alt="AgriSETA logo" /></div>
            <p className="document-label">Provider accreditation</p>
            <dl>
              <div><dt>Provider</dt><dd>Makabongwe Projects</dd></div>
              <div><dt>Provider code</dt><dd>AGRI/c prov/2859/24</dd></div>
              <div><dt>ETQA ID</dt><dd>694</dd></div>
              <div><dt>Valid from</dt><dd>30 June 2026</dd></div>
              <div className="valid-until"><dt>Valid until</dt><dd>30 June 2028</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="section agriseta-qualifications" id="qualifications">
        <div className="shell">
          <header className="qualification-heading">
            <div><p className="eyebrow dark"><span />Approved programme scope</p><h2>The qualifications we are accredited to deliver.</h2></div>
            <p>Every programme below runs for 12 months. Intake dates, entry requirements, funding arrangements and delivery locations are confirmed before enrolment.</p>
          </header>

          <div className="qualification-ledger">
            {accreditedQualifications.map((qualification, index) => (
              <article key={qualification.code}>
                <span className="ledger-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="ledger-title"><small>SAQA ID {qualification.code}</small><h3>{qualification.title}</h3></div>
                <div className="ledger-facts"><span>{qualification.nqf}</span><span>{qualification.duration}</span></div>
                <Link className="round-link" href={`/contact?service=${encodeURIComponent(qualification.title)}#enquiry`} aria-label={`Enquire about ${qualification.title}`}>↗</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="accreditation-explained">
        <div className="shell accreditation-explained-grid">
          <div><p className="eyebrow"><span />What this means</p><h2>A current accreditation with a clear scope.</h2></div>
          <article><span>01</span><h3>Defined qualifications</h3><p>Accreditation applies to the five qualifications listed on this page. Short workshops and enterprise programmes are identified separately.</p></article>
          <article><span>02</span><h3>Quality requirements</h3><p>Accredited delivery follows applicable enrolment, facilitation, assessment, moderation and certification requirements.</p></article>
          <article><span>03</span><h3>Current validity</h3><p>The current provider accreditation period runs from 30 June 2026 through 30 June 2028.</p></article>
        </div>
      </section>

      <section className="section centre-cta">
        <div className="shell">
          <p className="eyebrow dark"><span />Programme enquiries</p>
          <h2>Ready to ask about an accredited intake?</h2>
          <p>Tell us which qualification interests you and whether you are enquiring for yourself, a group or a funded programme.</p>
          <Link href="/contact?service=AgriSETA%20accredited%20qualification#enquiry" className="button button-dark">Speak to Makabongwe <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
