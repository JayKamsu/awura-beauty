import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";

type ShippingBody = {
  shippingCarrier?: string;
  relayPointId?: string | null;
  shippingAddress?: {
    phone?: string;
    fullName?: string;
  };
};

const CARRIERS: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];

export function resolveCheckoutShipping(body: ShippingBody):
  | { ok: true; shippingCarrier: ShippingCarrier; relayPointId: string | null }
  | { ok: false; error: string } {
  const raw = String(body.shippingCarrier ?? "laposte");
  const shippingCarrier = (
    CARRIERS.includes(raw as ShippingCarrier) ? raw : "laposte"
  ) as ShippingCarrier;

  const relayPointId =
    shippingCarrier === "mondial_relay"
      ? String(body.relayPointId ?? "").trim() || null
      : null;

  if (shippingCarrier === "mondial_relay" && !relayPointId) {
    return { ok: false, error: "Relay point required" };
  }

  if (
    (shippingCarrier === "mondial_relay" || shippingCarrier === "pickup") &&
    !String(body.shippingAddress?.phone ?? "").trim()
  ) {
    return { ok: false, error: "Phone required" };
  }

  if (!String(body.shippingAddress?.fullName ?? "").trim()) {
    return { ok: false, error: "Name required" };
  }

  return { ok: true, shippingCarrier, relayPointId };
}
