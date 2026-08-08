"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  categoryDisplayLabel,
  type ProductCategory,
} from "@/lib/infrastructure/supabase/product-categories";

type ShopFiltersProps = {
  activeCategory: string;
  categories: ProductCategory[];
  activeUniverse?: "adult" | "child" | "all";
  childUniverseEnabled?: boolean;
};

function buildHref(category: string, universe: string) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (universe === "adult" || universe === "child") {
    params.set("universe", universe);
  }
  const qs = params.toString();
  return qs ? `/boutique?${qs}` : "/boutique";
}

export function ShopFilters({
  activeCategory,
  categories,
  activeUniverse = "all",
  childUniverseEnabled = false,
}: ShopFiltersProps) {
  const { t, i18n } = useTranslation();
  const current = activeCategory || "all";
  const universe = activeUniverse || "all";

  const items = [
    { key: "all", href: buildHref("all", universe), label: t("shop.categories.all") },
    ...categories.map((category) => ({
      key: category.slug,
      href: buildHref(category.slug, universe),
      label: categoryDisplayLabel(category, i18n.language),
    })),
  ];

  return (
    <div className="space-y-4">
      {childUniverseEnabled ? (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label={t("shop.universeFiltersLabel")}
        >
          {(
            [
              ["all", buildHref(current, "all")],
              ["adult", buildHref(current, "adult")],
              ["child", buildHref(current, "child")],
            ] as const
          ).map(([key, href]) => {
            const selected = universe === key;
            return (
              <Link
                key={key}
                href={href}
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

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
        role="list"
        aria-label={t("shop.filtersLabel")}
      >
        {items.map((item) => {
          const selected = current === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
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
  );
}
