"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/features/pwa/hooks/use-pwa-install";
import { useActionLock } from "@/lib/hooks/use-action-lock";

const DISMISS_KEY = "awura-pwa-dismissed";

type PwaInstallControlsProps = {
  /** Bannière flottante vs bloc profil. */
  variant?: "banner" | "inline";
};

export function PwaInstallControls({
  variant = "inline",
}: PwaInstallControlsProps) {
  const { t } = useTranslation();
  const { locked: pending, run } = useActionLock();
  const { installed, available, canPrompt, iosHint, ready, install } =
    usePwaInstall();
  const [visible, setVisible] = useState(variant === "inline");
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (variant !== "banner") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (!available) return;
    setVisible(true);
  }, [available, variant]);

  if (installed) {
    if (variant === "banner") return null;
    return (
      <p className="text-sm text-primary" role="status">
        {t("support.pwa.installed")}
      </p>
    );
  }

  if (variant === "banner" && (!available || !visible)) return null;

  if (variant === "inline" && ready && !available && !iosHint) {
    return (
      <div className="space-y-2">
        <p className="font-serif text-lg text-primary">{t("support.pwa.title")}</p>
        <p className="text-sm text-muted">{t("support.pwa.body")}</p>
        <p className="text-sm text-muted">{t("support.pwa.manualHint")}</p>
      </div>
    );
  }

  if (variant === "inline" && !ready) {
    return <p className="text-sm text-muted">{t("support.pwa.body")}</p>;
  }

  if (!available || !visible) return null;

  const onInstall = () => {
    if (canPrompt) {
      void run(async () => {
        await install();
      });
      return;
    }
    if (iosHint) setShowIosSteps(true);
  };

  const body = (
    <>
      <p className="font-serif text-lg text-primary">{t("support.pwa.title")}</p>
      <p className="mt-1 text-sm text-muted">{t("support.pwa.body")}</p>
      {showIosSteps || (iosHint && !canPrompt && variant === "inline") ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>{t("support.pwa.iosStep1")}</li>
          <li>{t("support.pwa.iosStep2")}</li>
          <li>{t("support.pwa.iosStep3")}</li>
        </ol>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {canPrompt || (iosHint && !showIosSteps) ? (
          <Button type="button" size="md" pending={pending} onClick={onInstall}>
            {pending ? t("support.pwa.installing") : t("support.pwa.install")}
          </Button>
        ) : null}
        {variant === "banner" ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setVisible(false);
            }}
          >
            {t("support.pwa.later")}
          </Button>
        ) : null}
      </div>
    </>
  );

  if (variant === "banner") {
    return (
      <div className="fixed bottom-36 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-border bg-background p-4 shadow-lg md:bottom-28 md:left-auto lg:bottom-24">
        {body}
      </div>
    );
  }

  return <div className="space-y-2">{body}</div>;
}
