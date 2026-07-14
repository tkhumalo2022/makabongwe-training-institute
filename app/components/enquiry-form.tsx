"use client";

import { FormEvent, useState } from "react";

export function EnquiryForm() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Makabongwe enquiry: ${data.get("service")}`);
    const body = encodeURIComponent(
      `Name: ${data.get("name")}\nOrganisation: ${data.get("organisation")}\nPhone: ${data.get("phone")}\nEmail: ${data.get("email")}\nService: ${data.get("service")}\nLocation: ${data.get("location")}\nLearner numbers: ${data.get("learners")}\nPreferred date: ${data.get("date")}\n\nMessage:\n${data.get("message")}`
    );
    setSent(true);
    window.location.href = `mailto:hlakaniphanib@gmail.com?subject=${subject}&body=${body}`;
  }
  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Full name<input name="name" required placeholder="Your full name" /></label>
        <label>Organisation<input name="organisation" placeholder="Organisation or group" /></label>
        <label>Phone number<input name="phone" required type="tel" placeholder="e.g. 081 234 5678" /></label>
        <label>Email address<input name="email" required type="email" placeholder="you@example.org" /></label>
        <label>Service needed<select name="service" defaultValue=""><option value="" disabled>Select a service</option><option>Agricultural training</option><option>Poultry enterprise support</option><option>Food garden project</option><option>Youth or community programme</option><option>Enterprise mentorship</option><option>Programme implementation / consultancy</option><option>Partnership discussion</option></select></label>
        <label>Programme location<input name="location" placeholder="Town, municipality or site" /></label>
        <label>Estimated learners<input name="learners" type="number" min="1" placeholder="e.g. 20" /></label>
        <label>Preferred start date<input name="date" type="date" /></label>
      </div>
      <label>Tell us about the need<textarea name="message" required rows={5} placeholder="What outcome would you like the programme to achieve?" /></label>
      <button className="button" type="submit">Prepare email enquiry <span>↗</span></button>
      {sent && <p className="form-note" role="status">Your email app should open with the enquiry prepared. Please send it to complete your request.</p>}
    </form>
  );
}
