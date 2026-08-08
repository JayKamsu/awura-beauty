import { NextResponse } from "next/server";
import { isLivePaymentConfigured } from "@/lib/application/checkout/payments-configured";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

/** Statut de config Stripe / PayPal (sans exposer les secrets). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const stripePublishable = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
  const stripeSecret = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const stripeWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const paypalClient = Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim(),
  );
  const paypalSecret = Boolean(process.env.PAYPAL_CLIENT_SECRET?.trim());
  const paypalBase =
    process.env.PAYPAL_API_BASE?.trim() ||
    "https://api-m.sandbox.paypal.com";
  const paypalLive = paypalBase.includes("api-m.paypal.com");

  return NextResponse.json({
    livePaymentsEnabled: isLivePaymentConfigured(),
    stripe: {
      ready: stripePublishable && stripeSecret && stripeWebhook,
      publishable: stripePublishable,
      secret: stripeSecret,
      webhook: stripeWebhook,
      dashboardUrl: "https://dashboard.stripe.com/payments",
    },
    paypal: {
      ready: paypalClient && paypalSecret && paypalLive,
      clientId: paypalClient,
      secret: paypalSecret,
      liveApi: paypalLive,
      apiBase: paypalLive ? "live" : "sandbox",
      dashboardUrl: "https://www.paypal.com/businessmanage/transactions",
    },
  });
}
