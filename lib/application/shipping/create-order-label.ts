import { notifyShippingStatusChange } from "@/lib/application/notifications/order-notify";
import { resolvePrintableLabelUrl } from "@/lib/application/shipping/resolve-label-preview";
import { createLaPosteLabel } from "@/lib/infrastructure/shipping/laposte";
import { createMondialRelayLabel } from "@/lib/infrastructure/shipping/mondialrelay";
import type { ShippingCarrier } from "@/lib/infrastructure/shipping/types";
import {
  getOrderById,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";

/** Résultat de création d'étiquette : succès avec suivi/URL ou message d'erreur. */
export type CreateOrderLabelResult =
  | {
      ok: true;
      trackingNumber: string;
      labelUrl: string | null;
      carrier: ShippingCarrier;
    }
  | { ok: false; error: string };

/** Crée une étiquette transporteur et met à jour la commande (service_role). */
export async function createOrderShippingLabel(input: {
  orderId: string;
  carrier: ShippingCarrier;
  relayPointId?: string | null;
  weightGrams?: number;
  notify?: boolean;
}): Promise<CreateOrderLabelResult> {
  const order = await getOrderById(input.orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (input.carrier === "pickup") {
    return { ok: false, error: "Pickup orders do not need a shipping label" };
  }
  if (!order.shipping_address) {
    return { ok: false, error: "Order has no shipping address" };
  }

  const relayPointId =
    input.relayPointId ?? order.relay_point_id ?? undefined;

  if (input.carrier === "mondial_relay" && !relayPointId) {
    return { ok: false, error: "Mondial Relay requires relayPointId" };
  }

  const recipient = {
    ...order.shipping_address,
    email: order.shipping_address.email ?? order.email,
  };

  try {
    const label =
      input.carrier === "laposte"
        ? await createLaPosteLabel({
            orderId: order.id,
            recipient,
            weightGrams: input.weightGrams,
          })
        : await createMondialRelayLabel({
            orderId: order.id,
            recipient,
            weightGrams: input.weightGrams,
            relayPointId,
          });

    const printableUrl = await resolvePrintableLabelUrl({
      orderId: order.id,
      labelUrl: label.labelUrl,
      labelBase64: label.labelBase64,
    });

    await updateOrderShipping(order.id, {
      shippingStatus: "shipped",
      shippingCarrier: label.carrier,
      trackingNumber: label.trackingNumber,
      labelUrl: printableUrl,
      relayPointId: relayPointId ?? null,
    });

    if (input.notify !== false) {
      await notifyShippingStatusChange({
        userId: order.user_id,
        orderId: order.id,
        status: "shipped",
        previousStatus: order.shipping_status,
        trackingNumber: label.trackingNumber,
        pickup: false,
      });
    }

    return {
      ok: true,
      trackingNumber: label.trackingNumber,
      labelUrl: printableUrl,
      carrier: label.carrier,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to create label",
    };
  }
}

/**
 * Après paiement : génère l’étiquette si le client a déjà choisi
 * transporteur (+ Point Relais pour Mondial Relay).
 * Désactiver avec SHIPPING_AUTO_LABEL_ON_PAID=false.
 */
export async function maybeAutoCreateLabelAfterPaid(
  orderId: string,
): Promise<void> {
  if (process.env.SHIPPING_AUTO_LABEL_ON_PAID === "false") return;

  const order = await getOrderById(orderId);
  if (!order) return;
  if (order.tracking_number) return;

  const carrier = order.shipping_carrier;
  if (!carrier || carrier === "pickup") return;
  if (carrier === "mondial_relay" && !order.relay_point_id) return;

  await createOrderShippingLabel({
    orderId,
    carrier,
    relayPointId: order.relay_point_id,
    notify: true,
  });
}
