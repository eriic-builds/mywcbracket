# Champion celebration V2 results

Status: complete, verified, and release-authorized.

## Executive outcome

The supplied Trophy Lift Storyboard is now implemented in the production celebration scene:

- the protected `3.2s` bracket-card and split-connector curtain remains intact;
- the dashboard trophy travels into a square ivory plinth on the left;
- a path-facing captain appears at `2.2s` behind the fading bracket, enters from screen-left, raises one
  crowd-hype fist, turns toward the trophy,
  acquires both named grips through a crouch/rise pickup, carries to the podium's left steps, climbs,
  and keeps walking sideways to center without showing his back;
- the carried trophy inherits the captain carrier's world quaternion before its grip anchors are read,
  so its orientation and both hands remain coherent through the carry and podium walk;
- a frontal camera translates with its target so the view never becomes a side POV;
- six teammates wait on a broad right-side podium, watch the captain during the carry, and turn front
  with the captain; the seven-player cast has distinct skin tones, hair tones, hairstyles, and varied
  facial hair independent of country identity;
- the trophy remains steady through a front-facing team settle while six compact upper-body
  anticipation poses keep every foot planted and avoid a neighboring-arm lattice;
- one reachable lift and one synchronized jump run from `21.2-24.2s`;
- flares start at `21.28s`, confetti at `21.38s`, and the first burst is visible by the `22.55s`
  trophy apex; the same 12 instanced comets relaunch every two seconds through the `30.0s` teardown;
- six distinct teammate lift celebrations replace the anticipation poses as the trophy rises;
- central banner/flag identity and right-centered payoff effects remain visually separate;
- the tableau restores through the existing deterministic, silent, one-canvas lifecycle.

## Observation

V1 had already solved the hard runtime problems. The remaining visible defects were coarse procedural
silhouettes, a centered dark stage, rear-to-front blocking, early payoff timing, and a trophy transition
that had never been proven after moving the destination off center.

The final dashboard review found one additional defect that the production-backed mock did not expose:
the captured WebGL trophy included transparent canvas padding. Its DOM element could therefore be
positioned correctly while the visible trophy pixels were offset from the 3D trophy.

The July 12 visual review found four more presentation defects: camera-locked walking, crossed
teammate arms, floating/band-like hair, and a stadium that read as brown blocks around a marked pitch.
Those findings drove the final avatar/environment pass rather than another timing-only adjustment.

The final motion review exposed one more pacing defect: the first 46% of the trophy-carry route took
6.5 seconds while the longer remaining 54% was compressed into 1.5 seconds. The same review confirmed
that the two preliminary teammate hops read as additional fake jumps.

The trophy-standard council review found a final visual-system problem: higher segment counts had
smoothed primitives without authoring stronger forms. Radial torsos/heads, shallow stadium shelves,
nearly invisible hair after the head revision, an empty `18-22s` hold, and effects that arrived after
the lift apex still kept the scene below the trophy's finish quality.

The post-build council then found one hot-path defect hidden by the old performance test boundary:
`updateCrowd()` allocated `[-1, 1]` for every supporter on every frame, and the unlit flag recomputed
unused normals every frame. The arm loop is now unrolled, the normal recomputation is removed, and the
performance guard scans every frame-called effect helper rather than only the dispatcher.

The final carry review exposed three remaining continuity defects: the world-fixed trophy rotation made
the captain's hands twist around a sideways prop; waiting until the curtain completed made the opening
feel inactive; and the player factory did not guarantee a visibly broad appearance spread across the
seven hero rigs. The correction derives trophy rotation from the carrier, starts captain travel at
`2.2s`, and makes each hero variant own an explicit appearance contract.

The final Claude Opus 4.8 Technical Taste Council review returned **APPROVE** with no material findings.
It independently reran the focused celebration/performance tests, inspected the transform and render
order, verified the exact-time and real-dashboard frames, and confirmed that the three new goals and
protected runtime contracts agree across code, tests, documentation, and evidence.

## Evidence

### Plan 01 - avatar and trophy fidelity

- Seven player rigs now use 32-segment tapered limbs, authored elliptical torso/pelvis/head lofts,
  overlapping shoulder/deltoid/kit transitions, rounded articulated hands, and shaped boot
  uppers/toes/tongues.
