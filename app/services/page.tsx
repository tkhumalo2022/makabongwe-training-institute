import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { getServices } from "../lib/cms";

export const metadata: Metadata = { title: "Services", description: "Explore Makabongwe's six agricultural training, enterprise and programme implementation service pillars." };

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <main>
      <PageHero eyebrow="Six integrated service pillars" title="Skills, enterprise and sustainable agriculture." intro="Flexible enough for individuals and community groups. Structured enough for municipalities, government departments, companies, funders and implementing partners." action="Request a tailored proposal" />
      <section className="section service-detail-list">
        <div className="shell">
          {services.map((service, i) => (
            <article className="service-detail" key={service.number}>
              <div className="service-index"><span>{service.number}</span><small>Service pillar</small></div>
              <div><h2>{service.title}</h2><p className="service-summary">{service.summary}</p></div>
              <ul>{service.items.map(item => <li key={item}>{item}</li>)}</ul>
              <Link href={`/contact?service=${encodeURIComponent(service.title)}#enquiry`} className="round-link" aria-label={`Enquire about ${service.title}`}>↗</Link>
              {i === 1 && <img className="service-inline-image" src="/images/poultry-programme.webp" alt="Small-scale poultry farmer applying practical flock management" />}
            </article>
          ))}
        </div>
      </section>
      <section className="accreditation-callout"><div className="shell"><span className="large-mark">A</span><div><p className="eyebrow"><span />Accredited and practical learning</p><h2>The right learning route, clearly defined.</h2></div><div><p>Accredited delivery is offered only within Makabongwe&apos;s approved scope and relevant enrolment, assessment, moderation and certification requirements. Short workshops are clearly identified as non-credit-bearing and may include certificates of attendance.</p><Link href="/contact#enquiry" className="text-link light">Confirm programme suitability <span>→</span></Link></div></div></section>
    </main>
  );
}
