# PLAN: Measure hidden and active celebration cost

**Rank: 1 of 5. Leverage: 10.0/10. Do this first.**

## Goal

Create a controlled Edge baseline before changing production or test code. Separate:

- primary-dashboard cold cost;
- dormant idle cost;
- a valid three-click near miss;
- normal dashboard interaction;
- celebration cold activation;
- steady carry work;
- peak effects work;
- hold and restore work;
- hidden visibility behavior;
- replay and resource lifetime.

This plan is measurement and documentation only. It must produce the go/no-go decision for
Plans 02 through 04.

## Exact files to touch

Repository:

- `dev-docs/[07]-animation-performance-revision-v2/BRIEF.md`
- `dev-docs/[07]-animation-performance-revision-v2/BASELINE.md`
- `dev-docs/[07]-animation-performance-revision-v2/README.md`
- `dev-docs/[07]-animation-performance-revision-v2/plans/PLAN-01-measure-hidden-and-active-cost.md`
- `dev-docs/[07]-animation-performance-revision-v2/plans/PLAN-02-isolate-primary-dashboard.md`
- `dev-docs/[07]-animation-performance-revision-v2/plans/PLAN-03-bound-active-frame-cost.md`
- `dev-docs/[07]-animation-performance-revision-v2/plans/PLAN-04-bound-activation-cost.md`
- `dev-docs/[07]-animation-performance-revision-v2/plans/PLAN-05-prove-performance-v2.md`

Session-only evidence:

- Edge CDP/Playwright runner;
- compressed Chrome trace JSON;
- normalized scenario JSON and CSV;
- forced-GC heap snapshots for replay;
- screenshots;
- environment record.

Do not edit any file under `docs/` or `tests/` in this plan.

## Observation

The celebration's controller and scene remain lazy, but the active scene has never received a
matched browser trace. Source review shows a 30-second display-rate RAF, seven detailed rigs,
instanced crowd/confetti/flares, shadows, camera, flag, lighting, and renderer work.

## Evidence to collect

For every scenario record:

- viewport, DPR, CPU throttle, browser version, OS, commit, and recording duration;
- module requests and transferred bytes;
- `FireAnimationFrame` callback p50, p95, max, and count;
- main-thread `RunTask` p50, p95, max, and tasks over `50ms`;
- Layout, style update, Paint, raster, GPU-task, and DrawFrame activity;
- Long Tasks API entries;
- stage, canvas, and WebGL context count;
- logical scene time reached during a fixed wall-time active window;
- heap and detached DOM-node delta for replay;
- console warnings, errors, and unsupported evidence.

## Step-by-step implementation order

1. Read:
   - `dev-docs/CLAUDE.md`
   - `dev-docs/TECHNICAL_TASTE_COUNCIL.md`
   - this package's `BRIEF.md`
   - the first revision's `BASELINE.md` and `RESULTS.md`
2. Record:
   - `git status --short`
   - current commit and branch
   - Windows, Node, Edge, GPU, viewport, DPR, and CPU throttle
   - the accepted CRLF-sensitive `landing-ballpit.mjs` failure
3. Use a fresh Playwright browser context per scenario with:
   - Motion on;
   - reduced motion off;
   - light color scheme;
   - no saved bracket or theme state;
   - local server `http://127.0.0.1:4173/`.
4. Instrument only the measurement context:
   - observe long tasks;
   - record canvas-context creation/loss;
   - capture network requests;
   - use CDP Performance, Memory, HeapProfiler, and Tracing domains.
5. Save compressed raw trace events and normalized summaries outside the repository.
6. Run the controlled matrix:

| Scenario | Conditions | Window |
| --- | --- | --- |
| Dashboard cold | 1024x768, DPR 1, 4x and 6x | navigation, demo click, stable dashboard |
| Dashboard dormant idle | same | 10 seconds |
| Three-click near miss | same | three clicks plus five seconds |
| Normal dashboard interaction | same | stat card, menus, filter, trophy pointer |
| Celebration cold activation | 1440x900/4x and 390x844 DPR 2/6x | fourth click through frame zero and opening |
| Carry | desktop/4x and phone/6x | start logical 9.2s, fixed five-second wall window |
| Peak effects | desktop/4x and phone/6x | start logical 21.2s, fixed five-second wall window |
| Hold and restore | desktop/4x and phone/6x | start logical 26.2s, fixed four-second wall window |
| Hidden visibility | phone/6x | five seconds hidden, then resume |
| Replay x3 | desktop/4x and phone/6x | three start/skip cycles |

