import Link from "next/link";

const nav = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Programmes", "/programmes"],
  ["Enrol Now", "/enrol"],
  ["AgriSETA", "/agriseta"],
  ["Partners", "/partners"],
  ["Contact", "/contact"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Makabongwe home">
          <span className="brand-logo-wrap">
            <img src="/images/makabongwe-logo.webp" alt="" className="brand-logo" />
          </span>
          <span className="brand-name">
            <strong>MAKABONGWE</strong>
            <small>Training Institute</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <Link href="/contact#enquiry" className="button button-small header-cta">Request a proposal <span>↗</span></Link>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span></span><span></span><span></span></summary>
          <nav>
            <Link href="/">Home</Link>
            {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <Link href="/contact#enquiry" className="button">Request a proposal</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
