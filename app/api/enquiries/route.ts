export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFICATION_RECIPIENT = "makabongweprojectsptyd@gmail.com";
const MAX_BODY_BYTES = 12_000;
const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

type RuntimeConfig = {
  supabaseUrl: string;
  supabaseKeys: string[];
  resendApiKey: string;
  resendFromEmail: string;
  ipHashSalt: string;
  rateLimitMax: number;
  rateLimitWindowSeconds: number;
};

type EnquiryInput = {
  fullName: string;
  organisation: string | null;
  phone: string;
  email: string;
  serviceProgramme: string;
  programmeLocation: string | null;
  estimatedLearners: number | null;
  preferredStartDate: string | null;
  message: string;
  sourcePage: string;
};

type EnquiryRecord = EnquiryInput & {
  id?: string;
  createdAt?: string;
};

type ValidationResult =
  | { ok: true; enquiry: EnquiryInput }
  | { ok: false; errors: Record<string, string> };

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: string, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig(): RuntimeConfig | null {
  const supabaseUrl = readEnv("SUPABASE_URL").replace(/\/+$/, "");
  const supabaseKeys = [...new Set([
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].map((key) => key?.trim()).filter((key): key is string => Boolean(key)))];
  const resendApiKey = readEnv("RESEND_API_KEY");
  const resendFromEmail = readEnv("RESEND_FROM_EMAIL");
  const ipHashSalt = readEnv("ENQUIRY_IP_HASH_SALT");

  if (
    !supabaseUrl ||
    !supabaseKeys.length ||
    !resendApiKey ||
    !resendFromEmail ||
    !ipHashSalt
  ) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseKeys,
    resendApiKey,
    resendFromEmail,
    ipHashSalt,
    rateLimitMax: parsePositiveInt(
      readEnv("ENQUIRY_RATE_LIMIT_MAX"),
      DEFAULT_RATE_LIMIT_MAX,
    ),
    rateLimitWindowSeconds: parsePositiveInt(
      readEnv("ENQUIRY_RATE_LIMIT_WINDOW_SECONDS"),
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    ),
  };
}

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...init?.headers,
    },
  });
}

