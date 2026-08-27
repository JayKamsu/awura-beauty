import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/application/checkout/mark-order-paid";
import { isLivePaymentConfigured } from "@/lib/application/checkout/payments-configured";
import { resolveCheckoutCart } from "@/lib/application/checkout/resolve-checkout-cart";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { resolveCheckoutShipping } from "@/lib/application/checkout/shipping-options";
import { createOrder } from "@/lib/infrastructure/supabase/orders";

type ManualCheckoutBody = {
  email: string;
  currency: string;
  items: Array<{ slug?: string; quantity?: number; colorKey?: string | null }>;
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  shippingCarrier?: string;
  relayPointId?: string | null;
  pointsToRedeem?: number;
};

/**
 * Paiement manuel (hors Stripe/PayPal) — désactivé dès qu'un moyen de
 * paiement en ligne est configuré. Marque la commande payée immédiatement.
 */
export async function POST(request: Request) {
  if (isLivePaymentConfigured()) {
    return NextResponse.json(
      {
        error:
          "Manual checkout disabled: Stripe or PayPal is configured",
      },
      { status: 403 },
    );
  }

  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ManualCheckoutBody;

  if (!body.email || !body.items?.length || !body.shippingAddress) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const shipping = resolveCheckoutShipping(body);
  if (!shipping.ok) {
    return NextResponse.json({ error: shipping.error }, { status: 400 });
  }

  const resolved = await resolveCheckoutCart({
    lines: body.items,
    carrier: shipping.shippingCarrier,
    userId,
    pointsToRedeem: body.pointsToRedeem,
  });
  if (resolved.error || !resolved.items.length) {
    return NextResponse.json(
      { error: resolved.error ?? "Invalid cart" },
      { status: 400 },
    );
  }

  const address =
    shipping.shippingCarrier === "pickup"
      ? {
          ...body.shippingAddress,
          line1: body.shippingAddress.line1 || "Retrait sur place",
          city: body.shippingAddress.city || "—",
          postalCode: body.shippingAddress.postalCode || "00000",
        }
      : body.shippingAddress;

  const { order, error } = await createOrder({
    email: body.email,
    paymentMethod: "manual",
    currency: body.currency || "EUR",
    items: resolved.items,
    shippingAddress: address,
    paymentStatus: "pending",
    status: "pending",
    userId,
    shippingCarrier: shipping.shippingCarrier,
    relayPointId: shipping.relayPointId,
    shippingFee: resolved.shippingFee,
    total: resolved.total,
    pointsEarned: resolved.loyalty.pointsToEarn,
    pointsRedeemed: resolved.loyalty.pointsRedeemed,
    discountAmount: resolved.loyalty.discountAmount,
    referralDiscountApplied: resolved.loyalty.referralEligible,
  });

  if (!order) {
    return NextResponse.json(
      { error: error ?? "Order failed" },
      { status: 500 },
    );
  }

  const paid = await markOrderPaid(order.id);
  if (!paid) {
    return NextResponse.json(
      { error: "Order created but payment confirmation failed", orderId: order.id },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    paymentMethod: "manual",
    shippingFee: resolved.shippingFee,
    total: resolved.total,
  });
}
