import { items } from "@wix/data";
import { ApiKeyStrategy, createClient } from "@wix/sdk";
import { accreditedQualifications, programmes } from "../data";

export type CourseCategory = "accredited" | "flagship" | "short-course";

export type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: CourseCategory;
  saqaId: string | null;
  nqfLevel: string | null;
  duration: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  capacity: number | null;
  availableSpaces: number | null;
  normalPrice: number | null;
  earlyBirdPrice: number | null;
  earlyBirdDeadline: string | null;
  accreditationValidUntil: string | null;
  featured: boolean;
  displayOrder: number;
  coverImage: string | null;
};

type WixCmsConfig = {
  apiKey: string;
  siteId: string;
  collectionId: string;
};

type WixCourseItem = Record<string, unknown> & { _id: string };

const accreditedFallback: Course[] = accreditedQualifications.map(
  (qualification, index) => ({
    id: `fallback-accredited-${qualification.code}`,
    title: qualification.title,
    slug: `saqa-${qualification.code}`,
    summary: `${qualification.title}, ${qualification.nqf}, delivered over ${qualification.duration}.`,
    category: "accredited",
    saqaId: qualification.code,
    nqfLevel: qualification.nqf,
    duration: qualification.duration,
    location: null,
    startDate: null,
    endDate: null,
    applicationDeadline: null,
    capacity: null,
    availableSpaces: null,
    normalPrice: null,
    earlyBirdPrice: null,
    earlyBirdDeadline: null,
    accreditationValidUntil: "2028-06-30",
    featured: index === 0,
    displayOrder: index + 1,
    coverImage: null,
  }),
);

const flagshipFallback: Course = {
  id: "fallback-azibuye-emasisweni",
  title: "Azibuye Emasisweni",
  slug: "azibuye-emasisweni",
  summary:
    "A structured poultry enterprise-development programme for 100 unemployed youth and families, combining practical training, enterprise preparation, starter support and mentorship.",
  category: "flagship",
  saqaId: null,
  nqfLevel: null,
  duration: "10 training days",
  location: "Richards Bay, KwaZulu-Natal",
  startDate: null,
  endDate: null,
  applicationDeadline: null,
  capacity: 100,
  availableSpaces: 100,
  normalPrice: null,
  earlyBirdPrice: null,
  earlyBirdDeadline: null,
  accreditationValidUntil: null,
  featured: true,
  displayOrder: 100,
  coverImage: "/images/poultry-programme.webp",
};

const packagedFallback: Course[] = programmes.map(
  ([title, summary], index) => ({
    id: `fallback-short-course-${index + 1}`,
    title,
    slug: slugify(title),
    summary,
    category: "short-course",
    saqaId: null,
    nqfLevel: null,
    duration: "Confirmed per intake",
    location: null,
    startDate: null,
    endDate: null,
    applicationDeadline: null,
    capacity: null,
    availableSpaces: null,
    normalPrice: null,
    earlyBirdPrice: null,
    earlyBirdDeadline: null,
    accreditationValidUntil: null,
    featured: false,
    displayOrder: 200 + index,
    coverImage: null,
  }),
);

const fallbackCourses = [
  ...accreditedFallback,
  flagshipFallback,
  ...packagedFallback,
];

let cmsClient: ReturnType<typeof createCmsClient> | null = null;

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getCmsConfig(): WixCmsConfig | null {
  const apiKey = readEnv("WIX_API_KEY");
  const siteId = readEnv("WIX_SITE_ID");

  if (!apiKey || !siteId) {
    return null;
  }

  return {
    apiKey,
    siteId,
    collectionId: readEnv("WIX_COURSES_COLLECTION_ID") || "Courses",
  };
}

function createCmsClient(config: WixCmsConfig) {
  return createClient({
    modules: { items },
    auth: ApiKeyStrategy({
      apiKey: config.apiKey,
      siteId: config.siteId,
    }),
  });
}

function getCmsClient(config: WixCmsConfig) {
  if (!cmsClient) {
    cmsClient = createCmsClient(config);
  }

  return cmsClient;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || null;
}

function optionalNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function dateString(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}

function category(value: unknown): CourseCategory {
  if (value === "accredited" || value === "flagship") {
    return value;
  }

  return "short-course";
}

function mapCourse(item: WixCourseItem): Course | null {
  const title = text(item.title);
  if (!title || item.isPublished === false) {
    return null;
  }

  return {
    id: item._id,
    title,
    slug: text(item.slug) || slugify(title),
    summary: text(item.summary),
    category: category(item.category),
    saqaId: optionalText(item.saqaId),
    nqfLevel: optionalText(item.nqfLevel),
    duration: text(item.duration) || "Confirmed per intake",
    location: optionalText(item.location),
    startDate: dateString(item.startDate),
    endDate: dateString(item.endDate),
    applicationDeadline: dateString(item.applicationDeadline),
    capacity: optionalNumber(item.capacity),
    availableSpaces: optionalNumber(item.availableSpaces),
    normalPrice: optionalNumber(item.normalPrice),
    earlyBirdPrice: optionalNumber(item.earlyBirdPrice),
    earlyBirdDeadline: dateString(item.earlyBirdDeadline),
    accreditationValidUntil: dateString(item.accreditationValidUntil),
    featured: item.featured === true,
    displayOrder: optionalNumber(item.displayOrder) ?? 999,
    coverImage: optionalText(item.coverImage),
  };
}

export async function getCourses(): Promise<Course[]> {
  const config = getCmsConfig();
  if (!config) {
    return fallbackCourses;
  }

  try {
    const result = await getCmsClient(config).items
      .query(config.collectionId)
      .limit(100)
      .find();
    const cmsItems = result.items as WixCourseItem[];
    const courses = cmsItems
      .map((item) => mapCourse(item))
      .filter((course): course is Course => course !== null)
      .sort((left, right) => left.displayOrder - right.displayOrder);

    return courses.length > 0 ? courses : fallbackCourses;
  } catch (error) {
    console.error("Unable to load Courses from Wix CMS.", error);
    return fallbackCourses;
  }
}

export async function getAccreditedCourses() {
  const courses = await getCourses();
  return courses.filter((course) => course.category === "accredited");
}
