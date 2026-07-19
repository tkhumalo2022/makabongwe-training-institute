"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Applicant, Course } from "../lib/payments";
const money = (c: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    c / 100,
  );
const empty: Applicant = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  idPassportNumber: "",
  address: "",
  qualification: "",
  preferredIntake: "",
  notes: "",
  acceptedPolicies: false,
};
export function EnrolmentFlow() {
  const [courses, setCourses] = useState<Course[]>([]),
    [selected, setSelected] = useState<Course | null>(null),
    [step, setStep] = useState(1),
    [search, setSearch] = useState(""),
    [department, setDepartment] = useState(""),
    [mode, setMode] = useState(""),
    [applicant, setApplicant] = useState<Applicant>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  useEffect(() => {
    fetch("/api/courses")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        setCourses(j.courses);
        const wanted = new URLSearchParams(location.search).get("course");
        if (wanted) {
          const matched = j.courses.find(
            (c: Course) => String(c.id) === wanted || c.slug === wanted,
          );
          if (
            matched?.isAvailable &&
            matched.priceCents + matched.registrationFeeCents > 0
          ) {
            setSelected(matched);
          }
        }
      })
      .catch((e) => setError(e.message || "Courses could not be loaded."))
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(
    () =>
      courses.filter(
        (c) =>
          (!search || c.title.toLowerCase().includes(search.toLowerCase())) &&
          (!department || c.department === department) &&
          (!mode || c.deliveryMode === mode),
      ),
    [courses, search, department, mode],
  );
  const depts = [...new Set(courses.map((c) => c.department))],
    modes = [...new Set(courses.map((c) => c.deliveryMode))];
  const update = (name: keyof Applicant, value: string | boolean) =>
    setApplicant((v) => ({ ...v, [name]: value }));
  async function pay() {
    if (submitted.current) return;
    setSubmitting(true);
    setError("");
    setErrors({});
    submitted.current = true;
    try {
      const r = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId: selected?.id, applicant }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErrors(j.errors || {});
        throw new Error(j.message || "Payment could not be started.");
      }
      location.assign(j.authorizationUrl);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Payment could not be started.",
      );
      submitted.current = false;
      setSubmitting(false);
    }
  }
  return (
    <section className="section enrol-section">
      <div className="shell enrol-shell">
        <ol className="progress" aria-label="Enrolment progress">
          {[
            "Select course",
            "Your details",
            "Review & pay",
            "Confirmation",
          ].map((x, i) => (
            <li
              key={x}
              className={
                step === i + 1 ? "current" : step > i + 1 ? "done" : ""
              }
            >
              <span>{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>
        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}
        {step === 1 && (
          <>
            <div className="course-tools">
              <label>
                Search courses
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Course name"
                />
              </label>
              <label>
                Department
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All departments</option>
                  {depts.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Delivery mode
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="">All modes</option>
                  {modes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            {loading ? (
              <p className="state-card">Loading available courses…</p>
            ) : filtered.length === 0 ? (
              <p className="state-card">No courses match your filters.</p>
            ) : (
              <div className="course-grid">
                {filtered.map((c) => (
                  <article
                    key={c.id}
                    className={`course-card ${selected?.id === c.id ? "selected" : ""}`}
                  >
                    <div className="course-image">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" />
                      ) : (
                        <span>Makabongwe Training Institute</span>
                      )}
                    </div>
                    <p className="course-dept">{c.department}</p>
                    <h2>{c.title}</h2>
                    <p>{c.description}</p>
                    <dl>
                      <div>
                        <dt>Duration</dt>
                        <dd>{c.duration}</dd>
                      </div>
                      <div>
                        <dt>Mode</dt>
                        <dd>{c.deliveryMode}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{c.location}</dd>
                      </div>
                      <div>
                        <dt>Availability</dt>
                        <dd>{c.availableIntake || "Available"}</dd>
                      </div>
                    </dl>
                    <strong className="course-price">
                      {c.priceCents + c.registrationFeeCents > 0
                        ? money(c.priceCents + c.registrationFeeCents)
                        : "Price to be confirmed"}
                    </strong>
                    <button
                      className="button button-dark"
                      disabled={
                        !c.isAvailable ||
                        c.priceCents + c.registrationFeeCents <= 0
                      }
                      onClick={() => setSelected(c)}
                      aria-pressed={selected?.id === c.id}
                    >
                      {!c.isAvailable ||
                      c.priceCents + c.registrationFeeCents <= 0
                        ? "Intake not yet open"
                        : selected?.id === c.id
                          ? "Selected"
                          : "Select Course"}
                    </button>
                  </article>
                ))}
              </div>
            )}
            {selected && (
              <aside className="checkout-summary">
                <div>
                  <small>Selected course</small>
                  <h2>{selected.title}</h2>
                  <button
                    className="text-button"
                    onClick={() => setSelected(null)}
                  >
                    Change course
                  </button>
                </div>
                <dl>
                  <div>
                    <dt>Course fee</dt>
                    <dd>{money(selected.priceCents)}</dd>
                  </div>
                  {selected.registrationFeeCents > 0 && (
                    <div>
                      <dt>Registration fee</dt>
                      <dd>{money(selected.registrationFeeCents)}</dd>
                    </div>
                  )}
                  <div className="total">
                    <dt>Total payable</dt>
                    <dd>
                      {money(
                        selected.priceCents + selected.registrationFeeCents,
                      )}
                    </dd>
                  </div>
                </dl>
                <button className="button" onClick={() => setStep(2)}>
                  Continue to your details <span>→</span>
                </button>
              </aside>
            )}
          </>
        )}
        {step === 2 && (
          <div className="enrol-panel">
            <h2>Your details</h2>
            <p>Fields marked * are required.</p>
            <div className="form-grid">
              {[
                ["firstName", "First name *"],
                ["lastName", "Last name *"],
                ["email", "Email address *", "email"],
                ["phone", "South African phone number *", "tel"],
                ["idPassportNumber", "ID / passport number *"],
                ["dateOfBirth", "Date of birth", "date"],
                ["address", "Physical address *"],
                ["qualification", "Highest qualification *"],
                ["preferredIntake", "Preferred start date / intake *"],
              ].map(([n, l, t]) => (
                <label key={n}>
                  {l}
                  <input
                    type={t || "text"}
                    value={String(applicant[n as keyof Applicant] || "")}
                    onChange={(e) =>
                      update(n as keyof Applicant, e.target.value)
                    }
                    aria-invalid={!!errors[n]}
                  />
                  {errors[n] && <span>{errors[n]}</span>}
                </label>
              ))}
              <label className="full">
                Optional notes
                <textarea
                  value={applicant.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </label>
            </div>
            <div className="panel-actions">
              <button
                className="button button-outline"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button className="button" onClick={() => setStep(3)}>
                Review enrolment →
              </button>
            </div>
          </div>
        )}
        {step === 3 && selected && (
          <div className="enrol-panel review">
            <h2>Review and pay</h2>
            <div className="review-grid">
              <div>
                <small>Applicant</small>
                <strong>
                  {applicant.firstName} {applicant.lastName}
                </strong>
                <span>{applicant.email}</span>
                <span>{applicant.phone}</span>
              </div>
              <div>
                <small>Course</small>
                <strong>{selected.title}</strong>
                <span>
                  {selected.deliveryMode} · {selected.location}
                </span>
                <strong className="review-total">
                  {money(selected.priceCents + selected.registrationFeeCents)}
                </strong>
              </div>
            </div>
            <label className="policy">
              <input
                type="checkbox"
                checked={applicant.acceptedPolicies}
                onChange={(e) => update("acceptedPolicies", e.target.checked)}
              />
              <span>
                I accept the terms, privacy notice and refund policy. *
              </span>
            </label>
            {errors.acceptedPolicies && (
              <p className="field-error">{errors.acceptedPolicies}</p>
            )}
            <p className="secure-notice">
              🔒 You will pay securely on Paystack. Makabongwe does not collect
              or store card details.
            </p>
            <div className="panel-actions">
              <button
                className="button button-outline"
                onClick={() => setStep(2)}
              >
                ← Edit details
              </button>
              <button className="button" disabled={submitting} onClick={pay}>
                {submitting
                  ? "Preparing secure payment…"
                  : `Pay ${money(selected.priceCents + selected.registrationFeeCents)} with Paystack`}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
