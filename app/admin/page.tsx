import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getAdminDashboardData } from "@/app/lib/admin-dashboard";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin | Makabongwe Training Institute",
  robots: { index: false, follow: false },
};

function displayCount(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-ZA");
}

function statusLabel(state: "demo" | "live" | "unavailable") {
  if (state === "demo") return "Demo data";
  if (state === "live") return "Live operations";
  return "Data unavailable";
}

function ActivityList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    meta: string;
    status: string;
    createdAt: string;
  }>;
}) {
  if (!items.length) {
    return (
      <p className={styles.empty}>
        No recent records are available in this view yet.
      </p>
    );
  }

  return (
    <div className={styles.activity}>
      {items.map((item) => (
        <div className={styles.activityRow} key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <span className={styles.activityMeta}>{item.meta}</span>
          </div>
          <div className={styles.activityRight}>
            <strong>{item.status}</strong>
            <span>{item.createdAt}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  const user = await requireAdmin("/admin");
  const dashboard = await getAdminDashboardData(Boolean(user.demo));

  const hiddenProgrammes =
    dashboard.programmes.published !== null &&
    dashboard.programmes.available !== null
      ? Math.max(
          0,
          dashboard.programmes.published - dashboard.programmes.available,
        )
      : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Makabongwe Admin</strong>
            <span>Training operations</span>
          </div>

          <nav className={styles.nav} aria-label="Admin sections">
            <a href="#overview">Overview</a>
            <a href="#enquiries">Enquiries</a>
            <a href="#enrolments">Enrolments</a>
            <a href="/admin/learners">Learner records</a>
            <a href="#programmes">Programmes</a>
            <a href="#compliance">Quality & records</a>
          </nav>

          <div className={styles.sidebarFooter}>
            <strong>Provider AGRI/c prov/2859/24</strong>
            AgriSETA accreditation published as valid through 30 June 2028.
          </div>
        </aside>

        <div className={styles.main}>
          <div className={styles.topbar}>
            <div className={styles.userBlock}>
              <div className={styles.userDot} aria-hidden="true">
                {user.demo ? "D" : "A"}
              </div>
              <div className={styles.userCopy}>
                <strong>{user.demo ? "Demo administrator" : "Administrator"}</strong>
                <span>{user.email}</span>
              </div>
            </div>

            <div className={styles.badges}>
              <span
                className={
                  dashboard.dataState === "unavailable"
                    ? styles.warnBadge
                    : user.demo
                      ? styles.demoBadge
                      : styles.badge
                }
              >
                {statusLabel(dashboard.dataState)}
              </span>
              <span className={styles.badge}>Secure session</span>
            </div>
          </div>

          <section className={styles.hero} id="overview">
            <div>
              <p className={styles.eyebrow}>Operations overview</p>
              <h1>Run the institute from one place.</h1>
              <p className={styles.heroText}>
                Follow enquiries, enrolments, payments, programme availability
                and the records that support accredited delivery. This dashboard
                is organised around the work Makabongwe staff actually need to
                do, not generic website analytics.
              </p>
            </div>

            <div className={styles.heroPanel}>
              <strong>
                {user.demo
                  ? "Safe preview mode"
                  : dashboard.dataState === "live"
                    ? "Private data connected"
                    : "Private data needs attention"}
              </strong>
              <p>
                {user.demo
                  ? "The numbers below are clearly-labelled preview data. This session never queries live learner, enquiry or payment records."
                  : dashboard.dataState === "live"
                    ? "Dashboard summaries are loaded server-side after admin authorization. Private records are not exposed to the browser directly."
                    : "The secure admin session works, but the private operational data connection is unavailable."}
              </p>
            </div>
          </section>

          <section className={styles.metrics} aria-label="Operations summary">
            <article className={styles.metric}>
              <p className={styles.metricLabel}>Programme enquiries</p>
              <p className={styles.metricValue}>
                {displayCount(dashboard.enquiries.total)}
              </p>
              <p className={styles.metricHint}>
                {displayCount(dashboard.enquiries.newCount)} waiting for first review
              </p>
            </article>

            <article className={styles.metric}>
              <p className={styles.metricLabel}>Enrolments</p>
              <p className={styles.metricValue}>
                {displayCount(dashboard.enrolments.total)}
              </p>
              <p className={styles.metricHint}>
                {displayCount(dashboard.enrolments.reviewCount)} submitted or under review
              </p>
            </article>

            <article className={styles.metric}>
              <p className={styles.metricLabel}>Successful payments</p>
              <p className={styles.metricValue}>
                {displayCount(dashboard.payments.successful)}
              </p>
              <p className={styles.metricHint}>
                {displayCount(dashboard.payments.failed)} failed transactions to check
              </p>
            </article>

            <article className={styles.metric}>
              <p className={styles.metricLabel}>Open programmes</p>
              <p className={styles.metricValue}>
                {displayCount(dashboard.programmes.available)}
              </p>
              <p className={styles.metricHint}>
                {displayCount(dashboard.programmes.published)} published in the programme catalogue
              </p>
            </article>
          </section>

          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.eyebrow}>Priority</p>
                  <h2>Action queue</h2>
                  <p>What should get staff attention first.</p>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.queue}>
                  <div className={styles.queueItem}>
                    <div className={styles.queueNumber}>
                      {displayCount(dashboard.enquiries.newCount)}
                    </div>
                    <div className={styles.queueCopy}>
                      <strong>New enquiries need follow-up</strong>
                      <span>Contact prospects and move each enquiry through its status.</span>
                    </div>
                    <span className={styles.queueState}>Sales</span>
                  </div>

                  <div className={styles.queueItem}>
                    <div className={styles.queueNumber}>
                      {displayCount(dashboard.enrolments.reviewCount)}
                    </div>
                    <div className={styles.queueCopy}>
                      <strong>Applications need review</strong>
                      <span>Check learner details, intake fit and supporting information.</span>
                    </div>
                    <span className={styles.queueState}>Learners</span>
                  </div>

                  <div className={styles.queueItem}>
                    <div className={styles.queueNumber}>
                      {displayCount(dashboard.payments.failed)}
                    </div>
                    <div className={styles.queueCopy}>
                      <strong>Payment issues to investigate</strong>
                      <span>Review failed transactions without storing card information.</span>
                    </div>
                    <span className={styles.queueState}>Finance</span>
                  </div>

                  <div className={styles.queueItem}>
                    <div className={styles.queueNumber}>
                      {displayCount(hiddenProgrammes)}
                    </div>
                    <div className={styles.queueCopy}>
                      <strong>Published programmes not open for enrolment</strong>
                      <span>Confirm pricing, intake dates and availability before promoting them.</span>
                    </div>
                    <span className={styles.queueState}>Catalogue</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.card} id="compliance">
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.eyebrow}>Quality assurance</p>
                  <h2>Accreditation watch</h2>
                  <p>Keep the operational evidence behind accredited delivery organised.</p>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.compliance}>
                  <div className={styles.complianceBlock}>
                    <span>Current published validity</span>
                    <strong>30 June 2028</strong>
                  </div>

                  <div className={styles.checklist}>
                    <div className={styles.checkItem}>
                      <span className={styles.checkDot} />
                      Keep learner enrolment, attendance, assessment and moderation records current.
                    </div>
                    <div className={styles.checkItem}>
                      <span className={styles.checkDot} />
                      Restrict beneficiary documents and evidence to approved staff.
                    </div>
                    <div className={styles.checkItem}>
                      <span className={styles.checkDot} />
                      Track facilitator, assessor and moderator records for relevant delivery.
                    </div>
                    <div className={styles.checkItem}>
                      <span className={styles.checkDot} />
                      Keep programme evidence, issue logs and close-out reporting ready for monitoring.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className={styles.section} id="programmes">
            <p className={styles.sectionTitle}>What this admin needs to manage</p>

            <div className={styles.modules}>
              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>01 / SALES</span>
                  <span className={styles.badge}>Foundation live</span>
                </div>
                <h3>Enquiries & partner leads</h3>
                <p>
                  Review programme enquiries, organisations, learner estimates,
                  preferred dates and follow-up status. This should become the
                  lightweight CRM for public and institutional opportunities.
                </p>
              </article>

              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>02 / ADMISSIONS</span>
                  <span className={styles.badge}>Foundation live</span>
                </div>
                <h3>Enrolments & intakes</h3>
                <p>
                  Track applicants from submitted details through review,
                  acceptance or rejection, grouped by programme and intake.
                </p>
              </article>

              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>03 / LEARNERS</span>
                  <span className={styles.badge}>Foundation live</span>
                </div>
                <h3>Learner records & evidence</h3>
                <p>
                  Use the protected learner register as the source of truth, then add attendance,
                  assessments, moderation and controlled evidence access.
                </p>
              </article>

              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>04 / FINANCE</span>
                  <span className={styles.badge}>Foundation live</span>
                </div>
                <h3>Payments & registration</h3>
                <p>
                  Keep Paystack transaction status tied to enrolments, flag
                  failures for follow-up and avoid handling raw card details.
                </p>
              </article>

              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>05 / CONTENT</span>
                  <span className={styles.badge}>Foundation live</span>
                </div>
                <h3>Programmes & website content</h3>
                <p>
                  Manage programme publishing, intake availability, fees,
                  locations and the content already backed by Makabongwe&apos;s
                  private CMS tables.
                </p>
              </article>

              <article className={styles.module}>
                <div className={styles.moduleTop}>
                  <span className={styles.moduleIndex}>06 / IMPACT</span>
                  <span className={styles.demoBadge}>Build next</span>
                </div>
                <h3>Partner & impact reporting</h3>
                <p>
                  Track milestones, beneficiary reach, site visits, enterprise
                  activation and evidence for municipalities, funders, CSI
                  partners and programme close-out reports.
                </p>
              </article>
            </div>
          </section>

          <div className={styles.grid}>
            <section
              className={[styles.card, styles.section].join(" ")}
              id="enquiries"
            >
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.eyebrow}>Pipeline</p>
                  <h2>Recent enquiries</h2>
                  <p>
                    {user.demo
                      ? "Preview examples only — no live prospect data is shown."
                      : "Latest private programme enquiries."}
                  </p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ActivityList items={dashboard.enquiries.recent} />
              </div>
            </section>

            <section
              className={[styles.card, styles.section].join(" ")}
              id="enrolments"
            >
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.eyebrow}>Admissions</p>
                  <h2>Recent enrolments</h2>
                  <p>
                    {user.demo
                      ? "Preview examples only — no live learner data is shown."
                      : "Latest private learner applications."}
                  </p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <ActivityList items={dashboard.enrolments.recent} />
              </div>
            </section>
          </div>

          <div className={styles.footerActions}>
            <Link className={styles.linkButton} href="/" target="_blank">
              View public website
            </Link>
            <Link className={styles.linkButton} href="/programmes" target="_blank">
              View programmes
            </Link>
            <Link className={styles.linkButton} href="/contact" target="_blank">
              Test enquiry form
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className={styles.signOutButton} type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
