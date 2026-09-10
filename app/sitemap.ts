import type { MetadataRoute } from "next";
import {
  listAllProductSlugs,
  listBlogSlugs,
} from "@/lib/infrastructure/supabase";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/boutique",
    "/recherche",
    "/diagnostic-capillaire",
    "/a-propos",
    "/blog",
    "/tutoriels",
    "/contact",
    "/temoignages",
    "/informations-entreprise",
    "/mentions-legales",
    "/conditions-utilisation",
    "/politique-de-retour",
    "/retractation",
    "/confidentialite",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency:
      path === "" || path === "/boutique"
        ? "daily"
        : path.startsWith("/mentions") ||
            path.startsWith("/conditions") ||
            path.startsWith("/politique") ||
            path.startsWith("/retractation") ||
            path.startsWith("/confidentialite") ||
            path.startsWith("/informations")
          ? "monthly"
          : "weekly",
    priority:
      path === ""
        ? 1
        : path === "/boutique"
          ? 0.95
          : path === "/diagnostic-capillaire"
            ? 0.9
            : path === "/a-propos"
              ? 0.8
              : path.startsWith("/mentions") ||
                  path.startsWith("/conditions") ||
                  path.startsWith("/politique") ||
                  path.startsWith("/retractation") ||
                  path.startsWith("/confidentialite") ||
                  path.startsWith("/informations")
                ? 0.4
                : 0.7,
  }));

  const [productSlugs, articleSlugs, tutorialSlugs] = await Promise.all([
    listAllProductSlugs(),
    listBlogSlugs("article"),
    listBlogSlugs("tutorial"),
  ]);

  const products: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${base}/boutique/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const articles: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const tutorials: MetadataRoute.Sitemap = tutorialSlugs.map((slug) => ({
    url: `${base}/tutoriels/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticRoutes, ...products, ...articles, ...tutorials];
}
