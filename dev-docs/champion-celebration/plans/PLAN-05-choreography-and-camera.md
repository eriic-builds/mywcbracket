# PLAN: Choreography and camera

**Rank: 5 of 7. Run after Plan 04.**

**Council call:** Sean Grove makes the approved timing table executable rather than interpretive.
Willison/Hamel require deterministic phase tests instead of trusting animation that merely looks
close once. Yegge keeps every beat reviewable as a separate hero frame.

## Goal

Implement the complete approximately 30-second deterministic choreography: bracket curtains,
trophy settle, rear-to-front captain entrance, viewer acknowledgment, trophy approach, trophy grab
and carry, staged team reveal from depth, two fake pumps, full lift, synchronized jump, centered
frontal hero camera, final hold, fade, and exact dashboard restoration.

The choreography must be a pure function of logical scene time. Hidden-tab time does not advance,
resize does not re-read transformed bracket geometry, and Skip/finish/rerender share one cleanup
path.

## Exact files to touch

- `docs/js/champion-celebration-timeline.js` - **new** phase constants, easing helpers, logical
  paused clock, phase lookup, and visual boundaries.
- `docs/js/champion-celebration.js` - logical clock, RAF ownership, visibility pause/resume,
  card-level bracket opening animations, auto-finish, and reduced-motion static timing.
- `docs/js/interact.js` - split mirrored elbow connectors into source/target halves and tag each half
  with its touching card's curtain metadata.
- `docs/js/champion-celebration-scene.js` - deterministic camera, environment, rig, trophy, and
  staging updates for every time.
- `docs/js/champion-celebration-models.js` - pose helpers and stable trophy-grip/hand coordination.
- `docs/css/champion-celebration.css` - opening/fade layers and no-layout-motion styling.
- `tests/champion-celebration.mjs` - timeline boundaries, pause/resume, duplicate start, handoff,
  and source guards.
- `tests/animation-performance.mjs` - no layout/resource creation in the frame path.
- `dev-docs/dev-reports/champion-celebration/mock.js` - synchronize paused-WAAPI curtain timing, connector
  halves, plinth dismissal, and deterministic review controls.
- `dev-docs/dev-reports/champion-celebration/mock.css` - remove old simultaneous column/dissolve rules now
  owned by WAAPI.

Do not touch final flag/confetti implementation, render fixtures, or vendor code.

## Interfaces this plan establishes

`docs/js/champion-celebration-timeline.js` must export:

```js
export const CELEBRATION_DURATION = 30;
export const CELEBRATION_PHASES = Object.freeze([
  { id: "opening", start: 0, end: 3.2 },
  { id: "cleared-hold", start: 3.2, end: 4.0 },
  { id: "captain-entry", start: 4.0, end: 6.2 },
  { id: "trophy-approach", start: 6.2, end: 8.25 },
  { id: "trophy-grab", start: 8.25, end: 9.6 },
  { id: "carry-reveal", start: 9.6, end: 14.2 },
  { id: "captain-joins", start: 14.2, end: 15.4 },
  { id: "fake-pumps", start: 15.4, end: 17.7 },
  { id: "lift-jump", start: 17.7, end: 19.9 },
  { id: "payoff-build", start: 19.9, end: 22.0 },
  { id: "champion-hold", start: 22.0, end: 28.5 },
  { id: "restore", start: 28.5, end: 30.0 },
]);

export function phaseAt(timeSeconds) {}
export function segmentProgress(timeSeconds, start, end, easing = "smooth") {}
export function createCelebrationClock(options = {}) {}
```

The clock returns:

```js
{
  start(now, at = 0),
  tick(now),   // returns logical seconds
  pause(now),
  resume(now),
  value(),
  stop(),
}
```

`tick()` clamps one visible-frame delta to 100ms and never advances while paused/stopped.

## Step-by-step implementation order

1. Confirm the accepted static hero scene from Plan 04 before adding motion. Capture desktop and
   phone stills so choreography changes cannot hide a geometry regression.
