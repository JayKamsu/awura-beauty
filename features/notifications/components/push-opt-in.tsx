"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import {
  isFirebaseClientConfigured,
  requestWebPushToken,
} from "@/lib/connectors/firebase-client";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { getSession } from "@/lib/infrastructure/supabase/auth";

const DISMISS_KEY = "awura-push-dismissed";

export function PushOptIn() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFirebaseClientConfigured()) return;
    if (!("Notification" in window)) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const enable = () => {
    void run(async () => {
      const token = await requestWebPushToken();
      if (!token) return;

      const session = await getSession();
      await fetch("/api/push/subscribe", {
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

      setVisible(false);
    });
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-border bg-background p-4 shadow-lg md:left-auto lg:bottom-4">
      <p className="font-serif text-lg text-primary">
        {t("support.push.title")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("support.push.body")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="md" pending={pending} onClick={enable}>
          {pending ? t("support.push.enabling") : t("support.push.enable")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          {t("support.push.later")}
        </Button>
      </div>
      {user ? null : (
        <p className="mt-2 text-xs text-muted">{t("support.push.guestHint")}</p>
      )}
    </div>
  );
}
