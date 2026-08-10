import { CheckoutResult } from "@/features/checkout/components/checkout-result";

type CancelPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

/** Page de retour après annulation du paiement : affiche le résultat "annulé" pour la commande concernée. */
export default async function CommandeAnnulePage({
  searchParams,
}: CancelPageProps) {
  const params = await searchParams;
  return <CheckoutResult status="cancel" orderId={params.orderId} />;
}
