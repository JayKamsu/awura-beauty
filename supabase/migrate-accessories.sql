-- Awura Beauty — fibres de bananier & accessoires (nouvelles catégories + produits)
-- Idempotent.

-- ── Groupe de produit : distingue soin capillaire vs accessoire/fibre ──
alter table public.product_categories
  add column if not exists product_type text not null default 'hair_care'
    check (product_type in ('hair_care', 'accessory'));

alter table public.products
  add column if not exists product_type text not null default 'hair_care'
    check (product_type in ('hair_care', 'accessory'));

create index if not exists products_product_type_idx on public.products (product_type);

-- ── Nouvelles catégories ─────────────────────────────────
insert into public.product_categories (slug, label, label_en, label_es, position, product_type)
values
  ('fibres-de-bananier', 'Fibres de bananier', 'Banana fiber', 'Fibra de plátano', 60, 'accessory'),
  ('accessoires', 'Accessoires', 'Accessories', 'Accesorios', 70, 'accessory')
on conflict (slug) do update set product_type = excluded.product_type;

-- ── Produits ─────────────────────────────────────────────
insert into public.products (
  slug, name, price, description, short_description, ingredients, usage,
  image_url, ingredients_image_url, lifestyle_image_url,
  category, product_type, is_new, stock, shipping_fee, qr_url, universe
) values
  (
    'fibre-bananier-naturelle',
    'Fibre de bananier naturelle',
    14.9,
    'Fibre de bananier 100% naturelle, idéale pour le tressage protecteur et les locs. Légère, résistante et douce pour la fibre capillaire.',
    'Fibre naturelle pour tresses et locs, légère et résistante.',
    'Fibre de bananier 100% naturelle.',
    'Séparer en mèches fines, tresser avec les cheveux naturels pour un style protecteur. Peut être utilisée humide ou sèche selon la texture désirée.',
    '/images/products/produit-1-beurre.jpg',
    '', null,
    'fibres-de-bananier', 'accessory', true, 20, 0, '', 'adult'
  ),
  (
    'casque-chauffant',
    'Casque chauffant',
    39.9,
    'Casque chauffant pour optimiser la pénétration des soins capillaires (masques, huiles). Chaleur douce et homogène, idéal en complément des soins Awura.',
    'Active la pénétration des soins grâce à une chaleur douce et homogène.',
    '',
    'Appliquer le soin, enfiler le casque, brancher et régler la durée (15 à 20 minutes). Laisser agir puis rincer.',
    '/images/products/produit-3-masque.jpg',
    '', null,
    'accessoires', 'accessory', true, 12, 0, '', 'adult'
  ),
  (
    'chouchou-satin',
    'Chouchou en satin',
    8.9,
    'Chouchou en satin doux, réduit les frictions et préserve les longueurs. Idéal pour les coiffures protectrices au quotidien.',
    'Doux pour la fibre, limite la casse liée aux frictions.',
    '',
    'Utiliser pour attacher les cheveux sans les casser ni les fragiliser, de jour comme de nuit.',
    '/images/products/produit-2-demelant.jpg',
    '', null,
    'accessoires', 'accessory', false, 30, 0, '', 'adult'
  ),
  (
    'peigne-demelant',
    'Peigne démêlant à dents larges',
    9.9,
    'Peigne à dents larges pensé pour les cheveux bouclés à crépus. Démêle en douceur sans casser la fibre, à utiliser avec le démêlant nourrissant Awura.',
    'Démêle en douceur les textures bouclées à crépues.',
    '',
    'Utiliser sur cheveux humides et imprégnés de démêlant, section par section, en partant des pointes vers les racines.',
    '/images/products/produit-2-demelant.jpg',
    '', null,
    'accessoires', 'accessory', false, 25, 0, '', 'adult'
  ),
  (
    'coussin-satin',
    'Taie d''oreiller en satin',
    24.9,
    'Taie d''oreiller en satin pour protéger cheveux et peau pendant le sommeil. Réduit les frictions, préserve l''hydratation et limite la casse nocturne.',
    'Protège cheveux et peau pendant le sommeil, réduit les frictions.',
    '',
    'Installer sur l''oreiller habituel et utiliser chaque nuit pour préserver hydratation et coiffure.',
    '/images/products/produit-4-lotion.jpg',
    '', null,
    'accessoires', 'accessory', true, 15, 0, '', 'adult'
  )
on conflict (slug) do nothing;
