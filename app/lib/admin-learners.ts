import "server-only";

import { getSupabaseConfig, supabase } from "./payments";

export type LearnerRecord = {
  reference: string;
  name: string;
  course: string;
  intake: string;
  enrolmentStatus: string;
  paymentStatus: string;
  enrolledAt: string;
};

export type LearnerRecordsData = {
  state: "demo" | "live" | "unavailable";
  total: number | null;
  accepted: number | null;
  needsReview: number | null;
  paymentIssues: number | null;
  records: LearnerRecord[];
};

const demoRecords: LearnerRecord[] = [
  {
    reference: "MTI-DEMO01",
    name: "Demo Learner 01",
    course: "Poultry Starter Workshop",
    intake: "October 2026",
    enrolmentStatus: "Accepted",
    paymentStatus: "Paid",
    enrolledAt: "24 Sep 2026",
  },
  {
    reference: "MTI-DEMO02",
    name: "Demo Learner 02",
    course: "Broiler Business Bootcamp",
    intake: "October 2026",
    enrolmentStatus: "Under review",
    paymentStatus: "Paid",
    enrolledAt: "23 Sep 2026",
  },
  {
    reference: "MTI-DEMO03",
    name: "Demo Learner 03",
    course: "Farm & Cooperative Upskilling",
    intake: "November 2026",
    enrolmentStatus: "Submitted",
    paymentStatus: "Pending",
    enrolledAt: "22 Sep 2026",
  },
  {
    reference: "MTI-DEMO04",
    name: "Demo Learner 04",
    course: "School Food Garden Package",
    intake: "November 2026",
    enrolmentStatus: "Accepted",
    paymentStatus: "Paid",
    enrolledAt: "21 Sep 2026",
  },
];

function titleCase(value: unknown) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function countRows(
  config: NonNullable<ReturnType<typeof getSupabaseConfig>>,
  filters = "",
) {
  const response = await supabase(
    config,
    `all_enrolled_students?select=enrolment_id&limit=1${filters}`,
    {
      headers: {
        prefer: "count=exact",
        range: "0-0",
      },
    },
  );

  if (!response.ok) throw new Error("Learner register count failed");
  const contentRange = response.headers.get("content-range");
  const total = contentRange?.split("/")[1];
  return total && total !== "*" ? Number(total) : 0;
}

export async function getLearnerRecords(
  demo: boolean,
): Promise<LearnerRecordsData> {
  if (demo) {
    return {
      state: "demo",
      total: 38,
      accepted: 21,
      needsReview: 8,
      paymentIssues: 5,
      records: demoRecords,
    };
  }

  const config = getSupabaseConfig();
  if (!config) {
    return {
      state: "unavailable",
      total: null,
      accepted: null,
      needsReview: null,
      paymentIssues: null,
      records: [],
    };
  }

  try {
    const [total, accepted, submitted, underReview, pendingPayments, failedPayments, response] =
      await Promise.all([
        countRows(config),
        countRows(config, "&enrolment_status=eq.accepted"),
        countRows(config, "&enrolment_status=eq.submitted"),
        countRows(config, "&enrolment_status=eq.under_review"),
        countRows(config, "&payment_status=eq.pending"),
        countRows(config, "&payment_status=eq.failed"),
        supabase(
          config,
          "all_enrolled_students?select=student_reference,full_name,course_title,preferred_intake,enrolment_status,payment_status,enrolled_at&order=enrolled_at.desc&limit=100",
        ),
      ]);

    if (!response.ok) throw new Error("Learner register lookup failed");

    const rows = (await response.json()) as Array<Record<string, unknown>>;
    const records = rows.map((row) => ({
      reference: String(row.student_reference ?? "—"),
      name: String(row.full_name ?? "Unnamed learner"),
      course: String(row.course_title ?? "Programme not set"),
      intake: String(row.preferred_intake ?? "To be confirmed"),
      enrolmentStatus: titleCase(row.enrolment_status) || "Unknown",
      paymentStatus: titleCase(row.payment_status) || "Unknown",
      enrolledAt: formatDate(row.enrolled_at),
    }));

    return {
      state: "live",
      total,
      accepted,
      needsReview: submitted + underReview,
      paymentIssues: pendingPayments + failedPayments,
      records,
    };
  } catch (error) {
    console.error(
      "[admin-learners]",
      error instanceof Error ? error.message : "Unable to load learner records",
    );

    return {
      state: "unavailable",
      total: null,
      accepted: null,
      needsReview: null,
      paymentIssues: null,
      records: [],
    };
  }
}
