import { getBundleComponents } from "@/lib/infrastructure/supabase/bundles";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { getProductsBySlugs } from "@/lib/infrastructure/supabase/products";
import type { OrderItem } from "@/lib/infrastructure/supabase/order-types";

/**
 * Déltas de stock par produit réel pour les lignes d'une commande.
 * Un bundle (offre promo multi-produits) n'a pas son propre stock physique :
 * il répercute la quantité sur ses composants (bundle_items).
 */
async function stockDeltasForItems(
  items: OrderItem[],
  sign: 1 | -1,
): Promise<Map<string, number>> {
  const deltas = new Map<string, number>();
  const add = (productId: string, quantity: number) => {
    deltas.set(productId, (deltas.get(productId) ?? 0) + sign * quantity);
  };

  const slugs = [...new Set(items.map((item) => item.slug))];
  const products = await getProductsBySlugs(slugs);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (product?.is_bundle) {
      const components = await getBundleComponents(product.id);
      for (const component of components) {
        add(component.product.id, component.quantity * item.quantity);
      }
      continue;
    }
    add(item.product_id, item.quantity);
  }

  return deltas;
}

/**
 * Applique les déltas de stock (vente payée = décrément, remboursement /
 * annulation = incrément) via une fonction Postgres atomique — évite les
 * pertes de mise à jour si plusieurs ventes touchent le même produit en
 * parallèle. `sign: -1` décrémente, `sign: 1` restaure.
 */
export async function adjustOrderStock(
  items: OrderItem[],
  sign: 1 | -1,
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const deltas = await stockDeltasForItems(items, sign);
  for (const [productId, delta] of deltas) {
    if (delta === 0) continue;
    await supabase.rpc("adjust_product_stock", {
      p_id: productId,
      p_delta: delta,
    });
  }
}
