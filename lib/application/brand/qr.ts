import { absoluteUrl, getSiteUrl } from "@/lib/site";
import type { SiteBrandSettings } from "@/lib/domain/site-brand";

/** Résout l’URL encodée dans le QR produit (override admin ou défaut marque). */
export function resolveProductQrTarget(input: {
  slug: string;
  qrUrl?: string | null;
  settings: SiteBrandSettings;
}): string {
  const custom = String(input.qrUrl ?? "").trim();
  if (custom) {
    if (custom.startsWith("http://") || custom.startsWith("https://")) {
      return custom;
    }
    return absoluteUrl(custom.startsWith("/") ? custom : `/${custom}`);
  }

  const base = getSiteUrl().replace(/\/$/, "");
  switch (input.settings.qrDefaultMode) {
    case "product":
      return `${base}/boutique/${input.slug}`;
    case "diagnostic":
      return `${base}/diagnostic-capillaire`;
    case "custom": {
      const url = input.settings.qrCustomUrl.trim();
      if (!url) return `${base}/tutoriels?produit=${encodeURIComponent(input.slug)}`;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
    }
    case "tutorials":
    default:
      return `${base}/tutoriels?produit=${encodeURIComponent(input.slug)}`;
  }
}
