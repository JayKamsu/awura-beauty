-- Diagnostic Awura v3 : images d'option, réponse "Je ne sais pas", notes libres et
-- photos jointes (face / profil gauche / profil droit / arrière / pointes).

-- ── Nouvelles colonnes ───────────────────────────────────
alter table public.diagnostic_options
  add column if not exists image_url text;

alter table public.diagnostic_questions
  add column if not exists allow_unknown boolean not null default false;

alter table public.hair_diagnostics
  add column if not exists notes text,
  add column if not exists photos jsonb not null default '[]'::jsonb;

alter table public.diagnostic_appointments
  add column if not exists photos jsonb not null default '[]'::jsonb;

-- ── Ajoute "Chute" comme réponse (concern / goal) si absente ─────
do $$
declare
  qid uuid;
begin
  select id into qid from public.diagnostic_questions where question_key = 'goal';
  if qid is not null then
    insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules)
    select qid, 'hair_loss', coalesce((select max(position) + 1 from public.diagnostic_options where question_id = qid), 0),
      'Chute', 'Hair loss', 'Caída',
      'Freiner la chute et stimuler la repousse', 'Slow shedding and boost regrowth', 'Frenar la caída y estimular el crecimiento',
      '{"lotion-repousse":5}'::jsonb
    where not exists (
      select 1 from public.diagnostic_options where question_id = qid and value_key = 'hair_loss'
    );
  end if;

  select id into qid from public.diagnostic_questions where question_key = 'phys_concern';
  if qid is not null then
    insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules)
    select qid, 'hair_loss', coalesce((select max(position) + 1 from public.diagnostic_options where question_id = qid), 0),
      'Chute', 'Hair loss', 'Caída', '', '', '', '{}'::jsonb
    where not exists (
      select 1 from public.diagnostic_options where question_id = qid and value_key = 'hair_loss'
    );
  end if;
end $$;

-- ── Ajoute l'option "Je ne sais pas" + active allow_unknown sur les
--    questions où c'est pertinent, si absente ───────────────────
do $$
declare
  qkey text;
  qid uuid;
begin
  foreach qkey in array array['texture', 'porosity', 'scalp', 'detangle', 'phys_texture', 'phys_concern']
  loop
    select id into qid from public.diagnostic_questions where question_key = qkey;
    if qid is null then
      continue;
    end if;

    update public.diagnostic_questions set allow_unknown = true where id = qid;

    insert into public.diagnostic_options (question_id, value_key, position, label_fr, label_en, label_es, hint_fr, hint_en, hint_es, score_rules)
    select qid, 'dont_know', coalesce((select max(position) + 1 from public.diagnostic_options where question_id = qid), 0),
      'Je ne sais pas', 'I don''t know', 'No lo sé', '', '', '', '{}'::jsonb
    where not exists (
      select 1 from public.diagnostic_options where question_id = qid and value_key = 'dont_know'
    );
  end loop;
end $$;

-- ── Images illustratives sur la question texture (online + physical_pre) ──
do $$
declare
  qkey text;
  qid uuid;
begin
  foreach qkey in array array['texture', 'phys_texture']
  loop
    select id into qid from public.diagnostic_questions where question_key = qkey;
    if qid is null then
      continue;
    end if;

    update public.diagnostic_options set image_url = 'https://images.unsplash.com/photo-1613498382159-0972b7b4c9f1?w=320&q=75&fit=crop&crop=faces' where question_id = qid and value_key = '4a';
    update public.diagnostic_options set image_url = 'https://images.unsplash.com/photo-1632765866070-3fadf25d3d5b?w=320&q=75&fit=crop&crop=faces' where question_id = qid and value_key = '4b';
    update public.diagnostic_options set image_url = 'https://images.unsplash.com/photo-1565357419076-6acd4a10094e?w=320&q=75&fit=crop&crop=faces' where question_id = qid and value_key = '4c';
    update public.diagnostic_options set image_url = 'https://images.unsplash.com/photo-1568046738123-300caca6d0ca?w=320&q=75&fit=crop&crop=faces' where question_id = qid and value_key = '3abc';
    update public.diagnostic_options set image_url = 'https://images.unsplash.com/photo-1625536658395-2bd89a631e37?w=320&q=75&fit=crop&crop=faces' where question_id = qid and value_key = 'locs';
  end loop;
end $$;

-- ── Notes explicatives (porosité : test du verre d'eau) ──────────
update public.diagnostic_questions set
  subtitle_fr = 'La porosité guide l’hydratation et le scellement. Astuce : un cheveu propre et sec flotte (faible porosité) ou coule vite (forte porosité) dans un verre d’eau.',
  subtitle_en = 'Porosity guides hydration and sealing. Tip: a clean, dry strand floats (low porosity) or sinks fast (high porosity) in a glass of water.',
  subtitle_es = 'La porosidad guía la hidratación y el sellado. Truco: un mechón limpio y seco flota (baja porosidad) o se hunde rápido (alta) en un vaso de agua.'
where question_key = 'porosity';
