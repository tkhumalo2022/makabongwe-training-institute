import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/admin-auth";
import styles from "./login/auth.module.css";

export const metadata: Metadata = {
  title: "Admin | Makabongwe Training Institute",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await requireAdmin("/admin");

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminShell}>
        <section className={styles.adminHeader}>
          <p className={styles.eyebrow}>Makabongwe Training Institute</p>
          <h1>Admin area</h1>
          <p>
            Signed in as {user.email}. This area is protected server-side and
            only authorized staff accounts can enter.
          </p>
        </section>

        <section className={styles.adminPanel}>
          <p className={styles.status}>Secure session active</p>
          <h2>Admin foundation is ready</h2>
          <p>
            The secure login, recovery and session layer is in place. Content
            management controls can be added here without exposing privileged
            Supabase credentials to the browser.
          </p>

          <div className={styles.adminActions}>
            <Link href="/">View public website</Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
