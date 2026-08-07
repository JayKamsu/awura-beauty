-- Awura Beauty — migration complète (idempotente)
-- Exécuter dans Supabase → SQL Editor → Run

create extension if not exists "pgcrypto";

-- ── Products ──────────────────────────────────────────────
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
  ingredients_image_url text not null default '',
  lifestyle_image_url text,
  category text not null default 'soin',
  is_new boolean not null default false,
  stock integer not null default 20,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists ingredients_image_url text,
  add column if not exists stock integer not null default 20;

alter table public.products enable row level security;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
  on public.products for select to anon, authenticated using (true);

insert into public.products (
  slug, name, price, short_description, description, ingredients, usage,
  image_url, ingredients_image_url, lifestyle_image_url, category, is_new, stock
) values
(
  'beurre-capillaire', 'Beurre Capillaire', 28.90,
  'Hydrate en profondeur les textures sèches.',
  'Un beurre riche et onctueux pour nourrir les cheveux texturés en profondeur.',
  'Beurre de karité, huile de coco, huile végétale, vitamine E, actifs botaniques.',
  'Sur cheveux humides ou secs, prélever une noisette, réchauffer entre les paumes et répartir longueur/pointes.',
  '/images/products/produit-1-beurre.jpg', '/images/ingredients/ingredient-1.jpg', '/images/lifestyle/cheveux-pot-alt.jpg',
  'hydratation', false, 18
),
(
  'demelant-nourrissant', 'Démêlant nourrissant', 25.90,
  'Démêle en douceur et nourrit les textures.',
  'Un démêlant nourrissant pensé pour les cheveux bouclés à crépus.',
  'Eau de coco, hibiscus, beurre végétal, huiles nourrissantes.',
  'Appliquer section par section sur cheveux mouillés. Démêler avec les doigts ou un peigne large.',
  '/images/products/produit-2-demelant.jpg', '/images/ingredients/ingredient-2.jpg', '/images/lifestyle/cheveux-spray-alt.jpg',
  'demelage', false, 18
),
(
  'masque-capillaire', 'Masque Capillaire', 29.90,
  'Répare et nourrit intensément la fibre.',
  'Un masque réparateur pour redonner densité et confort aux cheveux fatigués.',
  'Beurre de karité, coco, cire végétale, huiles fortifiantes, vitamine E.',
  'Après le shampoing, appliquer généreusement, laisser poser 15 à 30 minutes, puis rincer.',
  '/images/products/produit-3-masque.jpg', '/images/ingredients/ingredient-3.jpg', '/images/lifestyle/cheveux-pot.jpg',
  'soin', false, 18
),
(
  'lotion-repousse', 'Lotion Active Repousse', 32.90,
  'Hydratante et fortifiante pour stimuler la pousse.',
  'Lotion hydratante et fortifiante pour stimuler la pousse et renforcer le cuir chevelu.',
  'Coco, gingembre, amla, huiles botaniques, actifs fortifiants.',
  'Vaporiser sur le cuir chevelu propre, masser 2 à 3 minutes. 3 à 4 fois par semaine.',
  '/images/products/produit-4-lotion.jpg', '/images/ingredients/ingredient-4.jpg', '/images/lifestyle/cheveux-spray.jpg',
  'pousse', false, 18
),
(
  'savon-solide', 'Savon solide', 12.90,
  'Nettoie en douceur, à base d''ingrédients naturels.',
  'Un savon solide doux pour un nettoyage respectueux.',
  'Coco, beurres végétaux, actifs saponifiés naturels.',
  'Faire mousser, masser le cuir chevelu, rincer abondamment.',
  '/images/products/produit-5-savon.jpg', '/images/ingredients/ingredient-5.jpg', null,
  'nettoyage', true, 4
)
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  short_description = excluded.short_description,
  description = excluded.description,
  ingredients = excluded.ingredients,
  usage = excluded.usage,
  image_url = excluded.image_url,
  ingredients_image_url = excluded.ingredients_image_url,
  lifestyle_image_url = excluded.lifestyle_image_url,
  category = excluded.category,
  is_new = excluded.is_new,
  stock = excluded.stock;

-- ── Orders ────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  status text not null default 'pending',
  payment_method text not null check (payment_method in ('stripe', 'paypal')),
  payment_status text not null default 'pending',
  shipping_status text not null default 'preparing',
  shipping_carrier text,
  tracking_number text,
  label_url text,
  relay_point_id text,
  total numeric(10, 2) not null default 0,
  currency text not null default 'EUR',
  items jsonb not null default '[]'::jsonb,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists label_url text,
  add column if not exists relay_point_id text;

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_tracking_number_idx on public.orders (tracking_number);

alter table public.orders enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can update own pending orders" on public.orders;

create policy "Users can read own orders"
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

create policy "Users can update own pending orders"
  on public.orders for update to authenticated
  using (auth.uid() = user_id);

-- ── Blog ──────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('article', 'tutorial')),
  title text not null,
  excerpt text not null default '',
  cover_image_url text not null,
  published_at date not null default current_date,
  product_slug text references public.products (slug) on delete set null,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_kind_idx on public.blog_posts (kind);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "Blog posts are publicly readable" on public.blog_posts;
create policy "Blog posts are publicly readable"
  on public.blog_posts for select to anon, authenticated using (true);

-- ── Diagnostics ───────────────────────────────────────────
create table if not exists public.hair_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  answers jsonb not null,
  profile jsonb not null,
  recommended_product_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists hair_diagnostics_user_id_idx
  on public.hair_diagnostics (user_id);

alter table public.hair_diagnostics enable row level security;

drop policy if exists "Users can read own diagnostics" on public.hair_diagnostics;
drop policy if exists "Anyone can insert diagnostics" on public.hair_diagnostics;

create policy "Users can read own diagnostics"
  on public.hair_diagnostics for select to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can insert diagnostics"
  on public.hair_diagnostics for insert to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

-- ── Page layouts (CMS affichage) ──────────────────────────
create table if not exists public.page_layouts (
  page_key text primary key,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.page_layouts enable row level security;

drop policy if exists "Page layouts are publicly readable" on public.page_layouts;
create policy "Page layouts are publicly readable"
  on public.page_layouts for select to anon, authenticated using (true);

insert into public.page_layouts (page_key, sections) values
(
  'home',
  '[
    {"id":"hero","enabled":true},
    {"id":"promises","enabled":true},
    {"id":"bestsellers","enabled":true},
    {"id":"ingredients","enabled":true},
    {"id":"feature","enabled":true},
    {"id":"testimonials","enabled":true}
  ]'::jsonb
),
(
  'about',
  '[
    {"id":"story","enabled":true},
    {"id":"mission","enabled":true},
    {"id":"commitments","enabled":true},
    {"id":"cta","enabled":true}
  ]'::jsonb
)
on conflict (page_key) do nothing;
