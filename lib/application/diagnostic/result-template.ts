import type {
  DiagnosticContentBlock,
  DiagnosticExternalProductLink,
} from "@/lib/domain/diagnostic";
import { isSafeHttpUrl } from "@/lib/domain/diagnostic";

/** Titre de section du modèle de bilan pour les produits hors boutique Awura. */
export const EXTERNAL_PRODUCTS_HEADING = "Produits externes recommandés";

const LEGACY_LINKS_HEADING = "Liens utiles";
const FOLLOW_UP_HEADING = "Suivi";

/** Blocs de la section « produits externes » (liens enregistrés sur le RDV, ou placeholder). */
export function externalProductLinkBlocks(
  links: DiagnosticExternalProductLink[],
): DiagnosticContentBlock[] {
  const valid = links.filter((link) => isSafeHttpUrl(link.url));
  const heading: DiagnosticContentBlock[] = [
    { type: "heading", text: EXTERNAL_PRODUCTS_HEADING },
    {
      type: "paragraph",
      text: valid.length
        ? "Compléments à se procurer (hors boutique Awura) :"
        : "Ajoute les liens produits depuis la fiche de réservation — ils apparaîtront ici.",
    },
  ];
  if (valid.length === 0) {
    return [...heading, { type: "link", text: "", url: "" }];
  }
  return [
    ...heading,
    ...valid.map((link) => ({
      type: "link" as const,
      text: link.label || link.url,
      url: link.url,
    })),
  ];
}

/**
 * Remplace (ou insère) la section produits externes du bilan à partir des liens
 * enregistrés sur la réservation.
 */
export function withExternalProductLinks(
  content: DiagnosticContentBlock[],
  links: DiagnosticExternalProductLink[],
): DiagnosticContentBlock[] {
  const section = externalProductLinkBlocks(links);
  const headingIndex = content.findIndex(
    (block) =>
      block.type === "heading" &&
      (block.text === EXTERNAL_PRODUCTS_HEADING ||
        block.text === LEGACY_LINKS_HEADING),
  );
  if (headingIndex < 0) {
    const followUp = content.findIndex(
      (block) => block.type === "heading" && block.text === FOLLOW_UP_HEADING,
    );
    if (followUp >= 0) {
      return [
        ...content.slice(0, followUp),
        ...section,
        ...content.slice(followUp),
      ];
    }
    return [...content, ...section];
  }
  let end = headingIndex + 1;
  while (end < content.length && content[end].type !== "heading") end += 1;
  return [...content.slice(0, headingIndex), ...section, ...content.slice(end)];
}

/**
 * Squelette de bilan pré-rempli pour l'admin (structure calquée sur le modèle
 * de bilan Awura : situation actuelle, routine, recommandations, suivi…).
 * L'admin complète/adapte chaque section après l'appel.
 */
export function buildDiagnosticResultTemplate(
  fullName: string,
  externalLinks: DiagnosticExternalProductLink[] = [],
): DiagnosticContentBlock[] {
  const name = fullName.trim() || "…";
  const base: DiagnosticContentBlock[] = [
    { type: "paragraph", text: `Bonjour ${name},\n\nMerci encore pour ta confiance. Voici le bilan de ton diagnostic capillaire.` },
    { type: "heading", text: "Situation actuelle" },
    {
      type: "list",
      items: [
        "Densité et texture observées : …",
        "Habitudes de manipulation (coiffures protectrices, démêlage…) : …",
        "Hydratation / casse constatées : …",
        "Produits actuellement utilisés : …",
      ],
    },
    { type: "heading", text: "Routine de lavage actuelle" },
    {
      type: "list",
      items: [
        "Fréquence de lavage : …",
        "Shampoing / après-shampoing utilisés : …",
        "Séchage : …",
      ],
    },
    { type: "heading", text: "Recommandations personnalisées" },
    { type: "subheading", text: "1. Stimuler le cuir chevelu" },
    { type: "paragraph", text: "…" },
    { type: "subheading", text: "2. Routine rapide" },
    { type: "paragraph", text: "…" },
    { type: "subheading", text: "3. Routine complète" },
    { type: "paragraph", text: "…" },
    { type: "subheading", text: "4. Hydratation quotidienne" },
    { type: "paragraph", text: "…" },
    { type: "subheading", text: "5. Rinçage" },
    { type: "paragraph", text: "…" },
    { type: "subheading", text: "6. Séchage" },
    { type: "paragraph", text: "…" },
    { type: "heading", text: "Rajouts et coiffures protectrices" },
    { type: "paragraph", text: "…" },
    { type: "heading", text: "Accessoires recommandés" },
    {
      type: "list",
      items: [
        "Bonnet ou écharpe en satin",
        "Taie d'oreiller en satin",
        "Brosse démêlante",
        "Spray d'hydratation",
      ],
    },
    { type: "heading", text: FOLLOW_UP_HEADING },
    { type: "paragraph", text: "On se retrouve dans 3 mois pour faire le point — n'hésite pas à m'envoyer des photos avant/après." },
    { type: "heading", text: "Ton retour" },
    { type: "paragraph", text: "Dis-moi comment ta routine se passe dans quelques semaines. Et si tu as 1 minute, un petit témoignage vidéo ou écrit aide beaucoup les autres clientes hésitantes 💛" },
    { type: "paragraph", text: "À très bientôt," },
  ];
  return withExternalProductLinks(base, externalLinks);
}
