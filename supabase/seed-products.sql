-- Table products Awura Beauty
-- À exécuter dans l'éditeur SQL Supabase

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price numeric(10, 2) not null,
  description text not null default '',
  short_description text not null default '',
  ingredients text not null default '',
  usage text not null default '',
  image_url text not null,
  ingredients_image_url text not null,
  lifestyle_image_url text,
  category text not null default 'soin',
  is_new boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (true);

insert into public.products (
  slug, name, price, short_description, description, ingredients, usage,
  image_url, ingredients_image_url, lifestyle_image_url, category, is_new
) values
(
  'beurre-capillaire',
  'Beurre Capillaire',
  28.90,
  'Hydrate en profondeur les textures sèches.',
  'Un beurre riche et onctueux pour nourrir les cheveux texturés en profondeur. Idéal en leave-in, en sealant ou en soin nuit pour retrouver souplesse et éclat.',
  'Beurre de karité, huile de coco, huile végétale, vitamine E, actifs botaniques.',
  'Sur cheveux humides ou secs, prélever une noisette, réchauffer entre les paumes et répartir longueur/pointes. Éviter les racines si le cuir chevelu est gras.',
  '/images/products/produit-1-beurre.jpg',
  '/images/ingredients/ingredient-1.jpg',
  '/images/lifestyle/cheveux-pot-alt.jpg',
  'hydratation',
  false
),
(
  'demelant-nourrissant',
  'Démêlant nourrissant',
  25.90,
  'Démêle en douceur et nourrit les textures.',
  'Un démêlant nourrissant pensé pour les cheveux bouclés à crépus. Il facilite le démêlage sans casser la fibre et laisse les cheveux souples et brillants.',
  'Eau de coco, hibiscus, beurre végétal, huiles nourrissantes, actifs démêlants d''origine naturelle.',
  'Appliquer section par section sur cheveux mouillés avant le shampoing ou en leave-in léger. Démêler avec les doigts ou un peigne large.',
  '/images/products/produit-2-demelant.jpg',
  '/images/ingredients/ingredient-2.jpg',
  '/images/lifestyle/cheveux-spray-alt.jpg',
  'demelage',
  false
),
(
  'masque-capillaire',
  'Masque Capillaire',
  29.90,
  'Répare et nourrit intensément la fibre.',
  'Un masque réparateur pour redonner densité et confort aux cheveux fatigués. Sa texture riche enveloppe la fibre pour une réparation visible après quelques utilisations.',
  'Beurre de karité, coco, cire végétale, huiles fortifiantes, vitamine E.',
  'Après le shampoing, appliquer généreusement, laisser poser 15 à 30 minutes sous une charlotte, puis rincer à l''eau tiède.',
  '/images/products/produit-3-masque.jpg',
  '/images/ingredients/ingredient-3.jpg',
  '/images/lifestyle/cheveux-pot.jpg',
  'soin',
  false
),
(
  'lotion-repousse',
  'Lotion Active Repousse',
  32.90,
  'Hydratante et fortifiante pour stimuler la pousse.',
  'Lotion hydratante et fortifiante pour stimuler la pousse et renforcer le cuir chevelu. Brume fine idéale en soin quotidien ou après un massage du cuir chevelu.',
  'Coco, gingembre, amla, huiles botaniques, actifs fortifiants.',
  'Vaporiser sur le cuir chevelu propre, masser 2 à 3 minutes. Utiliser 3 à 4 fois par semaine pour un résultat optimal.',
  '/images/products/produit-4-lotion.jpg',
  '/images/ingredients/ingredient-4.jpg',
  '/images/lifestyle/cheveux-spray.jpg',
  'pousse',
  false
),
(
  'savon-solide',
  'Savon solide',
  12.90,
  'Nettoie en douceur, à base d''ingrédients naturels.',
  'Un savon solide doux pour un nettoyage respectueux. Formulé avec des matières premières naturelles pour préserver l''équilibre du cuir chevelu et de la fibre.',
  'Coco, beurres végétaux, cauris symboliques de pureté, actifs saponifiés naturels.',
  'Faire mousser entre les mains ou directement sur cheveux mouillés, masser le cuir chevelu, rincer abondamment. Suivre d''un soin hydratant.',
  '/images/products/produit-5-savon.jpg',
  '/images/ingredients/ingredient-5.jpg',
  null,
  'nettoyage',
  true
)
on conflict (slug) do nothing;
