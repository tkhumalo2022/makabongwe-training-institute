import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Makabongwe Training Institute",
    short_name: "Makabongwe",
    description:
      "Accredited agricultural training, enterprise development and community programmes in Richards Bay, KwaZulu-Natal.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf5",
    theme_color: "#073d2a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/images/makabongwe-logo.webp",
        sizes: "any",
        type: "image/webp",
        purpose: "any maskable",
      },
    ],
  };
}
