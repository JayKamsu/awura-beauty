const PLACE_KEY = "awura-admin-place";
const AREA_KEY = "awura-last-area";

/** Dernière page admin et position de défilement. */
export type AdminPlace = {
  href: string;
  scrollY: number;
};

/** Enregistre la page admin courante et le défilement, pour les retrouver à la réouverture. */
export function saveAdminPlace(href: string, scrollY: number) {
  if (!href.startsWith("/admin") || href.startsWith("/admin/connexion")) return;
  try {
    const place: AdminPlace = { href, scrollY: Math.max(0, scrollY) };
    localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    /* navigation privée ou quota */
  }
}

/** Lit la dernière page admin mémorisée, ou null si elle est absente ou invalide. */
export function readAdminPlace(): AdminPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminPlace>;
    if (typeof parsed.href !== "string" || !parsed.href.startsWith("/admin")) {
      return null;
    }
    if (parsed.href.startsWith("/admin/connexion")) return null;
    return {
      href: parsed.href,
      scrollY: typeof parsed.scrollY === "number" ? parsed.scrollY : 0,
    };
  } catch {
    return null;
  }
}

/** Retient si la dernière zone ouverte était l'admin ou le site public. */
export function markLastArea(area: "admin" | "site") {
  try {
    localStorage.setItem(AREA_KEY, area);
  } catch {
    /* navigation privée ou quota */
  }
}

/** Indique si l'interface rouverte doit reprendre l'admin plutôt que l'accueil. */
export function lastAreaWasAdmin(): boolean {
  try {
    return localStorage.getItem(AREA_KEY) === "admin";
  } catch {
    return false;
  }
}
