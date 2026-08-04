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
  metadataBase: new URL("https://www.makabongwe.network"),
  title: {
    default: "Makabongwe Training Institute",
    template: "%s | Makabongwe Training Institute",
  },
  description:
    "Practical agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Makabongwe Training Institute",
    title: "Makabongwe Training Institute",
    description:
      "Practical agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
    images: [
      {
        url: "/images/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Makabongwe Training Institute homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Makabongwe Training Institute",
    description:
      "Practical agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
    images: ["/images/social-preview.png"],
  },
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
