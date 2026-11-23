import { expiredSessionCookie, hasAdminSession, isAdminConfigured, isSameOrigin, noStore, signedSessionCookie, validateAdminPassword } from "../../../lib/admin-auth";
import { getAdminStorageMode } from "../../../lib/admin-programmes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: Request) {
  return noStore(Response.json({
    authenticated: hasAdminSession(request),
    configured: isAdminConfigured(),
    mode: getAdminStorageMode(),
  }));
}
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return noStore(Response.json({error: "Invalid request origin."}, {status: 403}));
  if (!isAdminConfigured()) return noStore(Response.json({error: "Admin login is not configured."}, {status: 503}));
  const ip = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim().slice(0, 60);
  const now = Date.now();
  const current = attempts.get(ip) || {count: 0, resetAt: now + 15 * 60_000};
  if (now > current.resetAt) {current.count = 0; current.resetAt = now + 15 * 60_000;}
  if (current.count >= 6) return noStore(Response.json({error: "Too many attempts. Try again later."}, {status: 429}));
  let payload: unknown;
  try {payload = await request.json();} catch {return noStore(Response.json({error: "Invalid request."}, {status: 400}));}
  const password = payload && typeof payload === "object" && "password" in payload ? (payload as {password: unknown}).password : undefined;
  if (!validateAdminPassword(password)) {
    current.count += 1;
    attempts.set(ip, current);
    return noStore(Response.json({error: "Incorrect admin password."}, {status: 401}));
  }
  attempts.delete(ip);
  const result = noStore(Response.json({authenticated: true, mode: getAdminStorageMode()}));
  result.headers.set("Set-Cookie", signedSessionCookie(request));
  return result;
}
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return noStore(Response.json({error: "Invalid request origin."}, {status: 403}));
  const result = noStore(Response.json({authenticated: false}));
  result.headers.set("Set-Cookie", expiredSessionCookie());
  return result;
}
