-- Awura Beauty — catégorie dédiée aux casques chauffants (isolée des accessoires).
-- Idempotent.

insert into public.product_categories (slug, label, label_en, label_es, position, product_type)
values (
  'casques-chauffants',
  'Casques chauffants',
  'Heating caps',
  'Cascos térmicos',
  65,
  'accessory'
)
on conflict (slug) do update set
  label = excluded.label,
  label_en = excluded.label_en,
  label_es = excluded.label_es,
  position = excluded.position,
  product_type = excluded.product_type;

update public.products
set category = 'casques-chauffants'
where slug = 'casque-chauffant';
