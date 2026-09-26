"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your secure link…");

  useEffect(() => {
    async function complete() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const expiresIn = Number(hash.get("expires_in") ?? "3600");
      const type = hash.get("type");
      const error = hash.get("error_description");

      window.history.replaceState(null, "", window.location.pathname);

      if (error || !accessToken || !refreshToken) {
        setMessage("This link is invalid or has expired. Request a new one.");
        return;
      }

      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: Number.isFinite(expiresIn) ? expiresIn : 3600,
          }),
        });
        if (!response.ok) {
          setMessage("This account is not authorized for admin access.");
          return;
        }

        router.replace(type === "recovery" ? "/admin/reset-password" : "/admin");
        router.refresh();
      } catch {
        setMessage("We could not verify the link. Please try again.");
      }
    }

    void complete();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 20px",
        background: "#f4f0e5",
      }}
    >
      <section style={{ maxWidth: 520, background: "#fff", padding: 36 }}>
        <p style={{ color: "#073d2a", fontWeight: 800 }}>Makabongwe Admin</p>
        <h1>Secure sign-in</h1>
        <p>{message}</p>
        <Link href="/admin/login" style={{ color: "#073d2a", fontWeight: 750 }}>
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
