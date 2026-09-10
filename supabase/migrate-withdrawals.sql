-- Awura Beauty — déclarations de rétractation en ligne (art. D221-5).
-- Pas de lecture publique : insertion uniquement via service_role (API).

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  order_ref text not null,
  order_date text not null default '',
  contract_details text not null,
  ack_email text not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_submitted_idx
  on public.withdrawal_requests (submitted_at desc);

alter table public.withdrawal_requests enable row level security;
