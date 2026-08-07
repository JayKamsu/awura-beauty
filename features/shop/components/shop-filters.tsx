"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PRODUCT_CATEGORIES } from "@/lib/infrastructure/supabase/fallback-products";

type ShopFiltersProps = {
  activeCategory: string;
};

export function ShopFilters({ activeCategory }: ShopFiltersProps) {
  const { t } = useTranslation();
  const current = activeCategory || "all";

  const items = [
    { key: "all", href: "/boutique" },
    ...PRODUCT_CATEGORIES.map((category) => ({
      key: category,
      href: `/boutique?category=${category}`,
    })),
  ];

  return (
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
            {t(`shop.categories.${item.key}`)}
          </Link>
        );
      })}
    </div>
  );
}
