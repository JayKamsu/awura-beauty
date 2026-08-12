import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { getDiagnosticById } from "@/lib/infrastructure/supabase/diagnostics";
import {
  getReviewForDiagnostic,
  upsertDiagnosticTestimonial,
} from "@/lib/infrastructure/supabase/order-reviews";

/** Récupère le témoignage laissé par le client pour un diagnostic, réservé au propriétaire. */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnosticId = new URL(request.url).searchParams.get("diagnosticId")?.trim();
  if (!diagnosticId) {
    return NextResponse.json({ error: "diagnosticId required" }, { status: 400 });
  }

  const diagnostic = await getDiagnosticById(diagnosticId);
  if (!diagnostic || diagnostic.user_id !== userId) {
    return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });
  }

  const review = await getReviewForDiagnostic(diagnosticId);
  return NextResponse.json({ review });
}

/**
 * Crée ou met à jour le témoignage du client sur un diagnostic reçu.
 * Nécessite qu'un bilan (contenu riche) ait déjà été envoyé pour ce diagnostic.
 */
export async function POST(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    diagnosticId?: string;
    rating?: number;
    comment?: string;
  };

  const diagnosticId = String(body.diagnosticId ?? "").trim();
  const rating = Math.round(Number(body.rating));
  const comment = String(body.comment ?? "").trim().slice(0, 2000);

  if (!diagnosticId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const diagnostic = await getDiagnosticById(diagnosticId);
  if (!diagnostic || diagnostic.user_id !== userId) {
    return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });
  }
  if (!diagnostic.profile.content?.length) {
    return NextResponse.json(
      { error: "Result not available yet" },
      { status: 409 },
    );
  }

  const review = await upsertDiagnosticTestimonial({
    diagnosticId,
    userId,
    rating,
    comment,
  });
  if (!review) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, review });
}
