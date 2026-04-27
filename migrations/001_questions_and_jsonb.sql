-- Migration 001: Add questions table, JSONB answers, teams, guests, templates
-- Run this in Supabase SQL Editor if you have an existing database.

-- 1. Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question_key text not null,
  label text not null,
  type text not null,
  options jsonb,
  scored boolean not null default true,
  is_name boolean not null default false,
  is_tiebreaker boolean not null default false,
  sort_order integer not null default 0,
  unique(event_id, question_key)
);
create index if not exists idx_questions_event on questions(event_id);
alter table questions enable row level security;
create policy "questions_all" on questions for all using (true) with check (true);

-- 2. Add JSONB answers column to submissions (keeps old q2-q15 for backward compat)
alter table submissions add column if not exists answers jsonb not null default '{}';
alter table submissions add column if not exists email text;
alter table submissions add column if not exists team_id uuid;

-- 3. Events: add new columns
alter table events add column if not exists creator_id uuid;
alter table events add column if not exists teams_enabled boolean not null default false;
alter table events add column if not exists reveal_mode boolean not null default false;
alter table events add column if not exists reveal_order jsonb;
alter table events add column if not exists current_reveal_index integer not null default -1;

-- 4. Teams table
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique(event_id, name)
);
create index if not exists idx_teams_event on teams(event_id);
alter table teams enable row level security;
create policy "teams_all" on teams for all using (true) with check (true);

-- 5. Guests table
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text,
  status text not null default 'invited',
  submission_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_guests_event on guests(event_id);
alter table guests enable row level security;
create policy "guests_all" on guests for all using (true) with check (true);

-- 6. Templates table
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  questions jsonb not null,
  is_system boolean not null default false,
  creator_id uuid,
  created_at timestamptz not null default now()
);
alter table templates enable row level security;
create policy "templates_all" on templates for all using (true) with check (true);

-- 7. Enable realtime on questions
alter publication supabase_realtime add table questions;

-- 8. Migrate existing submission data from q2-q15 columns into answers JSONB
update submissions set answers = jsonb_build_object(
  'q2', coalesce(q2, ''),
  'q3', coalesce(q3, ''),
  'q4', coalesce(q4, ''),
  'q5', coalesce(q5, ''),
  'q6', coalesce(q6, ''),
  'q7', coalesce(q7, ''),
  'q8', coalesce(q8, ''),
  'q9', coalesce(q9, ''),
  'q10', coalesce(q10, ''),
  'q11', coalesce(q11, ''),
  'q12', coalesce(q12, ''),
  'q13', coalesce(q13, ''),
  'q14', coalesce(q14, ''),
  'q15', coalesce(q15, '')
)
where answers = '{}'::jsonb;

-- 9. Seed questions rows for existing events (classic wedding template)
insert into questions (event_id, question_key, label, type, options, scored, is_name, is_tiebreaker, sort_order)
select e.id, q.key, q.label, q.type, q.options, q.scored, q.is_name, q.is_tiebreaker, q.sort_order
from events e
cross join (
  values
    ('q2', 'Your name', 'text', null::jsonb, false, true, false, 0),
    ('q3', 'Will there be a neon sign?', 'yesno', null, true, false, false, 1),
    ('q4', 'Will there be a photo booth?', 'yesno', null, true, false, false, 2),
    ('q5', 'Will there be a sweetheart table?', 'yesno', null, true, false, false, 3),
    ('q6', 'Will there be a choreographed first dance?', 'yesno', null, true, false, false, 4),
    ('q7', 'Will the best man speech be over/under 5.5 minutes?', 'overunder', null, true, false, false, 5),
    ('q8', 'Will the maid of honor speech be over/under 5.5 minutes?', 'overunder', null, true, false, false, 6),
    ('q9', 'Will the best man tell the bride she looks beautiful AND thank both parents tonight?', 'yesno', null, true, false, false, 7),
    ('q10', 'Will the bride or groom''s job be mentioned in maid of honor/best man speech?', 'yesno', null, true, false, false, 8),
    ('q11', 'Will there be a bouquet toss?', 'yesno', null, true, false, false, 9),
    ('q12', 'What will the cake flavor be?', 'choice', '["Vanilla","Chocolate","Fruit","Other"]'::jsonb, true, false, false, 10),
    ('q13', 'Will Mr. Brightside be played?', 'yesno', null, true, false, false, 11),
    ('q14', 'Will the bride do a dress change before the after party?', 'yesno', null, true, false, false, 12),
    ('q15', 'Tie breaker — what time will the bride leave the after party?', 'time', null, false, false, true, 13)
) as q(key, label, type, options, scored, is_name, is_tiebreaker, sort_order)
where not exists (select 1 from questions where questions.event_id = e.id);

-- 10. Updated scoring function (dynamic, reads from questions + JSONB answers)
create or replace function recalc_scores(p_event_id uuid)
returns void as $$
declare
  sub record;
  outcome record;
  scored_keys text[];
  pts integer;
  multiplier integer;
  qkey text;
begin
  select array_agg(question_key) into scored_keys
    from questions where event_id = p_event_id and scored = true;

  if scored_keys is null then return; end if;

  for sub in select id, answers, wager_3x, wager_2x
    from submissions where event_id = p_event_id
  loop
    pts := 0;
    for outcome in select question_id, answer from outcomes
      where event_id = p_event_id and resolved = true
        and question_id = any(scored_keys)
    loop
      qkey := outcome.question_id;
      multiplier := 1;
      if sub.wager_3x = qkey then multiplier := 3; end if;
      if sub.wager_2x = qkey then multiplier := 2; end if;
      if (sub.answers ->> qkey) = outcome.answer then
        pts := pts + multiplier;
      end if;
    end loop;
    update submissions set total_points = pts where id = sub.id;
  end loop;
end;
$$ language plpgsql security definer;
