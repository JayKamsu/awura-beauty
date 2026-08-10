import type {
  DiagnosticAnswerMap,
  DiagnosticLocale,
  DiagnosticProcessStep,
  DiagnosticProfile,
  DiagnosticQuestion,
  DiagnosticRoutineStep,
} from "@/lib/domain/diagnostic";

/** Ordre canonique des produits Awura utilisé pour trier les routines suggérées. */
export const AWURA_PRODUCT_SLUGS = [
  "savon-solide",
  "demelant-nourrissant",
  "masque-capillaire",
  "lotion-repousse",
  "beurre-capillaire",
] as const;

const ROUTINE_COPY: Record<
  string,
  Record<DiagnosticLocale, { title: string; usage: string }>
> = {
  "savon-solide": {
    fr: {
      title: "Shampoing Solide Nourrissant",
      usage:
        "Wash day : sur cheveux mouillés, masser le cuir chevelu 2–3 min, rincer à l’eau tiède. 1 à 2 fois par semaine selon ton scalp.",
    },
    en: {
      title: "Nourishing Solid Shampoo",
      usage:
        "Wash day: on wet hair, massage the scalp 2–3 min, rinse lukewarm. 1–2× per week depending on your scalp.",
    },
    es: {
      title: "Champú Sólido Nutritivo",
      usage:
        "Wash day: sobre cabello mojado, masajear el cuero 2–3 min, enjuagar tibio. 1–2× por semana según tu cuero.",
    },
  },
  "demelant-nourrissant": {
    fr: {
      title: "Démêlant Nutritif",
      usage:
        "Juste après le shampoing : appliquer sur les longueurs (pas les racines), poser 15–20 min sous chaleur douce, rincer. Démêler doigts puis peigne large.",
    },
    en: {
      title: "Nutritive Conditioner",
      usage:
        "Right after shampoo: apply to lengths (not roots), leave 15–20 min under gentle heat, rinse. Detangle with fingers then wide comb.",
    },
    es: {
      title: "Acondicionador Nutritivo",
      usage:
        "Tras el champú: aplicar en largos (no raíces), 15–20 min con calor suave, enjuagar. Destapar con dedos y peine ancho.",
    },
  },
  "masque-capillaire": {
    fr: {
      title: "Crème Hydratante Réparatrice",
      usage:
        "Entre deux wash days : sur cheveux humides, section par section. Laisse poser quelques minutes puis style. 2–3× / semaine.",
    },
    en: {
      title: "Repairing Moisturizing Cream",
      usage:
        "Between wash days: on damp hair, section by section. Leave a few minutes then style. 2–3× / week.",
    },
    es: {
      title: "Crema Hidratante Reparadora",
      usage:
        "Entre lavados: cabello húmedo, por secciones. Dejar unos minutos y peinar. 2–3× / semana.",
    },
  },
  "lotion-repousse": {
    fr: {
      title: "Lotion Active Repousse",
      usage:
        "Soir : sur racines sèches, 3–4 pipettes, massage circulaire 2 min. Satin la nuit. 4–5 soirs / semaine.",
    },
    en: {
      title: "Active Regrowth Lotion",
      usage:
        "Evening: on dry roots, 3–4 droppers, circular massage 2 min. Satin at night. 4–5 evenings / week.",
    },
    es: {
      title: "Loción Activa de Crecimiento",
      usage:
        "Noche: raíces secas, 3–4 pipetas, masaje 2 min. Satén por la noche. 4–5 noches / semana.",
    },
  },
  "beurre-capillaire": {
    fr: {
      title: "Crème Scellante Ancestrale",
      usage:
        "Toujours après l’hydratant : une noisette sur longueurs et pointes pour sceller. Évite le cuir chevelu si tu as tendance à l’excès de sébum.",
    },
    en: {
      title: "Ancestral Sealing Cream",
      usage:
        "Always after moisturizer: a pea-size on lengths and ends to seal. Avoid scalp if you tend to excess oil.",
    },
    es: {
      title: "Crema Selladora Ancestral",
      usage:
        "Siempre tras hidratar: una nuez en largos y puntas para sellar. Evita el cuero si tiendes a grasa.",
    },
  },
};

