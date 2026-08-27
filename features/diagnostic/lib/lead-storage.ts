/** Lead capturé depuis l’accueil → consommé par le flux présentiel. */
export const DIAGNOSTIC_LEAD_STORAGE_KEY = "awura-diagnostic-lead";

/** Coordonnées et réponses d'un prospect capturées avant un rendez-vous présentiel. */
export type DiagnosticLead = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  hairType?: string;
  concern?: string;
  goal?: string;
  slot?: string;
  /** Canal choisi depuis l'accueil : en ligne ou présentiel. */
  channel?: "online" | "physical";
};

/** Lit le lead diagnostic stocké en session, ou `null` si absent/corrompu. */
export function readDiagnosticLead(): DiagnosticLead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DIAGNOSTIC_LEAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiagnosticLead;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Sauvegarde le lead diagnostic en sessionStorage ; échoue silencieusement (quota, navigation privée). */
export function writeDiagnosticLead(lead: DiagnosticLead): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      DIAGNOSTIC_LEAD_STORAGE_KEY,
      JSON.stringify(lead),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Supprime le lead diagnostic stocké, typiquement une fois le rendez-vous confirmé. */
export function clearDiagnosticLead(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DIAGNOSTIC_LEAD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Concatène prénom et nom du lead pour affichage ; chaîne vide si aucun lead. */
export function leadFullName(lead: DiagnosticLead | null): string {
  if (!lead) return "";
  return `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
}
