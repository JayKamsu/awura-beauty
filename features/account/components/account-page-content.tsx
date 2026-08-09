"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AccountDiagnosticsSection } from "@/features/account/components/account-diagnostics-section";
import { AccountLoyaltySection } from "@/features/account/components/account-loyalty-section";
import { AccountOrdersSection } from "@/features/account/components/account-orders-section";
import { AccountPaymentsSection } from "@/features/account/components/account-payments-section";
import { AccountProfileSection } from "@/features/account/components/account-profile-section";
import { AccountSecuritySection } from "@/features/account/components/account-security-section";
import { useAdminAccess } from "@/features/admin/hooks/use-admin-access";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";
import { listMyOrders } from "@/lib/infrastructure/supabase/orders";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

const SECTIONS = [
  { id: "profil", key: "account.nav.profile" },
  { id: "commandes", key: "account.nav.orders" },
  { id: "paiements", key: "account.nav.payments" },
  { id: "fidelite", key: "account.nav.loyalty" },
  { id: "diagnostics", key: "account.nav.diagnostics" },
  { id: "securite", key: "account.nav.security" },
] as const;

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "AW";
}

export function AccountPageContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, loading, logout, configured } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profil");

  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [adminLoading, isAdmin, loading, router, user]);

  const loadOrders = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user || isAdmin) {
        setOrders([]);
        return;
      }
      if (!opts?.silent) setOrdersLoading(true);
      const data = await listMyOrders();
      setOrders(data);
      setOrdersLoading(false);
    },
    [isAdmin, user],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useLiveRefresh(() => loadOrders({ silent: true }), {
    enabled: Boolean(user) && !isAdmin,
    intervalMs: 20_000,
  });

  useEffect(() => {
    if (!user || isAdmin) return;

    const ids = SECTIONS.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [user, isAdmin]);

  if (loading || (user && adminLoading) || (user && isAdmin)) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-20 md:px-6">
        <p className="text-muted">{t("account.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center md:px-6">
        <div
          className="pointer-events-none absolute inset-x-8 top-16 -z-0 h-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-[1] space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Awura Beauty
          </p>
          <h1 className="font-serif text-4xl text-primary md:text-5xl">
            {t("account.title")}
          </h1>
          <p className="mx-auto max-w-md text-muted">
            {t("account.loginRequired")}
          </p>
          {!configured ? (
            <p className="text-sm text-muted">{t("auth.notConfigured")}</p>
          ) : null}
        </div>
        <div className="relative z-[1] flex flex-wrap justify-center gap-3">
          <Button href="/compte/connexion" size="lg">
            {t("auth.loginSubmit")}
          </Button>
          <Button href="/compte/inscription" variant="primary-outline" size="lg">
            {t("auth.signupSubmit")}
          </Button>
        </div>
      </main>
    );
  }

  const memberSince = user.created_at
    ? new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
        dateStyle: "long",
      }).format(new Date(user.created_at))
    : undefined;

  const email = user.email ?? "";
  const initials = initialsFromEmail(email);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pb-20 pt-10 md:gap-10 md:px-6 md:pt-14">
      <header className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-background md:px-10 md:py-10">
        <div
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-accent/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent-light/20 blur-3xl"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background/15 font-serif text-lg tracking-wide text-background ring-1 ring-background/25 md:size-16 md:text-xl"
              aria-hidden
            >
              {initials}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-light">
                Awura Beauty
              </p>
              <h1 className="font-serif text-3xl md:text-4xl">{t("account.title")}</h1>
              <p className="max-w-xl text-sm text-background/80 md:text-base">
                {t("account.subtitle")}
              </p>
              <p className="text-sm text-background/70">
                {t("account.welcome", { email })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="accent-outline"
            className="border-background/40 text-background hover:bg-background/10"
            onClick={() => void logout()}
          >
            {t("account.logout")}
          </Button>
        </div>
      </header>

      <nav
        className="sticky top-16 z-20 -mx-4 border-y border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md md:top-20 md:mx-0 md:rounded-2xl md:border md:px-3"
        aria-label={t("account.navLabel")}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((section) => {
            const active = activeSection === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={[
                  "inline-flex min-h-10 shrink-0 items-center rounded-xl px-3.5 text-sm transition",
                  active
                    ? "bg-primary text-background"
                    : "text-muted hover:bg-background-alt hover:text-foreground",
                ].join(" ")}
              >
                {t(section.key)}
              </a>
            );
          })}
          <a
            href="/compte/messages"
            className="inline-flex min-h-10 shrink-0 items-center rounded-xl px-3.5 text-sm text-muted transition hover:bg-background-alt hover:text-foreground"
          >
            {t("account.nav.messages")}
          </a>
        </div>
      </nav>

      <div className="flex flex-col gap-8 md:gap-10">
        <AccountProfileSection email={email} memberSince={memberSince} />
        <Suspense
          fallback={
            <p className="rounded-3xl bg-background-alt/70 p-8 text-muted">
              {t("account.ordersLoading")}
            </p>
          }
        >
          <AccountOrdersSection
            orders={orders}
            ordersLoading={ordersLoading}
            onOrdersChange={setOrders}
          />
        </Suspense>
        <AccountPaymentsSection />
        <AccountLoyaltySection />
        <AccountDiagnosticsSection />
        <AccountSecuritySection />
      </div>
    </main>
  );
}
