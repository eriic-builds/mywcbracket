# PLAN: Activation and lifecycle spine

**Rank: 1 of 7. Do this first.**

**Council call:** Karpathy and Sean Grove lead: prove the smallest complete vertical slice
before building expensive 3D art, and make the lifecycle contract the durable specification.
Hanselman adds the requirement that every failure and cleanup path be named and inspectable.

## Goal

Deliver the hidden four-activation trigger and a race-safe, accessible, body-level celebration
shell that can open, skip, close, and restore the dashboard exactly. This plan intentionally uses a
static local-asset tableau; later plans replace the center of that shell with the production Three.js
scene without changing the trigger or teardown contract.

At the end of this plan, four valid activations on the active mirrored champion box open one modal
stage. Sideways remains inert. Escape and Skip restore the exact prior dashboard state. A dashboard
rerender or Home navigation invalidates pending imports and destroys an active stage.

## Exact files to touch

- `docs/js/champion-celebration-trigger.js` - **new** pure rolling-window state plus delegated
  trigger binding.
- `docs/js/champion-celebration.js` - **new** body-level stage, state snapshot, isolation, restore,
  and idempotent controller.
- `docs/js/render.js` - add one explicit mirrored-only trigger data attribute.
- `docs/js/interact.js` - initialize the trigger against the active bracket and reset it on view,
  layout, resize-forced layout, and teardown changes.
- `docs/js/main.js` - own the celebration generation counter, lazy import, duplicate-start guard,
  and dashboard lifecycle integration.
- `docs/css/champion-celebration.css` - **new** trigger-only selection suppression and stage shell.
- `docs/index.html` - link the new stylesheet after `dashboard.css`.
- `tests/champion-celebration.mjs` - **new** deterministic activation and source-contract tests.
- `tests/matchcards.mjs` - prove the trigger contract exists only on mirrored champion boxes and
  preserves Actual/My-picks identity.
- `tests/fixtures/map-sections.frozen.json` - intentional reviewed mirrored-markup update.
- `tests/fixtures/golden-sections.json` - intentional reviewed mirrored-markup update.
- `package.json` - add `tests/champion-celebration.mjs` to `npm test`.

Do not touch `docs/js/trophy.js`, any Three.js vendor file, generated data, or the standalone mock.

## Interfaces this plan establishes

`docs/js/champion-celebration-trigger.js` must export:

```js
export const CHAMPION_ACTIVATION_COUNT = 4;
export const CHAMPION_ACTIVATION_WINDOW_MS = 2500;
export function createActivationWindow(options = {}) { /* record/reset */ }
export function initChampionCelebrationTrigger(options) { /* returns { reset } */ }
```

`createActivationWindow()` returns:

```js
{
  record(now), // true only when this activation completes a valid four-event window
  reset(),
}
```

`initChampionCelebrationTrigger()` accepts:

```js
{
  wrap,             // the current .brk-wrap
  getActiveBracket, // resolves the visible layout/view on every event
  onTrigger,        // receives { team, trigger, bracket, wrap }
  signal,           // the interaction AbortSignal
}
```

`docs/js/champion-celebration.js` must export:

```js
export async function startChampionCelebration({
  team,
  trigger,
  bracket,
  wrap,
  onClose,
}) { /* returns controller */ }
```

The resolved controller is:

```js
{
  destroy(reason = "destroyed"), // idempotent
  isActive(),
}
```

Do not expose mutable global scene state. `main.js` owns the one active controller reference.

## Step-by-step implementation order

1. Read `dev-docs/CLAUDE.md`, `dev-docs/TECHNICAL_TASTE_COUNCIL.md`, `BRIEF.md`,
   `BASELINE.md`, and this plan. Run `git status --short` and preserve the existing untracked
   brief/mock package.
2. Run the untouched focused tests:

   ```bash
   node tests/matchcards.mjs
   node tests/map-frozen.mjs
   node tests/golden.mjs
   ```

   Record any pre-existing failure before editing. Do not update a fixture yet.
