"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CONTACT_EMAIL } from "@/lib/site";

const FOOTER_BLOCKS = [
  {
    key: "fastDelivery",
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    ),
  },
  {
    key: "securePayment",
    icon: (
      <>
        <rect x="4" y="8" width="16" height="10" rx="2" />
        <path d="M4 12h16M8 8V6.5A4 4 0 0 1 16 6.5V8" />
      </>
    ),
  },
  {
    key: "naturalProducts",
    icon: (
      <path d="M12 21c-4-3-7-6.2-7-10a7 7 0 0 1 14 0c0 3.8-3 7-7 10Zm0-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    ),
  },
  {
    key: "customerService",
    icon: (
      <>
        <path d="M5 11a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3h-2" />
        <path d="M5 13H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v-4Zm14 0h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v-4Z" />
      </>
    ),
  },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary text-background">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 pt-12 md:px-6">
        <Link href="/" aria-label={t("header.brand")} className="inline-flex">
          <BrandLogo tone="on-dark" className="h-16 w-auto sm:h-20" sizes="200px" />
        </Link>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        {FOOTER_BLOCKS.map((block) => (
          <div key={block.key} className="space-y-3">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-background/10 text-accent-light">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                {block.icon}
              </svg>
            </div>
            <h2 className="font-serif text-xl tracking-wide">
              {t(`footer.${block.key}.title`)}
            </h2>
            <p className="text-sm leading-relaxed text-background/80">
              {t(`footer.${block.key}.description`)}
            </p>
            {block.key === "customerService" ? (
              <div className="space-y-1 text-sm">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block text-accent-light transition hover:text-background"
                >
                  {CONTACT_EMAIL}
                </a>
                <Link
                  href="/contact"
                  className="block text-background/80 underline-offset-4 hover:text-background hover:underline"
                >
                  {t("footer.contactLink")}
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t border-background/15 px-4 py-4 text-center text-xs text-background/70 md:px-6">
        © {year} {t("footer.brand")} — {t("footer.rights")}
      </div>
    </footer>
  );
}
