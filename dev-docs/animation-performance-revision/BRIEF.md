# Animation performance revision brief

## Goal
Revise the first-party browser animations in `sled-mywcbracket` so visual motion avoids
repeated layout work, the two WebGL scenes have bounded runtime cost, and the static site
stays responsive on lower-end mobile hardware.

Performance direction:
- Prefer `transform` and `opacity` for visual motion.
- Do not animate layout properties such as `left`, `top`, `width`, or `height`.
- Keep JavaScript loops only where CSS cannot express the required behavior.

## Architecture contract
The app remains:
- Static and zero-backend.
- Hosted as files on GitHub Pages.
- Vanilla HTML, CSS, and ES modules.
- No build step.
- No new dependency.
- No server session or network write.

The app is not fully stateless. It intentionally remembers brackets, rivals, preferences,
and the landing Motion setting in browser `localStorage`. This revision adds no storage key
and no new persisted state.

## Technical correction
`transform` and `opacity` are compositor-eligible. They often avoid Layout and Paint work,
but they do not guarantee GPU execution or a separate browser thread. JavaScript that
calculates and writes a transform still runs on the main thread.

The correct standard is:
1. Avoid animation-time layout.
2. Keep paint work bounded.
3. Pause work when it is invisible or settled.
4. Verify the result in Chrome and Edge performance traces.

Do not add `will-change` everywhere. Extra compositor layers consume memory and can make a
lower-end device slower.

## Ranked plan set

| Rank | Plan | Why it has leverage |
| --- | --- | --- |
| 1 | [`PLAN-01-baseline-and-safety-rails.md`](plans/PLAN-01-baseline-and-safety-rails.md) | Prevents blind optimization and gives every later model a measurable target. |
| 2 | [`PLAN-02-ballpit-runtime-budget.md`](plans/PLAN-02-ballpit-runtime-budget.md) | The landing ball pit is the largest continuous animation cost and currently performs DOM layout writes inside its frame loop. |
| 3 | [`PLAN-03-dom-motion-hot-paths.md`](plans/PLAN-03-dom-motion-hot-paths.md) | Removes repeated layout from pointer tracking and converts the two dynamic progress bars away from width animation. |
| 4 | [`PLAN-04-css-compositor-primitives.md`](plans/PLAN-04-css-compositor-primitives.md) | Fixes the toggle knob, repainting pulse rings, and risky `transition: all` shorthands across the UI. |
| 5 | [`PLAN-05-trophy-frame-budget.md`](plans/PLAN-05-trophy-frame-budget.md) | Cuts passive WebGL rendering and releases its scene when the responsive static fallback takes over. |
| 6 | [`PLAN-06-integrated-performance-gate.md`](plans/PLAN-06-integrated-performance-gate.md) | Proves the combined changes preserve behavior and improve the measured browser workload. |

## Which plan to do first
Start with [`PLAN-01-baseline-and-safety-rails.md`](plans/PLAN-01-baseline-and-safety-rails.md).

Do not start with a mass CSS replacement. Russinovich's council voice leads here: measure
the current browser behavior first. The baseline makes later decisions reviewable and stops
a weaker model from declaring success because the code "looks optimized."

## Execution order and dependencies
Run the plans in rank order. Do not run them in parallel.

```text
01 baseline
   |
02 ball pit
   |
03 DOM motion
   |
04 CSS primitives
   |
05 trophy
   |
06 integrated gate and local review
```

Plans 02 through 05 are technically separable after Plan 01, but several touch
`docs/index.html`, `docs/css/dashboard.css`, and shared regression tests. Sequential work is
safer and easier to review.

## Safety rules for every plan
- Read `dev-docs/CLAUDE.md` and `dev-docs/TECHNICAL_TASTE_COUNCIL.md` before editing.
- Inspect `git status` before and after. `JOURNEY.html` is an unrelated existing change.
  Never stage, restore, or edit it.
- Touch only the files named by the active plan.
- Use the smallest targeted test first, then run the full `npm test` suite.
- Keep `docs/js/vendor/three.module.min.js` and `docs/js/vendor/xlsx.full.min.js` untouched.
- Do not change `render.js` without reviewing and regenerating the byte-locked golden
  fixture exactly as Plan 03 describes.
- Serve `docs/` locally and inspect the real browser result.
- Stop at the local review gate. Do not commit, push, or deploy without explicit approval.

## Council architecture call
- **Russinovich:** baseline and trace first. Runtime cost must be visible.
- **Karpathy:** use small CSS and vanilla JavaScript changes, not a framework or worker
  rewrite.
- **Naval:** preserve the approved soccer-ball hero and trophy because users value them.
  Bound their cost instead of deleting them.
- **Sean Grove:** these six plans are the execution spec. A model should follow the active
  plan instead of re-deriving intent from code.
- **Willison / Hamel:** source changes are drafts until tests and browser traces verify them.
- **Yegge:** one plan at a time, with a reviewable handoff after each.
- **Litt:** keep the implementation legible to the owner. Avoid clever animation helpers.
- **Hanselman:** name frame budgets, sleep states, and failures so the next person can find
  and understand them.
