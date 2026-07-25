# PLAN: Trophy frame budget

**Rank: 5 of 6. Run after Plan 04.**

## Goal
Preserve the interactive desktop trophy while reducing passive WebGL rendering and releasing
its GPU resources when the responsive phone fallback takes over.

## Exact files to touch
- `docs/js/trophy.js`
- `tests/animation-performance.mjs`

Do not touch `render.js`, trophy markup, trophy CSS, or the SVG fallback.

## Step-by-step implementation order
1. Read Plan 01's `dashboard-trophy` baseline and confirm:
   - Passive render rate.
   - Number of initialized trophy canvases/WebGL contexts.
   - Main-thread and GPU cost.
2. Add a named passive frame interval, such as
   `const AUTO_FRAME_MS = 1000 / 30;`.
3. Separate "last rendered timestamp" from "queued RAF id":
   - `animate(now)` must return early when less than `AUTO_FRAME_MS` has elapsed.
   - It must queue the next RAF after an early return.
   - Physics is not involved, so calculate auto rotation from the elapsed time between actual
     rendered frames.
   - Keep the existing maximum delta guard so returning from a pause cannot jump the trophy.
4. Apply the cap only to passive auto-rotation and hover easing:
   - Pointer drag already stops the auto loop and calls `renderNow()` from pointer events.
   - Keyboard, theme, resize, pause/resume, and Home reset remain event-driven and render
     immediately.
5. When `updatePhoneState()` crosses from desktop to phone:
   - Stop the loop.
   - Dispose the Three.js scene, renderer, geometries, materials, canvas, and pause button.
   - Remove `trophy-ready` so its CSS does not hide the fallback.
   - Keep `trophy-phone` so the static fallback remains visible.
6. When width later crosses back above `PHONE_WIDTH`:
   - Reinitialize only if the slot is intersecting.
   - Restore the current paused state and button label.
   - Resume only if `canAutoRotate()` allows it.
7. Preserve:
   - Low-power WebGL preference.
   - Static initial fallback.
   - IntersectionObserver pause and lazy initialization.
   - Hidden-tab pause.
   - Reduced motion.
   - Manual pause.
   - Delayed resume after drag.
   - Context-loss fallback.
   - Full teardown from `main.js`.
8. Extend `tests/animation-performance.mjs`:
   - Confirm a named 30fps passive interval exists.
   - Confirm the passive loop gates render work by elapsed time.
   - Confirm phone transition disposes the scene and removes `trophy-ready`.
   - Confirm drag still calls `renderNow()` directly.
   - Confirm intersection, visibility, reduced-motion, pause, and context-loss paths remain.
9. Run:
   ```bash
   node tests/animation-performance.mjs
   npm test
   ```
10. Repeat Plan 01's trophy trace and a desktop-to-phone-to-desktop resize:
    - Record passive rendered frames.
    - Count canvases and WebGL contexts before and after the phone transition.
    - Verify keyboard, drag, pause, resume, theme, and fallback.
11. Save measured results for Plan 06.

## Edge cases a weaker model will miss
- A timestamp gate that returns without queueing another RAF freezes the trophy permanently.
- Do not set the rendered timestamp on a skipped frame. That would keep pushing the deadline
  forward and can starve rendering.
- Capping render work to 30fps still allows the browser to invoke the RAF callback at display
  refresh rate. Claim a 30fps render cap, not zero callback cost.
- Drag interaction is already event-driven. Applying the passive 30fps gate to drag would
  make the trophy feel laggy without saving meaningful work.
- `disposeScene()` does not currently remove `trophy-ready`. Phone-state code must do so or
  the higher-specificity ready rule can keep the SVG fallback hidden.
- Multiple trophy mounts exist because the dashboard renders actual/picked and
  mirror/sideways variants. Hidden slots should not initialize WebGL. Verify the actual
  context count rather than assuming one.
- Crossing the phone breakpoint can happen repeatedly during resize. Disposal and
  reinitialization must be idempotent and must not duplicate observers or listeners.
- A user may pause before resizing to phone. Returning to desktop must not silently unpause.
- Context loss sets a permanent fallback state for that controller. A resize must not
  reinitialize a failed context.
- Theme changes can fire while the scene is disposed. Existing null guards must remain.

## Concrete acceptance criteria
- Passive trophy rendering does not exceed 30 rendered frames per second.
- Drag and keyboard movement render immediately and remain responsive.
- Crossing below 600px disposes the active renderer and shows the static SVG fallback.
- Returning above 600px creates at most one canvas for the intersecting eligible slot.
- A paused trophy stays paused across responsive disposal/reinitialization.
- Reduced motion, hidden tab, off-screen, manual pause, delayed resume, and context-loss
  fallback remain correct.
- No hidden bracket layout creates an unexpected active WebGL loop.
- `node tests/animation-performance.mjs` and full `npm test` pass.
- No render output, golden fixture, dependency, or build command changes.
