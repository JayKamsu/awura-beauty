-- Awura Beauty — diagnostic en ligne avec visio + résultat rédigé par l'admin
-- Idempotent.

-- Le canal (online/physical) devient commun au système de RDV : le diagnostic
-- en ligne réserve désormais un créneau visio via le même système que le
-- présentiel, au lieu d'un bouton "voir le résultat" calculé instantanément.
alter table public.diagnostic_appointments
  add column if not exists channel text not null default 'physical';

alter table public.diagnostic_appointments
  drop constraint if exists diagnostic_appointments_channel_check;

alter table public.diagnostic_appointments
  add constraint diagnostic_appointments_channel_check
  check (channel in ('online', 'physical'));

create index if not exists diagnostic_appointments_channel_idx
  on public.diagnostic_appointments (channel);
