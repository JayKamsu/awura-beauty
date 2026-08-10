/** Pack boutique : les 5 soins Awura + diagnostic présentiel offert. */
export const GAMME_COMPLETE_SLUG = "gamme-complete";
export const GAMME_COMPLETE_PRICE_EUR = 100;

/** Ordre catalogue de la gamme (identique à AWURA_PRODUCT_SLUGS). */
export const GAMME_COMPLETE_COMPONENT_SLUGS = [
  "savon-solide",
  "demelant-nourrissant",
  "masque-capillaire",
  "lotion-repousse",
  "beurre-capillaire",
] as const;

/** Slug d'un des 5 produits composant la gamme complète. */
export type GammeCompleteComponentSlug =
  (typeof GAMME_COMPLETE_COMPONENT_SLUGS)[number];

/** Vérifie si un slug correspond au pack gamme complète. */
export function isGammeCompleteSlug(slug: string): boolean {
  return slug.trim() === GAMME_COMPLETE_SLUG;
}

/** Compte les unités du pack gamme complète présentes dans une commande (ignore les autres lignes). */
export function gammeCompleteUnitsInOrder(
  items: Array<{ slug: string; quantity: number }>,
): number {
  return items.reduce((sum, item) => {
    if (!isGammeCompleteSlug(item.slug)) return sum;
    return sum + Math.max(0, Math.floor(item.quantity));
  }, 0);
}
