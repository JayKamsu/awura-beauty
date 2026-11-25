-- Avis produit saisis depuis l'admin (sans commande) + retrait des avis de test.

alter table public.order_reviews
  add column if not exists author_name text not null default '';

alter table public.order_reviews
  drop constraint if exists order_reviews_target_check;

alter table public.order_reviews
  add constraint order_reviews_target_check
  check (
    (order_id is not null and product_id is not null and diagnostic_id is null)
    or (order_id is null and product_id is null and diagnostic_id is not null)
    or (order_id is null and product_id is not null and diagnostic_id is null)
  );

delete from public.order_reviews
where product_id is not null
  and (
    comment ~* '^(test|essai|fake|faux|lorem|xxx|asdf|azerty)\M'
    or comment ilike '%avis de test%'
    or comment ilike '%test avis%'
    or comment ilike '%commentaire de test%'
  );
