# PLAN 02: Build the lateral storyboard stage

**Rank: 2 of 4. Leverage: 9.8/10. Run after Plan 01.**

**Execution status: complete. Final evidence is recorded in `../RESULTS.md`.**

**Post-execution revision:** the July 12 environment pass moved the plinth farther left, removed pitch
markings, softened tier/deck geometry, added concourse/rail depth, increased bounded crowd density, and
gave instanced supporters animated arms. The final trophy-standard pass closed the arena with corner
tiers, added fascia/aisles/vomitories, deepened the roof with an underside and catwalk, added floodlight
banks, and introduced deterministic crowd scale/value variation without increasing supporter counts.

**Council call:** Karpathy requires static key poses before animation. Naval exploits the existing
anchor-driven trophy seam instead of rewriting continuity. Russinovich keeps camera motion to bounded
translation and widens only the shadow/framing budget required by the new stage.

## Goal

Build and approve the static V2 world:

- tall square ivory trophy plinth on the left;
- broad ivory winners podium on the right with a rear team platform, side steps, and lower front
  captain platform;
- warm full-scale stadium and pitch;
- banner and hanging country flag anchored to the central tunnel while payoff lights recenter on the
  right podium;
- captain grab pose on the left and final pose on the right;
- straight-on camera whose X position and target translate together;
- right-centered payoff lights and confetti;
- desktop and phone key frames that remain readable.

This plan proves composition with still frames. It does not yet re-time the 30-second story.

## Observation

V1 deliberately placed camera, plinth, captain, team, podium, flag, and banner on `x = 0`. The
storyboard requires two distinct locations and a rightward camera truck. The current podium is hidden
inside the winners group, so it cannot serve as visible destination architecture before the teammates
reveal.

## Evidence

- `trophyRestPosition`, plinth, plinth anchor, captain, winners group, effects, and camera all use
  centered X values.
- The controller and mock both call `projectAnchor("plinth")`; they do not assume the plinth is
  centered.
- `createPodium()` returns a root and top anchor, so its geometry can change without changing callers.
- Current effect emitters and flag positions are hardcoded around X `0`.
- The phone profile already compresses teammate spacing without allocating new rigs.

## Reasoning

Static composition must be solved before motion because a moving camera can make a weak layout appear
temporarily acceptable. Named stage constants make the lateral relationship explicit and maintainable.
The trophy continuity seam is already generic, so the safest change is to move the scene anchor and
verify it rather than modify the controller.

## Decision

- Add one named `STAGE_LAYOUT` contract.
- Move the plinth left and podium right.
- Move podium architecture out of the hidden teammate group.
- Build the storyboard podium as broad ivory geometry with a lower circular captain platform.
- Build the plinth as rounded square ivory geometry in a named factory.
- Warm the stadium and pitch.
- Keep banner, tunnel dressing, and hanging flag on a named central `bannerX`. Recenter hero lights,
  flashes, glint, and confetti around the final podium focus.
- Translate camera position and target by the same X.
- Keep the camera perspective/frontal; do not introduce an orthographic or side view.

## Tradeoffs

- The phone cannot display both ends of the lateral stage at full detail simultaneously. It will frame
  the current beat and pan, which is preferable to compressing the world into toy proportions.
- Keeping the banner/flag central while action finishes right creates two depth layers that must be
  composed deliberately, but it matches the storyboard's tunnel identity and podium relationship.
- Ivory stage surfaces require more careful light and contact-shadow tuning than dark geometry.

## Exact files to touch

- `docs/js/champion-celebration-models.js`
  - `STAGE_HEIGHTS`;
  - new `STAGE_LAYOUT`;
  - rounded stage-geometry helper reuse;
  - named `createTrophyPlinth()` factory;
  - rebuilt `createPodium()` factory and anchors;
  - warm stadium materials, field, tunnel/banner placement, and structure.
- `docs/js/champion-celebration-scene.js`
  - imports and scene ownership for the plinth factory;
  - separate podium and teammate groups;
  - trophy rest and stage coordinates;
  - static captain key positions;
  - translation-only camera X tracking;
  - widened shadow bounds and warm base lighting;
  - profile composition.
- `docs/js/champion-celebration-effects.js`
  - right podium center parameter;
  - flag, hero light, glint, flashes, washes, and confetti X offsets;
  - flag size/depth so it does not obscure the banner or trophy.
