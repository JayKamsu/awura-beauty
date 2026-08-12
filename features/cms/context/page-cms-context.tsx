"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type {
  PageFieldKey,
  PageSectionConfig,
  PageSectionFields,
  PageSectionId,
} from "@/lib/domain";

type PageCmsContextValue = {
  sections: PageSectionConfig[];
  getFields: (sectionId: PageSectionId) => PageSectionFields;
};

const PageCmsContext = createContext<PageCmsContextValue>({
  sections: [],
  getFields: () => ({}),
});

/** Fournit les sections CMS d'une page (contenus admin) au reste de l'arbre React. */
export function PageCmsProvider({
  sections,
  children,
}: {
  sections: PageSectionConfig[];
  children: ReactNode;
}) {
  const value = useMemo<PageCmsContextValue>(
    () => ({
      sections,
      getFields: (sectionId) =>
        sections.find((s) => s.id === sectionId)?.fields ?? {},
    }),
    [sections],
  );

  return (
    <PageCmsContext.Provider value={value}>{children}</PageCmsContext.Provider>
  );
}

/** Récupère les champs CMS édités pour une section de page donnée. */
export function usePageCmsFields(sectionId: PageSectionId): PageSectionFields {
  return useContext(PageCmsContext).getFields(sectionId);
}

/** Texte CMS ou fallback i18n. */
export function cmsOr(
  fields: PageSectionFields,
  key: keyof PageSectionFields,
  fallback: string,
): string {
  const value = fields[key]?.trim();
  return value || fallback;
}

/** Bloc de contenu individuel issu du parsing du champ « Texte » admin. */
export type CmsContentBlock = {
  title: string;
  body: string;
  image?: string;
};

/**
 * Blocs multi-items édités dans le champ « Texte » admin.
 * Séparateur : ligne `---`
 * Format d’un bloc :
 *   Titre
 *   Corps (plusieurs lignes)
 *   image:https://…   (optionnel)
 */
export function parseCmsBlocks(raw: string | undefined): CmsContentBlock[] {
  const text = raw?.trim();
  if (!text) return [];

  return text
    .split(/\n---\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n");
      const title = (lines[0] ?? "").trim();
      let image: string | undefined;
      const bodyLines: string[] = [];
      for (const line of lines.slice(1)) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith("image:")) {
          image = trimmed.slice("image:".length).trim() || undefined;
        } else {
          bodyLines.push(line);
        }
      }
      return {
        title,
        body: bodyLines.join("\n").trim(),
        image,
      };
    })
    .filter((block) => block.title || block.body || block.image);
}

/** Champs éditables par section (admin Pages). */
export const SECTION_EDITABLE_FIELDS: Record<PageSectionId, PageFieldKey[]> = {
  hero: ["title", "subtitle", "image_url", "cta_label"],
  promises: ["body"],
  bestsellers: ["title", "subtitle", "cta_label"],
  ingredients: ["title", "subtitle", "body"],
  feature: ["title", "subtitle", "body", "image_url", "cta_label"],
  testimonials: ["title", "body"],
  story: ["title", "subtitle", "body", "image_url"],
  founder: ["title", "subtitle", "body", "image_url"],
  mission: ["title", "subtitle", "body"],
  commitments: ["title", "subtitle", "body"],
  cta: ["title", "body", "cta_label"],
};

export const SECTION_USES_BLOCKS: Partial<Record<PageSectionId, boolean>> = {
  promises: true,
  testimonials: true,
  mission: true,
  commitments: true,
};
