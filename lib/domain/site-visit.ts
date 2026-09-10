const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KNOWN_HOSTS: Array<{ match: (host: string) => boolean; source: string }> = [
  { match: (h) => h.includes("google."), source: "google" },
  { match: (h) => h.includes("instagram") || h === "l.instagram.com", source: "instagram" },
  { match: (h) => h.includes("facebook") || h.includes("fb."), source: "facebook" },
  { match: (h) => h.includes("tiktok"), source: "tiktok" },
  { match: (h) => h.includes("pinterest"), source: "pinterest" },
  { match: (h) => h.includes("bing."), source: "bing" },
  { match: (h) => h.includes("yahoo."), source: "yahoo" },
  { match: (h) => h.includes("youtube") || h === "youtu.be", source: "youtube" },
  { match: (h) => h === "t.co" || h.includes("twitter") || h === "x.com", source: "x" },
  { match: (h) => h.includes("linkedin"), source: "linkedin" },
];

/** Visite de session enregistrée pour la mesure d’audience interne. */
export type SiteVisitInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  source: string;
};

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Classe la provenance d’une visite (UTM, référent connu, ou accès direct).
 * N’enregistre pas l’URL brute.
 */
export function classifyVisitSource(
  referrer: string,
  utmSource: string,
  siteHost: string,
): string {
  const utm = clip(utmSource, 40).toLowerCase();
  if (utm) return utm.replace(/[^a-z0-9._-]/g, "") || "direct";

  const host = hostnameOf(referrer);
  if (!host) return "direct";

  const own = siteHost.replace(/^www\./, "").toLowerCase();
  if (host === own || host.endsWith(`.${own}`) || host === "localhost") {
    return "direct";
  }

  for (const rule of KNOWN_HOSTS) {
    if (rule.match(host)) return rule.source;
  }

  return host.slice(0, 60);
}

/**
 * Valide le ping de mesure d’audience envoyé par le navigateur.
 * Retourne null si l’identifiant ou le chemin est invalide.
 */
export function parseSiteVisitInput(
  body: unknown,
  siteHost: string,
): SiteVisitInput | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const visitorId = clip(raw.visitorId, 36);
  const sessionId = clip(raw.sessionId, 36);
  if (!UUID_RE.test(visitorId) || !UUID_RE.test(sessionId)) return null;

  let path = clip(raw.path, 180);
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/auth")) {
    return null;
  }

  const source = classifyVisitSource(
    clip(raw.referrer, 300),
    clip(raw.utmSource, 40),
    siteHost,
  );

  return { visitorId, sessionId, path, source };
}