const PROFILE_BY_GOAL: Record<
  string,
  { titleKey: string; summaryKey: string; tags: string[] }
> = {
  hydration: {
    titleKey: "diagnostic.profiles.hydration.title",
    summaryKey: "diagnostic.profiles.hydration.summary",
    tags: ["hydratation", "scellage"],
  },
  length: {
    titleKey: "diagnostic.profiles.growth.title",
    summaryKey: "diagnostic.profiles.growth.summary",
    tags: ["pousse", "cuir chevelu"],
  },
  definition: {
    titleKey: "diagnostic.profiles.detangle.title",
    summaryKey: "diagnostic.profiles.detangle.summary",
    tags: ["démêlage", "souplesse"],
  },
  repair: {
    titleKey: "diagnostic.profiles.repair.title",
    summaryKey: "diagnostic.profiles.repair.summary",
    tags: ["réparation", "force"],
  },
  volume: {
    titleKey: "diagnostic.profiles.balance.title",
    summaryKey: "diagnostic.profiles.balance.summary",
    tags: ["légèreté", "équilibre"],
  },
};

function localeOf(lang?: string): DiagnosticLocale {
  if (lang?.startsWith("en")) return "en";
  if (lang?.startsWith("es")) return "es";
  return "fr";
}

/** Construit les étapes de routine (titre + usage localisés) pour les slugs recommandés, produits Awura en tête. */
export function buildRoutineSteps(
  recommendedSlugs: string[],
  locale?: string,
): DiagnosticRoutineStep[] {
  const loc = localeOf(locale);
  const ordered = AWURA_PRODUCT_SLUGS.filter((slug) =>
    recommendedSlugs.includes(slug),
  );
  const extras = recommendedSlugs.filter(
    (slug) => !AWURA_PRODUCT_SLUGS.includes(slug as (typeof AWURA_PRODUCT_SLUGS)[number]),
  );
  return [...ordered, ...extras].map((slug, index) => {
    const copy = ROUTINE_COPY[slug]?.[loc] ?? {
      title: slug,
      usage: "",
    };
    return {
      order: index + 1,
      productSlug: slug,
      title: copy.title,
      usage: copy.usage,
    };
  });
}

/** Routine complète avec tous les produits Awura, pour les diagnostics sans recommandation ciblée. */
export function buildFullAwuraRoutine(locale?: string): DiagnosticRoutineStep[] {
  return buildRoutineSteps([...AWURA_PRODUCT_SLUGS], locale);
}

/** Additionne les points par produit selon les réponses données à chaque question du diagnostic. */
export function scoreFromQuestions(
  questions: DiagnosticQuestion[],
  answers: DiagnosticAnswerMap,
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const slug of AWURA_PRODUCT_SLUGS) scores[slug] = 0;

  for (const question of questions) {
    const value = answers[question.questionKey];
    if (!value) continue;
    const option = question.options.find((o) => o.valueKey === value);
    if (!option) continue;
    for (const [slug, points] of Object.entries(option.scoreRules)) {
      scores[slug] = (scores[slug] ?? 0) + Number(points || 0);
    }
  }
  return scores;
}

/** Retient les slugs les mieux notés (score > 0), triés décroissant, limités à `limit`. */
export function topSlugsFromScores(
  scores: Record<string, number>,
  limit = 5,
): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, pts]) => pts > 0)
    .slice(0, limit)
    .map(([slug]) => slug);
}

const DETAILED_FEEDBACK: Record<
  string,
  Record<DiagnosticLocale, string>
