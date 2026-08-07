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

export type PageSectionConfig = {
  id: PageSectionId;
  enabled: boolean;
};

export type PageLayout = {
  pageKey: string;
  sections: PageSectionConfig[];
  updatedAt?: string;
};

export const DEFAULT_HOME_SECTIONS: PageSectionConfig[] = [
  { id: "hero", enabled: true },
  { id: "promises", enabled: true },
  { id: "bestsellers", enabled: true },
  { id: "ingredients", enabled: true },
  { id: "feature", enabled: true },
  { id: "testimonials", enabled: true },
];

export const DEFAULT_ABOUT_SECTIONS: PageSectionConfig[] = [
  { id: "story", enabled: true },
  { id: "mission", enabled: true },
  { id: "commitments", enabled: true },
  { id: "cta", enabled: true },
];

export function defaultLayoutFor(pageKey: string): PageLayout {
  if (pageKey === "about") {
    return { pageKey: "about", sections: DEFAULT_ABOUT_SECTIONS };
  }
  return { pageKey: "home", sections: DEFAULT_HOME_SECTIONS };
}
