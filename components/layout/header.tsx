"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LocaleCurrencySwitcher } from "@/components/ui/locale-currency-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/features/cart/context/cart-provider";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/boutique", key: "nav.shop" },
  { href: "/diagnostic-capillaire", key: "nav.diagnostic" },
  { href: "/a-propos", key: "nav.about" },
  { href: "/blog", key: "nav.blog" },
  { href: "/contact", key: "nav.contact" },
] as const;

const iconClass =
  "inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Header() {
  const { t } = useTranslation();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={`${iconClass} lg:hidden`}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          <Link
            href="/"
            aria-label={t("header.brand")}
            className="inline-flex min-w-0 items-center transition opacity-95 hover:opacity-100"
          >
            <BrandLogo tone="auto" className="h-10 w-auto sm:h-11 md:h-12" priority />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={t("nav.mainLabel")}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden md:block">
            <LocaleCurrencySwitcher />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <HeaderIcon href="/compte" label={t("header.account")}>
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z" />
          </HeaderIcon>
          <span className="hidden sm:inline-flex">
            <HeaderIcon href="/recherche" label={t("header.search")}>
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </HeaderIcon>
          </span>
          <Link
            href="/panier"
            aria-label={t("header.cart")}
            className={`relative ${iconClass}`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M6 7h12l-1 11H7L6 7Z" />
              <path d="M9 7V5.5A3 3 0 0 1 15 5.5V7" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-background">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label={t("nav.mobileLabel")}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm text-foreground transition hover:bg-background-alt"
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/recherche"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm text-foreground transition hover:bg-background-alt sm:hidden"
              onClick={() => setOpen(false)}
            >
              {t("header.search")}
            </Link>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 md:hidden">
            <LocaleCurrencySwitcher />
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HeaderIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className={iconClass}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        {children}
      </svg>
    </Link>
  );
}
