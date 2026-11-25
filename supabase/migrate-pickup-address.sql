-- Adresse de remise à main propre, modifiable dans Admin → Livraison.
-- Idempotent.

alter table public.shipping_rates
  add column if not exists pickup_address text;

update public.shipping_rates
set pickup_address = 'Val de Fontenay, la gare'
where carrier = 'pickup'
  and (pickup_address is null or btrim(pickup_address) = '');
