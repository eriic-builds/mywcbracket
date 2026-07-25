# PLAN: Stadium and player rigs

**Rank: 4 of 7. Run after Plan 03.**

**Council call:** Litt and Hanselman lead: model the scene with clear named parts a future owner can
change, not a pile of anonymous meshes. Russinovich keeps geometry and instance counts bounded before
animation begins.

## Goal

Build the production-quality static winners stage: layered stadium depth, textured pitch, championship
banner, podium, one generic captain, six generic teammates, readable right-arm `C` armband, coherent
kits from country colors, stable hand/foot anchors, and shared stage-height constants. Use bounded
smooth soft-matte clay anatomy rather than either the mock's coarse blockout or unbounded imported
models.

At the end of this plan the scene renders a strong final-tableau still at desktop and phone sizes.
The figures are rigged and ready to animate, but Plan 05 owns all choreography.

## Exact files to touch

- `docs/js/champion-celebration-models.js` - **new** stadium, textured pitch, championship banner,
  podium, hierarchical player rig, kit, captain armband, crowd instances, named anchors, and disposal.
- `docs/js/champion-celebration-scene.js` - assemble the new models, expose rig references
  internally, and render the static hero composition.
- `docs/js/champion-celebration.js` - select the desktop/phone quality profile before scene
  creation.
- `dev-docs/[00]-dev-reports/[05]-champion-celebration/mock.js` - after production still approval, mirror the bounded
  anatomy, stadium depth, pitch, banner, and contact fixes for visual review.
- `tests/champion-celebration.mjs` - constants, player count, rig, bounded segments, armband, pitch,
  banner, local texture, and instancing guards.
- `tests/animation-performance.mjs` - bounded crowd/geometry and no-per-frame-construction guards.

Do not use the standalone mock as production source. Synchronize it only after the production still
passes review. Do not touch `render.js`, `interact.js`, `main.js`, flags, or vendor files.

## Interfaces this plan establishes

`docs/js/champion-celebration-models.js` must export:

```js
export const TEAMMATE_COUNT = 6;
export const TOTAL_PLAYER_COUNT = 7;
export const MAX_CROWD_INSTANCES = 320;
export const PHONE_CROWD_INSTANCES = 180;
export const PLAYER_RADIAL_SEGMENTS = 24;
export const PLAYER_HEAD_SEGMENTS = 32;
export const PLAYER_CAP_SEGMENTS = 10;
export const STAGE_HEIGHTS = Object.freeze({
  ground: 0,
  podiumTop: 0.72,
  playerFoot: 0.72,
  plinthTop: 0.84,
  trophyRest: 1.55,
  trophyCarry: 2.15,
  trophyLift: 3.68,
  teamJump: 0.28,
});

export function createPlayerRig({
  palette,
  seed,
  variant,
  captain = false,
}) { /* returns rig controller */ }
export function createPodium({ palette }) { /* returns model controller */ }
export function createStadium({
  palette,
  seed,
  team,
  profile,
}) { /* returns model controller */ }
```

Each model controller owns `root` and an idempotent `dispose()`.

`createPlayerRig()` additionally returns:

