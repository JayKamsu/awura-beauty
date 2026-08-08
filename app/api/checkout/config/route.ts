import { NextResponse } from "next/server";

/**
 * Config paiement exposable au client (clés publishable uniquement).
 * Contourne le cas où NEXT_PUBLIC_* marquées « Sensitive » sur Vercel
 * ne sont pas injectées dans le bundle navigateur.
 */
export async function GET() {
  const stripePublishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const paypalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ?? "";

  return NextResponse.json({
    stripePublishableKey,
    paypalClientId,
    stripeReady: Boolean(stripePublishableKey),
    paypalReady: Boolean(paypalClientId),
  });
}
