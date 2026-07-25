# PLAN: Match-day freshness — denser sync, honest staleness, stall detection

**Rank: 1 of 6 — do this first.** Time-critical. The tournament is live now
(quarterfinals Jul 9-11, semis Jul 14-15, final Jul 19). Results sync 3 times a day, so on
a match day the dashboard can show a finished game as still upcoming for hours. Fresh scores
are the whole point of this app during the tournament.

## Goal
1. Sync results more often on match days, without spamming commits on quiet days.
2. Show the reader an honest "last updated" line everywhere it matters.
3. Warn the reader when data looks stale (older than a set threshold) instead of showing
   stale scores as if they are current.

## Exact files to touch
- `.github/workflows/sync-results.yml` — the cron schedule and the sync job.
- `docs/js/main.js` — loads `data/results.json`; add a staleness check after load.
- `docs/js/render.js` — already prints `localRefreshed(D.REFRESHED)` in the scoring section.
  Add a staleness state to the hero so it is visible without scrolling.
- `docs/css/dashboard.css` — one small style for the staleness pill.
- `scripts/fetch_results.py` — no logic change needed; confirm it always refreshes
  `results.refreshed` (it does, via `now_utc_stamp()`), so the age check is reliable.

## Current state (verified)
- `scripts/fetch_results.py` writes `docs/data/results.json` with keys `res`, `ko_fix`,
  `auto_hl`, `refreshed`. `refreshed` is a UTC stamp `YYYY-MM-DDTHH:MM:SSZ`.
- `.github/workflows/sync-results.yml` cron runs 3x/day: `0 22 * * *`, `30 1 * * *`,
  `0 6 * * *`. It runs `python scripts/fetch_results.py`, commits `results.json` only if it
  changed, dispatches `deploy-pages.yml`, and opens an issue on failure.
- `docs/js/main.js` loads with `fetch("data/results.json", { cache: "no-cache" })`
  (around lines 37-40). It does not read `refreshed`.
- `docs/js/render.js` shows `Live results as of ${localRefreshed(D.REFRESHED)} · auto-syncs
  a few times a day` in the "Scoring & schedule" section. There is no stall warning.

## Step-by-step
1. **Denser match-day cron.** In `sync-results.yml`, add match-window cron entries in UTC.
   World Cup 2026 knockout kickoffs run roughly 16:00-03:00 UTC. Add entries every 30 min
   across that window, for example `*/30 16-23 * * *` and `*/30 0-3 * * *`, and keep the
   existing 3 daily entries as a quiet-day floor. GitHub cron is UTC and has no date range,
   so gate the dense runs inside the job instead of the schedule (next step).
2. **Guard the dense runs by date.** At the top of the sync job, compute whether today is a
   knockout match day (Jul 4-7, 9-11, 14-15, 19 in 2026). If it is not a match day and the
   run was triggered by one of the dense cron times, exit early with success. Read the match
   dates from `docs/data/topology.json` if they exist there, otherwise hardcode the knockout
   dates in the workflow with a comment. This keeps quiet days at 3 commits/day.
3. **Staleness threshold in the client.** In `docs/js/main.js`, after `results.json` loads,
   compute `ageMin = (Date.now() - Date.parse(results.refreshed)) / 60000`. Pass an
   `isStale` flag (age over 90 min during the tournament) into the render state so views can
   show it. Do not block render on staleness; still show the last-known scores.
4. **Visible staleness pill.** In `render.js`, add a small pill next to the hero badges:
   fresh shows `Updated <relative time>`, stale shows `May be behind — last update <time>`.
   Reuse `localRefreshed`/a relative-time helper. Keep copy in the owner's writing style
   (no em dashes in the shipped string; see PLAN-writing-style).
5. **Stall detection.** If `ageMin` is over a hard threshold (for example 6 hours) on a
   match day, show a one-line notice at the top of the dashboard: results may be delayed,
   with a link to the GitHub Actions runs. This catches a broken sync bot during the final.
6. **Golden fixture.** Steps 4-5 change `render.js` output. Run `node tests/golden.mjs
   --update` and commit `tests/fixtures/golden-sections.json`. The frozen fixture uses a
   fixed `refreshed`, so pick a relative-time helper that is deterministic under the frozen
   timestamp, or the golden test will flap. Freeze "now" in tests if needed.

## Edge cases a weaker model will miss
- GitHub cron is UTC only and cannot express date ranges, so date gating must live in the
  job, not the `schedule:` block. Do not try to encode Jul 9-11 in cron.
- `results.refreshed` updates even when no game changed, so age is a real signal. Do not
  infer freshness from `res` diffs.
- The golden test loads a frozen `results.frozen.json` with a fixed `refreshed`. A relative
  time like "3 hours ago" will drift and break the snapshot. Freeze the clock in the golden
  harness or format an absolute time in the snapshotted section.
- Denser commits can race the deploy dispatch. Keep the "commit only if changed" guard so a
  no-op run does not push an empty commit or trigger a deploy.
- Do not add a build step. This repo has none and must stay vanilla static.

## Acceptance criteria
- On a simulated match day, the workflow attempts a sync every 30 min in the match window
  and still commits only when `results.json` changed.
- On a non-match day, only the 3 baseline runs commit.
- With a `refreshed` older than 90 min, the dashboard shows a "may be behind" pill; under
  90 min it shows a fresh "updated" pill.
- With `refreshed` older than 6 hours on a match day, the top-of-page stall notice appears.
- `npm test` passes, including a refreshed `tests/fixtures/golden-sections.json`.
