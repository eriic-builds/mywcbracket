# PLAN: Payoff effects and fallbacks

**Rank: 6 of 7. Run after Plan 05.**

**Council call:** Naval protects the payoff that earns this feature's complexity, while Russinovich
bounds every particle, pixel, and failure path. Willison/Hamel require real context-loss and replay
evidence, not source-level confidence.

## Goal

Complete the cinematic payoff with a segmented procedural flag, layered crowd motion, country-color
confetti, trophy glints, spotlight rhythm, photographer flashes, restrained teammate celebration,
desktop/phone composition, and production-grade reduced-motion/WebGL fallbacks.

The final result must feel rich because of modeling, timing, lighting, and composition—not because
of unbounded particles, DPR, post-processing, or external assets.

## Exact files to touch

- `docs/js/champion-celebration-effects.js` - **new** flag cloth, crowd motion, confetti,
  lights/flashes/glints, deterministic quality profiles, and disposal.
- `docs/js/champion-celebration-scene.js` - integrate effects, responsive camera profiles, first
  successful frame, context-loss transition, and final hero hold.
- `docs/js/champion-celebration-models.js` - expose crowd instance anchors/materials needed by the
  effects controller without moving animation into the model factory.
- `docs/js/champion-celebration.js` - shared static fallback, reduced-motion path, context-loss
  fallback timing, orientation handling, and fallback cleanup.
- `docs/css/champion-celebration.css` - full DOM fallback tableau and phone-safe controls.
- `tests/champion-celebration.mjs` - effect timing, quality constants, fallback, context-loss, and
  replay guards.
- `tests/animation-performance.mjs` - instancing, bounded counts/DPR, one canvas, and per-frame
  allocation guards.

Do not touch dashboard render output, vendor code, or the mock.

## Interfaces this plan establishes

`docs/js/champion-celebration-effects.js` must export:

```js
export const EFFECT_QUALITY = Object.freeze({
  desktop: { crowd: MAX_CROWD_INSTANCES, confetti: 384 },
  phone: { crowd: PHONE_CROWD_INSTANCES, confetti: 192 },
});

export function createCelebrationEffects(options) {
  return {
    setProfile("desktop" | "phone"),
    update(timeSeconds, progress),
    destroy(),
  };
}
```

`progress` contains the named values exposed by Plan 05:

```js
{
  opening,
  lift,
  flag,
  crowdPeak,
  lighting,
  confetti,
  finalHold,
}
```

## Step-by-step implementation order

1. Reconfirm Plan 05 timing tests and hero frames. This plan may refine interpolation inside a
   phase, but it may not move phase boundaries or reorder beats.
   Import `MAX_CROWD_INSTANCES` and `PHONE_CROWD_INSTANCES` from
   `champion-celebration-models.js`; crowd limits have one owner.
2. Build the segmented flag:
   - Reuse the locally rasterized flag canvas/texture from country identity.
   - Create one indexed grid geometry with 14 columns and 8 rows.
   - Store immutable base positions and one reusable working position buffer.
   - Unfurl behind the team during `19.9-20.6s`.
   - Apply restrained traveling waves after unfurl; keep the pole edge anchored.
   - Update only the existing position attribute and normals when needed.
   - No new arrays, geometry, vectors, or random values per frame.
3. Crowd:
   - Use the existing layered `InstancedMesh`.
   - Allocate desktop maximum once; phone changes `.count`.
   - Reveal during the opening, begin subtle deterministic bopping before the captain enters, and
     reach the crowd peak during `20.2-21.2s`.
   - Precompute phase/height variation arrays from the team seed.
   - Reuse one dummy `Object3D`/matrix for instance updates.
4. Confetti:
   - One smooth instanced geometry and bounded material set.
   - Allocate 384 maximum; phone uses 192 active instances.
   - Precompute color index, spawn position, phase, spin, drift, and lifetime arrays.
   - Begin after flag/crowd/lighting have started, around `20.8s`, and build through `22.0s`.
   - Derive position analytically from scene time so pause/resume/replay is deterministic.
   - Respawn by modular time/lifetime math, not `Math.random()` in the frame loop.
   - Use country colors plus restrained neutral/gold pieces; do not wash the scene in one color.
5. Lighting and hero accents:
   - Trophy glint tied to a moving light or material response, not a post-processing bloom pass.
   - Centered frontal hero spotlight pulse during the lift.
   - A small fixed pool of photographer flash lights/planes with deterministic pulses around
     `18.2-19.4s`.
   - Stadium light build during `20.0-21.3s`.
   - Preserve readable skin/kit/flag colors.
6. Secondary celebration motion:
   - Teammates receive distinct bounded bounce/arm/head offsets during the payoff and hold.
   - Keep feet/podium contact except for the one synchronized jump already defined.
   - Captain and trophy remain the hero; no teammate crosses in front of the trophy for long.
7. Responsive profiles:
   - Desktop and phone use named camera positions, field of view, and safe margins.
   - Phone keeps captain, trophy, all six teammates, flag, and Skip visible.
   - Profile changes update camera, active instance counts, and UI layout only; do not rebuild scene
     resources.
   - Bound DPR at the existing 1.5 limit in both profiles.
