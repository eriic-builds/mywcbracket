# Animation performance results

## ELI5 outcome

The browser now spends less time rebuilding boxes, repainting glows, and drawing 3D scenes
that do not need full-speed updates.

The soccer balls still fall, collide, carry flags, and respond to input. The trophy still
rotates and responds to drag and keyboard controls. The difference is the work schedule:

- Moving DOM helpers now slide with transforms instead of changing layout coordinates.
- The ball pit sleeps after the pile settles.
- Coarse-pointer ball rendering and passive trophy rendering use a 30fps work budget.
- The phone trophy fallback releases its WebGL scene instead of leaving it allocated.
- Progress fills scale a full-width layer instead of resizing their boxes.
- Live pulses grow and fade a ring instead of repainting a box shadow.

## Architecture result

The revision preserved the project contract:

| Constraint | Result |
| --- | --- |
| Static GitHub Pages app | Preserved |
| Backend or server session | None added |
| Browser-local persistence | Existing `localStorage` behavior preserved |
| Runtime stack | Vanilla HTML, CSS, and ES modules |
| Build step | None added |
| Runtime dependency | None added |
| Worker or OffscreenCanvas | None added |
| Vendored Three.js and XLSX | Untouched |

The app is static and zero-backend. It is not fully stateless because brackets, rivals,
themes, and the Motion preference remain in browser `localStorage`.

## Measured before and after

The final run repeated the controlled baseline in Chrome 150.0.7871.115 and Edge
150.0.4078.50. The same Mac, viewports, device pixel ratios, temporary profiles, interaction
durations, and 4x CPU throttling were used.

Lower counts are better in this table.

| Scenario and metric | Chrome before | Chrome after | Edge before | Edge after |
| --- | ---: | ---: | ---: | ---: |
| Landing load Layout | 124 | 22 | 115 | 22 |
| Landing load Paint | 1,006 | 62 | 516 | 48 |
| Landing idle Paint, 5s | 1,203 | 5 | 1,202 | 0 |
| Landing pointer Layout, 4s | 585 | 4 | 596 | 4 |
| Landing pointer Paint, 4s | 1,747 | 14 | 1,780 | 14 |
| Mobile ball pit Layout, 4x CPU | 440 | 0 | 408 | 0 |
| Mobile ball pit Paint, 4x CPU | 1,791 | 5 | 1,692 | 0 |
| Score progress Layout | 50 | 8 | 49 | 8 |
| Score progress Paint | 417 | 70 | 412 | 70 |
| Overlay sequence Paint | 558 | 23 | 565 | 23 |
| Trophy WebGL trace events | 700 | 182 | 690 | 183 |
| Trophy GPU tasks | 728 | 209 | 695 | 218 |
| Trophy draw frames | 392 | 119 | 392 | 131 |

Key reductions:

- Landing pointer Layout fell by more than 99% in both browsers.
- Throttled mobile Layout fell to zero in both browsers.
- Score progress Layout fell by about 84%.
- Trophy WebGL trace events fell by about 74%.
- Trophy draw frames fell by 67% to 70%.

### New settled-idle proof

The baseline did not have a settled-idle scenario because the ball pit never slept. The final
run waited for a real 24-ball collision pile to settle, then recorded three untouched
seconds:

| Browser | Layout | Paint | Ball-pit RAF callbacks |
| --- | ---: | ---: | ---: |
| Chrome | 0 | 0 | 0 |
| Edge | 0 | 0 | 0 |

The browser still presents compositor frames for the page. The ball-pit module performs no
physics or WebGL work while asleep.

### Coarse-pointer graphics work

RAF callback counts alone do not prove a frame budget. A callback can return before physics
or rendering. Graphics trace events show the work reduction:

| Browser | Mobile WebGL events before | Mobile WebGL events after | GPU tasks before | GPU tasks after |
| --- | ---: | ---: | ---: | ---: |
| Chrome | 1,349 | 584 | 2,248 | 627 |
| Edge | 1,192 | 571 | 2,263 | 574 |

The implementation timestamp-gates actual coarse-pointer physics and render work at 30fps
when no touch drag is active. Direct touch input remains immediate.

## Main-thread gate

Every final interaction recording had zero tasks over 50ms. The highest p95 task duration
across direct pointer, touch, score, overlay, and trophy interactions was 0.61ms. This is
well below the 8ms target.

Each cold landing-load recording contained one startup task over 50ms:

| Browser | Cold-load maximum task |
| --- | ---: |
| Chrome | 77.58ms |
| Edge | 63.24ms |

This one-time startup event is not a steady animation task. It remains visible in the result
instead of being averaged away.

The original automated stat-card baseline did not expose the hover path. The corrected final
scenario scrolls the target into view before recording. It produced 2 Layout events, no long
task, and a 0.59ms Chrome or 0.57ms Edge p95 task. The source guard also verifies one
coalesced RAF update and CSS `translate`. No false before-versus-after percentage is claimed
for this scenario.

## Exact implementation

### Plan 01: measure before changing runtime

Created the brief, six bounded plans, baseline report, trace matrix, and source-level
performance guard. The untouched full test suite passed before runtime edits.

Files:

- `dev-docs/[04]-animation-performance-revision/BRIEF.md`
- `dev-docs/[04]-animation-performance-revision/plans/PLAN-*.md`
- `dev-docs/[04]-animation-performance-revision/BASELINE.md`
- `tests/animation-performance.mjs`
- `package.json`

