-- Stock produits pour l'admin
alter table public.products
  add column if not exists stock integer not null default 20;
