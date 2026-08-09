import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const PRIVATE = [
  "/admin",
  "/admin/",
  "/api/",
  "/auth/",
  "/compte",
  "/panier",
  "/commande",
] as const;

/** Bots IA / moteurs génératifs — allow contenu public (GEO). */
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Google-Extended",
  "GoogleOther",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Bytespider",
  "Applebot-Extended",
  "Amazonbot",
  "meta-externalagent",
  "FacebookBot",
  "CCBot",
  "Diffbot",
  "Cohere-ai",
  "DuckAssistBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: [...PRIVATE],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
