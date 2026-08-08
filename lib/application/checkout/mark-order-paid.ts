import { settleOrderLoyalty } from "@/lib/application/loyalty/settle-order-loyalty";
import { maybeAutoCreateLabelAfterPaid } from "@/lib/application/shipping/create-order-label";
import { notifyOrderPaid } from "@/lib/application/notifications/order-notify";
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
    // Idempotent : tente quand même l’étiquette / fidélité si absents
    await settleOrderLoyalty(order);
    await maybeAutoCreateLabelAfterPaid(orderId);
    return true;
  }

  const ok = await updateOrderPayment(orderId, {
    paymentStatus: "paid",
    status: "paid",
  });

  if (ok) {
    const paid = await getOrderById(orderId);
    if (paid) await settleOrderLoyalty(paid);
    await notifyOrderPaid({
      userId: order.user_id,
      orderId: order.id,
      pickup: order.shipping_carrier === "pickup",
    });
    await maybeAutoCreateLabelAfterPaid(orderId);
  }

  return ok;
}
