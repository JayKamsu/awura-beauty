import { getProductsBySlugs } from "@/lib/infrastructure/supabase/products";
import type { OrderItem } from "@/lib/infrastructure/supabase/order-types";

export type CartLineInput = {
  slug?: string;
  quantity?: number;
};

const MAX_QTY = 20;

/**
 * Reconstruit les lignes de commande depuis le catalogue (prix serveur).
 * Ignore unit_price / name / image envoyés par le client.
 */
export async function resolveOrderItemsFromCatalog(
  lines: CartLineInput[],
): Promise<{ items: OrderItem[]; total: number; error: string | null }> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { items: [], total: 0, error: "Cart is empty" };
  }

  const normalized = lines
    .map((line) => ({
      slug: String(line.slug ?? "").trim(),
      quantity: Math.floor(Number(line.quantity) || 0),
    }))
    .filter((line) => line.slug && line.quantity > 0);

  if (!normalized.length) {
    return { items: [], total: 0, error: "Invalid cart lines" };
  }

  for (const line of normalized) {
    if (line.quantity > MAX_QTY) {
      return {
        items: [],
        total: 0,
        error: `Quantity too high for ${line.slug}`,
      };
    }
  }

  const slugs = [...new Set(normalized.map((line) => line.slug))];
  const products = await getProductsBySlugs(slugs);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const items: OrderItem[] = [];
  for (const line of normalized) {
    const product = bySlug.get(line.slug);
    if (!product) {
      return { items: [], total: 0, error: `Unknown product: ${line.slug}` };
    }
    if (product.stock < line.quantity) {
      return {
        items: [],
        total: 0,
        error: `Insufficient stock for ${product.slug}`,
      };
    }
    items.push({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      unit_price: Number(product.price),
      quantity: line.quantity,
      image_url: product.image_url,
    });
  }

  const total = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  return { items, total: Math.round(total * 100) / 100, error: null };
}
