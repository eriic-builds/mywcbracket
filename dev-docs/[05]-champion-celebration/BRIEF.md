# Champion celebration brief

Status: implementation complete and release-authorized.

> **V2 successor:** This file preserves the completed V1 frontal baseline. The storyboard-driven
> left-to-right revamp is specified in
> [`../[06]-champion-celebration-v2/BRIEF.md`](../[06]-champion-celebration-v2/BRIEF.md). V2 intentionally
> supersedes V1's centered rear-to-front blocking and no-lateral-tracking rule while preserving the
> trigger, bracket curtain, trophy continuity, silent lifecycle, fallbacks, and one-canvas ownership.

## Goal

Add a hidden cinematic celebration to the mirrored bracket table. Four rapid activations of the
champion country box should transform the bracket into a full-scale 3D soft-matte clay winners-stage
sequence rendered with Three.js, without adding a build step, external dependency, hosted model,
player likeness, or backend service.

The standalone choreography review now instantiates the production scene controller. It is a
scrubbable review harness rather than a second renderer, so approved review frames and dashboard
behavior share the same camera, rigs, trophy, environment, and choreography. The ranked planning
request satisfied the planning gate, and the later build request authorized local implementation.
Commit and main-branch push were deferred during implementation and later authorized for this release.

Implementation evidence and remaining environment notes are recorded in [`RESULTS.md`](RESULTS.md).

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
| `0.0-3.2s` | Mirrored bracket cards leave in a center-out cascade while their connector halves travel with them; the trophy settles, the plinth rises, and the stadium, crowd, and champions banner emerge. |
| `3.2-4.0s` | Hold the cleared trophy-and-stadium frame. |
| `4.0-6.2s` | Captain enters from the centered rear tunnel toward the viewer and settles on the trophy axis. |
| `6.2-8.25s` | Captain acknowledges the viewer, focuses on the trophy, and takes a measured approach; trophy remains on the plinth. |
| `8.25-9.6s` | Captain resumes, masks the aligned trophy crossfade under the grab, and begins carrying it. |
| `9.6-14.2s` | The camera pushes forward while the full staged team podium reveals symmetrically from depth. |
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
2. The left bracket rounds collapse toward the left edge while the right rounds mirror that motion
   toward the right edge, opening the center like curtains.
3. During the slower bracket fade:
   - inner rounds leave before outer rounds so the center clears first;
   - cards within each round receive a small row stagger and retain opacity during their initial
     travel instead of vanishing immediately;
   - every elbow connector is split into source and destination halves so each half can use the exact
     transform and timing of the card it touches;
   - the timeline does not start until the Three.js world has initialized and rendered frame zero,
     leaving the bracket readable while the world loads;
   - the trophy plinth begins rising on the first fade frame beneath the settling trophy;
   - the night-stadium environment and `2026 WORLD CUP CHAMPIONS` country banner emerge; and
   - layered procedural fans appear behind it and begin bopping.
4. The cleared trophy-and-stadium frame holds briefly before the captain enters.
5. A generic smooth clay-avatar captain with a visible `C` armband on the right arm walks out of the
   centered rear tunnel toward the camera. The captain remains viewer-facing so the entrance reads as
   direct interaction rather than a side-view traversal.
6. The captain acknowledges the viewer with a brief wave and body lean, redirects focus to the
   trophy, takes a controlled forward step, and settles into the pre-grab reach. The trophy is already
   fully settled on its plinth and remains untouched throughout this beat.
7. The captain resumes the centered approach, takes the same continuously visible trophy from its
   plinth, and carries it toward the team. The DOM-to-3D handoff occurs under the captain's grab. The
   now-empty plinth drops, shrinks, fades, and is gone by `10.3s` so it does not follow the carry.
8. As the camera performs a restrained forward push, the winners podium advances into view from depth
   with all six teammates already standing on it as one symmetric staged group.
9. The captain joins the centered team formation while remaining oriented toward the viewer and holds
   the trophy ready for the lift.
10. The captain and teammates hunch down together and follow two slow fake trophy pumps.
11. The captain commits to the full raise as the whole team performs one synchronized jump. The
    trophy remains visibly held and rises with the captain's hands throughout the jump, framed in a
    centered frontal hero push with a spotlight pulse and photographer-style flashes.
12. The payoff builds in sequence rather than all at once:
    - the country flag unfurls without hiding the champions banner;
    - the crowd motion and stadium lighting reach their peak;
    - country-color confetti begins; and
    - teammates bounce and celebrate.
13. The completed champion tableau holds for roughly six additional seconds so the user can watch
    the raised trophy, teammates, flag, champions banner, crowd, confetti, and lighting payoff before
    restoring the previous bracket view, scroll position, and focus.

## Visual direction

