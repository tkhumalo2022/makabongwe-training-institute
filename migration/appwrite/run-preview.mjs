import { spawnSync } from "node:child_process";

const expectedBranch = "migration/appwrite-nonprod";
const expectedEndpoint = "https://fra.cloud.appwrite.io/v1";
const expectedDatabase = "makabongwe_nonprod";

const branch =
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.VERCEL_COMMIT_REF ||
  "";

const targetEnv = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || "";

if (process.env.VERCEL_ENV !== "preview" || targetEnv !== "preview" || branch !== expectedBranch) {
  console.log("Appwrite migration runner skipped: not approved Preview branch.");
  process.exit(0);
}

const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "SUPABASE_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());

const hasSupabaseServerKey = Boolean(
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);

if (!hasSupabaseServerKey) {
  missing.push("SUPABASE_SECRET_KEY_OR_SERVICE_ROLE_KEY");
}

if (missing.length) {
  console.error(`Migration preflight failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.APPWRITE_PROJECT_ID.trim().includes("<") || process.env.APPWRITE_PROJECT_ID.trim().includes(">")) {
  console.error("Migration preflight failed: Appwrite project ID appears to be a placeholder.");
  process.exit(1);
}

if (process.env.APPWRITE_ENDPOINT.trim().replace(/\/+$/, "") !== expectedEndpoint) {
  console.error("Migration preflight failed: unexpected Appwrite endpoint.");
  process.exit(1);
}

if (process.env.APPWRITE_DATABASE_ID.trim() !== expectedDatabase) {
  console.error("Migration preflight failed: unexpected Appwrite database ID.");
  process.exit(1);
}

const commands = [
  "migration/appwrite/provision.mjs",
  "migration/appwrite/migrate-cms.mjs",
  "migration/appwrite/validate-cms.mjs",
];

for (const script of commands) {
  console.log(`Running ${script}...`);
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`Migration runner failed to start ${script}.`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Migration stopped at ${script}.`);
    process.exit(result.status || 1);
  }
}

console.log("Makabongwe non-production Appwrite migration validation passed.");
