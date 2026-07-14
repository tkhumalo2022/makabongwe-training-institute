"use client";

import { FormEvent, useRef, useState } from "react";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function EnquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState<FormState>({
    status: "idle",
    message: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState({ status: "loading", message: "Sending your enquiry..." });

    const data = new FormData(event.currentTarget);
    const sourcePage = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: data.get("fullName"),
          organisation: data.get("organisation"),
          phone: data.get("phone"),
          email: data.get("email"),
          serviceProgramme: data.get("serviceProgramme"),
          programmeLocation: data.get("programmeLocation"),
          estimatedLearners: data.get("estimatedLearners"),
          preferredStartDate: data.get("preferredStartDate"),
          message: data.get("message"),
          companyWebsite: data.get("companyWebsite"),
          sourcePage,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        setFormState({
          status: "error",
          message:
            result.message ||
            "Your enquiry could not be sent. Please check the details and try again.",
        });
        return;
      }

      formRef.current?.reset();
      setFormState({
        status: "success",
        message:
          result.message ||
          "Your enquiry has been sent. Makabongwe will follow up with you.",
      });
    } catch {
      setFormState({
        status: "error",
        message:
          "Your enquiry could not be sent. Please check your connection and try again.",
      });
    }
  }

  const isSending = formState.status === "loading";

  return (
    <form
      ref={formRef}
      className="enquiry-form"
      onSubmit={submit}
      aria-busy={isSending}
    >
      <div className="form-grid">
        <label>
          Full name
          <input
            name="fullName"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Your full name"
          />
        </label>
        <label>
          Organisation
          <input
            name="organisation"
            maxLength={160}
            placeholder="Organisation or group"
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            required
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="e.g. 081 234 5678"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.org"
          />
        </label>
        <label>
          Service needed
          <select name="serviceProgramme" required defaultValue="">
            <option value="" disabled>
              Select a service
            </option>
            <option>Agricultural training</option>
            <option>Poultry enterprise support</option>
            <option>Food garden project</option>
            <option>Youth or community programme</option>
            <option>Enterprise mentorship</option>
            <option>Programme implementation / consultancy</option>
            <option>Partnership discussion</option>
          </select>
        </label>
        <label>
          Programme location
          <input
            name="programmeLocation"
            maxLength={160}
            placeholder="Town, municipality or site"
          />
        </label>
        <label>
          Estimated learners
          <input
            name="estimatedLearners"
            type="number"
            min="1"
            max="100000"
            placeholder="e.g. 20"
          />
        </label>
        <label>
          Preferred start date
          <input name="preferredStartDate" type="date" />
        </label>
      </div>
      <label>
        Tell us about the need
        <textarea
          name="message"
          required
          maxLength={2000}
          rows={5}
          placeholder="What outcome would you like the programme to achieve?"
        />
      </label>
      <label className="honeypot-field" aria-hidden="true">
        Company website
        <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="button" type="submit" disabled={isSending}>
        {isSending ? "Sending..." : "Send enquiry"} <span>↗</span>
      </button>
      {formState.message && (
        <p
          className={`form-note ${
            formState.status === "error" ? "form-note-error" : ""
          }`}
          role={formState.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {formState.message}
        </p>
      )}
    </form>
  );
}
