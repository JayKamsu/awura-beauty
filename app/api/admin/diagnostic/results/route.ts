import { NextResponse } from "next/server";
import { sendDiagnosticResultToClient } from "@/lib/application/diagnostic/send-result";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import type { DiagnosticChannel } from "@/lib/domain/diagnostic";

/**
 * Admin : crée un résultat diagnostic et le partage au compte client (+ push).
 */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    channel?: DiagnosticChannel;
    appointmentId?: string;
    userId?: string;
    title?: string;
    summary?: string;
    scalpAnalysis?: string;
    detailedFeedback?: string;
    tags?: string[];
    recommendedProductSlugs?: string[];
    notifyClient?: boolean;
    markAppointmentCompleted?: boolean;
    locale?: string;
  };

  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const scalpAnalysis = String(body.scalpAnalysis ?? "").trim();
  const detailedFeedback = String(body.detailedFeedback ?? "").trim();
  const channel = body.channel === "online" ? "online" : "physical";
  const slugs = Array.isArray(body.recommendedProductSlugs)
    ? body.recommendedProductSlugs.map(String).filter(Boolean)
    : [];

  if (!title || !summary) {
    return NextResponse.json(
      { error: "Title and summary required" },
      { status: 400 },
    );
  }

  const result = await sendDiagnosticResultToClient({
    channel,
    appointmentId: body.appointmentId ?? null,
    userId: body.userId ?? null,
    title,
    summary,
    scalpAnalysis: scalpAnalysis || undefined,
    detailedFeedback: detailedFeedback || summary,
    tags: body.tags,
    recommendedProductSlugs: slugs,
    notifyClient: body.notifyClient,
    markAppointmentCompleted: body.markAppointmentCompleted,
    locale: body.locale,
  });

  if (result.error || !result.record) {
    return NextResponse.json(
      { error: result.error ?? "Send failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    diagnostic: result.record,
    linkedToUser: result.linkedToUser,
  });
}
