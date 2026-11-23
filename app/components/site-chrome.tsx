"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Keep the marketing site's chrome away from the private administration UI. */
export function SiteChrome({ placement }: { placement: "header" | "footer" }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/learn" || pathname.startsWith("/learn/")) return null;
  return placement === "header" ? <SiteHeader /> : <SiteFooter />;
}
