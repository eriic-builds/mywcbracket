# Champion celebration brief

Status: refined execution brief pending final mock approval.

## Goal

Add a hidden cinematic celebration to the mirrored bracket table. Four rapid activations of the
champion country box should transform the bracket into a fully 3D low-poly winners-stage sequence
rendered with Three.js, without adding a build step, external dependency, hosted model, player
likeness, or backend service.

The standalone choreography mock is the visual reference for this contract, not production code.
Production integration and execution-plan files remain deferred until the user explicitly approves
the mock and this refined brief.

## Trigger

- The target is the champion country box above M104 in mirrored layout:
  `.champ-state .team.champ[data-team]`.
- The M104 match card is not a trigger.
- Four clicks or taps within 2.5 seconds trigger the scene.
- Four Enter or Space activations within 2.5 seconds provide keyboard parity.
- Use one click path for mouse and touch so a tap cannot be counted twice through pointer and click
  handlers.
- Ignore repeated keyboard events and call `preventDefault()` for Space.
- Prevent browser text selection and double-tap selection UI only on the trigger by using targeted
  `user-select: none`, `touch-action: manipulation`, and `selectstart`/`dblclick` default prevention.
  Do not disable context menus or selection globally.
- Resolve the active visible mirrored bracket and read its champion at activation time rather than
  caching a global champion element.
- The counter resets when:
  - 2.5 seconds elapse;
  - the bracket view changes;
  - the layout changes;
  - a scene finishes or is skipped; or
  - the dashboard is torn down.
- Sideways layout never triggers the feature.
- The interaction remains undisclosed. No tooltip or visible hint announces it.

## Celebrated country

The scene reads the team from the currently visible champion box at trigger time.

- In My picks, it celebrates the user's predicted champion.
- In Actual path, existing render logic switches to the real champion after M104 is complete.
- Before M104, Actual path may still show the user's pick.
- An eliminated predicted champion still receives a fantasy celebration.
- Any team with a bundled flag is supported. There is no contender allowlist and no sync-time asset
  deletion.

## Choreography

Target duration: approximately 30 seconds.

### Timing contract

| Time | Required beat |
| --- | --- |
| `0.0-3.2s` | Mirrored bracket halves collapse outward and dissolve while the trophy settles, the plinth rises, and the stadium and crowd emerge. |
| `3.2-4.0s` | Hold the cleared trophy-and-stadium frame. |
| `4.0-6.2s` | Captain enters from the left and performs viewer-facing hype moves. |
| `6.2-8.25s` | Captain pauses for the viewer-facing golf swing; trophy remains on the plinth. |
| `8.25-9.6s` | Captain resumes, masks the aligned trophy crossfade under the grab, and begins carrying it. |
| `9.6-14.2s` | Camera follows the carry while the full staged team podium reveals from the right. |
| `14.2-15.4s` | Captain joins the podium and faces the viewer. |
| `15.4-17.7s` | Captain and teammates hunch through two slow fake pumps. |
| `17.7-19.9s` | Full lift and one synchronized team jump. |
| `19.9-22.0s` | Flag, crowd, score, lighting, and confetti build in sequence. |
| `22.0-28.5s` | Hold the complete champion tableau. |
| `28.5-30.0s` | Fade the celebration and restore the bracket exactly. |

Small interpolation refinements are allowed during production, but the ordering, staging, and
approximately 30-second shape must not change without user approval.

1. The existing bracket trophy remains continuously visible. As the cutscene opens, it settles
   smoothly downward and grows to cutscene scale while the plinth rises beneath it. It does not
   disappear or get replaced.
2. The left bracket rounds collapse and dissolve toward the left edge while the right rounds mirror
   that motion toward the right edge, opening the center like curtains.
3. During the slower bracket fade:
   - the trophy plinth begins rising on the first fade frame beneath the settling trophy;
   - the night-stadium environment emerges; and
   - layered low-poly fans appear behind it and begin bopping.
4. The cleared trophy-and-stadium frame holds briefly before the captain enters.
5. A generic low-poly captain with a visible `C` armband on the right arm walks in from the left in
   profile, then turns to face the viewer for a short pair of hype arm pumps and shoulder bounces.
