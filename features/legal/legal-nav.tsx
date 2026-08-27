"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LEGAL_PAGES, LEGAL_SLUGS, type LegalSlug } from "@/lib/legal/pages";

/** Navigation secondaire entre les pages légales. */
export function LegalNav({ current }: { current: LegalSlug }) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("legal.navLabel")}
      className="flex flex-wrap gap-2 border-b border-border pb-6"
    >
      {LEGAL_SLUGS.map((slug) => {
        const active = slug === current;
        return (
          <Link
            key={slug}
            href={`/${slug}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              active
                ? "bg-primary text-background"
                : "bg-background-alt text-muted hover:text-primary"
            }`}
          >
            {t(`legal.nav.${LEGAL_PAGES[slug].i18nKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}
