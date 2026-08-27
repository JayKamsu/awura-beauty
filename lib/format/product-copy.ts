/**
 * Mise en page des textes produit : paragraphes, phrases, listes d'ingrédients.
 * Locale française (tutoiement Awura).
 */

/** Met en majuscule la première lettre d'une chaîne. */
export function capitalizeFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [first, ...rest] = [...trimmed];
  return first.toLocaleUpperCase("fr-FR") + rest.join("");
}

/** Met en majuscule le début de chaque phrase. */
export function capitalizeSentences(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.replace(
    /(^|[.!?…]\s+)(\p{Ll})/gu,
    (_, prefix: string, letter: string) =>
      prefix + letter.toLocaleUpperCase("fr-FR"),
  );
}

/** Découpe un texte en paragraphes (sauts de ligne). */
export function splitParagraphs(value: string): string[] {
  return value
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Formate un bloc court (accroche, bénéfice) : une phrase propre, majuscule en tête.
 */
export function formatProductLead(value: string): string {
  const text = capitalizeSentences(value);
  if (!text) return "";
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * Formate un texte long : chaque paragraphe commence par une majuscule,
 * les phrases aussi, séparés par une ligne vide.
 */
export function formatProductProse(value: string): string {
  return splitParagraphs(value)
    .map((paragraph) => capitalizeSentences(paragraph))
    .filter(Boolean)
    .join("\n\n");
}

/** Paragraphes prêts à afficher (description fiche produit). */
export function formatProductParagraphs(value: string): string[] {
  const formatted = formatProductProse(value);
  return formatted ? splitParagraphs(formatted) : [];
}

/** Liste d'ingrédients : chaque item commence par une majuscule. */
export function formatIngredientList(value: string): string {
  return value
    .split(/[,;]/)
    .map((item) => capitalizeFirst(item.replace(/\s+/g, " ")))
    .filter(Boolean)
    .join(", ");
}
