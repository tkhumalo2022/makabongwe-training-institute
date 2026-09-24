"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type RouteChromeProps = {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
};

export function RouteChrome({
  children,
  header,
  footer,
}: RouteChromeProps) {
  const pathname = usePathname();
  const isInternalRoute =
    pathname === "/admin" ||
    pathname?.startsWith("/admin/") ||
    pathname === "/auth" ||
    pathname?.startsWith("/auth/");

  if (isInternalRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