> = {
  hydration: {
    fr: "Ton retour Awura : la fibre a soif. On reconstruit le confort en hydratant d’abord, puis en scellant pour que l’eau reste dans la mèche. Priorise des wash days réguliers et un scellage après chaque crème.",
    en: "Your Awura feedback: the fiber is thirsty. Rebuild comfort by moisturizing first, then sealing so water stays in the strand. Keep regular wash days and seal after every cream.",
    es: "Tu retorno Awura: la fibra tiene sed. Reconstruye confort hidratando primero y sellando después. Mantén wash days regulares y sella tras cada crema.",
  },
  length: {
    fr: "Ton retour Awura : l’objectif longueur passe par un cuir chevelu stimulé et une fibre moins cassante. Lotion le soir + hydratation scellée pour limiter la casse en longueurs.",
    en: "Your Awura feedback: length goals need a stimulated scalp and less breakage. Evening lotion + sealed moisture to protect lengths.",
    es: "Tu retorno Awura: la longitud pide cuero estimulado y menos rotura. Loción nocturna + hidratación sellada en largos.",
  },
  definition: {
    fr: "Ton retour Awura : démêlage et définition d’abord. Un démêlant généreux sous chaleur douce, puis hydratation légère et scellage pour des boucles plus souples.",
    en: "Your Awura feedback: detangle and definition first. A generous conditioner under gentle heat, then light moisture and seal for softer curls.",
    es: "Tu retorno Awura: primero destapar y definir. Acondicionador generoso con calor suave, luego hidratar y sellar.",
  },
  repair: {
    fr: "Ton retour Awura : la fibre demande réparation. Réduis les agressions (chaleur, traction), hydrate en profondeur et scelle chaque soin pour renforcer la mèche.",
    en: "Your Awura feedback: the fiber needs repair. Reduce aggressors (heat, tension), deep-moisturize and seal every treatment to strengthen the strand.",
    es: "Tu retorno Awura: la fibra pide reparación. Reduce agresiones, hidrata en profundidad y sella cada cuidado.",
  },
  volume: {
    fr: "Ton retour Awura : vise l’équilibre — nettoyer sans assécher, hydrater juste ce qu’il faut, sceller les pointes. Moins de produit au roots, plus de précision sur les longueurs.",
    en: "Your Awura feedback: aim for balance — cleanse without drying, moisturize just enough, seal the ends. Less product at the roots, more precision on lengths.",
    es: "Tu retorno Awura: busca equilibrio — limpiar sin resecar, hidratar lo justo, sellar puntas. Menos producto en raíces.",
  },
};

/** Processus à suivre (cadence + gestes) selon les réponses. */
export function buildProcessPlan(
  answers: DiagnosticAnswerMap,
  locale?: string,
): DiagnosticProcessStep[] {
  const loc = localeOf(locale);
  const goal =
    answers.goal ||
    answers.phys_goal ||
    answers.objective ||
    "hydration";
  const scalp = answers.scalp || answers.phys_concern || "";

  const washBody: Record<DiagnosticLocale, string> = {
    fr:
      scalp === "oily" || scalp === "greasy"
        ? "Wash day 2× / semaine si le cuir chevelu charge vite. Shampoing solide, massage ciblé, rinçage abondant."
        : scalp === "dry" || scalp === "flaky"
          ? "Wash day 1× / semaine (ou tous les 10 jours). Priorise douceur et hydratation après lavage."
          : "Wash day 1 à 2× / semaine. Respecte toujours l’ordre : shampoing → démêlant → (option masque) → hydratation → scellage.",
    en:
      scalp === "oily" || scalp === "greasy"
        ? "Wash day 2× / week if the scalp gets oily fast. Solid shampoo, targeted massage, thorough rinse."
        : scalp === "dry" || scalp === "flaky"
          ? "Wash day 1× / week (or every 10 days). Prioritize gentleness and moisture after washing."
          : "Wash day 1–2× / week. Always keep the order: shampoo → conditioner → (optional mask) → moisture → seal.",
    es:
      scalp === "oily" || scalp === "greasy"
        ? "Wash day 2× / semana si el cuero engrasa rápido. Champú sólido, masaje y enjuague abundante."
        : scalp === "dry" || scalp === "flaky"
          ? "Wash day 1× / semana (o cada 10 días). Prioriza suavidad e hidratación tras lavar."
          : "Wash day 1–2× / semana. Orden: champú → acondicionador → (mascarilla) → hidratar → sellar.",
  };

  const betweenBody: Record<DiagnosticLocale, string> = {
    fr:
      goal === "length"
        ? "Entre deux lavages : lotion sur racines le soir + crème hydratante et scellage sur longueurs 2–3× / semaine. Satin la nuit."
        : goal === "definition"
          ? "Entre deux lavages : refresh léger à l’eau, démêlage aux doigts, crème puis scellage. Évite de surcharger les racines."
          : "Entre deux lavages : hydrate les longueurs 2–3× / semaine, scelle toujours après. Protège la nuit (satin / foulard).",
    en:
      goal === "length"
        ? "Between washes: evening lotion on roots + cream and seal on lengths 2–3× / week. Satin at night."
        : goal === "definition"
          ? "Between washes: light water refresh, finger detangle, cream then seal. Avoid overloading the roots."
          : "Between washes: moisturize lengths 2–3× / week, always seal after. Night protection (satin).",
    es:
      goal === "length"
        ? "Entre lavados: loción nocturna en raíces + crema y sello en largos 2–3× / semana. Satén por la noche."
        : goal === "definition"
          ? "Entre lavados: refresh con agua, destapar con dedos, crema y sello. No saturar raíces."
          : "Entre lavados: hidrata largos 2–3× / semana y sella siempre. Protección nocturna (satén).",
  };

  const shopBody: Record<DiagnosticLocale, string> = {
    fr: "Achète uniquement les soins listés ci-dessous (liens boutique). Commence par shampoing + démêlant si tu démarres la gamme, puis complète hydratation et scellage.",
    en: "Buy only the care listed below (shop links). Start with shampoo + conditioner if you’re new to the range, then add moisture and seal.",
    es: "Compra solo los cuidados listados abajo (enlaces). Empieza por champú + acondicionador si entras en la gama, luego hidrata y sella.",
  };

  const titles: Record<DiagnosticLocale, [string, string, string]> = {
    fr: ["1. Wash day", "2. Entre deux lavages", "3. Tes produits à acheter"],
    en: ["1. Wash day", "2. Between wash days", "3. Products to buy"],
    es: ["1. Wash day", "2. Entre lavados", "3. Productos a comprar"],
  };

  const [t1, t2, t3] = titles[loc];
  return [
    { order: 1, title: t1, body: washBody[loc] },
    { order: 2, title: t2, body: betweenBody[loc] },
    { order: 3, title: t3, body: shopBody[loc] },
  ];
}