- `tests/champion-celebration.mjs`
  - replace stale centered-composition guards with named lateral contracts;
  - plinth/podium geometry and color guards;
  - camera position/target X equality;
  - separated podium/team visibility.
- `tests/animation-performance.mjs`
  - only if new scene/effect resource bounds need a guard.

Do not edit `champion-celebration.js` curtain logic, trigger code, connector code, dashboard render,
fixtures, vendor Three.js, or the timeline phase table in this plan.

## Interfaces this plan establishes

`champion-celebration-models.js` must export named values similar to:

```js
export const STAGE_LAYOUT = Object.freeze({
  plinthX: -3.5,
  podiumX: 2.35,
  captainEntryX: -5.85,
  captainGroundZ: 0.25,
  captainFinalZ: 1.0,
  teamZ: -0.2,
  bannerX: 0,
  cameraStartX: -1.35,
  cameraEndX: 2.35,
});
```

Use final tuned values from browser review, but keep the names.

`STAGE_HEIGHTS` must distinguish:

```js
{
  ground,
  podiumTop,          // teammate rear platform
  captainPodiumTop,   // lower front captain platform
  playerFoot,
  plinthTop,
  trophyRest,
  trophyCarry,
  trophyLift,
  teamJump,
}
```

`createTrophyPlinth({ palette })` must return:

```js
{
  root,
  anchors: { top },
  materials,
  dispose(),
}
```

`createPodium({ palette })` must return:

```js
{
  root,
  anchors: {
    teamTop,
    captainTop,
  },
  dispose(),
}
```

`createCelebrationEffects()` must accept a named `podiumCenterX` and update it safely when the profile
changes.

## Step-by-step implementation order

1. Add `STAGE_LAYOUT` and the expanded `STAGE_HEIGHTS`. Do not move anything until tests import and
   assert the named contract.
2. Build `createTrophyPlinth()` in `champion-celebration-models.js`:
   - square/rectangular warm-ivory body at a natural mid-torso grab height;
   - softened/beveled edges using bounded core geometry;
   - wider base and top slab;
   - one restrained country-color front inset;
   - named top anchor at the true support height;
   - all materials/geometries owned and disposable.
3. Replace the inline scene plinth with the factory:
   - position its root at `STAGE_LAYOUT.plinthX`;
   - use its top anchor for `projectAnchor("plinth")`;
   - set trophy rest so the trophy bottom meets the top without penetration;
   - update the coupled `trophyRestPosition.x`, opening settle X, anchor X, grab reach, and dismissal
     ownership together; no literal `0` focal X may remain in the opening;
   - preserve opening rise and dismissal ownership.
4. Rebuild `createPodium()` from the storyboard:
   - broad lower base;
   - rear team deck at `STAGE_HEIGHTS.podiumTop`;
   - three readable side-step levels on both sides;
   - lower smooth circular captain platform at the front;
   - warm ivory body and subtle country-color inset;
   - named `teamTop` and `captainTop` anchors.
5. Separate architecture from people:
   - add the podium root directly to the scene so it is visible during the opening;
   - create a teammate-only group that may reveal later;
   - keep teammate local positions centered around the podium root;
   - place captain final root at `captainTop`, not teammate height.
6. Place static key poses:
   - left trophy/plinth;
   - captain behind the plinth with enough Z separation to avoid body intersection;
   - right podium with six teammates on the rear platform;
   - captain final position on the lower front platform.
7. Rework camera presets:
   - retain perspective and frontal pitch;
   - add named start/end X values;
   - compute a bounded tracked X from current carry progress;
   - assign the same X to `camera.position` and `cameraTarget`;
   - keep phone distance wide enough for seven players at the final focus.
8. Reframe shadows and base light:
   - widen directional shadow-camera bounds for the lateral stage;
   - warm background/fog, hemisphere, key, fill, and structure values;
   - keep PCF soft shadows and DPR limit;
   - avoid blown-out ivory geometry.
9. Warm `createStadium()`:
   - grass-only mowing stripes and subtle texture with no pitch markings;
   - warm clay/concrete stands and structure;
   - softened continuous tiers/decks with corner closure, fascia, aisle rhythm, vomitory openings,
     concourse shadows, rails, roof underside/catwalk depth, and floodlight banks;
   - articulated instanced supporter silhouettes with deterministic scale/value variation and zero-scale
     aisle gaps, without raising the 480/260 count budgets;
   - reduce the black-night/star-field read;
   - keep tunnel dressing and dynamic champions banner at `STAGE_LAYOUT.bannerX`;
   - keep crowd counts explicitly bounded at 480 desktop and 260 phone and preserve dynamic banner text.
