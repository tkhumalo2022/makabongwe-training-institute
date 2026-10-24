import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  currentAdminUser,
  demoLoginAvailable,
  safeNextPath,
} from "@/app/lib/admin-auth";
import LoginForm from "./LoginForm";
import styles from "./auth.module.css";

export const metadata: Metadata = {
  title: "Staff sign in",
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
  const demoEnabled = demoLoginAvailable();

  return (
    <main className={styles.page}>
      <div className={styles.loginLayout}>
        <aside className={styles.storyPanel} aria-label="Staff workspace introduction">
          <div className={styles.storyTop}>
            <span className={styles.storyRule} aria-hidden="true" />
            <span>Makabongwe / Staff workspace</span>
          </div>
          <div className={styles.storyContent}>
            <p className={styles.storyKicker}>Agricultural skills development</p>
            <h2>Every learner.<br /><em>Every next step.</em></h2>
            <p>
              Keep programme enquiries, applications and learner records
              organised in one private workspace.
            </p>
          </div>
          <div className={styles.storyFooter}>
            <span>Richards Bay, KwaZulu-Natal</span>
            <span>Authorised staff only</span>
          </div>
        </aside>

        <section className={styles.card} aria-labelledby="admin-login-title">
          <div className={styles.loginIdentity}>
            <img
              className={styles.officialLogo}
              src="/images/makabongwe-logo.webp"
              alt="Makabongwe Training Institute official logo"
              width={150}
              height={150}
            />
            <span className={styles.loginLabel}>Secure staff access</span>
          </div>
          <p className={styles.eyebrow}>Your administration workspace</p>
          <h1 id="admin-login-title">Welcome back.</h1>
          <p className={styles.intro}>
            Sign in to review applications, follow up enquiries and manage
            learner records.
          </p>
          <LoginForm
            siteKey={siteKey}
            next={next}
            demoEnabled={demoEnabled}
            initialMessage={
              params.reset === "1"
                ? "Password updated. Sign in with your new password."
                : ""
            }
          />
          <p className={styles.securityNote}>
            Use your authorised staff email. Need help accessing your account?
            Request a secure sign-in link or password reset above.
          </p>
        </section>
      </div>
    </main>
  );
}
