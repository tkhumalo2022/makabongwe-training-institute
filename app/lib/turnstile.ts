const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function requestIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp;

  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
}

export async function verifyTurnstile(request: Request, token: unknown) {
  if (
    process.env.NODE_ENV !== "production" &&
    readEnv("TURNSTILE_DEV_BYPASS") === "true"
  ) {
    return true;
  }

  const secret = readEnv("TURNSTILE_SECRET_KEY");
  if (!secret || typeof token !== "string" || !token.trim()) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  const remoteip = requestIp(request);
  if (remoteip) body.set("remoteip", remoteip);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    });
    if (!response.ok) return false;

    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