10. Parameterize effects around `podiumCenterX`:
    - keep the smaller hanging flag at `STAGE_LAYOUT.bannerX` beneath the central banner;
    - hero spot target and glint at the podium;
    - flash lights around the final focus;
    - confetti spawn band centered on the podium;
    - update positions without per-frame allocation.
11. Add phone composition:
    - compress teammate local X spacing only;
    - keep world plinth/podium separation;
    - use camera distance/FOV to frame the active beat;
    - do not flatten the circular captain platform into an ellipse through root X scaling.
12. Update tests to remove V1's `x = 0` art-direction assertions and replace them with explicit
    lateral, anchor, and camera-rotation guards.
13. Capture static desktop and phone frames:
    - opening wide stage;
    - left grab pose;
    - right final pose;
    - flag/banner/trophy separation.
14. Tune only named constants/materials until those frames are approved. Do not add choreography fixes
    in this plan.

## Edge cases a weaker model will miss

- Moving only the plinth mesh but not its anchor leaves the dashboard trophy ghost targeting the old
  center.
- Rewriting the controller is unnecessary and risks the protected curtain/lifecycle seam.
- If the podium remains inside the hidden teammate group, the opening has no visible destination.
- `root.scale.x` on the whole podium turns the circular captain platform into an ellipse on phone.
- Camera X translation with a fixed target creates yaw and the rejected side POV.
- A square plinth needs enough Z separation from the captain body while both hands reach forward.
- Raising the plinth changes trophy rest height and grab reach together.
- Moving the plinth changes `trophyRestPosition.x`, the opening settle X, plinth anchor, grab pose, and
  dismissal as one coupled contract.
- Warm ivory can overexpose under the current ACES exposure.
- More crowd instances do not fix a toy-like stadium; enclosure, negative-space openings, roof depth,
  and aisle rhythm carry more architectural leverage than raw density.
- Existing symmetric shadow bounds may clip the left plinth or right podium.
- Confetti positions are seeded once; apply the center offset during updates rather than rebuilding
  arrays.
- The central flag must sit below the banner and behind the action without reading as part of the
  right-side payoff cluster.
- Banner and flag still need separate depth to avoid z-fighting.
- Phone should pan between locations instead of showing a tiny whole-stage miniature.
- Scrubbing backward must restore plinth visibility, opacity, scale, and position.
- All new model factories need idempotent disposal.

## Concrete acceptance criteria

- [ ] `STAGE_LAYOUT` names every lateral focal coordinate.
- [ ] Left plinth X is negative; right podium X is positive.
- [ ] Plinth is square, warm ivory, softly beveled, naturally reachable, and no longer built inline in
      the scene.
- [ ] Trophy bottom rests on the plinth top without a visible gap or penetration.
- [ ] Podium is broad and ivory with rear team deck, side steps, and lower front captain platform.
- [ ] Podium architecture is visible before teammates reveal.
- [ ] Six teammates stand on `podiumTop`; captain final feet stand on `captainPodiumTop`.
- [ ] Camera position X and target X are identical on every reviewed frame.
- [ ] Camera remains perspective/frontal with no side yaw, tilt-shift, or orthographic fallback.
- [ ] Stadium and grass-only field read warm rather than black/night or marked match pitch.
- [ ] Stadium corner tiers, fascia, aisles, vomitories, roof depth, catwalk, and floodlight banks read as
      one continuous arena rather than disconnected shelves.
- [ ] Crowd scale/value variation and aisle gaps remain deterministic within the existing desktop/phone
      instance counts.
- [ ] Banner and hanging flag remain centered on `bannerX`; trophy, players, and right-centered payoff
      effects remain visually separated.
- [ ] Effects are centered on the right podium.
- [ ] Desktop and phone left-grab/right-final stills are readable.
- [ ] Crowd/confetti bounds, DPR cap, one canvas, and frame-allocation guards remain explicit and
      bounded.
- [ ] The bracket curtain implementation is untouched.

## Validation

Run:

```powershell
node tests/champion-celebration.mjs
node tests/animation-performance.mjs
```

Then capture production-backed mock stills for the opening, left grab, and right final static key poses
at desktop and `390x844`.
