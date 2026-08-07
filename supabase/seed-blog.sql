-- Articles & tutoriels Awura Beauty
-- Exécuter dans l'éditeur SQL Supabase

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('article', 'tutorial')),
  title text not null,
  excerpt text not null default '',
  cover_image_url text not null,
  published_at date not null default current_date,
  product_slug text references public.products (slug) on delete set null,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_kind_idx on public.blog_posts (kind);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

create policy "Blog posts are publicly readable"
  on public.blog_posts
  for select
  to anon, authenticated
  using (true);