function normalizeText(value: unknown, multiline = false) {
  if (typeof value !== "string") {
    return "";
  }

  const withoutControls = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  if (multiline) {
    return withoutControls
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return withoutControls.replace(/\s+/g, " ").trim();
}

function readTextField(
  payload: Record<string, unknown>,
  key: string,
  label: string,
  options: {
    required?: boolean;
    min?: number;
    max: number;
    multiline?: boolean;
  },
  errors: Record<string, string>,
) {
  const value = normalizeText(payload[key], options.multiline);

  if (!value) {
    if (options.required) {
      errors[key] = `${label} is required.`;
    }
    return "";
  }

  if (options.min && value.length < options.min) {
    errors[key] = `${label} is too short.`;
  } else if (value.length > options.max) {
    errors[key] = `${label} is too long.`;
  }

  return value;
}

function hasSuspiciousContent(enquiry: EnquiryInput) {
  const combined = [
    enquiry.fullName,
    enquiry.organisation ?? "",
    enquiry.phone,
    enquiry.email,
    enquiry.serviceProgramme,
    enquiry.programmeLocation ?? "",
    enquiry.message,
    enquiry.sourcePage,
  ].join("\n");
  const linkCount = (combined.match(/https?:\/\//gi) ?? []).length;

  return (
    /<\s*\/?\s*(script|iframe|object|embed|style|link|meta)\b/i.test(
      combined,
    ) ||
    /\b(?:javascript|data):/i.test(combined) ||
    /bcc:|cc:|content-type:/i.test(enquiry.email) ||
    linkCount > 3
  );
}

function getTodayDateString() {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDateString(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validatePayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: { form: "Invalid enquiry payload." } };
  }

  const record = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const honeypot = normalizeText(record.companyWebsite);

  if (honeypot) {
    return { ok: false, errors: { form: "Unable to process enquiry." } };
  }

  const fullName = readTextField(
    record,
    "fullName",
    "Full name",
    {
      required: true,
      min: 2,
      max: 120,
    },
    errors,
  );
  const organisation = readTextField(
    record,
    "organisation",
    "Organisation",
    {
      max: 160,
    },
    errors,
  );
  const phone = readTextField(
    record,
    "phone",
    "Phone number",
    {
      required: true,
      min: 7,
      max: 40,
    },
    errors,
  );
  const email = readTextField(
    record,
    "email",
    "Email address",
    {
      required: true,
      max: 254,
    },
    errors,
  ).toLowerCase();
  const serviceProgramme = readTextField(
    record,
    "serviceProgramme",
    "Service or programme",
    {
      required: true,
      min: 2,
      max: 160,
    },
    errors,
  );
  const programmeLocation = readTextField(
    record,
    "programmeLocation",
    "Programme location",
    {
      max: 160,
    },
    errors,
  );
  const message = readTextField(
    record,
    "message",
    "Message",
    {
      required: true,
      min: 10,
      max: 2_000,
      multiline: true,
    },
    errors,
  );

  const digitsOnlyPhone = phone.replace(/\D/g, "");
  if (
    phone &&
    (!/^[+()\d\s.-]+$/.test(phone) ||
      digitsOnlyPhone.length < 7 ||
      digitsOnlyPhone.length > 15)
  ) {
    errors.phone = "Enter a valid phone number.";
  }

  if (
    email &&
    !/^[^\s@<>()[\]\\.,;:"]+(?:\.[^\s@<>()[\]\\.,;:"]+)*@[^\s@<>()[\]\\.,;:"]+(?:\.[^\s@<>()[\]\\.,;:"]+)+$/.test(
      email,
    )
  ) {
    errors.email = "Enter a valid email address.";
  }

  const learnersValue = normalizeText(record.estimatedLearners);
  let estimatedLearners: number | null = null;
  if (learnersValue) {
    const parsedLearners = Number(learnersValue);
    if (
      !Number.isInteger(parsedLearners) ||
      parsedLearners < 1 ||
      parsedLearners > 100_000
    ) {
      errors.estimatedLearners =
        "Estimated number of learners must be between 1 and 100000.";
    } else {
      estimatedLearners = parsedLearners;
    }
  }

  const preferredStartDate = normalizeText(record.preferredStartDate);
  if (
    preferredStartDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(preferredStartDate) ||
      !isValidDateString(preferredStartDate))
  ) {
    errors.preferredStartDate = "Enter a valid preferred starting date.";
  } else if (preferredStartDate && preferredStartDate < getTodayDateString()) {
    errors.preferredStartDate = "Preferred starting date cannot be in the past.";
  }

  const requestedSourcePage = readTextField(
    record,
    "sourcePage",
    "Source page",
    {
      max: 300,
    },
    errors,
  );
  const sourcePage =
    requestedSourcePage &&
    /^\/[A-Za-z0-9/?#=&%._~:+-]*$/.test(requestedSourcePage)
      ? requestedSourcePage
      : "/contact";

  const enquiry: EnquiryInput = {
    fullName,
    organisation: organisation || null,
    phone,
    email,
    serviceProgramme,
    programmeLocation: programmeLocation || null,
    estimatedLearners,
    preferredStartDate: preferredStartDate || null,
    message,
    sourcePage,
  };

  if (hasSuspiciousContent(enquiry)) {
    errors.form = "The enquiry contains unsupported content.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, enquiry };
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getSupabaseHeaders(key: string, prefer?: string) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...(prefer ? { prefer } : {}),
  };
}

async function fetchSupabase(
  config: RuntimeConfig,
  input: string | URL,
  init: RequestInit = {},
  prefer?: string,
) {
  let response: Response | null = null;
  for (const key of config.supabaseKeys) {
    response = await fetch(input, {
      ...init,
      headers: {
        ...getSupabaseHeaders(key, prefer),
        ...(init.headers ?? {}),
      },
    });
    if (response.status !== 401) return response;
  }
  return response as Response;
}

