import {
  clearAuthCookies,
  getSessionTokens,
  refreshAccessToken,
  safeNextPath,
  setAuthCookies,
  validateAccessToken,
} from "@/app/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const { refreshToken } = await getSessionTokens();

  if (refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (
      tokens?.access_token &&
      (await validateAccessToken(tokens.access_token))
    ) {
      await setAuthCookies(tokens);
      return NextResponse.redirect(new URL(next, request.url), 303);
    }
  }

  await clearAuthCookies();
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", next);
  return NextResponse.redirect(login, 303);
}
