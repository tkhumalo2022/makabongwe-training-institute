import test from "node:test";
import assert from "node:assert/strict";
import { getAdminReadiness } from "../scripts/check-admin-readiness.mjs";

const example = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fake_fixture",
  MAKABONGWE_ADMIN_EMAILS: "staff@example.invalid",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "fictional-site-key",
  TURNSTILE_SECRET_KEY: "SECRET_FIXTURE_DO_NOT_USE",
  SUPABASE_SECRET_KEY: "SERVER_ONLY_SECRET_FIXTURE",
};

test("staff readiness fails closed when authentication setup is incomplete", () => {
  const result = getAdminReadiness({ SUPABASE_URL: example.SUPABASE_URL });
  assert.equal(result.configured, false);
  assert.equal(result.checks.filter((check) => !check.configured).length, 5);
  assert.ok(result.manualChecks.length >= 5);
});

test("staff readiness uses validated allowlist presence and no real credential values", () => {
  assert.equal(getAdminReadiness(example).configured, true);
  assert.equal(getAdminReadiness({ ...example, MAKABONGWE_ADMIN_EMAILS: "not-email" }).configured, false);
  assert.equal(getAdminReadiness({ ...example, MAKABONGWE_ADMIN_EMAILS: "" }).configured, false);
  const output = JSON.stringify(getAdminReadiness(example));
  assert.doesNotMatch(output, /staff@example\.invalid|SECRET_FIXTURE|sb_publishable_fake_fixture|fictional-site-key/);
});

test("server-only application key must exist, independently of auth key", () => {
  const { SUPABASE_SECRET_KEY: _omitted, ...withoutSecret } = example;
  const result = getAdminReadiness(withoutSecret);
  assert.equal(result.checks.find((check) => check.id === "private_data")?.configured, false);
  assert.equal(result.configured, false);
});

test("environment-free checks never treat a preview demo as production-ready", () => {
  const result = getAdminReadiness({ VERCEL_ENV: "preview", TURNSTILE_DEV_BYPASS: "true" });
  assert.equal(result.configured, false);
  assert.ok(result.checks.every((check) => !check.configured));
});
