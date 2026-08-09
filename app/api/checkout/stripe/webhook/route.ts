import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/application/checkout/mark-order-paid";
import { getStripeClient } from "@/lib/infrastructure/payments/stripe";
import { claimWebhookEvent } from "@/lib/infrastructure/supabase/webhook-events";

export const runtime = "nodejs";

/**
 * Webhook Stripe — active quand STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
 * sont configurés (Dashboard Stripe → Webhooks → endpoint
 * https://www.awurabeauty.com/api/checkout/stripe/webhook).
 */
export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const isNew = await claimWebhookEvent("stripe", event.id);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointmentId ?? null;
    if (
      appointmentId &&
      (session.payment_status === "paid" || session.status === "complete")
    ) {
      const { updateAppointment } = await import(
        "@/lib/infrastructure/supabase/diagnostic-admin"
      );
      await updateAppointment(appointmentId, {
        status: "confirmed",
        stripeSessionId: session.id,
      });
      return NextResponse.json({ received: true });
    }

    const orderId =
      session.metadata?.orderId ?? session.client_reference_id ?? null;

    if (
      orderId &&
      !orderId.startsWith("demo-") &&
      !orderId.startsWith("diag-") &&
      (session.payment_status === "paid" || session.status === "complete")
    ) {
      await markOrderPaid(orderId);
    }
  }

  return NextResponse.json({ received: true });
}
