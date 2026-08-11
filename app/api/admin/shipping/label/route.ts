import { NextResponse } from "next/server";
import { createOrderShippingLabel } from "@/lib/application/shipping/create-order-label";
import type { ShippingCarrier } from "@/lib/infrastructure/shipping/types";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

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

  const result = await createOrderShippingLabel({
    orderId: body.orderId,
    carrier: body.carrier,
    relayPointId: body.relayPointId,
    weightGrams: body.weightGrams,
    notify: true,
  });

  if (!result.ok) {
    const status =
      result.error === "Order not found"
        ? 404
        : result.error.includes("requires")
          ? 400
          : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    orderId: body.orderId,
    carrier: result.carrier,
    trackingNumber: result.trackingNumber,
    labelUrl: result.previewUrl,
    shippingStatus: "shipped",
  });
}
