"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type {
  AdminDashboardDailyPoint,
  AdminDashboardMethodBreakdown,
  AdminDashboardStatusBreakdown,
  AdminDashboardTopProduct,
} from "@/lib/infrastructure/supabase/admin-dashboard";

/** Palette catégorielle validée (dataviz skill) — brand accent réservé aux séries uniques. */
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 24, left: 12 };

function niceMax(value: number) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Courbe d'évolution du chiffre d'affaires quotidien, avec tooltip interactif au survol. */
export function RevenueTrendChart({
  data,
  currency,
}: {
  data: AdminDashboardDailyPoint[];
  currency: string;
}) {
  const { t, i18n } = useTranslation();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const hasData = data.some((point) => point.revenue > 0);
  if (!hasData) {
    return (
      <p className="rounded-xl bg-background-alt px-4 py-6 text-center text-sm text-muted">
        {t("admin.dashboard.revenueTrendEmpty")}
      </p>
    );
  }

  const max = niceMax(Math.max(...data.map((p) => p.revenue)));
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((point, index) => {
    const x = PADDING.left + stepX * index;
    const y =
      PADDING.top + innerHeight - (max ? (point.revenue / max) * innerHeight : 0);
    return { ...point, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(PADDING.top + innerHeight).toFixed(1)} L${points[0].x.toFixed(1)},${(PADDING.top + innerHeight).toFixed(1)} Z`;

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const weekdayFmt = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={t("admin.dashboard.revenueTrendTitle")}
        preserveAspectRatio="none"
      >
        <line
          x1={PADDING.left}
          y1={PADDING.top + innerHeight}
          x2={CHART_WIDTH - PADDING.right}
          y2={PADDING.top + innerHeight}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, index) => (
          <g key={p.date}>
            <rect
              x={p.x - stepX / 2}
              y={PADDING.top}
              width={Math.max(stepX, 1)}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex((v) => (v === index ? null : v))}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex((v) => (v === index ? null : v))}
              tabIndex={0}
              role="button"
              aria-label={`${weekdayFmt.format(new Date(p.date))} — ${formatPrice(p.revenue, currency, i18n.language)}`}
            />
            {hoverIndex === index ? (
              <>
                <line
                  x1={p.x}
                  y1={PADDING.top}
                  x2={p.x}
                  y2={PADDING.top + innerHeight}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="var(--color-accent)"
                  stroke="var(--color-background)"
                  strokeWidth="2"
                />
              </>
            ) : null}
          </g>
        ))}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-xl border border-border bg-background px-3 py-2 text-center text-xs shadow-md">
          <p className="font-medium text-primary">
            {formatPrice(active.revenue, currency, i18n.language)}
          </p>
          <p className="text-muted">{weekdayFmt.format(new Date(active.date))}</p>
        </div>
      ) : null}
    </div>
  );
}

type BreakdownEntry = { key: string; label: string; count: number };

/** Donut de répartition (statuts, moyens de paiement…) avec légende chiffrée. */
export function BreakdownDonut({
  entries,
  emptyMessage,
}: {
  entries: BreakdownEntry[];
  emptyMessage: string;
}) {
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl bg-background-alt px-4 py-6 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const segments: { key: string; dash: number; gap: number; offset: number; color: string }[] =
    [];
  {
    let runningOffset = 0;
    entries.forEach((entry, index) => {
      if (entry.count === 0) return;
      const fraction = entry.count / total;
      const dash = fraction * circumference;
      segments.push({
        key: entry.key,
        dash,
        gap: circumference - dash,
        offset: runningOffset,
        color: CATEGORICAL[index % CATEGORICAL.length],
      });
      runningOffset += dash;
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="size-36 shrink-0" role="img" aria-hidden>
        <g transform="translate(80,80) rotate(-90)">
          <circle
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="20"
            opacity="0.35"
          />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={`${Math.max(segment.dash - 2, 0)} ${segment.gap + 2}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
            />
          ))}
        </g>
        <text
          x="80"
          y="80"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-primary text-[28px] font-semibold"
        >
          {total}
        </text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {entries.map((entry, index) => (
          <li key={entry.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORICAL[index % CATEGORICAL.length] }}
              />
              <span className="truncate">{entry.label}</span>
            </span>
            <span className="shrink-0 font-medium text-primary">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Classement en barres des produits les plus vendus par chiffre d'affaires. */
export function TopProductsBars({
  products,
  currency,
}: {
  products: AdminDashboardTopProduct[];
  currency: string;
}) {
  const { t, i18n } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="rounded-xl bg-background-alt px-4 py-6 text-center text-sm text-muted">
        {t("admin.dashboard.topProductsEmpty")}
      </p>
    );
  }

  const max = Math.max(...products.map((p) => p.revenue));

  return (
    <ul className="space-y-3">
      {products.map((product) => (
        <li key={product.productId} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-primary">
              {product.name}
            </span>
            <span className="shrink-0 text-muted">
              {formatPrice(product.revenue, currency, i18n.language)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background-alt">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${max ? (product.revenue / max) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {t("admin.dashboard.unitsSold", { count: product.quantitySold })}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Convertit la répartition des statuts de paiement en entrées affichables par le donut. */
export function toStatusBreakdownEntries(
  breakdown: AdminDashboardStatusBreakdown,
  t: (key: string) => string,
): BreakdownEntry[] {
  return (["paid", "pending", "refunded", "cancelled"] as const).map((key) => ({
    key,
    label: t(`account.status.payment.${key}`),
    count: breakdown[key],
  }));
}

/** Convertit la répartition des moyens de paiement en entrées affichables par le donut. */
export function toMethodBreakdownEntries(
  breakdown: AdminDashboardMethodBreakdown,
  t: (key: string) => string,
): BreakdownEntry[] {
  return (["stripe", "paypal", "manual"] as const).map((key) => ({
    key,
    label: t(`checkout.methods.${key}.label`),
    count: breakdown[key],
  }));
}