- **Context Engineering:** load only the active plan and its named files during execution.

## Planning artifacts
- Open the [live interactive report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/animation-performance-revision/)
  or serve `docs/` and visit `/dev-reports/animation-performance-revision/` locally.
- The report source is `dev-docs/dev-reports/animation-performance-revision/index.html`.
- Each `plans/PLAN-*.md` file is self-contained for a less capable execution model.
- Plan 01 creates `BASELINE.md`.
- Plan 06 creates `RESULTS.md` and updates the interactive guide with measured outcomes.

## Reusable client-side performance review prompt

Copy this prompt into another web project. Replace the bracketed fields. It carries the
method, not this project's implementation.

```text
Review and revise the client-side animation performance of [PROJECT].

GOAL
Keep approved motion and interaction quality while reducing unnecessary Layout, Paint,
main-thread, canvas, and WebGL work. Prioritize lower-end mobile hardware and the browsers
listed below.

PROJECT CONTRACT
- Runtime: [VANILLA / FRAMEWORK / OTHER]
- Supported browsers and devices: [TARGETS]
- Build and dependency constraints: [CONSTRAINTS]
- Features and visual behavior that must remain: [PRESERVE]
- Persistence, privacy, and reduced-motion rules: [RULES]

AUDIT BEFORE EDITING
1. Inventory every CSS animation and transition, JavaScript frame loop, pointer-following
   element, sliding menu, modal, progress fill, canvas, and WebGL scene.
2. Record a controlled baseline in each target browser. Use the same viewport, device pixel
   ratio, CPU throttle, interaction script, and recording duration before and after.
3. Measure Layout, Paint, scripting, long tasks, RAF activity, GPU or graphics work, canvas
   count, and WebGL context lifetime where available.
4. Find animation-time writes to left, right, top, bottom, width, and height. Separate real
   frame-loop hot paths from one-time static placement.
5. Find layout reads inside frame loops, unbounded requestAnimationFrame loops, hidden or
   settled scenes that keep rendering, broad transition rules, and paint-heavy animated
   shadows or filters.

PLAN BEFORE REFACTORING
Create a ranked plan set. Each plan must state the goal, exact files, implementation order,
edge cases, tests, browser evidence, and acceptance criteria. Measure first. Change one
bounded area at a time. Run overlapping plans sequentially.

IMPLEMENTATION DIRECTION
- Prefer transform and opacity for visual motion. Treat them as compositor-eligible, not a
  guarantee of GPU execution or a separate browser thread.
- Keep layout geometry stable during motion. Use translate or scale for pointer followers,
  sliding surfaces, toggle knobs, and progress fills where behavior allows.
- Coalesce high-frequency input into at most one DOM write per animation frame.
- Cache dimensions outside hot loops and refresh them on explicit resize or content-change
  events.
- Replace repaint-heavy effects with prepared layers animated through transform and opacity
  when the visual result stays equivalent.
- Give every loop pause, resume, sleep, wake, visibility, and teardown rules.
- Stop requesting frames when a simulation is settled. Wake only for real triggers.
- Budget passive canvas and WebGL rendering. Keep direct input responsive.
- Dispose WebGL resources and contexts when a responsive fallback replaces the scene.
- Preserve prefers-reduced-motion and any in-product motion control.
- Do not add blanket will-change rules. Permanent layers also consume memory.

VERIFICATION
1. Repeat the exact baseline scenarios after each bounded change.
2. Compare source guards, unit tests, snapshots, browser behavior, and traces.
3. Report raw before-and-after values. Do not claim a percentage when the scenarios do not
   match.
4. Separate cold-start cost from steady interaction cost.
5. State limits honestly. Headless traces do not prove every physical device, and transform
   use does not prove compositor promotion.

DELIVERABLES
- A brief that records the project contract and technical corrections.
- A measured BASELINE.md.
- Ranked, self-contained execution plans.
- Focused regression tests for the identified hot paths and lifecycle rules.
- A RESULTS.md with exact changes, matched measurements, validation, and remaining costs.
- A no-build interactive report when the repository supports static HTML documentation.

ACCEPTANCE GATE
- Approved motion and controls still behave correctly.
- No unapproved dependency, build step, storage key, or architecture change.
- No repeated layout writes in identified animation hot paths.
- Hidden or settled continuous scenes perform no useful frame work.
- Responsive fallbacks release resources they replace.
- Direct interactions stay below the agreed long-task and p95 main-thread budgets.
- All existing tests, snapshots, reduced-motion checks, and target-browser checks pass.
```

### Component checklist

The reusable method has six parts:

1. **Contract:** define what must stay before optimizing.
2. **Inventory:** find CSS, DOM, canvas, and WebGL motion.
3. **Baseline:** capture matched evidence before editing.
4. **Bounded refactors:** fix layout, paint, frame pacing, and lifecycle separately.
5. **Integrated gate:** rerun tests and identical browser scenarios.
6. **Report:** publish measurements, tradeoffs, and remaining uncertainty.
