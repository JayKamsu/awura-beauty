import { NextResponse } from "next/server";
import { resolveOrderItemsFromCatalog } from "@/lib/application/checkout/resolve-order-items";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
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
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as PayPalCreateBody;

  if (!body.email || !body.items?.length || !body.shippingAddress) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const resolved = await resolveOrderItemsFromCatalog(body.items);
  if (resolved.error || !resolved.items.length) {
    return NextResponse.json(
      { error: resolved.error ?? "Invalid cart" },
      { status: 400 },
    );
  }

  const userId = await userIdFromRequest(request);
  const currency = body.currency || "EUR";

  const { order, error } = await createOrder({
    email: body.email,
    paymentMethod: "paypal",
    currency,
    items: resolved.items,
    shippingAddress: body.shippingAddress,
    paymentStatus: "pending",
    status: "pending",
    userId,
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
