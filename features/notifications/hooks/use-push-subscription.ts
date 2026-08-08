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

export function usePushSubscription() {
  const [permission, setPermission] = useState<PushPermissionState>("unsupported");
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

  const enable = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const token = await requestWebPushToken();
      if (!token) {
        refresh();
        return false;
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
      return res.ok;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { permission, enabled, busy, enable, refresh, configured: isFirebaseClientConfigured() };
}
