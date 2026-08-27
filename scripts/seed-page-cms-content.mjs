/**
 * Pré-remplit page_sections / page_section_fields (locale fr) avec le texte
 * actuellement affiché sur le site (issu des fichiers i18n), pour que
 * l'admin > Pages affiche du contenu modifiable au lieu de champs vides.
 *
 * Usage: node scripts/seed-page-cms-content.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (!process.env[key]) process.env[key] = value.trim();
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
}

const supabase = createClient(url, serviceKey);

const block = (title, body) => `${title}\n${body}`;

/** pageKey -> [{ id, title?, subtitle?, body?, cta_label? }] (locale fr) */
const SEED = {
  home: [
    {
      id: "hero",
      title: "Ta couronne mérite mieux que des approximations.",
      subtitle:
        "Un diagnostic capillaire personnalisé pour comprendre enfin ce dont tes cheveux ont réellement besoin.",
      cta_label: "Réserver mon diagnostic",
    },
    {
      id: "promises",
      body: [
        block("Expertise & Écoute", "Chaque couronne est unique. Chaque conseil aussi."),
        block("Ingrédients Naturels", "Des formules pures, efficaces et respectueuses."),
        block("Résultats Durables", "Une méthode pensée pour des résultats visibles."),
        block("Amour & Authenticité", "Une marque créée par amour pour nos cheveux."),
      ].join("\n---\n"),
    },
    {
      id: "bestsellers",
      title: "Nos Best-Sellers",
      subtitle: "Les essentiels Awura plébiscités pour sublimer ta couronne au quotidien.",
      cta_label: "Voir toute la boutique",
    },
    {
      id: "ingredients",
      title: "Des ingrédients choisis pour ta couronne",
      subtitle: "Formules naturelles",
      body: "Chaque produit Awura est associé à sa composition : beurre de karité, coco, huiles végétales et actifs botaniques sélectionnés pour leur efficacité.",
    },
    {
      id: "feature",
      title: "Réserver mon diagnostic",
      body: "Quelques informations pour préparer un conseil vraiment adapté à ta couronne. Choisis un diagnostic en ligne ou en présentiel.",
      cta_label: "Réserver mon diagnostic",
    },
    {
      id: "testimonials",
      title: "Elles ont transformé leur couronne",
      body: [
        block(
          "Sarah M.",
          "Enfin une routine qui comprend vraiment mes cheveux. Résultat visible en trois semaines.",
        ),
        block(
          "Amina K.",
          "Le diagnostic m'a ouvert les yeux. Plus de casse, plus de brillance, et une vraie confiance.",
        ),
        block(
          "Léa D.",
          "Des produits nobles, un accompagnement humain. Awura a changé mon rapport à ma couronne.",
        ),
      ].join("\n---\n"),
    },
  ],
  about: [
    {
      id: "story",
      title: "Awura Beauty, née pour honorer ta couronne",
      subtitle: "Notre histoire",
      body: [
        "Awura Beauty est née d'un constat simple : trop de femmes aux cheveux texturés doivent encore composer avec des conseils approximatifs et des formules qui ne les comprennent pas vraiment.",
        "La marque a été créée pour offrir une autre voie — celle de l'écoute, des ingrédients nobles et d'un accompagnement personnalisé, pour que chaque couronne soit traitée avec le respect qu'elle mérite.",
        "Du diagnostic capillaire aux soins du quotidien, Awura Beauty construit une expérience complète : comprendre tes cheveux, choisir les bons gestes, et retrouver confiance dans ta beauté naturelle.",
      ].join("\n\n"),
    },
    {
      id: "mission",
      title: "Notre mission",
      subtitle: "Quatre piliers qui guident chaque formule, chaque conseil et chaque échange avec toi.",
      body: [
        block(
          "Expertise & Écoute",
          "Chaque couronne est unique. Nous prenons le temps de comprendre ton type de cheveux, ton historique et tes objectifs, pour te proposer des conseils vraiment adaptés — jamais de solutions toutes faites.",
        ),
        block(
          "Ingrédients Naturels",
          "Nos formules s'appuient sur des actifs botaniques choisis pour leur efficacité : beurre de karité, coco, huiles végétales et extraits sélectionnés. Des soins purs, respectueux de la fibre et du cuir chevelu.",
        ),
        block(
          "Résultats Durables",
          "Nous ne cherchons pas l'effet immédiat artificiel. Notre méthode vise des résultats visibles dans la durée : hydratation, densité, douceur et vitalité qui s'inscrivent dans une routine réaliste.",
        ),
        block(
          "Amour & Authenticité",
          "Awura Beauty est née par amour pour nos cheveux. Authenticité, fierté et bienveillance sont au cœur de la marque — pour que tu te sentes vue, comprise et célébrée.",
        ),
      ].join("\n---\n"),
    },
    {
      id: "commitments",
      title: "Nos engagements",
      subtitle: "Ce que nous promettons, au-delà du flacon.",
      body: [
        block(
          "Naturalité",
          "Des formules inspirées de la nature, pensées pour respecter ta fibre et ton cuir chevelu au quotidien.",
        ),
        block(
          "Non testé sur les animaux",
          "Nos soins ne sont pas testés sur les animaux. Une beauté responsable, sans compromis sur l'éthique.",
        ),
        block(
          "Fabrication artisanale",
          "Une approche soignée et humaine : des lots maîtrisés, une attention portée à chaque étape de fabrication.",
        ),
      ].join("\n---\n"),
    },
    {
      id: "cta",
      title: "Prête à prendre soin de ta couronne ?",
      body: "Commence par un diagnostic capillaire personnalisé : on t'aide à comprendre ce dont tes cheveux ont réellement besoin.",
      cta_label: "Réserver mon diagnostic",
    },
  ],
};

const FIELD_KEYS = ["title", "subtitle", "body", "image_url", "cta_label"];

async function seedPage(pageKey, sections) {
  for (let index = 0; index < sections.length; index++) {
    const { id, ...fields } = sections[index];
    const { data: upserted, error: sectionError } = await supabase
      .from("page_sections")
      .upsert(
        {
          page_key: pageKey,
          section_key: id,
          position: index,
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_key,section_key" },
      )
      .select("id")
      .maybeSingle();

    if (sectionError || !upserted) {
      throw new Error(
        `Échec upsert section ${pageKey}/${id}: ${sectionError?.message}`,
      );
    }

    for (const fieldKey of FIELD_KEYS) {
      const value = fields[fieldKey] ?? "";
      if (!value) continue; // ne pas écraser un champ déjà vide/absent en base
      const { error: fieldError } = await supabase
        .from("page_section_fields")
        .upsert(
          {
            section_id: upserted.id,
            field_key: fieldKey,
            locale: "fr",
            value,
          },
          { onConflict: "section_id,field_key,locale" },
        );
      if (fieldError) {
        throw new Error(
          `Échec upsert champ ${pageKey}/${id}/${fieldKey}: ${fieldError.message}`,
        );
      }
    }
    console.log(`✓ ${pageKey}/${id}`);
  }
}

for (const [pageKey, sections] of Object.entries(SEED)) {
  await seedPage(pageKey, sections);
}

console.log("Terminé.");
