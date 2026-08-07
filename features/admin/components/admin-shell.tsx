"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";

const NAV = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/produits", key: "products" },
  { href: "/admin/commandes", key: "orders" },
  { href: "/admin/contenu", key: "content" },
  { href: "/admin/pages", key: "pages" },
  { href: "/admin/clients", key: "customers" },
] as const;

type Gate = "loading" | "login" | "forbidden" | "ok";

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const adminFetch = useAdminFetch();
  const [gate, setGate] = useState<Gate>("loading");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const isLoginPage = pathname === "/admin/connexion";

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
        const json = (await res.json()) as { email?: string | null };
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

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={t("admin.navLabel")}>
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
              >
                {t(`admin.nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

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
          <Link
            href="/"
            className="block text-center text-xs text-muted transition hover:text-accent"
          >
            {t("admin.guard.backHome")}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-background lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/admin" className="flex min-w-0 items-center gap-2">
              <BrandLogo tone="auto" className="h-9 w-auto shrink-0" />
              <span className="truncate font-serif text-lg text-primary">
                {t("admin.navBrand")}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-xl px-2 text-xs text-muted"
              >
                {t("admin.guard.backHome")}
              </Link>
              <Button type="button" variant="ghost" size="md" onClick={() => void logout()}>
                {t("account.logout")}
              </Button>
            </div>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto px-3 pb-3 snap-x snap-mandatory"
            aria-label={t("admin.navLabel")}
          >
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 shrink-0 snap-start items-center rounded-xl px-3 text-sm transition ${
                    active
                      ? "bg-primary text-background"
                      : "border border-border text-muted"
                  }`}
                >
                  {t(`admin.nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
