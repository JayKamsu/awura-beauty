import { NextResponse } from "next/server";
import {
  resolveCheckoutCart,
  stripeLinesWithDiscount,
} from "@/lib/application/checkout/resolve-checkout-cart";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { resolveCheckoutShipping } from "@/lib/application/checkout/shipping-options";
import { container } from "@/lib/application/container";

type StripeCheckoutBody = {
  email: string;
  currency: string;
  items: Array<{ slug?: string; quantity?: number }>;
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

function normalizeAddress(
  address: StripeCheckoutBody["shippingAddress"],
  carrier: string,
) {
  if (carrier !== "pickup") return address;
  return {
    ...address,
    line1: address.line1 || "Retrait sur place",
    city: address.city || "—",
    postalCode: address.postalCode || "00000",
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as StripeCheckoutBody;

  if (!body.email || !body.items?.length || !body.shippingAddress) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const shipping = resolveCheckoutShipping(body);
  if (!shipping.ok) {
    return NextResponse.json({ error: shipping.error }, { status: 400 });
  }

  const userId = await userIdFromRequest(request);
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

  const currency = body.currency || "EUR";
  const origin = new URL(request.url).origin;
  const shippingAddress = normalizeAddress(
    body.shippingAddress,
    shipping.shippingCarrier,
  );

  const loyaltyFields = {
    pointsEarned: resolved.loyalty.pointsToEarn,
    pointsRedeemed: resolved.loyalty.pointsRedeemed,
    discountAmount: resolved.loyalty.discountAmount,
    referralDiscountApplied: resolved.loyalty.referralEligible,
  };

  const lineItems = stripeLinesWithDiscount(
    resolved.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitAmountCents: Math.round(item.unit_price * 100),
      imageUrl: item.image_url.startsWith("http") ? item.image_url : undefined,
    })),
    resolved.loyalty.discountAmount,
    resolved.shippingFee,
  );

  const { order, error } = await container.orders.createOrder({
    email: body.email,
    paymentMethod: "stripe",
    currency,
    items: resolved.items,
    shippingAddress,
    paymentStatus: "pending",
    status: "pending",
    userId,
    shippingCarrier: shipping.shippingCarrier,
    relayPointId: shipping.relayPointId,
    shippingFee: resolved.shippingFee,
    total: resolved.total,
    ...loyaltyFields,
  });

  if (!order) {
    if (error === "Supabase is not configured") {
      const demoId = `demo-${Date.now()}`;
      const session = await container.payments.createStripeCheckout({
        orderId: demoId,
        customerEmail: body.email,
        currency,
        successUrl: `${origin}/commande/succes?orderId=${demoId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/commande/annule?orderId=${demoId}`,
        lineItems,
      });

      if (!session.url) {
        return NextResponse.json(
          { error: session.error ?? "Stripe unavailable" },
          { status: 500 },
        );
      }
      return NextResponse.json({ url: session.url, orderId: demoId });
    }

    return NextResponse.json({ error: error ?? "Order failed" }, { status: 500 });
  }

  const session = await container.payments.createStripeCheckout({
    orderId: order.id,
    customerEmail: body.email,
    currency,
    successUrl: `${origin}/commande/succes?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/commande/annule?orderId=${order.id}`,
    lineItems,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: session.error ?? "Stripe unavailable" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url, orderId: order.id });
}
