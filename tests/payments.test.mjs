import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paymentLib = await readFile(new URL("../app/lib/payments.ts", import.meta.url), "utf8");
const initializeRoute = await readFile(new URL("../app/api/paystack/initialize/route.ts", import.meta.url), "utf8");
const verifyLib = await readFile(new URL("../app/lib/verify-payment.ts", import.meta.url), "utf8");
const webhookRoute = await readFile(new URL("../app/api/paystack/webhook/route.ts", import.meta.url), "utf8");
const courseRoute = await readFile(new URL("../app/api/courses/route.ts", import.meta.url), "utf8");
const courseAdmin = await readFile(new URL("../app/lib/course-admin.ts", import.meta.url), "utf8");
const readinessScript = await readFile(new URL("../scripts/check-payment-readiness.mjs", import.meta.url), "utf8");
const enquiryRoute = await readFile(new URL("../app/api/enquiries/route.ts", import.meta.url), "utf8");

test("course loading only returns published, available CMS programmes", () => {
  assert.match(courseRoute, /cms_programmes/);
  assert.match(courseRoute, /is_published=eq\.true/);
  assert.match(courseRoute, /is_available=eq\.true/);
});

test("payment amount is calculated from the server-side course", () => {
  assert.match(initializeRoute, /getCourse\(config, courseId\)/);
  assert.match(initializeRoute, /totalCents\(course\)/);
  assert.doesNotMatch(initializeRoute, /body\.amount/);
});

test("invalid, missing and inactive courses are rejected", () => {
  assert.match(initializeRoute, /Number\.isSafeInteger/);
  assert.match(initializeRoute, /if \(!course\)/);
  assert.match(paymentLib, /is_published=eq\.true&is_available=eq\.true/);
  assert.doesNotMatch(courseRoute, /select=\*/);
});

test("required applicant data and policy acceptance are validated", () => {
  for (const field of ["firstName", "lastName", "email", "phone", "idPassportNumber", "address", "qualification", "preferredIntake"]) assert.match(paymentLib, new RegExp(field));
  assert.match(paymentLib, /acceptedPolicies !== true/);
});

test("verification checks status, reference, amount and ZAR currency", () => {
  assert.match(verifyLib, /data\.status === "success"/);
  assert.match(verifyLib, /data\.reference === reference/);
  assert.match(verifyLib, /Number\(data\.amount\) === Number\(payment\.amount\)/);
  assert.match(verifyLib, /data\.currency === "ZAR"/);
  assert.match(verifyLib, /payment\.status !== "success"/);
  assert.match(verifyLib, /"pending"/);
});

test("webhook rejects invalid signatures and handles duplicate delivery idempotently", () => {
  assert.match(webhookRoute, /createHmac\("sha512"/);
  assert.match(webhookRoute, /timingSafeEqual/);
  assert.match(webhookRoute, /status: 401/);
  assert.match(webhookRoute, /verifyPayment/);
  assert.match(verifyLib, /payment\.status !== "success"/);
});

test("server-only course management converts rands to cents and blocks unsafe availability", () => {
  assert.match(courseAdmin, /Math\.round\(input\.priceRands \* 100\)/);
  assert.match(courseAdmin, /Math\.round\(input\.registrationFeeRands \* 100\)/);
  assert.match(courseAdmin, /payment amount greater than zero/);
  assert.match(courseAdmin, /unpublished course cannot be available/i);
});

test("current Supabase secret key is preferred with a legacy fallback", () => {
  for (const source of [paymentLib, readinessScript, enquiryRoute]) {
    const current = source.indexOf("SUPABASE_SECRET_KEY");
    const legacy = source.indexOf("SUPABASE_SERVICE_ROLE_KEY");
    assert.ok(current >= 0 && legacy > current);
  }
  assert.match(paymentLib, /process\.env\.SUPABASE_SECRET_KEY \?\?[\s\S]*process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(paymentLib, /SupabaseConfigurationError/);
});

test("opaque secret keys use apikey only and readiness output contains names only", () => {
  assert.match(paymentLib, /startsWith\("sb_secret_"\)/);
  assert.match(readinessScript, /startsWith\("sb_secret_"\)/);
  assert.doesNotMatch(paymentLib + readinessScript + enquiryRoute, /NEXT_PUBLIC_SUPABASE_(?:SECRET|SERVICE_ROLE)/);
  assert.doesNotMatch(readinessScript, /console\.(?:log|error)\([^\n]*(?:supabaseKey|process\.env\[)/);
});
