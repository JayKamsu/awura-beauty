"use client";

import { useEffect } from "react";
import { saveAdminPlace } from "@/features/admin/lib/admin-place";

const RELOAD_KEY = "awura-sw-reloaded";

function reloadOnce() {
  if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
  sessionStorage.setItem(RELOAD_KEY, "1");
  if (
    window.location.pathname.startsWith("/admin") &&
    !window.location.pathname.startsWith("/admin/connexion")
  ) {
    saveAdminPlace(
      `${window.location.pathname}${window.location.search}`,
      window.scrollY,
    );
  }
  window.location.reload();
}

/**
 * Active un service worker en attente et recharge la page une seule fois.
 * Sans ce rechargement, le bouton Update du téléphone reste affiché sur l'admin et le site.
 */
export function PwaUpdateListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let hadController = Boolean(navigator.serviceWorker.controller);

    const onController = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      reloadOnce();
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; version?: string } | null;
      if (!data || data.type !== "SW_VERSION" || !data.version) return;
      const previous = localStorage.getItem("awura-sw-version");
      localStorage.setItem("awura-sw-version", data.version);
      if (hadController && previous && previous !== data.version) {
        reloadOnce();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onController);
    navigator.serviceWorker.addEventListener("message", onMessage);

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      registration.active?.postMessage({ type: "SW_VERSION" });
      if (registration.waiting && navigator.serviceWorker.controller) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
