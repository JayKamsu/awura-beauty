import { CheckoutResult } from "@/features/checkout/components/checkout-result";

type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
};

/** Page de retour après paiement réussi : affiche le résultat "succès" pour la commande et la session Stripe concernées. */
export default async function CommandeSuccesPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  return (
    <CheckoutResult
      status="success"
      orderId={params.orderId}
      sessionId={params.session_id}
    />
  );
}
