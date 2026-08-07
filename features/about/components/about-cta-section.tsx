"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function AboutCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-background-alt">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center md:px-6 md:py-20">
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {t("about.cta.title")}
        </h2>
        <p className="max-w-xl leading-relaxed text-muted">
          {t("about.cta.description")}
        </p>
        <Button href="/diagnostic-capillaire" size="lg">
          {t("about.cta.button")}
        </Button>
      </div>
    </section>
  );
}
