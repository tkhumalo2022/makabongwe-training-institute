import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { programmes as fallbackProgrammes } from "../data";
import { getSupabaseConfig, supabase } from "./payments";

export type ManagedProgramme = {
  id: number; slug: string; title: string; description: string;
  department: string; duration: string; delivery_mode: string; location: string;
  available_intake: string | null; image_url: string | null;
  price_cents: number; registration_fee_cents: number; sort_order: number;
  is_published: boolean; is_available: boolean; updated_at?: string;
};

const columns = "id,slug,title,description,department,duration,delivery_mode,location,available_intake,image_url,price_cents,registration_fee_cents,sort_order,is_published,is_available,updated_at";
const localDir = join(process.cwd(), ".admin-local");
const localFile = join(localDir, "programmes.json");
export function getAdminStorageMode(): "local-preview" | "supabase" {
  return process.env.NODE_ENV === "production" || process.env.MAKABONGWE_ADMIN_MODE === "supabase"
    ? "supabase" : "local-preview";
}
const slugify = (value: string) => value.toLowerCase().normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 85);

function seedProgrammes(): ManagedProgramme[] {
  return fallbackProgrammes.map(([title, description], index) => ({
    id: index + 1, slug: slugify(title), title, description,
    department: "Agricultural Training", duration: "To be confirmed",
    delivery_mode: "Contact learning", location: "To be confirmed",
    available_intake: null, image_url: null, price_cents: 0, registration_fee_cents: 0,
    sort_order: index, is_published: true, is_available: false,
  }));
}
async function localRead(): Promise<ManagedProgramme[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(localFile, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("Invalid programme data.");
    return parsed as ManagedProgramme[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedProgrammes();
    throw error;
  }
}
async function localWrite(rows: ManagedProgramme[]) {
  await mkdir(localDir, { recursive: true });
  const tmp = join(localDir, randomUUID() + ".tmp");
  await writeFile(tmp, JSON.stringify(rows, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, localFile);
}
function remoteConfig() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not connected. Set SUPABASE_URL and SUPABASE_SECRET_KEY server-side.");
  return config;
}
function ensureList(rows: ManagedProgramme[]) {
  return rows.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}
export async function listManagedProgrammes(): Promise<ManagedProgramme[]> {
  if (getAdminStorageMode() === "local-preview") return ensureList(await localRead());
  const response = await supabase(remoteConfig(), "cms_programmes?select=" + columns + "&order=sort_order.asc");
  if (!response.ok) throw new Error("Programme database request failed.");
  return ensureList(await response.json() as ManagedProgramme[]);
}
export async function publishedPreviewProgrammes() {
  if (getAdminStorageMode() !== "local-preview") return null;
  const rows = await listManagedProgrammes();
  return rows.filter((item) => item.is_published).map((item) => [item.title, item.description] as [string,string]);
}
function required(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "string") throw new Error(name + " is required.");
  const result = value.trim();
  if (result.length < min || result.length > max) throw new Error(name + " must be " + min + "–" + max + " characters.");
  return result;
}
function cents(value: unknown, name: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6)
    throw new Error(name + " must be between R0 and R1,000,000 (at most two decimals).");
  return Math.round(amount * 100);
}
export function validateManagedProgramme(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid programme details.");
  const data = input as Record<string, unknown>;
  const title = required(data.title, "Title", 2, 160);
  const slug = slugify(required(data.slug || title, "Slug", 2, 100));
  if (slug.length < 2) throw new Error("Enter a valid programme slug.");
  const description = required(data.description, "Description", 10, 1000);
  const department = required(data.department, "Department", 2, 120);
  const duration = required(data.duration, "Duration", 2, 80);
  const delivery_mode = required(data.delivery_mode, "Delivery mode", 2, 80);
  const location = required(data.location, "Location", 2, 120);
  const available_intake = data.available_intake ? required(data.available_intake, "Intake", 1, 120) : null;
  const price_cents = cents(data.price_rands, "Programme price");
  const registration_fee_cents = cents(data.registration_fee_rands, "Registration fee");
  const is_published = data.is_published === true;
  const is_available = data.is_available === true;
  if (is_available && !is_published) throw new Error("Publish a programme before enabling enrolment.");
  if (is_available && price_cents + registration_fee_cents === 0) throw new Error("Enrolment requires a non-zero price or registration fee.");
  const sort_order = Number(data.sort_order ?? 0);
  if (!Number.isSafeInteger(sort_order) || sort_order < 0 || sort_order > 10000) throw new Error("Sort order is invalid.");
  const image_url = data.image_url ? required(data.image_url, "Image URL", 3, 350) : null;
  if (image_url && !(image_url.startsWith("/") && !image_url.startsWith("//") || /^https:\/\//i.test(image_url)))
    throw new Error("Image URL must be HTTPS or a local path.");
  return {slug, title, description, department, duration, delivery_mode, location,
    available_intake, image_url, price_cents, registration_fee_cents, sort_order, is_published, is_available};
}
export async function saveManagedProgramme(input: unknown, id?: number): Promise<ManagedProgramme> {
  const values = validateManagedProgramme(input);
  if (getAdminStorageMode() === "local-preview") {
    const rows = await localRead();
    if (rows.some((row) => row.slug === values.slug && row.id !== id)) throw new Error("This programme slug already exists.");
    if (id !== undefined) {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) throw new Error("Programme not found.");
      rows[index] = { ...rows[index], ...values, updated_at: new Date().toISOString() };
      await localWrite(rows); return rows[index];
    }
    const row = {...values, id: Math.max(0,...rows.map((row) => row.id)) + 1, updated_at: new Date().toISOString()};
    rows.push(row); await localWrite(rows); return row;
  }
  const config = remoteConfig();
  const url = id === undefined ? "cms_programmes" : "cms_programmes?id=eq." + id;
  const response = await supabase(config, url, {
    method: id === undefined ? "POST" : "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(response.status === 409 ? "Programme slug already exists." : "Could not save programme in Supabase.");
  const rows = await response.json() as ManagedProgramme[];
  if (!rows.length) throw new Error("Programme was not found.");
  return rows[0];
}
async function tableCount(table: string) {
  const config = remoteConfig();
  const result = await supabase(config, table + "?select=id&limit=1", { headers: { prefer: "count=exact" } });
  if (!result.ok) return null;
  const value = result.headers.get("content-range")?.split("/")[1];
  return value && value !== "*" ? Number(value) : null;
}
export async function adminOverview() {
  const programmes = await listManagedProgrammes();
  if (getAdminStorageMode() === "local-preview") return {
    mode: getAdminStorageMode(), programmes,
    enquiryCount: null, enrolmentCount: null, paymentCount: null,
  };
  const [enquiryCount, enrolmentCount, paymentCount] = await Promise.all([
    tableCount("enquiries"), tableCount("enrollments"), tableCount("payments"),
  ]);
  return {mode: getAdminStorageMode(), programmes, enquiryCount, enrolmentCount, paymentCount};
}
