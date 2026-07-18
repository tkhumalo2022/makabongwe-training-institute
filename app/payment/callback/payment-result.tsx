"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
type Result = {
  status: string;
  message?: string;
  reference?: string;
  applicantName?: string;
  courseTitle?: string;
  amount?: number;
};
/* eslint-disable react-hooks/set-state-in-effect */
export function PaymentResult() {
  const params = useSearchParams(),
    reference = params.get("reference") || params.get("trxref") || "",
    [result, setResult] = useState<Result | null>(null),
    [loading, setLoading] = useState(true);
  const verify = useCallback(
    async (retry = true) => {
      if (retry) setLoading(true);
      try {
        const r = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        setResult(await r.json());
      } catch {
        setResult({
          status: "failed",
          message: "We could not verify this payment.",
        });
      } finally {
        setLoading(false);
      }
    },
    [reference],
  );
  useEffect(() => {
    void verify(false);
  }, [verify]);
  if (loading)
    return (
      <div className="result-card">
        <span className="result-icon">⏳</span>
        <h1>Verifying your payment…</h1>
        <p>
          Please keep this page open while Paystack confirms your transaction.
        </p>
      </div>
    );
  if (result?.status === "success")
    return (
      <div className="result-card success">
        <span className="result-icon">✓</span>
        <p className="eyebrow dark">
          <span />
          Payment confirmed
        </p>
        <h1>Thank you, {result.applicantName}.</h1>
        <p>
          Your enrolment for <strong>{result.courseTitle}</strong> has been
          received.
        </p>
        <dl>
          <div>
            <dt>Reference</dt>
            <dd>{result.reference}</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd>
              {new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format((result.amount || 0) / 100)}
            </dd>
          </div>
        </dl>
        <h2>What happens next</h2>
        <p>
          Our team will review your enrolment and contact you with intake and
          onboarding information.
        </p>
        <Link href="/" className="button">
          Return to website
        </Link>
      </div>
    );
  const pending = result?.status === "pending";
  return (
    <div className="result-card">
      <span className="result-icon">{pending ? "…" : "!"}</span>
      <h1>
        {pending ? "Payment is still processing" : "Payment not confirmed"}
      </h1>
      <p>
        {result?.message ||
          "The transaction may have been cancelled or failed."}
      </p>
      <div className="panel-actions">
        <button className="button" onClick={() => void verify()}>
          Retry verification
        </button>
        <Link
          className="button button-outline"
          href={pending ? "/contact" : "/enrol"}
        >
          {pending ? "Contact support" : "Retry payment"}
        </Link>
      </div>
    </div>
  );
}
