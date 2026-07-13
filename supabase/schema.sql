create table if not exists participant_sessions (
  id text primary key,
  participant_id text not null,
  condition text not null,
  age integer not null,
  gender text not null,
  education text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  total_completion_time_ms integer,
  statement_order jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists trial_responses (
  id text primary key,
  participant_session_id text not null references participant_sessions(id) on delete cascade,
  participant_id text not null,
  condition text not null,
  trial_number integer not null,
  statement_id text not null,
  statement_text text not null,
  ground_truth boolean not null,
  confidence_rating integer not null check (confidence_rating between 0 and 10),
  statement_appeared_at timestamptz not null,
  submitted_at timestamptz not null,
  response_time_ms integer not null,
  created_at timestamptz not null default now()
);

alter table trial_responses
  drop constraint if exists trial_responses_confidence_rating_check;

alter table trial_responses
  add constraint trial_responses_confidence_rating_check
  check (confidence_rating between 0 and 10);

create index if not exists participant_sessions_condition_idx on participant_sessions(condition);
create index if not exists participant_sessions_participant_id_idx on participant_sessions(participant_id);
create index if not exists trial_responses_participant_id_idx on trial_responses(participant_id);
create index if not exists trial_responses_condition_idx on trial_responses(condition);

grant usage on schema public to anon;
grant select, insert, update on participant_sessions to anon;
grant select, insert on trial_responses to anon;

alter table participant_sessions enable row level security;
alter table trial_responses enable row level security;

drop policy if exists "Allow public participant inserts" on participant_sessions;
create policy "Allow public participant inserts"
  on participant_sessions for insert
  to anon
  with check (true);

drop policy if exists "Allow public participant updates" on participant_sessions;
create policy "Allow public participant updates"
  on participant_sessions for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow public participant dashboard reads" on participant_sessions;
create policy "Allow public participant dashboard reads"
  on participant_sessions for select
  to anon
  using (true);

drop policy if exists "Allow public response inserts" on trial_responses;
create policy "Allow public response inserts"
  on trial_responses for insert
  to anon
  with check (true);

drop policy if exists "Allow public response dashboard reads" on trial_responses;
create policy "Allow public response dashboard reads"
  on trial_responses for select
  to anon
  using (true);
