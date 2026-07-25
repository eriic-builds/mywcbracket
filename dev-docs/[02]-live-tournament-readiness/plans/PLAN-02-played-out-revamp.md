# PLAN: Revamp "How it played out" so it tracks live results, not stale state

**Rank: 2 of 6.** The "How it played out" cards read as stale and disagree with the "Game
facts" section, which stays current. During a live tournament a wrong narrative next to a
right one destroys trust in the whole board. Fix the source of the disagreement.

## Goal
Make the three "How it played out" story cards reflect the same live results that "Game
facts" and the bracket already show. When a game finishes, the story updates in the same
sync, with no manual step.

## Background: how the two sections differ (verified)
- "Game facts" is `buildHighlights(D)` (section `sec-news`, "Game facts — recent games").
  Its data is `D.AUTO_HL`, copied straight from `results.json` key `auto_hl`, which
  `scripts/fetch_results.py` rebuilds every sync from the most recent finished games.
- "How it played out" is `storyCards(D)` / `buildStory(D)` (`docs/js/render.js` around
  lines 520-560, section `sec-story`). It is derived from computed state:
  `D.ROUND_SEQ`, `D.round_tally(s)`, `D.ROUND_FULL`, `collectBusts(D)`, `D.CONF`, `D.LIVE`,
  `D.ELIM`, `D.CHAMP`, `D.QF_WIN`, `D.ATTAIN`, `D.FF_ALIVE`, `D.NEXT_LABEL`.
- Both ultimately come from `results.json`, but by different paths: `auto_hl` is a prebuilt
  list, while the story recomputes from `res` + the KO feed. If `res`/`ko_fix` lag or a team
  name does not normalize into `D.RES`, the story undercounts while `auto_hl` still looks
  current. That mismatch is the bug to find.

## Step 1 — Reproduce and locate the divergence (do this before editing render logic)
1. With the live `docs/data/results.json`, add a temporary Node script that imports
   `render.js`, builds state from `demo-picks.json` + live `results.json` + `topology.json`,
   and prints both `storyCards(D)` and `buildHighlights(D)`. Confirm they disagree, and note
   exactly which finished games appear in `auto_hl` but not in the story tally.
2. Inspect `results.json`: compare the games present in `auto_hl` against the keys present in
   `res` and `ko_fix`. Determine whether the missing games are absent from `res` (a fetch or
   mapping problem, fix in Step 2A) or present in `res` but not counted by the story logic
   (a render-logic problem, fix in Step 2B).

## Step 2A — If the data is incomplete (most likely)
- Fix in `scripts/fetch_results.py`. The score parser folds penalty-shootout goals into the
  full-time score, so a 1-1 (4-3 pens) can arrive as 5-4. Confirm `res` stores the real
  level score and the shootout winner in the winner slot, so `round_tally`/`collectBusts`
  read the correct winner. Check team-name normalization so every finished game maps to a
  bracket team (the same `FLAG_CODE`-style variants: "England" vs "gb-eng", "USA" vs
  "United States", "Bosnia & Herz." vs "Bosnia and Herzegovina").
- Re-run `python3 scripts/fetch_results.py --dry-run`, confirm `res`/`ko_fix` now include the
  games that `auto_hl` has, then run it for real to rewrite `results.json`.

## Step 2B — If the render logic is wrong
- Fix `round_tally`, `collectBusts`, or the `D.ROUND_SEQ` derivation in `render.js` so a
  finished game counts the round it belongs to. Keep the three-card shape:
  card 1 "X of Y picks right so far", card 2 "Biggest swing" (busts), card 3 "What's at
  stake" (champion status).
- Because `render.js` is golden-locked, run `node tests/golden.mjs --update` and commit
  `tests/fixtures/golden-sections.json`. Verify the frozen `results.frozen.json` still yields
  a sensible story so the snapshot stays meaningful.

## Step 3 — Verify parity
- Re-run the Step 1 script. `storyCards(D)` must now agree with `buildHighlights(D)` about
  which games are final and who advanced. Remove the temporary script.

## Edge cases a weaker model will miss
- The story caps at three cards (`return cards.slice(0, 3)`). Do not add cards; fix the data
  feeding the existing ones.
- `collectBusts` reads both `D.R32` and `D.KO_FEED`. A late knockout result must land in
  `KO_FEED`/`res` or the "Biggest swing" card stays stale even when R32 is current.
- Penalty shootouts: `score.fullTime` from some feeds includes shootout goals. Subtract
  penalties to recover the real level score, then set the winner from the shootout.
  (football-data.org v4 has this exact quirk.)
- The golden test uses frozen data, so it will not catch a live-data bug. Parity must be
  checked against the live `results.json`, not the fixture.
- Do not touch `auto_hl` generation to "match" the story. `auto_hl` is the correct one.
  Bring the story up to it.

## Acceptance criteria
- For the current live `results.json`, the story cards and Game facts agree on every finished
  game and every advancing team.
- A newly finished game appears in both sections after one `fetch_results.py` run, with no
  manual edit.
- `npm test` passes with an updated `tests/fixtures/golden-sections.json` if render logic
  changed; if only data changed, `git diff` touches `results.json` (and maybe
  `fetch_results.py`) and the golden fixture is unchanged.