- This is a full-scale 3D soft-matte clay build, not a 2D animation or video overlay.
- Bounded procedural geometry built with the locally vendored Three.js module.
- Use a centered, straight-on elevated perspective composition with natural perspective and full
  stadium depth. Camera, rear tunnel, plinth, trophy, captain, podium, team, flag, and champions banner
  share one visual centerline. Do not use lateral camera tracking, a side-view presentation,
  orthographic toy framing, miniature proportions, tilt-shift blur, depth-of-field blur, or a tabletop
  base treatment.
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
  - the bundled flag;
  - confetti colors;
  - the generated `2026 WORLD CUP CHAMPIONS` banner; and
  - the winning-country name rendered on that banner.
- The flag should unfurl behind the team as the trophy rises without obscuring the banner's title.
- The crowd should read as a layered stadium mass with separate bodies and heads, not hundreds of
  detailed characters.
- The standalone review is a production-backed inspection surface, not a second asset library. It must
  import `createChampionScene()` and may add review controls around it, but it may not duplicate the
  figures, trophy, camera, stadium, or choreography.

## Production quality bar

The finished scene should feel like a bespoke stylized tournament cinematic, not the standalone mock
copied into the dashboard.

- Use original bounded smooth procedural geometry with rounded capsules, higher-resolution heads,
  sculpted hair masses, layered clay kit forms, coherent proportions, strong silhouettes, and clean
  contact points. Obvious faceting and coarse assembled-primitives silhouettes are regressions.
- Replace blockout limb motion with a readable hierarchical rig: planted feet, believable weight
  shifts, clear anticipation and follow-through, stable podium contact, articulated clay palms,
  fingers, and thumbs, and deterministic two-bone arm targeting.
- Give the trophy named left/right grip anchors. Solve both arms to those real world-space targets
  after the trophy is positioned on every frame; do not visually approximate the contact or parent the
  trophy to one hand.
- Give the captain and teammates distinct but coordinated secondary motion so the group feels alive
  without using real-player identity.
- Build stadium depth through multiple crowd tiers, side wings, roof structure, lamps, field markings,
  atmospheric falloff, a championship banner, light rigs, and restrained motion variation rather than
  one flat backdrop.
- Treat the trophy as the visual hero with a smooth globe, curved supports, a lathed stem and base,
  controlled metallic response, readable seams, glints, and uninterrupted continuity from bracket to
  plinth to hands.
- Use cinematic composition throughout: centered frontal framing, a restrained long-lens perspective,
  forward camera easing, foreground/background separation, spotlight rhythm, photographer flashes,
  and a final frame that remains visually strong for the full hold.
- Make the flag a segmented procedural cloth object with convincing unfurl and wave motion rather than
  a flat static rectangle.
- Use country colors as an art-directed palette for kits, flag, crowd accents, light accents, and
  confetti without washing the entire scene in one color.
- Every major beat should produce a reviewable hero frame at desktop size, while the phone
  composition keeps the captain, trophy, teammates, and flag readable without clipping.
- Deliver the visual impact through modeling, animation, lighting, timing, and composition—not
  unbounded geometry, particles, pixel ratio, external assets, or expensive post-processing.

## Silence

- The celebration is intentionally silent.
- Do not show a sound control or create Web Audio, media elements, audio files, autoplay behavior, or
  sound preferences.
- Timing, choreography, crowd motion, lighting, flashes, flag motion, and confetti carry the full
  emotional payoff.

## Input and lifecycle

- Escape and a visible Skip control close the scene.
- The scene is replayable after completion or skip.
- Touch devices are supported when WebGL is available.
- Product Motion on/off continues to control only the landing-page balls.
- Operating-system `prefers-reduced-motion` receives a short static or near-static champion tableau.
- WebGL initialization failure or context loss receives a static fallback.
- Pause the timeline while the document is hidden.
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
- No sound/audio capability and no external model, texture, font, script, media, analytics, or API
  request.
- Reuse bundled flag SVG files and local Three.js.
- Keep one celebration WebGL canvas.
- The existing bracket trophy canvas is separate; pause unnecessary live trophy rendering while the
  celebration owns the screen and do not create celebration canvases on replay.
- Bound device-pixel ratio and particle counts.
- Bound player topology rather than importing or generating unbounded models; the production profile
  uses 24 radial body segments, 32 head segments, and 10 capsule-cap segments.
- Use instancing for crowd and confetti.
- Cache geometry, materials, dimensions, and sampled palettes outside the frame loop.
- Do not perform layout reads or create geometry, materials, or arrays per animation frame.
- Pause or stop every frame loop when hidden, finished, skipped, or torn down.
- Dispose WebGL, texture, geometry, material, listener, timer, and frame resources.
- Keep stage heights such as podium top, player foot level, trophy carry, and jump offsets in shared
  constants so the trophy and bodies cannot drift apart.
