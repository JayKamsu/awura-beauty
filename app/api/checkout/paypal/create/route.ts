import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/infrastructure/payments/paypal";
import { createOrder } from "@/lib/infrastructure/supabase/orders";
import type { OrderItem } from "@/lib/infrastructure/supabase/order-types";

type PayPalCreateBody = {
  email: string;
  currency: string;
  items: OrderItem[];
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

  const total = body.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  const { order, error } = await createOrder({
    email: body.email,
    paymentMethod: "paypal",
    currency: body.currency || "EUR",
    items: body.items,
    shippingAddress: body.shippingAddress,
    paymentStatus: "pending",
    status: "pending",
  });

  const orderId = order?.id ?? `demo-${Date.now()}`;

  if (!order && error !== "Supabase is not configured") {
    return NextResponse.json({ error: error ?? "Order failed" }, { status: 500 });
  }

  const paypal = await createPayPalOrder({
    orderId,
    amount: {
      currencyCode: body.currency || "EUR",
      value: total.toFixed(2),
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
