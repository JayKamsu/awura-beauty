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

/** Images illustratives (texture capillaire) — photos Unsplash (libres de droits), une par catégorie. */
const TEXTURE_IMAGES: Record<string, string> = {
  "4a": "https://images.unsplash.com/photo-1613498382159-0972b7b4c9f1?w=320&q=75&fit=crop&crop=faces",
  "4b": "https://images.unsplash.com/photo-1632765866070-3fadf25d3d5b?w=320&q=75&fit=crop&crop=faces",
  "4c": "https://images.unsplash.com/photo-1565357419076-6acd4a10094e?w=320&q=75&fit=crop&crop=faces",
  "3abc": "https://images.unsplash.com/photo-1568046738123-300caca6d0ca?w=320&q=75&fit=crop&crop=faces",
  locs: "https://images.unsplash.com/photo-1625536658395-2bd89a631e37?w=320&q=75&fit=crop&crop=faces",
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

type OptInput = {
  questionId: string;
  valueKey: string;
  position: number;
  labelFr: string;
  labelEn: string;
  labelEs: string;
  hintFr?: string;
  hintEn?: string;
  hintEs?: string;
  imageUrl?: string;
  scoreRules: Record<string, number>;
};

function opt(input: OptInput): Omit<DiagnosticOption, "label" | "hint"> {
  return {
    id: `${input.questionId}-${input.valueKey}`,
    questionId: input.questionId,
    valueKey: input.valueKey,
    position: input.position,
    enabled: true,
    labelFr: input.labelFr,
    labelEn: input.labelEn,
    labelEs: input.labelEs,
    hintFr: input.hintFr ?? "",
    hintEn: input.hintEn ?? "",
    hintEs: input.hintEs ?? "",
    imageUrl: input.imageUrl,
    scoreRules: input.scoreRules,
  };
}

const FALLBACK_QUESTIONS: RawQuestion[] = [
  {
    id: "fb-texture",
    questionKey: "texture",
    channel: "online" as DiagnosticQuestionChannel,
    position: 0,
    enabled: true,
    allowUnknown: true,
    titleFr: "Quelle est la texture de ta couronne ?",
    titleEn: "What is your crown texture?",
    titleEs: "¿Cuál es la textura de tu corona?",
    subtitleFr: "Choisis la description la plus proche de tes cheveux au naturel — aide-toi des photos si tu hésites.",
    subtitleEn: "Pick the description closest to your natural hair — use the photos if you're unsure.",
    subtitleEs: "Elige la descripción más cercana a tu cabello natural — usa las fotos si dudas.",
    options: [
      opt({ questionId: "fb-texture", valueKey: "4a", position: 0, labelFr: "4A — Bouclés serrés", labelEn: "4A — Tight curls", labelEs: "4A — Rizos apretados", hintFr: "Ressorts définis", hintEn: "Defined springs", hintEs: "Muelles definidos", imageUrl: TEXTURE_IMAGES["4a"], scoreRules: { "demelant-nourrissant": 1, "beurre-capillaire": 1 } }),
      opt({ questionId: "fb-texture", valueKey: "4b", position: 1, labelFr: "4B — Crépus", labelEn: "4B — Coily", labelEs: "4B — Crespo", hintFr: "Angles en Z", hintEn: "Z-pattern", hintEs: "Patrón en Z", imageUrl: TEXTURE_IMAGES["4b"], scoreRules: { "beurre-capillaire": 2, "masque-capillaire": 1 } }),
      opt({ questionId: "fb-texture", valueKey: "4c", position: 2, labelFr: "4C — Très crépus", labelEn: "4C — Very coily", labelEs: "4C — Muy crespo", hintFr: "Shrinkage fort", hintEn: "Strong shrinkage", hintEs: "Encogimiento fuerte", imageUrl: TEXTURE_IMAGES["4c"], scoreRules: { "beurre-capillaire": 3, "demelant-nourrissant": 2 } }),
      opt({ questionId: "fb-texture", valueKey: "3abc", position: 3, labelFr: "3A–3C — Bouclés", labelEn: "3A–3C — Curly", labelEs: "3A–3C — Rizado", hintFr: "Boucles souples", hintEn: "Soft curls", hintEs: "Rizos suaves", imageUrl: TEXTURE_IMAGES["3abc"], scoreRules: { "demelant-nourrissant": 2 } }),
      opt({ questionId: "fb-texture", valueKey: "locs", position: 4, labelFr: "Locs / Tresses", labelEn: "Locs / Braids", labelEs: "Locs / Trenzas", hintFr: "Styles protégés", hintEn: "Protective styles", hintEs: "Estilos protectores", imageUrl: TEXTURE_IMAGES.locs, scoreRules: { "lotion-repousse": 3, "savon-solide": 2 } }),
      opt({ questionId: "fb-texture", valueKey: "dont_know", position: 5, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", hintFr: "Pas grave, on affine ensemble", hintEn: "No worries, we'll refine together", hintEs: "No pasa nada, lo afinamos juntas", scoreRules: {} }),
    ],
  },
  {
    id: "fb-porosity",
    questionKey: "porosity",
    channel: "online",
    position: 1,
    enabled: true,
    allowUnknown: true,
    titleFr: "Comment ton cheveu absorbe-t-il l’eau et les soins ?",
    titleEn: "How does your hair absorb water and products?",
    titleEs: "¿Cómo absorbe tu cabello el agua y los productos?",
    subtitleFr: "La porosité guide l’hydratation et le scellement. Astuce : un cheveu propre et sec flotte (faible porosité) ou coule vite (forte porosité) dans un verre d’eau.",
    subtitleEn: "Porosity guides hydration and sealing. Tip: a clean, dry strand floats (low porosity) or sinks fast (high porosity) in a glass of water.",
    subtitleEs: "La porosidad guía la hidratación y el sellado. Truco: un mechón limpio y seco flota (baja porosidad) o se hunde rápido (alta) en un vaso de agua.",
    options: [
      opt({ questionId: "fb-porosity", valueKey: "low", position: 0, labelFr: "Faible", labelEn: "Low", labelEs: "Baja", hintFr: "L’eau perle, sèche lentement", hintEn: "Water beads, dries slowly", hintEs: "El agua perla, seca lento", scoreRules: { "demelant-nourrissant": 3, "masque-capillaire": 2 } }),
      opt({ questionId: "fb-porosity", valueKey: "medium", position: 1, labelFr: "Moyenne", labelEn: "Medium", labelEs: "Media", hintFr: "Équilibre, sèche normalement", hintEn: "Balanced, dries at a normal pace", hintEs: "Equilibrio, seca de forma normal", scoreRules: { "masque-capillaire": 2, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-porosity", valueKey: "high", position: 2, labelFr: "Élevée", labelEn: "High", labelEs: "Alta", hintFr: "Absorbe et sèche très vite", hintEn: "Absorbs and dries very fast", hintEs: "Absorbe y seca muy rápido", scoreRules: { "beurre-capillaire": 4, "masque-capillaire": 3 } }),
      opt({ questionId: "fb-porosity", valueKey: "dont_know", position: 3, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", hintFr: "On pourra tester ensemble", hintEn: "We can test it together", hintEs: "Podemos probarlo juntas", scoreRules: {} }),
    ],
  },
  {
    id: "fb-scalp",
    questionKey: "scalp",
    channel: "online",
    position: 2,
    enabled: true,
    allowUnknown: true,
    titleFr: "Comment va ton cuir chevelu ?",
    titleEn: "How is your scalp?",
    titleEs: "¿Cómo está tu cuero cabelludo?",
    subtitleFr: "Un cuir chevelu confortable, c’est la base de la pousse.",
    subtitleEn: "A comfortable scalp is the foundation of growth.",
    subtitleEs: "Un cuero cabelludo cómodo es la base del crecimiento.",
    options: [
      opt({ questionId: "fb-scalp", valueKey: "dry", position: 0, labelFr: "Sec / tiraillements", labelEn: "Dry / tight", labelEs: "Seco / tirante", scoreRules: { "lotion-repousse": 3, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-scalp", valueKey: "oily", position: 1, labelFr: "Gras", labelEn: "Oily", labelEs: "Graso", hintFr: "Recharge vite après le lavage", hintEn: "Gets oily fast after washing", hintEs: "Se engrasa rápido tras lavar", scoreRules: { "savon-solide": 4 } }),
      opt({ questionId: "fb-scalp", valueKey: "sensitive", position: 2, labelFr: "Sensible", labelEn: "Sensitive", labelEs: "Sensible", hintFr: "Picotements, rougeurs", hintEn: "Tingling, redness", hintEs: "Picazón, enrojecimiento", scoreRules: { "savon-solide": 2, "lotion-repousse": 2 } }),
      opt({ questionId: "fb-scalp", valueKey: "flaky", position: 3, labelFr: "Pellicules", labelEn: "Flaky", labelEs: "Con caspa", scoreRules: { "savon-solide": 3, "lotion-repousse": 3 } }),
      opt({ questionId: "fb-scalp", valueKey: "balanced", position: 4, labelFr: "Équilibré", labelEn: "Balanced", labelEs: "Equilibrado", scoreRules: { "demelant-nourrissant": 1 } }),
      opt({ questionId: "fb-scalp", valueKey: "dont_know", position: 5, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", scoreRules: {} }),
    ],
  },
  {
    id: "fb-detangle",
    questionKey: "detangle",
    channel: "online",
    position: 3,
    enabled: true,
    allowUnknown: true,
    titleFr: "Comment se passe le démêlage ?",
    titleEn: "How is detangling?",
    titleEs: "¿Cómo es el desenredo?",
    subtitleFr: "On adapte le démêlant et le temps de pose.",
    subtitleEn: "We adapt conditioner and leave-in time.",
    subtitleEs: "Adaptamos el acondicionador y el tiempo.",
    options: [
      opt({ questionId: "fb-detangle", valueKey: "easy", position: 0, labelFr: "Facile", labelEn: "Easy", labelEs: "Fácil", scoreRules: { "demelant-nourrissant": 1 } }),
      opt({ questionId: "fb-detangle", valueKey: "moderate", position: 1, labelFr: "Moyen", labelEn: "Moderate", labelEs: "Moderado", scoreRules: { "demelant-nourrissant": 3 } }),
      opt({ questionId: "fb-detangle", valueKey: "hard", position: 2, labelFr: "Difficile / casse", labelEn: "Hard / breakage", labelEs: "Difícil / rotura", scoreRules: { "demelant-nourrissant": 5, "masque-capillaire": 2 } }),
      opt({ questionId: "fb-detangle", valueKey: "dont_know", position: 3, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", scoreRules: {} }),
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
      opt({ questionId: "fb-goal", valueKey: "hydration", position: 0, labelFr: "Hydratation", labelEn: "Hydration", labelEs: "Hidratación", scoreRules: { "beurre-capillaire": 5, "masque-capillaire": 3 } }),
      opt({ questionId: "fb-goal", valueKey: "length", position: 1, labelFr: "Pousse / longueur", labelEn: "Growth / length", labelEs: "Crecimiento", scoreRules: { "lotion-repousse": 5, "masque-capillaire": 2 } }),
      opt({ questionId: "fb-goal", valueKey: "definition", position: 2, labelFr: "Définition", labelEn: "Definition", labelEs: "Definición", scoreRules: { "demelant-nourrissant": 4, "beurre-capillaire": 3 } }),
      opt({ questionId: "fb-goal", valueKey: "repair", position: 3, labelFr: "Réparation", labelEn: "Repair", labelEs: "Reparación", scoreRules: { "masque-capillaire": 5, "beurre-capillaire": 3 } }),
      opt({ questionId: "fb-goal", valueKey: "volume", position: 4, labelFr: "Volume", labelEn: "Volume", labelEs: "Volumen", scoreRules: { "savon-solide": 2, "lotion-repousse": 3 } }),
      opt({ questionId: "fb-goal", valueKey: "hair_loss", position: 5, labelFr: "Chute", labelEn: "Hair loss", labelEs: "Caída", hintFr: "Freiner la chute et stimuler la repousse", hintEn: "Slow shedding and boost regrowth", hintEs: "Frenar la caída y estimular el crecimiento", scoreRules: { "lotion-repousse": 5 } }),
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
      opt({ questionId: "fb-routine", valueKey: "minimal", position: 0, labelFr: "Minimale", labelEn: "Minimal", labelEs: "Mínima", scoreRules: { "savon-solide": 2, "demelant-nourrissant": 2, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-routine", valueKey: "wash_day", position: 1, labelFr: "Wash day complet", labelEn: "Full wash day", labelEs: "Día de lavado", scoreRules: { "masque-capillaire": 2 } }),
      opt({ questionId: "fb-routine", valueKey: "protective", position: 2, labelFr: "Styles protégés", labelEn: "Protective styles", labelEs: "Estilos protectores", scoreRules: { "lotion-repousse": 3, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-routine", valueKey: "heat", position: 3, labelFr: "Chaleur / brushings", labelEn: "Heat styling", labelEs: "Calor", scoreRules: { "masque-capillaire": 4, "beurre-capillaire": 2 } }),
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
      opt({ questionId: "fb-constraint", valueKey: "fast", position: 0, labelFr: "Routine rapide", labelEn: "Quick routine", labelEs: "Rutina rápida", scoreRules: { "savon-solide": 1, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-constraint", valueKey: "complete", position: 1, labelFr: "Routine complète Awura", labelEn: "Full Awura routine", labelEs: "Rutina Awura completa", scoreRules: { "savon-solide": 2, "demelant-nourrissant": 2, "masque-capillaire": 2, "lotion-repousse": 2, "beurre-capillaire": 2 } }),
      opt({ questionId: "fb-constraint", valueKey: "growth_focus", position: 2, labelFr: "Focus pousse", labelEn: "Growth focus", labelEs: "Foco crecimiento", scoreRules: { "lotion-repousse": 4, "beurre-capillaire": 2 } }),
    ],
  },
  {
    id: "fb-phys-texture",
    questionKey: "phys_texture",
    channel: "physical_pre",
    position: 0,
    enabled: true,
    allowUnknown: true,
    titleFr: "Texture principale",
    titleEn: "Main texture",
    titleEs: "Textura principal",
    subtitleFr: "Pour préparer ton rendez-vous en salon — aide-toi des photos si tu hésites.",
    subtitleEn: "To prepare your in-person appointment — use the photos if you're unsure.",
    subtitleEs: "Para preparar tu cita en salón — usa las fotos si dudas.",
    options: [
      opt({ questionId: "fb-phys-texture", valueKey: "4a", position: 0, labelFr: "4A", labelEn: "4A", labelEs: "4A", imageUrl: TEXTURE_IMAGES["4a"], scoreRules: {} }),
      opt({ questionId: "fb-phys-texture", valueKey: "4b", position: 1, labelFr: "4B", labelEn: "4B", labelEs: "4B", imageUrl: TEXTURE_IMAGES["4b"], scoreRules: {} }),
      opt({ questionId: "fb-phys-texture", valueKey: "4c", position: 2, labelFr: "4C", labelEn: "4C", labelEs: "4C", imageUrl: TEXTURE_IMAGES["4c"], scoreRules: {} }),
      opt({ questionId: "fb-phys-texture", valueKey: "3abc", position: 3, labelFr: "3A–3C", labelEn: "3A–3C", labelEs: "3A–3C", imageUrl: TEXTURE_IMAGES["3abc"], scoreRules: {} }),
      opt({ questionId: "fb-phys-texture", valueKey: "locs", position: 4, labelFr: "Locs / Tresses", labelEn: "Locs / Braids", labelEs: "Locs / Trenzas", imageUrl: TEXTURE_IMAGES.locs, scoreRules: {} }),
      opt({ questionId: "fb-phys-texture", valueKey: "dont_know", position: 5, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", scoreRules: {} }),
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
      opt({ questionId: "fb-phys-goal", valueKey: "hydration", position: 0, labelFr: "Hydratation", labelEn: "Hydration", labelEs: "Hidratación", scoreRules: {} }),
      opt({ questionId: "fb-phys-goal", valueKey: "length", position: 1, labelFr: "Pousse", labelEn: "Growth", labelEs: "Crecimiento", scoreRules: {} }),
      opt({ questionId: "fb-phys-goal", valueKey: "repair", position: 2, labelFr: "Réparation", labelEn: "Repair", labelEs: "Reparación", scoreRules: {} }),
      opt({ questionId: "fb-phys-goal", valueKey: "routine", position: 3, labelFr: "Routine complète", labelEn: "Full routine", labelEs: "Rutina completa", scoreRules: {} }),
    ],
  },
  {
    id: "fb-phys-concern",
    questionKey: "phys_concern",
    channel: "physical_pre",
    position: 2,
    enabled: true,
    allowUnknown: true,
    titleFr: "Souci principal",
    titleEn: "Main concern",
    titleEs: "Preocupación principal",
    subtitleFr: "Ce que tu ressens le plus au quotidien.",
    subtitleEn: "What you feel most day to day.",
    subtitleEs: "Lo que más sientes a diario.",
    options: [
      opt({ questionId: "fb-phys-concern", valueKey: "dryness", position: 0, labelFr: "Sécheresse", labelEn: "Dryness", labelEs: "Sequedad", scoreRules: {} }),
      opt({ questionId: "fb-phys-concern", valueKey: "breakage", position: 1, labelFr: "Casse", labelEn: "Breakage", labelEs: "Rotura", scoreRules: {} }),
      opt({ questionId: "fb-phys-concern", valueKey: "scalp", position: 2, labelFr: "Cuir chevelu", labelEn: "Scalp", labelEs: "Cuero cabelludo", scoreRules: {} }),
      opt({ questionId: "fb-phys-concern", valueKey: "growth", position: 3, labelFr: "Pousse lente", labelEn: "Slow growth", labelEs: "Crecimiento lento", scoreRules: {} }),
      opt({ questionId: "fb-phys-concern", valueKey: "hair_loss", position: 4, labelFr: "Chute", labelEn: "Hair loss", labelEs: "Caída", scoreRules: {} }),
      opt({ questionId: "fb-phys-concern", valueKey: "dont_know", position: 5, labelFr: "Je ne sais pas", labelEn: "I don't know", labelEs: "No lo sé", scoreRules: {} }),
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
      opt({ questionId: "fb-phys-pref", valueKey: "morning", position: 0, labelFr: "Matin", labelEn: "Morning", labelEs: "Mañana", scoreRules: {} }),
      opt({ questionId: "fb-phys-pref", valueKey: "afternoon", position: 1, labelFr: "Après-midi", labelEn: "Afternoon", labelEs: "Tarde", scoreRules: {} }),
      opt({ questionId: "fb-phys-pref", valueKey: "flexible", position: 2, labelFr: "Flexible", labelEn: "Flexible", labelEs: "Flexible", scoreRules: {} }),
    ],
  },
];
