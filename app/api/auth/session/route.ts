import {
  setAuthCookies,
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

  const accessToken =
    typeof payload.accessToken === "string" ? payload.accessToken : "";
  const refreshToken =
    typeof payload.refreshToken === "string" ? payload.refreshToken : "";
  const expiresIn =
    typeof payload.expiresIn === "number" && Number.isFinite(payload.expiresIn)
      ? payload.expiresIn
      : 3600;

  if (!accessToken || !refreshToken) {
    return noStoreJson({ ok: false, message: "Invalid sign-in link." }, 400);
  }

  const user = await validateAccessToken(accessToken);
  if (!user) {
    return noStoreJson(
      { ok: false, message: "This account is not authorized for admin access." },
      403,
    );
  }

  await setAuthCookies({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  });

  return noStoreJson({ ok: true });
}
