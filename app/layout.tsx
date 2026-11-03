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
    default: "Agricultural Training Richards Bay | Makabongwe Training Institute",
    template: "%s | Makabongwe Training Institute",
  },
  description:
    "AgriSETA-accredited agricultural qualifications and practical farming programmes in Richards Bay, with enterprise development and mentorship.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Makabongwe Training Institute",
    title: "Makabongwe Training Institute",
    description:
      "AgriSETA-accredited agricultural qualifications and practical farming programmes in Richards Bay, with enterprise development and mentorship.",
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
      "AgriSETA-accredited agricultural qualifications and practical farming programmes in Richards Bay, with enterprise development and mentorship.",
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": "https://www.makabongwe.network/#organization",
  name: "Makabongwe Training Institute",
  url: "https://www.makabongwe.network/",
  description: "Agricultural skills training, accredited qualifications, enterprise development and mentorship in Richards Bay, KwaZulu-Natal.",
  telephone: "+27812148384",
  email: "makabongweprojectsptyd@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "12A Chat Crescent",
    addressLocality: "Richards Bay",
    addressRegion: "KwaZulu-Natal",
    postalCode: "3900",
    addressCountry: "ZA",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
