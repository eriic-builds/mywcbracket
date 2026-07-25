# PLAN: CI safety net — validate the live data before it ships

**Rank: 4 of 6.** The render engine is already golden-tested and `npm test` runs in CI. The
gap is the live data path: the sync bot commits `results.json` blindly after the fetch
script exits 0, with no schema or sanity check. A malformed feed during the final could push
a broken board straight to the deployed site. Close that hole.

## Goal
No `results.json` reaches `main` unless it passes a schema and sanity check. A bad sync fails
loudly (the existing issue-on-failure fires) instead of publishing garbage.

## Exact files to touch
- `scripts/validate_results.py` — new, stdlib-only validator (Python 3.12).
- `.github/workflows/sync-results.yml` — run the validator after fetch, before commit.
- `.github/workflows/tests.yml` — optional: run the validator on a committed sample so a
  bad hand-edit is caught on push too.
- `dev-docs/CLAUDE.md` — note the new guard so the next reader knows it exists.

## Current state (verified)
- `.github/workflows/tests.yml` runs `npm test` on Node 22 for push, PR, and dispatch.
- `.github/workflows/sync-results.yml` runs `python scripts/fetch_results.py`, then commits
  `docs/data/results.json` only if it changed, dispatches `deploy-pages.yml`, and opens an
  issue on failure. There is no validation between fetch and commit.
- `results.json` keys: `res`, `ko_fix`, `auto_hl`, `refreshed`.
- Tests use frozen fixtures `tests/fixtures/golden-sections.json` and
  `tests/fixtures/results.frozen.json`, so CI never touches the live feed.

## Step-by-step
1. **Write `scripts/validate_results.py`** (stdlib only). It loads `docs/data/results.json`
   and asserts:
   - top-level keys `res`, `ko_fix`, `auto_hl`, `refreshed` all present.
   - `refreshed` parses as `%Y-%m-%dT%H:%M:%SZ` and is not in the future by more than a few
     minutes and not older than, say, 48 hours.
   - `res` is a non-empty object; each entry has the expected shape
     `[goalsA, goalsB, winner, note]`, goals are ints, winner is a non-empty string.
   - every `winner` in `res` is one of the two teams in that match (cross-check against
     `topology.json` pairings where available).
   - `auto_hl` is a list; each row has the expected arity used by `buildHighlights`.
   - counts are sane: decided games do not exceed the tournament total (80 scoring units,
     31 matches). Fail on absurd values.
   It exits non-zero with a clear message on the first failure, zero on success.
2. **Gate the sync.** In `sync-results.yml`, after `fetch_results.py` and before the commit
   step, run `python scripts/validate_results.py`. If it fails, the job fails, the existing
   failure-issue step fires, and nothing is committed or deployed.
3. **Guard hand-edits.** In `tests.yml`, add a step
   `python scripts/validate_results.py` so a broken committed `results.json` also fails on
   push and PR, not only on the scheduled sync.
4. **Document it.** Add one line to `dev-docs/CLAUDE.md`: the sync is gated by
   `validate_results.py`; run it locally with `python3 scripts/validate_results.py` after a
   manual data edit.

## Edge cases a weaker model will miss
- Do not validate against the live network. Validate the written `results.json` only, so the
  check is deterministic and hermetic like the rest of the suite.
- Penalty shootouts inflate `score.fullTime` in some feeds. The validator should accept a
  `note` such as a shootout marker and must not reject a legitimate high score outright.
  Reject only impossible values (negative goals, winner not in the match).
- The 3x-daily sync rewrites `refreshed` even with no game change, so a "changed file" is
  normal. The validator runs regardless of whether the file changed.
- Keep it stdlib-only (`json`, `datetime`, `sys`). This repo pins Python 3.12 stdlib for the
  sync path; do not add a dependency.
- Do not fail on an empty `auto_hl` early in a round (valid). Fail only on missing keys or
  malformed rows.

## Acceptance criteria
- `python scripts/validate_results.py` exits 0 on the current committed `results.json` and
  exits non-zero with a clear message on a deliberately corrupted copy (missing key, future
  timestamp, winner not in match).
- `sync-results.yml` runs the validator between fetch and commit; a failing validation blocks
  the commit and opens the failure issue.
- `tests.yml` runs the validator; `npm test` still passes.
