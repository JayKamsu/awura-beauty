import type { AppCurrency } from "@/lib/i18n/config";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

export function formatPrice(
  price: number,
  currency: AppCurrency | string,
  locale: string,
) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(price);
}
