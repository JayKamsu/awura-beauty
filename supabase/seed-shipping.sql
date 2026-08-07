-- Extension shipping (La Poste / Mondial Relay)
-- Exécuter après seed-orders.sql

alter table public.orders
  add column if not exists shipping_carrier text,
  add column if not exists tracking_number text,
  add column if not exists label_url text,
  add column if not exists relay_point_id text;

create index if not exists orders_tracking_number_idx
  on public.orders (tracking_number);
