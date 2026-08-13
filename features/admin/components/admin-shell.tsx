"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { PushForegroundListener } from "@/features/notifications/components/push-foreground-listener";
import { PushNavigateListener } from "@/features/notifications/components/push-navigate-listener";
import { PushNotificationButton } from "@/features/notifications/components/push-notification-button";

/** Nav latérale : du plus critique (ops quotidiennes) au moins fréquent (réglages). */
const NAV = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/commandes", key: "orders" },
  { href: "/admin/messages", key: "messages" },
  { href: "/admin/paiements", key: "payments" },
  { href: "/admin/produits", key: "products" },
  { href: "/admin/clients", key: "customers" },
  { href: "/admin/avis", key: "reviews" },
  { href: "/admin/livraison", key: "shipping" },
  { href: "/admin/diagnostic", key: "diagnostic" },
  { href: "/admin/pages", key: "pages" },
  { href: "/admin/contenu", key: "content" },
  { href: "/admin/notifications", key: "notifications" },
  { href: "/admin/marque", key: "brand" },
] as const;

/** Raccourcis barre basse mobile (le reste via le menu). */
const MOBILE_QUICK_NAV = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/commandes", key: "orders" },
  { href: "/admin/messages", key: "messages" },
  { href: "/admin/diagnostic", key: "diagnostic" },
] as const;

function NavIcon({ name }: { name: (typeof MOBILE_QUICK_NAV)[number]["key"] | "more" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
  } as const;
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "diagnostic":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.25" />
          <path d="M12 8.5v4.2l2.5 1.5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M7 7h10l1 12H6L7 7zM9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "messages":
      return (
        <svg {...common}>
          <path d="M5 6h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      );
  }
}

type Gate = "loading" | "login" | "forbidden" | "ok";

function navTitleKey(pathname: string): string {
  const match = NAV.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  );
  return match ? `admin.nav.${match.key}` : "admin.navBrand";
}

/** Coquille des pages admin : vérifie les droits admin puis affiche la navigation (desktop et mobile). */
export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const adminFetch = useAdminFetch();
  const [gate, setGate] = useState<Gate>("loading");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoginPage = pathname === "/admin/connexion";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;

    if (isLoginPage) {
      setGate("ok");
      return;
    }

    if (loading) {
      setGate("loading");
      return;
    }

    if (!user) {
      setGate("login");
      setAdminEmail(null);
      return;
    }

    setGate("loading");
    void adminFetch("/api/admin/me")
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setGate("forbidden");
          setAdminEmail(null);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          email?: string | null;
        };
        if (!json.ok) {
          setGate("forbidden");
          setAdminEmail(null);
          return;
        }
        setAdminEmail(json.email ?? user.email ?? null);
        setGate("ok");
      })
      .catch(() => {
        if (!cancelled) {
          setGate("forbidden");
          setAdminEmail(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adminFetch, isLoginPage, loading, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (gate === "loading") {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm text-muted">{t("admin.guard.loading")}</p>
      </main>
    );
  }

  if (gate === "login") {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-5 px-4 py-24 text-center">
        <BrandLogo tone="auto" className="h-14 w-auto" />
        <h1 className="font-serif text-3xl text-primary">
          {t("admin.guard.loginTitle")}
        </h1>
        <p className="text-muted">{t("admin.guard.loginBody")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/admin/connexion">{t("auth.loginSubmit")}</Button>
          <Button href="/" variant="ghost">
            {t("admin.guard.backHome")}
          </Button>
        </div>
      </main>
    );
  }

  if (gate === "forbidden") {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-5 px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-primary">
          {t("admin.guard.forbiddenTitle")}
        </h1>
        <p className="text-muted">{t("admin.guard.forbiddenBody")}</p>
        <Button href="/">{t("admin.guard.backHome")}</Button>
      </main>
    );
  }

  const navLinks = (
    <nav className="flex flex-col gap-1" aria-label={t("admin.navLabel")}>
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-primary text-background"
                : "text-muted hover:bg-background hover:text-primary"
            }`}
            onClick={() => setMenuOpen(false)}
          >
            {t(`admin.nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background-alt/50 lg:flex">
        <div className="border-b border-border px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3" aria-label={t("admin.navBrand")}>
            <BrandLogo tone="auto" className="h-10 w-auto" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent">
                {t("admin.eyebrow")}
              </p>
              <p className="font-serif text-lg leading-tight text-primary">
                {t("admin.navBrand")}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">{navLinks}</div>

        <div className="space-y-3 border-t border-border p-4">
          {adminEmail ? (
            <p className="truncate text-xs text-muted" title={adminEmail}>
              {adminEmail}
            </p>
          ) : null}
          <Button
            type="button"
            variant="primary-outline"
            size="md"
            className="w-full"
            onClick={() => void logout()}
          >
            {t("account.logout")}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <PushForegroundListener />
        <PushNavigateListener />
        <header className="border-b border-border bg-background">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-xl text-foreground transition hover:bg-background-alt"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? t("admin.closeMenu") : t("admin.openMenu")}
                onClick={() => setMenuOpen((value) => !value)}
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  {menuOpen ? (
                    <path d="M6 6l12 12M18 6L6 18" />
                  ) : (
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate font-serif text-lg text-primary">
                  {t(navTitleKey(pathname))}
                </p>
              </div>
            </div>
            <p className="hidden font-serif text-xl text-primary lg:block">
              {t(navTitleKey(pathname))}
            </p>
            <div className="flex items-center gap-1">
              <PushNotificationButton
                variant="admin"
                hrefWhenEnabled="/admin/notifications"
              />
              <Link href="/admin" className="shrink-0 lg:hidden">
                <BrandLogo tone="auto" className="h-9 w-auto" />
              </Link>
            </div>
          </div>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/30"
              aria-label={t("admin.closeMenu")}
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-background pb-[env(safe-area-inset-bottom)] shadow-lg">
              <div className="border-b border-border px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent">
                  {t("admin.eyebrow")}
                </p>
                <p className="font-serif text-xl text-primary">{t("admin.navBrand")}</p>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-3">
                {navLinks}
              </div>
              <div className="space-y-3 border-t border-border p-4">
                {adminEmail ? (
                  <p className="truncate text-xs text-muted">{adminEmail}</p>
                ) : null}
                <Button
                  type="button"
                  variant="primary-outline"
                  className="w-full"
                  onClick={() => void logout()}
                >
                  {t("account.logout")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
          aria-label={t("admin.navLabel")}
        >
          <ul className="grid grid-cols-5 gap-0.5 px-1 pt-1">
            {MOBILE_QUICK_NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition ${
                      active
                        ? "text-primary"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    <NavIcon name={item.key} />
                    <span className="truncate font-medium">
                      {t(`admin.nav.${item.key}`)}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                className={`flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition ${
                  menuOpen ? "text-primary" : "text-muted hover:text-primary"
                }`}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? t("admin.closeMenu") : t("admin.openMenu")}
                onClick={() => setMenuOpen((value) => !value)}
              >
                <NavIcon name="more" />
                <span className="truncate font-medium">{t("admin.moreMenu")}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