2. Implement exact phase data and test boundary ownership:
   - A phase owns `start <= time < end`.
   - `phaseAt(30)` returns a finished state rather than extending `restore`.
   - Do not duplicate timing numbers in the scene or controller; import them.
3. Implement `createCelebrationClock()`:
   - Use passed monotonic `now` values.
   - `pause(now)` accounts for the final visible delta, then stops.
   - `resume(now)` resets the reference timestamp and adds no hidden duration.
   - Ignore backwards/non-finite timestamps safely.
   - Clamp a visible frame gap to 100ms so a busy frame cannot jump across multiple beats.
   - Stop at `CELEBRATION_DURATION`.
4. In the stage controller, own one RAF:
   - RAF calls `clock.tick(now)`, drives card-level opening animations, calls
     `scene.renderFrame(time)`, and schedules the next frame only while active/visible/full-motion.
   - `visibilitychange` pauses the clock and RAF when hidden; resume resets the clock reference.
   - Do not derive scene time from `Date.now()` or animation start timestamps.
5. Build the bracket-curtain opening with the active real DOM:
   - Before mutation, identify the active mirrored `.bkcol[data-side="L"]`,
     `.bkcol[data-side="R"]`, center non-trophy children, connector SVG, and mini-map.
   - Split each elbow connector at its midpoint while drawing it. Tag the source half from its source
     card and the destination half from its destination card with side, column, row, and row count.
   - Create Web Animations API animations once. Immediately pause them and set their `currentTime`
     from logical scene time each frame.
   - Animate each `.mcard` separately rather than moving an entire column.
   - Inner rounds leave first, outer rounds linger, and rows receive a small deterministic stagger.
   - Hold full opacity through the first part of travel, then fade while movement continues.
   - Give each connector half the exact duration, transform, opacity, and stagger of its associated
     card. Unattached center paths and the mini-map may use separate vertical fades.
   - Champion/M104 center content dissolves while the captured trophy remains visible.
   - Use only transform and opacity keyframes.
   - Keep the stage backdrop/canvas visually transparent at `0s` and ramp them to full cover across
     `0.0-3.2s`; otherwise the real bracket curtains animate invisibly behind the stage.
   - Create these animations only after `createChampionScene()` resolves and renders frame zero so a
     slow world load leaves the bracket intact instead of opening onto an empty stage.
   - Cancel all animation objects during teardown so the original DOM styles return without
     manual per-element guessing.
6. Drive the opening `0.0-3.2s`:
   - Captured trophy settles from its normalized source rectangle to the projected plinth target.
   - Disable/remove Plan 02's provisional CSS transition and drive the trophy ghost transform from
     this logical clock. Do not combine per-frame transform writes with an active CSS transition.
   - Plinth begins rising on the first opening frame.
   - Stadium depth and crowd tiers reveal behind it.
   - The trophy grows smoothly to cutscene scale and never disappears.
7. Hold `3.2-4.0s` with the cleared trophy/stadium frame. Do not start captain movement early.
8. Animate captain entry `4.0-6.2s`:
   - Walk from the centered rear tunnel toward the camera using alternating hip/knee/shoulder motion
     and planted foot phases.
   - Keep the captain viewer-facing; do not rotate into a side profile.
   - Use a subtle chest/head settle to establish eye contact rather than unrelated prop business.
   - End balanced behind the trophy on the shared centerline.
9. Animate the acknowledgment and trophy approach `6.2-8.25s`:
   - Begin with a viewer-readable wave and direct body acknowledgment.
   - Redirect the head, eyes, chest, and hands toward the trophy without turning the whole
     performance sideways.
   - Take one measured forward step and settle into a continuous pre-grab reach.
   - Trophy remains stationary on the plinth and untouched.
   - End pose must match the first grab pose without a shoulder, root, or hand pop.
