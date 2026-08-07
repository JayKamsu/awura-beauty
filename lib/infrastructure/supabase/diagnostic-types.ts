export type HairTypeAnswer =
  | "4a"
  | "4b"
  | "4c"
  | "3abc"
  | "locs";

export type ScalpAnswer =
  | "dry"
  | "oily"
  | "sensitive"
  | "balanced"
  | "flaky";

export type HabitsAnswer =
  | "frequent_wash"
  | "heat_styling"
  | "protective"
  | "minimal"
  | "hard_detangle";

export type GoalAnswer =
  | "hydration"
  | "length"
  | "definition"
  | "repair"
  | "volume";

export type DiagnosticAnswers = {
  hairType: HairTypeAnswer;
  scalp: ScalpAnswer;
  habits: HabitsAnswer;
  goal: GoalAnswer;
};

export type DiagnosticProfile = {
  key: string;
  titleKey: string;
  summaryKey: string;
  tags: string[];
};

export type DiagnosticRecord = {
  id: string;
  user_id: string | null;
  answers: DiagnosticAnswers;
  profile: DiagnosticProfile;
  recommended_product_slugs: string[];
  created_at: string;
};
