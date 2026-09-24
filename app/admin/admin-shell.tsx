import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminUser } from "@/app/lib/admin-auth";
import styles from "./admin.module.css";\nimport { AdminAssistant } from "./admin-assistant";

type AdminShellProps = {
  user: AdminUser;
  active: "overview" | "learners";
  statusText: string;
  statusTone?: "ok" | "demo" | "warn";
  children: ReactNode;
};

const navItems = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "enquiries", label: "Enquiries", href: "/admin#enquiries" },
  { key: "enrolments", label: "Enrolments", href: "/admin#enrolments" },
  { key: "learners", label: "Learner records", href: "/admin/learners" },
  { key: "programmes", label: "Programmes", href: "/admin#programmes" },
  { key: "quality", label: "Quality & records", href: "/admin#compliance" },
] as const;

export function AdminShell({
  user,
  active,
  statusText,
  statusTone = "ok",
  children,
}: AdminShellProps) {
  const statusClass =
    statusTone === "warn"
      ? styles.warnBadge
      : statusTone === "demo"
        ? styles.demoBadge
        : styles.badge;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Makabongwe Admin</strong>
            <span>Training operations</span>
          </div>

          <nav className={styles.nav} aria-label="Admin sections">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={item.key === active ? styles.navActive : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <strong>Provider AGRI/c prov/2859/24</strong>
            AgriSETA accreditation published as valid through 30 June 2028.
          </div>
        </aside>

        <div className={styles.main}>
          <div className={styles.topbar}>
            <div className={styles.userBlock}>
              <div className={styles.userDot} aria-hidden="true">
                {user.demo ? "D" : "A"}
              </div>
              <div className={styles.userCopy}>
                <strong>{user.demo ? "Demo administrator" : "Administrator"}</strong>
                <span>{user.email}</span>
              </div>
            </div>

            <div className={styles.badges}>
              <span className={statusClass}>{statusText}</span>
              <span className={styles.badge}>Secure session</span>
            </div>
          </div>

          {children}

          <div className={styles.footerActions}>
            <Link className={styles.linkButton} href="/" target="_blank">
              View public website
            </Link>
            <Link className={styles.linkButton} href="/programmes" target="_blank">
              View programmes
            </Link>
            <Link className={styles.linkButton} href="/contact" target="_blank">
              Test enquiry form
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className={styles.signOutButton} type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      <AdminAssistant />
    </main>
  );
}