- Player proportions are bounded by `PLAYER_PROPORTIONS`.
- Hands use three thick generated fingers plus a thumb through `PLAYER_FINGER_COUNT`.
- Seven deterministic modeled hair families follow an explicit scalp ellipsoid; every curl and lock is
  embedded into the fitted shell instead of floating above the head.
- Nine skin tones, eight hair tones, seven hair styles, and five facial-hair states are assigned through
  `playerAppearanceForVariant()`. Hero variants `0-6` have seven distinct skin tones, hair tones, and
  styles without deriving appearance from country.
- Cloth, skin, and boots use restrained high-roughness physical-material response with bounded sheen
  and clearcoat; hair and small face pieces remain simpler matte materials.
- Faces add eye whites, pupils/highlights, and retained brows/nose/ears/mouth without changing the
  generic no-likeness contract.
- The shared trophy retains named left/right grips and common dashboard/cutscene construction.
- Its championship silhouette now uses a `0.64`-radius 64-segment globe, raised equator/meridian/latitude
  rings, wider sweeping supports, and a broader multi-tier base.

### Plan 02 - lateral stage

- `STAGE_LAYOUT.plinthX < STAGE_LAYOUT.bannerX < STAGE_LAYOUT.podiumX`.
- The left trophy plinth is spaced farther from the right podium; both remain named factories with
  explicit anchors and disposal.
- Podium architecture is always present; teammate visibility is owned by a separate reveal group.
- The rear teammate platform is higher than the lower front captain platform.
- Camera position X and target X use the same tracked value.
- The stadium uses grass without field markings, continuous corner tiers, fascia, aisles, vomitories,
  roof underside/catwalk/floodlight depth, 480 bounded desktop supporters, 260 phone supporters,
  deterministic supporter scale/value variation, aisle gaps, and separate animated crowd arms.
- The hanging flag and banner remain central while hero lights, glint, flashes, and confetti center on
  the right podium.

### Plan 03 - deterministic story

- The exact phase/story timing is:
  - `0-3.2` opening, with the captain visible and walking from `2.2s`;
  - `3.2-3.4` final curtain clearance around the moving captain;
  - `3.4-5` captain entry;
  - `5-7.2` trophy approach;
  - `7.2-9.2` grab;
  - `9.2-12.9` carry/reveal;
  - `12.9-17.2` left-step climb and sideways platform walk to center;
  - `17.2-18.35` front turn with steady trophy and planted feet;
  - `18.35-21.2` six compact planted anticipation poses with no preliminary jump or partial lift;
  - `21.2-24.2` lift/jump with six distinct teammate poses and effects beginning during the rise;
  - `24.2-26.2` continuation/resolution of confetti, flag, flashes, light, and crowd payoff while flares
    keep relaunching;
  - `26.2-28.5` hold with continuing flare launches;
  - `28.5-30` restore with flares continuing behind the fade until teardown.
- Runtime update functions consume centralized progress and named timing rather than stale V1 seconds.
- `synchronizedJumpEnvelope()` samples to exactly one peak.
- `teamAnticipation` ramps from `18.35-20.55s`; scene blending keeps it active until lift progress
  replaces it while roots and trophy height remain fixed.
- Named effect starts are `21.28s` flares, `21.38s` confetti, `21.32s` crowd peak, `21.2s` lighting,
  `21.65s` flashes, and `22.35s` flag.
- Flare launch spacing is compressed to `0.14s` plus deterministic jitter so early comets crest near
  the `22.55s` trophy apex. Each of the same 12 instances relaunches on a deterministic two-second cycle
  until `CELEBRATION_DURATION`; no new meshes or arrays are created.
- Carry and podium-walk durations are proportional to their route distances, stay within 3% of one
  another's speed, and use linear travel progress with neutral walk-cycle handoffs.
