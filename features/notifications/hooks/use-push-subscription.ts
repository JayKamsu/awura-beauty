"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isFirebaseClientConfigured,
  requestWebPushToken,
} from "@/lib/connectors/firebase-client";
import { getSession } from "@/lib/infrastructure/supabase/auth";

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export type PushEnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "blocked" | "failed" };

export function usePushSubscription() {
  const [permission, setPermission] =
    useState<PushPermissionState>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!isFirebaseClientConfigured() || !("Notification" in window)) {
      setPermission("unsupported");
      setEnabled(false);
      return;
    }
    const next = Notification.permission as PushPermissionState;
    setPermission(next);
    setEnabled(next === "granted");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async (): Promise<PushEnableResult> => {
    setBusy(true);
    try {
      if (!isFirebaseClientConfigured()) {
        refresh();
        return { ok: false, reason: "unsupported" };
      }

      const token = await requestWebPushToken();
      if (!token) {
        refresh();
        const denied =
          typeof Notification !== "undefined" &&
          Notification.permission === "denied";
        return { ok: false, reason: denied ? "blocked" : "failed" };
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
          token,
          userAgent: navigator.userAgent,
        }),
      });

      refresh();
      if (!res.ok) {
        return { ok: false, reason: "failed" };
      }
      setEnabled(true);
      return { ok: true };
    } catch {
      refresh();
      return { ok: false, reason: "failed" };
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return {
    permission,
    enabled,
    busy,
    enable,
    refresh,
    configured: isFirebaseClientConfigured(),
  };
}
