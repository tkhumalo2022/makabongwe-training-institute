import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("admin login is protected by Turnstile and an allowlist", async () => {
  const [loginRoute, authLib] = await Promise.all([
    read("app/api/auth/login/route.ts"),
    read("app/lib/admin-auth.ts"),
  ]);

  assert.match(loginRoute, /verifyTurnstile/);
  assert.match(authLib, /MAKABONGWE_ADMIN_EMAILS/);
  assert.match(authLib, /validateAccessToken/);
});

test("preview demo login cannot activate in production", async () => {
  const [loginRoute, authLib, loginPage] = await Promise.all([
    read("app/api/auth/login/route.ts"),
    read("app/lib/admin-auth.ts"),
    read("app/admin/login/page.tsx"),
  ]);

  assert.match(authLib, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(loginRoute, /payload\.demo === true/);
  assert.match(loginRoute, /demoLoginAvailable\(\)/);
  assert.match(loginPage, /demoEnabled=\{demoEnabled\}/);
});

test("preview demo session has no Supabase refresh token", async () => {
  const authLib = await read("app/lib/admin-auth.ts");

  assert.match(authLib, /setDemoAuthCookie/);
  assert.match(authLib, /PREVIEW_DEMO_TOKEN/);
  assert.doesNotMatch(
    authLib.match(/export async function setDemoAuthCookie\(\)[\s\S]*?\n\}/)?.[0] ?? "",
    /REFRESH_COOKIE/,
  );
});

test("admin session cookies are httpOnly, same-site and secure in production", async () => {
  const authLib = await read("app/lib/admin-auth.ts");

  assert.match(authLib, /httpOnly:\s*true/);
  assert.match(authLib, /sameSite:\s*"lax"/);
  assert.match(authLib, /process\.env\.NODE_ENV === "production"/);
  assert.match(authLib, /__Host-/);
});

test("password recovery does not reveal whether an admin account exists", async () => {
  const route = await read("app/api/auth/request-link/route.ts");

  assert.match(route, /GENERIC_MESSAGE/);
  assert.match(route, /isAdminEmail/);
  assert.doesNotMatch(route, /user not found/i);
});

test("password changes require at least 12 characters and revoke sessions", async () => {
  const route = await read("app/api/auth/update-password/route.ts");

  assert.match(route, /password\.length < 12/);
  assert.match(route, /revokeSession\(accessToken, "global"\)/);
});

test("admin page requires authenticated server-side authorization", async () => {
  const page = await read("app/admin/page.tsx");
  assert.match(page, /requireAdmin\("\/admin"\)/);
});

test("client login code never imports Supabase service credentials", async () => {
  const client = await read("app/admin/login/LoginForm.tsx");
  assert.doesNotMatch(client, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});


test("learner records require admin authentication and hide sensitive identity fields", async () => {
  const [page, reader] = await Promise.all([
    read("app/admin/learners/page.tsx"),
    read("app/lib/admin-learners.ts"),
  ]);

  assert.match(page, /requireAdmin\("\/admin\/learners"\)/);
  assert.match(reader, /all_enrolled_students/);
  assert.doesNotMatch(
    reader,
    /select=[^"\n]*(id_passport_number|date_of_birth|email|phone|address)/,
  );
});

test("internal admin routes suppress public website chrome", async () => {
  const [layout, globals] = await Promise.all([
    read("app/admin/layout.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(layout, /data-internal-admin/);
  assert.match(globals, /body:has\(\[data-internal-admin\]\) > \.site-header/);
  assert.match(globals, /body:has\(\[data-internal-admin\]\) > \.site-footer/);
});
