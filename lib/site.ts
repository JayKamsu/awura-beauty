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

/** Directrice de la publication (mentions légales). */
export const COMPANY_DIRECTOR = "Mariama Diallo";

/** Hébergeur du site (LCEN) — Vercel, derrière le domaine Hostinger. */
export const HOSTING_PROVIDER = "Vercel Inc.";
export const HOSTING_ADDRESS =
  "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis";
export const HOSTING_WEBSITE = "https://vercel.com";

/** Profil public affiché sur les pages légales. */
export function getPublicCompanyProfile() {
  return {
    legalName: SITE_NAME,
    tradeName: SITE_NAME,
    director: COMPANY_DIRECTOR,
    email: CONTACT_EMAIL,
    siteUrl: getSiteUrl(),
  };
}

/** URL canonique du site (prod = https://awurabeauty.com). Fallback localhost en dev. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Construit une URL absolue à partir d’un chemin du site. */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
