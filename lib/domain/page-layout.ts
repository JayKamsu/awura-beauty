export type PageSectionId =
  | "hero"
  | "promises"
  | "bestsellers"
  | "ingredients"
  | "feature"
  | "testimonials"
  | "story"
  | "mission"
  | "commitments"
  | "cta";

export type PageLocale = "fr" | "en" | "es";

export type PageFieldKey =
  | "title"
  | "subtitle"
  | "body"
  | "image_url"
  | "cta_label";

/** Champs CMS pour une locale (valeurs vides = fallback i18n front). */
export type PageSectionFields = Partial<Record<PageFieldKey, string>>;

export type PageSectionConfig = {
  id: PageSectionId;
  enabled: boolean;
  /** UUID ligne DB (admin) */
  rowId?: string;
  position?: number;
  /** Champs par locale (admin) */
  fieldsByLocale?: Partial<Record<PageLocale, PageSectionFields>>;
  /** Champs résolus pour la locale courante (public) */
  fields?: PageSectionFields;
};

export type PageLayout = {
  pageKey: string;
  sections: PageSectionConfig[];
  updatedAt?: string;
};

export const PAGE_LOCALES: PageLocale[] = ["fr", "en", "es"];

export const PAGE_FIELD_KEYS: PageFieldKey[] = [
  "title",
  "subtitle",
  "body",
  "image_url",
  "cta_label",
];

export const DEFAULT_HOME_SECTIONS: PageSectionConfig[] = [
  { id: "hero", enabled: true, position: 0 },
  { id: "promises", enabled: true, position: 1 },
  { id: "bestsellers", enabled: true, position: 2 },
  { id: "ingredients", enabled: true, position: 3 },
  { id: "feature", enabled: true, position: 4 },
  { id: "testimonials", enabled: true, position: 5 },
];

export const DEFAULT_ABOUT_SECTIONS: PageSectionConfig[] = [
  { id: "story", enabled: true, position: 0 },
  { id: "mission", enabled: true, position: 1 },
  { id: "commitments", enabled: true, position: 2 },
  { id: "cta", enabled: true, position: 3 },
];

export function defaultLayoutFor(pageKey: string): PageLayout {
  if (pageKey === "about") {
    return { pageKey: "about", sections: DEFAULT_ABOUT_SECTIONS };
  }
  return { pageKey: "home", sections: DEFAULT_HOME_SECTIONS };
}

export function isPageSectionId(value: string): value is PageSectionId {
  return (
    value === "hero" ||
    value === "promises" ||
    value === "bestsellers" ||
    value === "ingredients" ||
    value === "feature" ||
    value === "testimonials" ||
    value === "story" ||
    value === "mission" ||
    value === "commitments" ||
    value === "cta"
  );
}
