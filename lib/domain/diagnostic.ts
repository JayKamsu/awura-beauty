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

/** Bloc de contenu riche pour le résultat rédigé par l'admin (lettre personnalisée structurée). */
export type DiagnosticContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "link"; text: string; url: string };

/** Brouillon de bilan diagnostic, persisté jusqu'à l'envoi au client. */
export type DiagnosticResultDraft = {
  appointmentId: string;
  title: string;
  summary: string;
  scalpAnalysis: string;
  detailedFeedback: string;
  content: DiagnosticContentBlock[];
  slugs: string[];
  notifyClient: boolean;
};

function parseContentBlocks(raw: unknown): DiagnosticContentBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: DiagnosticContentBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const block = item as {
      type?: string;
      text?: unknown;
      items?: unknown;
      ordered?: unknown;
      url?: unknown;
    };
    if (
      block.type === "heading" ||
      block.type === "subheading" ||
      block.type === "paragraph"
    ) {
      blocks.push({ type: block.type, text: String(block.text ?? "") });
    } else if (block.type === "list") {
      blocks.push({
        type: "list",
        items: Array.isArray(block.items) ? block.items.map(String) : [],
        ordered: Boolean(block.ordered),
      });
    } else if (block.type === "link") {
      blocks.push({
        type: "link",
        text: String(block.text ?? ""),
        url: String(block.url ?? ""),
      });
    }
  }
  return blocks;
}

/** Normalise un JSON inconnu en brouillon de bilan, ou `null` s'il est invalide. */
export function parseDiagnosticResultDraft(
  raw: unknown,
): DiagnosticResultDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    appointmentId: String(row.appointmentId ?? ""),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    scalpAnalysis: String(row.scalpAnalysis ?? ""),
    detailedFeedback: String(row.detailedFeedback ?? ""),
    content: parseContentBlocks(row.content),
    slugs: Array.isArray(row.slugs) ? row.slugs.map(String) : [],
    notifyClient: row.notifyClient !== false,
  };
}

/** Indique si le brouillon n'a encore aucun contenu rédigé. */
export function isDiagnosticResultDraftEmpty(
  draft: DiagnosticResultDraft,
): boolean {
  return (
    !draft.title.trim() &&
    !draft.summary.trim() &&
    !draft.scalpAnalysis.trim() &&
    !draft.detailedFeedback.trim() &&
    draft.content.length === 0 &&
    draft.slugs.length === 0
  );
}

/** Profil capillaire résultant d'un diagnostic (recommandations + contenu éditorial). */
export type DiagnosticProfile = {
  key: string;
  titleKey: string;
  summaryKey: string;
  /** Titres résolus (admin / DB) — optionnels pour legacy */
  title?: string;
  summary?: string;
  /** Retour détaillé rédigé (admin ou généré online) — texte brut, conservé pour compatibilité/notifs. */
  detailedFeedback?: string;
  /** Contenu riche structuré du résultat (sections, listes, liens) rédigé par l'admin. */
  content?: DiagnosticContentBlock[];
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
  /** Notes libres ajoutées par le client en fin de questionnaire. */
  notes?: string;
  /** Photos jointes (face, profils, arrière, pointes) — chemins de stockage privé. */
  photos?: DiagnosticPhoto[];
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
  /** Image illustrative optionnelle (ex : texture 4A/4B/4C) — URL externe. */
  imageUrl?: string;
  scoreRules: Record<string, number>;
};

/** Angle de prise de vue pour les photos jointes à un diagnostic. */
export type DiagnosticPhotoAngle =
  | "face"
  | "profil_gauche"
  | "profil_droit"
  | "arriere"
  | "pointes";

/** Photo jointe à un diagnostic : angle + chemin de stockage privé. */
export type DiagnosticPhoto = {
  angle: DiagnosticPhotoAngle;
  path: string;
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
  /** Autorise une réponse "Je ne sais pas" en plus des options listées. */
  allowUnknown?: boolean;
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

/** RDV de diagnostic (créneau réservé, paiement, coordonnées) — présentiel ou visio en ligne. */
export type DiagnosticAppointment = {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string;
  startsAt: string;
  endsAt: string;
  status: DiagnosticAppointmentStatus;
  channel: DiagnosticChannel;
  answers: DiagnosticAnswerMap;
  amountCents: number;
  currency: string;
  stripeSessionId: string | null;
  notes: string;
  /** Brouillon de bilan à envoyer plus tard (null = aucun). */
  resultDraft: DiagnosticResultDraft | null;
  /** Photos jointes (face, profils, arrière, pointes) — chemins de stockage privé. */
  photos?: DiagnosticPhoto[];
  /** Nombre de fois où le RDV a été replanifié (client ou admin). */
  rescheduledCount?: number;
  createdAt: string;
};

/** Créneau horaire disponible pour un RDV présentiel. */
export type DiagnosticSlot = {
  startsAt: string;
  endsAt: string;
};
