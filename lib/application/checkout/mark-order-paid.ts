import { adjustOrderStock } from "@/lib/application/checkout/adjust-order-stock";
import { settleOrderLoyalty } from "@/lib/application/loyalty/settle-order-loyalty";
import { maybeAutoCreateLabelAfterPaid } from "@/lib/application/shipping/create-order-label";
import { notifyOrderPaid } from "@/lib/application/notifications/order-notify";
import { gammeCompleteUnitsInOrder } from "@/lib/domain/bundle";
import { grantDiagnosticEntitlements } from "@/lib/infrastructure/supabase/diagnostic-entitlements";
import {
  claimOrderPaid,
  getOrderById,
} from "@/lib/infrastructure/supabase/orders";

/**
 * Marque une commande payée (service_role) + notif push + étiquette auto.
 * Idempotent : webhook Stripe + confirm navigateur peuvent arriver en parallèle
 * — une seule transition déclenche les side-effects (notif).
 */
export async function markOrderPaid(orderId: string): Promise<boolean> {
  if (!orderId || orderId.startsWith("demo-")) return true;

  const result = await claimOrderPaid(orderId);

  if (result.claimed && result.order) {
    await adjustOrderStock(result.order.items, -1);
    await settleOrderLoyalty(result.order);
    await grantGammeDiagnosticEntitlements(result.order);
    await notifyOrderPaid({
      userId: result.order.user_id,
      orderId: result.order.id,
      pickup: result.order.shipping_carrier === "pickup",
    });
    await maybeAutoCreateLabelAfterPaid(orderId);
    return true;
  }

  if (result.alreadyPaid) {
    const order = result.order ?? (await getOrderById(orderId));
    if (order) await settleOrderLoyalty(order);
    await maybeAutoCreateLabelAfterPaid(orderId);
    return true;
  }

  return false;
}

async function grantGammeDiagnosticEntitlements(order: {
  id: string;
  user_id: string | null;
  email: string;
  items: Array<{ slug: string; quantity: number }>;
}) {
  const units = gammeCompleteUnitsInOrder(order.items);
  if (units <= 0) return;
  await grantDiagnosticEntitlements({
    userId: order.user_id,
    email: order.email,
    orderId: order.id,
    count: units,
  });
}
