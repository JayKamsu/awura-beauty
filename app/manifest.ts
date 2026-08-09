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
    theme_color: "#0F3D2E",
    lang: "fr",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/brand/logo-black.png",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
