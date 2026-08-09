"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import { useActionLock } from "@/lib/hooks/use-action-lock";

const DISMISS_KEY = "awura-push-dismissed";

export function PushOptIn() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locked: pending, run } = useActionLock();
  const { permission, configured, enable } = usePushSubscription();
  const [visible, setVisible] = useState(false);
  const [errorKey, setErrorKey] = useState<"blocked" | "failed" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!configured) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (permission !== "default") return;
    setVisible(true);
  }, [configured, permission]);

  if (!visible) return null;

  const onEnable = () => {
    void run(async () => {
      setErrorKey(null);
      const result = await enable();
      if (result.ok) {
        setVisible(false);
        return;
      }
      if (result.reason === "blocked") setErrorKey("blocked");
      else if (result.reason !== "unsupported") setErrorKey("failed");
    });
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-border bg-background p-4 shadow-lg md:left-auto lg:bottom-4">
      <p className="font-serif text-lg text-primary">
        {t("support.push.title")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("support.push.body")}</p>
      {errorKey === "blocked" ? (
        <p className="mt-2 text-sm text-accent" role="alert">
          {t("support.push.blockedBody")}
        </p>
      ) : null}
      {errorKey === "failed" ? (
        <p className="mt-2 text-sm text-accent" role="alert">
          {t("support.push.enableError")}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="md" pending={pending} onClick={onEnable}>
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