async function isRateLimited(config: RuntimeConfig, ipHash: string) {
  const since = new Date(
    Date.now() - config.rateLimitWindowSeconds * 1000,
  ).toISOString();
  const url = new URL(`${config.supabaseUrl}/rest/v1/enquiries`);
  url.searchParams.set("select", "id");
  url.searchParams.set("ip_hash", `eq.${ipHash}`);
  url.searchParams.set("created_at", `gte.${since}`);
  url.searchParams.set("limit", String(config.rateLimitMax));

  const response = await fetchSupabase(config, url, {}, "count=exact");

  if (!response.ok) {
    console.error("Enquiry rate-limit check failed", {
      status: response.status,
    });
    throw new Error("Rate limit unavailable");
  }

  const rows = (await response.json()) as unknown;
  return Array.isArray(rows) && rows.length >= config.rateLimitMax;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createEmailHtml(enquiry: EnquiryRecord) {
  const rows: Array<[string, string | number | null | undefined]> = [
    ["Full name", enquiry.fullName],
    ["Organisation or group", enquiry.organisation],
    ["Phone number", enquiry.phone],
    ["Email address", enquiry.email],
    ["Service or programme", enquiry.serviceProgramme],
    ["Programme location", enquiry.programmeLocation],
    ["Estimated number of learners", enquiry.estimatedLearners],
    ["Preferred starting date", enquiry.preferredStartDate],
    ["Source page", enquiry.sourcePage],
    ["Submission status", "new"],
    ["Created date", enquiry.createdAt],
  ];

  return `
    <h1>New Makabongwe programme enquiry</h1>
    <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:720px">
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <th align="left" style="border-bottom:1px solid #ddd;width:220px">${escapeHtml(label)}</th>
                <td style="border-bottom:1px solid #ddd">${escapeHtml(value || "Not provided")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
    <h2>Message</h2>
    <p style="white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>
  `;
}

function createEmailText(enquiry: EnquiryRecord) {
  return [
    "New Makabongwe programme enquiry",
    "",
    `Full name: ${enquiry.fullName}`,
    `Organisation or group: ${enquiry.organisation ?? "Not provided"}`,
    `Phone number: ${enquiry.phone}`,
    `Email address: ${enquiry.email}`,
    `Service or programme: ${enquiry.serviceProgramme}`,
    `Programme location: ${enquiry.programmeLocation ?? "Not provided"}`,
    `Estimated number of learners: ${
      enquiry.estimatedLearners ?? "Not provided"
    }`,
    `Preferred starting date: ${
      enquiry.preferredStartDate ?? "Not provided"
    }`,
    `Source page: ${enquiry.sourcePage}`,
    "Submission status: new",
    `Created date: ${enquiry.createdAt ?? "Not provided"}`,
    "",
    "Message:",
    enquiry.message,
  ].join("\n");
}

async function updateNotificationStatus(
  config: RuntimeConfig,
  id: string | undefined,
  values: Record<string, string>,
) {
  if (!id) {
    return;
  }

  const url = new URL(`${config.supabaseUrl}/rest/v1/enquiries`);
  url.searchParams.set("id", `eq.${id}`);

  const response = await fetchSupabase(config, url, {
    method: "PATCH",
    body: JSON.stringify(values),
  }, "return=minimal");

  if (!response.ok) {
    console.warn("Unable to update enquiry notification status", {
      status: response.status,
    });
  }
}

async function sendNotification(config: RuntimeConfig, enquiry: EnquiryRecord) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      "content-type": "application/json",
      ...(enquiry.id ? { "idempotency-key": enquiry.id } : {}),
    },
    body: JSON.stringify({
      from: config.resendFromEmail,
      to: [NOTIFICATION_RECIPIENT],
      reply_to: enquiry.email,
      subject: `New Makabongwe enquiry: ${enquiry.serviceProgramme}`,
      html: createEmailHtml(enquiry),
      text: createEmailText(enquiry),
      tags: [{ name: "source", value: "website_enquiry" }],
    }),
  });

  if (!response.ok) {
    console.warn("Resend notification failed", {
      status: response.status,
    });
    return false;
  }

  return true;
}

