-- Ajustement atomique du stock produit (vente payée / remboursement / annulation).
-- Évite les pertes de mise à jour sous ventes concurrentes (pas de read-then-write JS).

create or replace function public.adjust_product_stock(p_id uuid, p_delta int)
returns void
language sql
as $$
  update public.products
  set stock = greatest(0, stock + p_delta)
  where id = p_id;
$$;