6. The captain pauses before the trophy and performs a viewer-facing golf-swing celebration with a
   clear backswing, downstroke, and follow-through. The trophy is already fully settled on its
   plinth and remains untouched throughout this celebration.
7. The captain resumes walking, swipes the same continuously visible trophy from its plinth, and
   keeps moving right while carrying it. The DOM-to-3D handoff occurs under the captain's grab.
8. As the camera tracks with the captain, the winners podium comes into view from the right with all
   six teammates already standing on it as one staged group.
9. The captain joins the team, turns to face the viewer rather than the teammates, and holds the
   trophy ready for the lift.
10. The captain and teammates hunch down together and follow two slow fake trophy pumps.
11. The captain commits to the full raise as the whole team performs one synchronized jump. The
    trophy remains visibly held and rises with the captain's hands throughout the jump, framed in a
    hero shot with a subtle low-angle push, spotlight pulse, and photographer-style flashes.
12. The payoff builds in sequence rather than all at once:
    - the country flag unfurls;
    - the crowd and original stadium anthem reach their peak;
    - country-color confetti begins; and
    - teammates bounce and celebrate.
13. The completed champion tableau holds for roughly six additional seconds so the user can watch
    the raised trophy, teammates, flag, crowd, confetti, and stadium-anthem payoff before restoring
    the previous bracket view, scroll position, and focus.

## Visual direction

- This is a 3D low-poly build, not a 2D animation or video overlay.
- Low-poly geometry built procedurally with the locally vendored Three.js module.
- One captain and six teammates.
- The captain has a clearly readable `C` armband on the right arm.
- Generic figures only:
  - no real faces;
  - no names;
  - no recognizable player identity;
  - no portrait or likeness asset; and
  - no individual jersey number intended to identify a player.
- A consistent night-stadium look independent of the dashboard theme.
- Team identity comes from:
  - sampled flag colors;
  - kit materials;
  - the bundled flag; and
  - confetti colors.
- The flag should unfurl behind the team as the trophy rises.
- The crowd should read as a layered stadium mass, not hundreds of detailed characters.
- The standalone mock is a choreography and capability blockout, not a production asset library or
  visual-quality ceiling. Production must rebuild the figures, animation, trophy interaction,
  stadium, lighting, materials, crowd, flag, and effects at substantially higher fidelity without
  changing the approved staging.

## Production quality bar

The finished scene should feel like a bespoke low-poly tournament cinematic, not the standalone mock
copied into the dashboard.

- Use original procedural geometry with deliberate faceting, coherent proportions, strong
  silhouettes, layered materials, and clean contact points.
- Replace blockout limb motion with a readable hierarchical rig: planted feet, believable weight
  shifts, clear anticipation and follow-through, stable podium contact, and hands that remain
  connected to the trophy.
- Give the captain and teammates distinct but coordinated secondary motion so the group feels alive
  without using real-player identity.
- Build stadium depth through multiple crowd tiers, structural silhouettes, field markings,
  atmospheric falloff, light rigs, and restrained motion variation rather than one flat backdrop.
- Treat the trophy as the visual hero with refined low-poly geometry, controlled metallic response,
  readable seams, glints, and uninterrupted continuity from bracket to plinth to hands.
- Use cinematic composition throughout: purposeful low-angle framing, camera easing, parallax,
  foreground/background separation, spotlight rhythm, photographer flashes, and a final frame that
  remains visually strong for the full hold.
- Make the flag a segmented low-poly cloth object with convincing unfurl and wave motion rather than
  a flat static rectangle.
- Use country colors as an art-directed palette for kits, flag, crowd accents, light accents, and
  confetti without washing the entire scene in one color.
- Every major beat should produce a reviewable hero frame at desktop size, while the phone
  composition keeps the captain, trophy, teammates, and flag readable without clipping.
- Deliver the visual impact through modeling, animation, lighting, timing, and composition—not
  unbounded geometry, particles, pixel ratio, external assets, or expensive post-processing.

## Sound

- Silent by default.
- A visible sound control appears only inside the celebration.
- Sound starts only from an explicit user activation.
- Use procedural Web Audio for a pumped, original stadium-anthem score:
  - layered crowd swell and chant texture;
  - kick-and-clap pulse;
  - low brass/choir-style synthesized motif;
  - a golf-swing whoosh;
  - a trophy-grab stinger; and
  - a lift riser and payoff.
