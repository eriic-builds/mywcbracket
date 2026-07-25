# PLAN: Trophy continuity

**Rank: 2 of 7. Run after Plan 01.**

**Council call:** Russinovich leads on the real browser mechanics: a cloned WebGL canvas is blank,
hidden slots are common, and pause state must survive handoff. Litt leads on one clear, reusable
trophy builder instead of two lookalike implementations that drift.

## Goal

Make the existing bracket trophy and the later cutscene trophy visibly the same designed object.
Capture the active visible trophy reliably, suspend live trophy rendering while the celebration
owns the screen, settle the captured image onto the stage plinth, and expose an independent shared
Three.js trophy model for the later hand grab.

This plan does not animate the captain or final handoff. It establishes the source capture,
continuous opening visual, independent model, and controller APIs that Plan 05 will choreograph.

## Exact files to touch

- `docs/js/trophy-geometry.js` - **new** independent procedural trophy factory used by live and
  celebration renderers.
- `docs/js/trophy.js` - consume the shared factory and return an explicit controller.
- `docs/js/main.js` - store trophy controllers by slot, suspend them during a celebration, and pass
  only the active mirrored controller to the stage.
- `docs/js/champion-celebration.js` - capture the visible trophy before DOM mutation, animate the
  captured visual to the plinth placeholder, and release suspension on every exit.
- `docs/css/champion-celebration.css` - captured-trophy positioning and settle transition.
- `tests/champion-celebration.mjs` - controller/capture/source guards.
- `tests/animation-performance.mjs` - preserve existing trophy budgets and add external-suspension
  guards.

Do not touch `render.js`, frozen fixtures, Sideways markup, the fallback SVG artwork, or vendored
Three.js.

## Interfaces this plan establishes

`docs/js/trophy-geometry.js` must export:

```js
export function createTrophySculpture(colors = {}) {
  return {
    root,                  // THREE.Group
    anchors,               // { leftGrip, rightGrip, top, bottom }
    materials,             // { body, inset, seam }
    setColors(nextColors),
    dispose(),             // idempotent; owns only this instance's resources
  };
}
```

Each call creates independent geometry and material instances. Share the procedural factory, not
live scene objects or disposable resources.

`initTrophy(slot)` must return:

```js
{
  slot,
  destroy(),
  suspend(),       // returns an idempotent release() function
  captureVisual(), // returns { node, rect, kind: "canvas" | "image" }
}
```

`captureVisual()` returns a detached `<canvas>` pixel copy for WebGL or a detached `<img>` clone for
the SVG fallback. It never returns the running WebGL canvas itself.

## Step-by-step implementation order

1. Re-read Plan 01's accepted controller contract and the current `trophy.js`. Run:

   ```bash
   node tests/animation-performance.mjs
   node tests/champion-celebration.mjs
   ```

2. Move only trophy construction out of `trophy.js`:
   - Preserve the current icosahedron, three torus seams, arms, inset, and base proportions.
   - Preserve flat shading and current roughness/metalness unless a later visual plan deliberately
     reviews them.
   - Let the factory own a resource list and dispose every geometry/material exactly once.
   - Keep the live and celebration color inputs independent.
   - Add named `leftGrip`, `rightGrip`, `top`, and `bottom` transforms to the sculpture. These are
     geometry-space contact contracts, not animation guesses.
3. Refactor `trophy.js` to call `createTrophySculpture()` and keep all current live behavior:
   passive 30fps cap, drag, keyboard, manual pause, theme updates, responsive fallback,
   intersection sleep, hidden-tab pause, reduced motion, context-loss fallback, and disposal.
4. Replace the teardown-function return with the controller object named above. Update every caller;
   do not leave a compatibility branch that accepts both shapes.
5. Implement external suspension separately from the user's manual `paused` state:
   - Maintain an external suspension count or token set.
   - `canAutoRotate()` must require no external suspensions.
   - `suspend()` stops the loop and returns a release function that can be called more than once.
   - Releasing the final suspension resumes only if all existing conditions allow it.
   - Never toggle the pause button or change its `aria-pressed` value for a celebration suspension.
6. Implement `captureVisual()`:
   - Reject a destroyed controller with a clear `Error`.
   - Resolve the visible source inside this controller's slot only.
   - For an initialized WebGL canvas, call `renderNow()`, allocate one detached 2D canvas at the
     backing-store dimensions, and immediately `drawImage()` the WebGL canvas into it.
   - Keep `renderNow()` and `drawImage()` in the same synchronous turn with no `await` between them;
     the current renderer does not use `preserveDrawingBuffer`.
   - Carry the source's CSS pixel rectangle separately; do not confuse backing-store pixels with
     layout pixels.
   - For phone, failed WebGL, or not-yet-initialized state, clone the fallback image and reuse its
     local `src`.
   - If the source and slot both have zero area, throw
     `Active trophy source has no visible geometry.` rather than returning a blank capture.
