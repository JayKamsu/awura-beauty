import { CheckoutResult } from "@/features/checkout/components/checkout-result";

type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
};

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
