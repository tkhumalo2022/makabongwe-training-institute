import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout"],
    },
    sitemap: "https://www.makabongwe.network/sitemap.xml",
    host: "https://www.makabongwe.network",
  };
}
