"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(data.message ?? "Password could not be updated.");
        return;
      }

      router.replace("/admin/login?reset=1");
      router.refresh();
    } catch {
      setMessage("Password could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>
        <span>New password</span>
        <input
          type="password"
          name="password"
          minLength={12}
          maxLength={256}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        <span>Confirm new password</span>
        <input
          type="password"
          name="confirm"
          minLength={12}
          maxLength={256}
          autoComplete="new-password"
          required
        />
      </label>
      {message ? (
        <p className={styles.message} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      <button className={styles.primary} type="submit" disabled={busy}>
        {busy ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}
