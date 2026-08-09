"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import {
  type AppCurrency,
  type AppLocale,
  localeDisplayNames,
  supportedCurrencies,
  supportedLocales,
} from "@/lib/i18n/config";

const iconClass =
  "inline-flex size-10 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:size-11";

type PreferencesPanelProps = {
  id?: string;
  className?: string;
  hideTitle?: boolean;
};

/** Contenu langue / devise / thème (réutilisable header + menu mobile). */
export function PreferencesPanel({
  id,
  className,
  hideTitle = false,
}: PreferencesPanelProps) {
  const { t } = useTranslation();
  const { locale, currency, setLocale, setCurrency } = usePreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div id={id} className={className}>
      {!hideTitle ? (
        <p className="font-serif text-lg text-primary">{t("header.settings")}</p>
      ) : null}

      <fieldset className={hideTitle ? "space-y-2" : "mt-4 space-y-2"}>
        <legend className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("header.language")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {supportedLocales.map((code) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as AppLocale)}
                className={`min-h-11 min-w-12 rounded-xl px-3 text-sm transition ${
                  active
                    ? "bg-primary text-background"
                    : "bg-background-alt text-foreground"
                }`}
                aria-pressed={active}
              >
                {localeDisplayNames[code]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4 space-y-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("header.currency")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {supportedCurrencies.map((code) => {
            const active = currency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code as AppCurrency)}
                className={`min-h-11 min-w-12 rounded-xl px-3 text-sm transition ${
                  active
                    ? "bg-primary text-background"
                    : "bg-background-alt text-foreground"
                }`}
                aria-pressed={active}
              >
                {code}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 border-t border-border pt-4">
        <button
          type="button"
          disabled={!mounted}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex min-h-11 w-full items-center justify-between rounded-xl bg-background-alt px-3 text-sm text-foreground transition hover:bg-background-alt/80"
        >
          <span>{t("header.theme")}</span>
          <span className="font-medium text-foreground">
            {isDark ? t("header.themeDark") : t("header.themeLight")}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Bouton paramètres header : langue, devise, thème.
 * Desktop = popover ; mobile = bottom sheet.
 */
export function PreferencesSettingsButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={iconClass}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={t("header.settings")}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 13.1a1.7 1.7 0 0 0 .3-1.1 1.7 1.7 0 0 0-.3-1.1l1.4-1.1-1.5-2.6-1.7.5a5.4 5.4 0 0 0-1.9-1.1L15.4 4h-3l-.3 1.7a5.4 5.4 0 0 0-1.9 1.1l-1.7-.5L7 9.9l1.4 1.1a1.7 1.7 0 0 0-.3 1.1c0 .4.1.8.3 1.1L7 14.3l1.5 2.6 1.7-.5a5.4 5.4 0 0 0 1.9 1.1l.3 1.7h3l.3-1.7a5.4 5.4 0 0 0 1.9-1.1l1.7.5 1.5-2.6-1.4-1.2Z" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialogRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t("header.settings")}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[min(85vh,36rem)] overflow-y-auto rounded-t-3xl border border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none lg:absolute lg:inset-auto lg:right-0 lg:bottom-auto lg:mt-2 lg:max-h-none lg:w-[min(18rem,calc(100vw-2rem))] lg:overflow-visible lg:rounded-2xl lg:p-4 lg:pb-4 lg:shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <p className="font-serif text-xl text-primary">
                {t("header.settings")}
              </p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-xl text-foreground hover:bg-background-alt"
                aria-label={t("common.close")}
                onClick={() => setOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <PreferencesPanel hideTitle className="lg:hidden" />
            <PreferencesPanel className="hidden lg:block" />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** @deprecated Utiliser PreferencesSettingsButton */
export const LocaleCurrencySwitcher = PreferencesSettingsButton;
