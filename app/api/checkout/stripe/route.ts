import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";
import type { OrderItem } from "@/lib/domain";

type StripeCheckoutBody = {
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
  const body = (await request.json()) as StripeCheckoutBody;

  if (!body.email || !body.items?.length || !body.shippingAddress) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { order, error } = await container.orders.createOrder({
    email: body.email,
    paymentMethod: "stripe",
    currency: body.currency || "EUR",
    items: body.items,
    shippingAddress: body.shippingAddress,
    paymentStatus: "pending",
    status: "pending",
  });

  if (!order) {
    if (error === "Supabase is not configured") {
      const origin = new URL(request.url).origin;
      const demoId = `demo-${Date.now()}`;
      const session = await container.payments.createStripeCheckout({
        orderId: demoId,
        customerEmail: body.email,
        currency: body.currency || "EUR",
        successUrl: `${origin}/commande/succes?orderId=${demoId}`,
        cancelUrl: `${origin}/commande/annule`,
        lineItems: body.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitAmountCents: Math.round(item.unit_price * 100),
          imageUrl: item.image_url.startsWith("http")
            ? item.image_url
            : undefined,
        })),
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

  const origin = new URL(request.url).origin;
  const session = await container.payments.createStripeCheckout({
    orderId: order.id,
    customerEmail: body.email,
    currency: body.currency || "EUR",
    successUrl: `${origin}/commande/succes?orderId=${order.id}`,
    cancelUrl: `${origin}/commande/annule`,
    lineItems: body.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitAmountCents: Math.round(item.unit_price * 100),
      imageUrl: item.image_url.startsWith("http") ? item.image_url : undefined,
    })),
  });

  if (!session.url) {
    return NextResponse.json(
      { error: session.error ?? "Stripe unavailable" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url, orderId: order.id });
}
