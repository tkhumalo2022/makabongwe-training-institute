import { database, tables, storageBucket } from "./schema.mjs";

const endpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "");
const projectId = process.env.APPWRITE_PROJECT_ID?.trim();
const apiKey = process.env.APPWRITE_API_KEY?.trim();

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY.");
  process.exit(1);
}

const baseHeaders = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": projectId,
  "X-Appwrite-Key": apiKey,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, init = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: { ...baseHeaders, ...(init.headers || {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(`${init.method || "GET"} ${path} failed: ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function exists(path) {
  try {
    return await request(path);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function waitForReady(path, label, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const item = await exists(path);
    if (item && (!item.status || item.status === "available")) return item;
    if (item?.status === "failed" || item?.error) {
      throw new Error(`${label} failed to provision: ${item.error || item.status}`);
    }
    await sleep(500);
  }
  throw new Error(`${label} did not become ready in time.`);
}

async function ensureDatabase() {
  const path = `/tablesdb/${encodeURIComponent(database.id)}`;
  const current = await exists(path);
  if (current) return current;
  return request("/tablesdb", {
    method: "POST",
    body: JSON.stringify({
      databaseId: database.id,
      name: database.name,
      enabled: database.enabled,
    }),
  });
}

async function ensureTable(table) {
  const path = `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(table.id)}`;
  const current = await exists(path);
  if (!current) {
    await request(`/tablesdb/${encodeURIComponent(database.id)}/tables`, {
      method: "POST",
      body: JSON.stringify({
        tableId: table.id,
        name: table.name,
        permissions: table.permissions,
        rowSecurity: table.rowSecurity,
        enabled: table.enabled,
      }),
    });
  }

  for (const column of table.columns) await ensureColumn(table.id, column);
  for (const index of table.indexes) await ensureIndex(table.id, index);
}

function columnCreatePath(tableId, type) {
  return `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(tableId)}/columns/${type}`;
}

function columnPath(tableId, key) {
  return `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(tableId)}/columns/${encodeURIComponent(key)}`;
}

async function ensureColumn(tableId, column) {
  const path = columnPath(tableId, column.key);
  if (await exists(path)) return waitForReady(path, `${tableId}.${column.key}`);

  const payload = {
    key: column.key,
    required: column.required,
    array: Boolean(column.array),
  };
  if (column.type === "string") payload.size = column.size;

  await request(columnCreatePath(tableId, column.type), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return waitForReady(path, `${tableId}.${column.key}`);
}

async function ensureIndex(tableId, index) {
  const path = `/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(tableId)}/indexes/${encodeURIComponent(index.key)}`;
  if (await exists(path)) return waitForReady(path, `${tableId}.${index.key}`);

  await request(`/tablesdb/${encodeURIComponent(database.id)}/tables/${encodeURIComponent(tableId)}/indexes`, {
    method: "POST",
    body: JSON.stringify({
      key: index.key,
      type: index.type,
      columns: index.attributes,
      orders: index.attributes.map(() => "ASC"),
    }),
  });
  return waitForReady(path, `${tableId}.${index.key}`);
}

async function ensureBucket() {
  const path = `/storage/buckets/${encodeURIComponent(storageBucket.id)}`;
  if (await exists(path)) return;
  await request("/storage/buckets", {
    method: "POST",
    body: JSON.stringify({
      bucketId: storageBucket.id,
      name: storageBucket.name,
      permissions: storageBucket.permissions,
      fileSecurity: storageBucket.fileSecurity,
      enabled: storageBucket.enabled,
      maximumFileSize: storageBucket.maximumFileSize,
      allowedFileExtensions: storageBucket.allowedFileExtensions,
      compression: storageBucket.compression,
      encryption: storageBucket.encryption,
      antivirus: storageBucket.antivirus,
      transformations: storageBucket.transformations,
    }),
  });
}

await ensureDatabase();
for (const table of tables) await ensureTable(table);
await ensureBucket();
console.log(JSON.stringify({
  ok: true,
  database: database.id,
  tables: tables.map((table) => table.id),
  bucket: storageBucket.id,
  note: "Non-production schema provisioned with no client permissions.",
}, null, 2));
