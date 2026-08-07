-- Awura Beauty — CMS pages (sans jsonb), Storage, push, chat support
-- À exécuter dans SQL Editor ou via DATABASE_URL / setup.mjs

-- ── Storage bucket (policies) ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "Service role manage media" on storage.objects;
-- Les uploads passent par service_role (bypass RLS). Lecture publique OK.

-- ── CMS pages relationnel (remplace page_layouts.sections jsonb) ──
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  position int not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create table if not exists public.page_section_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.page_sections (id) on delete cascade,
  field_key text not null,
  locale text not null check (locale in ('fr', 'en', 'es')),
  value text not null default '',
  unique (section_id, field_key, locale)
);

create index if not exists page_sections_page_key_idx
  on public.page_sections (page_key);

create index if not exists page_section_fields_section_id_idx
  on public.page_section_fields (section_id);

alter table public.page_sections enable row level security;
alter table public.page_section_fields enable row level security;

drop policy if exists "Page sections publicly readable" on public.page_sections;
create policy "Page sections publicly readable"
  on public.page_sections for select to anon, authenticated using (true);

drop policy if exists "Page section fields publicly readable" on public.page_section_fields;
create policy "Page section fields publicly readable"
  on public.page_section_fields for select to anon, authenticated using (true);

-- Seed sections (home + about)
insert into public.page_sections (page_key, section_key, position, enabled) values
  ('home', 'hero', 0, true),
  ('home', 'promises', 1, true),
  ('home', 'bestsellers', 2, true),
  ('home', 'ingredients', 3, true),
  ('home', 'feature', 4, true),
  ('home', 'testimonials', 5, true),
  ('about', 'story', 0, true),
  ('about', 'mission', 1, true),
  ('about', 'commitments', 2, true),
  ('about', 'cta', 3, true)
on conflict (page_key, section_key) do nothing;

-- Ancienne table jsonb : conservée en lecture seule pour compat, plus utilisée par l'app
-- drop table if exists public.page_layouts;

-- ── Push subscriptions ───────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push tokens" on public.push_subscriptions;
create policy "Users manage own push tokens"
  on public.push_subscriptions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Anon insert push tokens" on public.push_subscriptions;
create policy "Anon insert push tokens"
  on public.push_subscriptions for insert to anon, authenticated
  with check (true);

-- ── Support chat ──────────────────────────────────────────
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_conversations_user_id_idx
  on public.support_conversations (user_id);

create index if not exists support_messages_conversation_id_idx
  on public.support_messages (conversation_id, created_at);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Users read own conversations" on public.support_conversations;
create policy "Users read own conversations"
  on public.support_conversations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own conversations" on public.support_conversations;
create policy "Users insert own conversations"
  on public.support_conversations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own conversations" on public.support_conversations;
create policy "Users update own conversations"
  on public.support_conversations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read own messages" on public.support_messages;
create policy "Users read own messages"
  on public.support_messages for select to authenticated
  using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own customer messages" on public.support_messages;
create policy "Users insert own customer messages"
  on public.support_messages for insert to authenticated
  with check (
    sender_role = 'customer'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Realtime
do $$
begin
  begin
    alter publication supabase_realtime add table public.support_messages;
  exception when duplicate_object then null;
  end;
end $$;
