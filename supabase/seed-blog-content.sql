-- Insère en base les articles/tutoriels actuellement affichés en fallback
-- (lib/infrastructure/supabase/fallback-posts.ts) pour les rendre visibles
-- et gérables depuis l'admin (Contenu). Idempotent (on conflict slug).

insert into public.blog_posts (slug, kind, title, excerpt, cover_image_url, published_at, product_slug, content)
values
(
  'comprendre-sa-porosite-capillaire', 'article',
  'Comprendre sa porosité capillaire',
  'La porosité explique comment tes cheveux absorbent et retiennent l''hydratation. Un guide simple pour mieux choisir tes soins.',
  '/images/lifestyle/produit-1.jpg', '2026-07-12', null,
  '[
    {"type":"paragraph","text":"La porosité capillaire décrit la capacité de ta fibre à absorber l''eau et les soins. Elle n''est pas figée : chaleur, décoloration et habitudes peuvent la faire évoluer."},
    {"type":"heading","text":"Les 3 niveaux à connaître"},
    {"type":"list","items":["Faible : l''hydratation entre difficilement — privilégie la chaleur douce et les textures légères.","Moyenne : équilibre idéal — alterne hydratation et nutrition.","Élevée : absorbe vite mais retient peu — scelle avec des beurres et huiles."]},
    {"type":"tip","text":"Le test du verre d''eau donne une indication, pas un diagnostic absolu. Observe surtout comment tes cheveux réagissent après le wash day."},
    {"type":"paragraph","text":"Une fois ta porosité identifiée, adapte l''ordre de ta routine : nettoyer, hydrater, nourrir, puis sceller. Awura Beauty t''accompagne ensuite avec un diagnostic personnalisé."}
  ]'::jsonb
),
(
  'wash-day-textures-crepues', 'article',
  'Organiser un wash day pour cheveux crépus',
  'Une méthode claire, étape par étape, pour démêler sans casse et maximiser l''hydratation le jour du lavage.',
  '/images/lifestyle/produit-2.jpg', '2026-07-28', null,
  '[
    {"type":"paragraph","text":"Le wash day n''a pas besoin d''être marathonien. Avec une séquence claire, tu réduis la casse et tu gagnes en définition."},
    {"type":"heading","text":"La séquence Awura"},
    {"type":"list","items":["Pré-poo huileux sur longueurs sèches","Nettoyage doux du cuir chevelu","Démêlage section par section sur cheveux mouillés","Masque ou beurre selon le besoin","Sealant + séchage à l''air ou microfibre"]},
    {"type":"image","src":"/images/ingredients/ingredient-2.jpg","alt":"Démêlant nourrissant et ingrédients"},
    {"type":"paragraph","text":"Travaille toujours par sections et prends ton temps au démêlage : c''est là que se joue la majorité de la casse évitable."}
  ]'::jsonb
),
(
  'couronne-en-hiver', 'article',
  'Protéger sa couronne en hiver',
  'Froid, chauffage, foulards serrés… comment garder hydratation et souplesse quand l''air s''assèche.',
  '/images/lifestyle/produit-5.jpg', '2026-08-02', null,
  '[
    {"type":"paragraph","text":"L''hiver assèche la fibre et le cuir chevelu. L''objectif : hydrater plus souvent, sceller davantage, et protéger la nuit."},
    {"type":"heading","text":"Gestes qui changent tout"},
    {"type":"list","items":["Bonnet en satin ou soie pour dormir","Brume légère en journée si l''air est sec","Beurre sur pointes 2 à 3 fois par semaine","Éviter les lavages trop fréquents à l''eau très chaude"]},
    {"type":"tip","text":"Un style protecteur bien hydraté en amont reste l''une des meilleures stratégies hivernales."}
  ]'::jsonb
),
(
  'utiliser-beurre-capillaire', 'tutorial',
  'Comment utiliser le Beurre Capillaire',
  'Leave-in, sealant ou soin nuit : les bons gestes pour tirer le maximum de ton beurre Awura.',
  '/images/products/produit-1-beurre.jpg', '2026-07-15', 'beurre-capillaire',
  '[
    {"type":"paragraph","text":"Le Beurre Capillaire est pensé pour nourrir sans alourdir excessivement. La quantité dépend de ta densité et de ta porosité."},
    {"type":"heading","text":"Mode d''emploi"},
    {"type":"list","items":["Prélever une noisette (départ petit, tu pourras ajouter)","Réchauffer entre les paumes jusqu''à texture fondante","Appliquer sur longueurs et pointes humides ou sèches","Éviter les racines si ton cuir chevelu est gras"]},
    {"type":"image","src":"/images/ingredients/ingredient-1.jpg","alt":"Composition du beurre capillaire"},
    {"type":"tip","text":"En soin nuit, applique une fine couche puis protège avec un foulard satin pour maximiser la pénétration."}
  ]'::jsonb
),
(
  'utiliser-demelant-nourrissant', 'tutorial',
  'Comment utiliser le Démêlant nourrissant',
  'Avant shampoing ou en leave-in : démêle section par section sans stresser la fibre.',
  '/images/products/produit-2-demelant.jpg', '2026-07-20', 'demelant-nourrissant',
  '[
    {"type":"paragraph","text":"Le démêlant nourrissant facilite le passage des doigts et du peigne large, tout en apportant de la souplesse."},
    {"type":"heading","text":"Deux façons de l''utiliser"},
    {"type":"list","items":["Pré-poo : sur cheveux secs ou légèrement humides avant lavage","Leave-in léger : après le rinse, sur longueurs essorées","Toujours travailler par sections pour limiter la casse","Terminer par un sealant si tes pointes sont poreuses"]},
    {"type":"tip","text":"Commence toujours par les pointes, puis remonte vers les longueurs — jamais l''inverse sur cheveux très emmêlés."}
  ]'::jsonb
),
(
  'utiliser-lotion-repousse', 'tutorial',
  'Comment utiliser la Lotion Active Repousse',
  'Brume, massage, fréquence : le rituel pour soutenir la pousse sans surcharger le cuir chevelu.',
  '/images/products/produit-4-lotion.jpg', '2026-07-25', 'lotion-repousse',
  '[
    {"type":"paragraph","text":"La Lotion Active Repousse s''utilise en brume fine sur cuir chevelu propre, idéalement après un massage stimulant."},
    {"type":"heading","text":"Rituel recommandé"},
    {"type":"list","items":["Séparer les cheveux pour accéder au cuir chevelu","Vaporiser légèrement (éviter le ruissellement)","Masser 2 à 3 minutes du bout des doigts","Répéter 3 à 4 fois par semaine"]},
    {"type":"image","src":"/images/lifestyle/produit-4.jpg","alt":"Résultat cheveux avec lotion"},
    {"type":"tip","text":"Sous un style protecteur, applique à la racine en ciblant les parties accessibles, sans détresser inutilement."}
  ]'::jsonb
),
(
  'utiliser-savon-solide', 'tutorial',
  'Comment utiliser le Savon solide',
  'Mousser, masser, rincer : un nettoyage doux qui respecte l''équilibre du cuir chevelu.',
  '/images/products/produit-5-savon.jpg', '2026-08-01', 'savon-solide',
  '[
    {"type":"paragraph","text":"Le savon solide Awura nettoie en douceur. L''essentiel est de bien faire mousser et de rincer abondamment."},
    {"type":"heading","text":"Étapes"},
    {"type":"list","items":["Mouiller cheveux et savon","Faire mousser entre les mains ou directement sur le cuir chevelu","Masser sans frotter agressivement les longueurs","Rincer à l''eau tiède, puis enchaîner avec un soin hydratant"]},
    {"type":"tip","text":"Laisse sécher le savon à l''air libre entre deux utilisations pour prolonger sa durée de vie."}
  ]'::jsonb
)
on conflict (slug) do nothing;
