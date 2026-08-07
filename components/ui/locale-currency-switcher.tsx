"use client";

import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  type AppCurrency,
  type AppLocale,
  localeDisplayNames,
  supportedCurrencies,
  supportedLocales,
} from "@/lib/i18n/config";

export function LocaleCurrencySwitcher() {
  const { t } = useTranslation();
  const { locale, currency, setLocale, setCurrency } = usePreferences();

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted">
      <label className="sr-only" htmlFor="awura-locale">
        {t("header.language")}
      </label>
      <select
        id="awura-locale"
        value={locale}
        onChange={(event) => setLocale(event.target.value as AppLocale)}
        className="min-h-11 cursor-pointer rounded-lg border border-border bg-background px-2.5 py-2 text-foreground outline-none transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {supportedLocales.map((code) => (
          <option key={code} value={code}>
            {localeDisplayNames[code]}
          </option>
        ))}
      </select>

      <span className="text-border" aria-hidden>
        /
      </span>

      <label className="sr-only" htmlFor="awura-currency">
        {t("header.currency")}
      </label>
      <select
        id="awura-currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as AppCurrency)}
        className="min-h-11 cursor-pointer rounded-lg border border-border bg-background px-2.5 py-2 text-foreground outline-none transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {supportedCurrencies.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
