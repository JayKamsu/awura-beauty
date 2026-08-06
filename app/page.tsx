"use client";

import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <h1 className="font-serif text-5xl tracking-wide text-primary md:text-6xl">
        {t("home.title")}
      </h1>
      <p className="max-w-lg text-lg text-muted">{t("home.subtitle")}</p>
    </main>
  );
}
