-- Colonne image ingrédients (si table products déjà créée sans elle)
alter table public.products
  add column if not exists ingredients_image_url text;

-- Remplir / mettre à jour les visuels ingrédients (chemins publics)
update public.products set ingredients_image_url = '/images/ingredients/ingredient-1.jpg'
  where slug = 'beurre-capillaire' and (ingredients_image_url is null or ingredients_image_url = '');
update public.products set ingredients_image_url = '/images/ingredients/ingredient-2.jpg'
  where slug = 'demelant-nourrissant' and (ingredients_image_url is null or ingredients_image_url = '');
update public.products set ingredients_image_url = '/images/ingredients/ingredient-3.jpg'
  where slug = 'masque-capillaire' and (ingredients_image_url is null or ingredients_image_url = '');
update public.products set ingredients_image_url = '/images/ingredients/ingredient-4.jpg'
  where slug = 'lotion-repousse' and (ingredients_image_url is null or ingredients_image_url = '');
update public.products set ingredients_image_url = '/images/ingredients/ingredient-5.jpg'
  where slug = 'savon-solide' and (ingredients_image_url is null or ingredients_image_url = '');
