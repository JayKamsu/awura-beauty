import { NextResponse } from "next/server";
import { resolveCheckoutCart } from "@/lib/application/checkout/resolve-checkout-cart";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { resolveCheckoutShipping } from "@/lib/application/checkout/shipping-options";
import { createPayPalOrder } from "@/lib/infrastructure/payments/paypal";
import { createOrder } from "@/lib/infrastructure/supabase/orders";

type PayPalCreateBody = {
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

export async function POST(request: Request) {
  const body = (await request.json()) as PayPalCreateBody;

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
  const shippingAddress =
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
    paymentMethod: "paypal",
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
    pointsEarned: resolved.loyalty.pointsToEarn,
    pointsRedeemed: resolved.loyalty.pointsRedeemed,
    discountAmount: resolved.loyalty.discountAmount,
    referralDiscountApplied: resolved.loyalty.referralEligible,
  });

  const orderId = order?.id ?? `demo-${Date.now()}`;

  if (!order && error !== "Supabase is not configured") {
    return NextResponse.json({ error: error ?? "Order failed" }, { status: 500 });
  }

  const paypal = await createPayPalOrder({
    orderId,
    amount: {
      currencyCode: currency,
      value: resolved.total.toFixed(2),
    },
  });

  if (!paypal.id) {
    return NextResponse.json(
      { error: paypal.error ?? "PayPal unavailable" },
      { status: 500 },
    );
  }

  return NextResponse.json({ paypalOrderId: paypal.id, orderId });
}
