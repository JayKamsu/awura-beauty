/** Couleurs proposées à la vente (casque, fibre de bananier, etc.). */
export const PRODUCT_COLOR_KEYS = [
  "noir",
  "rose-clair",
  "blond",
  "acajou",
] as const;

/** Clé de variante couleur persistée (panier, commande, admin). */
export type ProductColorKey = (typeof PRODUCT_COLOR_KEYS)[number];

/** Photo associée à une variante couleur (clé → URL). */
export type ProductColorImageMap = Partial<Record<ProductColorKey, string>>;

/** Stock physique d'une variante couleur (clé → unités). */
export type ProductColorStockMap = Partial<Record<ProductColorKey, number>>;

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

/** Parse la map JSON des photos par couleur (ignore les clés / URLs invalides). */
export function parseColorImages(raw: unknown): ProductColorImageMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: ProductColorImageMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isProductColorKey(key)) continue;
    const url = String(value ?? "").trim();
    if (url) result[key] = url;
  }
  return result;
}

/** Parse le stock par couleur (ignore les clés inconnues et les quantités invalides). */
export function parseColorStock(raw: unknown): ProductColorStockMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: ProductColorStockMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isProductColorKey(key)) continue;
    const quantity = Math.floor(Number(value));
    if (!Number.isFinite(quantity)) continue;
    result[key] = Math.max(0, quantity);
  }
  return result;
}

/** Ne conserve que le stock des variantes encore proposées. */
export function pruneColorStock(
  variants: ProductColorKey[],
  stock: ProductColorStockMap,
): ProductColorStockMap {
  const allowed = new Set(variants);
  const result: ProductColorStockMap = {};
  for (const key of PRODUCT_COLOR_KEYS) {
    const quantity = stock[key];
    if (quantity !== undefined && allowed.has(key)) result[key] = quantity;
  }
  return result;
}

/** Somme des stocks couleur. Sert de stock produit quand des variantes sont vendues. */
export function sumColorStock(
  variants: ProductColorKey[],
  stock: ProductColorStockMap,
): number {
  return variants.reduce((total, key) => total + (stock[key] ?? 0), 0);
}

/**
 * Stock disponible pour la couleur choisie.
 * Sans saisie par couleur, retombe sur le stock produit (ancien stock partagé).
 */
export function stockForColor(
  product: {
    stock: number;
    color_variants?: ProductColorKey[];
    color_stock?: ProductColorStockMap;
  },
  colorKey: ProductColorKey | null | undefined,
): number {
  if (!colorKey || !product.color_variants?.length) return product.stock;
  const specific = product.color_stock?.[colorKey];
  if (specific === undefined) return product.stock;
  return specific;
}

/**
 * Préremplit le formulaire admin. Si aucun stock couleur n'est encore saisi,
 * le stock partagé reste sur la première couleur pour ne pas le multiplier.
 */
export function initialColorStock(
  variants: ProductColorKey[],
  stored: ProductColorStockMap,
  sharedStock: number,
): ProductColorStockMap {
  const hasStored = variants.some((key) => stored[key] !== undefined);
  const result: ProductColorStockMap = {};
  variants.forEach((key, index) => {
    if (stored[key] !== undefined) {
      result[key] = stored[key] ?? 0;
      return;
    }
    result[key] = hasStored ? 0 : index === 0 ? Math.max(0, sharedStock) : 0;
  });
  return result;
}

/** Ne conserve que les photos des variantes encore proposées. */
export function pruneColorImages(
  variants: ProductColorKey[],
  images: ProductColorImageMap,
): ProductColorImageMap {
  const allowed = new Set(variants);
  const result: ProductColorImageMap = {};
  for (const key of PRODUCT_COLOR_KEYS) {
    const url = images[key];
    if (url && allowed.has(key)) result[key] = url;
  }
  return result;
}

/** Visuel produit pour une couleur : photo de variante si elle existe, sinon image principale. */
export function resolveProductImageForColor(
  product: { image_url: string; color_images?: ProductColorImageMap },
  colorKey: ProductColorKey | null | undefined,
): string {
  if (colorKey) {
    const src = product.color_images?.[colorKey]?.trim();
    if (src) return src;
  }
  return product.image_url;
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
