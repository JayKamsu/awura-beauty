-- Awura Beauty — témoignages diagnostic (réutilise order_reviews) + suivi PDF bilan.
-- Idempotent.

alter table public.order_reviews
  alter column product_id drop not null,
  alter column order_id drop not null;

alter table public.order_reviews
  add column if not exists diagnostic_id uuid references public.hair_diagnostics (id) on delete cascade;

-- Un avis par diagnostic (distinct de l'unicité commande/produit existante).
drop index if exists order_reviews_diagnostic_idx;
create unique index order_reviews_diagnostic_idx
  on public.order_reviews (diagnostic_id)
  where diagnostic_id is not null;

alter table public.order_reviews
  drop constraint if exists order_reviews_target_check;
alter table public.order_reviews
  add constraint order_reviews_target_check
  check (
    (order_id is not null and product_id is not null and diagnostic_id is null)
    or (order_id is null and product_id is null and diagnostic_id is not null)
  );
