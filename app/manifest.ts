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
    // Requis par Firebase Cloud Messaging (getToken échoue sans ça sur certains
    // navigateurs) — champ non typé par Next.js mais reconnu par Chrome/FCM.
    ...({ gcm_sender_id: "103953800507" } as Record<string, string>),
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
