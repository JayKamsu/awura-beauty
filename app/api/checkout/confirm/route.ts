import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/application/checkout/mark-order-paid";
import { getStripeClient } from "@/lib/infrastructure/payments/stripe";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";

/**
 * Confirmation Stripe côté succès navigateur.
 * Ne marque payé que si la session Stripe est réellement payée et liée à la commande.
 * (Le webhook reste la source de vérité fiable si l’utilisateur ferme l’onglet.)
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    sessionId?: string;
  };

  if (!body.orderId || body.orderId.startsWith("demo-")) {
    return NextResponse.json({ ok: true });
  }

  if (!body.sessionId) {
    // Sans preuve Stripe : ne pas marquer payé.
    return NextResponse.json({ ok: true, pending: true });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ ok: true, pending: true });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    const sessionOrderId =
      session.metadata?.orderId ?? session.client_reference_id ?? null;

    if (sessionOrderId !== body.orderId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 400 });
    }

    if (
      session.payment_status !== "paid" &&
      session.status !== "complete"
    ) {
      return NextResponse.json({ ok: true, pending: true });
    }

    const order = await getOrderById(body.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      typeof session.amount_total === "number" &&
      Math.round(order.total * 100) !== session.amount_total
    ) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const ok = await markOrderPaid(body.orderId);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
}