- `headingYaw()` and `interpolateYaw()` make travel orientation numeric, deterministic, and testable.
- Captain join heading now follows the left steps to center and never crosses the rear-facing half-plane.
- `reachableLiftTarget()` and `shoulderToGripDistanceAtLift()` are shared by production and Node tests.
- The shortest supported captain remains inside combined arm reach with margin.
- Trophy rest height is coupled to plinth height, shared trophy bottom anchor, and scene scale.
- Plinth dismissal starts only after handoff begins.
- Captain visibility and entry progress are independent: the rig renders at `2.2s` while walking begins
  behind the protected curtain, eliminating the previous post-curtain dead intro.
- Trophy placement reads the carrier world position and quaternion before reading the rotated named
  grips and solving both arms. `updateOpening()` copies the preallocated rest quaternion before
  `updateTrophy()` can take its pre-handoff early return, so backward scrubs reset orientation.

### Plan 04 - integration correction

The final production dashboard pass changed the continuity implementation in one important way:

1. `trophy.js` captures the live WebGL trophy.
2. The capture is scanned once for non-transparent pixels.
3. A tightly cropped canvas and adjusted CSS rectangle are returned.
4. `projectAnchor("trophy-rest")` projects the shared top/bottom trophy anchors at the final plinth rest
   position, independent of frame-zero settling motion.
5. The DOM trophy ghost scales and translates from its visible source bounds to those exact projected
   rest bounds.
6. The 3D trophy fades in under the captain's hands before handoff begins.

This removed the visible duplicate/floating trophy found only in the real dashboard path.

### Post-plan carry and cast revision

1. `updateTrophy()` copies the `trophyCarrier` world quaternion into a preallocated scratch quaternion.
2. Handoff interpolates from the plinth rest quaternion; subsequent carry frames follow the captain's
   travel heading while the trophy remains a scene-space prop.
3. Grip anchors are sampled only after that position and orientation update, preserving the established
   body -> trophy -> grips -> two-arm IK frame order.
4. The captain reveal overlaps the existing curtain rather than shortening or rewriting it.
5. Seven explicit hero appearance variants provide distinct skin, hair color, and hairstyle silhouettes
   plus five facial-hair treatments without mapping appearance to the winning country.

## Reasoning

The implementation kept the mature trigger, modal isolation, curtain, logical clock, fallback, and
cleanup code because those seams already made the requested visual change inexpensive. Work was split
into static fidelity, static stage, choreography, and proof so motion and confetti could not conceal
weak geometry or contact.

The trophy continuity correction follows the same principle: keep the ownership seam, but improve the
data passed through it. The problem was not animation timing or another missing renderer; it was that
an element rectangle was not equivalent to visible-pixel bounds.

## Decision

- Preserve V1 runtime behavior and history.
- Use procedural local geometry rather than external assets or a new build pipeline.
- Keep one production scene shared by dashboard and review harness.
- Keep all scene output deterministic from logical time.
- Keep player appearance deterministic by neutral rig variant rather than country identity.
- Prove stage relationships and motion envelopes with executable invariants rather than regenerated
  visual snapshots.
- Treat the actual dashboard as the authority for trophy capture, curtain, and lifecycle behavior.

## Tradeoffs

- Procedural avatars remain stylized rather than authored-film digital humans; the gain comes from
  authored profiles and layered form transitions, not external sculpt assets.
- Higher-density player and crowd meshes add bounded geometry cost, but the scene remains one local
  renderer at a `1.5` DPR cap with phone-specific crowd counts.
- The phone composition follows the active story beat and can crop an outer teammate instead of
  shrinking the full stage into a miniature.
- The later lift shortens the final hold, matching the storyboard's timing priorities.
- Alpha-bound scanning adds one small synchronous pass during activation, but it occurs once per
  capture and keeps all frame paths allocation-free.
- The full repository suite still has an unrelated baseline failure; changing the landing ballpit to
  make this task green would be incorrect scope.

## Verification

