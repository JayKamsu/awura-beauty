/** Types métier diagnostic Awura (online + RDV physique). */

/** Canal de réalisation du diagnostic. */
export type DiagnosticChannel = "online" | "physical";

/** Canal ciblé par une question (online, pré-RDV présentiel, ou les deux). */
export type DiagnosticQuestionChannel = "online" | "physical_pre" | "both";

/** Langue de saisie/restitution du diagnostic. */
export type DiagnosticLocale = "fr" | "en" | "es";

/** Réponses flexibles : question_key → value_key */
export type DiagnosticAnswerMap = Record<string, string>;

/** Ancien format 4 étapes (historique compte). */
export type HairTypeAnswer = "4a" | "4b" | "4c" | "3abc" | "locs";
/** Ancien format 4 étapes (historique compte). */
export type ScalpAnswer = "dry" | "oily" | "sensitive" | "balanced" | "flaky";
/** Ancien format 4 étapes (historique compte). */
export type HabitsAnswer =
  | "frequent_wash"
  | "heat_styling"
  | "protective"
  | "minimal"
  | "hard_detangle";
/** Ancien format 4 étapes (historique compte). */
export type GoalAnswer =
  | "hydration"
  | "length"
  | "definition"
  | "repair"
  | "volume";

/** Réponses au diagnostic, soit format flexible actuel, soit ancien format 4 étapes (legacy). */
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

/** Profil capillaire résultant d'un diagnostic (recommandations + contenu éditorial). */
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

/** Étape de routine produit recommandée suite au diagnostic. */
export type DiagnosticRoutineStep = {
  order: number;
  productSlug: string;
  title: string;
  usage: string;
};

/** Diagnostic complété et persisté pour un utilisateur (réponses + profil + routine). */
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

/** Option de réponse à une question de diagnostic (i18n + règles de scoring). */
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

/** Question de diagnostic configurable (admin), avec ses options i18n. */
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

/** Paramètres admin du diagnostic : prix, durée de créneau, lieu présentiel. */
export type DiagnosticSettings = {
  onlinePriceCents: number;
  onlineCompareCents: number;
  physicalPriceCents: number;
  physicalCompareCents: number;
  slotDurationMinutes: number;
  physicalLocationText: string;
  currency: string;
};

/** Règle récurrente de disponibilité hebdomadaire pour les RDV présentiels. */
export type DiagnosticAvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

/** Exception ponctuelle à la disponibilité (créneau ouvert ou bloqué manuellement). */
export type DiagnosticSlotOverride = {
  id: string;
  startsAt: string;
  endsAt: string;
  kind: "open" | "blocked";
  note: string;
};

/** Statut du cycle de vie d'un RDV diagnostic présentiel. */
export type DiagnosticAppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

/** RDV présentiel de diagnostic (créneau réservé, paiement, coordonnées). */
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

/** Créneau horaire disponible pour un RDV présentiel. */
export type DiagnosticSlot = {
  startsAt: string;
  endsAt: string;
};
