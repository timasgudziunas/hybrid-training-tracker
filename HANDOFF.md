# HANDOFF.md — Session Handoff (updated 2026-08-26 ~00:15 UTC, supersedes all 2026-08-25 versions)

> To a fresh Claude session with no memory of prior conversations: read this file first, then `CLAUDE.md` (governing rules, domain model, non-negotiables), then `PLAN.md` (build order). `PRODUCT_SPEC.md` and `TRAINING_SYSTEM.md` are the product and program sources of truth; consult them per feature, don't read them wholesale.

## Current state (as of 2026-08-26 ~00:15 UTC)

**Phases 0 and 0.5 complete, deployed, and owner-verified on a real phone.** Live at **https://hybrid-training-tracker.vercel.app** behind a passphrase gate. The app currently does: daily body check-in (weight + optional progress photo), browsable history with tap-to-enlarge photos and inline per-row editing, 90-day weight trend chart. No workout features exist yet.

- **Stack (settled, do not re-litigate):** Next.js 16.3.3 + Tailwind v4 (CSS-first) on Vercel; Supabase for data + private photo storage. Both owner-confirmed 2026-08-25.
- **Access gate (owner decision 2026-08-25):** single passphrase, no accounts. Env `APP_PASSPHRASE`; unlock sets a ~1-year httpOnly cookie holding HMAC-SHA256(keyed by passphrase) of a fixed string; `proxy.ts` (Next 16's middleware convention) verifies on every route except `/unlock` and static assets. Rotating `APP_PASSPHRASE` logs out all devices.
- **Supabase:** project ref `woawbkhcoegvwrsfgbix`. Table `body_checkins` (see `supabase/schema.sql`), RLS enabled with NO policies on purpose — service-role access only, verified: anon insert rejected 42501. Private bucket `progress-photos`, verified `public: false`. Data as of handoff: exactly 1 real row (2026-08-25, 190.5 lbs, photo `2026-08-25.jpeg`, 4.5 MB); 7 test rows were inserted and deleted this session.
- **Photo flow (settled architecture):** photos upload directly browser→Supabase via `createSignedUploadUrl` (30-min signed READ urls for display). Photo bytes MUST NOT route through a server action — Vercel caps function payloads ~4.5 MB and the save dies at the platform edge with a blank error page (hit in real testing with a 4.5 MB phone photo).
- **Vercel:** project `hybrid-training-tracker` (id `prj_fSTZkzjGFxGIm1CGjIU4AatxjuCU`, team `team_i8cG3o7fGYsBvbJWyyJ3AhKb`), GitHub `timasgudziunas/hybrid-training-tracker` connected, auto-deploy on push to main (verified working). Env vars in all three environments: the three Supabase keys + `APP_PASSPHRASE`. Recent prod deploys were CLI-triggered (`vercel deploy --prod`) during debugging; push-deploy also verified.
- **Local:** `.env` (gitignored) holds all four values. CLI logged in as `gudziunastimas-7588`. `npm run build` + lint green at last commit.

## Just completed (this session)

- Phase 0: scaffold, Supabase project + bucket, Vercel pipeline, hello-world deployed (commit `c08e290`).
- Phase 0.5: full daily body check-in per `PRODUCT_SPEC.md` §10 + passphrase gate. Built by Sonnet subagent, QA'd (fixed a `//host` open-redirect in unlock), then two live bugfix/UX rounds: (1) rewrote photo upload to signed-URL direct upload after phone save failed on payload cap; (2) tap-to-enlarge lightbox + per-row inline history editing, top card only when today unlogged. Owner verified end-to-end on phone + desktop: prompt, save with photo, browse, enlarge, edit.

## In progress / where it stopped

Nothing mid-flight. Phase 0.5 closed with the phase-boundary commit (this handoff's commit).

## Next steps (priority order)

1. **Phase 1** (`PLAN.md`): program data model + canonical seed data from `TRAINING_SYSTEM.md` (read it before starting). One canonical program definition; nothing hardcoded in components (non-negotiable 16).
2. Phase 2: Today screen (weekday detection, Sunday = REST DAY always).
3. Phase 3: active workout logging.

## Open decisions / blockers

- None. Passphrase is in `.env` under `APP_PASSPHRASE` (also in Vercel env). If the owner wants it changed: update both places; all devices re-prompt.

## Where everything lives

| Path | What it is |
|---|---|
| `CLAUDE.md` / `PLAN.md` / `PRODUCT_SPEC.md` / `TRAINING_SYSTEM.md` | Governing docs (unchanged roles) |
| `proxy.ts` | Access gate (Next 16 middleware convention — NOT `middleware.ts`) |
| `lib/auth/passphrase-cookie.ts` | HMAC cookie sign/verify (Web Crypto, Edge-safe) |
| `lib/supabase/server-client.ts` | Server-only service-role Supabase client |
| `lib/date/local-date-string.ts` | Device-local YYYY-MM-DD (check-in dates are device-local, never server UTC) |
| `app/unlock/` | Unlock page + action |
| `app/daily-checkin-prompt.tsx` | Home-page new-day prompt (localStorage dismissal) |
| `app/body/` | Body page: actions, form, history, per-row entry, lightbox, SVG trend chart |
| `supabase/schema.sql` | Idempotent DB schema (owner applies in Supabase SQL editor) |

## Operational landmines

1. Never hardcode a workout into a page component; UI renders from the one canonical seed program (non-negotiable 16).
2. Sunday always renders REST DAY (non-negotiable 20).
3. Progress photos: private bucket only, signed URLs only, never public, never committed. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never `NEXT_PUBLIC_`, never in client components (`lib/supabase/server-client.ts` throws if imported client-side).
4. **Photo bytes never go through server actions / Vercel functions** (~4.5 MB payload cap; real failure 2026-08-25). Always signed-URL direct upload.
5. Next 16 uses `proxy.ts` with exported `proxy()` — creating a `middleware.ts` is deprecated and won't be picked up the same way. New routes are gated automatically by the existing matcher; if a route must be public, it needs an explicit matcher exclusion.
6. Vercel MCP plugin is unreliable for this team (stale project list, false git-link failures, ghost-project 409s). Use the Vercel CLI. Also `vercel env add <name> preview` loops on `git_branch_required` even with `--yes --value`; workaround: REST API `POST /v10/projects/{id}/env` with the CLI token from `AppData/Roaming/xdg.data/com.vercel.cli/auth.json`.
7. No `ANTHROPIC_API_KEY` in any env for personal automations (root CLAUDE.md standing rule).
8. `body_checkins` RLS has no policies BY DESIGN (service-role only). Don't "fix" it by adding anon policies.

## Quick health check

```powershell
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" log --oneline -3
git -C "C:\Users\Timas Gudziunas\projects\hybrid-training-tracker" status --short
curl.exe -s -o NUL -w "%{http_code}" https://hybrid-training-tracker.vercel.app
```
Healthy ≈ latest commit is "Phase 0.5 complete...", clean tree, URL returns 307 (redirect to /unlock — the gate working). In-app check: unlock, open /body, the 2026-08-25 entry (190.5 lbs, photo) renders with a signed thumbnail.
