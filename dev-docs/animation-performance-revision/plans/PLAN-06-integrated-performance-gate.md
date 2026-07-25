# PLAN: Integrated performance gate

**Rank: 6 of 6. Run last.**

## Goal
Prove the five completed increments work together, improve the measured browser workload,
preserve all product behavior, and remain safe to review locally before any commit or push.

This plan is validation and reporting. Do not hide a regression by making new runtime edits
inside this plan. Route a failure back to the plan that owns the affected surface.

## Exact files to touch
- `dev-docs/animation-performance-revision/RESULTS.md` - new final comparison report.
- `dev-docs/dev-reports/animation-performance-revision/index.html` - publish verified outcomes
  and completed plan cards as a GitHub Pages preview.

Do not edit runtime code unless the user explicitly approves reopening one of Plans 02-05.

## Step-by-step implementation order
1. Read:
   - `BRIEF.md`
   - `BASELINE.md`
   - Plans 02 through 05
   - The current `git diff`
2. Run `git status --short` and verify:
   - Only files named by Plans 02-05 changed for the runtime revision.
   - `JOURNEY.html` is still an unrelated unstaged change and was never edited by this work.
   - No vendor file, dependency lockfile, generated bundle, or build artifact appeared.
3. Run focused tests in this order:
   ```bash
   node tests/landing-ballpit.mjs
   node tests/animation-performance.mjs
   node tests/builder.mjs
   node tests/golden.mjs
   ```
4. Run the full existing suite:
   ```bash
   npm test
   ```
5. Inspect the golden fixture diff:
   - Only the score-bar inline style may change.
   - No unrelated render section, text, team ordering, settled score, or bracket markup may
     change.
6. Start the no-build local server from `docs/`.
7. Repeat every Plan 01 Chrome trace with the same:
   - Browser version where possible.
   - Viewport.
   - Device pixel ratio.
   - 4x CPU throttle.
   - Interaction duration.
   - Incognito/localStorage setup.
8. Repeat the two selected Edge traces under the same conditions.
9. Compare before and after in `RESULTS.md`:
   - Repeated Layout count.
   - Paint behavior.
   - Long tasks over 50ms.
   - p95 main-thread animation work.
   - Dropped frames.
   - Ball-pit idle physics/render frames.
   - Ball-pit coarse-pointer rendered frames.
   - Trophy passive rendered frames.
   - Active WebGL context count.
10. Run functional browser checks:
    - Landing dark and light.
    - 390x844 and desktop.
    - Mouse control-ball pushing.
    - Touch drag with unchanged page scroll.
    - Motion off hides balls and reload avoids loading the module.
    - Motion on starts a fresh drop.
    - Builder and leaderboard pause/resume.
    - Team stat card flips and clamps at all viewport edges.
    - Score and builder progress reach exact endpoints.
    - Dashboard themes, including easy and all fun themes.
    - Trophy drag, keyboard, pause, responsive fallback, and desktop return.
    - Match detail fact card and dialog positioning.
    - Forced WebGL context loss retains static fallbacks.
11. Run accessibility checks:
    - `prefers-reduced-motion`.
    - Keyboard focus and controls.
    - No new pointer-blocking pseudo-element.
    - No stale hidden transformed element intercepts input.
12. Write `RESULTS.md`:
    - ELI5 outcome.
    - Before/after table.
    - Exact code surfaces changed.
    - Technical explanation of why each change helps.
    - Remaining measured costs.
    - Any device/browser uncertainty.
    - Test result and browser matrix.
13. Turn the interactive planning guide into the final execution report at
    `dev-docs/dev-reports/animation-performance-revision/index.html`. Keep the existing
    ELI5/technical switch and add:
    - Completed status for all six plans.
    - Actual files changed by each plan.
    - Small before/after code examples for each optimization.
    - Plain-language explanation of what changed and why it reduces browser work.
    - Before/after metric cards and scenario table sourced from `BASELINE.md` and
      `RESULTS.md`.
    - A "learning moments" section covering Layout, Paint, Composite, RAF, WebGL sleep,
      frame pacing, reduced motion, and why transform is eligible rather than guaranteed.
    - A remaining-costs and uncertainty section that says what was not optimized or could
      not be proved.
    - The exact test and browser validation results.
    Do not add runtime dependencies, persistence, external assets, or dynamic report fetches.
    Keep it under `dev-docs/dev-reports/` so GitHub Pages renders the dashboard instead of
    showing its source code.
14. Open the interactive report and the local app for user review.
15. Stop. Do not commit, push, or deploy.

## Edge cases a weaker model will miss
- Compare traces only when the recording setup matches. A warm cache, different viewport, or
  different CPU throttle can create a fake win.
- A lower Layout count is not enough if Paint or GPU work increased. Report all three stages.
- A 30fps cap must be counted from actual physics/render work, not merely from the CSS label
  or constant name.
- Ball-pit sleep must be tested after a real collision pile settles, not only with a manually
  zeroed test state.
- The Motion-off reload test must confirm `landing-ballpit.js` and Three.js are not requested.
- The byte-locked golden fixture uses `results.frozen.json`. Never regenerate it from live
  results.
- Fun themes can override animation properties after the base rules. Check computed style,
  not only source order.
- Native dialog and fact-card positioning still use static layout coordinates by design.
  Do not flag them as regressions unless they update repeatedly during animation.
- WebGL context loss is destructive by design. Test it last in a browser session.
- Do not average away a long task. Record any task over 50ms even if the mean frame time looks
  good.
- The planning report is under `dev-docs`, not the deployed `docs` site. It must not change
  production routing.

## Concrete acceptance criteria
- Every focused test and full `npm test` pass.
- Golden fixture diff contains only the reviewed score-bar representation change.
- No repeated Layout event remains in stat-card tracking, progress animation, toggle motion,
  or ball touch-target movement.
- Ball pit reaches zero physics/render frames after settling and wakes on every required
  trigger.
- Passive coarse-pointer ball work and passive trophy rendering do not exceed 30fps.
- No measured interaction produces a main-thread long task over 50ms under the agreed trace.
- Direct interaction p95 main-thread animation work is at or below 8ms in the compared
  desktop and throttled-mobile traces, or `RESULTS.md` plainly records why the target was not
  met and blocks shipping.
- Dark, light, easy, fun themes, overlays, pointer/touch, progress, and 3D controls preserve
  behavior.
- Static, zero-backend, vanilla, no-build, no-new-dependency architecture remains intact.
- `RESULTS.md` and the interactive report show measured evidence, not unverified claims.
- The final interactive report teaches the actual execution in both ELI5 and technical
  views, including what changed, why, before/after examples, measurements, and remaining
  limits.
- User receives a local preview before any commit or push.
