"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";

const iconClass =
  "relative inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type PushNotificationButtonProps = {
  /** Destination quand les notifs sont déjà activées. */
  hrefWhenEnabled: string;
  variant?: "site" | "admin";
};

export function PushNotificationButton({
  hrefWhenEnabled,
  variant = "site",
}: PushNotificationButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { permission, enabled, busy, enable, configured } = usePushSubscription();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  if (!configured || permission === "unsupported") return null;

  const label =
    permission === "denied"
      ? t("support.push.blocked")
      : enabled
        ? t("support.push.enabled")
        : t("support.push.enableShort");

  const onClick = async () => {
    if (enabled) {
      router.push(hrefWhenEnabled);
      return;
    }
    if (permission === "denied") {
      setOpen((value) => !value);
      return;
    }
    const ok = await enable();
    if (ok) {
      setOpen(false);
      router.push(hrefWhenEnabled);
      return;
    }
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={iconClass}
        aria-label={label}
        title={label}
        aria-expanded={open}
        disabled={busy}
        onClick={() => void onClick()}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5 14.5h14L17.6 12.2c-.4-.6-.6-1.3-.6-2V8a5 5 0 0 0-5-5Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
        {enabled ? (
          <span
            className={`absolute right-1.5 top-1.5 size-2 rounded-full ${
              variant === "admin" ? "bg-primary" : "bg-accent"
            }`}
            aria-hidden
          />
        ) : null}
      </button>

      {open && permission === "denied" ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-background p-3 text-sm shadow-lg">
          <p className="text-primary">{t("support.push.blockedTitle")}</p>
          <p className="mt-1 text-muted">{t("support.push.blockedBody")}</p>
        </div>
      ) : null}
    </div>
  );
}
