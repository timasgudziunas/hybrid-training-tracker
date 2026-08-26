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
