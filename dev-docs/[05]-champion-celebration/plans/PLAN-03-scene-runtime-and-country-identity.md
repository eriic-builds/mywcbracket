# PLAN: Scene runtime and country identity

**Rank: 3 of 7. Run after Plan 02.**

**Council call:** Karpathy keeps this to one retained canvas/browser context and one active renderer
and scene controller before character complexity. Russinovich requires bounded quality, explicit
failure behavior, and no hidden per-frame allocations or replay context churn. Context Engineering
keeps the controller API small so later plans need not reload unrelated dashboard code.

## Goal

Replace the static shell's center with a production Three.js runtime foundation: one lazily created
canvas and browser WebGL context reused across replays, deterministic country identity from bundled
flags, a night-stadium base, plinth, independent shared trophy, bounded renderer quality, resize
support, and complete per-run resource disposal.

This plan renders a reviewable static trophy-and-stadium frame. It does not yet build the seven
players or full choreography.

## Exact files to touch

- `docs/js/champion-celebration-scene.js` - **new** Three.js renderer, country identity, resource
  tracking, base environment, frame rendering, projection, resize, context loss, and destroy.
- `docs/js/champion-celebration.js` - nested lazy import of the scene, singleton canvas ownership,
  cached stage dimensions, and fallback handoff.
- `docs/css/champion-celebration.css` - canvas/fallback layering and responsive stage dimensions.
- `tests/champion-celebration.mjs` - deterministic/source guards for the scene runtime.
- `tests/animation-performance.mjs` - enforce one canvas, local Three.js, bounded DPR, and disposal.

Reuse without editing:

- `docs/js/flags.js`
- `docs/js/trophy-geometry.js`
- `docs/js/vendor/three.module.min.js`
- `docs/flags/*.svg`

Do not copy production code from the standalone mock.

## Interfaces this plan establishes

`docs/js/champion-celebration-scene.js` must export:

```js
export const CELEBRATION_DPR_LIMIT = 1.5;

export async function createChampionScene({
  canvas,
  team,
  signal,
  onContextLoss,
}) {
  return {
    resize({ width, height, devicePixelRatio }),
    renderFrame(timeSeconds),
    projectAnchor(name), // at least "plinth" and "trophy"
    destroy(),
  };
}
```

`projectAnchor(name)` returns cached-stage CSS-pixel coordinates:

```js
{ x, y, scale }
```

It uses Three.js world projection and the last `resize()` dimensions; it performs no DOM reads.

## Step-by-step implementation order

1. Confirm Plans 01-02 pass and inspect their current controller APIs. Run the focused celebration
   and animation-performance tests.
2. In `champion-celebration.js`, check
   `matchMedia("(prefers-reduced-motion: reduce)")` before importing the scene module.
   - Reduced-motion users remain on the provisional static local-asset tableau and do not initialize
     WebGL.
   - Plan 06 is the single owner of the finalized shared fallback markup and timing.
   - Full-motion users dynamically import `./champion-celebration-scene.js` only after the hidden
     trigger has already opened the shell.
3. Create exactly one celebration canvas for the module lifetime:
   - Lazily allocate it through one module-scoped singleton getter. Do not allocate at module import.
   - Class: `.champion-celebration-canvas`.
   - `aria-hidden="true"`; the accessible country/title remains DOM text.
   - Reset `hidden` and opening opacity before each mount because a prior fallback or interrupted run
     can leave inline state behind.
   - Keep the DOM fallback visible until the first successful scene render.
   - Preserve the opening z-order from Plan 01: real bracket below a transparent stage backdrop,
     then canvas/fallback, trophy ghost, and controls. The canvas may render while transparent, but
     it must not hide the bracket curtains before the logical opening opacity ramps.
   - On teardown, detach the stage and singleton canvas but retain the canvas object for replay.
   - On replay, append that exact same canvas object. The live DOM must never contain two celebration
     canvases, and the browser WebGL context identity must not change.
