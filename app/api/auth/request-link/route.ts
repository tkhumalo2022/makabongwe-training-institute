import {
  isAdminEmail,
  sendMagicLink,
  sendPasswordRecovery,
} from "@/app/lib/admin-auth";
import { isSameOrigin, noStoreJson } from "@/app/lib/request-security";
import { verifyTurnstile } from "@/app/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_MESSAGE =
  "If that email is authorized, a secure sign-in message is on its way.";

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
  const mode = payload.mode === "recovery" ? "recovery" : "magic";

  if (!email || email.length > 254) {
    return noStoreJson({ ok: false, message: "Enter a valid email address." }, 400);
  }

  if (!(await verifyTurnstile(request, payload.turnstileToken))) {
    return noStoreJson(
      { ok: false, message: "Security check failed. Please try again." },
      400,
    );
  }

  if (isAdminEmail(email)) {
    const redirectTo = new URL("/auth/callback", request.url).toString();
    if (mode === "recovery") {
      await sendPasswordRecovery(email, redirectTo);
    } else {
      await sendMagicLink(email, redirectTo);
    }
  }

  return noStoreJson({ ok: true, message: GENERIC_MESSAGE });
}
