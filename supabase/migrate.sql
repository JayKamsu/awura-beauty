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
  add column if not exists stock integer not null default 20,
  add column if not exists shipping_fee numeric(10, 2) not null default 0;

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
  payment_method text not null check (payment_method in ('stripe', 'paypal', 'manual')),
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
  add column if not exists relay_point_id text,
  add column if not exists shipping_fee numeric(10, 2) not null default 0;

-- ── Shipping rates ────────────────────────────────────────
create table if not exists public.shipping_rates (
  carrier text primary key
    check (carrier in ('laposte', 'mondial_relay', 'pickup')),
  enabled boolean not null default true,
  base_fee numeric(10, 2) not null default 0,
  free_shipping_min numeric(10, 2),
  updated_at timestamptz not null default now()
);

alter table public.shipping_rates enable row level security;

drop policy if exists "Public can read shipping rates" on public.shipping_rates;
create policy "Public can read shipping rates"
  on public.shipping_rates for select
  to anon, authenticated
  using (true);

insert into public.shipping_rates (carrier, enabled, base_fee, free_shipping_min)
values
  ('laposte', true, 5.90, 80),
  ('mondial_relay', true, 4.50, 80),
  ('pickup', true, 0, null)
on conflict (carrier) do nothing;

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

-- Pas d’UPDATE client : paiement / livraison via service_role uniquement.

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

-- ── CMS pages (relationnel, sans jsonb) ───────────────────
-- Voir aussi migrate-page-cms-storage-push-chat.sql pour Storage / push / chat
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  position int not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create table if not exists public.page_section_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.page_sections (id) on delete cascade,
  field_key text not null,
  locale text not null check (locale in ('fr', 'en', 'es')),
  value text not null default '',
  unique (section_id, field_key, locale)
);

create index if not exists page_sections_page_key_idx
  on public.page_sections (page_key);

alter table public.page_sections enable row level security;
alter table public.page_section_fields enable row level security;

drop policy if exists "Page sections publicly readable" on public.page_sections;
create policy "Page sections publicly readable"
  on public.page_sections for select to anon, authenticated using (true);

drop policy if exists "Page section fields publicly readable" on public.page_section_fields;
create policy "Page section fields publicly readable"
  on public.page_section_fields for select to anon, authenticated using (true);

insert into public.page_sections (page_key, section_key, position, enabled) values
  ('home', 'hero', 0, true),
  ('home', 'promises', 1, true),
  ('home', 'bestsellers', 2, true),
  ('home', 'ingredients', 3, true),
  ('home', 'feature', 4, true),
  ('home', 'testimonials', 5, true),
  ('about', 'story', 0, true),
  ('about', 'mission', 1, true),
  ('about', 'commitments', 2, true),
  ('about', 'cta', 3, true)
on conflict (page_key, section_key) do nothing;

-- ── Profiles (compte client) ──────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  address_line1 text not null default '',
  city text not null default '',
  postal_code text not null default '',
  country text not null default 'FR',
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists address_line1 text not null default '',
  add column if not exists city text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists country text not null default 'FR';

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- ── Push + chat (détail Storage / Realtime dans migrate-page-cms-storage-push-chat.sql)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

