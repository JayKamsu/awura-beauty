import { NextResponse } from "next/server";
import { notifyShippingStatusChange } from "@/lib/application/notifications/order-notify";
import { container } from "@/lib/application/container";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  appendCarrierStatusEvent,
  listAllOrders,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";

/**
 * Synchronise le suivi des commandes expédiées (pull).
 * - Admin Bearer, ou
 * - Header Authorization: Bearer ${CRON_SECRET} / x-cron-secret
 *
 * Mondial Relay / La Poste n’offrent pas de webhook fiable en API 1 SOAP :
 * ce endpoint remplace un polling / cron Vercel.
 * GET : appelé par le cron Vercel (vercel.json). POST : déclenchement manuel (admin).
 */
export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const headerSecret =
    request.headers.get("x-cron-secret")?.trim() ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7).trim()
      : "");

  const isCron = Boolean(cronSecret && headerSecret && headerSecret === cronSecret);

  if (!isCron) {
    const auth = await requireAdminFromRequest(request);
    if ("error" in auth) return auth.error;
  }

  const orders = await listAllOrders();
  const trackable = orders.filter(
    (order) =>
      order.tracking_number &&
      order.shipping_carrier &&
      order.shipping_status !== "delivered",
  );

  let updated = 0;
  const errors: string[] = [];

  for (const order of trackable.slice(0, 40)) {
    try {
      const tracking = await container.shipping.track(
        order.shipping_carrier!,
        order.tracking_number!,
      );

      const latestEvent = tracking.events[0];
      await appendCarrierStatusEvent(order.id, {
        date: latestEvent?.date ?? new Date().toISOString(),
        code: latestEvent?.code ?? tracking.status,
        label: latestEvent?.label ?? tracking.statusLabel,
        status: tracking.status,
      });

      if (tracking.status !== order.shipping_status) {
        await updateOrderShipping(order.id, {
          shippingStatus: tracking.status,
          shippingCarrier: order.shipping_carrier,
          trackingNumber: order.tracking_number,
          labelUrl: order.label_url,
          labelPath: order.label_path,
          relayPointId: order.relay_point_id,
        });
        await notifyShippingStatusChange({
          userId: order.user_id,
          orderId: order.id,
          status: tracking.status,
          previousStatus: order.shipping_status,
          trackingNumber: order.tracking_number,
          pickup: order.shipping_carrier === "pickup",
        });
        updated += 1;
      }
    } catch (error) {
      errors.push(
        `${order.id}: ${error instanceof Error ? error.message : "sync failed"}`,
      );
    }
  }

  return NextResponse.json({
    checked: trackable.length,
    updated,
    errors: errors.slice(0, 10),
  });
}
