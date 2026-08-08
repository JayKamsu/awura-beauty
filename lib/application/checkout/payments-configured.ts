/**
 * True si Stripe ou PayPal sont réellement branchés côté serveur.
 * Tant que c’est false, le checkout manuel (test) reste autorisé.
 */
export function isLivePaymentConfigured(): boolean {
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const paypal = Boolean(process.env.PAYPAL_CLIENT_SECRET?.trim());
  return stripe || paypal;
}