| Gate | Result |
| --- | --- |
| `node tests/champion-celebration.mjs` | Pass |
| `node tests/animation-performance.mjs` | Pass |
| Match-card, production-regression, frozen-map, golden, match-detail, bracket-tree, bracket-map, and parse suites | Pass; parse skips as designed when the private workbook is absent |
| `python scripts/validate_results.py` | Pass: 28 results, 6 highlights, 16 R32 winners cross-checked |
| `python scripts/validate_match_details.py` | Pass: 28/28 portrait coverage |
| Full `npm test` | Stops only at the known unrelated CRLF-sensitive `tests/landing-ballpit.mjs` source-extraction assertion |
| Production-backed mock | Captain visible during the `2.2-3.2s` curtain overlap, natural `7.8s` pickup, rotated-grip carry at `10.6/14.8s`, diverse `19.6s` cast, effect-visible `22.55s` apex, continuing flare launches at `27.5/29.2s`, backward/forward scrubbing, and no console/page errors |
| Country matrix | England, Brazil, and Ivory Coast grab/final frames remain readable |
| Actual dashboard trigger | Two mirrored DOM triggers exist for responsive copies; exactly one is visible and active |
| Actual curtain | 31 animated cards; 60 animated connector paths; side ownership L=29, R=29, C=2 |
| Actual trophy continuity | Alpha-cropped live trophy reaches exact left rest bounds, crossfades as one visible object, and then rotates with the carrier while both hands follow its named grips |
| Escape restoration | Mirror layout, bracket/wrapper classes, 31 cards, champion identity, and clean body/root state restored |
| Replay | Same canvas node reused; one stage and one attached canvas |
| Reduced motion | Static tableau shown; WebGL canvas hidden; scene module requests = 0 |
| Forced fallback | One visible fallback stage |
| Synthetic context loss | Shared fallback shown; failed canvas hidden; one stage |
| Artifact | Self-contained, 13 sections, four plan reviews, light/dark, desktop/mobile, no external requests |

## Protected surfaces

V2 did not alter the activation count/window, connector-splitting algorithm, curtain construction,
logical clock internals, reduced-motion pre-import rule, context-loss ownership, vendor bundles, render
fixtures, or landing-ballpit implementation.

All screenshots and browser scripts remain in the Copilot session folder rather than the repository.

## Lessons learned

1. Better silhouettes came from better massing, not simply more segments.
2. Static endpoints should be approved before motion is added.
3. A frontal camera truck requires position and target to share the same X.
4. IK clamping is not reach proof; production and tests need the same numeric helper.
5. “Frontal camera” must not be misread as “every body faces the camera”; travel direction should own
   root rotation and the front turn should be an intentional story beat.
6. Scrubbing backward is a lifecycle test for every visibility and opacity state.
7. A production-backed mock prevents renderer drift but cannot prove dashboard-only capture behavior.
8. Transparent pixels are part of compositing geometry; visible bounds must be measured when DOM and
   WebGL objects crossfade.
9. Hair quality depends more on fitting every piece to one scalp surface than on adding disconnected
   decorative clumps.
10. A known unrelated baseline failure should be reported, not opportunistically fixed.
11. Motion pacing must be derived from route distance: smooth easing cannot hide a fivefold speed jump
    between adjacent path segments.
12. Repeating small pre-lift hops weakens the payoff; one deliberate synchronized jump reads more clearly
    than three vertical accents.
13. Segment density is not form design: elliptical massing, overlapping joints, and material hierarchy
    create more perceived quality than smoother cylinders.
14. A stadium reads full-scale through enclosure, openings, aisle rhythm, and roof depth before it reads
    through crowd count.
15. Effects should be timed to the physical story event, not the phase label; launching during the trophy
    rise makes the burst present at the apex.
16. Group-pose review must inspect the combined silhouette: individually valid wide arms can still create
    a six-player lattice.
17. A performance guard is only as strong as its extraction boundary; scan the helpers called by the
    frame dispatcher, not just the dispatcher body.
18. A scene-space prop can stay independent of either hand while still inheriting body orientation;
    update its carrier quaternion before sampling grip anchors and solving IK.
19. Overlap is often a better pacing tool than deletion: beginning the captain entrance behind the
    protected curtain shortens perceived intro time without weakening continuity.
20. Global representation should be an explicit deterministic cast contract, not an incidental modulo
    pattern or a stereotype-prone country-to-appearance mapping.
21. Extending an effect window does not extend a one-shot animation; bounded instances need an explicit
    deterministic relaunch cycle if the visible effect must continue.

Behavior and lifecycle are commit-ready. Separate owner approval authorizes the main-branch push and
the repository's existing Pages workflow publishes the report.
