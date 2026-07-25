# PLAN 01: Raise avatar and trophy fidelity

**Rank: 1 of 4. Leverage: 9.9/10. Execute first.**

**Execution status: complete. Final evidence is recorded in `../RESULTS.md`.**

**Post-execution revision:** after silhouette-first geometry landed, the July 12 visual review approved
a bounded density increase to `32` radial, `40` head, and `14` cap segments, plus one fitted scalp
surface for every hair shell, curl, and lock. The final trophy-standard pass added authored elliptical
torso/pelvis/head lofts, overlapping shoulder/kit/boot detail, seven hair families, nine skin tones,
eight hair tones, five facial-hair states, eye pupils/highlights, and restrained physical-material
response without changing limb lengths, anchors, or rig ownership.

**Council call:** Karpathy keeps this as a static geometry pass instead of mixing it with motion.
Russinovich targets silhouette, normals, and material response rather than unbounded polygons.
Hanselman and Litt require named, tweakable anatomy and kit decisions that the next owner can safely
change.

## Goal

Remove the coarse procedural-blockout read from all seven players and the shared trophy before any V2
lateral staging is introduced.

The accepted still frame must show:

- connected, slimmer clay anatomy instead of a torso barrel, shoulder bar, and pelvis capsule;
- readable jerseys, shorts, socks, boots, faces, ears, and modeled hair;
- deterministic height, skin, hair color/style, facial-hair, face, and kit variation;
- one thick thumb and exactly three thick fingers per hand;
- a premium but still stylized shared trophy;
- soft matte materials with restrained highlight response;
- every existing rig joint, anchor, trophy carrier, arm metric, reset method, and dispose path intact.

This plan does not move the plinth, podium, camera, captain path, team, flag, or phase boundaries.

## Observation

The current rigs are technically smooth but visually assembled from large capsules. Increasing segment
counts would make the same weak silhouette smoother without making it better. The trophy already has a
strong shared factory and named grips, so it needs proportion/material refinement rather than a second
implementation.

## Evidence

- `createPlayerRig()` builds torso, shoulders, pelvis, limbs, hands, face, hair, kit, and anchors in one
  factory.
- `PLAYER_RADIAL_SEGMENTS`, `PLAYER_HEAD_SEGMENTS`, and `PLAYER_CAP_SEGMENTS` provide one bounded
  quality control surface and can rise only after silhouette/contact defects are fixed.
- The current shoulder mesh crosses the chest as a visible bar.
- The current pelvis is a large capsule and dominates the silhouette.
- All hair uses one cap plus three near-identical clumps.
- Hands use four narrow fingers that merge visually at hero distance.
- `trophy-geometry.js` is shared by the dashboard and celebration and already exposes named grips.
- Tests require `body.scale.setScalar(heightScale)` and explicitly forbid scaling the root.
- The later visual review showed that increasing segments alone still left radial torso/head forms,
  weak shoulder transitions, flat kit layers, and undifferentiated boot/face detail.

## Reasoning

Static model quality is the first gate because motion, confetti, and camera travel can hide weak
anatomy. Preserving anchors makes this a low-coupling, high-visible-payoff change. The model should
remain procedural and owner-tweakable; external GLTF assets or a rigging pipeline would raise the
maintenance cost without improving this repository's runtime architecture.

## Decision

- Raise the bounded segment budgets only after replacing the weak silhouette: `32` radial, `40` head,
  and `14` cap segments.
- Replace the torso/shorts silhouette with beveled or lofted smooth clay geometry.
- Keep capsules only where they help: tapered limbs, neck, fingers, and small hair locks.
- Remove the cross-body shoulder bar and let the jersey silhouette establish the shoulders.
- Use one thumb plus three thick fingers.
- Add deterministic hair-style and neutral-away-kit variants, with every hair piece derived from one
  fitted scalp ellipsoid.
