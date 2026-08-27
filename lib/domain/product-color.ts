/** Couleurs proposées à la vente (casque, fibre de bananier, etc.). */
export const PRODUCT_COLOR_KEYS = [
  "noir",
  "rose-clair",
  "blond",
  "acajou",
] as const;

/** Clé de variante couleur persistée (panier, commande, admin). */
export type ProductColorKey = (typeof PRODUCT_COLOR_KEYS)[number];

const COLOR_KEY_SET = new Set<string>(PRODUCT_COLOR_KEYS);

const LABELS: Record<ProductColorKey, Record<"fr" | "en" | "es", string>> = {
  noir: { fr: "Noir", en: "Black", es: "Negro" },
  "rose-clair": { fr: "Rose clair", en: "Light pink", es: "Rosa claro" },
  blond: { fr: "Blond", en: "Blonde", es: "Rubio" },
  acajou: { fr: "Acajou", en: "Mahogany", es: "Caoba" },
};

/** Classes Tailwind des pastilles (tokens `swatch-*` dans globals.css). */
export const PRODUCT_COLOR_SWATCH_CLASS: Record<ProductColorKey, string> = {
  noir: "bg-swatch-noir",
  "rose-clair": "bg-swatch-rose-clair",
  blond: "bg-swatch-blond",
  acajou: "bg-swatch-acajou",
};

/** Indique si la valeur est une clé de couleur produit connue. */
export function isProductColorKey(value: string): value is ProductColorKey {
  return COLOR_KEY_SET.has(value);
}

/** Parse une clé de couleur depuis une query, un JSON ou un champ formulaire. */
export function parseProductColorKey(raw: unknown): ProductColorKey | null {
  const key = String(raw ?? "").trim();
  return isProductColorKey(key) ? key : null;
}

/** Filtre et déduplique une liste de variantes couleur (ordre du catalogue). */
export function parseColorVariants(raw: unknown): ProductColorKey[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ProductColorKey>();
  const result: ProductColorKey[] = [];
  for (const item of raw) {
    const key = parseProductColorKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

/** Libellé d'une couleur pour reçus / Stripe (catalogue en français de référence). */
export function productColorLabel(
  key: ProductColorKey,
  locale = "fr",
): string {
  const lang = locale.startsWith("en")
    ? "en"
    : locale.startsWith("es")
      ? "es"
      : "fr";
  return LABELS[key][lang];
}

/** Nom produit enrichi de la couleur, pour commandes et paiements. */
export function formatProductNameWithColor(
  name: string,
  colorKey: ProductColorKey | null | undefined,
  locale = "fr",
): string {
  if (!colorKey) return name;
  return `${name} — ${productColorLabel(colorKey, locale)}`;
}

/**
 * Valide la couleur d'une ligne : obligatoire si le produit a des variantes,
 * ignorée sinon.
 */
export function resolveLineColor(
  variants: ProductColorKey[],
  colorKey: unknown,
): { ok: true; colorKey: ProductColorKey | null } | { ok: false } {
  if (!variants.length) {
    return { ok: true, colorKey: null };
  }
  const parsed = parseProductColorKey(colorKey);
  if (!parsed || !variants.includes(parsed)) {
    return { ok: false };
  }
  return { ok: true, colorKey: parsed };
}
