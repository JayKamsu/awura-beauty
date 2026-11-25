-- Photos du casque chauffant : rose clair + détail de la télécommande.
-- Remplace le visuel provisoire. L'admin peut ensuite remplacer ou supprimer ces images.

update public.products
set
  image_url = '/images/products/casque-rose.jpg',
  lifestyle_image_url = '/images/products/casque-telecommande.jpg',
  color_variants = array['rose-clair', 'noir']::text[],
  color_images = coalesce(color_images, '{}'::jsonb)
    || jsonb_build_object('rose-clair', '/images/products/casque-rose.jpg')
where slug = 'casque-chauffant'
  and (
    image_url is null
    or image_url = ''
    or image_url = '/images/products/produit-3-masque.jpg'
  );
