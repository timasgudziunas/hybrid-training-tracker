-- Hybrid Training Tracker schema. Idempotent: safe to run on a fresh project
-- AND on the existing production project (every statement is create-if-not-
-- exists / add-column-if-not-exists / drop-then-create-policy).
--
-- Accounts (2026-09-05): every athlete table carries user_id, referencing
-- auth.users. The app reads and writes through a client bound to the signed-
-- in user's session (lib/supabase/user-client.ts), so the RLS policies below
-- are what keep one athlete's rows invisible to another. user_id defaults to
-- auth.uid() so an insert without it still lands on the caller.
--
-- Rows that predate accounts have user_id NULL and are invisible to everyone
-- until supabase/migrations/2026-09-05-backfill-owner-user-id.sql assigns
-- them to the owner's account. Run this file first, then that one.
--
-- The service-role key (lib/supabase/server-client.ts) bypasses RLS and is
-- reserved for progress-photo signing and admin scripts. Photo paths are
-- prefixed with the owning user's id by the server, so the bucket needs no
-- storage policies.

-- Body check-ins: daily bodyweight + optional progress photo.
create table if not exists body_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
  checkin_date date not null,
  weight_lbs numeric(5,1) not null,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table body_checkins
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
-- Pre-accounts uniqueness was per date; now per athlete per date.
alter table body_checkins drop constraint if exists body_checkins_checkin_date_key;
create unique index if not exists body_checkins_user_date_key on body_checkins (user_id, checkin_date);

alter table body_checkins enable row level security;
drop policy if exists "own rows" on body_checkins;
create policy "own rows" on body_checkins
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Workout sessions: one row per session (Phase 3, active workout logging).
-- Deliberately NOT over-normalized (CLAUDE.md domain model note): a few
-- hundred sessions a year per athlete. The full per-exercise/per-set log
-- lives in the `performance` jsonb blob, whose shape is owned by the
-- TypeScript types in lib/workout-session/. This keeps continuous autosave a
-- single idempotent upsert, keeps refresh-recovery trivial (non-negotiable
-- 22), and stays fully exportable.
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
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

alter table workout_sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

create index if not exists workout_sessions_date_idx
  on workout_sessions (session_date desc);
create index if not exists workout_sessions_template_idx
  on workout_sessions (workout_template_id, session_date desc);
create index if not exists workout_sessions_user_date_idx
  on workout_sessions (user_id, session_date desc);

alter table workout_sessions enable row level security;
drop policy if exists "own rows" on workout_sessions;
create policy "own rows" on workout_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Training programs (2026-08-25 rework): the program is no longer seeded in
-- code. The athlete pastes a program document in-app; it is parsed and stored
-- here. Exactly one program is active at a time per athlete (enforced in
-- app/program/actions.ts); older rows are kept as history so a paste can be
-- rolled back by re-activating a previous row.
create table if not exists training_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  -- The raw pasted text, kept verbatim so it can be re-edited and re-parsed.
  source_text text not null,
  -- The parsed program. Shape owned by the TypeScript types in lib/program/.
  parsed jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table training_programs
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

create index if not exists training_programs_user_active_idx
  on training_programs (user_id, is_active) where is_active;

alter table training_programs enable row level security;
drop policy if exists "own rows" on training_programs;
create policy "own rows" on training_programs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- athletic_benchmarks (R5) was retired from the app on 2026-09-05 ("remove
-- all the athletic benchmarks for now"). The table is intentionally NOT
-- dropped here so any logged measurements survive until benchmarks return;
-- it simply has no code path and no policies.

-- Morning readiness check-ins. groin_status uses the 0-5 scale from
-- PRODUCT_SPEC §13; the app must never diagnose (CLAUDE.md non-negotiable 19).
create table if not exists readiness_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
  entry_date date not null,
  sleep_hours numeric(3,1),
  energy smallint,
  soreness smallint,
  groin_status smallint,
  readiness text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table readiness_entries
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table readiness_entries drop constraint if exists readiness_entries_entry_date_key;
create unique index if not exists readiness_entries_user_date_key on readiness_entries (user_id, entry_date);

alter table readiness_entries enable row level security;
drop policy if exists "own rows" on readiness_entries;
create policy "own rows" on readiness_entries
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Ultimate practice attendance (2026-08-26): the program flag only means
-- practice is SCHEDULED that day; this table records days the athlete
-- actually went (checked in-app). One row per attended day; unchecking
-- deletes the row.
create table if not exists ultimate_practice_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade default auth.uid(),
  practice_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, practice_date)
);

alter table ultimate_practice_days
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
alter table ultimate_practice_days drop constraint if exists ultimate_practice_days_practice_date_key;
create unique index if not exists ultimate_practice_days_user_date_key
  on ultimate_practice_days (user_id, practice_date);

alter table ultimate_practice_days enable row level security;
drop policy if exists "own rows" on ultimate_practice_days;
create policy "own rows" on ultimate_practice_days
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Athlete app settings (R10, 2026-09-04): a key/value store for app
-- preferences (e.g. whether the RIR selector shows during set entry), synced
-- through Supabase so phone and desktop agree. One row per athlete per
-- setting; `value` is that setting's JSON value. Shape of each value is
-- owned by lib/settings/athlete-settings.ts, not by this table.
create table if not exists athlete_settings (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- If the R10 single-athlete version (primary key on `key` alone) was applied,
-- move it to the per-athlete key. Its rows, if any, are the owner's and get
-- user_id from the backfill migration; until then they are invisible.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'athlete_settings'
      and constraint_name = 'athlete_settings_pkey'
      and constraint_type = 'PRIMARY KEY'
  ) and not exists (
    select 1 from information_schema.key_column_usage
    where table_schema = 'public' and table_name = 'athlete_settings'
      and constraint_name = 'athlete_settings_pkey' and column_name = 'user_id'
  ) then
    alter table athlete_settings
      add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
    alter table athlete_settings drop constraint athlete_settings_pkey;
    create unique index if not exists athlete_settings_user_key_key on athlete_settings (user_id, key);
  end if;
end $$;

alter table athlete_settings enable row level security;
drop policy if exists "own rows" on athlete_settings;
create policy "own rows" on athlete_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
