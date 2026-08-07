-- Diagnostics capillaires Awura Beauty
-- Exécuter dans l'éditeur SQL Supabase (après seed-products.sql)

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

-- Lecture : propriétaire uniquement (ou anonymes non listés publiquement)
create policy "Users can read own diagnostics"
  on public.hair_diagnostics
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insertion : anonyme (user_id null) ou compte connecté
create policy "Anyone can insert diagnostics"
  on public.hair_diagnostics
  for insert
  to anon, authenticated
  with check (
    user_id is null
    or auth.uid() = user_id
  );
