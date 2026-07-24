import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import "./mobile-header-fix.css";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Makabongwe Training Institute",
    template: "%s | Makabongwe Training Institute",
  },
  description:
    "Practical agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
  icons: {
    icon: [
      { url: "/images/makabongwe-logo.webp", type: "image/webp" },
    ],
    shortcut: "/images/makabongwe-logo.webp",
    apple: "/images/makabongwe-logo.webp",
  },
  verification: {
    google: "Ha8mFSdG3jPgIgX_VB7HwDsyFQST4jPipeFqXTXmrAY",
  },
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
