import type { ShippingCarrier } from "@/lib/infrastructure/shipping/types";

/** Point relais sélectionnable pour la livraison. */
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

/** Alias domaine du transporteur infra, utilisé côté UI/checkout. */
export type ShippingMethod = ShippingCarrier;
