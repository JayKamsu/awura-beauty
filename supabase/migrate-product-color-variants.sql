-- Awura Beauty — variantes couleur produit (casque chauffant, fibre de bananier).
-- Stock partagé au niveau du produit. Idempotent.

alter table public.products
  add column if not exists color_variants text[] not null default '{}';

update public.products
set color_variants = array['noir', 'rose-clair']::text[]
where slug = 'casque-chauffant';

update public.products
set color_variants = array['noir', 'blond', 'acajou']::text[]
where slug = 'fibre-bananier-naturelle';

alter table public.products
  add column if not exists color_images jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';

