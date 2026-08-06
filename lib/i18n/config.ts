import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const defaultLocale = "fr";
export const supportedLocales = ["fr", "en"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["EUR", "USD", "GBP"] as const;
export type AppCurrency = (typeof supportedCurrencies)[number];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    interpolation: { escapeValue: false },
  });
}

export default i18n;
