"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  type AppCurrency,
  type AppLocale,
  localeDisplayNames,
  supportedCurrencies,
  supportedLocales,
} from "@/lib/i18n/config";

const iconClass =
  "inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Bouton paramètres header : langue, devise, thème (remplace les selects).
 */
export function PreferencesSettingsButton() {
  const { t } = useTranslation();
  const { locale, currency, setLocale, setCurrency } = usePreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const isDark = mounted && resolvedTheme === "dark";

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
        <div
          id={panelId}
          role="dialog"
          aria-label={t("header.settings")}
          className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background p-4 shadow-lg"
        >
          <p className="font-serif text-lg text-primary">
            {t("header.settings")}
          </p>

          <fieldset className="mt-4 space-y-2">
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
                    className={`min-h-10 min-w-12 rounded-xl px-3 text-sm transition ${
                      active
                        ? "bg-primary text-background"
                        : "bg-background-alt text-muted hover:text-foreground"
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
                    className={`min-h-10 min-w-12 rounded-xl px-3 text-sm transition ${
                      active
                        ? "bg-primary text-background"
                        : "bg-background-alt text-muted hover:text-foreground"
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
              <span className="text-muted">
                {isDark ? t("header.themeDark") : t("header.themeLight")}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Utiliser PreferencesSettingsButton */
export const LocaleCurrencySwitcher = PreferencesSettingsButton;
