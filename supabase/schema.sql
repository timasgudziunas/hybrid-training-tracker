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
