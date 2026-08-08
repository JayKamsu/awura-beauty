"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { HOME_IMAGES } from "@/features/home/data/content";

export function FeatureDiagnosticSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className="relative flex flex-col justify-between gap-10 bg-primary px-6 py-14 text-background md:px-10 lg:py-16">
          <div className="relative z-10 max-w-md space-y-5">
            <p className="text-sm uppercase tracking-[0.2em] text-accent-light">
              {t("home.feature.eyebrow")}
            </p>
            <h2 className="font-serif text-3xl text-accent-light sm:text-4xl">
              {t("home.feature.title")}
            </h2>
            <p className="leading-relaxed text-background/85">
              {t("home.feature.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                href="/diagnostic-capillaire?mode=online"
                variant="accent-outline"
                className="border-accent-light text-accent-light hover:bg-accent-light/10"
              >
                {t("home.feature.ctaOnline")}
              </Button>
              <Button
                href="/diagnostic-capillaire?mode=physical"
                className="bg-accent-light text-primary hover:bg-accent-light/90"
              >
                {t("home.feature.ctaPhysical")}
              </Button>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xs">
            <div className="relative aspect-square overflow-hidden rounded-full border-4 border-background/20">
              <Image
                src={HOME_IMAGES.feature}
                alt={t("home.feature.imageAlt")}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6 bg-background-alt px-6 py-14 md:px-10 lg:py-16">
          <p className="font-serif text-2xl text-primary sm:text-3xl">
            {t("home.feature.sideTitle")}
          </p>
          <ul className="space-y-3 text-sm text-muted">
            <li>{t("home.feature.sideOnline")}</li>
            <li>{t("home.feature.sidePhysical")}</li>
          </ul>
          <Button href="/diagnostic-capillaire" size="lg">
            {t("home.feature.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
