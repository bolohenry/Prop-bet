-- Wedding Prop Bets — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → paste → Run
--
-- If you already created the old schema with a q1 column, run this first:
--   ALTER TABLE submissions DROP COLUMN IF EXISTS q1;

-- 1. Tables

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  date text not null,
  admin_code text unique not null,
  invite_code text unique not null,
  status text not null default 'open',
  tie_winner_name text,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  display_name text not null,
  submitted_at timestamptz not null default now(),
  q2 text, q3 text, q4 text, q5 text,
  q6 text, q7 text, q8 text, q9 text, q10 text,
  q11 text, q12 text, q13 text, q14 text, q15 text,
  total_points integer not null default 0,
  unique(event_id, display_name)
);

create table outcomes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question_id text not null,
  answer text,
  resolved boolean not null default false,
  unique(event_id, question_id)
);

-- 2. Indexes

create index idx_submissions_event on submissions(event_id);
create index idx_outcomes_event on outcomes(event_id);
create index idx_events_invite on events(invite_code);
create index idx_events_admin on events(admin_code);

-- 3. Row Level Security — wide open for MVP (anon key is fine)
--    The admin_code in URLs acts as the access control.

alter table events enable row level security;
alter table submissions enable row level security;
alter table outcomes enable row level security;

create policy "events_all" on events for all using (true) with check (true);
create policy "submissions_all" on submissions for all using (true) with check (true);
create policy "outcomes_all" on outcomes for all using (true) with check (true);

-- 4. Enable Realtime on tables that update live

alter publication supabase_realtime add table submissions;
alter publication supabase_realtime add table outcomes;
alter publication supabase_realtime add table events;

-- 5. Scoring function — recalculates all points for an event

create or replace function recalc_scores(p_event_id uuid)
returns void as $$
declare
  sub record;
  outcome record;
  pts integer;
  qid text;
  scored_ids text[] := array['q3','q4','q5','q6','q7','q8','q9','q10','q11','q12','q13','q14'];
begin
  for sub in select id, q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14 from submissions where event_id = p_event_id
  loop
    pts := 0;
    for outcome in select question_id, answer from outcomes where event_id = p_event_id and resolved = true
    loop
      qid := outcome.question_id;
      if qid = 'q3'  and sub.q3  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q4'  and sub.q4  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q5'  and sub.q5  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q6'  and sub.q6  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q7'  and sub.q7  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q8'  and sub.q8  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q9'  and sub.q9  = outcome.answer then pts := pts + 1; end if;
      if qid = 'q10' and sub.q10 = outcome.answer then pts := pts + 1; end if;
      if qid = 'q11' and sub.q11 = outcome.answer then pts := pts + 1; end if;
      if qid = 'q12' and sub.q12 = outcome.answer then pts := pts + 1; end if;
      if qid = 'q13' and sub.q13 = outcome.answer then pts := pts + 1; end if;
      if qid = 'q14' and sub.q14 = outcome.answer then pts := pts + 1; end if;
    end loop;
    update submissions set total_points = pts where id = sub.id;
  end loop;
end;
$$ language plpgsql security definer;