10. Animate trophy grab `8.25-9.6s`:
    - Captain resumes the centered forward approach and reaches around the trophy.
    - Keep the captured DOM trophy visible through the approach.
    - Keep the captain beside the plinth and use the grip anchor to reach the trophy; the player root
      must never pass through the stand.
    - Align the hidden independent 3D trophy exactly at the plinth.
    - Keep the independent trophy as a scene child. At and after `8.85s`, interpolate its world
      position from the plinth to `captain.anchors.trophyCarrier`.
    - Crossfade DOM capture to 3D under the hand mask over no more than 450ms.
    - Read the trophy's named `leftGrip` and `rightGrip` world positions after placing it.
    - Solve each shoulder/elbow chain analytically to its grip target, clamp reach to measured arm
      lengths, use stable outward elbow poles, and close the articulated fingers with
      `setHandGrip()`.
    - Begin dismissing the now-empty plinth at `9.0s`; lower, shrink, and fade it to hidden by
      `10.3s`.
11. Animate carry/team reveal `9.6-14.2s`:
    - Captain carries the trophy forward at the ground carry height, then transitions to
      `STAGE_HEIGHTS.trophyCarry` while joining the podium.
    - Camera remains at `x = 0` and performs an eased forward push only.
    - The full podium with all six teammates reveals symmetrically from depth as one staged group;
      teammates do not walk in individually.
12. Animate join `14.2-15.4s`:
    - Captain steps onto the podium, settles feet at the shared foot level, and turns toward the
      viewer rather than the teammates.
    - Trophy remains in both hands.
13. Animate fake pumps `15.4-17.7s`:
    - Whole team hunches.
    - Two deliberately slow partial pumps with peaks near `16.15s` and `17.05s`.
    - Trophy never reaches full-lift height.
    - Add coordinated anticipation with distinct small teammate offsets.
14. Animate full lift/jump `17.7-19.9s`:
    - Commit to full trophy raise.
    - All seven figures perform one synchronized jump with a shared base jump offset and small
      secondary variations.
    - Trophy remains driven by the world-space carrier and visibly connected to both named hand
      targets.
    - Keep `STAGE_HEIGHTS.trophyLift` physically reachable. Recompute the carrier from captain height
      rather than extending beyond the combined upper-arm and forearm length.
    - Camera performs a controlled centered frontal push; spotlight pulse and flashes are placeholders
      until Plan 06, but camera timing is final here.
    - Land feet back at the exact podium contact level.
15. Animate payoff/hold/restore:
    - `19.9-22.0s`: expose named progress values for flag, crowd peak, lighting, and confetti so
      Plan 06 can fill them without changing timing.
    - `22.0-28.5s`: hold the complete composition and run only restrained secondary motion.
    - `28.5-30.0s`: fade stage and restore bracket.
    - At 30s call the same idempotent destroy path used by Skip/Escape.
16. Reduced motion:
    - Do not run bracket curtains, character motion, RAF, or WebGL import.
    - Use the visibility-aware fallback timer finalized in Plan 06: fade in for 0.5s, hold for 5.0
      active/visible seconds, fade out for 0.5s, and restore.
    - Escape and Skip remain immediate.
    - Hidden time does not consume the hold.
17. Resize/orientation:
    - Scene resize uses cached stage dimensions.
    - Recalculate captured-trophy start from its normalized origin and target from
      `projectAnchor()`.
    - Do not remeasure transformed bracket columns.
    - If source/trigger disconnects, destroy rather than animating stale geometry.
18. Add deterministic tests:
    - Every phase start/end and `30s` finish.
    - Paced visible ticks.
    - Pause for a simulated 20-second hidden interval with zero logical advance.
    - 100ms delta cap.
    - Duplicate start rejection during import and playback.
    - Grab instant, named trophy grips, one stable carrier path, two-arm solve, and reachable lift.
    - Two fake-pump peaks and one full-jump phase.
    - Exact teammate count remains seven total.
    - Shared `CURTAIN_DURATION === 3.2`, card-level staggering, split connector tags, and no
      whole-column animation.
    - Scene creation precedes curtain animation creation.
    - Plinth dismissal spans `9.0-10.3s`.
    - Frame functions contain no layout reads or resource constructors.
19. Browser review each required beat at desktop and phone. Use DevTools pause/breakpoints or a
   temporary local debug invocation only during development; do not ship mock scrubber controls in
   production.

