import { pathToFileURL } from "node:url";

function present(env, name) {
  return typeof env[name] === "string" && env[name].trim().length > 0;
}

function validAllowlist(env) {
  const raw = env.MAKABONGWE_ADMIN_EMAILS;
  if (typeof raw !== "string" || !raw.trim()) return false;
  const emails = raw.split(",").map((entry) => entry.trim().toLowerCase());
  return emails.every((email) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email));
}

/**
 * Does not contact Supabase or Vercel, read .env files, or expose actual settings.
 * An existing secret is checked for presence only, never printed.
 */
export function getAdminReadiness(env = process.env) {
  const checks = [
    { id: "supabase_url", label: "Supabase Auth project URL", configured: present(env, "SUPABASE_URL") && /^https:\/\//.test(env.SUPABASE_URL.trim()) },
    { id: "supabase_public", label: "Supabase publishable key (server-side)", configured: present(env, "SUPABASE_PUBLISHABLE_KEY") || present(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
    { id: "staff_allowlist", label: "Approved admin email allowlist", configured: validAllowlist(env) },
    { id: "turnstile_site", label: "Cloudflare Turnstile public site key", configured: present(env, "NEXT_PUBLIC_TURNSTILE_SITE_KEY") },
    { id: "turnstile_secret", label: "Cloudflare Turnstile server secret", configured: present(env, "TURNSTILE_SECRET_KEY") },
    { id: "private_data", label: "Private application data server credential", configured: present(env, "SUPABASE_SECRET_KEY") || present(env, "SUPABASE_SERVICE_ROLE_KEY") },
  ];

  return {
    configured: checks.every((check) => check.configured),
    checks,
    manualChecks: [
      "Verify that the intended staff member controls their personal email.",
      "Provision a distinct Supabase Auth user with no password shared in chat.",
      "Verify an owner-approved redirect to /auth/callback for the correct domain.",
      "Configure and test Supabase Auth SMTP delivery and account recovery.",
      "Test login, session refresh, unauthorized access, logout and mobile layout.",
      "Get an explicit owner decision before invitations or production deployment.",
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = getAdminReadiness();
  process.stdout.write("Makabongwe staff login — configuration presence only\n");
  for (const check of result.checks) {
    process.stdout.write((check.configured ? "[configured] " : "[missing] ") + check.label + "\n");
  }
  process.stdout.write("\nManual verification required even when all keys are configured:\n");
  for (const check of result.manualChecks) {
    process.stdout.write("- " + check + "\n");
  }
  process.stdout.write("\nNo invites sent. No secrets or email addresses read or printed.\n");
  if (!result.configured) process.exitCode = 1;
}
