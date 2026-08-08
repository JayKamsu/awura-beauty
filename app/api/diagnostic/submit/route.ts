import { NextResponse } from "next/server";
import { notifyOnlineDiagnosticSaved } from "@/lib/application/diagnostic/send-result";
import {
  buildFullAwuraRoutine,
  buildProfileFromAnswers,
  buildRoutineSteps,
  normalizeAnswerMap,
  scoreFromQuestions,
  topSlugsFromScores,
} from "@/lib/application/diagnostic/recommend";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { container } from "@/lib/application/container";
import { listDiagnosticQuestions } from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticLocale } from "@/lib/domain/diagnostic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    answers?: Record<string, unknown>;
    locale?: string;
  };

  const answers = normalizeAnswerMap(body.answers ?? {});
  if (Object.keys(answers).length === 0) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const lang = (body.locale || "fr").slice(0, 2);
  const locale: DiagnosticLocale =
    lang === "en" ? "en" : lang === "es" ? "es" : "fr";

  const questions = await listDiagnosticQuestions({
    channel: "online",
    locale,
  });

  const scores = scoreFromQuestions(questions, answers);
  let recommendedProductSlugs = topSlugsFromScores(scores, 5);
  if (answers.constraint === "complete" || recommendedProductSlugs.length < 3) {
    recommendedProductSlugs = [
      ...new Set([
        ...recommendedProductSlugs,
        ...buildFullAwuraRoutine(locale).map((s) => s.productSlug),
      ]),
    ].slice(0, 5);
  }

  const profile = buildProfileFromAnswers(answers, locale);
  const routine = buildRoutineSteps(recommendedProductSlugs, locale);
  const userId = await userIdFromRequest(request);

  const saved = await container.diagnostics.saveHairDiagnostic({
    answers,
    profile,
    recommendedProductSlugs,
    channel: "online",
    routine,
    userId,
  });

  if (saved.id && userId) {
    await notifyOnlineDiagnosticSaved({
      userId,
      title: "Ton diagnostic en ligne est prêt",
    });
  }

  const products = await container.catalog.getProductsBySlugs(
    recommendedProductSlugs,
  );

  return NextResponse.json({
    profile,
    recommendedProductSlugs,
    routine,
    products,
    diagnosticId: saved.id,
    saved: !saved.error,
    linkedToUser: Boolean(userId),
  });
}
