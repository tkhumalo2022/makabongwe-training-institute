export type Course = {
  id: number; slug: string; title: string; description: string; department: string;
  duration: string; deliveryMode: string; location: string; imageUrl: string | null;
  priceCents: number; registrationFeeCents: number; availableIntake: string | null;
  isAvailable: boolean;
};

export type Applicant = {
  firstName: string; lastName: string; email: string; phone: string;
  idPassportNumber: string; dateOfBirth?: string; address: string;
  qualification: string; preferredIntake: string; notes?: string;
  acceptedPolicies: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+27|0)[6-8][0-9]{8}$/;

export function validateApplicant(value: unknown): { ok: true; applicant: Applicant } | { ok: false; errors: Record<string, string> } {
  const body = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const fields = ["firstName", "lastName", "email", "phone", "idPassportNumber", "address", "qualification", "preferredIntake"] as const;
  const errors: Record<string, string> = {};
  for (const field of fields) if (typeof body[field] !== "string" || !body[field].trim()) errors[field] = "This field is required.";
  if (typeof body.email === "string" && !emailPattern.test(body.email.trim())) errors.email = "Enter a valid email address.";
  if (typeof body.phone === "string" && !phonePattern.test(body.phone.replace(/[\s()-]/g, ""))) errors.phone = "Enter a valid South African phone number.";
  if (body.acceptedPolicies !== true) errors.acceptedPolicies = "Accept the terms, privacy notice and refund policy.";
  if (Object.keys(errors).length) return { ok: false, errors };
  const text = (name: string, max: number) => String(body[name] ?? "").trim().slice(0, max);
  return { ok: true, applicant: {
    firstName: text("firstName", 100), lastName: text("lastName", 100), email: text("email", 254).toLowerCase(),
    phone: text("phone", 30), idPassportNumber: text("idPassportNumber", 100), dateOfBirth: text("dateOfBirth", 10) || undefined,
    address: text("address", 500), qualification: text("qualification", 200), preferredIntake: text("preferredIntake", 120),
    notes: text("notes", 1000) || undefined, acceptedPolicies: true,
  }};
}

type Config = { url: string; keys: string[]; paystackKey: string; siteUrl: string };

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server credentials are not configured.");
    this.name = "SupabaseConfigurationError";
  }
}

export function resolveSupabaseServerKeys() {
  const keys = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key));
  const uniqueKeys = [...new Set(keys)];
  if (!uniqueKeys.length) throw new SupabaseConfigurationError();
  return uniqueKeys;
}

export function getSupabaseConfig(): Config | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  let keys: string[];
  try { keys = resolveSupabaseServerKeys(); } catch { return null; }
  if (!url) return null;
  return { url, keys, paystackKey: "", siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.makabongwe.network").replace(/\/$/, "") };
}
export function getServerConfig(): Config | null {
  const base = getSupabaseConfig();
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!base || !paystackKey) return null;
  return { ...base, paystackKey };
}

function headers(key: string, prefer?: string) {
  return { apikey: key, authorization: `Bearer ${key}`,
    "content-type": "application/json", ...(prefer ? { prefer } : {}) };
}
export async function supabase(config: Config, path: string, init: RequestInit = {}) {
  let response: Response | null = null;
  for (const key of config.keys) {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers(key), ...(init.headers || {}) },
      cache: "no-store",
    });
    if (response.status !== 401) return response;
  }
  return response as Response;
}
export function mapCourse(row: Record<string, unknown>): Course {
  return { id: Number(row.id), slug: String(row.slug), title: String(row.title), description: String(row.description),
    department: String(row.department || "Agricultural Training"), duration: String(row.duration || "To be confirmed"),
    deliveryMode: String(row.delivery_mode || "Contact learning"), location: String(row.location || "To be confirmed"),
    imageUrl: row.image_url ? String(row.image_url) : null, priceCents: Number(row.price_cents || 0), registrationFeeCents: Number(row.registration_fee_cents || 0),
    availableIntake: row.available_intake ? String(row.available_intake) : null,
    isAvailable: row.is_available === true };
}
export async function getCourse(config: Config, courseId: number) {
  const res = await supabase(config, `cms_programmes?select=id,slug,title,description,department,duration,delivery_mode,location,image_url,price_cents,registration_fee_cents,available_intake&id=eq.${courseId}&is_published=eq.true&is_available=eq.true&limit=1`);
  if (!res.ok) throw new Error("Course lookup failed"); const rows = await res.json() as Record<string, unknown>[]; return rows[0] ? mapCourse(rows[0]) : null;
}
export function totalCents(course: Pick<Course, "priceCents" | "registrationFeeCents">) { return course.priceCents + course.registrationFeeCents; }
export function zar(cents: number) { return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100); }
