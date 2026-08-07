import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/compte",
          "/panier",
          "/commande",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/compte", "/panier", "/commande"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
