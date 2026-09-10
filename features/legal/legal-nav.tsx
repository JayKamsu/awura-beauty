"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LEGAL_PAGES, LEGAL_SLUGS, WITHDRAWAL_PATH, type LegalSlug } from "@/lib/legal/pages";

const NAV_LINK =
  "rounded-full px-3.5 py-1.5 text-sm transition";
const NAV_ACTIVE = "bg-primary text-background";
const NAV_IDLE = "bg-background-alt text-muted hover:text-primary";

/** Navigation secondaire entre les pages légales et le formulaire de rétractation. */
export function LegalNav({ current }: { current?: LegalSlug }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const withdrawalActive = pathname === WITHDRAWAL_PATH;

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
            className={`${NAV_LINK} ${active ? NAV_ACTIVE : NAV_IDLE}`}
          >
            {t(`legal.nav.${LEGAL_PAGES[slug].i18nKey}`)}
          </Link>
        );
      })}
      <Link
        href={WITHDRAWAL_PATH}
        aria-current={withdrawalActive ? "page" : undefined}
        className={`${NAV_LINK} ${withdrawalActive ? NAV_ACTIVE : NAV_IDLE}`}
      >
        {t("legal.withdrawHere")}
      </Link>
    </nav>
  );
}
