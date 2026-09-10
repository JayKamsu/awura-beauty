-- Liens produits externes (hors boutique Awura) à injecter dans le bilan de consultation.

alter table public.diagnostic_appointments
  add column if not exists external_product_links jsonb not null default '[]'::jsonb;

comment on column public.diagnostic_appointments.external_product_links is
  'Liens {label, url} vers des produits externes, ajoutés au modèle de bilan.';