- The score may evoke elite tournament ceremony energy, but must not reproduce the UEFA Champions
  League anthem or any other existing melody or recording.
- No audio file, remote request, autoplay, or persistent sound preference is required.
- Stop and close every source, node, and audio context when sound is disabled or the scene ends.

## Input and lifecycle

- Escape and a visible Skip control close the scene.
- The scene is replayable after completion or skip.
- Touch devices are supported when WebGL is available.
- Product Motion on/off continues to control only the landing-page balls.
- Operating-system `prefers-reduced-motion` receives a short static or near-static champion tableau.
- WebGL initialization failure or context loss receives a static fallback.
- Pause timeline and audio while the document is hidden.
- Hidden time must not advance the logical timeline or cause a wall-clock catch-up on resume.
- Handle resize and orientation change without retaining stale bracket geometry.
- Prevent duplicate starts while import or playback is active.
- A skip or dashboard teardown while the lazy import is pending must invalidate that import.
- A dashboard re-render must invalidate any late lazy import and cleanly end an active scene.
- While active, the celebration owns Escape in the capture phase and prevents background map
  expansion or other controls from reacting to the same key.
- Background dashboard content must not remain pointer- or keyboard-operable beneath the stage.
- Preserve and restore any prior `inert`, `aria-hidden`, focus, inline overflow, and root/body class
  state rather than assuming defaults.
- Restore:
  - body overflow;
  - map-expanded state;
  - bracket layout and view;
  - scroll position;
  - trigger focus;
  - hover stat-card visibility; and
  - the normal trophy.

## Technical constraints

- Static GitHub Pages deployment from `docs/`.
- Vanilla HTML, CSS, and ES modules.
- No frontend build step.
- No package-manager runtime dependency.
- No external model, texture, font, script, audio, analytics, or API request.
- Reuse bundled flag SVG files and local Three.js.
- Keep one celebration WebGL canvas.
- The existing bracket trophy canvas is separate; pause unnecessary live trophy rendering while the
  celebration owns the screen and do not create celebration canvases on replay.
- Bound device-pixel ratio and particle counts.
- Use instancing for crowd and confetti.
- Cache geometry, materials, dimensions, and sampled palettes outside the frame loop.
- Do not perform layout reads or create geometry, materials, or arrays per animation frame.
- Pause or stop every frame loop when hidden, finished, skipped, or torn down.
- Dispose WebGL, texture, geometry, material, listener, timer, frame, and audio resources.
- Keep stage heights such as podium top, player foot level, trophy carry, and jump offsets in shared
  constants so the trophy and bodies cannot drift apart.

## Architecture direction to validate

- Attach the full-screen stage to `document.body`; use the bracket rectangle only to calculate the
  opening transform.
- Scope the trigger to the active mirrored bracket because all four bracket variants exist in the
  DOM.
- Do not add a trigger contract through the shared `pickBox(..., champ=true)` path unless it is
  explicitly gated to mirrored output; Sideways champion boxes must remain inert.
- Lazy-load production celebration code only after the fourth activation.
- Use the existing generation-counter pattern to reject stale dynamic imports.
- Share pure trophy geometry in production, but keep the cutscene trophy independent from the live
  trophy renderer.
- Freeze or clone the live trophy visual, settle that same-looking object onto the emerging plinth,
  and keep it visible through the golf celebration. Crossfade to the aligned independent 3D trophy
  only under the captain's grab rather than reparenting the running trophy scene.
- The visible trophy source may be a WebGL canvas on desktop or the SVG fallback on a narrow
  container. Cloning a canvas node does not clone its pixels, so production must use a reliable
  render-then-capture path for the active visible canvas and an image path for the fallback.
- Ignore hidden trophy slots and measure only the active mirrored source.
- Transfer the cutscene trophy to the captain with `Object3D.attach()` to preserve world position.
- Let the celebration own Escape while active so map expansion cannot also react.
- Create or resume Web Audio synchronously inside the sound-button gesture.
- Enabling sound after playback has started must join the current score state without replaying every
  elapsed cue.

