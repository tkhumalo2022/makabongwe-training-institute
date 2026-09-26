"use client";

import Script from "next/script";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

type LoginFormProps = {
  siteKey: string;
  next: string;
  demoEnabled: boolean;
  initialMessage?: string;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
};

export default function LoginForm({
  siteKey,
  next,
  demoEnabled,
  initialMessage = "",
}: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"login" | "magic" | "recovery" | "demo" | null>(null);

  function turnstileToken() {
    return (
      formRef.current?.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      )?.value ?? ""
    );
  }

  function resetTurnstile() {
    const turnstile = (
      window as typeof window & {
        turnstile?: { reset: () => void };
      }
    ).turnstile;
    turnstile?.reset();
  }

  async function post(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    return { response, data };
  }

  async function handleDemoLogin() {
    setMessage("");
    setBusy("demo");

    try {
      const { response, data } = await post("/api/auth/login", { demo: true });
      if (response.ok && data.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      setMessage(data.message ?? "Demo sign in failed. Please try again.");
    } catch {
      setMessage("Demo sign in is temporarily unavailable. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const token = turnstileToken();

    if (!token) {
      setMessage("Complete the security check first.");
      return;
    }

    setBusy("login");
    try {
      const { response, data } = await post("/api/auth/login", {
        email,
        password,
        turnstileToken: token,
      });
      if (response.ok && data.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      setMessage(data.message ?? "Sign in failed. Please try again.");
      resetTurnstile();
    } catch {
      setMessage("Sign in is temporarily unavailable. Please try again.");
      resetTurnstile();
    } finally {
      setBusy(null);
    }
  }

  async function requestLink(mode: "magic" | "recovery") {
    setMessage("");
    const form = new FormData(formRef.current ?? undefined);
    const email = String(form.get("email") ?? "").trim();
    const token = turnstileToken();

    const emailInput = formRef.current?.elements.namedItem("email") as HTMLInputElement | null;
    if (!email || !emailInput?.checkValidity()) {
      setMessage("Enter a valid email address first.");
      emailInput?.focus();
      return;
    }
    if (!token) {
      setMessage("Complete the security check first.");
      return;
    }

    setBusy(mode);
    try {
      const { response, data } = await post("/api/auth/request-link", {
        email,
        mode,
        turnstileToken: token,
      });
      setMessage(data.message ?? (response.ok
        ? "If that email is authorized, check your inbox and spam folder for the link."
        : "We could not send the email right now. Please try again."));
      resetTurnstile();
    } catch {
      setMessage("We could not send the email right now. Please try again.");
      resetTurnstile();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}

      <form ref={formRef} className={styles.form} onSubmit={handleLogin} method="post" action="/api/auth/login" aria-busy={busy !== null}>
        {demoEnabled ? (
          <>
            <button
              className={styles.primary}
              type="button"
              disabled={busy !== null}
              onClick={handleDemoLogin}
            >
              {busy === "demo" ? "Opening demo…" : "Continue with demo admin"}
            </button>
            <p className={styles.securityNote}>
              Explore with sample records. No password is needed and real learner records stay private.
            </p>
            <div className={styles.divider} aria-hidden="true">
              <span>real admin</span>
            </div>
          </>
        ) : null}

        <label>
          <span>Email address</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            maxLength={254}
            required
          />
        </label>

        <div className={styles.passwordField}>
          <label htmlFor="admin-password">Password</label>
          <div className={styles.passwordControl}>
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            maxLength={256}
            required
          />
          <button type="button" className={styles.passwordToggle} aria-controls="admin-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
            {showPassword ? "Hide password" : "Show password"}
          </button>
          </div>
        </div>

        {siteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            data-theme="light"
            data-size="flexible"
            aria-label="Security verification"
          />
        ) : (
          <p className={styles.configWarning}>
            Staff sign-in is not ready yet. {demoEnabled ? "Use the demo above to explore the admin." : "Please contact the site administrator for help."}
          </p>
        )}

        {message ? (
          <p className={styles.message} role="status" aria-live="polite">
            {message}
          </p>
        ) : null}

        <button className={styles.primary} type="submit" disabled={busy !== null || !siteKey}>
          {busy === "login" ? "Signing in…" : "Sign in"}
        </button>

        <div className={styles.divider} aria-hidden="true">
          <span>or</span>
        </div>

        <button
          className={styles.secondary}
          type="button"
          disabled={busy !== null || !siteKey}
          onClick={() => requestLink("magic")}
        >
          {busy === "magic" ? "Sending secure link…" : "Email me a secure sign-in link"}
        </button>

        <button
          className={styles.textButton}
          type="button"
          disabled={busy !== null || !siteKey}
          onClick={() => requestLink("recovery")}
        >
          {busy === "recovery" ? "Sending reset email…" : "Forgot password?"}
        </button>
      </form>
    </>
  );
}
