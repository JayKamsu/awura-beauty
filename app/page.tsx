"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BestsellersSection } from "@/features/home/components/bestsellers-section";
import { FeatureDiagnosticSection } from "@/features/home/components/feature-diagnostic-section";
import { HeroSection } from "@/features/home/components/hero-section";
import { IngredientsSection } from "@/features/home/components/ingredients-section";
import { PromisesSection } from "@/features/home/components/promises-section";
import { TestimonialsSection } from "@/features/home/components/testimonials-section";
import { PageCmsProvider } from "@/features/cms/context/page-cms-context";
import {
  DEFAULT_HOME_SECTIONS,
  type PageSectionConfig,
  type PageSectionId,
} from "@/lib/domain/page-layout";

const SECTION_MAP: Partial<Record<PageSectionId, ReactNode>> = {
  hero: <HeroSection />,
  promises: <PromisesSection />,
  bestsellers: <BestsellersSection />,
  ingredients: <IngredientsSection />,
  feature: <FeatureDiagnosticSection />,
  testimonials: <TestimonialsSection />,
};

export default function Home() {
  const { i18n } = useTranslation();
  const [sections, setSections] =
    useState<PageSectionConfig[]>(DEFAULT_HOME_SECTIONS);

  useEffect(() => {
    const locale = i18n.language?.slice(0, 2) || "fr";
    void fetch(`/api/pages/home?locale=${locale}`)
      .then((res) => res.json())
      .then((json: { layout?: { sections?: PageSectionConfig[] } }) => {
        if (json.layout?.sections?.length) {
          setSections(json.layout.sections);
        }
      })
      .catch(() => undefined);
  }, [i18n.language]);

  return (
    <PageCmsProvider sections={sections}>
      <main className="flex w-full flex-1 flex-col">
        {sections
          .filter((section) => section.enabled)
          .map((section) => (
            <div key={section.id}>{SECTION_MAP[section.id] ?? null}</div>
          ))}
      </main>
    </PageCmsProvider>
  );
}
