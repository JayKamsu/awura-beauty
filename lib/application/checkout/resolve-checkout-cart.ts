import { resolveOrderItemsFromCatalog } from "@/lib/application/checkout/resolve-order-items";
import {
  quoteLoyalty,
  type LoyaltyQuote,
} from "@/lib/application/loyalty/quote-loyalty";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import type { CartLineInput } from "@/lib/application/checkout/resolve-order-items";

/** Résultat combiné catalogue + livraison + fidélité, prêt pour la création de commande. */
export type CheckoutResolveResult = Awaited<
  ReturnType<typeof resolveOrderItemsFromCatalog>
> & {
  loyalty: LoyaltyQuote;
};

/** Catalogue + devis livraison + fidélité / parrainage. */
export async function resolveCheckoutCart(input: {
  lines: CartLineInput[];
  carrier: ShippingCarrier;
  userId?: string | null;
  pointsToRedeem?: number;
}): Promise<CheckoutResolveResult> {
  const resolved = await resolveOrderItemsFromCatalog(
    input.lines,
    input.carrier,
  );
  const loyalty = await quoteLoyalty({
    userId: input.userId,
    productSubtotal: resolved.subtotal,
    shippingFee: resolved.shippingFee,
    pointsToRedeem: input.pointsToRedeem,
  });

  return {
    ...resolved,
    total: loyalty.total,
    loyalty,
  };
}

/** Réduit les line items Stripe pour coller au total après réductions. */
export function stripeLinesWithDiscount(
  items: Array<{
    name: string;
    quantity: number;
    unitAmountCents: number;
    imageUrl?: string;
  }>,
  discountAmount: number,
  shippingFee: number,
) {
  const lines = items.map((item) => ({ ...item }));
  let discountCents = Math.round(Math.max(0, discountAmount) * 100);
  const productCents = lines.reduce(
    (sum, line) => sum + line.unitAmountCents * line.quantity,
    0,
  );
  if (discountCents > 0 && productCents > 0) {
    // Réduit le premier article (ajustement simple)
    for (const line of lines) {
      if (discountCents <= 0) break;
      const lineTotal = line.unitAmountCents * line.quantity;
      const cut = Math.min(lineTotal - line.quantity, discountCents);
      if (cut <= 0) continue;
      const newTotal = lineTotal - cut;
      line.unitAmountCents = Math.max(1, Math.floor(newTotal / line.quantity));
      discountCents -= lineTotal - line.unitAmountCents * line.quantity;
    }
  }
  if (shippingFee > 0) {
    lines.push({
      name: "Frais de livraison",
      quantity: 1,
      unitAmountCents: Math.round(shippingFee * 100),
      imageUrl: undefined,
    });
  }
  return lines;
}
