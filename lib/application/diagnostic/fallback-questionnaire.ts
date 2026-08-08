import type {
  DiagnosticLocale,
  DiagnosticOption,
  DiagnosticQuestion,
  DiagnosticQuestionChannel,
} from "@/lib/domain/diagnostic";

/** Fallback si la DB n’a pas encore de questions seedées. */
export function getFallbackQuestionnaire(
  channel: "online" | "physical_pre",
  locale: DiagnosticLocale = "fr",
): DiagnosticQuestion[] {
  const all = FALLBACK_QUESTIONS.filter(
    (q) => q.channel === channel || q.channel === "both",
  );
  return all.map((q) => localizeQuestion(q, locale));
}

type RawQuestion = Omit<DiagnosticQuestion, "title" | "subtitle" | "options"> & {
  options: Omit<DiagnosticOption, "label" | "hint">[];
};

function localizeQuestion(
  q: RawQuestion,
  locale: DiagnosticLocale,
): DiagnosticQuestion {
  const title =
    locale === "en" ? q.titleEn : locale === "es" ? q.titleEs : q.titleFr;
  const subtitle =
    locale === "en"
      ? q.subtitleEn
      : locale === "es"
        ? q.subtitleEs
        : q.subtitleFr;
  return {
    ...q,
    title,
    subtitle,
    options: q.options.map((o) => ({
      ...o,
      label: locale === "en" ? o.labelEn : locale === "es" ? o.labelEs : o.labelFr,
      hint: locale === "en" ? o.hintEn : locale === "es" ? o.hintEs : o.hintFr,
    })),
  };
}

