"use client";

import { useTranslation } from "react-i18next";
import { DiagnosticWizard } from "@/features/diagnostic/components/diagnostic-wizard";

export function DiagnosticPageContent() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6 lg:max-w-5xl">
      <header className="max-w-2xl space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("diagnostic.eyebrow")}
        </p>
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {t("diagnostic.title")}
        </h1>
        <p className="leading-relaxed text-muted">{t("diagnostic.subtitle")}</p>
      </header>

      <DiagnosticWizard />
    </main>
  );
}
