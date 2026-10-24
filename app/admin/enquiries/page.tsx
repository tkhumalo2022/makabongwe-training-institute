import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import {
  enquiryFilter, getEnquiries, pageNumber, type EnquiryFilter,
} from "@/app/lib/admin-operations";
import { AdminShell } from "../admin-shell";
import styles from "../portal.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiries | Makabongwe Staff",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

const filters: { value: EnquiryFilter; label: string }[] = [
  { value: "all", label: "All enquiries" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

function hrefFor(filter: EnquiryFilter, page = 1) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  return "/admin/enquiries" + (params.toString() ? "?" + params.toString() : "");
}

export default async function StaffEnquiriesPage({ searchParams }: Props) {
  const user = await requireAdmin("/admin/enquiries");
  const query = await searchParams;
  const filter = enquiryFilter(query.status);
  const page = pageNumber(query.page);
  const data = await getEnquiries(Boolean(user.demo), filter, page);
  const totalPages = data.total === null ? null : Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <AdminShell
      user={user}
      active="enquiries"
      statusText={data.state === "live" ? "Private enquiries connected" : data.state === "demo" ? "Demo enquiries" : "Enquiries unavailable"}
      statusTone={data.state === "unavailable" ? "warn" : data.state === "demo" ? "demo" : "ok"}
    >
      <div className={styles.heading}>
        <div>
          <p>Business development / Contact requests</p>
          <h1>Programme enquiries</h1>
          <span>Follow up genuine programme requests. Enquiries are not applications or confirmed enrolments.</span>
        </div>
        <div className={styles.summary}>
          {data.total === null ? "Count unavailable" : data.total.toLocaleString("en-ZA") + " enquiries in this view"}
        </div>
      </div>

      {data.state === "demo" ? (
        <div className={styles.message}>
          <strong>Sample enquiries, not real prospects</strong>
          This mode never queries live customer contact details.
        </div>
      ) : null}
      {data.state === "unavailable" ? (
        <div className={styles.message}>
          <strong>Secure connection unavailable</strong>
          Real enquiries will appear once the private server connection has been configured.
        </div>
      ) : null}

      <nav className={styles.filters} aria-label="Filter programme enquiries">
        {filters.map((option) => (
          <Link
            key={option.value}
            className={styles.filter}
            href={hrefFor(option.value)}
            aria-current={filter === option.value ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <section className={styles.cards} aria-label="Programme enquiry list">
        {data.rows.length ? data.rows.map((record) => (
          <article className={styles.card} key={record.id}>
            <div className={styles.cardHead}>
              <div>
                <h2>{record.programme}</h2>
                <div className={styles.cardMeta}>
                  <span>{record.name}</span>
                  {record.organisation ? <span>{record.organisation}</span> : null}
                  {record.location ? <span>{record.location}</span> : null}
                  <span>{record.submittedAt}</span>
                </div>
              </div>
              <span className={styles.pill}>{record.status.replaceAll("_", " ")}</span>
            </div>

            <p>{record.message}</p>
            <div className={styles.cardActions}>
              {data.state === "live" && record.email ? (
                <a className={styles.link} href={"mailto:" + encodeURIComponent(record.email)}>
                  Compose email
                </a>
              ) : null}
              {data.state === "live" && record.phone ? (
                <a className={styles.link} href={"tel:" + record.phone.replace(/[^\d+]/g, "")}>
                  Call enquirer
                </a>
              ) : null}
            </div>
          </article>
        )) : (
          <div className={styles.panel}>
            <div className={styles.empty}>
              <h3>{data.state === "unavailable" ? "Enquiries unavailable" : "No matching enquiries"}</h3>
              <p>When someone submits a programme request through the site, authorized staff can review it here.</p>
            </div>
          </div>
        )}
      </section>

      <div className={styles.pagination}>
        <span>Page {page}{totalPages !== null ? " of " + totalPages : ""}</span>
        <div className={styles.pageLinks}>
          {page > 1 ? <Link className={styles.link} href={hrefFor(filter, page - 1)}>Previous</Link> : null}
          {totalPages !== null && page < totalPages
            ? <Link className={styles.link} href={hrefFor(filter, page + 1)}>Next</Link>
            : null}
        </div>
      </div>

      <p className={styles.notice}>
        Contact links open the staff member&apos;s email or dialler. This portal does not
        automatically send any messages or change enquiry status.
      </p>
    </AdminShell>
  );
}
