import { database, cmsTableIds, expectedCmsCounts } from "./schema.mjs";

const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
const supabaseKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const appwriteEndpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "");
const appwriteProject = process.env.APPWRITE_PROJECT_ID?.trim();
const appwriteKey = process.env.APPWRITE_API_KEY?.trim();

if (!supabaseUrl || !supabaseKey || !appwriteEndpoint || !appwriteProject || !appwriteKey) {
  console.error("Missing required Supabase/Appwrite server configuration.");
  process.exit(1);
}

const appwriteHeaders = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": appwriteProject,
  "X-Appwrite-Key": appwriteKey,
};

function appwriteRequest(path, init = {}) {
  return fetch(`${appwriteEndpoint}${path}`, {
    ...init,
    headers: { ...appwriteHeaders, ...(init.headers || {}) },
  });
}

async function sourceRows(table) {
  const query = new URLSearchParams({ select: "*", order: "sort_order.asc" });
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase read failed for ${table}: ${response.status}`);
  return response.json();
}

function normalizeRow(table, source) {
  const { id, ...data } = source;
  // Appwrite stores array data natively. JSON fields are converted explicitly.
  if (table === "payments" && data.raw_response != null && typeof data.raw_response !== "string") {
    data.raw_response = JSON.stringify(data.raw_response);
  }
  return { rowId: String(id), data };
}

async function existingRow(table, rowId) {
  const response = await appwriteRequest(
    `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(rowId)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Appwrite row lookup failed for ${table}/${rowId}: ${response.status}`);
  return response.json();
}

async function insertRow(table, rowId, data) {
  const response = await appwriteRequest(
    `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(table)}/rows`,
    {
      method: "POST",
      body: JSON.stringify({ rowId, data, permissions: [] }),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Appwrite insert failed for ${table}/${rowId}: ${response.status} ${body}`);
  }
}

const summary = {};
for (const table of cmsTableIds) {
  const rows = await sourceRows(table);
  const expected = expectedCmsCounts[table];
  if (rows.length !== expected) {
    throw new Error(`Source drift detected for ${table}: expected ${expected}, found ${rows.length}. Re-run inventory before migrating.`);
  }

  let inserted = 0;
  let skipped = 0;
  for (const source of rows) {
    const { rowId, data } = normalizeRow(table, source);
    if (await existingRow(table, rowId)) {
      skipped += 1;
      continue;
    }
    await insertRow(table, rowId, data);
    inserted += 1;
  }
  summary[table] = { source: rows.length, inserted, skipped };
}

const total = Object.values(summary).reduce((sum, item) => sum + item.source, 0);
if (total !== 39) throw new Error(`Expected 39 source CMS rows, found ${total}.`);
console.log(JSON.stringify({ ok: true, totalSourceRows: total, summary }, null, 2));
