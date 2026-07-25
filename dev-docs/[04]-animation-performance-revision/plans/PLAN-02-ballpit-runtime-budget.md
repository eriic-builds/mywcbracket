# PLAN: Ball-pit runtime budget

**Rank: 2 of 6. Run after Plan 01.**

## Goal
Keep the approved interactive soccer-ball hero while removing DOM layout work from its
frame loop, stopping the physics loop after the balls settle, and bounding passive mobile
rendering.

CSS cannot reproduce the collision physics, pointer pushing, flag orientation, and WebGL
scene. Preserve those behaviors and optimize the necessary JavaScript path.

## Exact files to touch
- `docs/js/landing-ballpit.js`
- `docs/index.html`
- `tests/landing-ballpit.mjs`

Do not touch `docs/js/main.js`, vendored Three.js, or package dependencies.

## Step-by-step implementation order
1. Read Plan 01's `BASELINE.md` and copy the measured ball-pit bottlenecks into the working
   notes. Do not invent a quality reduction before checking the baseline.
2. In `landing-ballpit.js`, add named constants for:
   - Coarse-pointer passive frame interval: 1000 / 30ms.
   - Settled linear-speed threshold.
   - Control-target distance threshold.
   - Consecutive settled-frame count.
   Keep the names searchable, such as `COARSE_FRAME_MS`, `SLEEP_SPEED`, and `SLEEP_FRAMES`.
3. Add a pure exported predicate, such as `isBallPhysicsSettled(state)`, that:
   - Validates the state.
   - Checks the control ball is close to its target.
   - Checks every active dynamic ball's x/y velocity is below the chosen threshold.
   - Does not read DOM, time, or Three.js state.
4. Stabilize tiny floor bounces inside the existing physics boundary handling:
   - When a dynamic ball reaches the lower wall with a post-bounce vertical speed below the
     sleep threshold, set that vertical speed to zero.
   - Do not freeze balls in midair or suppress a real collision impulse.
5. Add controller-level sleep state:
   - `settledFrames` counts consecutive settled physics steps.
   - Reset it whenever input, a fresh drop, resize, reactivation, or collision-producing
     state change creates motion.
   - After `SLEEP_FRAMES`, render the final state once and do not request another frame.
6. Wake immediately from:
   - Mouse pointer movement.
   - Touch pointer down/move.
   - Motion on with restart.
   - `resetBallDrop`.
   - Returning to an active/intersecting landing page.
   - A bounds-changing resize.
   Theme changes and async flag loads should render once without creating fake physics
   motion.
7. Cache `frameHost` width and height in `resize()`. Move touch-target sizing into
   `resize()` so width and height are written only when dimensions change.
8. In `updateMatrices()`, remove all `clientWidth`, `clientHeight`, `style.width`,
   `style.height`, `style.left`, and `style.top` work for the touch target.
9. In `docs/index.html`, anchor `.landing-ballpit-touch` at `left:0;top:0`. In the frame
   loop, write one composed transform:
   - Pixel translation to the cached screen position.
   - Then `translate(-50%,-50%)` to center the hit area.
   Keep `touch-action:none` and coarse-pointer-only pointer events.
10. Add frame pacing:
    - Fine pointers may render at the display RAF rate, capped by existing delta handling.
    - Coarse-pointer passive motion performs physics/render work no more than 30 times per
      second.
    - A skipped frame must not advance physics or update DOM matrices.
    - Touch input queues work immediately; do not add perceptible drag latency.
11. Keep every existing guard:
    - Lazy module load.
    - Motion-off no-load behavior.
    - Intersection pause.
    - Hidden-tab pause.
    - Dashboard, builder, and leaderboard pause.
    - Reduced-motion static scene.
    - Context-loss fallback.
    - 12-24 active count.
    - DPR cap and low-power WebGL preference.
12. Extend `tests/landing-ballpit.mjs`:
    - A resting state satisfies `isBallPhysicsSettled`.
    - Any moving ball fails the predicate.
    - Control-target error fails the predicate.
    - A fresh drop fails the predicate.
    - Source regression confirms the frame path uses touch-target transform, not animated
      left/top/width/height.
    - Existing topology, physics stability, local flags, lifecycle, and no-load behavior
      still pass.
13. Run:
    ```bash
    node tests/landing-ballpit.mjs
    npm test
    ```
14. Repeat the Plan 01 landing traces. Record the result in working notes for Plan 06.

## Edge cases a weaker model will miss
- Gravity applies every physics step. Without snapping only tiny lower-wall bounces, balls
  can jitter forever and never become eligible for sleep.
- Collision stacks can transfer small impulses after a lower ball appears still. Require
  consecutive settled frames instead of sleeping after one quiet frame.
- Ball zero is kinematic. Its target error must be part of the sleep decision, or the loop
  can stop before the control ball reaches the requested position.
- `pointerToWorld()` currently starts the loop. Preserve that wake path for both mouse and
  touch.
- Async flag image loads call `renderNow()`. They must still appear when physics is asleep,
  but loading a flag must not restart continuous animation.
- Reduced-motion mode intentionally renders a static scene. Do not route it through the
  animated restart or sleep counter.
- Motion off prevents module loading on the next visit. Do not initialize Three.js merely to
  calculate a sleep state.
- Transform order matters. Translating by `-50%` before the pixel move uses a different
  coordinate space and can misalign the touch target.
- Cache dimensions only after confirming width and height are at least 2px, matching the
  current resize guard.
- Capping work to 30fps by skipping alternate RAF timestamps still creates RAF callbacks.
  Measure rendered/physics frames separately and do not claim callback elimination.
- Do not add adaptive device heuristics unless the post-change trace misses the agreed
  budget. If it does, first cap coarse-pointer DPR at 1.25, then cap its ball count at 16.

## Concrete acceptance criteria
- The touch target uses no per-frame layout property writes.
- The ball-pit frame path performs no `clientWidth` or `clientHeight` read.
- Balls settle into a final rendered frame and then produce zero physics/render frames until
  a documented wake trigger occurs.
- Mouse and touch wake immediately and still push other balls.
- Coarse-pointer passive physics/render work does not exceed 30fps.
- Motion off, reduced motion, hidden tab, off-screen landing, dashboard, builder,
  leaderboard, and WebGL fallback behavior remain intact.
- Country flags stay attached to each ball's 3D rotation.
- `node tests/landing-ballpit.mjs` and full `npm test` pass.
- The repeated Layout events attributed to the touch target disappear from the matching
  Chrome trace.
- No dependency or build command is added.
