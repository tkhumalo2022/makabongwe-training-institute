import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import "./mobile-header-fix.css";
import "./accessibility.css";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = "https://www.makabongwe.network";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Makabongwe Training Institute | Accredited Agricultural Training",
    template: "%s | Makabongwe Training Institute",
  },
  description:
    "Practical, accredited agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
  applicationName: "Makabongwe Training Institute",
  authors: [{ name: "Makabongwe Training Institute", url: siteUrl }],
  creator: "Makabongwe Training Institute",
  publisher: "Makabongwe Training Institute",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Makabongwe Training Institute",
    title: "Makabongwe Training Institute | Accredited Agricultural Training",
    description:
      "Build practical agricultural skills through accredited training, enterprise support and community-focused programmes.",
    images: [{
      url: "/images/hero-agriculture.webp",
      width: 1200,
      height: 630,
      alt: "Makabongwe agricultural trainees learning practical crop production",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Makabongwe Training Institute | Accredited Agricultural Training",
    description:
      "Practical agricultural training, enterprise development and community programmes in Richards Bay.",
    images: ["/images/hero-agriculture.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/images/makabongwe-logo.webp", type: "image/webp" }],
    shortcut: "/images/makabongwe-logo.webp",
    apple: "/images/makabongwe-logo.webp",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "Ha8mFSdG3jPgIgX_VB7HwDsyFQST4jPipeFqXTXmrAY",
  },
  category: "education",
};

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "Organization"],
  name: "Makabongwe Training Institute",
  url: siteUrl,
  logo: `${siteUrl}/images/makabongwe-logo.webp`,
  image: `${siteUrl}/images/hero-agriculture.webp`,
  description:
    "Practical, accredited agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
  telephone: "+27 81 214 8384",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Richards Bay",
    addressRegion: "KwaZulu-Natal",
    addressCountry: "ZA",
  },
  areaServed: {
    "@type": "AdministrativeArea",
    name: "KwaZulu-Natal",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body className={`${geistSans.variable} antialiased`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
        />
      </body>
    </html>
  );
}
