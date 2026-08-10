-- Ajoute la FK order_reviews.product_id -> products(id), nécessaire pour
-- l'embed PostgREST (products:product_id(...)) utilisé par la page /avis.

alter table public.order_reviews
  add constraint order_reviews_product_id_fkey
  foreign key (product_id) references public.products (id) on delete cascade;
