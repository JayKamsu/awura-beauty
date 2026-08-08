import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";

type ShippingBody = {
  shippingCarrier?: string;
  relayPointId?: string | null;
  shippingAddress?: {
    phone?: string;
  };
};

export function resolveCheckoutShipping(body: ShippingBody):
  | { ok: true; shippingCarrier: ShippingCarrier; relayPointId: string | null }
  | { ok: false; error: string } {
  const shippingCarrier: ShippingCarrier =
    body.shippingCarrier === "mondial_relay" ? "mondial_relay" : "laposte";

  const relayPointId =
    shippingCarrier === "mondial_relay"
      ? String(body.relayPointId ?? "").trim() || null
      : null;

  if (shippingCarrier === "mondial_relay" && !relayPointId) {
    return { ok: false, error: "Relay point required" };
  }

  if (
    shippingCarrier === "mondial_relay" &&
    !String(body.shippingAddress?.phone ?? "").trim()
  ) {
    return { ok: false, error: "Phone required for Mondial Relay" };
  }

  return { ok: true, shippingCarrier, relayPointId };
}
