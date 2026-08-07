import type { ProductRow } from "@/lib/infrastructure/supabase/types";
import type { ProductCardData } from "@/components/ui/product-card";

export function toProductCardData(product: ProductRow): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.short_description,
    price: product.price,
    image: product.image_url,
    ingredientImage: product.ingredients_image_url || undefined,
    lifestyleImage: product.lifestyle_image_url,
    isNew: product.is_new,
  };
}
