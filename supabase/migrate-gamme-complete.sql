-- Gamme complète (100 €) + entitlement diagnostic présentiel offert
-- À exécuter dans l'éditeur SQL Supabase (prod).

insert into public.products (
  slug, name, price, short_description, description, ingredients, usage,
  image_url, ingredients_image_url, lifestyle_image_url, category, is_new, stock, shipping_fee, universe
) values (
  'gamme-complete',
  'Gamme complète Awura',
  100.00,
  'Les 5 soins Awura + diagnostic présentiel offert — routine complète pour ta couronne.',
  'La gamme complète Awura Beauty réunit le savon solide, le démêlant nourrissant, le masque capillaire, la lotion active repousse et le beurre capillaire. Offre exclusive à 100 € (au lieu de 130,50 €) : un diagnostic capillaire présentiel (trichogramme) est offert après ton achat.',
  'Les formules des 5 soins Awura : actifs botaniques, beurres et huiles sélectionnés pour cheveux texturés, afro et métissés.',
  'Suis la routine recommandée (wash day + entre-deux). Après l’achat, réserve ton diagnostic présentiel gratuit via Diagnostic Capillaire — présentiel.',
  '/images/products/produit-1-beurre.jpg',
  '/images/ingredients/ingredient-1.jpg',
  '/images/lifestyle/cheveux-pot.jpg',
  'routine',
  true,
  18,
  0,
  'adult'
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
  shipping_fee = excluded.shipping_fee,
  universe = excluded.universe;

insert into public.product_categories (slug, label, label_en, label_es, position)
values ('routine', 'Routine', 'Routine', 'Rutina', 60)
on conflict (slug) do nothing;

create table if not exists public.diagnostic_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  order_id uuid,
  source text not null default 'gamme-complete',
  status text not null default 'available'
    check (status in ('available', 'consumed', 'cancelled')),
  appointment_id uuid,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists diagnostic_entitlements_available_user_idx
  on public.diagnostic_entitlements (user_id, status, created_at);

create index if not exists diagnostic_entitlements_available_email_idx
  on public.diagnostic_entitlements (email, status, created_at);

alter table public.diagnostic_entitlements enable row level security;
