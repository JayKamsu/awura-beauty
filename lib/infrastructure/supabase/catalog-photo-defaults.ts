import type { ProductRow } from "@/lib/infrastructure/supabase/types";

const CASQUE_SLUG = "casque-chauffant";
const CASQUE_PLACEHOLDER = "/images/products/produit-3-masque.jpg";
const CASQUE_ROSE = "/images/products/casque-rose.jpg";
const CASQUE_REMOTE = "/images/products/casque-telecommande.jpg";

/**
 * Photos d'origine du casque tant qu'aucune image n'a été enregistrée.
 * Une fois remplacées ou supprimées dans l'admin, les valeurs en base priment.
 */
export function applyCatalogPhotoDefaults(product: ProductRow): ProductRow {
  if (product.slug !== CASQUE_SLUG) return product;
  const image = product.image_url.trim();
  if (image && image !== CASQUE_PLACEHOLDER) return product;

  const variants = product.color_variants.includes("rose-clair")
    ? [
        "rose-clair" as const,
        ...product.color_variants.filter((key) => key !== "rose-clair"),
      ]
    : product.color_variants;

  return {
    ...product,
    image_url: CASQUE_ROSE,
    lifestyle_image_url: product.lifestyle_image_url || CASQUE_REMOTE,
    color_variants: variants,
    color_images: {
      "rose-clair": CASQUE_ROSE,
      ...product.color_images,
    },
  };
}