3. In `render.js`, give the mirrored champion box a searchable contract:
   `data-champion-celebration-trigger`.
   - The current `pickBox()` is mirrored-only and its `champ` branch is called only by
     `renderCenterStage()`. Emit the attribute from that existing `champ` branch; do not add a new
     positional parameter.
   - Leave `legacyPickBox()` and `buildSidewaysBracket()` unchanged.
   - Preserve `data-team`, `data-round="champion"`, `tabindex="0"`, classes, flag markup, and
     Actual-after-M104 behavior.
4. Implement `createActivationWindow()`:
   - Use monotonic timestamps supplied to `record(now)`.
   - Retain only timestamps where `now - timestamp <= 2500`.
   - Add the current timestamp.
   - Return `true` and clear state when the retained count reaches four.
   - Treat a backwards or non-finite timestamp as a reset followed by the current activation; do
     not allow a corrupted clock sample to trigger.
   - Keep the count and window configurable only for tests; production uses the exported constants.
5. Implement delegated trigger binding in `initChampionCelebrationTrigger()`:
   - Attach one `click` path to `.brk-wrap`; do not add `pointerup` or `touchend`.
   - On every event, call `getActiveBracket()` and resolve
     `[data-champion-celebration-trigger]` inside that exact bracket.
   - Require `wrap.dataset.layout === "mirror"`, the candidate to be contained by the active
     bracket, and a non-empty `data-team`.
   - Handle `keydown` for Enter and Space only. Ignore `event.repeat`; call `preventDefault()` for
     Space and for accepted Enter activation.
   - Prevent `selectstart` and `dblclick` defaults only when their target is the active trigger.
   - On the fourth activation, re-read the active bracket and trigger once more, then call
     `onTrigger({ team, trigger, bracket, wrap })`.
   - Use the passed AbortSignal for listeners and return `{ reset }`.
6. Update `initInteractions()` to accept
   `initInteractions({ onChampionCelebration } = {})`.
   - Initialize the trigger after `.brk-wrap`, `activeBracket()`, and the layout state exist.
   - Reset before changing `data-view`.
   - Reset inside `setLayout()` whenever the effective layout changes, including the
     `sideways -> mirror` coercion at widths at or below 860px.
   - Reset during interaction teardown.
   - Make `drawConnectors()` return without rewriting SVG paths while
     `document.body.classList.contains("champion-celebration-active")`.
   - Do not export DOM elements or cache a champion element.
7. In `main.js`, add module-local lifecycle state:
   - `CELEBRATION_CONTROLLER`
   - `CELEBRATION_LOAD`
   - `CELEBRATION_GENERATION`
   - `teardownChampionCelebration(reason)`
   - `requestChampionCelebration(context)`
8. Implement `requestChampionCelebration()` so:
   - It returns immediately while a load or active controller exists.
   - The first import of `./champion-celebration.js` happens only after the fourth activation.
   - It captures a dedicated celebration generation token; do not reuse
     `window.__trophyGeneration`.
   - After both dynamic import and `startChampionCelebration()` resolve, it rechecks the token,
     `trigger.isConnected`, `bracket.isConnected`, mirrored layout, active view, and current
     `data-team`.
   - A stale resolved controller is immediately destroyed rather than stored.
   - Import/start failure logs a precise warning:
     `Champion celebration could not start; the bracket remains available.`
     Include the original error as the second argument.
   - `finally` clears only the matching load promise so an older promise cannot erase a newer one.
9. Call `teardownChampionCelebration()` before dashboard HTML replacement in `showDashboard()` and
   before dashboard removal in `showLanding()`. Pass
   `requestChampionCelebration` to `initInteractions()`.
