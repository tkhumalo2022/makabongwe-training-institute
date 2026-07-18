import {
  accreditedQualifications as staticAccreditedQualifications,
  deliverySteps as staticDeliverySteps,
  programmes as staticProgrammes,
  services as staticServices,
  trainingDays as staticTrainingDays,
  values as staticValues,
} from "../data";

const CMS_REVALIDATE_SECONDS = 300;

export type CmsService = {
  number: string;
  title: string;
  summary: string;
  items: string[];
};

export type CmsQualification = {
  code: string;
  title: string;
  nqf: string;
  duration: string;
};

type CmsPair = [title: string, description: string];
type CmsTrainingDay = [day: string, title: string, description: string];
type PairRow = { title: string; description: string };
type TrainingDayRow = PairRow & { day_number: number };
type QualificationRow = {
  code: string;
  title: string;
  nqf_level: string;
  duration: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  return url && key ? { url, key } : null;
}

async function fetchPublishedRows<T>(table: string, select: string) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const query = new URLSearchParams({
    select,
    is_published: "eq.true",
    order: "sort_order.asc",
  });
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    next: { revalidate: CMS_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`CMS request for ${table} failed with ${response.status}.`);
  }

  return (await response.json()) as T[];
}

async function loadCms<T, R>(
  table: string,
  select: string,
  fallback: R,
  transform: (rows: T[]) => R,
) {
  try {
    const rows = await fetchPublishedRows<T>(table, select);
    return rows?.length ? transform(rows) : fallback;
  } catch (error) {
    console.error(
      `[cms] ${table}:`,
      error instanceof Error ? error.message : "Unknown CMS error.",
    );
    return fallback;
  }
}

export function getServices() {
  return loadCms<CmsService, CmsService[]>(
    "cms_services",
    "number,title,summary,items",
    staticServices,
    (rows) => rows,
  );
}

export function getProgrammes() {
  return loadCms<PairRow, CmsPair[]>(
    "cms_programmes",
    "title,description",
    staticProgrammes as CmsPair[],
    (rows) => rows.map((row) => [row.title, row.description]),
  );
}

export function getTrainingDays() {
  return loadCms<TrainingDayRow, CmsTrainingDay[]>(
    "cms_training_days",
    "day_number,title,description",
    staticTrainingDays as CmsTrainingDay[],
    (rows) => rows.map((row) => [
      String(row.day_number).padStart(2, "0"),
      row.title,
      row.description,
    ]),
  );
}

export function getAccreditedQualifications() {
  return loadCms<QualificationRow, CmsQualification[]>(
    "cms_qualifications",
    "code,title,nqf_level,duration",
    staticAccreditedQualifications,
    (rows) => rows.map((row) => ({
      code: row.code,
      title: row.title,
      nqf: row.nqf_level,
      duration: row.duration,
    })),
  );
}

function getPairs(table: string, fallback: CmsPair[]) {
  return loadCms<PairRow, CmsPair[]>(
    table,
    "title,description",
    fallback,
    (rows) => rows.map((row) => [row.title, row.description]),
  );
}

export function getDeliverySteps() {
  return getPairs("cms_delivery_steps", staticDeliverySteps as CmsPair[]);
}

export function getValues() {
  return getPairs("cms_values", staticValues as CmsPair[]);
}

export async function getCmsConnectionStatus() {
  if (!getSupabaseConfig()) {
    return { connected: false, reason: "missing_configuration" as const };
  }

  try {
    const rows = await fetchPublishedRows<CmsService>(
      "cms_services",
      "number",
    );
    return { connected: true, publishedServices: rows?.length ?? 0 };
  } catch {
    return { connected: false, reason: "request_failed" as const };
  }
}
