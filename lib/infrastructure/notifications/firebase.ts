/**
 * Adapter Firebase Cloud Messaging (serveur).
 * Env : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Client : NEXT_PUBLIC_FIREBASE_* + NEXT_PUBLIC_FIREBASE_VAPID_KEY
 */

import type { NotificationPort } from "@/lib/application/ports";
import type { NotificationPayload } from "@/lib/domain";
import {
  getFirebaseMessaging,
  isFirebaseAdminConfigured,
} from "@/lib/infrastructure/notifications/firebase-admin";
import {
  deletePushTokens,
  listAllPushTokens,
  listPushTokensForUser,
} from "@/lib/infrastructure/supabase/push-subscriptions";

async function resolveTokens(payload: NotificationPayload): Promise<string[]> {
  if (payload.userId) {
    return listPushTokensForUser(payload.userId);
  }
  if (payload.data?.token) {
    return [payload.data.token];
  }
  if (payload.data?.broadcast === "true") {
    return listAllPushTokens();
  }
  return [];
}

export const firebaseNotificationAdapter: NotificationPort = {
  configured: isFirebaseAdminConfigured,

  async send(payload: NotificationPayload) {
    if (payload.channel !== "push") {
      return { ok: true, stub: true };
    }

    const tokens = await resolveTokens(payload);

    if (!isFirebaseAdminConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[notifications:stub]",
          payload.title,
          `(${tokens.length} tokens)`,
        );
      }
      return { ok: true, stub: true };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return { ok: false, error: "Firebase messaging unavailable" };
    }

    if (!tokens.length) {
      return { ok: true };
    }

    const link = payload.data?.link;
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: link
        ? {
            fcmOptions: { link },
          }
        : undefined,
    });

    const stale: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code ?? "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) {
          stale.push(tokens[index]);
        }
      }
    });
    if (stale.length) await deletePushTokens(stale);

    if (response.failureCount === tokens.length) {
      return {
        ok: false,
        error: response.responses[0]?.error?.message ?? "All sends failed",
      };
    }

    return { ok: true };
  },
};

export async function broadcastPush(input: {
  title: string;
  body: string;
  link?: string;
}): Promise<{ ok: boolean; count: number; stub?: boolean; error?: string }> {
  const tokens = await listAllPushTokens();
  const result = await firebaseNotificationAdapter.send({
    title: input.title,
    body: input.body,
    channel: "push",
    data: {
      broadcast: "true",
      ...(input.link ? { link: input.link } : {}),
    },
  });

  return {
    ok: result.ok,
    count: tokens.length,
    stub: result.stub,
    error: result.error,
  };
}

export async function notifyOrderUser(input: {
  userId: string | null | undefined;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  if (!input.userId) return;
  await firebaseNotificationAdapter.send({
    userId: input.userId,
    title: input.title,
    body: input.body,
    channel: "push",
    data: input.link ? { link: input.link } : undefined,
  });
}
