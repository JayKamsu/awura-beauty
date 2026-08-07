/**
 * Adapter Firebase Cloud Messaging — stub jusqu'à configuration.
 * Env prévues : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * (ou NEXT_PUBLIC_FIREBASE_* côté client si besoin).
 */

import type { NotificationPort } from "@/lib/application/ports";
import type { NotificationPayload } from "@/lib/domain";

function isConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export const firebaseNotificationAdapter: NotificationPort = {
  configured: isConfigured,

  async send(payload: NotificationPayload) {
    if (!isConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[notifications:stub]", payload.title, payload.channel);
      }
      return { ok: true, stub: true };
    }

    // Implémentation FCM à brancher lors de la config Firebase
    return {
      ok: false,
      error: "Firebase adapter not implemented yet — configure credentials later",
    };
  },
};
