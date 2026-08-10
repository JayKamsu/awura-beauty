import type { AppLocale } from "@/lib/i18n/config";

const INTL_LOCALES: Record<AppLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
};

/** Convertit une langue app (ex. "en") en locale Intl complète (ex. "en-GB"), fallback fr-FR si inconnue. */
export function toIntlLocale(language: string): string {
  const base = language.split("-")[0] as AppLocale;
  return INTL_LOCALES[base] ?? INTL_LOCALES.fr;
}
