const PREFIX = "awura-admin-draft:";

/**
 * Lit un brouillon de formulaire admin depuis `localStorage` (survit au changement de page).
 */
export function readAdminDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Enregistre un brouillon de formulaire admin dans `localStorage`. */
export function writeAdminDraft(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / navigation privée */
  }
}

/** Supprime un brouillon de formulaire admin du `localStorage`. */
export function clearAdminDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
