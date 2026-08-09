"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getFirebaseMessagingClient,
  isFirebaseClientConfigured,
} from "@/lib/connectors/firebase-client";
import { onMessage } from "firebase/messaging";

/**
 * Affiche une notification navigateur quand un message FCM arrive
 * alors que l’onglet est au premier plan, et gère le clic → redirection.
 */
export function PushForegroundListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseClientConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let unsubscribe: (() => void) | undefined;

    void getFirebaseMessagingClient().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "Awura Beauty";
        const body = payload.notification?.body ?? "";
        const link = payload.data?.link || "/";

        const notification = new Notification(title, {
          body,
          icon: "/icon",
          data: { link },
        });

        notification.onclick = () => {
          notification.close();
          window.focus();
          try {
            const url = new URL(link, window.location.origin);
            if (url.origin === window.location.origin) {
              router.push(`${url.pathname}${url.search}${url.hash}`);
            } else {
              window.location.href = url.href;
            }
          } catch {
            router.push(link.startsWith("/") ? link : "/");
          }
        };
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [router]);

  return null;
}
