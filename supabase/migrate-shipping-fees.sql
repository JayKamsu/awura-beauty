-- Frais livraison : fee par produit + tarifs par mode
alter table public.products
  add column if not exists shipping_fee numeric(10,2) not null default 0;

alter table public.orders
  add column if not exists shipping_fee numeric(10,2) not null default 0;

-- Autoriser retrait sur place comme mode de livraison
alter table public.orders drop constraint if exists orders_shipping_carrier_check;
-- Pas de CHECK strict : valeurs gérées côté app (laposte | mondial_relay | pickup)

create table if not exists public.shipping_rates (
  carrier text primary key
    check (carrier in ('laposte', 'mondial_relay', 'pickup')),
  enabled boolean not null default true,
  base_fee numeric(10,2) not null default 0,
  free_shipping_min numeric(10,2),
  updated_at timestamptz not null default now()
);

alter table public.shipping_rates enable row level security;

drop policy if exists "Public can read shipping rates" on public.shipping_rates;
create policy "Public can read shipping rates"
  on public.shipping_rates for select
  to anon, authenticated
  using (true);

-- Pas d’écriture client : admin via service_role

insert into public.shipping_rates (carrier, enabled, base_fee, free_shipping_min)
values
  ('laposte', true, 5.90, 80),
  ('mondial_relay', true, 4.50, 80),
  ('pickup', true, 0, null)
on conflict (carrier) do nothing;
