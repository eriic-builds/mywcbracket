# Production match experience results

## ELI5 outcome

The approved sandbox was a model room. SLED was the real house with working plumbing. The
port moved the visible experience into the real house without replacing its pipes.

The app gained two complete bracket layouts, richer match facts, credited portraits, a 3D
trophy, and fit-screen review. Existing share links, local leaderboards, saved picks, and
privacy rules stayed in place.

## Architecture result

| Boundary | Result |
| --- | --- |
| Hosting | Static GitHub Pages |
| Frontend | Vanilla modules and CSS |
| Build step | None |
| Tournament model | One 31-node tree for both layouts |
| Canonical score identity | `docs/data/results.json` |
| Match enrichment | Optional same-origin detail JSON |
| Portrait loading | After user intent |
| Personal state | Browser localStorage |
| External account or backend | None |

## Main delivery

Commit
[`38d6b5d`](https://github.com/eriic-builds/sled-mywcbracket/commit/38d6b5d6bf4722cf82813cf21365a2d7bab773e3)
added:

- `docs/js/bracket-tree.js` for shared tournament geometry
- expanded bracket render output in `docs/js/render.js`
- `docs/js/match-details.js` for facts, dialogs, and portrait handling
- `docs/js/trophy.js` and local Three.js for the center-stage trophy
- `docs/data/match-details.json` and `docs/data/match-portraits.json`
- Python generation and validation for detail data
- frozen map, match-card, match-detail, storage, and Python fixture tests
- the original interactive production report and eight review screenshots

The port changed 43 files in one coordinated delivery because model, renderer, data
generation, lifecycle, tests, and visual evidence formed one release boundary.

## Follow-up record

| Commit | Outcome |
| --- | --- |
| [`cceb234`](https://github.com/eriic-builds/sled-mywcbracket/commit/cceb234) | Restored OpenDyslexic Easy mode, standing-label clearance, and seed-free maps after the port. |
| [`fe2179d`](https://github.com/eriic-builds/sled-mywcbracket/commit/fe2179d) | Restored the standalone team filter and fan-project disclaimer. |
| [`b8d2ead`](https://github.com/eriic-builds/sled-mywcbracket/commit/b8d2ead) | Polished dashboard navigation and credits. |
| [`b13b34c`](https://github.com/eriic-builds/sled-mywcbracket/commit/b13b34c) | Automated portrait discovery, added the next match mapping, and replaced filter seeds with bundled flags. |

These follow-ups are recorded because a large port can preserve core contracts while still
overwriting smaller production-specific polish. The fixes make that integration cost
visible.

## One model, two layouts

`bracket-tree.js` derives the tournament once. Mirrored and Sideways renderers consume the
same nodes and feeder relationships. Actual and My picks views differ in state, not in
geometry.

This removed the risk of two hand-maintained bracket structures drifting apart.

## Data and privacy

The result sync now generates:

- canonical result rows
- match details with source and coverage labels
- reviewed portrait mappings

Validators reject malformed result, detail, event, portrait, and coverage data before the
workflow commit.

Portraits are the one optional external visual source. The initial page does not request
them. A hover or explicit open action signals intent. The app credits the source and keeps a
responsive direct-link fallback.

## Four late review catches

| Risk | Fix |
| --- | --- |
| A fallback result lacked a detail record and blocked its own workflow commit | Generate a source-labelled partial detail from the canonical fallback result. |
| A temporary feed could erase penalty or extra-time identity | Overlay canonical score, winner, and note before detail comparison. |
| Actual mode could show the entrant's champion after the Final | Read the real M104 winner in Actual mode and keep the entrant champion in My picks. |
| Global handlers survived rerenders and competed on Escape | Return and invoke full interaction teardown before each render and landing transition. |

## Delivery evidence

The original release report recorded:

| Gate | Result |
| --- | --- |
| JavaScript suite | Passed |
| Python pipeline fixtures | Passed |
| Generated detail coverage | 25 of 25 completed matches |
| Desktop map overflow | 0 px |
| Mobile width | Passed at 390 px |
| Match cards per view | 31 |
| Browser console and response failures | 0 |

Current generated data has advanced beyond that delivery snapshot. The report keeps the
original 25-of-25 measurement as historical evidence instead of rewriting it.

## Final report

Open the
[interactive production report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/[00]-dev-reports/[03]-production-match-experience/)
for the parity table, architecture flow, six execution phases, review catches, screenshot
gallery, and learning notes.
