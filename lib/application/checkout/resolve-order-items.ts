import { getProductsBySlugs } from "@/lib/infrastructure/supabase/products";
import type { OrderItem } from "@/lib/infrastructure/supabase/order-types";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import {
  productLinesForQuote,
  quoteShipping,
  type ShippingQuote,
} from "@/lib/application/checkout/quote-shipping";
import {
  GAMME_COMPLETE_COMPONENT_SLUGS,
  isGammeCompleteSlug,
} from "@/lib/domain/bundle";

/** Ligne panier brute (non validée) telle que reçue du client. */
export type CartLineInput = {
  slug?: string;
  quantity?: number;
};

const MAX_QTY = 20;

/** Résultat de résolution du panier : items validés + totaux, ou `error` renseigné si invalide. */
export type ResolveCartResult = {
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  quote: ShippingQuote | null;
  error: string | null;
};

/**
 * Reconstruit les lignes + total (produits + livraison) depuis le catalogue.
 */
export async function resolveOrderItemsFromCatalog(
  lines: CartLineInput[],
  carrier?: ShippingCarrier,
): Promise<ResolveCartResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return {
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      quote: null,
      error: "Cart is empty",
    };
  }

  const normalized = lines
    .map((line) => ({
      slug: String(line.slug ?? "").trim(),
      quantity: Math.floor(Number(line.quantity) || 0),
    }))
    .filter((line) => line.slug && line.quantity > 0);

  if (!normalized.length) {
    return {
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      quote: null,
      error: "Invalid cart lines",
    };
  }

  for (const line of normalized) {
    if (line.quantity > MAX_QTY) {
      return {
        items: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        quote: null,
        error: `Quantity too high for ${line.slug}`,
      };
    }
  }

  const needsComponents = normalized.some((line) =>
    isGammeCompleteSlug(line.slug),
  );
  const slugs = [
    ...new Set([
      ...normalized.map((line) => line.slug),
      ...(needsComponents ? [...GAMME_COMPLETE_COMPONENT_SLUGS] : []),
    ]),
  ];
  const products = await getProductsBySlugs(slugs);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const items: OrderItem[] = [];
  for (const line of normalized) {
    const product = bySlug.get(line.slug);
    if (!product) {
      return {
        items: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        quote: null,
        error: `Unknown product: ${line.slug}`,
      };
    }

    if (isGammeCompleteSlug(line.slug)) {
      for (const componentSlug of GAMME_COMPLETE_COMPONENT_SLUGS) {
        const component = bySlug.get(componentSlug);
        if (!component) {
          return {
            items: [],
            subtotal: 0,
            shippingFee: 0,
            total: 0,
            quote: null,
            error: `Missing bundle component: ${componentSlug}`,
          };
        }
        if (component.stock < line.quantity) {
          return {
            items: [],
            subtotal: 0,
            shippingFee: 0,
            total: 0,
            quote: null,
            error: `Insufficient stock for gamme (${component.slug})`,
          };
        }
      }
    } else if (product.stock < line.quantity) {
      return {
        items: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        quote: null,
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

  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) *
        100,
    ) / 100;

  if (!carrier) {
    return {
      items,
      subtotal,
      shippingFee: 0,
      total: subtotal,
      quote: null,
      error: null,
    };
  }

  const quote = await quoteShipping({
    carrier,
    subtotal,
    lines: productLinesForQuote(products, normalized),
  });

  if ("error" in quote) {
    return {
      items,
      subtotal,
      shippingFee: 0,
      total: subtotal,
      quote: null,
      error: quote.error,
    };
  }

  return {
    items,
    subtotal: quote.subtotal,
    shippingFee: quote.shippingFee,
    total: quote.total,
    quote,
    error: null,
  };
}
