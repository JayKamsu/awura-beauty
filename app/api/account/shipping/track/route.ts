import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

async function getOrderForAccount(orderId: string): Promise<OrderRow | null> {
  const admin = createAdminSupabaseClient();
  if (admin) {
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      user_id: data.user_id ? String(data.user_id) : null,
      email: String(data.email ?? ""),
      status: data.status as OrderRow["status"],
      payment_method: data.payment_method as OrderRow["payment_method"],
      payment_status: String(data.payment_status ?? "pending"),
      shipping_status:
        (data.shipping_status as OrderRow["shipping_status"]) ?? "preparing",
      shipping_carrier:
        (data.shipping_carrier as OrderRow["shipping_carrier"]) ?? null,
      tracking_number: data.tracking_number
        ? String(data.tracking_number)
        : null,
      label_url: data.label_url ? String(data.label_url) : null,
      relay_point_id: data.relay_point_id ? String(data.relay_point_id) : null,
      total: Number(data.total ?? 0),
      currency: String(data.currency ?? "EUR"),
      items: (data.items as OrderRow["items"]) ?? [],
      shipping_address:
        (data.shipping_address as OrderRow["shipping_address"]) ?? null,
      created_at: String(data.created_at),
    };
  }

  return container.orders.getOrderById(orderId);
}

/**
 * Suivi livraison pour la page compte client.
 * Exige une session et la propriété de la commande.
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;
  const user = await getUserFromAccessToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await getOrderForAccount(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const ownsOrder =
    (order.user_id && order.user_id === user.id) ||
    (user.email &&
      order.email.toLowerCase() === user.email.toLowerCase());

  if (!ownsOrder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!order.tracking_number || !order.shipping_carrier) {
    return NextResponse.json({
      orderId: order.id,
      shippingStatus: order.shipping_status,
      statusLabel: "En préparation",
      trackingNumber: null,
      carrier: null,
      events: [],
    });
  }

  try {
    const tracking = await container.shipping.track(
      order.shipping_carrier,
      order.tracking_number,
    );

    await container.orders.updateOrderShipping(order.id, {
      shippingStatus: tracking.status,
      shippingCarrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      labelUrl: order.label_url,
    });

    return NextResponse.json({
      orderId: order.id,
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      shippingStatus: tracking.status,
      statusLabel: tracking.statusLabel,
      events: tracking.events,
      labelUrl: order.label_url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to fetch tracking",
        shippingStatus: order.shipping_status,
        trackingNumber: order.tracking_number,
        carrier: order.shipping_carrier,
      },
      { status: 500 },
    );
  }
}