10. Build the first `champion-celebration.js` shell with DOM APIs:
    - Validate `team`, `trigger`, `bracket`, and `wrap`; throw a `TypeError` naming the missing
      input before mutating the page.
    - Snapshot and read source geometry before changing anything:
      - `document.documentElement.className`
      - `document.body.className`
      - root/body inline `overflow`
      - `scrollX` and `scrollY`
      - `document.activeElement`
      - `.brk-wrap` `data-view` and `data-layout`
      - map-expand button class, text, and `aria-expanded`
      - the stat-card class, `aria-hidden`, and inline `translate`
      - every existing direct `body` child's prior `inert` property and `aria-hidden` attribute.
      - the active bracket rectangle and active trophy-slot/source rectangle.
    - Do not maintain an application-root ID allowlist. Direct-body notices such as `#stalenote` and
      future controls must be isolated without another code change.
    - Complete every source-geometry read before stage insertion, class changes, `inert`,
      `aria-hidden`, or overflow locking. A vertical-scrollbar change after `overflow: hidden`
      must not shift the captured opening origin.
    - Append one fixed stage directly to `document.body`. Give it `role="dialog"`,
      `aria-modal="true"`, an accessible title containing the country, a local flag via
      `flagCode()`, `assets/trophy-fallback.svg`, the country name, and one visible Skip button.
    - Add `inert` and `aria-hidden="true"` to every direct body sibling except the stage without
      forgetting prior values. Hide the hover stat card while the stage is active.
    - Observe `document.body` child-list additions while active. For every newly added direct sibling,
      snapshot its prior `inert`/`aria-hidden`, isolate it immediately, and include it in restoration.
    - Add the exact body class `champion-celebration-active` plus any scoped root class, then set
      body overflow to hidden.
    - Write the already-captured opening rectangle to CSS custom properties on the stage. Do not
      read layout in an animation loop.
    - Focus Skip with `{ preventScroll: true }`.
    - Register Escape on `document` in the capture phase. When active, call `preventDefault()` and
      `stopImmediatePropagation()` before closing so map expansion and dialogs cannot also react.
    - Trap Tab and Shift+Tab on Skip, the celebration's only focusable control.
11. Make `destroy()` rollback-safe and idempotent:
    - Guard against reentry from Skip, Escape, dashboard rerender, and `onClose`.
    - Disconnect the body-sibling observer, remove capture listeners, and remove the stage.
    - Restore every captured class, attribute, inline property, `inert` value, and
      `aria-hidden` value exactly; do not assume the original was absent.
    - Restore view/layout and map-button state even if a resize handler changed them behind the
      overlay.
    - Restore the stat card's prior visibility contract.
    - After restoring view/layout/map state, schedule `window.__drawConn?.()` so any connector paths
      drawn against transformed geometry during resize are recomputed.
    - Restore scroll position, then focus the original trigger with `{ preventScroll: true }` only
      if it is still connected.
    - Call `onClose(reason)` exactly once after restoration.
    - If construction throws after any mutation, execute the same rollback before rethrowing.
12. In `champion-celebration.css`:
    - Apply `user-select: none`, `-webkit-user-select: none`, and
      `touch-action: manipulation` only to `[data-champion-celebration-trigger]`.
    - Keep the trigger visually undisclosed: no new icon, cursor, tooltip, pulse, or label.
    - Style one viewport-fixed stage above existing dialogs/notices, using explicit
      transform/opacity transitions only.
    - Keep the stage backdrop transparent at opening time so the real bracket remains visible for
      Plan 05's curtain motion. Reserve this z-order:
      dashboard bracket < stage backdrop < celebration canvas/static fallback < trophy ghost <
      controls. The backdrop reaches full opacity only by the cleared-stage hold.
    - Provide desktop and phone arrangements for the static tableau and controls.
    - Add a `prefers-reduced-motion` rule that removes the shell's entrance/exit motion.
    - Do not add `transition: all` or blanket `will-change`.
13. Add deterministic tests:
    - Four immediate activations trigger once.
    - `0ms, 800ms, 1600ms, 2400ms` triggers, proving a paced sequence over two seconds.
    - A fourth activation after more than 2500ms does not trigger.
    - Exactly 2500ms remains inside the accepted boundary.
    - `reset()` clears partial state.
    - Non-finite/backwards input cannot produce a false trigger.
    - Source guards confirm one click path, repeated-key rejection, capture-phase Escape, separate
      generation state, body-level append, and idempotent destroy.
14. Extend `matchcards.mjs`:
    - Exactly one trigger attribute exists in mirrored Actual and one in mirrored My picks.
    - No trigger attribute exists in either Sideways output.
    - Before M104, Actual and My picks identify the entrant's champion.
    - After M104, mirrored Actual's trigger identifies the real champion while My picks still
      identifies the entrant champion.
