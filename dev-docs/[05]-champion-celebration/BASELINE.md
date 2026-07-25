# Champion celebration baseline

## Current rendering contract

- `docs/js/render.js` renders mirrored Actual, mirrored My picks, Sideways Actual, and Sideways My
  picks at the same time.
- CSS selects the visible variant from `.brk-wrap[data-view][data-layout]`.
- The mirrored champion box is rendered inside `.champ-state` above M104.
- `displayedChampion()` keeps the user's pick before the final and switches Actual path to the real
  M104 winner after the final is complete.
- The mirrored champion box already carries:
  - `.team.champ`;
  - `data-team`;
  - `data-round="champion"`; and
  - `tabindex="0"`.
- `pickBox(..., champ=true)` renders the mirrored champion path.
- Sideways uses the separate `legacyPickBox(..., champion=true)` path. A trigger attribute added to
  both helpers, or to a selector that ignores the active layout, would activate the wrong layout.

Relevant source:

- `docs/js/render.js:363-378`
- `docs/js/render.js:454-478`
- `docs/js/render.js:512-523`

## Current interaction contract

- `docs/js/interact.js` owns the active bracket lookup.
- It draws connectors for the active bracket only.
- It owns view and layout controls.
- It owns desktop map expansion and Escape-to-collapse behavior.
- It tracks timers and animation frames under one `AbortController`.
- Its teardown removes map-fit classes and cancels registered timers and frames.
- Team boxes also drive the hover stat card, including the champion box.
- Fun-menu and map Escape listeners are registered on `document` during interaction initialization.
  A celebration created later must take capture-phase ownership or background handlers can react
  first.

Relevant source:

- `docs/js/interact.js:3-14`
- `docs/js/interact.js:64-147`
- `docs/js/interact.js:148-182`
- `docs/js/interact.js:184-221`

## Current trophy contract

- `docs/js/trophy.js` uses the local Three.js module.
- It builds a procedural low-poly trophy from an icosahedron, torus seams, boxes, and cylinders.
- It already handles:
  - bounded passive frame rate;
  - pause/resume;
  - visibility changes;
  - reduced motion;
  - responsive static fallback;
  - WebGL context loss;
  - resize;
  - intersection-based wake/sleep; and
  - full geometry, material, renderer, listener, and observer disposal.
- `main.js` lazy-loads trophy instances and rejects stale imports with a generation counter.
- `showDashboard()` tears down match details, interactions, and trophy instances before replacing the
  dashboard HTML, then initializes all `[data-trophy]` slots. Celebration teardown and generation
  invalidation must enter that same lifecycle rather than existing as an unrelated global.
- `initTrophy()` currently returns only a teardown function. Any production snapshot or pause
  interface must preserve the callable teardown contract or update every caller and test explicitly.

Relevant source:

- `docs/js/trophy.js:1-24`
- `docs/js/trophy.js:69-149`
- `docs/js/trophy.js:151-200`
- `docs/js/trophy.js:313-493`
- `docs/js/main.js:88-107`
- `docs/js/main.js:147-204`

## Current map and viewport contract

- `.brk-wrap` is a glass surface with `backdrop-filter`.
- Existing map expansion changes the entire dashboard into a fit-screen mode.
- Desktop map expansion is intentionally blocked at widths at or below 860 pixels.
- A celebration stage nested under `.brk-wrap` cannot be trusted to behave as viewport-fixed because
  filtered ancestors can establish a containing block.
- The production celebration should append its fixed stage to `document.body`.

Relevant source:

- `docs/css/dashboard.css:48`
- `docs/css/dashboard.css:182-218`
- `docs/css/dashboard.css:692-737`

## Current flag contract

- `docs/js/flags.js` maps every current knockout team to a local SVG flag.
- The current flag set contains 32 bundled SVG files.
- Flag artwork attribution already exists under `docs/flags/ATTRIBUTION.txt`.
- A production palette can be derived from same-origin flag pixels and cached per team.
- `flagCode()` supports canonical names plus feed variants. Production palette and flag loading
  should use that helper rather than duplicate a second team-name map.

Relevant source:

- `docs/js/flags.js:1-39`
- `docs/js/flags.js:42-79`

## Current performance contract

- Prefer transform and opacity for repeated visual motion.
- Keep layout reads outside frame loops.
- Bound canvas and WebGL work.
- Pause hidden work.
- Dispose resources replaced by a fallback.
- Preserve `prefers-reduced-motion`.
- Avoid blanket `will-change` and broad transitions.

Relevant source:

- `dev-docs/CLAUDE.md:107-118`
- `dev-docs/[04]-animation-performance-revision/BRIEF.md:134-176`
- `dev-docs/[04]-animation-performance-revision/BRIEF.md:186-193`

## Current test contract

