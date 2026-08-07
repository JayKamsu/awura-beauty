-- Mise en page des pages (CMS affichage)
create table if not exists public.page_layouts (
  page_key text primary key,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.page_layouts enable row level security;

drop policy if exists "Page layouts are publicly readable" on public.page_layouts;
create policy "Page layouts are publicly readable"
  on public.page_layouts for select to anon, authenticated using (true);

-- Seed accueil
insert into public.page_layouts (page_key, sections) values
(
  'home',
  '[
    {"id":"hero","enabled":true},
    {"id":"promises","enabled":true},
    {"id":"bestsellers","enabled":true},
    {"id":"ingredients","enabled":true},
    {"id":"feature","enabled":true},
    {"id":"testimonials","enabled":true}
  ]'::jsonb
),
(
  'about',
  '[
    {"id":"story","enabled":true},
    {"id":"mission","enabled":true},
    {"id":"commitments","enabled":true},
    {"id":"cta","enabled":true}
  ]'::jsonb
)
on conflict (page_key) do nothing;
