import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Awura",
    description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    start_url: "/",
    display: "standalone",
    background_color: "#faf3ec",
    theme_color: "#1b3323",
    lang: "fr",
    icons: [
      {
        src: "/images/brand/logo-orange.png",
        sizes: "827x638",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
