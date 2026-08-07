import { NextResponse } from "next/server";
import { notifyOrderUser } from "@/lib/connectors/firebase";
import { createLaPosteLabel } from "@/lib/infrastructure/shipping/laposte";
import { createMondialRelayLabel } from "@/lib/infrastructure/shipping/mondialrelay";
import type { ShippingCarrier } from "@/lib/infrastructure/shipping/types";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getOrderById,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";

type LabelBody = {
  orderId: string;
  carrier: ShippingCarrier;
  relayPointId?: string;
  weightGrams?: number;
};

/**
 * Génération d'étiquette — réservé à l'espace admin.
 * Ne jamais exposer les secrets transporteurs au client.
 */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as LabelBody;

  if (!body.orderId || !body.carrier) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await getOrderById(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.shipping_address) {
    return NextResponse.json(
      { error: "Order has no shipping address" },
      { status: 400 },
    );
  }

  const recipient = {
    ...order.shipping_address,
    email: order.shipping_address.email ?? order.email,
  };

  try {
    const label =
      body.carrier === "laposte"
        ? await createLaPosteLabel({
            orderId: order.id,
            recipient,
            weightGrams: body.weightGrams,
          })
        : await createMondialRelayLabel({
            orderId: order.id,
            recipient,
            weightGrams: body.weightGrams,
            relayPointId:
              body.relayPointId ?? order.relay_point_id ?? undefined,
          });

    await updateOrderShipping(order.id, {
      shippingStatus: "shipped",
      shippingCarrier: label.carrier,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl,
      relayPointId: body.relayPointId ?? order.relay_point_id,
    });

    await notifyOrderUser({
      userId: order.user_id,
      title: "Commande expédiée",
      body: label.trackingNumber
        ? `Votre colis est en route (suivi : ${label.trackingNumber}).`
        : "Votre colis Awura Beauty est en route.",
      link: "/compte#commandes",
    });

    return NextResponse.json({
      orderId: order.id,
      carrier: label.carrier,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl,
      labelBase64: label.labelBase64,
      shippingStatus: "shipped",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create label",
      },
      { status: 500 },
    );
  }
}
