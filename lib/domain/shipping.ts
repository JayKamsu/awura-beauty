import type { ShippingCarrier } from "@/lib/infrastructure/shipping/types";

export type RelayPoint = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  distanceKm?: number | null;
  lat?: number | null;
  lng?: number | null;
};

export type ShippingMethod = ShippingCarrier;
