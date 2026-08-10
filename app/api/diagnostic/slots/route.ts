import { NextResponse } from "next/server";
import { listAvailableDiagnosticSlots } from "@/lib/application/diagnostic/slots";
import { getDiagnosticSettings } from "@/lib/infrastructure/supabase/diagnostic-admin";

/** Liste les créneaux disponibles pour le diagnostic capillaire présentiel (fenêtre 21 jours par défaut). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const now = new Date();
  const fromIso = from || now.toISOString();
  const defaultTo = new Date(now);
  defaultTo.setDate(defaultTo.getDate() + 21);
  const toIso = to || defaultTo.toISOString();

  const [slots, settings] = await Promise.all([
    listAvailableDiagnosticSlots(fromIso, toIso),
    getDiagnosticSettings(),
  ]);

  return NextResponse.json({ slots, settings });
}