```js
{
  root,
  joints: {
    hips, chest, neck, head,
    leftShoulder, leftElbow, leftHand,
    rightShoulder, rightElbow, rightHand,
    leftHip, leftKnee, leftFoot,
    rightHip, rightKnee, rightFoot,
  },
  anchors: {
    leftHand,
    rightHand,
    trophyCarrier,
    trophyGrip, // compatibility alias for trophyCarrier
    leftFoot,
    rightFoot,
  },
  arms: {
    left: { shoulder, elbow, hand, fingers, thumb, side },
    right: { shoulder, elbow, hand, fingers, thumb, side },
  },
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

## Step-by-step implementation order

1. Open the approved mock only as a staging reference. Do not copy its blockout geometry or treat its
   proportions as the production ceiling.
2. Create `STAGE_HEIGHTS` first and replace the Plan 03 plinth/trophy literals with those constants.
   Start with the values above. Any visual tuning must edit the constants, not add compensating
   offsets in animation code.
3. Implement a reusable resource-owning model pattern:
   - Each factory returns a root group and `dispose()`.
   - Deduplicate shared-within-model geometries/materials during disposal.
   - Do not share disposable resources between the live trophy and scene.
4. Build `createPlayerRig()` as a clear hierarchy:
   - Root -> hips -> chest -> neck/head.
   - Shoulder pivots -> upper arms -> elbows -> lower arms -> hand anchors.
   - Hip pivots -> upper legs -> knees -> lower legs -> foot anchors.
   - Use bounded 24-segment capsules, 10-segment rounded caps, and 32-segment heads with coherent
     proportions and clean joint overlap.
   - Model pelvis/torso continuity, rounded shoulders, sleeves, elbows, knees, neck, ears, eye whites
     and pupils, brows, nose, smile, sculpted hair masses, articulated palms, four fingers, thumbs,
     feet, rounded boots, toes, and soles. Do not leave a visible torso-to-shorts gap or an
     assembled-cylinder silhouette.
   - Add collar, side panels, chest accent, and crest so the kit reads as clothing rather than a
     colored cylinder.
   - Keep feet planted at `STAGE_HEIGHTS.playerFoot` in `resetPose()`.
   - Give each hand and foot a named `Object3D` anchor; later animation targets anchors rather than
     guessing mesh coordinates.
   - Add one stable `trophyCarrier` anchor owned by the captain rig. It describes the trophy's desired
     world position; it does not parent the trophy.
   - Expose upper-arm and forearm lengths so Plan 05 can enforce physical reach instead of inventing
     an unreachable hero pose.
   - Expose the two arm chains and `setHandGrip()` so fingers close as the hands reach the trophy.
5. Captain requirements:
   - `captain: true` creates a band on the anatomical right upper arm.
   - Generate the `C` with a small local `CanvasTexture`; no font/network asset.
   - Make the badge double-sided or orient it so it remains readable when the captain faces the
     viewer.
   - Do not add a name, face, likeness, identifying number, or real-player body signature.
6. Teammate variation:
   - Create six teammates from the same generic rig with bounded variations in shoulder width,
     height, stance, sleeve accent, and idle pose.
   - Variations come from the deterministic country seed plus teammate index.
   - Keep one coherent kit language; do not make seven unrelated costumes.
   - No player number may be intended to identify a real person.
7. Build kit materials from the sampled palette:
   - Primary and secondary kit panels.
   - Neutral skin tones selected from a small generic procedural range, not country/ethnicity
     inference.
   - Accent color used sparingly for trim/armband.
   - Maintain silhouette separation from the night backdrop.
8. Build the podium:
   - One staged winners platform with a named top anchor at `STAGE_HEIGHTS.podiumTop`.
   - Enough width for six teammates already standing as one group and the captain joining later.
   - Smooth 48-64 segment procedural tiers, trim, and contact shadows without an unbounded bevel
     pipeline.
9. Build stadium depth:
   - Generate a local 1024x640 pitch texture with alternating grass stripes and regulation markings.
   - Build four crowd-depth tiers plus side wings.
   - Add roof beams, trusses, lamps, stars, LED ribbons, and a restrained side tunnel.
   - Foreground framing elements and atmospheric falloff.
   - Directional/spot light rigs that create foreground/background separation.
   - Generate a disposable 1024x256 local banner texture with `2026 WORLD CUP CHAMPIONS` and
     auto-fitted winning-country text. Return the banner mesh/material to the scene controller for
     timed emissive buildup.
   - Use `InstancedMesh` for crowd bodies/heads. Allocate `MAX_CROWD_INSTANCES` once and use
     `.count = PHONE_CROWD_INSTANCES` in the phone quality profile; do not rebuild on resize.
   - Plan 06 imports these constants instead of redeclaring crowd literals.
10. Assemble exactly seven figures:
    - Six teammates are already positioned on the podium as one staged group.
    - Captain begins in the centered rear tunnel behind the trophy/plinth.
    - All teammate roots and captain root face a viewer-readable direction.
    - Store scene references to the captain rig, teammate rig array, podium, crowd, trophy, plinth,
      camera, and lights for Plan 05/06; keep them private to the scene controller.
11. Compose the static final hero frame:
    - Captain centered with the group.
    - Trophy at lift height and visually connected to both captain hands.
    - Teammates arranged with distinct but coordinated poses.
    - Camera uses centered straight-on elevated perspective framing. Camera, tunnel, captain, trophy,
      plinth, podium, team, banner, and future flag share `x = 0`.
    - Preserve full-scale stadium depth; do not introduce orthographic toy framing, miniature
      proportions, tilt-shift blur, or depth-of-field blur.
    - Phone profile keeps captain, trophy, all six teammates, banner, and future flag zone inside safe
      margins.
12. Extend tests/source guards:
    - `TEAMMATE_COUNT === 6`, `TOTAL_PLAYER_COUNT === 7`.
    - Named stage-height constants exist and are consumed by scene/models.
    - Hierarchical joints and hand/foot/trophy anchors exist.
    - Captain armband is attached to the right-arm hierarchy and uses a generated local texture.
    - No names, portrait URLs, external texture URLs, or unbounded model imports.
    - Player body/head/cap segment constants remain exactly 24/32/10.
    - Generated pitch and champions banner textures are local and disposed.
    - Crowd uses `InstancedMesh` with the exported desktop/phone bounds.
    - No geometry/material constructors appear in future frame-update functions.
13. Browser-review hero stills for all six required countries at desktop and 390x844:
    - Strong silhouette, recognizable generic anatomy, and country identity.
    - Readable `C`.
    - Exactly six teammates plus captain.
    - Feet contact the podium.
    - Both hands meet the trophy grip.
    - No torso gap, floating feet, clipping, unreadable color merge, or flag/banner collision.

## Edge cases a weaker model will miss

- The captain's anatomical right arm appears on the viewer's left when facing forward. Attach the
  band to the rig's right arm, then make it camera-readable; do not swap anatomy to match screen
  coordinates.
- Seven total figures means one captain plus six teammates, not seven teammates.
- Generic skin variation must not be derived from the country flag or team name.
- Distinct secondary motion later requires distinct rigs or pose offsets, but not seven duplicated
  geometry sets. Reuse geometry where ownership/disposal remains clear.
- A foot mesh visually touching the podium is not enough if its parent anchor uses another height.
  Animation must operate from the shared foot-level constant.
- Trophy left/right grips must be real transforms on the trophy model. The captain's carrier controls
  prop placement; Plan 05 then solves each hand independently to the corresponding grip.
- A lift height can look dramatic while being physically impossible. Reject any target beyond
  `upperArmLength + forearmLength` after accounting for shoulder position and trophy scale.
- Crowd tiers need depth separation. One flat wall of instances reads like wallpaper.
- Phone resize should change active instance count/camera, not allocate a new stadium.
- CanvasTexture for the `C` must be disposed.
- Height variation must scale the body subgroup, not the rig root, or feet leave
  `STAGE_HEIGHTS.playerFoot`.
- The banner and final flag occupy the same visual territory. Size and lower the flag while keeping
  the banner high enough to preserve the title on desktop and phone.
- Auto-fit long country names on the banner; a fixed font size clips names such as Switzerland.
- Strong country colors can erase limbs against the flag. Preserve neutral separation and lighting.
- Orthographic or heavily compressed framing can turn otherwise full-size figures into tabletop
  miniatures. Use perspective depth, field markings, crowd scale, and restrained camera elevation to
  preserve full stadium scale.
- The static hero frame is the geometry review gate. Do not hide bad proportions behind motion.

## Concrete acceptance criteria

- The scene contains exactly one captain and six teammates.
- The captain's right-arm `C` is readable at desktop and phone review sizes.
- No player has a real face, name, portrait, likeness asset, or identifying number.
- Player rigs expose named joints, articulated hand parts, arm lengths, left/right hand and foot
  anchors, and a stable trophy carrier.
- Shared stage heights keep feet, podium, plinth, carry, lift, and jump references coherent; the
  `3.68` lift target remains within the captain rig's reach.
- The stadium has layered depth, structural silhouettes, field markings, atmosphere, and a bounded
  instanced crowd.
- The scene includes a local `2026 WORLD CUP CHAMPIONS` banner with the selected country and no
  network/font dependency.
- Player topology is bounded at 24 radial body segments, 32 head segments, and 10 capsule-cap segments
  while retaining readable facial, joint, kit, hair, hand, and foot detail without visible faceting.
- The static final tableau is visually strong and unclipped at desktop and 390x844.
- Country palettes work for England, France, Spain, Argentina, Switzerland, and Germany.
- Geometry, material, and texture ownership is disposable and no per-frame construction is added.
- Focused tests and full `npm test` pass.
