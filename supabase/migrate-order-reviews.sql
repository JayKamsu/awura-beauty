-- Confirmation de réception + avis produits post-commande.

create table if not exists public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index if not exists order_reviews_product_idx
  on public.order_reviews (product_id, created_at desc);
create index if not exists order_reviews_order_idx
  on public.order_reviews (order_id);

alter table public.orders
  add column if not exists received_at timestamptz;

alter table public.order_reviews enable row level security;

drop policy if exists "Reviews publicly readable" on public.order_reviews;
create policy "Reviews publicly readable"
  on public.order_reviews for select
  to anon, authenticated
  using (true);

-- Écriture uniquement via service_role (routes API serveur, ownership vérifié côté app).
