import {
  changePassword,
  clearAuthCookies,
  getSessionTokens,
  revokeSession,
  validateAccessToken,
} from "@/app/lib/admin-auth";
import { isSameOrigin, noStoreJson } from "@/app/lib/request-security";

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

  const password = typeof payload.password === "string" ? payload.password : "";
  if (password.length < 12 || password.length > 256) {
    return noStoreJson(
      { ok: false, message: "Use a password with at least 12 characters." },
      400,
    );
  }

  const { accessToken } = await getSessionTokens();
  if (!accessToken || !(await validateAccessToken(accessToken))) {
    await clearAuthCookies();
    return noStoreJson(
      { ok: false, message: "Your recovery session has expired. Request a new link." },
      401,
    );
  }

  if (!(await changePassword(accessToken, password))) {
    return noStoreJson(
      { ok: false, message: "Password could not be updated. Request a new link." },
      400,
    );
  }

  await revokeSession(accessToken, "global");
  await clearAuthCookies();

  return noStoreJson({
    ok: true,
    message: "Password updated. Sign in again with your new password.",
  });
}
