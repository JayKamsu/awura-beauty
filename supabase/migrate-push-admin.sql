-- Audience admin pour push ciblées (nouvelles commandes, etc.)
alter table public.push_subscriptions
  add column if not exists is_admin boolean not null default false;

create index if not exists push_subscriptions_is_admin_idx
  on public.push_subscriptions (is_admin)
  where is_admin = true;
