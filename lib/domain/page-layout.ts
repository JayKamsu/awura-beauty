/** Identifiant d'une section de page CMS (home / about). */
export type PageSectionId =
  | "hero"
  | "promises"
  | "bestsellers"
  | "ingredients"
  | "feature"
  | "testimonials"
  | "story"
  | "founder"
  | "mission"
  | "commitments"
  | "cta";

/** Locale gérable en admin pour le contenu CMS des pages. */
export type PageLocale = "fr" | "en" | "es";

/** Clé de champ éditable pour une section CMS. */
export type PageFieldKey =
  | "title"
  | "subtitle"
  | "body"
  | "image_url"
  | "cta_label";

/** Champs CMS pour une locale (valeurs vides = fallback i18n front). */
export type PageSectionFields = Partial<Record<PageFieldKey, string>>;

/** Configuration d'une section de page (activation, position, contenu CMS). */
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

/** Mise en page complète d'une page (liste ordonnée de sections). */
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
  { id: "founder", enabled: true, position: 1 },
  { id: "mission", enabled: true, position: 2 },
  { id: "commitments", enabled: true, position: 3 },
  { id: "cta", enabled: true, position: 4 },
];

/** Layout par défaut (fallback) pour une page si aucune config admin n'est enregistrée. */
export function defaultLayoutFor(pageKey: string): PageLayout {
  if (pageKey === "about") {
    return { pageKey: "about", sections: DEFAULT_ABOUT_SECTIONS };
  }
  return { pageKey: "home", sections: DEFAULT_HOME_SECTIONS };
}

/** Type guard : vérifie qu'une valeur brute (DB/admin) est un identifiant de section valide. */
export function isPageSectionId(value: string): value is PageSectionId {
  return (
    value === "hero" ||
    value === "promises" ||
    value === "bestsellers" ||
    value === "ingredients" ||
    value === "feature" ||
    value === "testimonials" ||
    value === "story" ||
    value === "founder" ||
    value === "mission" ||
    value === "commitments" ||
    value === "cta"
  );
}
