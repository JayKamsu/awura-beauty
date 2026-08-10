import { NextResponse } from "next/server";
import {
  getDiagnosticSettings,
  listDiagnosticQuestions,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticLocale } from "@/lib/domain/diagnostic";

/** Retourne les questions du diagnostic capillaire (canal + locale) et les réglages associés. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel =
    url.searchParams.get("channel") === "physical_pre"
      ? "physical_pre"
      : "online";
  const lang = (url.searchParams.get("locale") || "fr").slice(0, 2);
  const locale: DiagnosticLocale =
    lang === "en" ? "en" : lang === "es" ? "es" : "fr";

  const [questions, settings] = await Promise.all([
    listDiagnosticQuestions({ channel, locale }),
    getDiagnosticSettings(),
  ]);

  return NextResponse.json({ questions, settings });
}