4. Create the renderer with the locally vendored Three.js module:
   - One active `WebGLRenderer` wrapper using the retained canvas/context.
   - Alpha enabled, antialias enabled, sRGB output.
   - `setPixelRatio(Math.min(devicePixelRatio || 1, CELEBRATION_DPR_LIMIT))`.
   - `setSize(width, height, false)`.
   - One restrained long-lens `PerspectiveCamera` with centered, straight-on elevated composition and
     near/far planes tight enough for the stage.
   - Keep camera and target `x = 0`; no lateral tracking or side-biased staging.
   - Preserve full-scale stadium depth. Do not substitute an `OrthographicCamera`, tilt-shift blur,
     depth-of-field blur, miniature proportions, or tabletop framing.
   - A consistent warm night-stadium clear/background independent of dashboard theme.
5. Build a small resource tracker:
   - Track geometries, materials, textures, renderer, listeners, and any generated canvas textures.
   - Deduplicate resources before disposal.
   - `destroy()` is idempotent, disposes the per-run renderer and scene resources, and clears
     references after disposal.
   - Do not call `forceContextLoss()` during normal completion/Skip; the one browser context is the
     bounded replay resource. Genuine context loss still routes to fallback.
   - No scene resource is created inside `renderFrame()`.
6. Derive country identity from `flagCode(team)`:
   - Resolve `new URL(\`../flags/${code}.svg\`, import.meta.url)`.
   - Load with a local `Image`, wait for `decode()` or `onload`, draw with explicit target
     dimensions to a fixed small canvas such as 32x24, and sample opaque pixels.
   - Ignore nearly transparent pixels and avoid selecting near-white/near-black background pixels as
     both primary colors when a stronger flag color exists.
   - Quantize samples into a small histogram and choose primary, secondary, and accent colors with
     usable visual separation.
   - Cache the resolved identity promise by canonical team name.
   - Use a stable string hash as the deterministic random seed.
   - If loading/decoding fails, evict the failed cache entry, log the team and local URL, and return
     a neutral gold/navy fallback palette while keeping the DOM flag visible.
   - Do not add a contender allowlist or a second team-name map.
7. Build the static base scene:
   - Ground plane with restrained field markings.
   - Multi-depth night backdrop/fog.
   - Structural stadium silhouettes and light rigs sufficient to establish depth.
   - Trophy plinth rising from the ground.
   - Independent `createTrophySculpture()` instance placed on the plinth.
   - Ambient, key, rim, and spotlight setup that keeps the trophy the visual hero.
   - No post-processing pipeline.
   - Name the provisional ground/plinth height constants in this module. Plan 04 hoists them into
     `STAGE_HEIGHTS`; do not repeat anonymous literals in both plans.
8. Keep dimensions and anchors centralized:
   - Ground and plinth heights must be named constants, not repeated numbers.
   - The trophy's plinth anchor must be a real `Object3D`.
   - `projectAnchor("plinth")` and `projectAnchor("trophy")` project those objects through the
     current camera using cached width/height.
9. Implement `resize()`:
   - Accept cached dimensions from the controller; do not call `getBoundingClientRect()` inside the
     scene.
   - Reject dimensions under 2px without changing the renderer.
   - Update camera aspect/projection, bounded pixel ratio, renderer size, and responsive camera
     profile.
   - Use two named profiles: desktop and phone. Do not recreate geometry/materials on profile
     changes.
10. In the controller, use one `ResizeObserver` on the stage:
    - Cache `contentRect` width/height.
    - Call `scene.resize()` outside the RAF loop.
    - Recompute the captured-trophy target from `projectAnchor("trophy")`.
    - Disconnect the observer during every destroy path.
11. Handle WebGL failure:
    - Catch context creation/renderer/identity setup failures.
    - Listen for `webglcontextlost`, call `preventDefault()`, and invoke `onContextLoss(error)`.
    - The outer controller owns switching back to the DOM fallback; the scene does not mutate
      dashboard state.
    - Ignore late identity/image completions after the passed signal aborts; dispose any texture
      created after cancellation.
