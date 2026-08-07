import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeResources } from "@/lib/i18n/resources";

export const defaultLocale = "fr";
export const supportedLocales = ["fr", "en", "es"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["EUR", "USD", "GBP"] as const;
export type AppCurrency = (typeof supportedCurrencies)[number];

export const localeDisplayNames: Record<AppLocale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: localeResources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: [...supportedLocales],
    interpolation: { escapeValue: false },
  });
}

export default i18n;
