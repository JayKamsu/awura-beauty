-- Diagnostic Awura v2 : questionnaire admin, prix, créneaux, RDV physique.

-- ── Settings ─────────────────────────────────────────────
create table if not exists public.diagnostic_settings (
  id text primary key default 'default',
  online_price_cents int not null default 0,
  online_compare_cents int not null default 9000,
  physical_price_cents int not null default 3980,
  physical_compare_cents int not null default 15000,
  slot_duration_minutes int not null default 45,
  physical_location_text text not null default '',
  currency text not null default 'EUR',
  updated_at timestamptz not null default now()
);

insert into public.diagnostic_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.diagnostic_settings enable row level security;

drop policy if exists "Diagnostic settings publicly readable" on public.diagnostic_settings;
create policy "Diagnostic settings publicly readable"
  on public.diagnostic_settings for select to anon, authenticated using (true);

-- ── Questions / options ──────────────────────────────────
create table if not exists public.diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  channel text not null check (channel in ('online', 'physical_pre', 'both')),
  position int not null default 0,
  enabled boolean not null default true,
  title_fr text not null default '',
  title_en text not null default '',
  title_es text not null default '',
  subtitle_fr text not null default '',
  subtitle_en text not null default '',
  subtitle_es text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.diagnostic_questions (id) on delete cascade,
  value_key text not null,
  position int not null default 0,
  enabled boolean not null default true,
  label_fr text not null default '',
  label_en text not null default '',
  label_es text not null default '',
  hint_fr text not null default '',
  hint_en text not null default '',
  hint_es text not null default '',
  score_rules jsonb not null default '{}'::jsonb,
  unique (question_id, value_key)
);

create index if not exists diagnostic_questions_channel_idx
  on public.diagnostic_questions (channel, position);
create index if not exists diagnostic_options_question_idx
  on public.diagnostic_options (question_id, position);

alter table public.diagnostic_questions enable row level security;
alter table public.diagnostic_options enable row level security;

drop policy if exists "Diagnostic questions publicly readable" on public.diagnostic_questions;
create policy "Diagnostic questions publicly readable"
  on public.diagnostic_questions for select to anon, authenticated using (true);

drop policy if exists "Diagnostic options publicly readable" on public.diagnostic_options;
create policy "Diagnostic options publicly readable"
  on public.diagnostic_options for select to anon, authenticated using (true);

-- ── Availability ─────────────────────────────────────────
create table if not exists public.diagnostic_availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  enabled boolean not null default true,
  unique (weekday, start_time, end_time)
);

create table if not exists public.diagnostic_slot_overrides (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  kind text not null check (kind in ('open', 'blocked')),
  note text not null default '',
  unique (starts_at, ends_at, kind)
);

create index if not exists diagnostic_slot_overrides_range_idx
  on public.diagnostic_slot_overrides (starts_at, ends_at);

alter table public.diagnostic_availability_rules enable row level security;
alter table public.diagnostic_slot_overrides enable row level security;

drop policy if exists "Diagnostic rules publicly readable" on public.diagnostic_availability_rules;
create policy "Diagnostic rules publicly readable"
  on public.diagnostic_availability_rules for select to anon, authenticated using (true);

drop policy if exists "Diagnostic overrides publicly readable" on public.diagnostic_slot_overrides;
create policy "Diagnostic overrides publicly readable"
  on public.diagnostic_slot_overrides for select to anon, authenticated using (true);

-- ── Appointments ─────────────────────────────────────────
create table if not exists public.diagnostic_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  amount_cents int not null default 3980,
  currency text not null default 'EUR',
  stripe_session_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diagnostic_appointments_starts_idx
  on public.diagnostic_appointments (starts_at);
create index if not exists diagnostic_appointments_user_idx
  on public.diagnostic_appointments (user_id);
create index if not exists diagnostic_appointments_status_idx
  on public.diagnostic_appointments (status);

alter table public.diagnostic_appointments enable row level security;

drop policy if exists "Users read own diagnostic appointments" on public.diagnostic_appointments;
create policy "Users read own diagnostic appointments"
  on public.diagnostic_appointments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own diagnostic appointments" on public.diagnostic_appointments;
create policy "Users insert own diagnostic appointments"
  on public.diagnostic_appointments for insert to authenticated
  with check (auth.uid() = user_id);

-- ── Extend hair_diagnostics ──────────────────────────────
alter table public.hair_diagnostics
  add column if not exists channel text not null default 'online';
alter table public.hair_diagnostics
  add column if not exists appointment_id uuid references public.diagnostic_appointments (id) on delete set null;
alter table public.hair_diagnostics
  add column if not exists routine jsonb not null default '[]'::jsonb;

