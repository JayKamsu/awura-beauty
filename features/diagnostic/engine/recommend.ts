import type {
  DiagnosticAnswers,
  DiagnosticProfile,
  GoalAnswer,
  HabitsAnswer,
  HairTypeAnswer,
  ScalpAnswer,
} from "@/lib/infrastructure/supabase/diagnostic-types";

export const DIAGNOSTIC_STEPS = [
  "hairType",
  "scalp",
  "habits",
  "goal",
] as const;

export type DiagnosticStepId = (typeof DIAGNOSTIC_STEPS)[number];

export const HAIR_TYPE_OPTIONS: HairTypeAnswer[] = [
  "4a",
  "4b",
  "4c",
  "3abc",
  "locs",
];

export const SCALP_OPTIONS: ScalpAnswer[] = [
  "dry",
  "oily",
  "sensitive",
  "balanced",
  "flaky",
];

export const HABITS_OPTIONS: HabitsAnswer[] = [
  "frequent_wash",
  "heat_styling",
  "protective",
  "minimal",
  "hard_detangle",
];

export const GOAL_OPTIONS: GoalAnswer[] = [
  "hydration",
  "length",
  "definition",
  "repair",
  "volume",
];

export function getOptionsForStep(step: DiagnosticStepId) {
  switch (step) {
    case "hairType":
      return HAIR_TYPE_OPTIONS;
    case "scalp":
      return SCALP_OPTIONS;
    case "habits":
      return HABITS_OPTIONS;
    case "goal":
      return GOAL_OPTIONS;
  }
}

type ScoreMap = Record<string, number>;

function addScore(scores: ScoreMap, slug: string, points: number) {
  scores[slug] = (scores[slug] ?? 0) + points;
}

/**
 * Moteur de recommandation : score les produits du catalogue
 * selon les réponses, puis retourne les 3 meilleurs slugs.
 */
export function buildDiagnosticResult(answers: DiagnosticAnswers): {
  profile: DiagnosticProfile;
  recommendedProductSlugs: string[];
} {
  const scores: ScoreMap = {
    "beurre-capillaire": 0,
    "demelant-nourrissant": 0,
    "masque-capillaire": 0,
    "lotion-repousse": 0,
    "savon-solide": 0,
  };

  // Objectif (poids fort)
  switch (answers.goal) {
    case "hydration":
      addScore(scores, "beurre-capillaire", 5);
      addScore(scores, "masque-capillaire", 3);
      break;
    case "length":
      addScore(scores, "lotion-repousse", 5);
      addScore(scores, "masque-capillaire", 2);
      break;
    case "definition":
      addScore(scores, "demelant-nourrissant", 4);
      addScore(scores, "beurre-capillaire", 3);
      break;
    case "repair":
      addScore(scores, "masque-capillaire", 5);
      addScore(scores, "beurre-capillaire", 3);
      break;
    case "volume":
      addScore(scores, "lotion-repousse", 3);
      addScore(scores, "savon-solide", 2);
      addScore(scores, "demelant-nourrissant", 2);
      break;
  }

  // Cuir chevelu
  switch (answers.scalp) {
    case "dry":
      addScore(scores, "beurre-capillaire", 3);
      addScore(scores, "lotion-repousse", 2);
      break;
    case "oily":
      addScore(scores, "savon-solide", 4);
      break;
    case "sensitive":
      addScore(scores, "savon-solide", 2);
      addScore(scores, "lotion-repousse", 2);
      break;
    case "flaky":
      addScore(scores, "savon-solide", 3);
      addScore(scores, "lotion-repousse", 3);
      break;
    case "balanced":
      addScore(scores, "demelant-nourrissant", 1);
      break;
  }

  // Habitudes
  switch (answers.habits) {
    case "hard_detangle":
      addScore(scores, "demelant-nourrissant", 5);
      break;
    case "heat_styling":
      addScore(scores, "masque-capillaire", 4);
      addScore(scores, "beurre-capillaire", 2);
      break;
    case "frequent_wash":
      addScore(scores, "savon-solide", 3);
      addScore(scores, "beurre-capillaire", 2);
      break;
    case "protective":
      addScore(scores, "lotion-repousse", 3);
      addScore(scores, "beurre-capillaire", 2);
      break;
    case "minimal":
      addScore(scores, "demelant-nourrissant", 2);
      addScore(scores, "lotion-repousse", 1);
      break;
  }

  // Type de cheveux (ajustements légers)
  switch (answers.hairType) {
    case "4c":
      addScore(scores, "beurre-capillaire", 2);
      addScore(scores, "demelant-nourrissant", 2);
      break;
    case "4b":
      addScore(scores, "beurre-capillaire", 1);
      addScore(scores, "masque-capillaire", 1);
      break;
    case "4a":
      addScore(scores, "demelant-nourrissant", 1);
      break;
    case "3abc":
      addScore(scores, "demelant-nourrissant", 2);
      break;
    case "locs":
      addScore(scores, "lotion-repousse", 3);
      addScore(scores, "savon-solide", 2);
      break;
  }

  const recommendedProductSlugs = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug);

  const profile = buildProfile(answers);

  return { profile, recommendedProductSlugs };
}

function buildProfile(answers: DiagnosticAnswers): DiagnosticProfile {
  const key = `${answers.hairType}-${answers.goal}`;

  if (answers.goal === "hydration" || answers.scalp === "dry") {
    return {
      key,
      titleKey: "diagnostic.profiles.hydration.title",
      summaryKey: "diagnostic.profiles.hydration.summary",
      tags: ["hydratation", answers.hairType, answers.scalp],
    };
  }

  if (answers.goal === "length" || answers.habits === "protective") {
    return {
      key,
      titleKey: "diagnostic.profiles.growth.title",
      summaryKey: "diagnostic.profiles.growth.summary",
      tags: ["pousse", answers.hairType, answers.habits],
    };
  }

  if (answers.goal === "repair" || answers.habits === "heat_styling") {
    return {
      key,
      titleKey: "diagnostic.profiles.repair.title",
      summaryKey: "diagnostic.profiles.repair.summary",
      tags: ["réparation", answers.hairType, answers.habits],
    };
  }

  if (answers.habits === "hard_detangle" || answers.goal === "definition") {
    return {
      key,
      titleKey: "diagnostic.profiles.detangle.title",
      summaryKey: "diagnostic.profiles.detangle.summary",
      tags: ["démêlage", answers.hairType, answers.goal],
    };
  }

  return {
    key,
    titleKey: "diagnostic.profiles.balance.title",
    summaryKey: "diagnostic.profiles.balance.summary",
    tags: ["équilibre", answers.hairType, answers.goal],
  };
}
