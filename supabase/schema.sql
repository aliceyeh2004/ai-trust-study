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
  confidence_rating integer not null check (confidence_rating between 1 and 7),
  statement_appeared_at timestamptz not null,
  submitted_at timestamptz not null,
  response_time_ms integer not null,
  created_at timestamptz not null default now()
);

create index if not exists participant_sessions_condition_idx on participant_sessions(condition);
create index if not exists participant_sessions_participant_id_idx on participant_sessions(participant_id);
create index if not exists trial_responses_participant_id_idx on trial_responses(participant_id);
create index if not exists trial_responses_condition_idx on trial_responses(condition);
