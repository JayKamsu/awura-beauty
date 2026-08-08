/** @deprecated Importer depuis `@/lib/application/diagnostic/recommend` */
export {
  buildProfileFromAnswers as buildDiagnosticResultProfile,
  buildRoutineSteps,
  normalizeAnswerMap,
  scoreFromQuestions,
  topSlugsFromScores,
} from "@/lib/application/diagnostic/recommend";

import {
  buildProfileFromAnswers,
  normalizeAnswerMap,
  scoreFromQuestions,
  topSlugsFromScores,
} from "@/lib/application/diagnostic/recommend";
import { getFallbackQuestionnaire } from "@/lib/application/diagnostic/fallback-questionnaire";
import type {
  DiagnosticAnswers,
  DiagnosticProfile,
} from "@/lib/domain/diagnostic";

/** Compat ancienne API wizard hardcodée. */
export function buildDiagnosticResult(answers: DiagnosticAnswers): {
  profile: DiagnosticProfile;
  recommendedProductSlugs: string[];
} {
  const map = normalizeAnswerMap(answers as Record<string, unknown>);
  const questions = getFallbackQuestionnaire("online", "fr");
  const scores = scoreFromQuestions(questions, map);
  return {
    profile: buildProfileFromAnswers(map),
    recommendedProductSlugs: topSlugsFromScores(scores, 3),
  };
}

export const DIAGNOSTIC_STEPS = [
  "hairType",
  "scalp",
  "habits",
  "goal",
] as const;
