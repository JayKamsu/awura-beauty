/**
 * Fallbacks images / clés À propos.
 * Contenu éditable via Admin → Pages (CMS `page_sections`).
 */

/** Images de secours pour la page À propos si le CMS ne fournit pas d'URL. */
export const ABOUT_IMAGES = {
  story: "/images/products/produit-2-demelant.jpg",
  mission: "/images/ingredients/ingredient-1.jpg",
} as const;

/** Clés ordonnées des blocs de mission affichés dans la section correspondante. */
export const MISSION_KEYS = [
  "expertise",
  "natural",
  "results",
  "love",
] as const;

/** Clés ordonnées des engagements affichés dans la section correspondante. */
export const COMMITMENT_KEYS = [
  "naturality",
  "crueltyFree",
  "artisanal",
] as const;
