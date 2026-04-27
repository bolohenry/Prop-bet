-- Wedding Prop Bets — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → paste → Run
--
-- If migrating from an older schema, see migrations/ folder for incremental scripts.

-- 1. Tables

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  date text,
  admin_code text unique not null,
  invite_code text unique not null,
  status text not null default 'open',
  tie_breaker_answer text,
  tie_winner_name text,
  creator_id uuid,
  teams_enabled boolean not null default false,
  reveal_mode boolean not null default false,
  reveal_order jsonb,
  current_reveal_index integer not null default -1,
  created_at timestamptz not null default now()
);

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

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  display_name text not null,
  avatar text,
  email text,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}',
  wager_3x text,
  wager_2x text,
  total_points integer not null default 0,
  team_id uuid,
  unique(event_id, display_name)
);

create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question_id text not null,
  answer text,
  resolved boolean not null default false,
  unique(event_id, question_id)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  unique(event_id, name)
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text,
  status text not null default 'invited',
  submission_id uuid,
  created_at timestamptz not null default now()
);

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

-- 2. Indexes

create index if not exists idx_questions_event on questions(event_id);
create index if not exists idx_submissions_event on submissions(event_id);
create index if not exists idx_outcomes_event on outcomes(event_id);
create index if not exists idx_events_invite on events(invite_code);
create index if not exists idx_events_admin on events(admin_code);
create index if not exists idx_teams_event on teams(event_id);
create index if not exists idx_guests_event on guests(event_id);

-- 3. Row Level Security — wide open for MVP (anon key is fine)
--    The admin_code in URLs acts as the access control.

alter table events enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table outcomes enable row level security;
alter table teams enable row level security;
alter table guests enable row level security;
alter table templates enable row level security;

create policy "events_all" on events for all using (true) with check (true);
create policy "questions_all" on questions for all using (true) with check (true);
create policy "submissions_all" on submissions for all using (true) with check (true);
create policy "outcomes_all" on outcomes for all using (true) with check (true);
create policy "teams_all" on teams for all using (true) with check (true);
create policy "guests_all" on guests for all using (true) with check (true);
create policy "templates_all" on templates for all using (true) with check (true);

-- 4. Enable Realtime on tables that update live

alter publication supabase_realtime add table submissions;
alter publication supabase_realtime add table outcomes;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table questions;

-- 5. Scoring function — dynamic, reads from questions table + JSONB answers

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

-- 6. Seed system templates

insert into templates (name, description, category, questions, is_system) values
(
  'Classic Wedding',
  'The original wedding prop bet questions — neon signs, speeches, bouquet toss, and more.',
  'wedding',
  '[
    {"key":"q2","label":"Your name","type":"text","scored":false,"isName":true},
    {"key":"q3","label":"Will there be a neon sign?","type":"yesno","scored":true},
    {"key":"q4","label":"Will there be a photo booth?","type":"yesno","scored":true},
    {"key":"q5","label":"Will there be a sweetheart table?","type":"yesno","scored":true},
    {"key":"q6","label":"Will there be a choreographed first dance?","type":"yesno","scored":true},
    {"key":"q7","label":"Will the best man speech be over/under 5.5 minutes?","type":"overunder","scored":true},
    {"key":"q8","label":"Will the maid of honor speech be over/under 5.5 minutes?","type":"overunder","scored":true},
    {"key":"q9","label":"Will the best man tell the bride she looks beautiful AND thank both parents tonight?","type":"yesno","scored":true},
    {"key":"q10","label":"Will the bride or groom''s job be mentioned in maid of honor/best man speech?","type":"yesno","scored":true},
    {"key":"q11","label":"Will there be a bouquet toss?","type":"yesno","scored":true},
    {"key":"q12","label":"What will the cake flavor be?","type":"choice","scored":true,"options":["Vanilla","Chocolate","Fruit","Other"]},
    {"key":"q13","label":"Will Mr. Brightside be played?","type":"yesno","scored":true},
    {"key":"q14","label":"Will the bride do a dress change before the after party?","type":"yesno","scored":true},
    {"key":"q15","label":"Tie breaker — what time will the bride leave the after party?","type":"time","scored":false,"isTiebreaker":true}
  ]'::jsonb,
  true
),
(
  'Baby Shower',
  'Fun predictions for baby showers — gender guesses, gift themes, and party games.',
  'baby_shower',
  '[
    {"key":"q1","label":"Your name","type":"text","scored":false,"isName":true},
    {"key":"q2","label":"Will the baby be a boy or a girl?","type":"choice","scored":true,"options":["Boy","Girl"]},
    {"key":"q3","label":"How much will the baby weigh?","type":"choice","scored":true,"options":["Under 7 lbs","7-8 lbs","Over 8 lbs"]},
    {"key":"q4","label":"Will there be a diaper-changing race?","type":"yesno","scored":true},
    {"key":"q5","label":"Will someone cry during gifts?","type":"yesno","scored":true},
    {"key":"q6","label":"Will there be a gender reveal moment?","type":"yesno","scored":true},
    {"key":"q7","label":"What color will the cake be?","type":"choice","scored":true,"options":["Pink","Blue","Yellow","White","Other"]},
    {"key":"q8","label":"Will the mom-to-be open more than 20 gifts?","type":"yesno","scored":true},
    {"key":"q9","label":"Tie breaker — what time will the party end?","type":"time","scored":false,"isTiebreaker":true}
  ]'::jsonb,
  true
),
(
  'Birthday Party',
  'Birthday celebration bets — candles, cake, and party predictions.',
  'birthday',
  '[
    {"key":"q1","label":"Your name","type":"text","scored":false,"isName":true},
    {"key":"q2","label":"Will they blow out all candles in one breath?","type":"yesno","scored":true},
    {"key":"q3","label":"What flavor will the cake be?","type":"choice","scored":true,"options":["Chocolate","Vanilla","Red Velvet","Other"]},
    {"key":"q4","label":"Will there be a surprise guest?","type":"yesno","scored":true},
    {"key":"q5","label":"Will karaoke happen?","type":"yesno","scored":true},
    {"key":"q6","label":"Will the birthday person cry?","type":"yesno","scored":true},
    {"key":"q7","label":"Over/under 30 people at the party?","type":"overunder","scored":true},
    {"key":"q8","label":"Tie breaker — what time will the birthday person leave?","type":"time","scored":false,"isTiebreaker":true}
  ]'::jsonb,
  true
),
(
  'Super Bowl Party',
  'Game-day predictions for Super Bowl watch parties.',
  'sports',
  '[
    {"key":"q1","label":"Your name","type":"text","scored":false,"isName":true},
    {"key":"q2","label":"Who will win the coin toss?","type":"choice","scored":true,"options":["Heads","Tails"]},
    {"key":"q3","label":"Will there be a safety?","type":"yesno","scored":true},
    {"key":"q4","label":"Over/under 49.5 total points?","type":"overunder","scored":true},
    {"key":"q5","label":"Will the halftime performer have a wardrobe change?","type":"yesno","scored":true},
    {"key":"q6","label":"Will a field goal be missed?","type":"yesno","scored":true},
    {"key":"q7","label":"Will there be a pick-six?","type":"yesno","scored":true},
    {"key":"q8","label":"Best commercial category?","type":"choice","scored":true,"options":["Beer","Cars","Tech","Food","Other"]},
    {"key":"q9","label":"Tie breaker — total combined score?","type":"text","scored":false,"isTiebreaker":true}
  ]'::jsonb,
  true
);
