/**
 * Constantes publiques du site — source de vérité SEO / GEO / contact.
 * Toujours viser la production ; localhost n’est qu’un fallback de dev.
 */

export const SITE_NAME = "Awura Beauty";

export const SITE_TAGLINE =
  "Soins capillaires naturels et premium pour cheveux texturés, afro et métissés";

export const SITE_DESCRIPTION =
  "Awura Beauty propose des soins capillaires naturels et premium (beurre, masque, démêlant, lotion repousse, savon solide) pensés pour les cheveux texturés, afro et métissés. Diagnostic capillaire, blog et boutique en ligne.";

export const SITE_KEYWORDS = [
  "Awura Beauty",
  "soins capillaires naturels",
  "cheveux texturés",
  "cheveux afro",
  "cheveux crépus",
  "cheveux métissés",
  "beurre capillaire",
  "masque capillaire",
  "démêlant nourrissant",
  "lotion repousse",
  "savon solide cheveux",
  "routine capillaire afro",
  "cosmétique naturelle France",
] as const;

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "Care@awurabeauty.com";

/** URL canonique du site (prod = https://awurabeauty.com). Fallback localhost en dev. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
