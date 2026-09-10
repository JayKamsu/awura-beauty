-- Awura Beauty — visibilité produit (actif / caché).
-- false = masqué de la boutique, de l'accueil et des fiches publiques.

alter table public.products
  add column if not exists is_active boolean not null default true;

comment on column public.products.is_active is
  'false = masqué du catalogue public (boutique, accueil, fiche). L''admin voit toujours le produit.';

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- Exemple : accessoire pas encore lancé.
update public.products
set is_active = false
where slug = 'chouchou-satin';
