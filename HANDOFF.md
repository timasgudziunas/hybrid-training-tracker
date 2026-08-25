# HANDOFF.md — Session Handoff (updated 2026-08-25 ~21:45 UTC, supersedes all 2026-08-25 morning and earlier versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, domain model, non-negotiables), then `PLAN.md` (build order). `PRODUCT_SPEC.md` and `TRAINING_SYSTEM.md` are the product and program sources of truth; consult them per feature, don't read them wholesale.

## Current state (as of 2026-08-25 ~21:45 UTC)

Docs-only repo. Zero code, zero scaffold, nothing deployed. All five docs (CLAUDE.md, PLAN.md, PRODUCT_SPEC.md, TRAINING_SYSTEM.md, README.md) are in their standard restructured form on `main`.

## Just completed (this session)

- Owner requested a new feature: on first open of a new day, prompt for current bodyweight (lbs) + optional progress photo from camera roll, with browsable history. Owner chose to **spec it only, no code yet**.
- Specced it as `PRODUCT_SPEC.md` section 10 subsection "Daily body check-in (weight + photo)" and as new **Phase 0.5** in `PLAN.md`.
- **Storage decision settled: Supabase** (owner confirmed 2026-08-25, driven by photos needing phone-to-desktop sync). Recorded in `CLAUDE.md` Tech stack. Treat this as the standing result; do not re-litigate storage from scratch.
- Updated `BodyMetric` in the CLAUDE.md domain model to carry an optional private-bucket photo reference.

## In progress / where it stopped

Nothing mid-flight. Session ended cleanly at the doc-update commit; next session starts Phase 0.

## Next steps (priority order)

1. **Phase 0** (`PLAN.md`): reconfirm web framework with owner (Next.js + Tailwind v4 + Vercel is the default; storage is already settled), create the Supabase project + private photo bucket, scaffold, deploy hello-world.
2. **Phase 0.5**: build the daily body check-in (weight + photo + history). Owner-requested; ships before the workout engine phases.
3. Phases 1-3 per `PLAN.md`.

## Open decisions / blockers

- **Web framework not yet explicitly confirmed** (only storage was). One-line confirmation from owner at Phase 0 start.
- **Supabase project doesn't exist yet.** Creating it needs the owner's Supabase account (same flow as personal-library/Blurbs). Keys go in `.env` (gitignored) with a committed `.env.example`.

## Where everything lives

| Path | What it is |
|---|---|
| `CLAUDE.md` | Governing doc: rules, stack decision, domain model, non-negotiables |
| `PLAN.md` | Phased build plan (Phase 0 → 10, plus new Phase 0.5 check-in) |
| `PRODUCT_SPEC.md` | Product behavior source of truth (check-in spec in section 10) |
| `TRAINING_SYSTEM.md` | Training program source of truth; never casually alter |
| `HANDOFF.md` | This file |

## Operational landmines

1. Never hardcode a workout into a page component; UI renders from the one canonical seed program (CLAUDE.md non-negotiable 16).
2. Sunday always renders REST DAY (non-negotiable 20).
3. Progress photos are private personal data: private Supabase bucket only, never a public URL, never committed.
4. No `ANTHROPIC_API_KEY` in any env for personal automations (root CLAUDE.md standing rule).

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
```
Healthy ≈ latest commit mentions the daily check-in spec, working tree clean. There is no running code or deployment to check yet.
