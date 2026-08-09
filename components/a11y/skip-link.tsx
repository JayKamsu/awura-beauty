"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

/** Lien d’évitement clavier — premier élément focusable (WCAG 2.4.1). */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <Link
      href="#main-content"
      className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:m-0 focus:inline-flex focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-xl focus:bg-brand focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-on-brand focus:outline-2 focus:outline-offset-2 focus:outline-accent focus:[clip:auto]"
    >
      {t("nav.skipToContent")}
    </Link>
  );
}
