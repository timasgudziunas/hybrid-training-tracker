# HANDOFF.md

## Current state (as of 2026-08-25)

Docs-only repo. No code yet. The three ChatGPT-generated docs (implementation brief, product spec, training system) and a broken README have been imported and restructured into the owner's standard documentation system.

## Just completed

- Wrote `CLAUDE.md`: governing doc, philosophy, doc map, repo structure, tech stack (open decision), non-negotiables, domain model, UX principles, edge cases, code conventions, secrets, dev workflow, definition of success.
- Wrote `PLAN.md`: 11 phases (0 through 10) derived from the brief's phases and initial implementation order, each with checkboxes and a "Done when" line.
- Reformatted `PRODUCT_SPEC.md` in place: fixed heading hierarchy (one H1), merged one-sentence-per-paragraph style into normal prose, converted enumerable lists to tables (benchmarks, readiness inputs, navigation). All 16 product non-negotiables and every requirement preserved.
- Reformatted `TRAINING_SYSTEM.md` in place: one H1, every day's session converted to a table of exercise/sets x reps/notes, all philosophy sections (RIR, double progression, rest periods, abs, athleticism rules, speed/power philosophy, relative strength, benchmarking, adductor/groin management, program adjustment, future HYROX phase) preserved in full.
- Replaced the broken UTF-16 `README.md` with a short plain pointer readme.
- Added `.gitignore`.
- Deleted `CLAUDE (1).md` (raw ChatGPT originals preserved in git history at commit e4985c4).
- Committed the restructure. Repo now follows the standard docs-before-code layout.

## Next step (priority order)

1. Phase 0 of `PLAN.md`: confirm the tech stack with the owner (proposed default: Next.js + Tailwind v4 + Vercel), then scaffold the app skeleton and deploy pipeline.

## Open decisions / blockers

- **Stack and storage choice**: Next.js + Tailwind v4 + Vercel is proposed but not confirmed. Storage is undecided between Supabase and a local-first approach (SQLite/IndexedDB with export). Needs explicit owner confirmation before Phase 0 scaffolding begins.
