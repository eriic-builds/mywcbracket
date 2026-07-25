# PLAN: Baseline and safety rails

**Rank: 1 of 6. Do this first.**

## Goal
Measure the current animation workload in repeatable Chrome and Edge scenarios before
changing runtime code. Produce a baseline report that tells later models where Layout,
Paint, long tasks, dropped frames, and continuous animation work occur.

This plan makes no application-code change.

## Exact files to touch
- `dev-docs/[04]-animation-performance-revision/BASELINE.md` - new measured baseline report.

Do not edit any file under `docs/` or `tests/` in this plan.

## Step-by-step implementation order
1. Read:
   - `dev-docs/CLAUDE.md`
   - `dev-docs/TECHNICAL_TASTE_COUNCIL.md`
   - `dev-docs/[04]-animation-performance-revision/BRIEF.md`
2. Run `git status --short`. Record the starting commit and note the unrelated modified
   `JOURNEY.html`. Do not alter it.
3. Run `npm test`. Record whether the untouched baseline is green. If it fails, stop and
   record the exact pre-existing failure in `BASELINE.md`; do not fix unrelated code.
4. Start the existing no-build server:
   ```bash
   cd docs
   python3 -m http.server 8000
   ```
5. Use a fresh Chrome Incognito window at `http://localhost:8000/`. A fresh profile prevents
   saved brackets, themes, or `wcb.landing.ballpit.v1=0` from changing the scenario.
6. Record the environment in `BASELINE.md`:
   - Browser and version.
   - Operating system.
   - Viewport.
   - Device pixel ratio.
   - CPU throttle setting.
   - Current git commit.
7. Capture these Chrome Performance traces:
   - `landing-load-desktop`: 1440x900, no CPU throttle, from reload through the initial ball
     drop.
   - `landing-idle-desktop`: same viewport, five seconds without input after the drop.
   - `landing-pointer-desktop`: move the control ball through the field for five seconds.
   - `landing-mobile-throttled`: 390x844, 4x CPU slowdown, five seconds of passive motion and
     one touch drag.
   - `dashboard-hover-throttled`: 390x844 and 4x CPU slowdown, open the demo, then repeat at
     1024x768 so hover tracking is available.
   - `dashboard-score-progress`: change several scoring states and capture the progress fill.
   - `dashboard-overlays`: open and close builder, leaderboard, and match details.
   - `dashboard-trophy`: desktop viewport, five seconds of passive trophy rotation followed
     by a pointer drag.
8. For each trace, record:
   - Total Layout event count during the interaction window.
   - Whether Layout repeats every pointer move or animation frame.
   - Paint event count and any continuously repainting element.
   - Long tasks over 50ms.
   - Approximate p95 main-thread animation work per active frame.
   - Rendered frame rate or dropped-frame percentage.
   - RAF callbacks during idle.
   - Compositing evidence for the moving element.
9. Use Chrome Rendering tools with Paint Flashing for the toggle knob, progress bars, pulse
   dots, stat card, ball touch target, canvas, and trophy. Record which surfaces repaint.
10. Repeat the highest-cost landing and dashboard traces in Edge using the same viewport,
    throttle, and interaction duration. Record browser differences instead of assuming they
    are identical.
11. Write `BASELINE.md` with:
    - A one-paragraph ELI5 summary.
    - Environment table.
    - Scenario metrics table.
    - Ranked bottleneck list.
    - Screenshots or trace filenames if available.
    - A clear statement of which claims are measured and which remain uncertain.
12. Run `git diff --name-only`. Only `BASELINE.md` may be new from this plan, alongside the
    pre-existing unrelated `JOURNEY.html` change.

## Edge cases a weaker model will miss
- Do not compare a cold module load against a warm steady-state trace. Record initial load
  and steady animation separately.
- The Motion preference persists in `localStorage`. A previous `Motion off` selection means
  Three.js will not load. Use a fresh profile and explicitly confirm `Motion on`.
- The app stores a bracket locally and may open the dashboard directly. Use Incognito or
  clear only this localhost origin before the landing traces.
- DevTools adds overhead. Use the same DevTools configuration before and after. Absolute
  numbers matter less than a controlled comparison.
- Mobile emulation is not physical low-end hardware. Call it "4x CPU throttled emulation,"
  not proof for every device.
- `docs/data/results.json` is live and can change. Performance traces must not assert score
  values. Tests remain tied to frozen fixtures.
- External portrait iframes can add unrelated network and script work. Do not load an
  external portrait during the core animation traces.
- Hidden bracket layouts contain additional trophy mounts. Record how many canvases and
  WebGL contexts initialize; do not assume only one.
- A static `top` or `left` declaration is not a performance bug. Look for repeated changes
  during motion.

## Concrete acceptance criteria
- `BASELINE.md` exists and contains every environment field and scenario listed above.
- Chrome baseline includes desktop and 390x844 at 4x CPU slowdown.
- Edge repeats the highest-cost landing and dashboard scenarios.
- The report identifies repeated Layout/Paint events with the responsible selector or
  function where possible.
- The report records idle RAF activity for the ball pit and passive render rate for the
  trophy.
- `npm test` baseline result is recorded.
- No application or test file changed.
- No commit, push, or deployment occurred.
