import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import {
  listShippingRates,
  upsertShippingRates,
} from "@/lib/infrastructure/supabase/shipping-rates";

/** Liste les tarifs de livraison par transporteur — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const rates = await listShippingRates();
  return NextResponse.json({ rates });
}

type PutBody = {
  rates?: Array<{
    carrier: ShippingCarrier;
    enabled: boolean;
    base_fee: number;
    free_shipping_min: number | null;
  }>;
};

/** Met à jour les tarifs de livraison (validés puis remplacés en bloc) — admin uniquement. */
export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as PutBody;
  if (!Array.isArray(body.rates) || !body.rates.length) {
    return NextResponse.json({ error: "rates required" }, { status: 400 });
  }

  const allowed: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];
  for (const rate of body.rates) {
    if (!allowed.includes(rate.carrier)) {
      return NextResponse.json({ error: "Invalid carrier" }, { status: 400 });
    }
    if (Number(rate.base_fee) < 0) {
      return NextResponse.json({ error: "Invalid base_fee" }, { status: 400 });
    }
  }

  const result = await upsertShippingRates(
    body.rates.map((rate) => ({
      carrier: rate.carrier,
      enabled: Boolean(rate.enabled),
      base_fee: Number(rate.base_fee) || 0,
      free_shipping_min:
        rate.free_shipping_min === null ||
        rate.free_shipping_min === undefined ||
        Number.isNaN(Number(rate.free_shipping_min))
          ? null
          : Number(rate.free_shipping_min),
    })),
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Save failed" },
      { status: 500 },
    );
  }

  const rates = await listShippingRates();
  return NextResponse.json({ rates });
}