12. `renderFrame()` for this plan renders a stable trophy-and-stadium frame:
    - Reuse preallocated vectors/matrices.
    - Update only camera/light/trophy properties needed for subtle hero motion.
    - Call exactly one `renderer.render(scene, camera)`.
    - Do not read layout, allocate arrays, create colors/materials/geometries, or load images.
13. Extend tests/source guards:
    - Local Three.js import and local flags only.
    - One singleton celebration-canvas construction path and one active renderer contract.
    - DPR limit is named and applied.
    - Same-origin `flagCode()` path is reused.
    - Resource tracker and `webglcontextlost` exist.
    - `renderFrame()` contains no `getBoundingClientRect`, `clientWidth`, `clientHeight`,
      geometry/material constructors, or `new Array`.
    - Reduced motion is checked before scene import.
14. Browser review at desktop and 390x844:
    - England, France, Spain, Argentina, Switzerland, and Germany each produce a recognizable,
      balanced country palette.
    - The trophy and plinth remain readable in both profiles.
    - Resize/orientation does not add a second canvas or distort the backing store.
    - Complete or Skip, replay, and assert strict identity equality for both the canvas object and its
      WebGL context; assert one attached canvas during playback.
    - Forced initialization failure shows the DOM fallback and leaves Skip usable.

## Edge cases a weaker model will miss

- Importing the scene module statically from `champion-celebration.js` initializes the Three.js
  dependency path even for reduced-motion users. Keep the nested import.
- SVG flags are same-origin, but an image completion can still arrive after skip/rerender.
- Many bundled SVGs do not provide useful raster dimensions to `drawImage()` implicitly; always pass
  explicit target dimensions after decode.
- Caching a rejected promise makes one transient failure permanent across every replay.
- Removing the canvas from the DOM does not require creating another canvas. Reuse the detached
  singleton or repeated replay can exhaust browser context limits.
- `renderer.dispose()` releases per-run Three.js resources but does not intentionally lose the
  retained browser context. Do not replace it with `forceContextLoss()` on normal teardown.
- White-heavy flags need color filtering or the entire stage becomes visually blank.
- England uses `gb-eng`; duplicating a new country map will eventually diverge from `flags.js`.
- `renderer.setPixelRatio()` must be followed by `setSize()` after a profile change.
- A resize observer can fire during teardown. Check the controller signal before calling the scene.
- `projectAnchor()` must use cached dimensions; a hidden or transformed bracket is not a valid
  measurement source after opening.
- Disposing a texture generated after cancellation is still required even if it was never attached.
- The fallback must remain visible until a successful first render; hiding it immediately can
  produce a black/blank stage during slow initialization.
- The dashboard theme may change behind the stage. The cinematic must stay a consistent night scene.

## Concrete acceptance criteria

- Full-motion activation mounts exactly one body-level celebration canvas and one active renderer.
- Completion/Skip detaches the canvas and disposes the renderer/scene resources; replay remounts the
  same canvas and browser WebGL context rather than allocating another.
- Reduced-motion activation creates no celebration WebGL renderer and stays on the static tableau.
- Only local Three.js, local SVG flags, and generated textures are used.
- All bundled-team names resolve through `flagCode()` with no new allowlist.
- The static trophy/stadium hero frame is readable at desktop and phone sizes.
- Device pixel ratio never exceeds 1.5.
- Resize/orientation updates camera and canvas without rebuilding scene resources.
- WebGL initialization failure and context loss switch to a usable DOM fallback.
- Skip/rerender during identity loading produces no late texture, listener, or renderer leak and no
  second canvas/context.
- `renderFrame()` performs no layout reads or resource construction.
- Focused tests and full `npm test` pass; no render fixture changes occur.
