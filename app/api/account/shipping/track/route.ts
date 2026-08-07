import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";

/**
 * Suivi livraison pour la page compte client.
 * Utilise le numéro de suivi stocké sur la commande.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await container.orders.getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
