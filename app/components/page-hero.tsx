import Link from "next/link";

export function PageHero({ eyebrow, title, intro, action = "Start an enquiry", actionHref = "/contact#enquiry" }: { eyebrow: string; title: string; intro: string; action?: string; actionHref?: string }) {
  return (
    <section className="page-hero">
      <div className="pattern pattern-left" aria-hidden="true" />
      <div className="shell page-hero-grid">
        <div>
          <p className="eyebrow"><span />{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="page-hero-side">
          <p>{intro}</p>
          <Link href={actionHref} className="text-link light">{action} <span>↗</span></Link>
        </div>
      </div>
    </section>
  );
}
