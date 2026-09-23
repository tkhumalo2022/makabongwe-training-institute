"use client";

import Script from "next/script";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

type LoginFormProps = {
  siteKey: string;
  next: string;
  initialMessage?: string;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
};

export default function LoginForm({
  siteKey,
  next,
  initialMessage = "",
}: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState<"login" | "magic" | "recovery" | null>(null);

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

    if (!email) {
      setMessage("Enter your email address first.");
      return;
    }
    if (!token) {
      setMessage("Complete the security check first.");
      return;
    }

    setBusy(mode);
    try {
      const { data } = await post("/api/auth/request-link", {
        email,
        mode,
        turnstileToken: token,
      });
      setMessage(
        data.message ??
          "If that email is authorized, a secure sign-in message is on its way.",
      );
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

      <form ref={formRef} className={styles.form} onSubmit={handleLogin}>
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

        <label>
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            maxLength={256}
            required
          />
        </label>

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
            Login protection is being configured. Please try again shortly.
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
