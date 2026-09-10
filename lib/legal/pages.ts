import { buildPageMetadata } from "@/lib/seo/metadata";

/** URL de la fonctionnalité de rétractation en ligne (art. L221-21 / D221-5). */
export const WITHDRAWAL_PATH = "/retractation";

/** Slug d’une page légale publique (URL racine `/{slug}`). */
export const LEGAL_SLUGS = [
  "informations-entreprise",
  "mentions-legales",
  "conditions-utilisation",
  "politique-de-retour",
  "confidentialite",
] as const;

/** Identifiant d’une page légale Awura. */
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/** Date de dernière mise à jour des textes légaux (ISO calendaire). */
export const LEGAL_UPDATED_ISO = "2026-09-10";

type LegalPageConfig = {
  slug: LegalSlug;
  i18nKey: "company" | "mentions" | "terms" | "returns" | "privacy";
  titleFr: string;
  descriptionFr: string;
};

/** Registre des pages légales : URLs, clés i18n et metadata FR de référence. */
export const LEGAL_PAGES: Record<LegalSlug, LegalPageConfig> = {
  "informations-entreprise": {
    slug: "informations-entreprise",
    i18nKey: "company",
    titleFr: "Informations de l’entreprise",
    descriptionFr:
      "Identité d’Awura Beauty : marque, contact et informations d’entreprise.",
  },
  "mentions-legales": {
    slug: "mentions-legales",
    i18nKey: "mentions",
    titleFr: "Mentions légales",
    descriptionFr:
      "Mentions légales du site awurabeauty.com : éditeur, hébergeur et propriété intellectuelle.",
  },
  "conditions-utilisation": {
    slug: "conditions-utilisation",
    i18nKey: "terms",
    titleFr: "Conditions d’utilisation",
    descriptionFr:
      "Conditions générales d’utilisation et de vente d’Awura Beauty : commandes, paiements, livraisons et responsabilités.",
  },
  "politique-de-retour": {
    slug: "politique-de-retour",
    i18nKey: "returns",
    titleFr: "Politique de retour",
    descriptionFr:
      "Droit de rétractation, retours et remboursements des soins capillaires Awura Beauty.",
  },
  confidentialite: {
    slug: "confidentialite",
    i18nKey: "privacy",
    titleFr: "Confidentialité & RGPD",
    descriptionFr:
      "Politique de confidentialité Awura Beauty : données personnelles, cookies, sous-traitants et droits RGPD.",
  },
};

/** Indique si le slug correspond à une page légale connue. */
export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

/** Métadonnées SEO d’une page légale (titre et description FR de référence). */
export function legalPageMetadata(slug: LegalSlug) {
  const page = LEGAL_PAGES[slug];
  return buildPageMetadata({
    title: page.titleFr,
    description: page.descriptionFr,
    path: `/${page.slug}`,
  });
}
