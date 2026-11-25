"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isFirebaseClientConfigured,
  requestWebPushToken,
} from "@/lib/connectors/firebase-client";
import { getSession } from "@/lib/infrastructure/supabase/auth";

/** État de la permission de notification du navigateur. */
export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

/** Résultat de la tentative d'activation des notifications push. */
export type PushEnableResult =
  | { ok: true; mode: "push" | "local" }
  | { ok: false; reason: "unsupported" | "blocked" | "failed" };

/** push = FCM arrière-plan ; local = alertes tant que le site est ouvert. */
export type PushDeliveryMode = "push" | "local" | "off";

const MODE_KEY = "awura-notify-mode";
let reconcileStarted = false;

function readStoredMode(): PushDeliveryMode {
  if (typeof window === "undefined") return "off";
  const value = localStorage.getItem(MODE_KEY);
  if (value === "push" || value === "local") return value;
  return "off";
}

function storeMode(mode: "push" | "local") {
  localStorage.setItem(MODE_KEY, mode);
}

/** Gère l'état de la permission push et l'abonnement de l'appareil (demande le token FCM et l'enregistre côté serveur). */
export function usePushSubscription() {
  const [permission, setPermission] =
    useState<PushPermissionState>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<PushDeliveryMode>("off");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!isFirebaseClientConfigured() || !("Notification" in window)) {
      setPermission("unsupported");
      setEnabled(false);
      return;
    }
    const next = Notification.permission as PushPermissionState;
    const stored = readStoredMode();
    setPermission(next);
    if (next !== "granted") {
      setMode("off");
      setEnabled(false);
      return;
    }
    const resolved: PushDeliveryMode = stored === "local" ? "local" : "push";
    setMode(resolved);
    setEnabled(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async (
    permissionPromise?: Promise<NotificationPermission>,
  ): Promise<PushEnableResult> => {
    setBusy(true);
    try {
      if (!isFirebaseClientConfigured()) {
        refresh();
        return { ok: false, reason: "unsupported" };
      }

      const tokenResult = await requestWebPushToken(permissionPromise);
      if (!tokenResult.ok) {
        if (
          tokenResult.reason === "push-service" &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          storeMode("local");
          refresh();
          return { ok: true, mode: "local" };
        }
        refresh();
        if (
          tokenResult.reason === "denied" ||
          (typeof Notification !== "undefined" &&
            Notification.permission === "denied")
        ) {
          return { ok: false, reason: "blocked" };
        }
        if (tokenResult.reason === "unsupported") {
          return { ok: false, reason: "unsupported" };
        }
        return { ok: false, reason: "failed" };
      }

      const session = await getSession();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          token: tokenResult.token,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        refresh();
        return { ok: false, reason: "failed" };
      }
      storeMode("push");
      refresh();
      return { ok: true, mode: "push" };
    } catch {
      refresh();
      return { ok: false, reason: "failed" };
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const reconcileAttempted = useRef(false);
  useEffect(() => {
    if (reconcileAttempted.current || reconcileStarted) return;
    if (permission !== "granted") return;
    if (readStoredMode() !== "off") return;
    reconcileAttempted.current = true;
    reconcileStarted = true;
    void enable();
  }, [permission, enable]);

  return {
    permission,
    enabled,
    mode,
    busy,
    enable,
    refresh,
    configured: isFirebaseClientConfigured(),
  };
}
