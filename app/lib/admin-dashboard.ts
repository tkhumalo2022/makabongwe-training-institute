import "server-only";

import { getSupabaseConfig, supabase } from "./payments";

type RecentItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
  createdAt: string;
};

export type AdminDashboardData = {
  dataState: "demo" | "live" | "unavailable";
  enquiries: {
    total: number | null;
    newCount: number | null;
    recent: RecentItem[];
  };
  enrolments: {
    total: number | null;
    reviewCount: number | null;
    recent: RecentItem[];
  };
  payments: {
    successful: number | null;
    failed: number | null;
  };
  programmes: {
    published: number | null;
    available: number | null;
  };
};

const demoData: AdminDashboardData = {
  dataState: "demo",
  enquiries: {
    total: 24,
    newCount: 6,
    recent: [
      {
        id: "demo-enquiry-1",
        title: "Youth poultry programme",
        meta: "Community group · Richards Bay",
        status: "New",
        createdAt: "Today",
      },
      {
        id: "demo-enquiry-2",
        title: "Farm & cooperative upskilling",
        meta: "Cooperative · uMhlathuze",
        status: "Contacted",
        createdAt: "Yesterday",
      },
      {
        id: "demo-enquiry-3",
        title: "School food garden package",
        meta: "School enquiry · King Cetshwayo",
        status: "Reviewed",
        createdAt: "2 days ago",
      },
    ],
  },
  enrolments: {
    total: 38,
    reviewCount: 8,
    recent: [
      {
        id: "demo-enrolment-1",
        title: "Poultry Starter Workshop",
        meta: "Next intake",
        status: "Under review",
        createdAt: "Today",
      },
      {
        id: "demo-enrolment-2",
        title: "Broiler Business Bootcamp",
        meta: "Next intake",
        status: "Submitted",
        createdAt: "Yesterday",
      },
      {
        id: "demo-enrolment-3",
        title: "Farm & Cooperative Upskilling",
        meta: "Group enrolment",
        status: "Accepted",
        createdAt: "2 days ago",
      },
    ],
  },
  payments: {
    successful: 17,
    failed: 2,
  },
  programmes: {
    published: 5,
    available: 3,
  },
};

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function relativeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";

  const difference = Date.now() - time;
  const day = 86_400_000;
  if (difference < day) return "Today";
  if (difference < day * 2) return "Yesterday";
  const days = Math.floor(difference / day);
  if (days < 8) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(new Date(time));
}

async function countRows(
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
  table: string,
  filters = "",
) {
  const query = new URLSearchParams({ select: "id", limit: "1" });
  const path = `${table}?${query.toString()}${filters}`;
  const response = await supabase(config, path, {
    headers: {
      prefer: "count=exact",
      range: "0-0",
    },
  });
  if (!response.ok) throw new Error(`${table} count failed`);

  const contentRange = response.headers.get("content-range");
  const total = contentRange?.split("/")[1];
  return total && total !== "*" ? Number(total) : 0;
}

async function recentEnquiries(
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
) {
  const response = await supabase(
    config,
    "enquiries?select=id,status,organisation,service_programme,programme_location,created_at&order=created_at.desc&limit=4",
  );
  if (!response.ok) throw new Error("Recent enquiries failed");

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    title: String(row.service_programme ?? "Programme enquiry"),
    meta: [row.organisation, row.programme_location]
      .filter((value) => typeof value === "string" && value)
      .join(" · ") || "Website enquiry",
    status: titleCase(String(row.status ?? "new")),
    createdAt: relativeDate(row.created_at),
  }));
}

async function recentEnrolments(
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
) {
  const response = await supabase(
    config,
    "enrollments?select=id,status,qualification,preferred_intake,created_at&order=created_at.desc&limit=4",
  );
  if (!response.ok) throw new Error("Recent enrolments failed");

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    title: String(row.qualification ?? "Course enrolment"),
    meta: String(row.preferred_intake ?? "Intake to be confirmed"),
    status: titleCase(String(row.status ?? "submitted")),
    createdAt: relativeDate(row.created_at),
  }));
}

export async function getAdminDashboardData(
  demo: boolean,
): Promise<AdminDashboardData> {
  if (demo) return demoData;

  const config = getSupabaseConfig();
  if (!config) {
    return {
      dataState: "unavailable",
      enquiries: { total: null, newCount: null, recent: [] },
      enrolments: { total: null, reviewCount: null, recent: [] },
      payments: { successful: null, failed: null },
      programmes: { published: null, available: null },
    };
  }

  try {
    const [
      enquiryTotal,
      newEnquiries,
      enrolmentTotal,
      submittedEnrolments,
      reviewEnrolments,
      successfulPayments,
      failedPayments,
      publishedProgrammes,
      availableProgrammes,
      enquiriesRecent,
      enrolmentsRecent,
    ] = await Promise.all([
      countRows(config, "enquiries"),
      countRows(config, "enquiries", "&status=eq.new"),
      countRows(config, "enrollments"),
      countRows(config, "enrollments", "&status=eq.submitted"),
      countRows(config, "enrollments", "&status=eq.under_review"),
      countRows(config, "payments", "&status=eq.success"),
      countRows(config, "payments", "&status=eq.failed"),
      countRows(config, "cms_programmes", "&is_published=eq.true"),
      countRows(
        config,
        "cms_programmes",
        "&is_published=eq.true&is_available=eq.true",
      ),
      recentEnquiries(config),
      recentEnrolments(config),
    ]);

    return {
      dataState: "live",
      enquiries: {
        total: enquiryTotal,
        newCount: newEnquiries,
        recent: enquiriesRecent,
      },
      enrolments: {
        total: enrolmentTotal,
        reviewCount: submittedEnrolments + reviewEnrolments,
        recent: enrolmentsRecent,
      },
      payments: {
        successful: successfulPayments,
        failed: failedPayments,
      },
      programmes: {
        published: publishedProgrammes,
        available: availableProgrammes,
      },
    };
  } catch (error) {
    console.error(
      "[admin-dashboard]",
      error instanceof Error ? error.message : "Unable to load dashboard data",
    );

    return {
      dataState: "unavailable",
      enquiries: { total: null, newCount: null, recent: [] },
      enrolments: { total: null, reviewCount: null, recent: [] },
      payments: { successful: null, failed: null },
      programmes: { published: null, available: null },
    };
  }
}