- Make hero variants `0-6` explicitly produce seven different skin tones, hair tones, and hair styles,
  plus multiple facial-hair states. Keep all appearance selection independent of country.
- Use high-roughness `MeshPhysicalMaterial` selectively for cloth sheen, skin softness, and boot finish,
  with clearcoat capped at restrained values; keep hair and small facial pieces on simpler materials.
- Refine the existing trophy factory in place and preserve all anchor names/API.

## Tradeoffs

- More small meshes increase draw calls slightly, but only seven hero figures exist and crowd geometry
  remains instanced.
- Procedural hair will not equal an authored sculpt, but several deliberate styles will remove the
  duplicated bowl-cap read.
- The bounded density increase costs more triangles, but only seven heroes exist and the camera still
  uses a 1.5 DPR cap with phone-specific crowd limits.

## Exact files to touch

- `docs/js/champion-celebration-models.js`
  - player constants and named proportions;
  - rounded/lofted clay geometry helpers;
  - player materials;
  - torso, shorts, limbs, hands, face, hair, boots, kit variants;
  - reset and arm metrics only where needed to match the new proportions.
- `docs/js/trophy-geometry.js`
  - shared trophy proportions, material response, sculptural detail, and grip placement.
- `tests/champion-celebration.mjs`
  - named fidelity contracts, seven-player appearance spread, facial-hair geometry, three-finger
    contract, bounded geometry, preserved anchors, and trophy factory guards.
- `tests/animation-performance.mjs`
  - only if a new resource type needs an explicit bounded/disposal guard.

Do not touch the timeline, scene positions, effects positions, controller, trigger, bracket curtain,
mock renderer ownership, dashboard rendering, fixtures, or vendor Three.js.

## Interfaces this plan establishes

Add or preserve these readable exports:

```js
export const PLAYER_FINGER_COUNT = 3;
export const PLAYER_HAIR_STYLE_COUNT = 7;
export const PLAYER_FACIAL_HAIR_STYLE_COUNT = 5;
export function playerAppearanceForVariant(variant) { /* pure deterministic appearance contract */ }
export const PLAYER_PROPORTIONS = Object.freeze({
  minimumHeightScale: 0.94,
  maximumHeightScale: 1.06,
  shoulderHeight: /* exact hips + chest + shoulder hierarchy height */,
  upperArmLength: /* joint-to-joint value */,
  forearmLength: /* joint-to-joint value */,
});
```

`createPlayerRig()` must continue returning:

```js
{
  root,
  joints,
  anchors: {
    leftHand,
    rightHand,
    trophyCarrier,
    trophyGrip,
    leftFoot,
    rightFoot,
  },
  arms: { left, right },
  metrics: {
    heightScale,
    shoulderOffset,
    upperArmLength,
    forearmLength,
  },
  setHandGrip(amount),
  resetPose(),
  dispose(),
}
```

`createTrophySculpture()` must preserve:

```js
{
  root,
  anchors: { leftGrip, rightGrip, top, bottom },
  materials,
  setColors(nextColors),
  dispose(),
}
```

## Step-by-step implementation order

1. Capture V1 production-backed mock stills at desktop and `390x844` phone:
   - captain alone at the grab;
   - full team final hold;
   - trophy close enough to judge base/globe/support proportions.
   Store screenshots outside the repository.
2. Add named `PLAYER_FINGER_COUNT` and `PLAYER_PROPORTIONS` constants. Replace duplicated height and
   arm-length literals with those constants without changing behavior yet. Derive
   `shoulderHeight` from the exact local hierarchy values used to place hips, chest, and shoulder;
   Plan 03's shared reach helper depends on this being production-accurate.
3. Add a bounded rounded/lofted geometry helper using core Three.js only:
   - `Shape` + `ExtrudeGeometry` with a small bevel, or a similarly bounded lathed profile;
   - clamp bevel size to the smallest dimension;
   - center geometry and compute smooth normals;
   - create geometry only during rig construction.
