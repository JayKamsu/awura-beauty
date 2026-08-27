-- Témoignages diagnostic Mariama (clientes). Idempotent par nom d'auteure.

insert into public.site_testimonials (author_name, quote, rating, published, source)
select
  'Fatoumata Diaraye',
  $quote$Mariama a vraiment pris le temps de m’écouter et a su cerner la problématique de mes cheveux, qui sont très secs et ont tendance à beaucoup shrinker. Elle m’a proposé des solutions concrètes, notamment une routine capillaire personnalisée ainsi que des produits adaptés à mon type de cheveux. J’ai particulièrement apprécié le compte-rendu par mail de notre échange, très clair et complet. Cela me permet de retrouver facilement ses conseils chaque fois que j’ai un doute ou que j’oublie un point. Un mois après notre rendez-vous, je constate une réelle amélioration : mes cheveux sont bien plus hydratés, et je remarque qu’ils conservent mieux leur longueur. Un grand merci à Mariama pour son professionnalisme et sa bienveillance.$quote$,
  5,
  true,
  'admin'
where not exists (
  select 1 from public.site_testimonials where author_name = 'Fatoumata Diaraye'
);

insert into public.site_testimonials (author_name, quote, rating, published, source)
select
  'Aminata',
  $quote$Mariama m'a fourni un diagnostic très complet sur la problématique de ma fille de 2 ans qui a une dermatite séborrhéique. Notre échange m'a beaucoup plu car c'est une personne à l'écoute et qui connaît très bien son travail et les cheveux en général. Je suis très satisfaite et je continuerai à échanger avec elle pour avoir une chevelure de reine. Encore merci Mariama.$quote$,
  5,
  true,
  'admin'
where not exists (
  select 1 from public.site_testimonials where author_name = 'Aminata'
);

insert into public.site_testimonials (author_name, quote, rating, published, source)
select
  'Martine',
  $quote$Le compte-rendu est fidèle à notre échange. Je te remercie à mon tour pour ton écoute et tes conseils. J'ai apprécié ta bienveillance et tes encouragements à maintenir la nouvelle routine que je veux mettre en place pour ma couronne. Gratitude à toi ❤️$quote$,
  5,
  true,
  'admin'
where not exists (
  select 1 from public.site_testimonials where author_name = 'Martine'
);

insert into public.site_testimonials (author_name, quote, rating, published, source)
select
  'Madalena',
  $quote$Merci encore pour ce bel échange. J’ai beaucoup aimé notre discussion, j’en ressors avec d’excellents conseils que je vais pouvoir mettre en pratique. Vous êtes une personne vraiment douce et bienveillante, ça se sent que vous êtes passionnée par ce que vous faites, et c’est très inspirant. Votre écoute, votre professionnalisme et votre façon d’expliquer les choses avec clarté m’ont beaucoup touchée. Merci pour votre temps et votre gentillesse !$quote$,
  5,
  true,
  'admin'
where not exists (
  select 1 from public.site_testimonials where author_name = 'Madalena'
);
