import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (relative) => readFile(new URL("../" + relative, import.meta.url), "utf8");

test("staff portal pages enforce server-side authorization", async () => {
  for (const path of [
    "app/admin/applications/page.tsx",
    "app/admin/applications/[id]/page.tsx",
    "app/admin/enquiries/page.tsx",
  ]) {
    const source = await read(path);
    assert.match(source, /requireAdmin\(/, path);
    assert.doesNotMatch(source, /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/, path);
  }
});

test("separate application and enquiry navigation is available in staff workspace", async () => {
  const [shell, overview] = await Promise.all([
    read("app/admin/admin-shell.tsx"),
    read("app/admin/page.tsx"),
  ]);
  assert.match(shell, /href: "\/admin\/applications"/);
  assert.match(shell, /href: "\/admin\/enquiries"/);
  assert.match(overview, /\/admin\/applications/);
  assert.match(overview, /\/admin\/enquiries/);
});

test("read-only portal has no database writes or PII-heavy select fields", async () => {
  const source = await read("app/lib/admin-operations.ts");
  assert.match(source, /import "server-only"/);
  assert.match(source, /getSupabaseConfig/);
  assert.match(source, /supabase\(config/);
  assert.doesNotMatch(source, /method:\s*"(POST|PATCH|PUT|DELETE)"/);
  assert.doesNotMatch(source, /select: "[^"]*(id_passport_number|date_of_birth|address|emergency_contact)/);
  assert.match(source, /enrolment_status/);
  assert.match(source, /state: "unavailable"/);
});

test("demo portal data never queries private Supabase data", async () => {
  const source = await read("app/lib/admin-operations.ts");
  assert.match(source, /if \(demo\) \{/);
  assert.match(source, /DEMO-APP-01/);
  assert.match(source, /Sample Enquirer/);
  assert.match(source, /const config = getSupabaseConfig\(\)/);
});

test("individual application IDs are validated before a privileged query", async () => {
  const source = await read("app/lib/admin-operations.ts");
  assert.match(source, /enrolment_id: "eq\." \+ id/);
  assert.match(source, /\[0-9a-f\]/);
  assert.match(source, /all_enrolled_students/);
});

test("Makabongwe official logo is present in the staff sidebar and login", async () => {
  const [shell, login] = await Promise.all([
    read("app/admin/admin-shell.tsx"),
    read("app/admin/login/page.tsx"),
  ]);
  assert.match(shell, /\/images\/makabongwe-logo\.webp/);
  assert.match(login, /\/images\/makabongwe-logo\.webp/);
});
