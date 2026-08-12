import type { DiagnosticContentBlock } from "@/lib/domain/diagnostic";

/**
 * Squelette de bilan pré-rempli pour l'admin (structure calquée sur le modèle
 * de bilan Awura : situation actuelle, routine, recommandations, suivi…).
 * L'admin complète/adapte chaque section après l'appel.
 */
export function buildDiagnosticResultTemplate(fullName: string): DiagnosticContentBlock[] {
  const name = fullName.trim() || "…";
  return [
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
    { type: "heading", text: "Liens utiles" },
    { type: "paragraph", text: "Ajoute ici les liens produits/accessoires pertinents (bouton « Lien » ci-dessous)." },
    { type: "heading", text: "Suivi" },
    { type: "paragraph", text: "On se retrouve dans 3 mois pour faire le point — n'hésite pas à m'envoyer des photos avant/après." },
    { type: "heading", text: "Ton retour" },
    { type: "paragraph", text: "Dis-moi comment ta routine se passe dans quelques semaines. Et si tu as 1 minute, un petit témoignage vidéo ou écrit aide beaucoup les autres clientes hésitantes 💛" },
    { type: "paragraph", text: "À très bientôt," },
  ];
}
