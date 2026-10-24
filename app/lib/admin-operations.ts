import "server-only";
import { getSupabaseConfig, supabase } from "./payments";

/**
 * Read-only staff operations data. Every caller must use requireAdmin()
 * before this server-only module is called. No service credentials reach clients.
 */
export type PortalDataState = "demo" | "live" | "unavailable";
export type ApplicationFilter = "all" | "review" | "pending_payment" | "accepted" | "closed";
export type EnquiryFilter = "all" | "new" | "reviewed" | "contacted" | "closed";

export type ApplicationSummary = {
  id: string;
  reference: string;
  name: string;
  programme: string;
  intake: string;
  status: string;
  paymentStatus: string;
  submittedAt: string;
};

export type ApplicationDetail = ApplicationSummary & {
  email: string;
  phone: string;
  updatedAt: string;
};

export type EnquirySummary = {
  id: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  programme: string;
  location: string;
  message: string;
  status: string;
  submittedAt: string;
};

export type PortalList<T> = {
  state: PortalDataState;
  total: number | null;
  page: number;
  pageSize: number;
  rows: T[];
};

const PAGE_SIZE = 20;
const MAX_PAGE = 10000;

function clean(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function dateLabel(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Johannesburg",
  }).format(date);
}

function listUnavailable<T>(page: number): PortalList<T> {
  return { state: "unavailable", total: null, page, pageSize: PAGE_SIZE, rows: [] };
}

export function pageNumber(value: string | undefined): number {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, MAX_PAGE) : 1;
}

export function applicationFilter(value: string | undefined): ApplicationFilter {
  return (["all", "review", "pending_payment", "accepted", "closed"] as const)
    .find((status) => status === value) ?? "all";
}

export function enquiryFilter(value: string | undefined): EnquiryFilter {
  return (["all", "new", "reviewed", "contacted", "closed"] as const)
    .find((status) => status === value) ?? "all";
}

const demoApplications: ApplicationSummary[] = [
  {
    id: "demo-application-01",
    reference: "DEMO-APP-01",
    name: "Sample Applicant One",
    programme: "Poultry Starter Workshop",
    intake: "Sample November intake",
    status: "submitted",
    paymentStatus: "pending",
    submittedAt: "Sample record",
  },
  {
    id: "demo-application-02",
    reference: "DEMO-APP-02",
    name: "Sample Applicant Two",
    programme: "Plant Production",
    intake: "Sample December intake",
    status: "under_review",
    paymentStatus: "pending",
    submittedAt: "Sample record",
  },
];

const demoEnquiries: EnquirySummary[] = [
  {
    id: "demo-enquiry-01",
    name: "Sample Enquirer",
    organisation: "Example Cooperative",
    email: "",
    phone: "",
    programme: "Agricultural training enquiry",
    location: "Richards Bay",
    message: "Example message for the preview only. No actual customer has sent this.",
    status: "new",
    submittedAt: "Sample record",
  },
];

function filteredDemoApplications(filter: ApplicationFilter): ApplicationSummary[] {
  if (filter === "all") return demoApplications;
  if (filter === "review") {
    return demoApplications.filter((row) => ["submitted", "under_review"].includes(row.status));
  }
  if (filter === "closed") return [];
  return demoApplications.filter((row) => row.status === filter);
}

function mapApplication(row: Record<string, unknown>): ApplicationSummary {
  return {
    id: clean(row.enrolment_id, ""),
    reference: clean(row.student_reference, "Unassigned"),
    name: clean(row.full_name, "Unnamed applicant"),
    programme: clean(row.course_title, "Programme unavailable"),
    intake: clean(row.preferred_intake, "To be confirmed"),
    status: clean(row.enrolment_status, "unknown"),
    paymentStatus: clean(row.payment_status, "unknown"),
    submittedAt: dateLabel(row.enrolled_at),
  };
}