const FALLBACK_QUESTIONS: RawQuestion[] = [
  {
    id: "fb-texture",
    questionKey: "texture",
    channel: "online" as DiagnosticQuestionChannel,
    position: 0,
    enabled: true,
    titleFr: "Quelle est la texture de ta couronne ?",
    titleEn: "What is your crown texture?",
    titleEs: "¿Cuál es la textura de tu corona?",
    subtitleFr: "Choisis la description la plus proche de tes cheveux au naturel.",
    subtitleEn: "Pick the description closest to your natural hair.",
    subtitleEs: "Elige la descripción más cercana a tu cabello natural.",
    options: [
      opt("fb-texture", "4a", 0, "4A — Bouclés serrés", "4A — Tight curls", "4A — Rizos apretados", "Ressorts définis", "Defined springs", "Muelles definidos", { "demelant-nourrissant": 1, "beurre-capillaire": 1 }),
      opt("fb-texture", "4b", 1, "4B — Crépus", "4B — Coily", "4B — Crespo", "Angles en Z", "Z-pattern", "Patrón en Z", { "beurre-capillaire": 2, "masque-capillaire": 1 }),
      opt("fb-texture", "4c", 2, "4C — Très crépus", "4C — Very coily", "4C — Muy crespo", "Shrinkage fort", "Strong shrinkage", "Encogimiento fuerte", { "beurre-capillaire": 3, "demelant-nourrissant": 2 }),
      opt("fb-texture", "3abc", 3, "3A–3C — Bouclés", "3A–3C — Curly", "3A–3C — Rizado", "Boucles souples", "Soft curls", "Rizos suaves", { "demelant-nourrissant": 2 }),
      opt("fb-texture", "locs", 4, "Locs / Tresses", "Locs / Braids", "Locs / Trenzas", "Styles protégés", "Protective styles", "Estilos protectores", { "lotion-repousse": 3, "savon-solide": 2 }),
    ],
  },
  {
    id: "fb-porosity",
    questionKey: "porosity",
    channel: "online",
    position: 1,
    enabled: true,
    titleFr: "Comment ton cheveu absorbe-t-il l’eau et les soins ?",
    titleEn: "How does your hair absorb water and products?",
    titleEs: "¿Cómo absorbe tu cabello el agua y los productos?",
    subtitleFr: "La porosité guide l’hydratation et le scellement.",
    subtitleEn: "Porosity guides hydration and sealing.",
    subtitleEs: "La porosidad guía la hidratación y el sellado.",
    options: [
      opt("fb-porosity", "low", 0, "Faible", "Low", "Baja", "L’eau perle", "Water beads", "El agua perla", { "demelant-nourrissant": 3, "masque-capillaire": 2 }),
      opt("fb-porosity", "medium", 1, "Moyenne", "Medium", "Media", "Équilibre", "Balanced", "Equilibrio", { "masque-capillaire": 2, "beurre-capillaire": 2 }),
      opt("fb-porosity", "high", 2, "Élevée", "High", "Alta", "Absorbe vite", "Absorbs fast", "Absorbe rápido", { "beurre-capillaire": 4, "masque-capillaire": 3 }),
    ],
  },
  {
    id: "fb-scalp",
    questionKey: "scalp",
    channel: "online",
    position: 2,
    enabled: true,
    titleFr: "Comment va ton cuir chevelu ?",
    titleEn: "How is your scalp?",
    titleEs: "¿Cómo está tu cuero cabelludo?",
    subtitleFr: "Un cuir chevelu confortable, c’est la base de la pousse.",
    subtitleEn: "A comfortable scalp is the foundation of growth.",
    subtitleEs: "Un cuero cabelludo cómodo es la base del crecimiento.",
    options: [
      opt("fb-scalp", "dry", 0, "Sec / tiraillements", "Dry / tight", "Seco / tirante", "", "", "", { "lotion-repousse": 3, "beurre-capillaire": 2 }),
      opt("fb-scalp", "oily", 1, "Gras", "Oily", "Graso", "", "", "", { "savon-solide": 4 }),
      opt("fb-scalp", "sensitive", 2, "Sensible", "Sensitive", "Sensible", "", "", "", { "savon-solide": 2, "lotion-repousse": 2 }),
      opt("fb-scalp", "flaky", 3, "Pellicules", "Flaky", "Con caspa", "", "", "", { "savon-solide": 3, "lotion-repousse": 3 }),
      opt("fb-scalp", "balanced", 4, "Équilibré", "Balanced", "Equilibrado", "", "", "", { "demelant-nourrissant": 1 }),
    ],
  },
  {
    id: "fb-detangle",
    questionKey: "detangle",
    channel: "online",
    position: 3,
    enabled: true,
    titleFr: "Comment se passe le démêlage ?",
    titleEn: "How is detangling?",
    titleEs: "¿Cómo es el desenredo?",
    subtitleFr: "On adapte le démêlant et le temps de pose.",
    subtitleEn: "We adapt conditioner and leave-in time.",
    subtitleEs: "Adaptamos el acondicionador y el tiempo.",
    options: [
      opt("fb-detangle", "easy", 0, "Facile", "Easy", "Fácil", "", "", "", { "demelant-nourrissant": 1 }),
      opt("fb-detangle", "moderate", 1, "Moyen", "Moderate", "Moderado", "", "", "", { "demelant-nourrissant": 3 }),
      opt("fb-detangle", "hard", 2, "Difficile / casse", "Hard / breakage", "Difícil / rotura", "", "", "", { "demelant-nourrissant": 5, "masque-capillaire": 2 }),
    ],
  },
  {
    id: "fb-goal",
    questionKey: "goal",
    channel: "online",
    position: 4,
    enabled: true,
    titleFr: "Quel est ton objectif principal ?",
    titleEn: "What is your main goal?",
    titleEs: "¿Cuál es tu objetivo principal?",
    subtitleFr: "On priorise une routine claire autour de ton but.",
    subtitleEn: "We prioritize a clear routine around your goal.",
    subtitleEs: "Priorizamos una rutina clara según tu meta.",
    options: [
      opt("fb-goal", "hydration", 0, "Hydratation", "Hydration", "Hidratación", "", "", "", { "beurre-capillaire": 5, "masque-capillaire": 3 }),
      opt("fb-goal", "length", 1, "Pousse / longueur", "Growth / length", "Crecimiento", "", "", "", { "lotion-repousse": 5, "masque-capillaire": 2 }),
      opt("fb-goal", "definition", 2, "Définition", "Definition", "Definición", "", "", "", { "demelant-nourrissant": 4, "beurre-capillaire": 3 }),
      opt("fb-goal", "repair", 3, "Réparation", "Repair", "Reparación", "", "", "", { "masque-capillaire": 5, "beurre-capillaire": 3 }),
      opt("fb-goal", "volume", 4, "Volume", "Volume", "Volumen", "", "", "", { "savon-solide": 2, "lotion-repousse": 3 }),
    ],
  },
  {
    id: "fb-routine",
    questionKey: "routine",
    channel: "online",
    position: 5,
    enabled: true,
    titleFr: "Quelle est ta routine actuelle ?",
    titleEn: "What is your current routine?",
    titleEs: "¿Cuál es tu rutina actual?",
    subtitleFr: "On complète ce qui manque dans ta gamme.",
    subtitleEn: "We fill the gaps in your regimen.",
    subtitleEs: "Completamos lo que falta en tu rutina.",
    options: [
      opt("fb-routine", "minimal", 0, "Minimale", "Minimal", "Mínima", "", "", "", { "savon-solide": 2, "demelant-nourrissant": 2, "beurre-capillaire": 2 }),
      opt("fb-routine", "wash_day", 1, "Wash day complet", "Full wash day", "Día de lavado", "", "", "", { "masque-capillaire": 2 }),
      opt("fb-routine", "protective", 2, "Styles protégés", "Protective styles", "Estilos protectores", "", "", "", { "lotion-repousse": 3, "beurre-capillaire": 2 }),
      opt("fb-routine", "heat", 3, "Chaleur / brushings", "Heat styling", "Calor", "", "", "", { "masque-capillaire": 4, "beurre-capillaire": 2 }),
    ],
  },
  {
    id: "fb-constraint",
    questionKey: "constraint",
    channel: "online",
    position: 6,
    enabled: true,
    titleFr: "Quelle contrainte veux-tu respecter ?",
    titleEn: "Which constraint should we respect?",
    titleEs: "¿Qué restricción debemos respetar?",
    subtitleFr: "Temps, simplicité ou intensité des soins.",
    subtitleEn: "Time, simplicity, or care intensity.",
    subtitleEs: "Tiempo, simplicidad o intensidad.",
    options: [
      opt("fb-constraint", "fast", 0, "Routine rapide", "Quick routine", "Rutina rápida", "", "", "", { "savon-solide": 1, "beurre-capillaire": 2 }),
      opt("fb-constraint", "complete", 1, "Routine complète Awura", "Full Awura routine", "Rutina Awura completa", "", "", "", { "savon-solide": 2, "demelant-nourrissant": 2, "masque-capillaire": 2, "lotion-repousse": 2, "beurre-capillaire": 2 }),
      opt("fb-constraint", "growth_focus", 2, "Focus pousse", "Growth focus", "Foco crecimiento", "", "", "", { "lotion-repousse": 4, "beurre-capillaire": 2 }),
    ],
  },
  {
    id: "fb-phys-texture",
    questionKey: "phys_texture",
    channel: "physical_pre",
    position: 0,
    enabled: true,
    titleFr: "Texture principale",
    titleEn: "Main texture",
    titleEs: "Textura principal",
    subtitleFr: "Pour préparer ton rendez-vous en salon.",
    subtitleEn: "To prepare your in-person appointment.",
    subtitleEs: "Para preparar tu cita en salón.",
    options: [
      opt("fb-phys-texture", "4a", 0, "4A", "4A", "4A", "", "", "", {}),
      opt("fb-phys-texture", "4b", 1, "4B", "4B", "4B", "", "", "", {}),
      opt("fb-phys-texture", "4c", 2, "4C", "4C", "4C", "", "", "", {}),
      opt("fb-phys-texture", "3abc", 3, "3A–3C", "3A–3C", "3A–3C", "", "", "", {}),
      opt("fb-phys-texture", "locs", 4, "Locs / Tresses", "Locs / Braids", "Locs / Trenzas", "", "", "", {}),
    ],
  },
  {
    id: "fb-phys-goal",
    questionKey: "phys_goal",
    channel: "physical_pre",
    position: 1,
    enabled: true,
    titleFr: "Objectif du rendez-vous",
    titleEn: "Appointment goal",
    titleEs: "Objetivo de la cita",
    subtitleFr: "Ce que tu veux approfondir en physique.",
    subtitleEn: "What you want to go deeper on in person.",
    subtitleEs: "Lo que quieres profundizar en persona.",
    options: [
      opt("fb-phys-goal", "hydration", 0, "Hydratation", "Hydration", "Hidratación", "", "", "", {}),
      opt("fb-phys-goal", "length", 1, "Pousse", "Growth", "Crecimiento", "", "", "", {}),
      opt("fb-phys-goal", "repair", 2, "Réparation", "Repair", "Reparación", "", "", "", {}),
      opt("fb-phys-goal", "routine", 3, "Routine complète", "Full routine", "Rutina completa", "", "", "", {}),
    ],
  },
  {
    id: "fb-phys-concern",
    questionKey: "phys_concern",
    channel: "physical_pre",
    position: 2,
    enabled: true,
    titleFr: "Souci principal",
    titleEn: "Main concern",
    titleEs: "Preocupación principal",
    subtitleFr: "Ce que tu ressens le plus au quotidien.",
    subtitleEn: "What you feel most day to day.",
    subtitleEs: "Lo que más sientes a diario.",
    options: [
      opt("fb-phys-concern", "dryness", 0, "Sécheresse", "Dryness", "Sequedad", "", "", "", {}),
      opt("fb-phys-concern", "breakage", 1, "Casse", "Breakage", "Rotura", "", "", "", {}),
      opt("fb-phys-concern", "scalp", 2, "Cuir chevelu", "Scalp", "Cuero cabelludo", "", "", "", {}),
      opt("fb-phys-concern", "growth", 3, "Pousse lente", "Slow growth", "Crecimiento lento", "", "", "", {}),
    ],
  },
  {
    id: "fb-phys-pref",
    questionKey: "phys_pref",
    channel: "physical_pre",
    position: 3,
    enabled: true,
    titleFr: "Moment préféré",
    titleEn: "Preferred time of day",
    titleEs: "Momento preferido",
    subtitleFr: "On priorise les créneaux proches de ta préférence.",
    subtitleEn: "We prioritize slots near your preference.",
    subtitleEs: "Priorizamos franjas cercanas a tu preferencia.",
    options: [
      opt("fb-phys-pref", "morning", 0, "Matin", "Morning", "Mañana", "", "", "", {}),
      opt("fb-phys-pref", "afternoon", 1, "Après-midi", "Afternoon", "Tarde", "", "", "", {}),
      opt("fb-phys-pref", "flexible", 2, "Flexible", "Flexible", "Flexible", "", "", "", {}),
    ],
  },
];

function opt(
  questionId: string,
  valueKey: string,
  position: number,
  labelFr: string,
  labelEn: string,
  labelEs: string,
  hintFr: string,
  hintEn: string,
  hintEs: string,
  scoreRules: Record<string, number>,
): Omit<DiagnosticOption, "label" | "hint"> {
  return {
    id: `${questionId}-${valueKey}`,
    questionId,
    valueKey,
    position,
    enabled: true,
    labelFr,
    labelEn,
    labelEs,
    hintFr,
    hintEn,
    hintEs,
    scoreRules,
  };
}
