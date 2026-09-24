import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACCESS_COOKIE = "mti_admin_access";
const REFRESH_COOKIE = "mti_admin_refresh";
const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const PREVIEW_DEMO_TOKEN = "__mti_preview_demo__";

export type AdminUser = {
  id: string;
  email: string;
  demo?: boolean;
};

type SupabaseUser = {
  id: string;
  email?: string | null;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseUser;
  error?: string;
  error_description?: string;
  msg?: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function demoLoginAvailable() {
  return process.env.VERCEL_ENV === "preview";
}

function getAuthConfig() {
  const url = readEnv("SUPABASE_URL").replace(/\/+$/, "");
  const key =
    readEnv("SUPABASE_PUBLISHABLE_KEY") ||
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) return null;
  return { url, key };
}

function adminEmailSet() {
  return new Set(
    readEnv("MAKABONGWE_ADMIN_EMAILS")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmailSet().has(email.trim().toLowerCase());
}

function cookieName(base: string) {
  return process.env.NODE_ENV === "production" ? "__Host-" + base : base;
}

function authHeaders(key: string, accessToken?: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "content-type": "application/json",
  };
  if (accessToken) headers.Authorization = "Bearer " + accessToken;
  return headers;
}

async function authFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
) {
  const config = getAuthConfig();
  if (!config) return null;

  return fetch(config.url + path, {
    ...init,
    headers: {
      ...authHeaders(config.key, accessToken),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function signInWithPassword(email: string, password: string) {
  const response = await authFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response?.ok) return null;

  const tokens = (await response.json()) as TokenResponse;
  if (
    !tokens.access_token ||
    !tokens.refresh_token ||
    !tokens.user?.email ||
    !isAdminEmail(tokens.user.email)
  ) {
    return null;
  }
  return tokens;
}

export async function sendMagicLink(email: string, redirectTo: string) {
  const response = await authFetch(
    "/auth/v1/otp?redirect_to=" + encodeURIComponent(redirectTo),
    {
      method: "POST",
      body: JSON.stringify({ email, create_user: false }),
    },
  );
  return Boolean(response?.ok);
}

export async function sendPasswordRecovery(email: string, redirectTo: string) {
  const response = await authFetch(
    "/auth/v1/recover?redirect_to=" + encodeURIComponent(redirectTo),
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
  return Boolean(response?.ok);
}

export async function validateAccessToken(
  accessToken: string,
): Promise<AdminUser | null> {
  if (accessToken === PREVIEW_DEMO_TOKEN) {
    if (!demoLoginAvailable()) return null;
    return {
      id: "preview-demo",
      email: "demo@makabongwe.local",
      demo: true,
    };
  }

  const response = await authFetch("/auth/v1/user", { method: "GET" }, accessToken);
  if (!response?.ok) return null;

  const user = (await response.json()) as SupabaseUser;
  if (!user.id || !user.email || !isAdminEmail(user.email)) return null;

  return {
    id: user.id,
    email: user.email.toLowerCase(),
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await authFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response?.ok) return null;

  const tokens = (await response.json()) as TokenResponse;
  if (!tokens.access_token || !tokens.refresh_token) return null;
  return tokens;
}

export async function changePassword(accessToken: string, password: string) {
  const response = await authFetch(
    "/auth/v1/user",
    {
      method: "PUT",
      body: JSON.stringify({ password }),
    },
    accessToken,
  );
  return Boolean(response?.ok);
}

export async function revokeSession(
  accessToken: string,
  scope: "local" | "global" = "local",
) {
  if (accessToken === PREVIEW_DEMO_TOKEN) return;

  await authFetch(
    "/auth/v1/logout?scope=" + scope,
    { method: "POST", body: "{}" },
    accessToken,
  );
}

export async function setAuthCookies(tokens: TokenResponse) {
  if (!tokens.access_token || !tokens.refresh_token) return false;

  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };

  store.set(cookieName(ACCESS_COOKIE), tokens.access_token, {
    ...baseOptions,
    maxAge: Math.max(60, tokens.expires_in ?? 3600),
  });
  store.set(cookieName(REFRESH_COOKIE), tokens.refresh_token, {
    ...baseOptions,
    maxAge: DEFAULT_REFRESH_MAX_AGE,
  });

  return true;
}

export async function setDemoAuthCookie() {
  if (!demoLoginAvailable()) return false;

  const store = await cookies();
  store.set(cookieName(ACCESS_COOKIE), PREVIEW_DEMO_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60,
  });
  return true;
}

export async function clearAuthCookies() {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 0,
  };
  store.set(cookieName(ACCESS_COOKIE), "", options);
  store.set(cookieName(REFRESH_COOKIE), "", options);
}

export async function getSessionTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(cookieName(ACCESS_COOKIE))?.value ?? null,
    refreshToken: store.get(cookieName(REFRESH_COOKIE))?.value ?? null,
  };
}

export async function currentAdminUser() {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) return null;
  return validateAccessToken(accessToken);
}

export function safeNextPath(value: string | null | undefined, fallback = "/admin") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "https://makabongwe.local");
    if (url.origin !== "https://makabongwe.local") return fallback;
    if (url.pathname.startsWith("/api/auth/")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export async function requireAdmin(returnTo = "/admin") {
  const user = await currentAdminUser();
  if (user) return user;

  const { refreshToken } = await getSessionTokens();
  if (refreshToken) {
    redirect("/api/auth/refresh?next=" + encodeURIComponent(safeNextPath(returnTo)));
  }

  redirect("/admin/login?next=" + encodeURIComponent(safeNextPath(returnTo)));
}
