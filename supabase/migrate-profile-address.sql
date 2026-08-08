-- Adresse de livraison sur le profil client
alter table public.profiles
  add column if not exists address_line1 text not null default '',
  add column if not exists city text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists country text not null default 'FR';
