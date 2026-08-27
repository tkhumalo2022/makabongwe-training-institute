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

async function sourceRows(table) {
  const query = new URLSearchParams({ select: "*", order: "sort_order.asc" });
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: supabaseKey, authorization: `Bearer ${supabaseKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase read failed for ${table}: ${response.status}`);
  return response.json();
}

async function destinationRows(table) {
  const response = await fetch(
    `${appwriteEndpoint}/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(table)}/rows?total=false`,
    { headers: appwriteHeaders, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Appwrite read failed for ${table}: ${response.status}`);
  const body = await response.json();
  return body.rows || [];
}

const metaKeys = new Set(["$id", "$sequence", "$createdAt", "$updatedAt", "$permissions", "$databaseId", "$tableId"]);
function cleanDestination(row) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !metaKeys.has(key)));
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, comparable(value[key])]));
  }
  return value;
}

function compareRows(source, destination) {
  const mismatches = [];
  for (const [key, expected] of Object.entries(source)) {
    if (key === "id") continue;
    const actual = destination[key] ?? null;
    if (JSON.stringify(comparable(expected)) !== JSON.stringify(comparable(actual))) {
      mismatches.push({ field: key, expected, actual });
    }
  }
  return mismatches;
}

const report = {};
let allValid = true;
for (const table of cmsTableIds) {
  const source = await sourceRows(table);
  const destination = await destinationRows(table);
  const destinationById = new Map(destination.map((row) => [String(row.$id), cleanDestination(row)]));
  const tableMismatches = [];

  for (const row of source) {
    const target = destinationById.get(String(row.id));
    if (!target) {
      tableMismatches.push({ id: String(row.id), type: "missing_destination_row" });
      continue;
    }
    const fields = compareRows(row, target);
    if (fields.length) tableMismatches.push({ id: String(row.id), type: "field_mismatch", fields });
  }

  const duplicateIds = destination.length - new Set(destination.map((row) => row.$id)).size;
  const countMatches = source.length === destination.length && source.length === expectedCmsCounts[table];
  const valid = countMatches && duplicateIds === 0 && tableMismatches.length === 0;
  allValid = allValid && valid;
  report[table] = {
    expected: expectedCmsCounts[table],
    source: source.length,
    destination: destination.length,
    duplicateIds,
    mismatches: tableMismatches,
    valid,
  };
}

const sourceTotal = Object.values(report).reduce((sum, item) => sum + item.source, 0);
const destinationTotal = Object.values(report).reduce((sum, item) => sum + item.destination, 0);
console.log(JSON.stringify({
  ok: allValid && sourceTotal === 39 && destinationTotal === 39,
  sourceTotal,
  destinationTotal,
  report,
}, null, 2));
if (!allValid || sourceTotal !== 39 || destinationTotal !== 39) process.exitCode = 2;
