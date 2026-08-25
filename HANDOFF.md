# HANDOFF.md — Session Handoff (updated 2026-08-25 ~22:25 UTC, supersedes all 2026-08-25 21:45 and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, domain model, non-negotiables), then `PLAN.md` (build order). `PRODUCT_SPEC.md` and `TRAINING_SYSTEM.md` are the product and program sources of truth; consult them per feature, don't read them wholesale.

## Current state (as of 2026-08-25 ~22:25 UTC)

**Phase 0 complete and deployed.** Next.js 16.3.3 (App Router, TypeScript, Tailwind v4 CSS-first) hello-world live at **https://hybrid-training-tracker.vercel.app** (verified HTTP 200 serving page content). No app features exist yet.

- **Stack (settled, do not re-litigate):** Next.js + Tailwind v4 + Vercel (owner confirmed 2026-08-25) and Supabase storage (owner confirmed 2026-08-25).
- **Supabase project:** ref `woawbkhcoegvwrsfgbix`, created by owner with Data API enabled, auto-expose tables ON, automatic RLS ON (every new table starts locked; each needs an explicit policy to return rows). Private storage bucket `progress-photos` exists, verified `public: false`. No tables yet.
- **Vercel:** project `hybrid-training-tracker` (id `prj_fSTZkzjGFxGIm1CGjIU4AatxjuCU`, team `team_i8cG3o7fGYsBvbJWyyJ3AhKb`), GitHub repo `timasgudziunas/hybrid-training-tracker` connected for auto-deploy on push to main. All three Supabase keys are in Vercel env for Production/Preview/Development. First production deploy was CLI-triggered (`vercel deploy --prod`); the push of this handoff commit is the first test of push-triggered auto-deploy — if the site didn't update after it, check the Vercel dashboard deploy list.
- **Local:** `.env` (gitignored, verified) holds the three Supabase keys. `npm run build` and lint green as of this session. Vercel CLI logged in as `gudziunastimas-7588`.

## Just completed (this session)

Phase 0, end to end: stack confirmed with owner; Supabase project + private photo bucket created; Next.js scaffold (delegated to a Sonnet subagent, QA'd); pushed to GitHub; Vercel project created + git-connected; env vars wired in all three environments; hello-world deployed and verified serving. Committed as `c08e290` "Phase 0 complete: ...".

## In progress / where it stopped

Nothing mid-flight. Phase 0 closed cleanly; next work item is Phase 0.5.

## Next steps (priority order)

1. **Phase 0.5** (`PLAN.md`): daily body check-in — Supabase table + storage schema, new-day prompt (weight lbs + optional photo, once per day, dismissible, never blocks), late entry, history view + weight trend. Behavior spec: `PRODUCT_SPEC.md` section 10. Needs `@supabase/supabase-js` (first new dependency).
2. Phase 1: program data model + canonical seed data from `TRAINING_SYSTEM.md`.
3. Phases 2-3 per `PLAN.md`.

## Open decisions / blockers

- None blocking. Note: Supabase has no auth user yet — the app is single-athlete; decide at Phase 0.5 whether to use Supabase Auth (one owner account) or keep server-side service-role access only. RLS-locked tables mean anon-key access returns nothing until policies or auth exist.

## Where everything lives

| Path | What it is |
|---|---|
| `CLAUDE.md` | Governing doc: rules, stack decision, domain model, non-negotiables |
| `PLAN.md` | Phased build plan; Phase 0 boxes ticked with completion notes |
| `PRODUCT_SPEC.md` | Product behavior source of truth (check-in spec in section 10) |
| `TRAINING_SYSTEM.md` | Training program source of truth; never casually alter |
| `app/` | Next.js App Router pages (currently hello-world only) |
| `.env` / `.env.example` | Supabase keys (gitignored) / committed placeholder template |
| `.vercel/` | Vercel project link (gitignored) |

## Operational landmines

1. Never hardcode a workout into a page component; UI renders from the one canonical seed program (CLAUDE.md non-negotiable 16).
2. Sunday always renders REST DAY (non-negotiable 20).
3. Progress photos are private personal data: private Supabase bucket only, never a public URL, never committed. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server-side only, never expose to the client bundle (no `NEXT_PUBLIC_` prefix on it, never import into a client component).
4. No `ANTHROPIC_API_KEY` in any env for personal automations (root CLAUDE.md standing rule).
5. The Vercel **MCP plugin is scoped/buggy for this team**: its project list misses most projects and `create_git_project` reports false link failures (two ghost-project rounds this session). Use the Vercel CLI (logged in) for project/env operations in this repo.
6. Vercel CLI `env add <name> preview` loops on `git_branch_required` even with `--yes`/`--value` (plugin wrapper bug). Workaround used: Vercel REST API `POST /v10/projects/{id}/env` with the CLI token from `AppData/Roaming/xdg.data/com.vercel.cli/auth.json`.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ latest commit is the handoff refresh on top of `c08e290` Phase 0, and the URL returns 200.
