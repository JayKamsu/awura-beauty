import { NextResponse } from "next/server";
import { resolveOrderItemsFromCatalog } from "@/lib/application/checkout/resolve-order-items";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import { listShippingRates } from "@/lib/infrastructure/supabase/shipping-rates";

const CARRIERS: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];

/** Liste des modes activés + devis pour un panier. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const carrierRaw = searchParams.get("carrier") ?? "";
  const itemsRaw = searchParams.get("items") ?? "[]";

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

  const resolved = await resolveOrderItemsFromCatalog(
    items,
    carrierRaw as ShippingCarrier,
  );

  if (resolved.error && !resolved.items.length) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  return NextResponse.json({
    rates: enabled,
    quote: resolved.quote,
    subtotal: resolved.subtotal,
    shippingFee: resolved.shippingFee,
    total: resolved.total,
  });
}