## Edge cases a weaker model will miss

- Browser RAF stops or throttles in hidden tabs, but wall-clock math still jumps unless the logical
  clock explicitly pauses.
- A large visible frame gap can skip the grab, cue, or phase boundary unless delta is capped and
  boundary crossings are handled.
- WAAPI animations have their own document timeline. Pause them and drive `currentTime` from the
  logical clock or they will drift from Three.js.
- One elbow connector belongs visually to two independently moving cards. A single SVG path cannot
  stay attached to both; split it at the elbow and move each half with its own card.
- If the curtain starts before the scene is ready, slow devices reveal a blank modal. Treat world
  readiness as the opening gate, not a background optimization.
- A CSS transition left on the trophy ghost will re-ease every logical-clock transform write and
  drift during hidden-tab pauses.
- Canceling WAAPI animations is required for exact restoration; leaving fill-mode styles can keep
  bracket columns transformed.
- Trophy placement must happen before grip world positions are read, and the arm solve must happen
  after all body/jump motion. Reversing that order creates one-frame hand lag.
- Parenting to one hand makes the other hand drift. Keep the prop in scene space and solve both arms
  to named trophy grips.
- The old `4.55` lift target exceeded physical reach. A clamp inside IK can hide the error by leaving
  the hand short of the trophy; the carrier target itself must be reachable.
- The acknowledgment must not touch the trophy. Starting the grab pose too early removes the
  gratitude-to-intent story and can make the trophy move before the named handoff.
- Two fake pumps must be visibly partial and slow. A generic sine loop can look like three pumps or
  the real lift.
- Teammates are already on the podium during reveal. Do not animate six entrances.
- The captain must face the viewer for hype and acknowledgment, redirect toward the trophy during the
  approach, then face the viewer again for join and final celebration.
- The plinth and captain occupy adjacent z positions on one centerline. Keep enough depth separation
  for the body and stand while both hands reach forward.
- Perspective depth is required to preserve full stadium scale. Do not add orthographic framing,
  tilt-shift blur, depth-of-field blur, or miniature proportions.
- Landing after the jump must use the shared foot/podium constants or figures sink/float.
- Auto-finish and Skip can occur on the same frame. Cleanup and `onClose` must be idempotent.
- Reduced-motion hold timing must pause when hidden even though no RAF is running.
- No production timeline scrubber, phase label, replay button, or mock-only control should ship.

## Concrete acceptance criteria

- All twelve timing phases start/end at the brief's exact boundaries and total 30 seconds.
- Hidden-tab time does not advance the scene or cause catch-up.
- Left/right bracket halves open symmetrically and restore with no residual transform/opacity.
- Inner cards clear first, outer cards linger, and cards remain readable during their initial travel.
- During a sampled mid-cascade frame, a moving card and its connector half have identical computed
  transforms and remain visibly opaque.
- Stage backdrop/canvas opacity reveals the real curtain motion, and the trophy ghost has no
  residual CSS transition after restore.
- Trophy remains continuously visible from bracket source to plinth to captain hands.
- The empty plinth is fully hidden by `10.3s` while the captain continues carrying the trophy.
- The crowd acknowledgment reads clearly, focus shifts to the trophy, and the approach ends in a
  continuous pre-grab pose without touching it early.
- Full team reveals symmetrically from depth as one staged six-teammate group.
- Exactly two fake pumps precede one full lift and one synchronized team jump.
- Trophy remains connected to both named hand grips through carry, pumps, lift, jump, and landing.
- Camera, tunnel, trophy, plinth, captain, podium, team, flag, and banner remain centered with no
  lateral tracking.
- Camera composition is strong and unclipped at desktop and 390x844.
- The final tableau holds from 22.0 through 28.5 seconds.
- Finish, Skip, Escape, Home, rerender, and disconnect restore the dashboard through one cleanup
  path.
- Reduced motion shows a short static tableau with no WebGL/RAF choreography.
- Deterministic tests, performance guards, and full `npm test` pass.
