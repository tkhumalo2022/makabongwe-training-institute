import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <img src="/images/makabongwe-logo.webp" alt="Makabongwe Training Institute logo" />
          <p>Developing agricultural skills, enterprises and sustainable communities.</p>
          <Link className="footer-accreditation" href="/agriseta"><span>View our accreditation</span><img src="/images/agriseta-logo.png" alt="AgriSETA logo" /></Link>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/about">About us</Link><Link href="/services">Services</Link>
          <Link href="/programmes">Programmes</Link><Link href="/agriseta">AgriSETA accreditation</Link><Link href="/partners">For partners</Link>
        </div>
        <div>
          <h3>Get in touch</h3>
          <a href="tel:+27812148384">+27 81 214 8384</a>
          <a href="mailto:makabongweprojectsptyd@gmail.com">makabongweprojectsptyd@gmail.com</a>
          <p>12A Chat Crescent, Birdswood<br />Richards Bay, 3900</p>
        </div>
        <div>
          <h3>Start something</h3>
          <p>Tell us what your community, institution or enterprise needs.</p>
          <Link href="/contact#enquiry" className="text-link">Start an enquiry <span>→</span></Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <p>© 2026 Makabongwe Project (Pty) Ltd. All rights reserved.</p>
        <p>Practical skills. Sustainable enterprises.</p>
      </div>
    </footer>
  );
}