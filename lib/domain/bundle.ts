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

export type GammeCompleteComponentSlug =
  (typeof GAMME_COMPLETE_COMPONENT_SLUGS)[number];

export function isGammeCompleteSlug(slug: string): boolean {
  return slug.trim() === GAMME_COMPLETE_SLUG;
}

export function gammeCompleteUnitsInOrder(
  items: Array<{ slug: string; quantity: number }>,
): number {
  return items.reduce((sum, item) => {
    if (!isGammeCompleteSlug(item.slug)) return sum;
    return sum + Math.max(0, Math.floor(item.quantity));
  }, 0);
}