4. Rebuild the torso:
   - wider at shoulders, narrower at waist;
   - sufficient depth for a clay jersey, but not a barrel;
   - no separate horizontal shoulder bar;
   - collar, crest-shaped clay patch, cuffs, and side panels remain generic and unbranded.
5. Rebuild shorts/pelvis:
   - one connected rounded shorts mass;
   - two readable leg openings;
   - less vertical bulk than V1;
   - preserve hip joint locations and root/body scaling behavior.
6. Refine limbs:
   - taper upper arms, forearms, thighs, and shins;
   - keep joint-to-joint distances equal to the exported metrics;
   - use skin at knees/elbows and kit/neutral sock materials deliberately;
   - rebuild boots with a rounded shoe mass, toe, and sole that plant cleanly.
7. Rebuild hands:
   - rounded palm;
   - generate exactly `PLAYER_FINGER_COUNT` thick fingers from the constant rather than a separate
     hardcoded position array;
   - one thick opposing thumb;
   - preserve the existing hand group as the IK target;
   - update `setHandGrip()` so all fingers curl without self-intersection.
8. Refine faces:
   - keep simple clay eyes, brows, nose, ears, and mouth;
   - reduce the googly-eye read;
   - ensure hair and brows do not intersect the eyes;
   - keep expressions generic and friendly.
9. Add deterministic modeled appearance variation:
   - nine skin tones, eight hair tones, seven hair-style families, and five facial-hair states derived
     from `variant` through one pure exported helper;
   - hero variants `0-6` must each receive a different skin tone, hair tone, and hairstyle;
   - hair examples: close curls, cropped cap, high top, swept clay locks, mohawk ridge, and short locs;
   - facial-hair states: clean-shaven, moustache, goatee/chin detail, jaw beard, and sideburn treatment;
   - fit the shell to the actual head ellipsoid and derive clump/lock Y from one scalp-surface helper;
   - reuse bounded cap/clump/lock geometries within each rig;
   - do not derive skin, hair, or facial hair from country palette.
10. Add deterministic kit variants:
    - captain always uses the primary country kit and armband;
    - most teammates use country primary/secondary;
    - two or three use a warm ivory away shirt or shorts with country-color trims;
    - no logos, sponsors, names, or numbers.
11. Tune material response:
    - high roughness;
    - cloth uses restrained sheen with near-zero clearcoat;
    - skin uses a very small clearcoat value with high clearcoat roughness;
    - boots use a slightly stronger but still matte clearcoat response;
    - trophy metal retains its dedicated restrained physical treatment;
    - no material changes inside frame updates;
    - all new materials/textures registered with the existing owner and disposed.
12. Refine `createTrophySculpture()`:
    - improve globe/support/stem/base proportions;
    - retain smooth high-segment trophy-specific geometry;
    - use clay-metal roughness rather than mirror gloss;
    - preserve named anchors and adjust them only to the actual new grip surfaces;
    - confirm the live dashboard trophy and celebration trophy both use the same factory.
13. Update static tests before visual tuning is declared complete.
14. Capture the same desktop and phone stills as step 1 and compare silhouettes at equal framing.
15. Stop this plan if the accepted still is not visibly better without animation. Do not continue to
    Plan 02 to hide unresolved geometry.

## Edge cases a weaker model will miss

- Increasing segment counts before fixing silhouette/contact does not improve the model and can waste
  the phone GPU budget.
- Changing joint group positions without updating arm metrics makes the IK solver's measured lengths
  false.
- Scaling `root` instead of `body` also scales stage placement and trophy carrier coordinates.
- A material with `vertexColors: true` on geometry without a color attribute can render incorrectly;
  do not introduce half-configured baked AO.
- Bevel size can exceed thin jersey/trim depth and create self-intersecting extrusion geometry.
- Fingers need to remain readable when closed; four thin fingers are worse than three thick ones at
  this camera distance.
