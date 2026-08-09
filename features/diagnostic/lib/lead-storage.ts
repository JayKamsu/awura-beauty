/** Lead capturé depuis l’accueil → consommé par le flux présentiel. */
export const DIAGNOSTIC_LEAD_STORAGE_KEY = "awura-diagnostic-lead";

export type DiagnosticLead = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  hairType?: string;
  concern?: string;
  goal?: string;
  slot?: string;
};

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

export function clearDiagnosticLead(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DIAGNOSTIC_LEAD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function leadFullName(lead: DiagnosticLead | null): string {
  if (!lead) return "";
  return `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
}