async function insertEnquiry(
  config: RuntimeConfig,
  enquiry: EnquiryInput,
  ipHash: string,
  userAgent: string | null,
) {
  const response = await fetchSupabase(config, `${config.supabaseUrl}/rest/v1/enquiries`, {
    method: "POST",
    body: JSON.stringify({
      full_name: enquiry.fullName,
      organisation: enquiry.organisation,
      phone: enquiry.phone,
      email: enquiry.email,
      service_programme: enquiry.serviceProgramme,
      programme_location: enquiry.programmeLocation,
      estimated_learners: enquiry.estimatedLearners,
      preferred_start_date: enquiry.preferredStartDate,
      message: enquiry.message,
      source_page: enquiry.sourcePage,
      ip_hash: ipHash,
      user_agent: userAgent,
    }),
  }, "return=representation");

  if (!response.ok) {
    console.error("Supabase enquiry insert failed", {
      status: response.status,
    });
    throw new Error("Enquiry insert failed");
  }

  const rows = (await response.json()) as Array<{
    id?: string;
    created_at?: string;
  }>;
  const inserted = rows[0] ?? {};

  return {
    ...enquiry,
    id: inserted.id,
    createdAt: inserted.created_at,
  };
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      { ok: false, message: "Unable to process this enquiry." },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { ok: false, message: "Unable to process this enquiry." },
      { status: 413 },
    );
  }

  const config = getConfig();
  if (!config) {
    return jsonResponse(
      { ok: false, message: "The enquiry service is not available right now." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return jsonResponse(
        { ok: false, message: "Unable to process this enquiry." },
        { status: 413 },
      );
    }
    payload = JSON.parse(body);
  } catch {
    return jsonResponse(
      { ok: false, message: "Unable to process this enquiry." },
      { status: 400 },
    );
  }

  const validation = validatePayload(payload);
  if (!validation.ok) {
    return jsonResponse(
      {
        ok: false,
        message: "Please check the enquiry details and try again.",
      },
      { status: 400 },
    );
  }

  const ipHash = await sha256Hex(`${config.ipHashSalt}:${getClientIp(request)}`);

  try {
    if (await isRateLimited(config, ipHash)) {
      return jsonResponse(
        {
          ok: false,
          message: "Please wait before sending another enquiry.",
        },
        { status: 429 },
      );
    }
  } catch {
    return jsonResponse(
      { ok: false, message: "The enquiry service is not available right now." },
      { status: 503 },
    );
  }

  let inserted: EnquiryRecord;
  try {
    inserted = await insertEnquiry(
      config,
      validation.enquiry,
      ipHash,
      normalizeText(request.headers.get("user-agent")).slice(0, 300) || null,
    );
  } catch {
    return jsonResponse(
      { ok: false, message: "The enquiry could not be sent right now." },
      { status: 502 },
    );
  }

  const notificationSent = await sendNotification(config, inserted);
  if (notificationSent) {
    await updateNotificationStatus(config, inserted.id, {
      notification_status: "sent",
      notified_at: new Date().toISOString(),
    });
  } else {
    await updateNotificationStatus(config, inserted.id, {
      notification_status: "failed",
      notification_error: "Notification provider returned an error.",
    });
  }

  return jsonResponse(
    {
      ok: true,
      message: notificationSent
        ? "Your enquiry has been sent."
        : "Your enquiry was saved, but the email notification could not be sent automatically.",
      notification: notificationSent ? "sent" : "failed",
    },
    { status: 201 },
  );
}
