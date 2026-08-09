"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GAMME_COMPLETE_SLUG } from "@/lib/domain/bundle";

export function ShopPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {t("shop.title")}
        </h1>
        <p className="text-muted">{t("shop.subtitle")}</p>
      </div>

      <aside className="flex flex-col gap-4 rounded-3xl bg-brand px-5 py-5 text-on-brand sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-serif text-xl text-on-brand sm:text-2xl">
            {t("shop.gammeBannerTitle")}
          </p>
          <p className="text-sm text-on-brand/85">{t("shop.gammeBannerBody")}</p>
        </div>
        <Button
          href={`/boutique/${GAMME_COMPLETE_SLUG}`}
          variant="accent-outline"
          className="shrink-0 border-accent text-accent hover:bg-accent/15"
        >
          {t("shop.gammeBannerCta")}
        </Button>
      </aside>
    </div>
  );
}