- Exporting a finger count while retaining a separate three-element literal lets documentation and
  geometry diverge. Generate positions from `PLAYER_FINGER_COUNT`.
- The hand anchor is also the IK target. Moving it to a fingertip changes reach and trophy alignment.
- Hair cap geometry can cover eyes when head proportions vary.
- Hair clumps placed by independent literals can float or clip even when the cap itself fits.
- A new non-radial head can grow above a legacy scalp shell and make every player appear bald; update
  shell coverage and scalp radii together, then review the actual hero camera.
- Neutral kits must remain distinguishable when a country's sampled secondary is already white.
- Skin/hair variation must stay independent of country to avoid stereotyped mappings.
- A modulo pattern can still accidentally repeat the most visible hero attributes; test variants `0-6`
  directly and require seven distinct skin tones, hair tones, and hairstyle indexes.
- Facial hair must follow the jaw/mouth surface and must not clip through the lips, eyes, or fitted hair.
- Shared trophy edits affect the dashboard trophy immediately; verify both surfaces.
- Grip anchors must move with the new trophy supports, not remain as invisible legacy points.
- All new textures/materials/geometries need disposal through the existing owner.
- Static source tests alone cannot prove the models are better. The side-by-side still is mandatory.

## Concrete acceptance criteria

- [ ] `PLAYER_FINGER_COUNT === 3`.
- [ ] Finger geometry is generated from `PLAYER_FINGER_COUNT`; no independent hardcoded finger-count
      array exists.
- [ ] Every hand visibly has three thick fingers and one thumb in open and closed poses.
- [ ] `PLAYER_PROPORTIONS` is the source of height and arm-length bounds.
- [ ] `PLAYER_PROPORTIONS.shoulderHeight` matches the actual hips/chest/shoulder hierarchy and is used
      by Plan 03's production reach helper.
- [ ] `body`, not `root`, owns height scaling.
- [ ] Torso and shorts no longer read as two large capsules or a shoulder bar.
- [ ] `PLAYER_HAIR_STYLE_COUNT === 7`, `PLAYER_FACIAL_HAIR_STYLE_COUNT === 5`, and
      `playerAppearanceForVariant(0..6)` returns seven distinct skin tones, hair tones, and hair styles.
- [ ] The seven-player hero frame visibly represents all seven fitted hairstyles and multiple
      facial-hair states without mapping any appearance to country identity.
- [ ] At least two teammates use a neutral-away treatment while country identity remains clear.
- [ ] No real likeness, logo, sponsor, name, or number appears.
- [ ] `flatShading: true` is absent from player and trophy materials.
- [ ] Player cloth, skin, and boots use high-roughness physical response with bounded sheen/clearcoat;
      no surface reads as glossy plastic.
- [ ] Torso, pelvis, and head use authored non-radial loft/proportion profiles rather than merely smoother
      cylinders or spheres.
- [ ] Shoulder yokes, deltoid transitions, jersey hem/cuffs, shorts waist/seam, sock cuffs, and shaped
      boot uppers/toes remain visually readable without changing joint or limb-length metrics.
- [ ] Player segment budgets remain bounded at `32` radial, `40` head, and `14` cap segments.
- [ ] Hair shell, curls, and locks share one fitted scalp-surface contract with no floating pieces.
- [ ] Named joints, hand anchors, trophy carrier, arm chains, reset API, and dispose API still exist.
- [ ] Trophy `leftGrip`, `rightGrip`, `top`, and `bottom` anchors remain named and aligned to geometry.
- [ ] Dashboard and cutscene still share `createTrophySculpture()`.
- [ ] Frame-update functions contain no new geometry/material/texture/array construction.
- [ ] Desktop and phone after-stills are materially better than the V1 baseline without relying on
      motion, confetti, or camera changes.

## Validation

Run:

```powershell
node tests/champion-celebration.mjs
node tests/animation-performance.mjs
```

Then review production-backed mock stills at the same times and viewport sizes used for the baseline.
