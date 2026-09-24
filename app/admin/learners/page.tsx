import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getLearnerRecords } from "@/app/lib/admin-learners";
import { AdminShell } from "../admin-shell";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Learner records | Makabongwe Admin",
  robots: { index: false, follow: false },
};

function displayCount(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-ZA");
}

export default async function LearnerRecordsPage() {
  const user = await requireAdmin("/admin/learners");
  const data = await getLearnerRecords(Boolean(user.demo));

  const statusText =
    data.state === "demo"
      ? "Demo learner data"
      : data.state === "live"
        ? "Private register connected"
        : "Register unavailable";

  const statusTone =
    data.state === "unavailable" ? "warn" : data.state === "demo" ? "demo" : "ok";

  return (
    <AdminShell
      user={user}
      active="learners"
      statusText={statusText}
      statusTone={statusTone}
    >
      <section className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Learner management</p>
          <h1>Learner records.</h1>
          <p className={styles.pageLead}>
            One private register for enrolment status, programme placement and
            payment readiness. Attendance, assessment, moderation and evidence
            tracking are being added on top of this register instead of creating
            duplicate learner profiles.
          </p>
        </div>

        <div className={styles.privacyNote}>
          <strong>Privacy by default.</strong> This overview deliberately hides
          ID/passport numbers, addresses and other unnecessary personal details.
          Demo mode never queries the live learner register.
        </div>
      </section>

      <section className={styles.recordGrid} aria-label="Learner summary">
        <article className={styles.metric}>
          <p className={styles.metricLabel}>Learners in register</p>
          <p className={styles.metricValue}>{displayCount(data.total)}</p>
          <p className={styles.metricHint}>Across all Makabongwe course enrolments</p>
        </article>

        <article className={styles.metric}>
          <p className={styles.metricLabel}>Accepted</p>
          <p className={styles.metricValue}>{displayCount(data.accepted)}</p>
          <p className={styles.metricHint}>Ready for intake and delivery preparation</p>
        </article>

        <article className={styles.metric}>
          <p className={styles.metricLabel}>Needs review</p>
          <p className={styles.metricValue}>{displayCount(data.needsReview)}</p>
          <p className={styles.metricHint}>Submitted or currently under review</p>
        </article>

        <article className={styles.metric}>
          <p className={styles.metricLabel}>Payment issues</p>
          <p className={styles.metricValue}>{displayCount(data.paymentIssues)}</p>
          <p className={styles.metricHint}>Pending or failed payment status</p>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>Private register</p>
            <h2>Latest learner records</h2>
            <p>
              {user.demo
                ? "Preview records only. These are not real Makabongwe learners."
                : "Most recent learner enrolments from the protected master register."}
            </p>
          </div>
        </div>

        <div className={styles.cardBody}>
          {data.records.length ? (
            <div className={styles.recordTable}>
              <div className={styles.recordHeader}>
                <span>Learner</span>
                <span>Programme</span>
                <span>Intake</span>
                <span>Enrolment</span>
                <span>Payment</span>
              </div>

              {data.records.map((record) => (
                <div className={styles.recordRow} key={record.reference}>
                  <div className={styles.recordMain}>
                    <span className={styles.recordRef}>{record.reference}</span>
                    <span className={styles.recordName}>{record.name}</span>
                    <span className={styles.recordMeta}>Enrolled {record.enrolledAt}</span>
                  </div>
                  <span className={styles.recordMeta}>{record.course}</span>
                  <span className={styles.recordMeta}>{record.intake}</span>
                  <span className={styles.statusPill}>{record.enrolmentStatus}</span>
                  <span className={styles.statusPill}>{record.paymentStatus}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              Learner records could not be loaded. The secure admin page remains
              available, but the private register connection needs attention.
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Learner evidence system</p>
        <div className={styles.progressGrid}>
          <article className={styles.progressCard}>
            <span className={styles.stageTag}>Stage 01 · Live foundation</span>
            <strong>Master learner register</strong>
            <p>
              Reuses the existing enrolment source of truth, learner reference,
              programme, intake and payment status. No duplicate learner table.
            </p>
          </article>

          <article className={styles.progressCard}>
            <span className={styles.stageTag}>Stage 02 · Schema staged</span>
            <strong>Attendance & assessment</strong>
            <p>
              Session attendance, formative/summative/practical assessment,
              competency status, assessor details and moderation records.
            </p>
          </article>

          <article className={styles.progressCard}>
            <span className={styles.stageTag}>Stage 03 · Next</span>
            <strong>Evidence & certification</strong>
            <p>
              Private evidence metadata, controlled document access, moderation
              evidence and certification/achievement status for close-out.
            </p>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}
