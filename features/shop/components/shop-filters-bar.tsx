"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

const CHIP =
  "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm transition sm:min-h-11 sm:px-4";
const CHIP_IDLE =
  "border border-border text-muted hover:border-accent hover:text-foreground";
const CHIP_ACTIVE = "border-transparent bg-primary text-background";
const CHIP_ACCENT_IDLE =
  "border border-accent/40 text-accent hover:bg-accent/10";
const CHIP_ACCENT_ACTIVE = "border-accent bg-accent text-background";

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

function Chip({
  href,
  selected,
  accent,
  children,
}: {
  href: string;
  selected: boolean;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="listitem"
      className={`${CHIP} ${
        accent
          ? selected
            ? CHIP_ACCENT_ACTIVE
            : CHIP_ACCENT_IDLE
          : selected
            ? CHIP_ACTIVE
            : CHIP_IDLE
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Barre de filtres boutique compacte : recherche + tri, puis catégories en
 * une seule rangée (défilement horizontal sur mobile).
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
  const extraActive = Boolean(minPrice || maxPrice || inStockOnly);
  const [showMoreFilters, setShowMoreFilters] = useState(extraActive);
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
      c.slug !== HELMETS_CATEGORY &&
      c.slug !== FIBRES_CATEGORY,
  );

  const hrefFor = (slug: string) =>
    buildHref(pathname, {
      category: slug !== "all" ? slug : null,
      universe: universe !== "all" ? universe : null,
      q: query || null,
      min: minPrice || null,
      max: maxPrice || null,
      inStock: inStockOnly ? "1" : null,
      sort: sort !== "recent" ? sort : null,
    });

  const hasAdvanced =
    Boolean(query) || extraActive || current !== "all" || universe !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t("shop.searchLabel")}</span>
          <div className="relative">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
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
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-base outline-none transition placeholder:text-muted focus:border-accent sm:text-sm"
            />
          </div>
        </label>

        <div className="flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <span className="hidden text-sm text-muted sm:inline">
              {t("shop.sortLabel")}
            </span>
            <select
              value={sort}
              aria-label={t("shop.sortLabel")}
              onChange={(e) =>
                updateParams({
                  sort: e.target.value === "recent" ? null : e.target.value,
                })
              }
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent sm:w-44"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`shop.sort.${option}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            aria-expanded={showMoreFilters}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition sm:px-4 ${
              extraActive || showMoreFilters
                ? "border-accent text-accent"
                : "border-border text-primary hover:border-accent hover:text-accent"
            }`}
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
            <span className="hidden sm:inline">{t("shop.moreFilters")}</span>
            <span className="sm:hidden">{t("shop.filtersShort")}</span>
          </button>
        </div>
      </div>

      {childUniverseEnabled ? (
        <div
          className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label={t("shop.universeFiltersLabel")}
        >
          {(["all", "adult", "child"] as const).map((key) => (
            <Chip
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
              selected={universe === key}
            >
              {t(`shop.universe.${key}`)}
            </Chip>
          ))}
        </div>
      ) : null}

      <div
        className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0"
        role="list"
        aria-label={t("shop.filtersLabel")}
      >
        <div className="flex w-max items-center gap-2 md:w-full md:flex-wrap">
          <Chip href={hrefFor("all")} selected={current === "all"}>
            {t("shop.categories.all")}
          </Chip>
          {hairCareCategories.map((c) => (
            <Chip
              key={c.slug}
              href={hrefFor(c.slug)}
              selected={current === c.slug}
            >
              {categoryDisplayLabel(c, i18n.language)}
            </Chip>
          ))}
          {fibreCategories.length > 0 || accessoryCategories.length > 0 ? (
            <span
              className="mx-0.5 hidden h-4 w-px shrink-0 bg-border md:block"
              aria-hidden
            />
          ) : null}
          {fibreCategories.map((c) => (
            <Chip
              key={c.slug}
              href={hrefFor(c.slug)}
              selected={current === c.slug}
              accent
            >
              {categoryDisplayLabel(c, i18n.language)}
            </Chip>
          ))}
          {accessoryCategories.map((c) => (
            <Chip
              key={c.slug}
              href={hrefFor(c.slug)}
              selected={current === c.slug}
              accent
            >
              {categoryDisplayLabel(c, i18n.language)}
            </Chip>
          ))}
        </div>
      </div>

      {showMoreFilters ? (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background-alt/50 px-3 py-3 sm:px-4">
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
              className="min-h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent sm:min-h-11 sm:w-28"
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
              className="min-h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent sm:min-h-11 sm:w-28"
            />
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm sm:min-h-11">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) =>
                updateParams({ inStock: e.target.checked ? "1" : null })
              }
              className="size-4"
            />
            <span className="text-muted">{t("shop.inStockOnly")}</span>
          </label>
          {hasAdvanced ? (
            <Link
              href={pathname}
              className="ml-auto inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-sm text-muted transition hover:border-accent hover:text-foreground sm:min-h-11 sm:px-4"
            >
              {t("shop.resetFilters")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
