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
import type { PageSectionConfig, PageSectionId } from "@/lib/domain/page-layout";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Photo d'ingrédient déjà résolue pour un soin de l'accueil. */
export type HomeIngredientImage = {
  id: string;
  image: string;
};

/** Accueil public : le premier rendu utilise les photos déjà chargées côté serveur. */
export function HomePage({
  initialSections,
  initialBestsellers,
  initialAvatars,
  ingredientImages,
  careProducts = [],
}: {
  initialSections: PageSectionConfig[];
  initialBestsellers: ProductRow[];
  initialAvatars: string[];
  ingredientImages: HomeIngredientImage[];
  careProducts?: ProductRow[];
}) {
  const { i18n } = useTranslation();
  const [sections, setSections] = useState(initialSections);

  useEffect(() => {
    const locale = i18n.language?.slice(0, 2) || "fr";
    if (locale === "fr") return;
    let cancelled = false;
    void fetch(`/api/pages/home?locale=${locale}`)
      .then((res) => res.json())
      .then((json: { layout?: { sections?: PageSectionConfig[] } }) => {
        if (cancelled || !json.layout?.sections?.length) return;
        setSections(json.layout.sections);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const sectionFor = (id: PageSectionId): ReactNode => {
    switch (id) {
      case "hero":
        return <HeroSection initialAvatars={initialAvatars} />;
      case "promises":
        return <PromisesSection />;
      case "bestsellers":
        return (
          <BestsellersSection
            initialProducts={initialBestsellers}
            catalog={careProducts}
          />
        );
      case "ingredients":
        return <IngredientsSection images={ingredientImages} />;
      case "feature":
        return <FeatureDiagnosticSection />;
      case "testimonials":
        return <TestimonialsSection />;
      default:
        return null;
    }
  };

  return (
    <PageCmsProvider sections={sections}>
      <main className="flex w-full flex-1 flex-col">
        {sections
          .filter((section) => section.enabled)
          .map((section) => (
            <div
              key={section.id}
              className={section.id === "promises" ? "max-lg:hidden" : undefined}
            >
              {sectionFor(section.id)}
            </div>
          ))}
      </main>
    </PageCmsProvider>
  );
}
