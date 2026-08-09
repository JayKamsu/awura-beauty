"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";
import type { AdminDashboardStats } from "@/lib/infrastructure/supabase/admin-dashboard";

const QUICK_LINKS = [
  { href: "/admin/produits", key: "manageProducts" },
  { href: "/admin/commandes", key: "manageOrders" },
  { href: "/admin/contenu", key: "manageContent" },
  { href: "/admin/pages", key: "managePages" },
  { href: "/admin/clients", key: "manageCustomers" },
] as const;

export function AdminDashboardPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Forbidden");
      const json = (await res.json()) as AdminDashboardStats;
      setStats(json);
      setError(false);
    } catch {
      setError(true);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh(load, { intervalMs: 20_000 });

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <AdminFeedback tone="error" message={t("admin.saveError")} />
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <p className="text-muted">{t("admin.loading")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <AdminPageHeader
        title={t("admin.dashboardTitle")}
        subtitle={t("admin.dashboardSubtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-background-alt px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("admin.ordersToday")}
          </p>
          <p className="mt-2 font-serif text-3xl text-primary">{stats.ordersToday}</p>
        </div>
        <div className="rounded-2xl bg-background-alt px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("admin.revenueToday")}
          </p>
          <p className="mt-2 font-serif text-3xl text-primary">
            {formatPrice(stats.revenueToday, currency, i18n.language)}
          </p>
        </div>
        <div className="rounded-2xl bg-background-alt px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("admin.lowStock")}
          </p>
          <p className="mt-2 font-serif text-3xl text-primary">
            {stats.lowStockProducts.length}
          </p>
          <Link
            href="/admin/produits"
            className="mt-3 inline-block text-sm text-accent hover:text-accent-light"
          >
            {t("admin.viewLowStock")}
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-primary">{t("admin.quickLinks")}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-primary transition hover:border-accent hover:text-accent"
            >
              {t(`admin.${link.key}`)}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl text-primary">{t("admin.lowStock")}</h2>
            <Link
              href="/admin/produits"
              className="text-sm text-accent transition hover:text-accent-light"
            >
              {t("admin.manageProducts")}
            </Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <AdminEmptyState message={t("admin.noLowStock")} />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {stats.lowStockProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 bg-background px-4 py-3.5 text-sm"
                >
                  <span className="font-medium text-primary">{product.name}</span>
                  <span className="shrink-0 text-accent">
                    {t("admin.stockLeft", { count: product.stock })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl text-primary">
              {t("admin.recentOrders")}
            </h2>
            <Link
              href="/admin/commandes"
              className="text-sm text-accent transition hover:text-accent-light"
            >
              {t("admin.manageOrders")}
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <AdminEmptyState message={t("admin.empty")} />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {stats.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 bg-background px-4 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-primary">{order.email}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleDateString(i18n.language)}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-primary">
                    {formatPrice(
                      order.total,
                      order.currency || currency,
                      i18n.language,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
