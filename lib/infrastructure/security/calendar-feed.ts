import { createHash, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "@/lib/site";

/** Jeton stable du flux iCal, dérivé du secret dédié ou de la clé service Supabase. */
export function calendarFeedToken(): string | null {
  const explicit = process.env.CALENDAR_FEED_SECRET?.trim();
  if (explicit) return explicit;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createHash("sha256")
    .update(`awura-calendar-feed:${key}`)
    .digest("hex")
    .slice(0, 40);
}

/** URL HTTPS à coller dans Google Agenda → Autres agendas → À partir de l'URL. */
export function calendarFeedUrl(): string | null {
  const token = calendarFeedToken();
  if (!token) return null;
  return `${absoluteUrl("/api/diagnostic/calendar")}?token=${encodeURIComponent(token)}`;
}

/** Compare le jeton d'URL au jeton attendu sans fuite de durée. */
export function calendarFeedAuthorized(token: string | null): boolean {
  const expected = calendarFeedToken();
  if (!expected || !token) return false;
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
