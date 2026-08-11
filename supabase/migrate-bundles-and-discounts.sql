-- Awura Beauty — prix barré (compare_at_price) + offres promo multi-produits (bundles)
-- Idempotent.

-- ── Prix barré sur un produit individuel ────────────────
alter table public.products
  add column if not exists compare_at_price numeric(10, 2);

-- ── Un bundle est un produit à part entière (prix, images, slug propres)
--    dont les composants sont déclarés dans bundle_items. ─────────────
alter table public.products
  add column if not exists is_bundle boolean not null default false;

create table if not exists public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_product_id uuid not null references public.products (id) on delete cascade,
  component_product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  position integer not null default 0,
  unique (bundle_product_id, component_product_id)
);

create index if not exists bundle_items_bundle_idx on public.bundle_items (bundle_product_id, position);
create index if not exists bundle_items_component_idx on public.bundle_items (component_product_id);

alter table public.bundle_items enable row level security;

drop policy if exists "bundle_items_select_public" on public.bundle_items;
create policy "bundle_items_select_public"
  on public.bundle_items
  for select
  to anon, authenticated
  using (true);

-- Écriture via service_role uniquement (admin)

-- ── Gamme complète : crée la ligne produit si absente, puis la migre vers
--    le système générique de bundle (prix barré + composants). ─────────
insert into public.products (
  slug, name, price, compare_at_price, short_description, description, ingredients, usage,
  image_url, ingredients_image_url, lifestyle_image_url, category, product_type, is_bundle, is_new, stock, shipping_fee, universe
) values (
  'gamme-complete',
  'Gamme complète Awura',
  100.00,
  130.50,
  'Les 5 soins Awura + diagnostic présentiel offert — routine complète pour ta couronne.',
  'La gamme complète Awura Beauty réunit le savon solide, le démêlant nourrissant, le masque capillaire, la lotion active repousse et le beurre capillaire. Offre exclusive à 100 € (au lieu de 130,50 €) : un diagnostic capillaire présentiel (trichogramme) est offert après ton achat.',
  'Les formules des 5 soins Awura : actifs botaniques, beurres et huiles sélectionnés pour cheveux texturés, afro et métissés.',
  'Suis la routine recommandée (wash day + entre-deux). Après l’achat, réserve ton diagnostic présentiel gratuit via Diagnostic Capillaire — présentiel.',
  '/images/products/produit-1-beurre.jpg',
  '/images/ingredients/ingredient-1.jpg',
  '/images/lifestyle/cheveux-pot.jpg',
  'routine',
  'hair_care',
  true,
  true,
  18,
  0,
  'adult'
)
on conflict (slug) do update set
  compare_at_price = excluded.compare_at_price,
  is_bundle = true;

insert into public.bundle_items (bundle_product_id, component_product_id, quantity, position)
select bp.id, cp.id, 1, t.ordinality - 1
from public.products bp
cross join lateral unnest(array[
  'savon-solide', 'demelant-nourrissant', 'masque-capillaire',
  'lotion-repousse', 'beurre-capillaire'
]) with ordinality as t(component_slug, ordinality)
join public.products cp on cp.slug = t.component_slug
where bp.slug = 'gamme-complete'
on conflict (bundle_product_id, component_product_id) do nothing;
