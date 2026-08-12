-- Awura Beauty — visio diagnostic : replanification + rappel automatique
-- Idempotent.

alter table public.diagnostic_appointments
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists rescheduled_count integer not null default 0;
