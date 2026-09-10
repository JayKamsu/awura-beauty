import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { SiteVisitInput } from "@/lib/domain/site-visit";

/** Ligne brute lue pour agréger la fréquentation (30 jours). */
type VisitRow = {
  visitor_id: string;
  session_id: string;
  source: string;
  country: string;
  visited_at: string;
};

/** Source de trafic agrégée (visiteurs distincts). */
export type AdminVisitSource = {
  key: string;
  visitors: number;
};

/** Pays de provenance agrégé (visiteurs distincts). */
export type AdminVisitCountry = {
  country: string;
  visitors: number;
};

/** KPIs de fréquentation pour le tableau de bord admin. */
export type AdminVisitStats = {
  visitorsToday: number;
  visitorsYesterday: number;
  visitors7d: number;
  visitsToday: number;
  sources30d: AdminVisitSource[];
  countries30d: AdminVisitCountry[];
};

const EMPTY_STATS: AdminVisitStats = {
  visitorsToday: 0,
  visitorsYesterday: 0,
  visitors7d: 0,
  visitsToday: 0,
  sources30d: [],
  countries30d: [],
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(n: number) {
  const date = startOfToday();
  date.setDate(date.getDate() - n);
  return date;
}

function distinctCount(rows: VisitRow[], predicate: (row: VisitRow) => boolean) {
  const ids = new Set<string>();
  for (const row of rows) {
    if (predicate(row)) ids.add(row.visitor_id);
  }
  return ids.size;
}

function topByVisitor(
  rows: VisitRow[],
  keyOf: (row: VisitRow) => string,
  limit: number,
): Array<{ key: string; visitors: number }> {
  const sets = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = keyOf(row);
    const set = sets.get(key) ?? new Set<string>();
    set.add(row.visitor_id);
    sets.set(key, set);
  }
  return [...sets.entries()]
    .map(([key, set]) => ({ key, visitors: set.size }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);
}

/** Enregistre une visite de session (idempotent sur session_id). */
export async function insertSiteVisit(
  visit: SiteVisitInput,
  country: string,
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("site_visits").upsert(
    {
      visitor_id: visit.visitorId,
      session_id: visit.sessionId,
      path: visit.path,
      source: visit.source,
      country,
      visited_at: new Date().toISOString(),
    },
    { onConflict: "session_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[analytics] insert visit", error.message);
  }

  if (Math.random() < 0.02) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 13);
    await supabase.from("site_visits").delete().lt("visited_at", cutoff.toISOString());
  }
}

/** Agrège les visites des 30 derniers jours pour le dashboard admin. */
export async function getSiteVisitStats(): Promise<AdminVisitStats> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return EMPTY_STATS;

  const start30d = daysAgo(30).toISOString();
  const { data, error } = await supabase
    .from("site_visits")
    .select("visitor_id, session_id, source, country, visited_at")
    .gte("visited_at", start30d)
    .limit(20000);

  if (error || !data) {
    if (error) console.error("[analytics] list visits", error.message);
    return EMPTY_STATS;
  }

  const rows = data as VisitRow[];
  const today = startOfToday();
  const yesterday = daysAgo(1);
  const start7d = daysAgo(7);

  const todays = rows.filter((row) => new Date(row.visited_at) >= today);
  const sessionsToday = new Set(todays.map((row) => row.session_id));

  return {
    visitorsToday: distinctCount(rows, (row) => new Date(row.visited_at) >= today),
    visitorsYesterday: distinctCount(rows, (row) => {
      const at = new Date(row.visited_at);
      return at >= yesterday && at < today;
    }),
    visitors7d: distinctCount(rows, (row) => new Date(row.visited_at) >= start7d),
    visitsToday: sessionsToday.size,
    sources30d: topByVisitor(rows, (row) => row.source || "direct", 8).map((item) => ({
      key: item.key,
      visitors: item.visitors,
    })),
    countries30d: topByVisitor(rows, (row) => row.country, 8).map((item) => ({
      country: item.key,
      visitors: item.visitors,
    })),
  };
}
