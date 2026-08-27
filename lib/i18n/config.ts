import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeResources } from "@/lib/i18n/resources";

export const defaultLocale = "fr";
export const supportedLocales = ["fr", "en", "es"] as const;
/** Locale applicative supportée par le site. */
export type AppLocale = (typeof supportedLocales)[number];

export const supportedCurrencies = ["EUR", "USD", "GBP"] as const;
/** Devise supportée pour l'affichage des prix. */
export type AppCurrency = (typeof supportedCurrencies)[number];

/** Libellé court affiché dans le sélecteur de langue. */
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
} else {
  for (const lng of supportedLocales) {
    i18n.addResourceBundle(
      lng,
      "translation",
      localeResources[lng].translation,
      true,
      true,
    );
  }
}

export default i18n;
