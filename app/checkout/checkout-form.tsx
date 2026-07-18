"use client";

import { FormEvent, useState } from "react";

type CheckoutFormProps = {
  programme: string;
  amount?: number;
};

export function CheckoutForm({ programme, amount }: CheckoutFormProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/payments/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programme,
        amount,
        applicantName: form.get("applicantName"),
        applicantEmail: form.get("applicantEmail"),
      }),
    });

    const result = (await response.json().catch(() => ({}))) as { error?: string; checkoutUrl?: string };

    if (response.ok && result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }

    setMessage(
      result.error ||
        "Online payment is not active yet. Your programme details are ready, but the payment provider must still be connected.",
    );
    setSubmitting(false);
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Full name
          <input name="applicantName" type="text" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          Email address
          <input name="applicantEmail" type="email" required maxLength={160} autoComplete="email" />
        </label>
        <label>
          Mobile number
          <input name="applicantPhone" type="tel" required maxLength={30} autoComplete="tel" />
        </label>
        <label>
          South African ID or passport number
          <input name="identityNumber" type="text" required maxLength={40} />
        </label>
      </div>

      <label>
        Notes for admissions
        <textarea name="notes" rows={5} maxLength={1000} placeholder="Funding arrangement, preferred intake or accessibility needs" />
      </label>

      <button className="button button-dark" type="submit" disabled={submitting || !amount}>
        {submitting ? "Preparing checkout…" : amount ? "Continue to secure payment" : "Await fee confirmation"}
      </button>

      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
