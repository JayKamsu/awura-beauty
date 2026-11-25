-- Stock par couleur. `products.stock` reste le total (somme des teintes).
-- Tant que color_stock est vide, le stock produit partagé continue de s'appliquer.

alter table public.products
  add column if not exists color_stock jsonb not null default '{}'::jsonb;

create or replace function public.adjust_product_color_stock(
  p_id uuid,
  p_color text,
  p_delta int
)
returns void
language plpgsql
as $$
declare
  current_map jsonb;
  current_qty int;
  next_qty int;
begin
  select coalesce(color_stock, '{}'::jsonb)
    into current_map
  from public.products
  where id = p_id
  for update;

  if not found then
    return;
  end if;

  current_qty := greatest(0, coalesce((current_map ->> p_color)::int, 0));
  next_qty := greatest(0, current_qty + p_delta);

  update public.products
  set
    color_stock = jsonb_set(current_map, array[p_color], to_jsonb(next_qty), true),
    stock = greatest(0, stock - current_qty + next_qty)
  where id = p_id;
end;
$$;
