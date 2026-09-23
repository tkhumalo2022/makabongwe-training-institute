import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/admin-auth";
import ResetPasswordForm from "./ResetPasswordForm";
import styles from "../login/auth.module.css";

export const metadata: Metadata = {
  title: "Reset admin password | Makabongwe Training Institute",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  await requireAdmin("/admin/reset-password");

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="reset-password-title">
        <div className={styles.brandMark}>MTI</div>
        <p className={styles.eyebrow}>Account recovery</p>
        <h1 id="reset-password-title">Choose a new password</h1>
        <p className={styles.intro}>
          Use at least 12 characters. You will be signed out after the change
          and will sign in again with the new password.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