/** Texte de retour détaillé selon l'objectif principal détecté dans les réponses, avec repli sur hydratation. */
export function buildDetailedFeedback(
  answers: DiagnosticAnswerMap,
  locale?: string,
): string {
  const loc = localeOf(locale);
  const goal =
    answers.goal ||
    answers.phys_goal ||
    answers.objective ||
    "hydration";
  return (
    DETAILED_FEEDBACK[goal]?.[loc] ?? DETAILED_FEEDBACK.hydration[loc]
  );
}

/** Assemble le profil diagnostic complet (titres, feedback, process, tags) à partir des réponses brutes. */
export function buildProfileFromAnswers(
  answers: DiagnosticAnswerMap,
  locale?: string,
): DiagnosticProfile {
  const goal =
    answers.goal ||
    answers.phys_goal ||
    answers.objective ||
    "hydration";
  const base = PROFILE_BY_GOAL[goal] ?? PROFILE_BY_GOAL.hydration;
  const texture = answers.texture || answers.phys_texture || answers.hairType || "";
  return {
    key: `${texture || "crown"}-${goal}`,
    titleKey: base.titleKey,
    summaryKey: base.summaryKey,
    detailedFeedback: buildDetailedFeedback(answers, locale),
    processSteps: buildProcessPlan(answers, locale),
    tags: [...base.tags, texture].filter(Boolean),
  };
}

/** Nettoie les réponses brutes (trim, valeurs vides exclues) et gère la rétrocompatibilité des anciens noms de champs. */
export function normalizeAnswerMap(
  answers: Record<string, unknown>,
): DiagnosticAnswerMap {
  const out: DiagnosticAnswerMap = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim();
    }
  }
  // Legacy shape
  if ("hairType" in answers && typeof answers.hairType === "string") {
    out.texture = out.texture ?? answers.hairType;
    out.hairType = answers.hairType;
  }
  if ("scalp" in answers && typeof answers.scalp === "string") {
    out.scalp = answers.scalp;
  }
  if ("habits" in answers && typeof answers.habits === "string") {
    out.habits = answers.habits;
    out.routine = out.routine ?? answers.habits;
  }
  if ("goal" in answers && typeof answers.goal === "string") {
    out.goal = answers.goal;
  }
  return out;
}
