"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { usePreferences } from "@/components/providers/preferences-provider";
import type { AdminDashboardStats } from "@/lib/infrastructure/supabase/admin-dashboard";

export function AdminDashboardPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void adminFetch("/api/admin/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json() as Promise<AdminDashboardStats>;
      })
      .then((json) => {
        if (!cancelled) {
          setStats(json);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [adminFetch]);

  if (error) {
    return (
      <main className="px-4 py-10 md:px-8">
        <p className="text-muted">{t("admin.saveError")}</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="px-4 py-10 md:px-8">
        <p className="text-muted">{t("admin.loading")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          {t("admin.eyebrow")}
        </p>
        <h1 className="font-serif text-3xl text-primary md:text-4xl">
          {t("admin.dashboardTitle")}
        </h1>
        <p className="max-w-xl text-sm text-muted md:text-base">
          {t("admin.dashboardSubtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
        <div className="rounded-2xl bg-background-alt px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("admin.recentOrders")}
          </p>
          <p className="mt-2 font-serif text-3xl text-primary">
            {stats.recentOrders.length}
          </p>
        </div>
      </div>

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
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {t("admin.noLowStock")}
            </p>
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
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {t("admin.empty")}
            </p>
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
