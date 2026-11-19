import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { currentAdminUser, demoLoginAvailable, safeNextPath } from "@/app/lib/admin-auth";
import LoginForm from "./LoginForm";
import styles from "./auth.module.css";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
type LoginPageProps = { searchParams: Promise<{ next?: string; reset?: string }> };

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const user = await currentAdminUser();
  if (user) redirect(next);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const demoEnabled = demoLoginAvailable();

  return (
    <main className={styles.page}>
      <Image className={styles.landscape} src="/images/hero-agriculture.webp" alt="" fill priority sizes="100vw" />
      <div className={styles.shade} aria-hidden="true" />
      <a className={styles.backLink} href="/">Back to Makabongwe <span aria-hidden="true">↗</span></a>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <a className={styles.brand} href="/" aria-label="Makabongwe Training Institute home">
          <Image src="/images/makabongwe-logo.webp" alt="" width={56} height={56} />
          <span>Makabongwe<small>Training Institute</small></span>
        </a>
        <h1 id="admin-login-title">Staff sign in</h1>
        <p className={styles.intro}>Enquiries, enrolments and learner records.</p>
        <LoginForm
          siteKey={siteKey}
          next={next}
          demoEnabled={demoEnabled}
          initialMessage={params.reset === "1" ? "Password updated. Sign in with your new password." : ""}
        />
        <p className={styles.securityNote}>For authorised Makabongwe staff.</p>
      </section>
      <aside className={styles.fieldNote} aria-label="About Makabongwe">
        <p>Practical agricultural training</p>
        <span>Richards Bay, KwaZulu-Natal</span>
      </aside>
    </main>
  );
}
