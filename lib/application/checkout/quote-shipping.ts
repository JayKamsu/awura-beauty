import { listShippingRates } from "@/lib/infrastructure/supabase/shipping-rates";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Ligne panier réduite aux champs nécessaires au calcul des frais de port. */
export type ShippingQuoteLine = {
  slug: string;
  quantity: number;
  shipping_fee: number;
};

/** Détail du calcul de livraison retourné par `quoteShipping`. */
export type ShippingQuote = {
  carrier: ShippingCarrier;
  subtotal: number;
  productShippingFees: number;
  baseFee: number;
  shippingFee: number;
  total: number;
  freeShippingApplied: boolean;
  freeShippingMin: number | null;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Calcule les frais :
 * - retrait (pickup) : 0
 * - sinon : base_fee + Σ(shipping_fee produit × qty)
 * - si subtotal ≥ free_shipping_min : 0
 */
export async function quoteShipping(input: {
  carrier: ShippingCarrier;
  subtotal: number;
  lines: ShippingQuoteLine[];
}): Promise<ShippingQuote | { error: string }> {
  const rates = await listShippingRates();
  const rate = rates.find((row) => row.carrier === input.carrier);

  if (!rate || !rate.enabled) {
    return { error: "Shipping method unavailable" };
  }

  const productShippingFees = roundMoney(
    input.lines.reduce(
      (sum, line) => sum + Number(line.shipping_fee || 0) * line.quantity,
      0,
    ),
  );

  if (input.carrier === "pickup") {
    return {
      carrier: input.carrier,
      subtotal: roundMoney(input.subtotal),
      productShippingFees: 0,
      baseFee: 0,
      shippingFee: 0,
      total: roundMoney(input.subtotal),
      freeShippingApplied: false,
      freeShippingMin: null,
    };
  }

  const freeMin = rate.free_shipping_min;
  const freeShippingApplied =
    freeMin !== null && freeMin > 0 && input.subtotal >= freeMin;

  const shippingFee = freeShippingApplied
    ? 0
    : roundMoney(rate.base_fee + productShippingFees);

  return {
    carrier: input.carrier,
    subtotal: roundMoney(input.subtotal),
    productShippingFees,
    baseFee: rate.base_fee,
    shippingFee,
    total: roundMoney(input.subtotal + shippingFee),
    freeShippingApplied,
    freeShippingMin: freeMin,
  };
}

/** Convertit des quantités panier en lignes de frais de port par produit, ignore les slugs inconnus. */
export function productLinesForQuote(
  products: ProductRow[],
  quantities: Array<{ slug: string; quantity: number }>,
): ShippingQuoteLine[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return quantities
    .map((line) => {
      const product = bySlug.get(line.slug);
      if (!product) return null;
      return {
        slug: line.slug,
        quantity: line.quantity,
        shipping_fee: Number(product.shipping_fee ?? 0),
      };
    })
    .filter(Boolean) as ShippingQuoteLine[];
}
