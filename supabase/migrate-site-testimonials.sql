-- Awura Beauty — témoignages site + invitations par lien (envoyées au client).
-- Idempotent.

create table if not exists public.site_testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  quote text not null,
  rating int not null check (rating between 1 and 5),
  image_url text not null default '',
  published boolean not null default true,
  source text not null default 'invite'
    check (source in ('invite', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists site_testimonials_published_idx
  on public.site_testimonials (published, created_at desc);

create table if not exists public.testimonial_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  note text not null default '',
  expires_at timestamptz not null,
  used_at timestamptz,
  testimonial_id uuid references public.site_testimonials (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists testimonial_invites_expires_idx
  on public.testimonial_invites (expires_at);

alter table public.site_testimonials enable row level security;
alter table public.testimonial_invites enable row level security;

drop policy if exists site_testimonials_public_read on public.site_testimonials;
create policy site_testimonials_public_read
  on public.site_testimonials
  for select
  to anon, authenticated
  using (published = true);