## Production verification contract

The implementation plans must preserve the existing no-build test style and add focused coverage
without introducing a browser-test dependency.

- `tests/matchcards.mjs` must verify that any trigger data contract appears only on mirrored champion
  boxes, preserves Actual-after-M104 versus My-picks identity, and does not enable Sideways.
- `tests/map-frozen.mjs` and `tests/golden.mjs` must fail before any intentional render-contract
  update. Fixture updates require review of every changed section before acceptance.
- Add deterministic tests for the four-activation rolling window, active champion selection,
  timeline phase boundaries, pause/resume accounting, and duplicate-start rejection.
- Extend lifecycle/performance source guards to cover local Three.js, one celebration canvas,
  instancing, bounded pixel ratio and particles, no layout reads or resource creation in the frame
  loop, context-loss fallback, and complete teardown.
- `npm test` must pass after focused tests and any intentional fixture review.
- Browser review must cover desktop and phone widths, Actual and My picks, pre- and post-M104
  champions, at least England, France, Spain, Argentina, Switzerland, and Germany, click/tap and
  keyboard activation, map-expanded launch, resize/orientation, hidden-tab resume, replay, Skip
  during import and playback, reduced motion, real context loss, deterministic fallback, and no
  external requests.
- A paced four-activation sequence spanning more than two seconds but less than 2.5 seconds must
  trigger, proving the final threshold rather than only testing four immediate clicks.
- Repeated activation must not select champion text or open the browser's text-selection menu on
  Edge/Chrome desktop or touch review.
- Human review must confirm the original procedural score, golf cue, grab cue, and lift payoff; an
  automated lifecycle check alone cannot approve sound design.

## Fresh-session planning handoff

After explicit approval, a fresh session must read `dev-docs/CLAUDE.md`,
`dev-docs/TECHNICAL_TASTE_COUNCIL.md`, this brief, `BASELINE.md`, and the current production source
and tests. It must decide and justify the number of ranked production `PLAN-<slug>.md` files needed
to execute the feature. Those plans build the real dashboard feature; they are not mock-refinement
plans. Each plan must be self-contained, name exact files and interfaces, carry hidden edge cases and
cleanup paths, and provide concrete machine- and user-verifiable acceptance criteria.

## Mock review controls

The standalone mock may expose controls that production will not:

- Play/replay.
- Pause/resume.
- Timeline scrubber.
- Labeled phase display.
- Team selector.
- Sound toggle.
- Reduced-motion preview.
- Skip/reset.

## Mock review questions

- Does the trophy feel like one continuous physical object?
- Does the trophy settle smoothly onto the plinth and remain there through the golf swing?
- Does the outward bracket-curtain motion create enough room and anticipation?
- Does the trophy plinth and bopping stadium crowd emerge clearly during the fade?
- Is the cleared-stage hold long enough before the captain enters?
- Does the left-to-right walk make the moving trophy swipe understandable?
- Does the team reveal naturally from the right while the captain carries the trophy?
- Is the `C` armband readable?
- Is the viewer-facing golf swing readable as a backswing, strike, and follow-through?
- Does the captain clearly turn to face the viewer for the final celebration?
- Do the slower crouched fake pumps feel like a team taunt rather than the real lift?
- Does the synchronized jump keep the trophy visibly connected to the captain's hands?
- Does the low-angle push, lighting pulse, and flash rhythm make the lift feel larger?
- Is the buildup to crowd, flag, and confetti paced correctly?
- Does the original hype score feel pumped without overwhelming the scene?
- Does the low-poly treatment feel intentional?
- Is the duration right?
- Does the scene restore the bracket cleanly?

## Acceptance gate before production plans

- The standalone mock demonstrates the complete sequence.
- The user approves the timing, camera, staging, team count, flag, confetti, crowd, and sound.
- The reduced-motion and WebGL fallback direction is approved.
- The brief is revised to match the approved mock.
- No production ambiguity remains that would require a cloud agent to infer intent.
- Only then may `dev-docs/[05]-champion-celebration/plans/` be created.

## Publishing gate

Keep the feature package and mock local and uncommitted during review. Do not push, deploy, create a
PR, or start a GitHub cloud-agent task without separate approval.
