/**
 * Contenu de la page À propos.
 *
 * TODO: rendre éditable depuis l'admin
 * — Prévoir une table Supabase `about_content` (clé, locale, titre, corps, image_url, ordre)
 * — Remplacer ces constantes par un fetch via `/lib/connectors/supabase`
 * — Garder ce fichier comme fallback / seed tant que l'admin n'est pas branché
 */

export const ABOUT_IMAGES = {
  story: "/images/products/produit-2-demelant.jpg",
  mission: "/images/ingredients/ingredient-1.jpg",
} as const;

export const MISSION_KEYS = [
  "expertise",
  "natural",
  "results",
  "love",
] as const;

export const COMMITMENT_KEYS = [
  "naturality",
  "crueltyFree",
  "artisanal",
] as const;
