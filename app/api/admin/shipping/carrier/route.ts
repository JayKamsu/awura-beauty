import { NextResponse } from "next/server";
import { notifyCarrierChanged } from "@/lib/application/notifications/order-notify";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getOrderById,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";

const CARRIERS: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];

/**
 * Change le transporteur d’une commande (choix admin) et notifie le client.
 * Réinitialise étiquette / suivi car l’ancien n’est plus valide.
 */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    orderId?: string;
    shippingCarrier?: string;
    relayPointId?: string | null;
  };

  if (!body.orderId || !body.shippingCarrier) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!CARRIERS.includes(body.shippingCarrier as ShippingCarrier)) {
    return NextResponse.json({ error: "Invalid carrier" }, { status: 400 });
  }

  const shippingCarrier = body.shippingCarrier as ShippingCarrier;
  const relayPointId =
    shippingCarrier === "mondial_relay"
      ? String(body.relayPointId ?? "").trim() || null
      : null;

  if (shippingCarrier === "mondial_relay" && !relayPointId) {
    return NextResponse.json(
      { error: "Relay point required for Mondial Relay" },
      { status: 400 },
    );
  }

  const order = await getOrderById(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const previousCarrier = order.shipping_carrier;
  const sameCarrier = previousCarrier === shippingCarrier;
  const sameRelay =
    shippingCarrier !== "mondial_relay" ||
    (order.relay_point_id ?? null) === relayPointId;

  if (sameCarrier && sameRelay) {
    return NextResponse.json({ ok: true, order, unchanged: true });
  }

  const ok = await updateOrderShipping(order.id, {
    shippingStatus: "preparing",
    shippingCarrier,
    trackingNumber: null,
    labelUrl: null,
    relayPointId,
  });

  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await notifyCarrierChanged({
    userId: order.user_id,
    orderId: order.id,
    previousCarrier,
    shippingCarrier,
    relayPointId,
  });

  const updated = await getOrderById(order.id);
  return NextResponse.json({ ok: true, order: updated });
}
