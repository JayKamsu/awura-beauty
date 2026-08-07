import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export type StripeLineItem = {
  name: string;
  unitAmountCents: number;
  quantity: number;
  imageUrl?: string;
};

export async function createStripeCheckoutSession(input: {
  orderId: string;
  customerEmail: string;
  currency: string;
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; error: string | null }> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: null, error: "Stripe is not configured" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.orderId,
    metadata: { orderId: input.orderId },
    line_items: input.lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: item.unitAmountCents,
        product_data: {
          name: item.name,
          images: item.imageUrl?.startsWith("http") ? [item.imageUrl] : undefined,
        },
      },
    })),
  });

  return { url: session.url, error: null };
}
