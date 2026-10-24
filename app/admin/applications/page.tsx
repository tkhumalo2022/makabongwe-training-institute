import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import {
  applicationFilter,
  getApplications,
  pageNumber,
  type ApplicationFilter,
} from "@/app/lib/admin-operations";
import { AdminShell } from "../admin-shell";
import styles from "../portal.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Applications | Makabongwe Staff",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

const filters: { value: ApplicationFilter; label: string }[] = [
  { value: "all", label: "All applications" },
  { value: "review", label: "Need review" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "accepted", label: "Accepted" },
  { value: "closed", label: "Closed" },
];

function labelStatus(value: string) {
  return value.replaceAll("_", " ");
}

function hrefFor(filter: ApplicationFilter, page = 1) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/admin/applications" + (query ? "?" + query : "");
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const user = await requireAdmin("/admin/applications");
  const query = await searchParams;
  const filter = applicationFilter(query.status);
  const page = pageNumber(query.page);
  const data = await getApplications(Boolean(user.demo), filter, page);
  const totalPages = data.total === null ? null : Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <AdminShell
      user={user}
      active="applications"
      statusText={data.state === "live" ? "Private register connected" : data.state === "demo" ? "Demo records only" : "Register unavailable"}
      statusTone={data.state === "unavailable" ? "warn" : data.state === "demo" ? "demo" : "ok"}
    >
      <div className={styles.heading}>
        <div>
          <p>Admissions / Applications</p>
          <h1>Course applications</h1>
          <span>Review new applications, intake choices and registration status without opening payment credentials or national ID records.</span>
        </div>
        <div className={styles.summary}>
          {data.total === null ? "Count unavailable" : data.total.toLocaleString("en-ZA") + " records in this view"}
        </div>
      </div>

      {data.state === "demo" ? (
        <div className={styles.message}>
          <strong>Preview-only applications</strong>
          These are sample records, not actual Makabongwe learner details or financial transactions.
        </div>
      ) : null}
      {data.state === "unavailable" ? (
        <div className={styles.message}>
          <strong>Private data connection unavailable</strong>
          Application details are hidden until the server-side database connection is configured. No records are publicly exposed.
        </div>
      ) : null}

      <nav className={styles.filters} aria-label="Filter applications">
        {filters.map((item) => (
          <Link
            key={item.value}
            className={styles.filter}
            href={hrefFor(item.value)}
            aria-current={filter === item.value ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className={styles.panel} aria-labelledby="application-list-title">
        <div className={styles.panelHeader}>
          <h2 id="application-list-title">Application register</h2>
          <span>Read-only staff access · Most recent first</span>
        </div>

        {data.rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Applicant / reference</th>
                  <th scope="col">Programme & intake</th>
                  <th scope="col">Application</th>
                  <th scope="col">Payment status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className={styles.primaryLabel}>{record.name}</span>
                      <span className={styles.subLabel}>{record.reference}</span>
                    </td>
                    <td>
                      <span className={styles.primaryLabel}>{record.programme}</span>
                      <span className={styles.subLabel}>{record.intake}</span>
                    </td>
                    <td><span className={styles.pill}>{labelStatus(record.status)}</span></td>
                    <td>{labelStatus(record.paymentStatus)}</td>
                    <td>{record.submittedAt}</td>
                    <td>
                      <Link className={styles.link} href={"/admin/applications/" + encodeURIComponent(record.id)}>
                        View record <span aria-hidden="true"> ↗</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>{data.state === "unavailable" ? "Register unavailable" : "No matching applications"}</h3>
            <p>
              {data.state === "unavailable"
                ? "The secure server could not load the application register."
                : "Once course applications are received, they will appear here with their registration and review status."}
            </p>
          </div>
        )}

        <div className={styles.pagination}>
          <span>Page {page}{totalPages !== null ? " of " + totalPages : ""}</span>
          <div className={styles.pageLinks}>
            {page > 1 ? <Link className={styles.link} href={hrefFor(filter, page - 1)}>Previous</Link> : null}
            {totalPages !== null && page < totalPages
              ? <Link className={styles.link} href={hrefFor(filter, page + 1)}>Next</Link>
              : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