7. Use the standalone celebration review harness only for isolated logical windows. It imports
   and executes the production scene controller, models, effects, and timeline. Record that
   its timeline readout adds small review-UI work, so the matched comparison must use the same
   harness before and after.
8. Use the actual dashboard for dormant, near-miss, cold activation, and replay evidence.
9. For hidden visibility:
   - set `document.hidden`/`visibilityState` only inside the measurement context;
   - dispatch the same `visibilitychange` event the controller consumes;
   - mark the exact hidden interval in the trace;
   - report this as a lifecycle-rule test, not proof of operating-system tab scheduling.
10. Force GC and take heap snapshots before and after replay x3. Count heap nodes with
    `detachedness === 2`; do not treat attached nodes (`1`) as leaks.
11. Write `BASELINE.md` with:
    - ELI5 summary;
    - environment;
    - raw scenario table;
    - network and dormant proof;
    - active bottleneck ranking;
    - cold/steady separation;
    - hidden and replay evidence;
    - Plan 02/03/04 decisions;
    - limitations and trace filenames.
12. Run `git diff --name-only`. Only the files listed in this plan may be new.

## Reasoning

Without matched evidence, reducing geometry, crowd density, shadows, or DPR would trade away
approved quality based on intuition. The baseline makes each later change conditional and
lets a less capable executor stop when the budget is already green.

## Tradeoffs

- CDP tracing adds observer overhead, but the same runner will be used before and after.
- CPU throttling is a repeatable stress proxy, not a physical-device benchmark.
- The review harness makes logical windows accessible without waiting 30 seconds per trace,
  but it adds small UI update cost. That cost is held constant in the comparison.
- Heap snapshots pause the page and are used for lifetime evidence, not animation timing.

## Edge cases a weaker model will miss

- Two responsive winner triggers exist; only the visible trigger inside the active mirrored
  bracket is valid.
- Three clicks must not request the heavy controller.
- The globally loaded celebration stylesheet and small trigger are allowed only if measured
  cost is immaterial.
- Trophy WebGL and celebration WebGL are different owners. Count context stacks, not canvases
  alone.
- `deviceScaleFactor: 2` does not mean the scene renders at DPR 2; verify the renderer cap
  through actual canvas dimensions.
- Do not compare a cold scene build to a warm frame window.
- Trace metadata can contain timestamp zero; exclude metadata when calculating recording
  duration.
- Long-task averages are misleading. Preserve max and count over `50ms`.
- A retained singleton celebration canvas after first use is not automatically a replay leak.
  The webgl-context count must remain stable across cycles.
- Context-creation counters are cumulative. Per-cycle 2D texture creation can increase even
  when the intended WebGL context is reused.
- Headless Edge and the review harness cannot prove Safari, iOS, or physical Android.

## Concrete acceptance criteria

- `BASELINE.md` contains all environment fields and every matrix row.
- Raw trace, normalized JSON/CSV, heap, and screenshot filenames are listed.
- Dormant and near-miss scenarios explicitly prove or disprove heavy module, stage, canvas,
  WebGL, and celebration-frame isolation.
- Cold activation and steady windows are reported separately.
- Hidden interval reports celebration RAF, Layout, and Paint counts.
- Replay reports context count, heap delta, detached-node delta, and per-cycle checkpoints.
- Plans 02, 03, and 04 each receive a measured required/verification-only decision.
- No production or test source changes.
- No commit, push, deploy, or publication.

## Lessons learned

Lazy loading is a hypothesis until network, DOM, context, and RAF evidence agree. WebGL frame
cost must be measured at the scene callback, main thread, raster, and GPU layers rather than
inferred from the absence of DOM Layout.
