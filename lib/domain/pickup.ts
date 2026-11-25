/** Lieu de remise à main propre tant que l'admin n'en a pas enregistré un autre. */
export const DEFAULT_PICKUP_ADDRESS = "Val de Fontenay, la gare";

/** Adresse de remise affichée au checkout, à partir des tarifs (ligne pickup). */
export function pickupAddressFromRates(
  rates: Array<{ carrier: string; pickup_address?: string | null }>,
): string {
  const row = rates.find((rate) => rate.carrier === "pickup");
  const value = row?.pickup_address?.trim();
  return value || DEFAULT_PICKUP_ADDRESS;
}
