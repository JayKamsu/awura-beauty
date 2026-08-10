import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

export type ResolvedPaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "cancelled";

/**
 * Statut de paiement affiché au client.
 * Ne pas utiliser `order.status` seul : il passe à `processing` dès l’expédition.
 */
export function resolvePaymentStatus(
  order: Pick<OrderRow, "payment_status" | "status">,
): ResolvedPaymentStatus {
  const pay = String(order.payment_status ?? "").toLowerCase();
  const status = String(order.status ?? "").toLowerCase();

  if (pay === "refunded" || status === "refunded") return "refunded";
  if (pay === "cancelled" || status === "cancelled") return "cancelled";
  if (pay === "paid" || status === "paid" || status === "processing") {
    return "paid";
  }
  return "pending";
}

/** Raccourci booléen sur `resolvePaymentStatus`. */
export function isOrderPaid(
  order: Pick<OrderRow, "payment_status" | "status">,
): boolean {
  return resolvePaymentStatus(order) === "paid";
}
