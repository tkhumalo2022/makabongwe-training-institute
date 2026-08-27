const endpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "");
const projectId = process.env.APPWRITE_PROJECT_ID?.trim();
const apiKey = process.env.APPWRITE_API_KEY?.trim();
const databaseId = process.env.APPWRITE_DATABASE_ID?.trim() || "makabongwe_nonprod";

export class AppwriteConfigurationError extends Error {
  constructor() {
    super("Appwrite server credentials are not configured.");
    this.name = "AppwriteConfigurationError";
  }
}

function config() {
  if (!endpoint || !projectId || !apiKey) throw new AppwriteConfigurationError();
  return { endpoint, projectId, apiKey, databaseId };
}

async function request(path: string, init: RequestInit = {}) {
  const c = config();
  const response = await fetch(`${c.endpoint}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "X-Appwrite-Project": c.projectId,
      "X-Appwrite-Key": c.apiKey,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  return response;
}

export async function getRow(table: string, rowId: string) {
  return request(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(rowId)}`);
}

export async function listRows(table: string, queries: string[] = []) {
  const params = new URLSearchParams();
  for (const query of queries) params.append("queries[]", query);
  const suffix = params.size ? `?${params}` : "";
  return request(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows${suffix}`);
}

export async function createRow(table: string, rowId: string, data: Record<string, unknown>) {
  return request(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows`, {
    method: "POST",
    body: JSON.stringify({ rowId, data, permissions: [] }),
  });
}

export async function updateRow(table: string, rowId: string, data: Record<string, unknown>) {
  return request(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(rowId)}`, {
    method: "PATCH",
    body: JSON.stringify({ data }),
  });
}

export async function deleteRow(table: string, rowId: string) {
  return request(`/tablesdb/${encodeURIComponent(databaseId)}/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(rowId)}`, {
    method: "DELETE",
  });
}

export const appwriteTables = {
  services: "cms_services",
  programmes: "cms_programmes",
  trainingDays: "cms_training_days",
  qualifications: "cms_qualifications",
  deliverySteps: "cms_delivery_steps",
  values: "cms_values",
  enquiries: "enquiries",
  enrollments: "enrollments",
  payments: "payments",
  documents: "enrollment_documents",
} as const;
