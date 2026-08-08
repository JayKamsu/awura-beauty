import { NextResponse } from "next/server";
import { resolveCheckoutCart } from "@/lib/application/checkout/resolve-checkout-cart";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import { listShippingRates } from "@/lib/infrastructure/supabase/shipping-rates";

const CARRIERS: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];

/** Liste des modes activés + devis pour un panier (fidélité si Bearer). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const carrierRaw = searchParams.get("carrier") ?? "";
  const itemsRaw = searchParams.get("items") ?? "[]";
  const pointsRaw = searchParams.get("pointsToRedeem") ?? "0";

  let items: Array<{ slug?: string; quantity?: number }> = [];
  try {
    items = JSON.parse(itemsRaw) as Array<{ slug?: string; quantity?: number }>;
  } catch {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 });
  }

  const rates = await listShippingRates();
  const enabled = rates.filter((rate) => rate.enabled);

  if (!carrierRaw) {
    return NextResponse.json({ rates: enabled });
  }

  if (!CARRIERS.includes(carrierRaw as ShippingCarrier)) {
    return NextResponse.json({ error: "Invalid carrier" }, { status: 400 });
  }

  const userId = await userIdFromRequest(request);
  const pointsToRedeem = Math.max(0, Math.floor(Number(pointsRaw) || 0));
  const resolved = await resolveCheckoutCart({
    lines: items,
    carrier: carrierRaw as ShippingCarrier,
    userId,
    pointsToRedeem,
  });

  if (resolved.error && !resolved.items.length) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  return NextResponse.json({
    rates: enabled,
    quote: resolved.quote,
    subtotal: resolved.subtotal,
    shippingFee: resolved.shippingFee,
    total: resolved.total,
    loyalty: resolved.loyalty,
  });
}
