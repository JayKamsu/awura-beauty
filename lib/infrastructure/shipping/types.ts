import type { ShippingStatus } from "@/lib/infrastructure/supabase/order-types";

export type ShippingCarrier = "laposte" | "mondial_relay";

export type ShippingAddress = {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
};

export type CreateShippingLabelInput = {
  orderId: string;
  recipient: ShippingAddress;
  weightGrams?: number;
  /** Point Relais (Mondial Relay) */
  relayPointId?: string;
};

export type CreateShippingLabelResult = {
  carrier: ShippingCarrier;
  trackingNumber: string;
  labelUrl: string | null;
  labelBase64: string | null;
  rawStatus: string;
};

export type TrackingEvent = {
  date: string;
  code: string;
  label: string;
  location?: string;
};

export type TrackingResult = {
  carrier: ShippingCarrier;
  trackingNumber: string;
  status: ShippingStatus;
  statusLabel: string;
  events: TrackingEvent[];
};

export function mapCarrierStatusToShippingStatus(
  carrier: ShippingCarrier,
  code: string,
): ShippingStatus {
  const normalized = code.toUpperCase();

  if (
    normalized.includes("DELIVERED") ||
    normalized.includes("LIVRE") ||
    normalized.includes("LIVRÉ") ||
    normalized === "LIV" ||
    normalized === "DI1"
  ) {
    return "delivered";
  }

  if (
    normalized.includes("TRANSIT") ||
    normalized.includes("ROUTE") ||
    normalized.includes("ENVOI") ||
    normalized === "PC1" ||
    normalized === "ET1"
  ) {
    return "in_transit";
  }

  if (
    normalized.includes("SHIPPED") ||
    normalized.includes("PRIS") ||
    normalized.includes("EXPEDIE") ||
    normalized.includes("EXPÉDIÉ") ||
    normalized === "AAR"
  ) {
    return "shipped";
  }

  if (carrier === "mondial_relay" && normalized.startsWith("0")) {
    return "preparing";
  }

  return "shipped";
}
