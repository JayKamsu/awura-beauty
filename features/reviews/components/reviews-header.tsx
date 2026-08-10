"use client";

import { useTranslation } from "react-i18next";

export function ReviewsHeader() {
  const { t } = useTranslation();

  return (
    <header className="max-w-2xl space-y-3">
      <h1 className="font-serif text-4xl text-primary sm:text-5xl">
        {t("reviews.title")}
      </h1>
      <p className="text-muted">{t("reviews.subtitle")}</p>
    </header>
  );
}
