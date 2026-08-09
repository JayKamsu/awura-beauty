-- Awura Beauty — déduplication webhooks paiement
-- Idempotent.

create table if not exists public.webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create index if not exists webhook_events_received_idx
  on public.webhook_events (received_at desc);

alter table public.webhook_events enable row level security;
-- Écriture service_role uniquement