### Plan 02: ball-pit runtime budget

`docs/js/landing-ballpit.js` now:

- caches frame and touch-target dimensions during resize
- moves the touch target with `translate3d()`
- tests a pure settled-state predicate
- sleeps after 45 consecutive settled frames
- wakes on pointer input, resize, visibility return, intersection return, Motion On, and a
  fresh drop
- limits passive coarse-pointer physics and render work to 30fps

`tests/landing-ballpit.mjs` now proves the settled predicate, a real dropped pile reaching
sleep, bounds safety, restart behavior, flag assets, topology, lifecycle, and transform-only
touch-target movement.

### Plan 03: DOM motion hot paths

Updated:

- `docs/js/interact.js`
- `docs/js/builder.js`
- `docs/js/render.js`
- `docs/css/dashboard.css`
- `docs/index.html`
- `tests/fixtures/golden-sections.json`

The team stat card keeps only the newest pointer coordinates and moves once per RAF with the
individual CSS `translate` property. Score and builder fills remain full width and use
left-origin `scaleX()` values.

The byte-locked golden fixture changed only from the old score-bar width representation to
the reviewed transform representation.

### Plan 04: CSS compositor primitives

`docs/css/dashboard.css` and `docs/index.html` now:

- name each transitioned property instead of using duration-only `transition` shorthand
- move the toggle knob with `translateX()`
- animate live pulse pseudo-elements with transform and opacity
- cover the new pseudo-elements in reduced-motion rules
- preserve Easy and GeoCities theme overrides

### Plan 05: trophy frame and resource budget

`docs/js/trophy.js` now timestamp-gates passive auto-rotation work at 30fps. Pointer and
keyboard input still render directly. Crossing below 600px disposes scene resources and
shows the static fallback. Returning to desktop initializes one eligible canvas.

Both final browsers reported:

- phone: 0 trophy canvases, 0 ready mounts, 1 phone mount, 1 visible fallback
- desktop return: 1 trophy canvas, 1 ready mount, 0 phone mounts

### Plan 06: integrated gate and teaching report

The complete browser matrix and all repository tests passed together. This file and
`dev-docs/[00]-dev-reports/[04]-animation-performance-revision/index.html` record the measured result,
code examples, learning notes, and limits.

## Why each change helps

### Layout

`left`, `top`, and `width` describe box geometry. Repeated changes can make the browser
measure affected boxes again. `translate` and `scaleX` change the visual representation
without resizing the element in document flow.

### Paint

An animated `box-shadow` often asks the browser to redraw pixels. A prepared ring animated
with transform and opacity gives the compositor a better chance to reuse painted content.

### RAF and frame pacing

`requestAnimationFrame` is a clock, not proof of useful work. A callback should return early
when the scene is not due for an update. Sleep goes further by requesting no callback until
a real wake trigger occurs.

### WebGL lifetime

Stopping a loop does not release buffers, materials, textures, or the rendering context.
Phone fallback now disposes those resources. Desktop return recreates them only when the
mount is eligible.

### Transform is eligibility, not a promise

Transforms and opacity are compositor-friendly requests. Chrome and Edge still decide layer
promotion based on paint dependencies, browser heuristics, device limits, and memory
pressure. JavaScript physics remains main-thread work. No result claims a guaranteed GPU
thread.

## Validation

| Gate | Result |
| --- | --- |
| Full `npm test` | Passed all 16 test modules |
| Ball-pit deterministic drop | Reached stable sleep |
| Animation source guards | Passed |
| Golden snapshots | All 15 sections passed |
| Golden fixture diff | Only score-bar style representation changed |
| Chrome trace matrix | Passed |
| Edge trace matrix | Passed |
| Chrome focused behavior gate | Passed all 13 checks |
| Edge focused behavior gate | Passed all 13 checks |
| Direct interaction long tasks | 0 over 50ms |
| Direct interaction p95 target | Passed, maximum 0.61ms |
| Responsive trophy disposal | Passed in Chrome and Edge |
| Independent code review | No significant issue found |
| No-build and no-dependency contract | Preserved |

The focused browser gate covered landing theme persistence, Motion Off reload behavior,
fresh Motion On startup, reduced motion, Easy and all fun themes, transform-only score
updates, stat-card clamping, trophy pause and keyboard controls, responsive WebGL disposal,
desktop recreation, and forced context-loss fallback.

## Remaining costs and uncertainty

- A moving canvas still performs real physics and WebGL work. The revision budgets it rather
  than pretending CSS replaces collision simulation.
- Passive 30fps loops still receive display-rate RAF callbacks on some screens. Skipped
  callbacks return before scene work.
- The trophy has a one-time Three.js and WebGL initialization cost when it first becomes
  visible.
- `match-details.js` retains static `left` and `top` placement. It updates on open, content
  change, or resize, not every animation frame.
- Headless macOS traces do not prove performance on every physical Windows phone or
  lower-end laptop.
- Chrome and Edge decide compositor promotion. No blanket `will-change` or forced-layer rule
  was added because permanent layers also consume memory.
- The owner completed the headed visual and interaction review before approving the
  repository update.

## Review boundary

`JOURNEY.html` was already modified before this revision. It was not edited, restored, or
included in this work.

The implementation, organized brief package, and Pages-rendered report ship together so the
published evidence matches the published code.
