import type { ProductRow } from "@/lib/infrastructure/supabase/types";
import type { ProductCardData } from "@/components/ui/product-card";

/** Catégorie boutique des fibres de bananier. */
export const FIBRES_CATEGORY = "fibres-de-bananier";
/** Catégorie boutique des casques chauffants. */
export const HELMETS_CATEGORY = "casques-chauffants";

type CatalogIdentity = {
  slug: string;
  name?: string;
  category?: string;
};

function haystack(product: CatalogIdentity): string {
  return `${product.slug} ${product.category ?? ""} ${product.name ?? ""}`.toLowerCase();
}

/** Indique si le produit est un casque chauffant (catégorie, slug ou nom). */
export function isHelmetProduct(product: CatalogIdentity): boolean {
  const text = haystack(product);
  return (
    product.category === HELMETS_CATEGORY ||
    product.slug === "casque-chauffant" ||
    text.includes("casque")
  );
}

/** Indique si le produit est une fibre de bananier (catégorie, slug ou nom). */
export function isFibreProduct(product: CatalogIdentity): boolean {
  const text = haystack(product);
  return (
    product.category === FIBRES_CATEGORY ||
    text.includes("fibre") ||
    text.includes("bananier")
  );
}

const DEFAULT_INGREDIENT_IMAGES: Record<string, string> = {
  "beurre-capillaire": "/images/ingredients/ingredient-1.jpg",
  "demelant-nourrissant": "/images/ingredients/ingredient-2.jpg",
  "masque-capillaire": "/images/ingredients/ingredient-3.jpg",
  "nutrition-royale": "/images/ingredients/ingredient-3.jpg",
  "lotion-repousse": "/images/ingredients/ingredient-4.jpg",
  "savon-solide": "/images/ingredients/ingredient-5.jpg",
  "gamme-complete": "/images/ingredients/ingredient-1.jpg",
};

function normalizeAssetUrl(url: string | null | undefined): string {
  return (url ?? "").trim().split("?")[0];
}

/**
 * Image de composition à afficher sur la fiche / les cartes.
 * Ignore une URL vide ou identique au visuel produit, et retombe sur
 * les photos ingrédients du catalogue pour les soins Awura.
 */
export function resolveIngredientsImageUrl(product: {
  slug: string;
  image_url?: string | null;
  ingredients_image_url?: string | null;
}): string | null {
  const productImage = normalizeAssetUrl(product.image_url);
  const stored = (product.ingredients_image_url ?? "").trim();
  if (stored && normalizeAssetUrl(stored) !== productImage) return stored;
  const fallback = DEFAULT_INGREDIENT_IMAGES[product.slug];
  if (fallback && fallback !== productImage) return fallback;
  return null;
}

/** Convertit une ligne produit (base de données) en données de carte produit pour l'affichage. */
export function toProductCardData(product: ProductRow): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.short_description,
    price: product.price,
    image: product.image_url,
    compareAtPrice: product.compare_at_price,
    ingredientImage: resolveIngredientsImageUrl(product) || undefined,
    lifestyleImage: product.lifestyle_image_url,
    isNew: product.is_new,
    productType: product.product_type,
    category: product.category,
    stock: product.stock,
    colorVariants: product.color_variants,
  };
}
