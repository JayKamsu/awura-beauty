-- Awura Beauty — mesure d’audience première partie (dashboard admin).
-- Pas de lecture publique : insertion via service_role uniquement.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visited_at timestamptz not null default now(),
  visitor_id text not null,
  session_id text not null unique,
  path text not null,
  source text not null default 'direct',
  country text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists site_visits_visited_idx
  on public.site_visits (visited_at desc);

create index if not exists site_visits_visitor_idx
  on public.site_visits (visited_at, visitor_id);

alter table public.site_visits enable row level security;
