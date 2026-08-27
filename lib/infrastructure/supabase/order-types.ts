export type OrderItem = {
  product_id: string;
  slug: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string;
  /** Clé de variante couleur, si le produit en propose. */
  color_key?: string | null;
};

export type PaymentMethod = "stripe" | "paypal" | "manual";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "cancelled"
  | "refunded";

export type ShippingStatus =
  | "preparing"
  | "shipped"
  | "in_transit"
  | "delivered";

export type ShippingCarrier = "laposte" | "mondial_relay" | "pickup";

export type OrderRow = {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string;
  shipping_status: ShippingStatus;
  shipping_carrier: ShippingCarrier | null;
  tracking_number: string | null;
  /** URL distante hébergée par le transporteur (Mondial Relay uniquement). */
  label_url: string | null;
  /** Chemin dans le bucket privé shipping-labels (Colissimo) — jamais une URL stockée. */
  label_path: string | null;
  relay_point_id: string | null;
  shipping_fee: number;
  points_earned: number;
  points_redeemed: number;
  discount_amount: number;
  referral_discount_applied: boolean;
  total: number;
  currency: string;
  items: OrderItem[];
  shipping_address: {
    fullName: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  } | null;
  created_at: string;
  received_at: string | null;
};

export type PaymentBadgeStatus = "paid" | "refunded" | "cancelled" | "pending";

/**
 * Statut paiement affiché (paid/refunded/cancelled/pending), dérivé de
 * order.status ET order.payment_status. Source unique — le dashboard et
 * l'écran Paiements doivent classer une commande de la même façon.
 */
export function paymentBadgeStatus(
  order: Pick<OrderRow, "status" | "payment_status">,
): PaymentBadgeStatus {
  if (order.payment_status === "paid" || order.status === "paid") {
    return "paid";
  }
  if (order.status === "refunded" || order.payment_status === "refunded") {
    return "refunded";
  }
  if (order.status === "cancelled" || order.payment_status === "cancelled") {
    return "cancelled";
  }
  return "pending";
}

/** Fenêtre de grâce avant qu'une commande "pending" jamais payée soit considérée abandonnée. */
export const ABANDONED_PENDING_ORDER_MS = 2 * 60 * 60 * 1000;

/**
 * Commande créée au clic "Payer" (Stripe/PayPal ont besoin de l'ID avant
 * paiement pour le webhook) mais jamais payée, au-delà de la fenêtre de
 * grâce — panier abandonné, pas une vraie commande à traiter.
 */
export function isAbandonedPendingOrder(
  order: Pick<OrderRow, "status" | "payment_status" | "created_at">,
  now: number = Date.now(),
): boolean {
  if (paymentBadgeStatus(order) !== "pending") return false;
  return now - new Date(order.created_at).getTime() > ABANDONED_PENDING_ORDER_MS;
}
