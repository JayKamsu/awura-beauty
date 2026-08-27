-- Brouillon de bilan diagnostic : l’admin peut rédiger, quitter la page, et envoyer plus tard.

alter table public.diagnostic_appointments
  add column if not exists result_draft jsonb;

comment on column public.diagnostic_appointments.result_draft is
  'Brouillon de bilan rédigé par l’admin, avant envoi au client.';
