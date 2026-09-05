-- Body check-ins: daily bodyweight + optional progress photo.
-- Idempotent: safe to run multiple times.
create table if not exists body_checkins (
  id uuid primary key default gen_random_uuid(),
  checkin_date date not null unique,
  weight_lbs numeric(5,1) not null,
  photo_path text,
  created_at timestamptz not null default now()
);

-- RLS is enabled with NO policies defined. This is intentional: the table is
-- reached only through the server-side Supabase client authenticated with
-- the service role key (see lib/supabase/server-client.ts), which bypasses
-- RLS entirely. There is no anon-key / client-side access path to this
-- table, so no policies are needed or should be added.
alter table body_checkins enable row level security;

-- Workout sessions: one row per session (Phase 3, active workout logging).
-- Deliberately NOT over-normalized (CLAUDE.md domain model note): a single
-- athlete, a few hundred sessions a year. The full per-exercise/per-set log
-- lives in the `performance` jsonb blob, whose shape is owned by the
-- TypeScript types in lib/workout-session/. This keeps continuous autosave a
-- single idempotent upsert, keeps refresh-recovery trivial (non-negotiable
-- 22), and stays fully exportable.
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  -- Device-local calendar date the session belongs to (never server UTC).
  session_date date not null,
  weekday text not null,
  workout_template_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  -- planned | active | completed | modified | missed
  status text not null default 'active',
  duration_seconds integer,
  notes text,
  session_difficulty integer,
  -- Per-exercise, per-set log + chosen "or" alternatives + skip/substitute
  -- records + completion stats. Shape owned by lib/workout-session/ types.
  performance jsonb not null default '{}'::jsonb
);

create index if not exists workout_sessions_date_idx
  on workout_sessions (session_date desc);
create index if not exists workout_sessions_template_idx
  on workout_sessions (workout_template_id, session_date desc);

-- Same RLS posture as body_checkins: service-role access only, no policies.
alter table workout_sessions enable row level security;

-- Training programs (2026-08-25 rework): the program is no longer seeded in
-- code. The owner pastes a program document in-app; it is parsed and stored
-- here. Exactly one program is active at a time; older rows are kept as
-- history so a paste can be rolled back by re-activating a previous row.
create table if not exists training_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- The raw pasted text, kept verbatim so it can be re-edited and re-parsed.
  source_text text not null,
  -- The parsed program. Shape owned by the TypeScript types in lib/program/.
  parsed jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists training_programs_active_idx
  on training_programs (is_active) where is_active;

alter table training_programs enable row level security;

-- Athletic benchmarks (sprints, jumps, strict pull-ups/dips, L-sit,
-- planche progression level). One row per measurement.
create table if not exists athletic_benchmarks (
  id uuid primary key default gen_random_uuid(),
  benchmark_type text not null,
  measured_on date not null,
  value numeric not null,
  unit text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists athletic_benchmarks_type_date_idx
  on athletic_benchmarks (benchmark_type, measured_on desc);

alter table athletic_benchmarks enable row level security;

-- Morning readiness check-ins. groin_status uses the 0-5 scale from
-- PRODUCT_SPEC §13; the app must never diagnose (CLAUDE.md non-negotiable 19).
create table if not exists readiness_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  sleep_hours numeric(3,1),
  energy smallint,
  soreness smallint,
  groin_status smallint,
  readiness text,
  notes text,
  created_at timestamptz not null default now()
);

alter table readiness_entries enable row level security;

-- Ultimate practice attendance (2026-08-26): the program flag only means
-- practice is SCHEDULED that day; this table records days the athlete
-- actually went (checked in-app). One row per attended day; unchecking
-- deletes the row.
create table if not exists ultimate_practice_days (
  id uuid primary key default gen_random_uuid(),
  practice_date date not null unique,
  created_at timestamptz not null default now()
);

-- Same RLS posture as every other table: service-role access only, no policies.
alter table ultimate_practice_days enable row level security;

-- Athlete app settings (R10, 2026-09-04): a key/value store for app
-- preferences (e.g. whether the RIR selector shows during set entry), synced
-- through Supabase so phone and desktop agree. One row per setting; `value`
-- is that setting's JSON value. Shape of each value is owned by
-- lib/settings/athlete-settings.ts, not by this table. Same RLS posture as
-- every other table: service-role access only, no policies.
create table if not exists athlete_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table athlete_settings enable row level security;
