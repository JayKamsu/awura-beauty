/** Canal BroadcastChannel pour synchroniser le catalogue public après une écriture admin. */
export const CATALOG_SYNC_CHANNEL = "awura-catalog";

/** Signale aux autres onglets du même origine que le catalogue a changé. */
export function notifyCatalogChanged() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(CATALOG_SYNC_CHANNEL);
  channel.postMessage({ type: "changed" });
  channel.close();
}
