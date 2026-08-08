-- Commandes Awura Beauty
-- Exécuter dans l'éditeur SQL Supabase

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

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "Users can read own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders
  for insert
  to anon, authenticated
  with check (
    user_id is null
    or auth.uid() = user_id
  );

-- Pas d’UPDATE client : paiement / livraison via service_role uniquement.
