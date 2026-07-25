# Production match experience brief

## Provenance

This brief was reconstructed from:

- the production port committed in
  [`38d6b5d`](https://github.com/eriic-builds/sled-mywcbracket/commit/38d6b5d6bf4722cf82813cf21365a2d7bab773e3)
- the six execution phases in the original interactive report
- the tests, validators, data contracts, and follow-up fixes shipped with the port

The approved sandbox was the visual source. SLED was the production architecture. No
standalone brief or plan set was committed, so this document records verified intent without
claiming to be an original artifact.

## Goal

Move the approved 31-game bracket and match-story experience into `sled-mywcbracket`
without replacing its newer social, storage, data, accessibility, or no-build contracts.

The finished experience needs:

- mirrored and Sideways bracket layouts
- Actual path and My picks modes from one tournament model
- match facts and accessible detail dialogs
- credited data portraits loaded after user intent
- a local 3D trophy with responsive fallback
- fit-screen desktop viewing with no map scrollbars
- complete phone rendering
- deterministic data and browser validation

## Architecture contract

Preserve:

- Static GitHub Pages hosting.
- Vanilla HTML, CSS, JavaScript, and Python scripts.
- No frontend build step.
- Existing share-link wire format.
- Existing localStorage ownership and preview isolation.
- Canonical live scores from `results.json`.
- Browser-local picks, rivals, themes, favorites, and what-if values.
- Failure-tolerant optional match details.

The port must not replace production files wholesale when doing so would erase newer SLED
behavior.

## Six execution phases

### Phase 1: analyze both codebases

Treat the approved sandbox as a behavior reference. Treat SLED as the source of truth for
result timestamps, knockout tuples, sync windows, local rivals, share links, and preview
state.

### Phase 2: build one tournament model

Derive all 31 nodes, 30 feeder edges, branch sides, columns, and slots from `ko_feed`.
Mirrored and Sideways layouts must read the same model.

### Phase 3: port the visual experience

Render full match cards, actual replacements, feeder placeholders, a centered Final,
Sideways parity, mini overviews, trophy mounts, future dates, and accessible match targets.

### Phase 4: add facts and portraits

Generate deterministic match details. Show quick facts and a labelled dialog. Keep portrait
identity reviewed, credited, host-allowlisted, and deferred until user intent.

### Phase 5: protect production social behavior

Tear down feature lifecycles before every rerender. Keep demo and shared views isolated from
owner state. Hide owner-only controls outside owner mode.

### Phase 6: review, measure, and release

Run JavaScript and Python fixtures, generated-data validators, a live feed dry run, desktop
and mobile overflow checks, privacy checks, and browser lifecycle checks.

## Shared safety rules

- One topology drives both layouts.
- `results.json` owns score, winner, penalty, and extra-time identity.
- Match details enrich canonical results. They do not redefine them.
- Fallback feeds create labelled partial details instead of fake completeness.
- External portrait requests wait for hover or open intent.
- Every document handler, timer, frame, observer, dialog, connector, and WebGL scene needs a
  teardown path.
- Actual mode reads actual winners. My picks keeps the entrant's selections.
- Expanded maps must not add horizontal or vertical browser scrollbars.
- Phone layouts keep all 31 match cards.

## Acceptance gate

The brief is complete when:

- both layouts render 31 cards from the same tree
- both modes preserve their actual-versus-picked meaning
- all decided matches expose accurate detail controls
- missing optional details do not break the dashboard
- canonical penalty and extra-time notes survive enrichment
- portrait requests do not occur on initial load
- rerenders do not retain stale handlers or GPU work
- desktop and phone views have no unintended page overflow
- existing share, compare, storage, and preview contracts still pass
- JavaScript, Python, generated-data, and browser release gates pass

## Technical Taste Council call

- **Sean Grove and Rich Harris:** port accepted behavior through production contracts.
- **Russinovich and Willison:** keep the newer data pipeline and prove parity with measured
  tests.
- **Hanselman:** make provenance, fallback state, and user actions clear.
- **Yegge:** ship implementation with a visual review packet and bounded follow-up fixes.
- **Litt:** keep every layer inspectable in the existing no-build stack.
