import type { Metadata } from "next";
import { EnquiryForm } from "../components/enquiry-form";
import { PageHero } from "../components/page-hero";

export const metadata: Metadata = { title: "Contact", description: "Contact Makabongwe Training Institute in Richards Bay to request training, a programme proposal or a partnership discussion." };

export default function ContactPage() {
  return (
    <main>
      <PageHero eyebrow="Contact" title="Tell us what you want to grow." intro="Whether you need training for 20 learners, a food-garden package, poultry enterprise support or an institutional implementation partner, start the conversation here." action="Call us now" actionHref="tel:+27812148384" />
      <section className="section contact-section" id="enquiry">
        <div className="shell contact-grid">
          <div className="contact-details"><p className="eyebrow dark"><span />Makabongwe Project (Pty) Ltd</p><h2>Let&apos;s build practical opportunity together.</h2><div className="contact-list"><article><span>Phone</span><a href="tel:+27812148384">+27 81 214 8384</a></article><article><span>Email</span><a href="mailto:makabongweprojectsptyd@gmail.com">makabongweprojectsptyd@gmail.com</a></article><article><span>Address</span><p>12A Chat Crescent<br />Birdswood, Richards Bay, 3900</p></article><article><span>Contact person</span><p>Mr H.P. Buthelezi<br />Owner & Managing Director</p></article></div><p className="response-note">Training can be delivered at Makabongwe facilities, partner venues, schools, farms, community halls, municipal sites or client premises, subject to suitability and safety assessment.</p></div>
          <div><div className="form-heading"><span>Programme enquiry</span><h2>Help us understand the need.</h2><p>Complete the details below. Your email app will open with a structured enquiry ready to send.</p></div><EnquiryForm /></div>
        </div>
      </section>
    </main>
  );
}