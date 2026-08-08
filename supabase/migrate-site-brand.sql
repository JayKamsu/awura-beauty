-- Awura Beauty — marque / design (admin) + champs produit QR / univers
-- Idempotent. Exécuter dans Supabase SQL Editor ou via DATABASE_URL.

create table if not exists public.site_brand_settings (
  id text primary key default 'default',
  duafe_url text not null default '',
  logo_light_url text not null default '',
  logo_dark_url text not null default '',
  logo_accent_url text not null default '',
  child_universe_enabled boolean not null default false,
  show_duafe_pattern boolean not null default true,
  qr_default_mode text not null default 'tutorials'
    check (qr_default_mode in ('tutorials', 'product', 'diagnostic', 'custom')),
  qr_custom_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_brand_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.products
  add column if not exists qr_url text not null default '';

alter table public.products
  add column if not exists universe text not null default 'adult';

-- Contrainte universe (si absente)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_universe_check'
  ) then
    alter table public.products
      add constraint products_universe_check
      check (universe in ('adult', 'child'));
  end if;
end $$;

alter table public.site_brand_settings enable row level security;

drop policy if exists "site_brand_settings_select_public" on public.site_brand_settings;
create policy "site_brand_settings_select_public"
  on public.site_brand_settings
  for select
  to anon, authenticated
  using (true);

-- Écriture via service_role uniquement (pas de policy insert/update client)
