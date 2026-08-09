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
  "AwuraBeauty",
  "Awura",
  "awurabeauty.com",
  "soins capillaires naturels",
  "soins cheveux afro",
  "cheveux texturés",
  "cheveux afro",
  "cheveux crépus",
  "cheveux bouclés",
  "cheveux métissés",
  "beurre capillaire",
  "masque capillaire",
  "démêlant nourrissant",
  "lotion repousse",
  "savon solide cheveux",
  "routine capillaire afro",
  "diagnostic capillaire",
  "cosmétique naturelle France",
  "marque afro hair France",
] as const;

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "Care@awurabeauty.com";

/** Infos légales optionnelles (reçus / mentions). */
export const COMPANY_LEGAL_NAME =
  process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ?? SITE_NAME;
export const COMPANY_ADDRESS =
  process.env.NEXT_PUBLIC_COMPANY_ADDRESS?.trim() || null;
export const COMPANY_SIRET =
  process.env.NEXT_PUBLIC_COMPANY_SIRET?.trim() || null;
export const COMPANY_VAT =
  process.env.NEXT_PUBLIC_COMPANY_VAT?.trim() || null;

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