7. In `main.js`, replace `window.__trophyTeardowns` with a module-local
   `Map<HTMLElement, TrophyController>`.
   - Keep the existing trophy generation counter or move it module-local, but preserve stale import
     rejection.
   - `teardownTrophies()` destroys all controllers and clears suspension releases.
   - Add `setTrophiesSuspended(active)` that acquires one release per controller while active and
     releases exactly those tokens when inactive.
   - When a trophy import resolves during an active celebration, immediately suspend the new
     controllers so a late renderer cannot run behind the stage.
8. When Plan 01's trigger request arrives:
   - Find `[data-trophy]` inside the request's active mirrored `bracket`.
   - Read only that slot's controller from the map.
   - Pass it as `trophyController` to `startChampionCelebration()`.
   - Never fall back to the first controller or a document-global trophy slot.
9. Extend the celebration options with:

   ```js
   {
     trophyController,       // nullable
     setTrophiesSuspended,   // callback owned by main.js
   }
   ```

10. In `champion-celebration.js`:
    - Capture the active visual and source geometry before any celebration DOM mutation, including
      stage insertion, class changes, `inert`, `aria-hidden`, or body overflow locking.
    - Suspend live trophies after the capture and before opening animation begins.
    - If the active controller is absent or capture fails, create a local fallback image and use
      the active slot rectangle; log a precise warning without blocking the celebration.
    - Insert one `.champion-celebration-trophy-ghost` in the stage.
    - Start it at the captured source rectangle and settle it to a centered plinth placeholder over
      the `0.0-3.2s` opening contract.
    - Keep it visible and stationary through the crowd-acknowledgment and trophy-approach interval.
    - Store the source rectangle as viewport-normalized values so a resize can recompute a sensible
      origin without reading a transformed bracket.
    - Remove the detached capture and release trophy suspensions on every destroy path, including
      construction failure and stale start.
11. Reserve the cutscene-trophy factory contract for Plan 03, where a renderer and scene own the
    independent `createTrophySculpture()` instance. Do not create an orphaned Three.js group in this
    plan, reparent the live trophy scene, or share its materials.
12. Treat the Plan 02 CSS settle as a provisional standalone transition only. Plan 05 replaces it
    with logical-clock-driven transforms; document the class/property so Plan 05 can disable the
    transition instead of stacking interpolation on top of it.
13. Extend source tests to prove:
    - Both renderers import the shared factory.
    - `initTrophy()` exposes `destroy`, `suspend`, and `captureVisual`.
    - Capture calls `renderNow()` before copying.
    - A detached 2D canvas is used instead of `cloneNode()` on the WebGL canvas.
    - External suspension participates in `canAutoRotate()` without changing manual pause state.
    - The active bracket supplies the trophy slot.
    - Celebration cleanup releases suspension.
14. Serve the app and verify:
    - Desktop canvas source.
    - Narrow SVG fallback source.
    - A manually paused trophy.
    - A trophy still lazy-loading when the fourth activation occurs.
    - A context-lost live trophy.
    - Resize during the opening settle.

## Edge cases a weaker model will miss

- `canvas.cloneNode(true)` copies attributes, not the WebGL drawing buffer.
- A WebGL canvas can be copied only after an explicit render and before later buffer clearing.
- An `await`, timer, or promise continuation between render and copy can turn the capture blank.
- The canvas backing store is device pixels; its CSS rectangle is layout pixels.
- Four trophy mounts exist for two layouts and two views. Hidden controllers can have zero-size
  rectangles or no initialized renderer.
- The visible narrow-layout trophy is the SVG fallback, not a live WebGL controller.
- A celebration can start before the trophy module import resolves. The fallback path is a valid
  path, not an exceptional crash.
- A late trophy import can create GPU work behind the overlay unless new controllers inherit the
  active suspension.
- External suspension must not silently unpause a user-paused trophy after close.
- Context loss marks that live controller failed. Celebration cleanup must not cause it to
  reinitialize.
- Theme changes can occur while the trophy is suspended; material updates may render once but must
  not restart the passive loop.
- Dispose each independent trophy instance's resources once. Sharing disposable geometries between
  scenes creates double-dispose or cross-scene breakage.
- Capture must happen before the bracket halves transform; measuring afterward records the wrong
  origin.
- Capture must also happen before body overflow locking; scrollbar removal can move the source.

## Concrete acceptance criteria

- Live trophy behavior and appearance remain unchanged before celebration activation.
- Desktop activation captures non-blank pixels from the active live trophy.
- Narrow activation uses the active SVG fallback and never assumes WebGL exists.
- The captured trophy visibly settles onto the plinth and remains continuously visible.
- Only the active mirrored trophy source is measured.
- Live trophy RAF work stops while the stage is open and resumes according to its prior manual,
  reduced-motion, visibility, intersection, phone, and context-loss states.
- A late trophy import remains suspended behind an active stage.
- Replays do not accumulate capture canvases, suspension tokens, trophy controllers, or WebGL
  contexts.
- Shared procedural construction cannot couple live and cutscene resource disposal.
- Both renderers receive the same named grip geometry, and later choreography can read each
  independent instance's world-space grip targets.
- Focused celebration/performance tests and full `npm test` pass with no render fixture change.
