import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getApplicationDetail } from "@/app/lib/admin-operations";
import { AdminShell } from "../../admin-shell";
import styles from "../../portal.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Application record | Makabongwe Staff",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

function row(label: string, value: string) {
  return (
    <div className={styles.detailRow} key={label}>
      <dt>{label}</dt>
      <dd>{value.replaceAll("_", " ") || "—"}</dd>
    </div>
  );
}

export default async function ApplicationRecordPage({ params }: Props) {
  // Authorize first; do not query or even reveal whether an application exists otherwise.
  const user = await requireAdmin("/admin/applications");
  const { id } = await params;
  const data = await getApplicationDetail(Boolean(user.demo), id);
  const application = data.application;

  return (
    <AdminShell
      user={user}
      active="applications"
      statusText={data.state === "live" ? "Staff access only" : data.state === "demo" ? "Demo record" : "Record unavailable"}
      statusTone={data.state === "unavailable" ? "warn" : data.state === "demo" ? "demo" : "ok"}
    >
      <div className={styles.heading}>
        <div>
          <p>Applications / Individual record</p>
          <h1>{application ? application.reference : "Application details"}</h1>
          <span>
            Protected admissions summary. Sensitive identity, birth date, address,
            emergency contacts and supporting documents are excluded.
          </span>
        </div>
      </div>

      {data.state === "demo" ? (
        <div className={styles.message}>
          <strong>Illustrative preview record</strong>
          No real learner contact details or financial records are displayed in this mode.
        </div>
      ) : null}

      {application ? (
        <div className={styles.detailGrid}>
          <section className={styles.detailBox} aria-labelledby="applicant-title">
            <h2 id="applicant-title">Applicant & programme</h2>
            <dl className={styles.details}>
              {row("Applicant", application.name)}
              {row("Programme", application.programme)}
              {row("Preferred intake", application.intake)}
              {row("Application status", application.status)}
              {row("Received", application.submittedAt)}
              {row("Last updated", application.updatedAt)}
            </dl>
          </section>

          <section className={styles.detailBox} aria-labelledby="follow-up-title">
            <h2 id="follow-up-title">Follow-up details</h2>
            <dl className={styles.details}>
              {row("Email", application.email || "Not provided")}
              {row("Phone", application.phone || "Not provided")}
              {row("Payment record status", application.paymentStatus)}
            </dl>
            <div className={styles.cardActions}>
              {data.state === "live" && application.email ? (
                <a className={styles.link} href={"mailto:" + encodeURIComponent(application.email)}>
                  Open email client
                </a>
              ) : null}
              {data.state === "live" && application.phone ? (
                <a className={styles.link} href={"tel:" + application.phone.replace(/[^\d+]/g, "")}>
                  Call applicant
                </a>
              ) : null}
            </div>
            <p className={styles.notice}>
              Application and payment states come from the institute database.
              A payment marked paid must be reconciled with verified provider records
              before it is treated as completed.
            </p>
          </section>
        </div>
      ) : (
        <div className={styles.message}>
          <strong>{data.state === "unavailable" ? "Private register unavailable" : "Application not found"}</strong>
          {data.state === "unavailable"
            ? "No applicant information was returned because the protected data connection is unavailable."
            : "The selected application does not exist or is unavailable in this workspace."}
        </div>
      )}

      <div className={styles.back}>
        <Link className={styles.link} href="/admin/applications">← Return to application register</Link>
      </div>
    </AdminShell>
  );
}
