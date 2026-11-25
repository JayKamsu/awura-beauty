"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  BreakdownDonut,
  RankedCountBars,
  RevenueTrendChart,
  TopProductsBars,
  toMethodBreakdownEntries,
  toStatusBreakdownEntries,
} from "@/features/admin/components/admin-dashboard-charts";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";
import type { AdminDashboardStats } from "@/lib/infrastructure/supabase/admin-dashboard";

function sourceLabel(key: string, t: (k: string) => string) {
  const i18nKey = `admin.dashboard.source.${key}`;
  const label = t(i18nKey);
  return label === i18nKey ? key : label;
}

function countryLabel(code: string, locale: string, unknown: string) {
  if (!code) return unknown;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

type DashboardPreset = "today" | "7d" | "30d" | "90d" | "month" | "custom";

const PRESETS: DashboardPreset[] = ["today", "7d", "30d", "90d", "month", "custom"];

function formatDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function todayKey() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function rangeForPreset(preset: Exclude<DashboardPreset, "custom">) {
  const today = todayKey();
  const to = formatDay(today);
  if (preset === "today") return { from: to, to };
  if (preset === "7d") return { from: formatDay(shiftDays(today, -6)), to };
  if (preset === "90d") return { from: formatDay(shiftDays(today, -89)), to };
  if (preset === "month") {
    return {
      from: formatDay(new Date(today.getFullYear(), today.getMonth(), 1)),
      to,
    };
  }
  return { from: formatDay(shiftDays(today, -29)), to };
}

function formatRangeDay(iso: string, locale: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function deltaFrom(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function DeltaPill({ delta, label }: { delta?: number | null; label: string }) {
  const { t } = useTranslation();
  if (typeof delta !== "number") {
    return <p className="text-xs text-muted">{t("admin.dashboard.noComparison")}</p>;
  }
  const positive = delta > 0;
  const negative = delta < 0;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${
          positive
            ? "bg-primary/10 text-primary"
            : negative
              ? "bg-accent/15 text-accent"
              : "bg-background text-muted"
        }`}
      >
        {positive ? "↑" : negative ? "↓" : "="} {Math.abs(delta * 100).toFixed(0)}%
      </span>
      {label}
    </p>
  );
}

function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  footnote,
}: {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  footnote?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="font-serif text-3xl leading-none text-primary sm:text-[2rem]">{value}</p>
      {deltaLabel ? <DeltaPill delta={delta} label={deltaLabel} /> : null}
      {footnote ? <div className="text-xs text-muted">{footnote}</div> : null}
    </div>
  );
}

function Card({
  title,
  hint,
  action,
  className = "",
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-primary">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
      {children}
    </h2>
  );
}

const linkClass = "text-sm text-accent transition hover:text-accent-light";

/** Tableau de bord admin : KPI, ventes, points à traiter, paiements et fréquentation. */
export function AdminDashboardPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const initialRange = rangeForPreset("30d");
  const [preset, setPreset] = useState<DashboardPreset>("30d");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const rangeValid = Boolean(from && to && from <= to);
  const today = formatDay(todayKey());

  const load = useCallback(async () => {
    if (!from || !to || from > to) return;
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await adminFetch(`/api/admin/dashboard?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Forbidden");
      const json = (await res.json()) as AdminDashboardStats;
      setStats(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, [adminFetch, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh(load, { intervalMs: 20_000 });

  if (error && !stats) {
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

  const revenueDelta = deltaFrom(stats.revenueToday, stats.revenueYesterday);
  const ordersDelta = deltaFrom(stats.ordersToday, stats.ordersYesterday);
  const visitorsDelta = deltaFrom(stats.visitorsToday, stats.visitorsYesterday);
  const vsPrevious = t("admin.dashboard.vsPreviousPeriod");
  const comparison =
    stats.previousFrom && stats.previousTo
      ? t("admin.dashboard.comparedTo", {
          from: formatRangeDay(stats.previousFrom, i18n.language),
          to: formatRangeDay(stats.previousTo, i18n.language),
        })
      : null;
  const sourceEntries = (stats.sources30d ?? []).map((item) => ({
    key: item.key,
    label: sourceLabel(item.key, t),
    count: item.visitors,
  }));
  const countryEntries = (stats.countries30d ?? []).map((item) => ({
    key: item.country || "unknown",
    label: countryLabel(
      item.country,
      i18n.language,
      t("admin.dashboard.countryUnknown"),
    ),
    count: item.visitors,
  }));
  const price = (value: number, cur: string = currency) => formatPrice(value, cur, i18n.language);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <AdminPageHeader
        title={t("admin.dashboardTitle")}
        subtitle={t("admin.dashboardSubtitle")}
      />

      {/* Barre de période : un seul rang, dates visibles seulement en mode personnalisé */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background-alt/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-background p-1"
            role="group"
            aria-label={t("admin.dashboard.periodFilter")}
          >
            {PRESETS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={preset === item}
                onClick={() => {
                  if (item === "custom") {
                    setPreset("custom");
                    return;
                  }
                  const next = rangeForPreset(item);
                  setPreset(item);
                  setFrom(next.from);
                  setTo(next.to);
                }}
                className={`min-h-10 shrink-0 rounded-lg px-3 text-sm transition ${
                  preset === item
                    ? "bg-primary text-background shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                {t(`admin.dashboard.preset.${item}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted" aria-live="polite">
            {refreshing ? t("admin.loading") : comparison}
          </p>
        </div>
        {preset === "custom" ? (
          <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted">{t("admin.dashboard.from")}</span>
              <input
                type="date"
                value={from}
                max={to || today}
                onChange={(event) => setFrom(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-primary"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted">{t("admin.dashboard.to")}</span>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(event) => setTo(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-primary"
              />
            </label>
          </div>
        ) : null}
        {!rangeValid ? (
          <p className="text-sm text-accent" role="alert">
            {t("admin.dashboard.rangeInvalid")}
          </p>
        ) : null}
      </div>

      <div className={`flex flex-col gap-8 transition-opacity ${refreshing ? "opacity-70" : ""}`}>
        {/* KPI */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile
            label={t("admin.dashboard.revenuePeriod")}
            value={price(stats.revenueToday)}
            delta={revenueDelta}
            deltaLabel={vsPrevious}
          />
          <StatTile
            label={t("admin.dashboard.ordersPeriod")}
            value={stats.ordersToday}
            delta={ordersDelta}
            deltaLabel={vsPrevious}
          />
          <StatTile
            label={t("admin.dashboard.averageOrder")}
            value={price(stats.averageOrderValue30d)}
          />
          <StatTile
            label={t("admin.dashboard.visitorsPeriod")}
            value={stats.visitorsToday ?? 0}
            delta={visitorsDelta}
            deltaLabel={vsPrevious}
            footnote={t("admin.dashboard.visitsCount", { count: stats.visitsToday ?? 0 })}
          />
        </section>

        {/* Ventes */}
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("admin.dashboard.salesTitle")}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title={t("admin.dashboard.revenueTrendTitle")} className="lg:col-span-2">
              <RevenueTrendChart data={stats.dailySeries14d} currency={currency} />
            </Card>
            <Card title={t("admin.dashboard.topProductsTitle")}>
              <TopProductsBars products={stats.topProducts30d} currency={currency} />
            </Card>
          </div>
        </section>

        {/* À traiter */}
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("admin.dashboard.operationsTitle")}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title={t("admin.recentOrders")}
              action={
                <Link href="/admin/commandes" className={linkClass}>
                  {t("admin.dashboard.seeAll")}
                </Link>
              }
            >
              {stats.recentOrders.length === 0 ? (
                <AdminEmptyState message={t("admin.empty")} />
              ) : (
                <ul className="-mx-2 divide-y divide-border">
                  {stats.recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/commandes?order=${encodeURIComponent(order.id)}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm transition hover:bg-background-alt/70"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-primary">{order.email}</p>
                          <p className="text-xs text-muted">
                            {new Date(order.created_at).toLocaleDateString(i18n.language, {
                              day: "numeric",
                              month: "short",
                            })}
                            {" · "}
                            {t(`account.status.payment.${order.payment_status}`, {
                              defaultValue: order.payment_status,
                            })}
                          </p>
                        </div>
                        <span className="shrink-0 font-medium tabular-nums text-primary">
                          {price(order.total, order.currency || currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title={t("admin.lowStock")}
              hint={
                stats.lowStockProducts.length > 0
                  ? t("admin.dashboard.lowStockHint", {
                      count: stats.lowStockProducts.length,
                    })
                  : undefined
              }
              action={
                <Link href="/admin/produits?filter=low" className={linkClass}>
                  {t("admin.dashboard.seeAll")}
                </Link>
              }
            >
              {stats.lowStockProducts.length === 0 ? (
                <AdminEmptyState message={t("admin.noLowStock")} />
              ) : (
                <ul className="-mx-2 divide-y divide-border">
                  {stats.lowStockProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 px-2 py-2.5 text-sm"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-background-alt">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </div>
                      <span className="min-w-0 flex-1 truncate font-medium text-primary">
                        {product.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.stock <= 0
                            ? "bg-accent text-background"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {product.stock <= 0
                          ? t("admin.outOfStock")
                          : t("admin.stockLeft", { count: product.stock })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </section>

        {/* Paiements */}
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("admin.dashboard.paymentsSection")}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title={t("admin.dashboard.statusBreakdownTitle")}
              action={
                <Link href="/admin/paiements" className={linkClass}>
                  {t("admin.dashboard.seeAll")}
                </Link>
              }
            >
              <BreakdownDonut
                entries={toStatusBreakdownEntries(stats.statusBreakdown30d, t)}
                emptyMessage={t("admin.dashboard.breakdownEmpty")}
              />
            </Card>
            <Card title={t("admin.dashboard.methodBreakdownTitle")}>
              <BreakdownDonut
                entries={toMethodBreakdownEntries(stats.methodBreakdown30d, t)}
                emptyMessage={t("admin.dashboard.breakdownEmpty")}
              />
            </Card>
          </div>
        </section>

        {/* Fréquentation */}
        <section className="flex flex-col gap-4">
          <SectionTitle>{t("admin.dashboard.trafficTitle")}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={t("admin.dashboard.sourcesTitle")} hint={t("admin.dashboard.sourcesHint")}>
              <RankedCountBars
                entries={sourceEntries}
                emptyMessage={t("admin.dashboard.trafficEmpty")}
              />
            </Card>
            <Card
              title={t("admin.dashboard.countriesTitle")}
              hint={t("admin.dashboard.countriesHint")}
            >
              <RankedCountBars
                entries={countryEntries}
                emptyMessage={t("admin.dashboard.trafficEmpty")}
              />
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
