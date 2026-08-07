"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type {
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