-- ── Seed settings defaults already inserted ──────────────

-- ── Seed weekly rules (Tue–Sat 10:00–18:00) ───────────────
insert into public.diagnostic_availability_rules (weekday, start_time, end_time, enabled)
select w, '10:00'::time, '18:00'::time, true
from unnest(array[2,3,4,5,6]) as w
on conflict do nothing;

-- ── Seed questions (online + physical_pre) ───────────────
-- Cleared only if empty to avoid wiping admin edits on re-run.
do $$
declare
  qid uuid;
begin
  if exists (select 1 from public.diagnostic_questions limit 1) then
    return;
  end if;

  -- ONLINE: texture
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'texture', 'online', 0, true,
    'Quelle est la texture de ta couronne ?',
    'What is your crown texture?',
    '¿Cuál es la textura de tu corona?',
    'Choisis la description la plus proche de tes cheveux au naturel.',
    'Pick the description closest to your natural hair.',
    'Elige la descripción más cercana a tu cabello natural.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, '4a', 0, '4A — Bouclés serrés', '4A — Tight curls', '4A — Rizos apretados', 'Ressorts définis', 'Defined springs', 'Muelles definidos', '{"demelant-nourrissant":1,"beurre-capillaire":1}'::jsonb),
    (qid, '4b', 1, '4B — Crépus', '4B — Coily', '4B — Crespo', 'Angles en Z', 'Z-pattern', 'Patrón en Z', '{"beurre-capillaire":2,"masque-capillaire":1}'::jsonb),
    (qid, '4c', 2, '4C — Très crépus', '4C — Very coily', '4C — Muy crespo', 'Shrinkage fort', 'Strong shrinkage', 'Encogimiento fuerte', '{"beurre-capillaire":3,"demelant-nourrissant":2}'::jsonb),
    (qid, '3abc', 3, '3A–3C — Bouclés', '3A–3C — Curly', '3A–3C — Rizado', 'Boucles souples', 'Soft curls', 'Rizos suaves', '{"demelant-nourrissant":2}'::jsonb),
    (qid, 'locs', 4, 'Locs / Tresses', 'Locs / Braids', 'Locs / Trenzas', 'Styles protégés', 'Protective styles', 'Estilos protectores', '{"lotion-repousse":3,"savon-solide":2}'::jsonb);

  -- ONLINE: porosity
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'porosity', 'online', 1, true,
    'Comment ton cheveu absorbe-t-il l’eau et les soins ?',
    'How does your hair absorb water and products?',
    '¿Cómo absorbe tu cabello el agua y los productos?',
    'La porosité guide l’hydratation et le scellement.',
    'Porosity guides hydration and sealing.',
    'La porosidad guía la hidratación y el sellado.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'low', 0, 'Faible', 'Low', 'Baja', 'L’eau perle, soins lents à pénétrer', 'Water beads, products sit on top', 'El agua perla, los productos tardan', '{"demelant-nourrissant":3,"masque-capillaire":2}'::jsonb),
    (qid, 'medium', 1, 'Moyenne', 'Medium', 'Media', 'Équilibre absorption / rétention', 'Balanced absorb & retain', 'Absorbe y retiene bien', '{"masque-capillaire":2,"beurre-capillaire":2}'::jsonb),
    (qid, 'high', 2, 'Élevée', 'High', 'Alta', 'Absorbe vite, sèche rapidement', 'Absorbs fast, dries fast', 'Absorbe rápido, se seca rápido', '{"beurre-capillaire":4,"masque-capillaire":3}'::jsonb);

  -- ONLINE: scalp
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'scalp', 'online', 2, true,
    'Comment va ton cuir chevelu ?',
    'How is your scalp?',
    '¿Cómo está tu cuero cabelludo?',
    'Un cuir chevelu confortable, c’est la base de la pousse.',
    'A comfortable scalp is the foundation of growth.',
    'Un cuero cabelludo cómodo es la base del crecimiento.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'dry', 0, 'Sec / tiraillements', 'Dry / tight', 'Seco / tirante', 'Manque de confort', 'Lacks comfort', 'Falta de confort', '{"lotion-repousse":3,"beurre-capillaire":2}'::jsonb),
    (qid, 'oily', 1, 'Gras', 'Oily', 'Graso', 'Racines vite luisantes', 'Roots get shiny fast', 'Raíces brillantes pronto', '{"savon-solide":4}'::jsonb),
    (qid, 'sensitive', 2, 'Sensible', 'Sensitive', 'Sensible', 'Réagit facilement', 'Reacts easily', 'Reacciona fácilmente', '{"savon-solide":2,"lotion-repousse":2}'::jsonb),
    (qid, 'flaky', 3, 'Pellicules / squames', 'Flaky', 'Con caspa', 'Besoin de purification douce', 'Needs gentle cleanse', 'Necesita limpieza suave', '{"savon-solide":3,"lotion-repousse":3}'::jsonb),
    (qid, 'balanced', 4, 'Équilibré', 'Balanced', 'Equilibrado', 'Confort stable', 'Stable comfort', 'Confort estable', '{"demelant-nourrissant":1}'::jsonb);

  -- ONLINE: detangle
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'detangle', 'online', 3, true,
    'Comment se passe le démêlage ?',
    'How is detangling?',
    '¿Cómo es el desenredo?',
    'On adapte le démêlant et le temps de pose.',
    'We adapt conditioner and leave-in time.',
    'Adaptamos el acondicionador y el tiempo.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'easy', 0, 'Facile', 'Easy', 'Fácil', 'Peu de casse', 'Little breakage', 'Poca rotura', '{"demelant-nourrissant":1}'::jsonb),
    (qid, 'moderate', 1, 'Moyen', 'Moderate', 'Moderado', 'Quelques nœuds', 'Some knots', 'Algunos nudos', '{"demelant-nourrissant":3}'::jsonb),
    (qid, 'hard', 2, 'Difficile / casse', 'Hard / breakage', 'Difícil / rotura', 'Besoin de nutrition intense', 'Needs intense nutrition', 'Necesita nutrición intensa', '{"demelant-nourrissant":5,"masque-capillaire":2}'::jsonb);

  -- ONLINE: goal
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'goal', 'online', 4, true,
    'Quel est ton objectif principal ?',
    'What is your main goal?',
    '¿Cuál es tu objetivo principal?',
    'On priorise une routine claire autour de ton but.',
    'We prioritize a clear routine around your goal.',
    'Priorizamos una rutina clara según tu meta.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'hydration', 0, 'Hydratation longue durée', 'Lasting hydration', 'Hidratación duradera', 'Sceller l’humidité', 'Seal moisture', 'Sellar humedad', '{"beurre-capillaire":5,"masque-capillaire":3}'::jsonb),
    (qid, 'length', 1, 'Pousse / longueur', 'Growth / length', 'Crecimiento / largo', 'Activer le cuir chevelu', 'Activate scalp', 'Activar cuero cabelludo', '{"lotion-repousse":5,"masque-capillaire":2}'::jsonb),
    (qid, 'definition', 2, 'Définition & souplesse', 'Definition & softness', 'Definición y suavidad', 'Démêler sans casser', 'Detangle without break', 'Desenredar sin romper', '{"demelant-nourrissant":4,"beurre-capillaire":3}'::jsonb),
    (qid, 'repair', 3, 'Réparation / force', 'Repair / strength', 'Reparación / fuerza', 'Fibre fragilisée', 'Fragile fiber', 'Fibra frágil', '{"masque-capillaire":5,"beurre-capillaire":3}'::jsonb),
    (qid, 'volume', 4, 'Volume & légèreté', 'Volume & lightness', 'Volumen y ligereza', 'Sans alourdir', 'Without weighing down', 'Sin pesar', '{"savon-solide":2,"lotion-repousse":3,"demelant-nourrissant":2}'::jsonb);

  -- ONLINE: current routine
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'routine', 'online', 5, true,
    'Quelle est ta routine actuelle ?',
    'What is your current routine?',
    '¿Cuál es tu rutina actual?',
    'On complète ce qui manque dans ta gamme.',
    'We fill the gaps in your regimen.',
    'Completamos lo que falta en tu rutina.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'minimal', 0, 'Minimale', 'Minimal', 'Mínima', 'Peu de produits', 'Few products', 'Pocos productos', '{"savon-solide":2,"demelant-nourrissant":2,"beurre-capillaire":2}'::jsonb),
    (qid, 'wash_day', 1, 'Wash day complet', 'Full wash day', 'Día de lavado completo', 'Lavage + soins réguliers', 'Wash + care regularly', 'Lavado + cuidado regular', '{"masque-capillaire":2}'::jsonb),
    (qid, 'protective', 2, 'Styles protégés souvent', 'Often protective styles', 'Estilos protectores a menudo', 'Focus racines & hydratation', 'Focus roots & moisture', 'Foco raíces e hidratación', '{"lotion-repousse":3,"beurre-capillaire":2}'::jsonb),
    (qid, 'heat', 3, 'Chaleur / brushings', 'Heat / blowouts', 'Calor / peinados', 'Besoin de réparation', 'Needs repair', 'Necesita reparación', '{"masque-capillaire":4,"beurre-capillaire":2}'::jsonb);

  -- ONLINE: constraint
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'constraint', 'online', 6, true,
    'Quelle contrainte veux-tu respecter ?',
    'Which constraint should we respect?',
    '¿Qué restricción debemos respetar?',
    'Temps, simplicité ou intensité des soins.',
    'Time, simplicity, or care intensity.',
    'Tiempo, simplicidad o intensidad.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'fast', 0, 'Routine rapide', 'Quick routine', 'Rutina rápida', 'Essentiels seulement', 'Essentials only', 'Solo esenciales', '{"savon-solide":1,"beurre-capillaire":2}'::jsonb),
    (qid, 'complete', 1, 'Routine complète Awura', 'Full Awura routine', 'Rutina Awura completa', 'Les 5 gestes de la gamme', 'All 5 range steps', 'Los 5 gestos de la gama', '{"savon-solide":2,"demelant-nourrissant":2,"masque-capillaire":2,"lotion-repousse":2,"beurre-capillaire":2}'::jsonb),
    (qid, 'growth_focus', 2, 'Focus pousse', 'Growth focus', 'Foco crecimiento', 'Lotion + hydratation', 'Lotion + moisture', 'Loción + hidratación', '{"lotion-repousse":4,"beurre-capillaire":2}'::jsonb);

  -- PHYSICAL PRE: texture
  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'phys_texture', 'physical_pre', 0, true,
    'Texture principale',
    'Main texture',
    'Textura principal',
    'Pour préparer ton rendez-vous en salon.',
    'To prepare your in-person appointment.',
    'Para preparar tu cita en salón.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, '4a', 0, '4A', '4A', '4A', '', '', '', '{}'::jsonb),
    (qid, '4b', 1, '4B', '4B', '4B', '', '', '', '{}'::jsonb),
    (qid, '4c', 2, '4C', '4C', '4C', '', '', '', '{}'::jsonb),
    (qid, '3abc', 3, '3A–3C', '3A–3C', '3A–3C', '', '', '', '{}'::jsonb),
    (qid, 'locs', 4, 'Locs / Tresses', 'Locs / Braids', 'Locs / Trenzas', '', '', '', '{}'::jsonb);

  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'phys_goal', 'physical_pre', 1, true,
    'Objectif du rendez-vous',
    'Appointment goal',
    'Objetivo de la cita',
    'Ce que tu veux approfondir en physique.',
    'What you want to go deeper on in person.',
    'Lo que quieres profundizar en persona.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'hydration', 0, 'Hydratation', 'Hydration', 'Hidratación', '', '', '', '{}'::jsonb),
    (qid, 'length', 1, 'Pousse', 'Growth', 'Crecimiento', '', '', '', '{}'::jsonb),
    (qid, 'repair', 2, 'Réparation', 'Repair', 'Reparación', '', '', '', '{}'::jsonb),
    (qid, 'routine', 3, 'Routine complète', 'Full routine', 'Rutina completa', '', '', '', '{}'::jsonb);

  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'phys_concern', 'physical_pre', 2, true,
    'Souci principal',
    'Main concern',
    'Preocupación principal',
    'Ce que tu ressens le plus au quotidien.',
    'What you feel most day to day.',
    'Lo que más sientes a diario.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'dryness', 0, 'Sécheresse', 'Dryness', 'Sequedad', '', '', '', '{}'::jsonb),
    (qid, 'breakage', 1, 'Casse', 'Breakage', 'Rotura', '', '', '', '{}'::jsonb),
    (qid, 'scalp', 2, 'Cuir chevelu', 'Scalp', 'Cuero cabelludo', '', '', '', '{}'::jsonb),
    (qid, 'growth', 3, 'Pousse lente', 'Slow growth', 'Crecimiento lento', '', '', '', '{}'::jsonb);

  insert into public.diagnostic_questions (
    question_key, channel, position, enabled,
    title_fr, title_en, title_es, subtitle_fr, subtitle_en, subtitle_es
  ) values (
    'phys_pref', 'physical_pre', 3, true,
    'Moment préféré',
    'Preferred time of day',
    'Momento preferido',
    'On priorise les créneaux proches de ta préférence.',
    'We prioritize slots near your preference.',
    'Priorizamos franjas cercanas a tu preferencia.'
  ) returning id into qid;
  insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules) values
    (qid, 'morning', 0, 'Matin', 'Morning', 'Mañana', '', '', '', '{}'::jsonb),
    (qid, 'afternoon', 1, 'Après-midi', 'Afternoon', 'Tarde', '', '', '', '{}'::jsonb),
    (qid, 'flexible', 2, 'Flexible', 'Flexible', 'Flexible', '', '', '', '{}'::jsonb);
end $$;
