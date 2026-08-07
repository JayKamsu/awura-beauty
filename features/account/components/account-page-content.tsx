"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AccountDiagnosticsSection } from "@/features/account/components/account-diagnostics-section";
import { AccountOrdersSection } from "@/features/account/components/account-orders-section";
import { AccountProfileSection } from "@/features/account/components/account-profile-section";
import { AccountSecuritySection } from "@/features/account/components/account-security-section";
import { useAuth } from "@/features/auth/context/auth-provider";
import { listMyOrders } from "@/lib/infrastructure/supabase/orders";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

const SECTIONS = [
  { id: "profil", key: "account.nav.profile" },
  { id: "commandes", key: "account.nav.orders" },
  { id: "diagnostics", key: "account.nav.diagnostics" },
  { id: "securite", key: "account.nav.security" },
] as const;

export function AccountPageContent() {
  const { t, i18n } = useTranslation();
  const { user, loading, logout, configured } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let mounted = true;
    setOrdersLoading(true);
    void listMyOrders().then((data) => {
      if (!mounted) return;
      setOrders(data);
      setOrdersLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 py-20 md:px-6">
        <p className="text-muted">{t("account.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
        <h1 className="font-serif text-4xl text-primary">{t("account.title")}</h1>
        <p className="text-muted">{t("account.loginRequired")}</p>
        {!configured ? (
          <p className="text-sm text-muted">{t("auth.notConfigured")}</p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3">
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl text-primary">{t("account.title")}</h1>
          <p className="text-muted">{t("account.welcome", { email: user.email })}</p>
        </div>
        <Button type="button" variant="primary-outline" onClick={() => void logout()}>
          {t("account.logout")}
        </Button>
      </div>

      <nav
        className="flex flex-wrap gap-2 border-b border-border pb-4"
        aria-label={t("account.navLabel")}
      >
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-muted transition hover:bg-background-alt hover:text-foreground"
          >
            {t(section.key)}
          </a>
        ))}
      </nav>

      <AccountProfileSection email={user.email ?? ""} memberSince={memberSince} />
      <AccountOrdersSection
        orders={orders}
        ordersLoading={ordersLoading}
        onOrdersChange={setOrders}
      />
      <AccountDiagnosticsSection />
      <AccountSecuritySection />
    </main>
  );
}