15. Run `matchcards`, `map-frozen`, and `golden` before fixture updates and confirm only mirrored
    bracket sections fail. Then run:

    ```bash
    node tests/map-frozen.mjs --update
    node tests/golden.mjs --update
    ```

    Review every changed fixture section. The only accepted byte change is the new attribute on the
    two mirrored champion boxes; Sideways and all non-bracket sections must be byte-identical.
16. Add the new test to `npm test`, run:

    ```bash
    node tests/champion-celebration.mjs
    node tests/matchcards.mjs
    node tests/map-frozen.mjs
    node tests/golden.mjs
    npm test
    ```

17. Serve `docs/` and verify the static shell from mirrored Actual and My picks with mouse, touch
    emulation, Enter, and Space. Verify Sideways, three clicks, a slow sequence, repeated keydown,
    and a second trigger while open do nothing.

## Edge cases a weaker model will miss

- Mirrored and Sideways champion helpers are separate. Add the trigger contract only to the current
  mirrored `pickBox()` champion branch; do not refactor or decorate `legacyPickBox()`.
- All four bracket variants exist in the DOM. A document-global selector can return a hidden
  mirrored copy or a Sideways champion.
- A tap already produces `click`. Adding pointer/touch counting makes one tap count twice.
- A rolling window is not the same as "four clicks immediately" or "four clicks before a timeout
  scheduled from the last click."
- Held Enter/Space emits repeated keydown events.
- `Space` scrolls the page unless prevented.
- `dblclick` prevention alone does not stop all selection UI; `selectstart`, scoped CSS, and
  `touch-action` are also required.
- The map Escape listener already exists on `document`. Bubble-phase ownership is too late.
- `inert = false` on cleanup is wrong when a root was already inert. Store and restore the prior
  property and attribute independently.
- A fixed body-ID list will miss `#stalenote` and future direct-body controls. Isolate by DOM
  relationship and observe additions while active.
- `aria-modal="true"` does not trap focus by itself. Inert background siblings and explicitly wrap
  Tab/Shift+Tab across enabled celebration controls.
- Resize can collapse map-expanded mode or coerce Sideways while the overlay is open. Restore the
  captured dashboard contract, not whatever hidden listeners changed it to.
- A resize listener can call `drawConnectors()` while bracket columns are transformed. Suppress
  background connector drawing while the celebration-active class is present and force one redraw
  after restoration.
- Locking body overflow before measuring shifts scrollbar-bearing layouts and creates a visible
  trophy jump on the first frame.
- The hover stat card may never receive `mouseleave` after the stage covers it.
- A lazy import can resolve after Home, a rerender, a layout change, or another generation.
- A stale controller returned after an awaited start must be destroyed, not merely ignored.
- Focusing a disconnected trigger throws in some browser paths; guard `isConnected`.
- Updating snapshots before focused tests pass destroys evidence of an unintended render change.

## Concrete acceptance criteria

- Four valid activations within 2500ms on the active mirrored champion open exactly one stage.
- A paced four-activation sequence spanning 2400ms opens the stage.
- Sideways, hidden bracket copies, repeated keys, three activations, and sequences over 2500ms do
  not open it.
- No trigger hint is visible and repeated activation does not select champion text.
- The stage is a direct child of `body`; every existing or dynamically added direct-body sibling is
  inert and `aria-hidden`; Escape is capture-owned; and Tab/Shift+Tab stay within enabled controls.
- Skip, Escape, Home, dashboard rerender, import failure, and stale import all leave a usable
  dashboard with no stage or listener leak.
- Body/root classes, overflow, map-expanded state, view, layout, scroll, focus, stat-card state,
  existing/dynamic sibling `inert`, and `aria-hidden` restore exactly.
- Actual-after-M104 and My-picks champion identities remain correct.
- Fixture review shows only the intended mirrored trigger attribute changes.
- `node tests/champion-celebration.mjs`, focused render tests, and full `npm test` pass.
- No Three.js scene, dependency, external asset, backend, commit, push, or deployment is
  introduced in this plan.
