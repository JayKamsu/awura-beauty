"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { useState } from "react";

const METHODS = ["stripe", "paypal"] as const;

export function AccountPaymentsSection() {
  const { t } = useTranslation();
  const { locked: pending, run } = useActionLock();
  const { permission, enabled, configured, enable } = usePushSubscription();
  const [errorKey, setErrorKey] = useState<"blocked" | "failed" | null>(null);

  const onEnablePush = () => {
    void run(async () => {
      setErrorKey(null);
      const result = await enable();
      if (result.ok) return;
      if (result.reason === "blocked") setErrorKey("blocked");
      else if (result.reason !== "unsupported") setErrorKey("failed");
    });
  };

  return (
    <section id="paiements" className="space-y-6 rounded-2xl border border-border p-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl text-primary">
          {t("account.payments.title")}
        </h2>
        <p className="text-sm text-muted">{t("account.payments.subtitle")}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-primary">
          {t("account.payments.methodsTitle")}
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((method) => (
            <li
              key={method}
              className="rounded-xl bg-background-alt px-4 py-3 text-sm"
            >
              <p className="font-medium text-primary">
                {t(`checkout.methods.${method}.label`)}
              </p>
              <p className="mt-1 text-muted">
                {t(`checkout.methods.${method}.hint`)}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">{t("account.payments.methodsHint")}</p>
      </div>

      <div className="space-y-3 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-primary">
          {t("account.payments.notificationsTitle")}
        </h3>
        <p className="text-sm text-muted">
          {t("account.payments.notificationsBody")}
        </p>
        {!configured ? (
          <p className="text-sm text-muted">
            {t("account.payments.pushUnavailable")}
          </p>
        ) : enabled || permission === "granted" ? (
          <p className="text-sm text-primary" role="status">
            {t("support.push.enabled")}
          </p>
        ) : permission === "denied" ? (
          <div className="space-y-1 text-sm">
            <p className="text-accent">{t("support.push.blockedTitle")}</p>
            <p className="text-muted">{t("support.push.blockedBody")}</p>
          </div>
        ) : (
          <>
            <Button type="button" size="md" pending={pending} onClick={onEnablePush}>
              {pending ? t("support.push.enabling") : t("support.push.enable")}
            </Button>
            {errorKey === "blocked" ? (
              <p className="text-sm text-accent" role="alert">
                {t("support.push.blockedBody")}
              </p>
            ) : null}
            {errorKey === "failed" ? (
              <p className="text-sm text-accent" role="alert">
                {t("support.push.enableError")}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-5 text-sm text-muted">
        <p>{t("account.payments.receiptHint")}</p>
        <p>{t("account.payments.refundHint")}</p>
        <Button href="/compte/messages" variant="primary-outline" size="md">
          {t("account.payments.contactSupport")}
        </Button>
      </div>
    </section>
  );
}
