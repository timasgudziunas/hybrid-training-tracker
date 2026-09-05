-- One-time backfill after accounts (2026-09-05). Run AFTER supabase/schema.sql
-- and AFTER the owner has created their account in the app (Sign up).
--
-- Every row that existed before accounts has user_id NULL and is therefore
-- invisible under RLS. This assigns all of them to the owner's account.
--
-- Replace OWNER_EMAIL_HERE with the email the owner signed up with, then run
-- the whole file in the Supabase SQL editor. Safe to re-run: it only touches
-- rows whose user_id is still NULL. It raises instead of guessing if that
-- email has no account yet.
do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'OWNER_EMAIL_HERE';
  if owner_id is null then
    raise exception 'No auth.users row for that email. Sign up in the app first, then re-run.';
  end if;

  update body_checkins set user_id = owner_id where user_id is null;
  update workout_sessions set user_id = owner_id where user_id is null;
  update training_programs set user_id = owner_id where user_id is null;
  update readiness_entries set user_id = owner_id where user_id is null;
  update ultimate_practice_days set user_id = owner_id where user_id is null;
  update athlete_settings set user_id = owner_id where user_id is null;
end $$;

-- Verify: every table should report 0.
select 'body_checkins' as t, count(*) from body_checkins where user_id is null
union all select 'workout_sessions', count(*) from workout_sessions where user_id is null
union all select 'training_programs', count(*) from training_programs where user_id is null
union all select 'readiness_entries', count(*) from readiness_entries where user_id is null
union all select 'ultimate_practice_days', count(*) from ultimate_practice_days where user_id is null
union all select 'athlete_settings', count(*) from athlete_settings where user_id is null;

-- Progress photos uploaded before accounts live at the bucket root as
-- `<date>.<ext>`; new uploads go under `<user_id>/<date>.<ext>`. Old paths
-- keep working: the server signs whatever path the (now owner-scoped) row
-- holds. No object move is required.