- `tests/matchcards.mjs` verifies both mirror modes, champion identity, M104 behavior, and champion
  placement.
- `tests/bracketmap.mjs` verifies Actual path continuity.
- `tests/map-frozen.mjs` byte-locks both layouts and both views.
- `tests/golden.mjs` byte-locks larger dashboard sections.
- `tests/animation-performance.mjs` enforces lifecycle and transition safeguards.
- `tests/landing-ballpit.mjs` provides prior art for deterministic simulation, local flags,
  instancing, and WebGL lifecycle source guards.
- `npm test` runs the complete suite.

## Integration hazards the execution brief and production plans must carry

1. A global champion selector can bind the hidden mirror copy instead of the active copy.
2. A stage appended below a glass/backdrop-filter ancestor can fail to cover the viewport.
3. Escape can be handled by both map expansion and celebration unless ownership is explicit.
4. Resize can alter layout or collapse map state while a scene is running.
5. The hover stat card can remain stuck if the overlay prevents `mouseleave`.
6. Space activation must call `preventDefault()` to avoid page scrolling.
7. A lazy import can resolve after the dashboard has rerendered.
8. Mobile trophy slots may show only the SVG fallback, so a live trophy controller cannot be
   assumed.
9. The celebration is intentionally silent; a sound control, audio module, cue API, Web Audio path,
   or media asset is a product regression.
10. Replays can leak canvases, contexts, frames, listeners, particles, and textures unless teardown
    is proven.
11. Click already represents a completed touch tap; combining pointer and click handlers can count
    one tap twice.
12. Held Enter or Space can emit repeated keydown events and accidentally open the scene unless
    `event.repeat` is ignored.
13. Mirrored `pickBox()` and Sideways `legacyPickBox()` are separate, but a naive selector or an
    attribute added to both champion helpers can still make Sideways a trigger.
14. Rapid repeated clicks can select champion text or open Edge/Chrome selection UI. Suppression must
    be scoped to the trigger rather than disabling selection or context menus across the dashboard.
15. Golden and map fixtures byte-lock render output; adding a data attribute requires a focused
    failing test, intentional fixture update, and human diff review.
16. A celebration import needs its own generation token. The trophy generation token alone does not
    protect a different late module.
17. Opening from map-expanded mode requires exact restoration of both root and body classes, inline
    overflow, scroll position, view, layout, and focus.
18. Background controls need input isolation while the body-level stage is open, and any pre-existing
    `inert` or `aria-hidden` values must be restored rather than overwritten.
19. Cloning a WebGL canvas element produces a blank canvas. Trophy continuity needs a
    render-then-capture API or equivalent, while narrow layouts need the fallback-image path.
20. Only the visible active mirrored trophy may be measured; hidden slots exist in the DOM and may
    have zero rectangles or inactive renderers.
21. The live trophy renderer should pause while the celebration runs so the feature does not waste
    frames or WebGL contexts behind the overlay.
22. Resize and orientation can invalidate the trophy source rectangle during the opening. The
    implementation must define whether it remeasures, safely adapts, or falls back.
23. Hidden-tab time cannot be derived directly from wall clock or the 30-second scene will jump
    forward on resume.
24. The standalone mock and production feature must share the same silence contract; mock-only audio
    would recreate a false product requirement.
25. The product Motion preference applies only to landing balls; operating-system reduced motion is
    the celebration gate.
26. Podium top, player foot height, trophy carry height, pump offset, and jump offset must share stage
    constants or visible intersections and detached trophy motion will return.
27. All per-frame work must reuse arrays, materials, geometry, textures, and helper objects; crowd
    and confetti counts and device pixel ratio must be bounded.
28. Context loss, Skip during import, Skip during playback, replay, dashboard rerender, and teardown
    each need explicit resource-release evidence.

## Production coverage map

A future planning session decides the task count, but its ranked plan set must cover:

1. mirrored-only activation and active champion identity;
2. lazy lifecycle controller, state snapshot, restoration, and race handling;
3. shared trophy geometry plus continuous source-to-hand transfer;
4. deterministic Three.js stage, timeline, camera, and renderer lifecycle;
5. team palette, stadium, crowd, captain, teammates, podium, and choreography;
6. flag, confetti, lighting, flashes, glint, and final hold;
7. intentional silence with no sound control, audio module, cue API, or Web Audio construction;
8. keyboard, touch, focus, reduced motion, responsive fallback, and context loss; and
9. focused tests, frozen output review, performance evidence, browser review, and documentation.

These are coverage requirements, not a prescribed number of plan files. The fresh session should
split or combine them only when current file ownership and dependencies justify it.

## Mock boundary

The standalone mock may reuse local production modules and assets, but it must not alter production
runtime files or frozen fixtures. Its job is to answer choreography and art-direction questions
before integration architecture is finalized.
