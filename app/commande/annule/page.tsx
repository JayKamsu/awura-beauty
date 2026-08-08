import { CheckoutResult } from "@/features/checkout/components/checkout-result";

type CancelPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CommandeAnnulePage({
  searchParams,
}: CancelPageProps) {
  const params = await searchParams;
  return <CheckoutResult status="cancel" orderId={params.orderId} />;
}
