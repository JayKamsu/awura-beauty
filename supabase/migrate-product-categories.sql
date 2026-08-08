-- Awura Beauty — catégories produits (admin CRUD)
-- Idempotent.

create table if not exists public.product_categories (
  slug text primary key,
  label text not null,
  label_en text not null default '',
  label_es text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.product_categories (slug, label, label_en, label_es, position)
values
  ('hydratation', 'Hydratation', 'Hydration', 'Hidratación', 10),
  ('demelage', 'Démêlage', 'Detangling', 'Desenredado', 20),
  ('soin', 'Soin', 'Care', 'Cuidado', 30),
  ('pousse', 'Pousse', 'Growth', 'Crecimiento', 40),
  ('nettoyage', 'Nettoyage', 'Cleansing', 'Limpieza', 50)
on conflict (slug) do nothing;

alter table public.product_categories enable row level security;

drop policy if exists "product_categories_select_public" on public.product_categories;
create policy "product_categories_select_public"
  on public.product_categories
  for select
  to anon, authenticated
  using (true);

-- Écriture via service_role uniquement
