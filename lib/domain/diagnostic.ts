/** Types métier diagnostic Awura (online + RDV physique). */

export type DiagnosticChannel = "online" | "physical";

export type DiagnosticQuestionChannel = "online" | "physical_pre" | "both";

export type DiagnosticLocale = "fr" | "en" | "es";

/** Réponses flexibles : question_key → value_key */
export type DiagnosticAnswerMap = Record<string, string>;

/** Ancien format 4 étapes (historique compte). */
export type HairTypeAnswer = "4a" | "4b" | "4c" | "3abc" | "locs";
export type ScalpAnswer = "dry" | "oily" | "sensitive" | "balanced" | "flaky";
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

export type DiagnosticAnswers =
  | DiagnosticAnswerMap
  | {
      hairType: HairTypeAnswer;
      scalp: ScalpAnswer;
      habits: HabitsAnswer;
      goal: GoalAnswer;
    };

/** Étape de processus (wash day, cadence, gestes) — retour détaillé. */
export type DiagnosticProcessStep = {
  order: number;
  title: string;
  body: string;
};

export type DiagnosticProfile = {
  key: string;
  titleKey: string;
  summaryKey: string;
  /** Titres résolus (admin / DB) — optionnels pour legacy */
  title?: string;
  summary?: string;
  /** Retour détaillé rédigé (admin ou généré online). */
  detailedFeedback?: string;
  /** Analyse cuir chevelu / trichogramme (présentiel). */
  scalpAnalysis?: string;
  /** Processus à suivre (ordre, cadence, gestes). */
  processSteps?: DiagnosticProcessStep[];
  tags: string[];
};

export type DiagnosticRoutineStep = {
  order: number;
  productSlug: string;
  title: string;
  usage: string;
};

export type DiagnosticRecord = {
  id: string;
  user_id: string | null;
  answers: DiagnosticAnswers;
  profile: DiagnosticProfile;
  recommended_product_slugs: string[];
  channel: DiagnosticChannel;
  appointment_id: string | null;
  routine: DiagnosticRoutineStep[];
  created_at: string;
};

export type DiagnosticOption = {
  id: string;
  questionId: string;
  valueKey: string;
  position: number;
  enabled: boolean;
  label: string;
  hint: string;
  labelFr: string;
  labelEn: string;
  labelEs: string;
  hintFr: string;
  hintEn: string;
  hintEs: string;
  scoreRules: Record<string, number>;
};

export type DiagnosticQuestion = {
  id: string;
  questionKey: string;
  channel: DiagnosticQuestionChannel;
  position: number;
  enabled: boolean;
  title: string;
  subtitle: string;
  titleFr: string;
  titleEn: string;
  titleEs: string;
  subtitleFr: string;
  subtitleEn: string;
  subtitleEs: string;
  options: DiagnosticOption[];
};

export type DiagnosticSettings = {
  onlinePriceCents: number;
  onlineCompareCents: number;
  physicalPriceCents: number;
  physicalCompareCents: number;
  slotDurationMinutes: number;
  physicalLocationText: string;
  currency: string;
};

export type DiagnosticAvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

export type DiagnosticSlotOverride = {
  id: string;
  startsAt: string;
  endsAt: string;
  kind: "open" | "blocked";
  note: string;
};

export type DiagnosticAppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export type DiagnosticAppointment = {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string;
  startsAt: string;
  endsAt: string;
  status: DiagnosticAppointmentStatus;
  answers: DiagnosticAnswerMap;
  amountCents: number;
  currency: string;
  stripeSessionId: string | null;
  notes: string;
  createdAt: string;
};

export type DiagnosticSlot = {
  startsAt: string;
  endsAt: string;
};