8. Resize/orientation during the opening:
   - Recompute the captured-trophy origin from Plan 02's normalized viewport coordinates.
   - Reproject plinth/grip targets from the resized scene.
   - Never read the already transformed bracket for a new origin.
   - If the trigger/bracket has been removed, destroy immediately.
9. Replace the simple DOM fallback with one shared fallback used by:
   - `prefers-reduced-motion`
   - WebGL initialization failure
   - real `webglcontextlost`
   - deterministic test/debug failure injection if already present for local review.
   Plan 06 is the single owner of the final fallback element, markup, timer, and visual contract;
   remove/replace the provisional Plan 01/03 tableau rather than leaving parallel fallback paths.
10. The shared fallback must contain:
    - Local country flag.
    - Country name.
    - Trophy fallback SVG.
    - Seven generic CSS/SVG-free silhouette blocks arranged as captain plus six teammates.
    - Visible Skip.
    - No external asset, player likeness, or hidden canvas.
11. Fallback timing:
    - Reduced motion: 0.5s opacity fade-in, 5.0s visible hold, 0.5s fade-out.
    - Initialization failure: same short tableau.
    - Context loss during playback: stop scene RAF, freeze logical time, switch immediately to the
      final static tableau, hold for 5.0 active/visible seconds, then restore.
    - Hidden time does not consume any fallback hold.
12. Context-loss cleanup:
    - Prevent the context-loss default.
    - Stop RAF before disposing scene resources.
    - Do not call renderer methods after the loss path begins.
    - Hide/remove the dead canvas from accessibility and pointer flow.
    - Notify the outer controller once; repeated context-loss events are ignored.
13. Replay and duplicate protection:
    - At most one stage and one celebration canvas exist at any time.
    - Destroy all effect resources, generated textures, observers, animation objects, frames, and
      fallback timers.
    - Run at least five open/Skip replays and five full completions while counting canvases and
      WebGL contexts.
14. Extend deterministic/source tests:
    - Exact quality bounds.
    - `InstancedMesh` for crowd and confetti.
    - Segmented flag geometry dimensions.
    - Preallocated arrays and seeded initialization.
    - No `Math.random()`, layout reads, geometry/material constructors, or new arrays inside effect
      `update()`.
    - Context-loss path stops RAF and shows shared fallback.
    - Reduced motion avoids scene import.
    - Fallback timer pause/resume has no hidden-time catch-up.
    - One canvas/stage across replay.
15. Browser review:
    - Required six countries.
    - Desktop and 390x844.
    - Orientation change during opening, carry, and final hold.
    - Reduced motion.
    - Forced initialization failure.
    - Real WebGL context loss, tested last in the browser session.
    - Five replays.
    - DevTools network confirms no external requests.

## Edge cases a weaker model will miss

- A flat textured rectangle is not a segmented procedural cloth object.
- Recomputing flag arrays or confetti randomness each frame creates garbage and nondeterministic
  pause/replay behavior.
- Confetti must start after the flag/crowd/light build begins, not all at `19.9s`.
- Crowd bopping starts during the opening reveal; it does not remain frozen until the final payoff.
- Changing phone counts by creating new `InstancedMesh` objects on resize leaks resources.
- The phone profile must reserve vertical space for controls and browser safe areas.
- Context loss can fire more than once and can occur during teardown.
- Calling `renderer.dispose()` after code has already nulled the renderer or entered a lost-context
  callback can throw or mask cleanup.
- A fallback timeout based on wall clock finishes while the document is hidden.
- Reduced motion should avoid WebGL initialization entirely, not start the scene and then freeze it.
- The final hold still needs restrained secondary motion; a completely frozen full-motion scene
  feels broken.
- Fun dashboard themes must not recolor or flatten the night-stadium cinematic.
- Test real context loss last because it is intentionally destructive to that scene controller.

## Concrete acceptance criteria

- The flag visibly unfurls behind the team as a segmented procedural cloth and continues a restrained
  wave.
- Crowd, flag, lighting, and confetti build in sequence from 19.9 to 22.0 seconds.
- Lift includes a centered frontal push, spotlight pulse, controlled trophy glint, and photographer-style
  flashes.
- Country-color confetti is bounded to 384 desktop/192 phone instances.
- Crowd is bounded to 320 desktop/180 phone instances.
- No effect frame creates geometry, materials, arrays, or random values or reads layout.
- Final tableau remains strong and readable through the full 22.0-28.5 hold.
- Desktop and phone keep captain, trophy, six teammates, flag, and controls unclipped.
- Reduced motion initializes no WebGL and shows the short shared static tableau.
- Reduced motion, initialization failure, and context loss all use the same fallback element and
  the same visibility-aware timing implementation.
- WebGL initialization failure and real context loss show the same usable fallback and restore.
- Five replays/full runs do not increase stage, canvas, WebGL context, listener, frame, texture, or
  effect counts.
- No external request or new dependency is introduced.
- Focused tests, performance guards, and full `npm test` pass.
