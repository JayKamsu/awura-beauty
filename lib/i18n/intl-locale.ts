import type { AppLocale } from "@/lib/i18n/config";

const INTL_LOCALES: Record<AppLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
};

export function toIntlLocale(language: string): string {
  const base = language.split("-")[0] as AppLocale;
  return INTL_LOCALES[base] ?? INTL_LOCALES.fr;
}
