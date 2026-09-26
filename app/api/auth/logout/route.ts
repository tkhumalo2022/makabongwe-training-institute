import {
  clearAuthCookies,
  getSessionTokens,
  revokeSession,
} from "@/app/lib/admin-auth";
import { isSameOrigin } from "@/app/lib/request-security";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Request rejected.", { status: 403 });
  }

  const { accessToken } = await getSessionTokens();
  if (accessToken) await revokeSession(accessToken, "local");
  await clearAuthCookies();

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
