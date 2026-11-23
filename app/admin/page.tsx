import type { Metadata } from "next";
import AdminClient from "./admin-client";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administration | Makabongwe",
  description: "Private programme operations dashboard for Makabongwe administrators.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminPage() {
  return <AdminClient />;
}
