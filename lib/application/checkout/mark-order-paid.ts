import { maybeAutoCreateLabelAfterPaid } from "@/lib/application/shipping/create-order-label";
import { notifyOrderUser } from "@/lib/connectors/firebase";
import {
  getOrderById,
  updateOrderPayment,
} from "@/lib/infrastructure/supabase/orders";

/** Marque une commande payée (service_role) + notif push + étiquette auto si possible. */
export async function markOrderPaid(orderId: string): Promise<boolean> {
  if (!orderId || orderId.startsWith("demo-")) return true;

  const order = await getOrderById(orderId);
  if (!order) return false;
  if (order.payment_status === "paid" || order.status === "paid") {
    // Idempotent : tente quand même l’étiquette si absente
    await maybeAutoCreateLabelAfterPaid(orderId);
    return true;
  }

  const ok = await updateOrderPayment(orderId, {
    paymentStatus: "paid",
    status: "paid",
  });

  if (ok) {
    await notifyOrderUser({
      userId: order.user_id,
      title: "Commande confirmée",
      body: "Merci ! Votre paiement Awura Beauty est confirmé.",
      link: "/compte#commandes",
    });
    await maybeAutoCreateLabelAfterPaid(orderId);
  }

  return ok;
}
