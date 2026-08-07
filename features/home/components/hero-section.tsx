"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { HOME_IMAGES } from "@/features/home/data/content";

export function HeroSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("hero");
  const cmsTitle = cms.title?.trim();
  const subtitle = cmsOr(cms, "subtitle", t("home.hero.subtitle"));
  const heroImage = cmsOr(cms, "image_url", HOME_IMAGES.hero);
  const ctaLabel = cms.cta_label?.trim();

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="order-2 space-y-8 lg:order-1">
          <div className="space-y-5">
            {cmsTitle ? (
              <h1 className="font-serif text-4xl leading-[1.1] text-primary sm:text-5xl lg:text-6xl">
                {cmsTitle}
              </h1>
            ) : (
              <h1 className="font-serif text-4xl leading-[1.1] text-primary sm:text-5xl lg:text-6xl">
                {t("home.hero.titleBefore")}
                <span className="text-accent">{t("home.hero.titleAccent")}</span>
                {t("home.hero.titleAfter")}
              </h1>
            )}
            <p className="max-w-xl text-base leading-relaxed text-primary/80 sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/diagnostic-capillaire" size="lg">
              {ctaLabel || t("home.hero.ctaDiagnostic")}
            </Button>
            <Button href="/boutique" variant="accent-outline" size="lg">
              {t("home.hero.ctaShop")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2">
              {HOME_IMAGES.avatars.map((src, index) => (
                <div
                  key={src}
                  className="relative size-10 overflow-hidden rounded-full border-2 border-background"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Stars />
              <p className="max-w-xs text-sm text-muted">{t("home.hero.socialProof")}</p>
            </div>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-6 z-0 opacity-20"
          >
            <img
              src="/images/brand/logo-orange.png"
              alt=""
              className="h-48 w-auto select-none sm:h-56"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={heroImage}
              alt={t("home.hero.imageAlt")}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 90vw, 45vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
