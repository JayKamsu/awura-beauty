"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { PreferencesSettingsButton } from "@/components/ui/locale-currency-switcher";
import { useAdminAccess } from "@/features/admin/hooks/use-admin-access";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { PushNotificationButton } from "@/features/notifications/components/push-notification-button";
import {
  isNavActive,
  MAIN_NAV_ITEMS,
  MOBILE_MORE_NAV,
} from "@/lib/navigation";

const iconClass =
  "inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const accountInitial = user?.email?.trim().charAt(0).toUpperCase() ?? null;
  const accountLabel = user
    ? t("header.accountLoggedIn", { email: user.email ?? "" })
    : t("header.account");

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
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition ${
                  active
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
          {isAdmin ? (
            <Link
              href="/admin"
              className="text-sm font-medium text-accent transition hover:text-accent-light"
            >
              {t("header.admin")}
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <PreferencesSettingsButton />

          {/* Compte / panier : desktop (sur mobile → bottom bar) */}
          <span className="hidden lg:inline-flex">
            {!authLoading && user ? (
              <Link
                href="/compte"
                aria-label={accountLabel}
                title={accountLabel}
                className={`relative ${iconClass} bg-accent/10 text-accent hover:bg-accent/15`}
              >
                <span className="font-serif text-sm font-semibold leading-none">
                  {accountInitial}
                </span>
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" aria-hidden />
              </Link>
            ) : (
              <HeaderIcon href="/compte" label={accountLabel}>
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z" />
              </HeaderIcon>
            )}
          </span>

          <PushNotificationButton hrefWhenEnabled="/compte#commandes" />

          <HeaderIcon href="/recherche" label={t("header.search")}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </HeaderIcon>

          <Link
            href="/panier"
            aria-label={t("header.cart")}
            className={`relative hidden lg:inline-flex ${iconClass}`}
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
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {t("nav.moreTitle")}
            </p>
            {MOBILE_MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm transition hover:bg-background-alt ${
                  isNavActive(pathname, item.href)
                    ? "bg-background-alt font-medium text-foreground"
                    : "text-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href="/admin"
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-accent transition hover:bg-background-alt"
                onClick={() => setOpen(false)}
              >
                {t("header.admin")}
              </Link>
            ) : null}
          </nav>
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
