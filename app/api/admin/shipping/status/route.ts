import { NextResponse } from "next/server";
import { notifyShippingStatusChange } from "@/lib/application/notifications/order-notify";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getOrderById,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";
import type { ShippingStatus } from "@/lib/infrastructure/supabase/order-types";

const STATUSES: ShippingStatus[] = [
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
];

/** Met à jour le statut livraison (ex. retrait prêt / récupéré) + notifie le client. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    orderId?: string;
    shippingStatus?: string;
  };

  if (!body.orderId || !body.shippingStatus) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!STATUSES.includes(body.shippingStatus as ShippingStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await getOrderById(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const shippingStatus = body.shippingStatus as ShippingStatus;
  if (shippingStatus === order.shipping_status) {
    return NextResponse.json({ ok: true, order });
  }

  const ok = await updateOrderShipping(order.id, {
    shippingStatus,
    shippingCarrier: order.shipping_carrier,
    trackingNumber: order.tracking_number,
    labelUrl: order.label_url,
    relayPointId: order.relay_point_id,
  });

  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await notifyShippingStatusChange({
    userId: order.user_id,
    orderId: order.id,
    status: shippingStatus,
    previousStatus: order.shipping_status,
    trackingNumber: order.tracking_number,
    pickup: order.shipping_carrier === "pickup",
  });

  const updated = await getOrderById(order.id);
  return NextResponse.json({ ok: true, order: updated });
}
