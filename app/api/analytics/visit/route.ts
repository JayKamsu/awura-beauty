import { NextResponse } from "next/server";
import { parseSiteVisitInput } from "@/lib/domain/site-visit";
import { insertSiteVisit } from "@/lib/infrastructure/supabase/site-visits";
import {
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/infrastructure/security/http-rate-limit";
import { getSiteUrl } from "@/lib/site";

function countryFromRequest(request: Request): string {
  const raw = (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    ""
  )
    .trim()
    .toUpperCase();
  if (/^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1") return raw;
  return "";
}

function isBot(request: Request): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview/i.test(
    ua,
  );
}

function siteHost(): string {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return "awurabeauty.com";
  }
}

/** Enregistre une visite publique (mesure d’audience première partie). */
export async function POST(request: Request) {
  const limited = rateLimitResponse(request, RATE_LIMITS.analyticsVisit);
  if (limited) return limited;
  if (isBot(request)) return NextResponse.json({ ok: true });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const visit = parseSiteVisitInput(body, siteHost());
  if (!visit) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await insertSiteVisit(visit, countryFromRequest(request));
  return NextResponse.json({ ok: true });
}
