import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";

export type ShippingRateRow = {
  carrier: ShippingCarrier;
  enabled: boolean;
  base_fee: number;
  free_shipping_min: number | null;
  updated_at: string;
};

const DEFAULT_RATES: ShippingRateRow[] = [
  {
    carrier: "laposte",
    enabled: true,
    base_fee: 5.9,
    free_shipping_min: 80,
    updated_at: new Date().toISOString(),
  },
  {
    carrier: "mondial_relay",
    enabled: true,
    base_fee: 4.5,
    free_shipping_min: 80,
    updated_at: new Date().toISOString(),
  },
  {
    carrier: "pickup",
    enabled: true,
    base_fee: 0,
    free_shipping_min: null,
    updated_at: new Date().toISOString(),
  },
];

function mapRate(row: Record<string, unknown>): ShippingRateRow {
  return {
    carrier: row.carrier as ShippingCarrier,
    enabled: Boolean(row.enabled),
    base_fee: Number(row.base_fee ?? 0),
    free_shipping_min:
      row.free_shipping_min === null || row.free_shipping_min === undefined
        ? null
        : Number(row.free_shipping_min),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function listShippingRates(): Promise<ShippingRateRow[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return DEFAULT_RATES;

  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*")
    .order("carrier");

  if (error || !data?.length) return DEFAULT_RATES;
  return data.map((row) => mapRate(row as Record<string, unknown>));
}

export async function upsertShippingRates(
  rates: Array<{
    carrier: ShippingCarrier;
    enabled: boolean;
    base_fee: number;
    free_shipping_min: number | null;
  }>,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Admin Supabase not configured" };
  }

  const payload = rates.map((rate) => ({
    carrier: rate.carrier,
    enabled: rate.enabled,
    base_fee: rate.base_fee,
    free_shipping_min: rate.free_shipping_min,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("shipping_rates").upsert(payload, {
    onConflict: "carrier",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
