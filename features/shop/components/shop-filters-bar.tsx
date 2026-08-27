"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  categoryDisplayLabel,
  type ProductCategory,
} from "@/lib/infrastructure/supabase/product-categories";
import type { ProductSort } from "@/lib/infrastructure/supabase/types";
import {
  FIBRES_CATEGORY,
  HELMETS_CATEGORY,
} from "@/features/shop/utils/map-product";

/** Props de la barre de filtres boutique. */
type ShopFiltersBarProps = {
  activeCategory: string;
  categories: ProductCategory[];
  activeUniverse?: "adult" | "child" | "all";
  childUniverseEnabled?: boolean;
  query: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: ProductSort;
};

const SORT_OPTIONS: ProductSort[] = ["recent", "price_asc", "price_desc", "name_asc"];

function buildHref(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `${pathname}?${s}` : pathname;
}

/** Rangée de puces de catégorie (fibres ou accessoires). */
function CategoryChipRow({
  label,
  categories: items,
  current,
  language,
  hrefFor,
  accent = false,
}: {
  label: string;
  categories: ProductCategory[];
  current: string;
  language: string;
  hrefFor: (slug: string) => string;
  accent?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <p
        className={`text-xs font-medium uppercase tracking-[0.14em] ${
          accent ? "text-accent" : "text-muted"
        }`}
      >
        {label}
      </p>
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
        role="list"
        aria-label={label}
      >
        {items.map((c) => {
          const selected = current === c.slug;
          return (
            <Link
              key={c.slug}
              href={hrefFor(c.slug)}
              role="listitem"
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm transition ${
                accent
                  ? selected
                    ? "border-accent bg-accent text-background"
                    : "border-accent/40 text-accent hover:bg-accent/10"
                  : selected
                    ? "border-transparent bg-primary text-background"
                    : "border-border text-muted hover:border-accent hover:text-foreground"
              }`}
            >
              {categoryDisplayLabel(c, language)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Barre de filtres boutique complète : recherche texte, catégories (avec groupe
 * soin capillaire / accessoire), univers, prix min/max, en stock, tri — pilotée
 * via les paramètres d'URL pour rester compatible avec le rendu serveur.
 */
export function ShopFiltersBar({
  activeCategory,
  categories,
  activeUniverse = "all",
  childUniverseEnabled = false,
  query,
  minPrice,
  maxPrice,
  inStockOnly,
  sort,
}: ShopFiltersBarProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(query);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [showMoreFilters, setShowMoreFilters] = useState(
    Boolean(minPrice || maxPrice || inStockOnly),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setSearchInput(query), [query]);
  useEffect(() => setMinInput(minPrice), [minPrice]);
  useEffect(() => setMaxInput(maxPrice), [maxPrice]);

  const current = activeCategory || "all";
  const universe = activeUniverse || "all";

  const updateParams = (patch: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  const scheduleUpdate = (patch: Record<string, string | null | undefined>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams(patch), 400);
  };

  const hairCareCategories = categories.filter((c) => c.product_type === "hair_care");
  const fibreCategories = categories.filter((c) => c.slug === FIBRES_CATEGORY);
  const accessoryCategories = categories.filter(
    (c) =>
      c.product_type === "accessory" &&
      c.slug !== FIBRES_CATEGORY &&
      c.slug !== HELMETS_CATEGORY,
  );

  const chipHref = (slug: string) =>
    buildHref(pathname, {
      category: slug,
      universe: universe !== "all" ? universe : null,
      q: query || null,
      min: minPrice || null,
      max: maxPrice || null,
      inStock: inStockOnly ? "1" : null,
      sort: sort !== "recent" ? sort : null,
    });

  return (
    <div className="space-y-4">
      <label className="block max-w-md">
        <span className="sr-only">{t("shop.searchLabel")}</span>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              scheduleUpdate({ q: e.target.value || null });
            }}
            placeholder={t("shop.searchPlaceholder")}
            className="min-h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3.5 text-base outline-none transition placeholder:text-muted focus:border-accent sm:min-h-11 sm:text-sm"
          />
        </div>
      </label>

      {childUniverseEnabled ? (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label={t("shop.universeFiltersLabel")}
        >
          {(["all", "adult", "child"] as const).map((key) => {
            const selected = universe === key;
            return (
              <Link
                key={key}
                href={buildHref(pathname, {
                  category: current !== "all" ? current : null,
                  universe: key !== "all" ? key : null,
                  q: query || null,
                  min: minPrice || null,
                  max: maxPrice || null,
                  inStock: inStockOnly ? "1" : null,
                  sort: sort !== "recent" ? sort : null,
                })}
                role="listitem"
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm transition ${
                  selected
                    ? "bg-accent text-background"
                    : "border border-border text-muted hover:border-accent"
                }`}
              >
                {t(`shop.universe.${key}`)}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {t("shop.groupHairCare")}
        </p>
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
          role="list"
          aria-label={t("shop.filtersLabel")}
        >
          {[
            { key: "all", label: t("shop.categories.all") },
            ...hairCareCategories.map((c) => ({
              key: c.slug,
              label: categoryDisplayLabel(c, i18n.language),
            })),
          ].map((item) => {
            const selected = current === item.key;
            return (
              <Link
                key={item.key}
                href={buildHref(pathname, {
                  category: item.key !== "all" ? item.key : null,
                  universe: universe !== "all" ? universe : null,
                  q: query || null,
                  min: minPrice || null,
                  max: maxPrice || null,
                  inStock: inStockOnly ? "1" : null,
                  sort: sort !== "recent" ? sort : null,
                })}
                role="listitem"
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm transition ${
                  selected
                    ? "bg-primary text-background"
                    : "border border-border text-muted hover:border-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <CategoryChipRow
        label={t("shop.groupFibres")}
        categories={fibreCategories}
        current={current}
        language={i18n.language}
        hrefFor={chipHref}
      />
      <CategoryChipRow
        label={t("shop.groupAccessories")}
        categories={accessoryCategories}
        current={current}
        language={i18n.language}
        hrefFor={chipHref}
        accent
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowMoreFilters((v) => !v)}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          {t("shop.moreFilters")}
        </button>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">{t("shop.sortLabel")}</span>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === "recent" ? null : e.target.value })}
            className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`shop.sort.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showMoreFilters ? (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-background-alt/60 p-4">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("shop.minPrice")}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={minInput}
              onChange={(e) => {
                setMinInput(e.target.value);
                scheduleUpdate({ min: e.target.value || null });
              }}
              className="min-h-11 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("shop.maxPrice")}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={maxInput}
              onChange={(e) => {
                setMaxInput(e.target.value);
                scheduleUpdate({ max: e.target.value || null });
              }}
              className="min-h-11 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateParams({ inStock: e.target.checked ? "1" : null })}
              className="size-4.5"
            />
            <span className="text-muted">{t("shop.inStockOnly")}</span>
          </label>
          {query || minPrice || maxPrice || inStockOnly || current !== "all" ? (
            <Link
              href={pathname}
              className="ml-auto inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-muted transition hover:border-accent hover:text-foreground"
            >
              {t("shop.resetFilters")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
