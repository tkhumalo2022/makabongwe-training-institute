import {
  setAuthCookies,
  signInWithPassword,
} from "@/app/lib/admin-auth";
import { isSameOrigin, noStoreJson } from "@/app/lib/request-security";
import { verifyTurnstile } from "@/app/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return noStoreJson({ ok: false, message: "Request rejected." }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ ok: false, message: "Invalid request." }, 400);
  }

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password || email.length > 254 || password.length > 256) {
    return noStoreJson(
      { ok: false, message: "Check your email and password and try again." },
      400,
    );
  }

  if (!(await verifyTurnstile(request, payload.turnstileToken))) {
    return noStoreJson(
      { ok: false, message: "Security check failed. Please try again." },
      400,
    );
  }

  const tokens = await signInWithPassword(email, password);
  if (!tokens) {
    return noStoreJson(
      { ok: false, message: "Check your email and password and try again." },
      401,
    );
  }

  await setAuthCookies(tokens);
  return noStoreJson({ ok: true });
}
