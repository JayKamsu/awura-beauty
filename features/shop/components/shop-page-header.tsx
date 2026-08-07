"use client";

import { useTranslation } from "react-i18next";

export function ShopPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="font-serif text-4xl text-primary sm:text-5xl">{t("shop.title")}</h1>
      <p className="text-muted">{t("shop.subtitle")}</p>
    </div>
  );
}
