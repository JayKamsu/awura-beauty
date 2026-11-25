import {
  parseProductColorKey,
  PRODUCT_COLOR_KEYS,
  type ProductColorKey,
  type ProductColorStockMap,
} from "@/lib/domain/product-color";
import { getBundleComponents } from "@/lib/infrastructure/supabase/bundles";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { getProductsBySlugs } from "@/lib/infrastructure/supabase/products";
import type { OrderItem } from "@/lib/infrastructure/supabase/order-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Delta de stock : une couleur précise, ou le stock produit si aucune teinte n'est suivie. */
type StockDelta = {
  productId: string;
  color: ProductColorKey | null;
  qty: number;
};

/** Couleurs dont le stock est saisi explicitement, dans l'ordre du catalogue. */
function trackedColors(
  variants: ProductColorKey[],
  stock: ProductColorStockMap,
): ProductColorKey[] {
  return PRODUCT_COLOR_KEYS.filter(
    (key) => variants.includes(key) && stock[key] !== undefined,
  );
}

/**
 * Déltas de stock par produit réel pour les lignes d'une commande.
 * Un bundle n'a pas son propre stock : il répercute la quantité sur ses composants.
 * Une couleur suivie bouge son stock ; sinon le stock produit partagé.
 */
async function stockDeltasForItems(
  items: OrderItem[],
  sign: 1 | -1,
): Promise<StockDelta[]> {
  const deltas = new Map<string, StockDelta>();
  const add = (productId: string, color: ProductColorKey | null, quantity: number) => {
    const key = `${productId}::${color ?? ""}`;
    const current = deltas.get(key);
    if (current) current.qty += quantity;
    else deltas.set(key, { productId, color, qty: quantity });
  };

  const applyProduct = (
    product: ProductRow,
    quantity: number,
    color: ProductColorKey | null,
  ) => {
    const colors = trackedColors(product.color_variants, product.color_stock);
    if (color && colors.includes(color)) {
      add(product.id, color, sign * quantity);
      return;
    }
    if (!colors.length) {
      add(product.id, null, sign * quantity);
      return;
    }
    if (sign === 1) {
      add(product.id, colors[0], quantity);
      return;
    }
    let remaining = quantity;
    for (const key of colors) {
      if (remaining <= 0) break;
      const take = Math.min(product.color_stock[key] ?? 0, remaining);
      if (take <= 0) continue;
      add(product.id, key, -take);
      remaining -= take;
    }
    if (remaining > 0) add(product.id, null, -remaining);
  };

  const slugs = [...new Set(items.map((item) => item.slug))];
  const products = await getProductsBySlugs(slugs);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (product?.is_bundle) {
      const components = await getBundleComponents(product.id);
      for (const component of components) {
        applyProduct(component.product, component.quantity * item.quantity, null);
      }
      continue;
    }
    if (product) {
      applyProduct(product, item.quantity, parseProductColorKey(item.color_key));
      continue;
    }
    add(item.product_id, null, sign * item.quantity);
  }

  return [...deltas.values()];
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
  for (const delta of deltas) {
    if (delta.qty === 0) continue;
    if (delta.color) {
      await supabase.rpc("adjust_product_color_stock", {
        p_id: delta.productId,
        p_color: delta.color,
        p_delta: delta.qty,
      });
      continue;
    }
    await supabase.rpc("adjust_product_stock", {
      p_id: delta.productId,
      p_delta: delta.qty,
    });
  }
}
