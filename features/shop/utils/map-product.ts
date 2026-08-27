import type { ProductRow } from "@/lib/infrastructure/supabase/types";
import type { ProductCardData } from "@/components/ui/product-card";

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
    ingredientImage: product.ingredients_image_url || undefined,
    lifestyleImage: product.lifestyle_image_url,
    isNew: product.is_new,
    productType: product.product_type,
    category: product.category,
    stock: product.stock,
    colorVariants: product.color_variants,
  };
}
