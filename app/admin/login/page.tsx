import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdminUser, safeNextPath } from "@/app/lib/admin-auth";
import LoginForm from "./LoginForm";
import styles from "./auth.module.css";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; reset?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await currentAdminUser();
  if (user) redirect(next);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <div className={styles.brandMark}>MTI</div>
        <p className={styles.eyebrow}>Makabongwe Training Institute</p>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p className={styles.intro}>
          Secure access for authorized Makabongwe staff. Your password is never
          stored by this website.
        </p>
        <LoginForm\n          siteKey={siteKey}\n          next={next}\n          initialMessage={\n            params.reset === "1"\n              ? "Password updated. Sign in with your new password."\n              : ""\n          }\n        />
        <p className={styles.securityNote}>
          Protected with secure sessions, account allowlisting and Cloudflare
          Turnstile.
        </p>
      </section>
    </main>
  );
}
