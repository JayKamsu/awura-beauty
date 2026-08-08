-- Fidélité + parrainage
alter table public.profiles
  add column if not exists loyalty_points integer not null default 0,
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null,
  add column if not exists referral_rewarded_at timestamptz;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

alter table public.orders
  add column if not exists points_earned integer not null default 0,
  add column if not exists points_redeemed integer not null default 0,
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists referral_discount_applied boolean not null default false;

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null
    check (reason in (
      'order_earn',
      'order_redeem',
      'referral_referrer',
      'referral_referee',
      'admin_adjust'
    )),
  order_id uuid references public.orders (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_ledger_user_created_idx
  on public.loyalty_ledger (user_id, created_at desc);

create unique index if not exists loyalty_ledger_order_reason_uidx
  on public.loyalty_ledger (order_id, reason)
  where order_id is not null;

alter table public.loyalty_ledger enable row level security;

drop policy if exists "Users can read own loyalty ledger" on public.loyalty_ledger;
create policy "Users can read own loyalty ledger"
  on public.loyalty_ledger for select
  to authenticated
  using (auth.uid() = user_id);

-- Génération code parrain
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
begin
  loop
    result := 'AW';
    for i in 1..6 loop
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.profiles where referral_code = result
    );
  end loop;
  return result;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, referral_code)
  values (new.id, public.generate_referral_code())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Empêche le client de modifier les colonnes fidélité
create or replace function public.protect_loyalty_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.loyalty_points := old.loyalty_points;
    new.referral_code := old.referral_code;
    new.referral_rewarded_at := old.referral_rewarded_at;
    -- referred_by : une seule fois, via service_role uniquement
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_loyalty_profile_columns on public.profiles;
create trigger protect_loyalty_profile_columns
  before update on public.profiles
  for each row execute function public.protect_loyalty_profile_columns();

-- Backfill codes manquants
update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;
