import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const COOKIE = "makabongwe_admin_session";
const MAX_AGE = 8 * 60 * 60;

export function isAdminConfigured() {
  return Boolean(process.env.MAKABONGWE_ADMIN_PASSWORD?.trim() && process.env.MAKABONGWE_ADMIN_SESSION_SECRET?.trim());
}

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}
function equals(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}
function signature(expiry: number) {
  return createHmac("sha256", process.env.MAKABONGWE_ADMIN_SESSION_SECRET || "")
    .update("makabongwe-admin-v1:" + expiry).digest("hex");
}

export function validateAdminPassword(candidate: unknown) {
  if (!isAdminConfigured() || typeof candidate !== "string" || candidate.length > 256) return false;
  return equals(candidate, process.env.MAKABONGWE_ADMIN_PASSWORD!);
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false; // Browser writes must send Origin.
  try {
    const incoming = new URL(origin);
    const target = new URL(request.url);
    if (incoming.origin === target.origin) return true;
    // Next.js can normalise 127.0.0.1 to localhost; retain strict port matching.
    if (process.env.NODE_ENV !== "production" &&
      ["127.0.0.1", "localhost"].includes(incoming.hostname) &&
      ["127.0.0.1", "localhost"].includes(target.hostname) &&
      incoming.port === target.port && incoming.protocol === target.protocol) return true;
    const host = request.headers.get("host");
    return Boolean(host && incoming.host === host && incoming.protocol === target.protocol);
  } catch { return false; }
}
export function signedSessionCookie(request: Request) {
  const expiry = Math.floor(Date.now() / 1000) + MAX_AGE;
  const value = expiry + "." + signature(expiry);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return COOKIE + "=" + value + "; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=" + MAX_AGE + secure;
}
export function expiredSessionCookie() {
  return COOKIE + "=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0";
}
export function hasAdminSession(request: Request) {
  if (!isAdminConfigured()) return false;
  const cookies = request.headers.get("cookie") || "";
  const found = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE + "="));
  if (!found) return false;
  const match = found.slice(COOKIE.length + 1).match(/^(\d{10,12})\.([a-f0-9]{64})$/);
  if (!match) return false;
  const expiry = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  return expiry > now && expiry <= now + MAX_AGE && equals(match[2], signature(expiry));
}
export function noStore(response: Response) {
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