- Keep `trophyLift` within the captain's measured upper-arm plus forearm reach. A visually dramatic but
  unreachable target is a rig defect, not an animation flourish.

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
  and keep it visible through the crowd-acknowledgment and trophy-approach beat. Crossfade to the aligned independent 3D trophy
  only under the captain's grab rather than reparenting the running trophy scene.
- The visible trophy source may be a WebGL canvas on desktop or the SVG fallback on a narrow
  container. Cloning a canvas node does not clone its pixels, so production must use a reliable
  render-then-capture path for the active visible canvas and an image path for the fallback.
- Ignore hidden trophy slots and measure only the active mirrored source.
- Keep the cutscene trophy as a scene child and drive it from a stable captain-owned world-space
  carrier. After placing it, read the trophy's named left/right grip anchors and solve both arms to
  those targets. This avoids hierarchy offsets, one-hand drift, and circular hand/trophy dependencies.
- Split each bracket elbow connector at its midpoint and tag both halves with the touching card's
  side, round, row, and row count so line and card transforms cannot drift.
- Create the curtain animations only after scene creation succeeds and frame zero renders; slow scene
  startup must delay the cutscene rather than expose an empty stage.
- Generate the champions banner as a local disposable `CanvasTexture` with auto-fitted country text.
- Dismiss the trophy plinth from `9.0-10.3s` after the grab rather than leaving an empty stand in the
  carry shot.
- Let the celebration own Escape while active so map expansion cannot also react.
- Keep production and the standalone mock silent; a sound control, audio module, cue API, or Web
  Audio construction is a product regression.

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
- Add deterministic guards for the shared `3.2s` curtain duration, card-level center-out staggering,
  split/tagged connector halves, scene-ready ordering, bounded player segments, generated pitch and
  banner textures, named trophy grips, reachable lift height, two-arm targeting, production-backed
  review, and `9.0-10.3s` plinth dismissal.
- Add a silence guard that fails if a sound control, celebration audio module, audio cue API, or Web
  Audio construction is introduced.
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

## Planning handoff history

The implementation session read `dev-docs/CLAUDE.md`,
`dev-docs/TECHNICAL_TASTE_COUNCIL.md`, this brief, `BASELINE.md`, the ranked plans, and the current
production source/tests before building the feature. The seven plans remain as the mechanical
execution history and review contract.

## Mock review controls

The standalone mock may expose controls that production will not:

- Play/replay.
- Pause/resume.
- Timeline scrubber.
- Labeled phase display.
- Team selector.
- Reduced-motion preview.
- Skip/reset.

## Mock review questions

- Does the trophy feel like one continuous physical object?
- Does the trophy settle smoothly onto the plinth and remain there through the acknowledgment and approach?
- Do inner cards move first, outer cards linger, and opacity remain readable during travel?
- Do both connector halves remain visually attached to their respective moving cards?
- Does the trophy plinth and bopping stadium crowd emerge clearly during the fade?
- Does the empty trophy plinth disappear during the carry rather than lingering in frame?
- Is `2026 WORLD CUP CHAMPIONS` and the winning country readable without fighting the final flag?
- Is the cleared-stage hold long enough before the captain enters?
- Does the rear-to-front entrance make the captain feel like they are interacting directly with the
  viewer?
- Does the team reveal symmetrically from depth while the captain carries the trophy?
- Is the `C` armband readable?
- Does the acknowledgment read as gratitude before the captain visibly redirects focus to the trophy?
- Does the captain remain readable and viewer-facing throughout the entrance, acknowledgment, carry,
  and final celebration?
- Do the slower crouched fake pumps feel like a team taunt rather than the real lift?
- Do both hands remain on the named trophy grips through grab, carry, pumps, lift, jump, and hold?
- Does the centered frontal push, lighting pulse, and flash rhythm make the lift feel larger?
- Do the trophy, plinth, tunnel, team, banner, flag, and camera stay on one coherent centerline?
- Is the buildup to crowd, flag, and confetti paced correctly?
- Do the rounded clay avatars, smooth trophy, and matte stadium language feel cohesive without reading
  as miniature, faceted, or toy-scaled?
- Is the duration right?
- Does the scene restore the bracket cleanly?

## Acceptance gate before production plans

- The standalone mock demonstrates the complete sequence.
- The user approves the timing, camera, staging, team count, flag, confetti, and crowd.
- The reduced-motion and WebGL fallback direction is approved.
- The brief is revised to match the approved mock.
- No production ambiguity remains that would require a cloud agent to infer intent.
- Only then may `dev-docs/[05]-champion-celebration/plans/` be created. This gate was crossed by the
  user's direct production-planning request. The later build request authorized local implementation,
  and separate owner approval later authorized this release's commit and main-branch push.

## Publishing gate

Keep the feature package and mock local and uncommitted during review. Do not push, deploy, create a
PR, or start a GitHub cloud-agent task without separate approval. That approval was granted for this
release's commit and main-branch push.
