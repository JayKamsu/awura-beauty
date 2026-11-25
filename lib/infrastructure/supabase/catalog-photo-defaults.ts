import type { ProductRow } from "@/lib/infrastructure/supabase/types";

const CASQUE_SLUG = "casque-chauffant";
const CASQUE_PLACEHOLDER = "/images/products/produit-3-masque.jpg";
/** Dos du casque rose, photo principale de cette couleur. */
export const CASQUE_ROSE_IMAGE = "/images/products/casque-rose.jpg";
/** Casque rose avec la télécommande. */
export const CASQUE_ROSE_DETAIL_IMAGE = "/images/products/casque-rose-detail.jpg";
const CASQUE_REMOTE = "/images/products/casque-telecommande.jpg";

/**
 * Photos d'origine du casque tant qu'aucune image n'a été enregistrée.
 * Le visuel noir déjà en base est conservé ; le rose reçoit ses deux photos.
 */
export function applyCatalogPhotoDefaults(product: ProductRow): ProductRow {
  if (product.slug !== CASQUE_SLUG) return product;
  const image = product.image_url.trim();
  const needsMain = !image || image === CASQUE_PLACEHOLDER;
  const storedRose = product.color_images["rose-clair"]?.trim();

  return {
    ...product,
    image_url: needsMain ? CASQUE_ROSE_IMAGE : product.image_url,
    lifestyle_image_url: product.lifestyle_image_url || CASQUE_REMOTE,
    color_images: {
      ...product.color_images,
      "rose-clair": storedRose || CASQUE_ROSE_IMAGE,
    },
  };
}
