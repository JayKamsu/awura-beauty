"use client";

import { useTranslation } from "react-i18next";

export function AnnouncementBar() {
  const { t } = useTranslation();

  return (
    <div className="bg-primary px-4 py-2.5 text-center text-sm tracking-wide text-background">
      {t("announcement.freeShipping")}
    </div>
  );
}
