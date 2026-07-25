# Live tournament readiness results

## ELI5 outcome

The dashboard gained three kinds of guardrails:

- A faster scoreboard clock on match days, plus a warning when updates fall behind.
- A gate that checks live data before the robot commits and publishes it.
- Clearer screens when loading, saving, keyboard input, or tournament storytelling goes
  wrong.

The bracket map also gained the same local country flags already used by the builder, and
the visible copy moved into the owner's shorter writing style.

## Architecture result

| Constraint | Result |
| --- | --- |
| Static GitHub Pages app | Preserved |
| Backend or account system | None added |
| Frontend build step | None added |
| Runtime dependency | None added |
| Flag source | Existing `docs/flags/*.svg` |
| Results validation | Python standard library only |
| Persistence | Existing browser `localStorage` |
| Render snapshot | Updated only for reviewed output changes |

## Implementation record

The plans were ranked by leverage. The commits landed in small review-sized units.

| Plan | Commit | What shipped |
| --- | --- | --- |
| CI safety net | [`d47d038`](https://github.com/eriic-builds/sled-mywcbracket/commit/d47d03869b13ce19f90a09a795a81351959b5c41) | Added a standard-library result validator and placed it before commit in the sync workflow and in push CI. |
| Hardening and accessibility | [`05445a0`](https://github.com/eriic-builds/sled-mywcbracket/commit/05445a0267b5b7bc52fcba4892845d9c7123b877) | Added a retryable load error, leaderboard dialog semantics and focus return, keyboard drop-zone activation, and a one-time blocked-storage notice. |
| Bracket-map flags | [`cb8ccc4`](https://github.com/eriic-builds/sled-mywcbracket/commit/cb8ccc449a0d6f9e4e251126520da5c34f2da2e4) | Reused `flagImg()` for real teams in both bracket views and kept placeholders flag-free. |
| Played-out revamp | [`d03a697`](https://github.com/eriic-builds/sled-mywcbracket/commit/d03a697847ad087b251ef08918ef98d5ff1e8a51) | Led the story with the latest completed round and clarified the costliest missed pick. |
| Match-day freshness | [`c717610`](https://github.com/eriic-builds/sled-mywcbracket/commit/c71761070e03d39be5f324ecdfb309fadc9e1c50) | Added half-hour match-window schedules, date gating, and warnings after 3 and 6 hours without fresh data. |
| Writing style | [`e9b0183`](https://github.com/eriic-builds/sled-mywcbracket/commit/e9b0183d31b80dfd147fa2c27737ae687f4c1157) | Rewrote visible prose and generated highlight copy while preserving score separators and status glyphs. |

## What changed

### Live-data pipeline

The scheduled workflow now has dense match-window triggers. A date gate exits successfully
outside the knockout window, so quiet days keep the baseline schedule. The existing
change-only commit guard prevents empty commits.

`scripts/validate_results.py` reads the generated `results.json` and checks required keys,
timestamp shape, result rows, non-negative scores, known winners, and highlight rows. A bad
file fails before the commit step. The existing issue-on-failure path then reports the
problem while the last good deployed data stays online.

### Reader freshness

`docs/js/main.js` compares the feed timestamp with the browser clock. Data older than three
hours shows a warning. Data older than six hours escalates the message to a delayed-sync
state.

The implementation kept this notice outside `render.js`, so a clock-dependent label did not
make the frozen golden fixture drift. The original plan proposed a permanent fresh pill and
a 90-minute threshold. The shipped version chose a quieter warning-only design and wider
threshold.

### Tournament story

The story cards still derive from live result state. They now lead with the latest completed
round instead of a static tournament-wide running total. The "Costliest so far" label makes
an earlier high-value miss read as a deliberate historical fact rather than stale content.

### Bracket flags

`docs/js/render.js` imports the existing `flagImg()` helper. Real team occupants receive the
`bk-flag` class in Round of 32, picked-path, and later-round cells. `Winner MXX`, `TBD`, and
other placeholders remain text-only. No external asset request was added.

### Failure and access paths

The app now:

- shows a readable retry action when live JSON fails to load
- marks the leaderboard overlay as a modal dialog
- labels its close control and returns focus after close
- opens the file picker from Enter or Space on the drop zone
- reports blocked local saving once while keeping the in-memory session usable

### Writing style

The final copy pass removed em dashes from shipped prose in `render.js`, `index.html`, live
highlight JSON, and the Python generator that rewrites those highlights. It preserved the
en dash between score numbers and the existing status symbols.

## Intentional golden changes

| Commit | Golden sections changed |
| --- | --- |
| `cb8ccc4` | `bracket_actual`, `bracket_picked` |
| `d03a697` | story section |
| `e9b0183` | sections containing revised visible copy |

The data validator, loading hardening, and freshness notice did not require a render snapshot
change.

## Verification

Each implementation commit recorded a green repository suite. The current suite covers:

- result schema and topology checks
- scoring and builder invariants
- bracket-map real and placeholder paths
- flag rendering
- share and comparison behavior
- golden render sections against frozen input
- freshness workflow source rules
- browser-local persistence paths

## Planning deviations worth keeping

- The plan set asked for five highest-leverage items, but six bounded plans were committed.
  The writing pass stayed separate because it touched broad visible copy after behavior
  settled.
- Rank described leverage, not commit order. Independent safety work landed before the
  match-day schedule.
- The freshness UI moved to `main.js` rather than `render.js`. This avoided a
  time-dependent golden snapshot.
- Hardening shipped the concrete failure and keyboard fixes supported by the existing UI.
  It did not add a new cache or storage layer.

## Final report

Open the
[interactive report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/live-tournament-readiness/)
for the visual plan map, data-flow explanation, shipped commit sequence, and ELI5 learning
notes.
