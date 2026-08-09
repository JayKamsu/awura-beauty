"use client";

import { useEffect, useRef } from "react";

type UseLiveRefreshOptions = {
  /** Intervalle de polling (ms). Défaut 20s. */
  intervalMs?: number;
  /** Désactiver le refresh. */
  enabled?: boolean;
};

/**
 * Rafraîchit automatiquement les données :
 * - au focus / retour sur l’onglet
 * - en polling léger tant que l’onglet est visible
 */
export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  { intervalMs = 20_000, enabled = true }: UseLiveRefreshOptions = {},
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      void refreshRef.current();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    const onFocus = () => run();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") run();
    }, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