export async function getApplications(
  demo: boolean, filter: ApplicationFilter, page: number,
): Promise<PortalList<ApplicationSummary>> {
  if (demo) {
    const filtered = filteredDemoApplications(filter);
    return {
      state: "demo", total: filtered.length, page, pageSize: PAGE_SIZE,
      rows: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    };
  }

  const config = getSupabaseConfig();
  if (!config) return listUnavailable(page);

  const params = new URLSearchParams({
    select: "enrolment_id,student_reference,full_name,course_title,preferred_intake,enrolment_status,payment_status,enrolled_at",
    order: "enrolled_at.desc",
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
  });
  if (filter === "review") params.set("enrolment_status", "in.(submitted,under_review)");
  if (filter === "pending_payment") params.set("enrolment_status", "eq.pending_payment");
  if (filter === "accepted") params.set("enrolment_status", "eq.accepted");
  if (filter === "closed") params.set("enrolment_status", "in.(rejected,cancelled)");

  try {
    const response = await supabase(config, "all_enrolled_students?" + params.toString(), {
      headers: { prefer: "count=exact" },
    });
    if (!response.ok) throw new Error("Application register unavailable");
    const raw = (await response.json()) as Array<Record<string, unknown>>;
    const totalValue = response.headers.get("content-range")?.split("/")[1];
    const total = totalValue && totalValue !== "*" ? Number(totalValue) : null;
    return {
      state: "live", total: Number.isFinite(total) ? total : null,
      page, pageSize: PAGE_SIZE, rows: raw.map(mapApplication),
    };
  } catch {
    return listUnavailable(page);
  }
}

export async function getApplicationDetail(
  demo: boolean, id: string,
): Promise<{ state: PortalDataState; application: ApplicationDetail | null }> {
  if (demo) {
    const row = demoApplications.find((entry) => entry.id === id);
    return {
      state: "demo",
      application: row ? { ...row, email: "", phone: "", updatedAt: "Sample record" } : null,
    };
  }

  // Do not interpolate an arbitrary path segment into a privileged PostgREST query.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { state: "live", application: null };
  }

  const config = getSupabaseConfig();
  if (!config) return { state: "unavailable", application: null };

  const params = new URLSearchParams({
    select: "enrolment_id,student_reference,full_name,course_title,preferred_intake,enrolment_status,payment_status,enrolled_at,updated_at,email,phone",
    enrolment_id: "eq." + id,
    limit: "1",
  });

  try {
    const response = await supabase(config, "all_enrolled_students?" + params.toString());
    if (!response.ok) throw new Error("Application record unavailable");
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) return { state: "live", application: null };
    return {
      state: "live",
      application: {
        ...mapApplication(row),
        email: clean(row.email, ""),
        phone: clean(row.phone, ""),
        updatedAt: dateLabel(row.updated_at),
      },
    };
  } catch {
    return { state: "unavailable", application: null };
  }
}

export async function getEnquiries(
  demo: boolean, filter: EnquiryFilter, page: number,
): Promise<PortalList<EnquirySummary>> {
  if (demo) {
    const rows = demoEnquiries.filter((row) => filter === "all" || row.status === filter);
    return {
      state: "demo", total: rows.length, page, pageSize: PAGE_SIZE,
      rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    };
  }

  const config = getSupabaseConfig();
  if (!config) return listUnavailable(page);

  const params = new URLSearchParams({
    select: "id,full_name,organisation,email,phone,service_programme,programme_location,message,status,created_at",
    order: "created_at.desc",
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
  });
  if (filter !== "all") params.set("status", "eq." + filter);

  try {
    const response = await supabase(config, "enquiries?" + params.toString(), {
      headers: { prefer: "count=exact" },
    });
    if (!response.ok) throw new Error("Enquiries unavailable");
    const raw = (await response.json()) as Array<Record<string, unknown>>;
    const totalValue = response.headers.get("content-range")?.split("/")[1];
    const total = totalValue && totalValue !== "*" ? Number(totalValue) : null;
    return {
      state: "live", total: Number.isFinite(total) ? total : null, page,
      pageSize: PAGE_SIZE,
      rows: raw.map((row) => ({
        id: clean(row.id, ""),
        name: clean(row.full_name, "Unnamed enquirer"),
        organisation: clean(row.organisation, ""),
        email: clean(row.email, ""),
        phone: clean(row.phone, ""),
        programme: clean(row.service_programme, "Programme enquiry"),
        location: clean(row.programme_location, ""),
        message: clean(row.message, ""),
        status: clean(row.status, "unknown"),
        submittedAt: dateLabel(row.created_at),
      })),
    };
  } catch {
    return listUnavailable(page);
  }
}
