import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/admin-concept/page.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../app/admin-concept/route-viewport.css", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/admin-concept/dashboard.module.css", import.meta.url), "utf8");

test("dashboard concept never implies live data or protected admin access", () => {
  assert.match(page, /SAMPLE DATA ONLY/);
  assert.match(page, /fictional example enquiries/);
  assert.match(page, /not an authenticated admin area/);
  assert.match(page, /DEMO-101/);
  assert.doesNotMatch(page, /fetch\s*\(|supabase\s*\(|process\.env/);
});

test("dashboard navigation, table search and status filters have stateful controls", () => {
  assert.match(page, /setView/);
  assert.match(page, /setFilter/);
  assert.match(page, /setSearch/);
  assert.match(page, /aria-pressed=\{filter === item\}/);
  assert.match(page, /filtered\.length === 0/);
});

test("prototype chrome is isolated from real website layout", () => {
  assert.match(page, /data-admin-concept="true"/);
  assert.match(page, /route-viewport\.css/);
  assert.match(chrome, /body:has\(main\[data-admin-concept="true"\]\)/);
  assert.match(css, /prefers-reduced-motion/);
});
