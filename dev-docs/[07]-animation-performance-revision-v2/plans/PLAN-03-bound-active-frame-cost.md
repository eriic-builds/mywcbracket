# PLAN: Bound active steady-state frame cost

**Rank: 3 of 5. Leverage: 9.4/10. Measurement-gated.**

## Goal

Bring sustained celebration work within the `16ms` p95 / `50ms` long-task local proxy while
preserving the approved 30-second story, character/stadium quality, trophy contact, and
continuous finale flares.

Apply one bounded change at a time and stop as soon as the matched gate passes.

## Exact candidate files

- `docs/js/champion-celebration.js`
- `docs/js/champion-celebration-timeline.js`
- `docs/js/champion-celebration-scene.js`
- `docs/js/champion-celebration-effects.js`
- `docs/js/champion-celebration-models.js`
- `tests/animation-performance.mjs`
- `tests/champion-celebration.mjs`
- `dev-docs/[07]-animation-performance-revision-v2/RESULTS.md`

`champion-celebration-models.js` is in scope only for fidelity-preserving steady-state
structural work: selective shadow ownership and construction-time batching below one animated
parent. Cross-color batching is allowed only when exact visible colors are baked into vertex
attributes and the replacement surface class remains local to that player. Cold-only resource
sharing remains Plan 04.

## Observation

The active controller requests every display frame for the entire sequence. The scene updates
rigs, IK, camera, crowd, confetti, flares, flag, lighting, shadows, and renderer submission.
Source guards prove no layout reads, random calls, or new scene resources in the hot path;
they do not prove the frame budget.

The measured phone peak contains 873 objects, 667 meshes, roughly 626 draw calls, 891,386
submitted triangles, and 659 meshes that both cast and receive shadows. Six teammates account
for 452 meshes; the captain adds 76. Bypassing `renderer.render()` lowers phone p95 from
137.436ms to 16.137ms. The renderer/draw architecture, not crowd matrix writes alone, is the
dominant constraint.

The current scene also forces redundant world-matrix propagation during trophy grip solving:
one full `scene.updateMatrixWorld(true)`, repeated captain-subtree updates for both arms, and
another renderer traversal. These calculations can be scoped without changing pixels.

## Measured implementation checkpoints

| Checkpoint | Phone peak RAF p95 | Renderer calls | Meshes | Shadow participants |
| --- | ---: | ---: | ---: | ---: |
| Original baseline | 136.386ms | about 626 | 667 | 659 |
| Scoped trophy/IK matrices | 102.842ms | about 626 | 667 | 659 |
| Same-material rigid batching + detail shadow pruning | 78.862ms | 411 | 451 | 310 |
| Player-local vertex-color surface batching | 63.605ms attribution probe | 303 | 342 | 257 |
| Final council matrix after duplicate IK-call removal | 78.617ms matched / 77.003-85.905ms isolated | 303 | 342 | 257 |

The final row preserves the seven rigs and submitted triangle budget. It remains above the
synthetic `16ms` gate, so Plan 05 must report a proxy miss rather than silently weaken the
approved scene.

The final council pass removed one repeated shoulder-alignment call that used the same unchanged
direction twice. Two focused renderer-bypass repeats measured `12.865ms` and `13.315ms` p95,
which confirms that another small scene-JavaScript cleanup is not the main remaining lever.

## Evidence required before editing

- Desktop 4x and phone 6x carry callback p95/max.
- Desktop 4x and phone 6x peak callback p95/max.
- Hold/restore callback p95/max.
- Layout, Paint, raster, and GPU totals.
- Logical time reached during the fixed wall window.
- Attribution probe that can independently disable or cadence:
  - renderer submission;
  - trophy grip/IK matrix propagation;
  - crowd, confetti, team, and rig-reset updates;
  - phone shadows and DPR.
- Draw-call, mesh, material, geometry, triangle, and shadow-caster counts.

Use measurement-only overrides or local branches for attribution. Do not ship several
optimizations together and guess which one helped.

## Step-by-step implementation order

1. Confirm Plan 03 is required in `BASELINE.md`.
2. Capture one untouched reference screenshot at:
   - 9.2s carry;
   - 21.2s rise start;
   - 22.55s apex;
   - 24.7s payoff;
   - 27.5s and 29.2s flares.
3. Record the measured floor honestly:
   - shadows off, DPR 1, and crowd skip still measured 65.284ms p95;
   - cadence and quality toggles alone cannot reach the 16ms gate;
   - structural draw and matrix work must be reduced first.
4. Apply zero-visual IK/world-matrix scoping:
   - remove forced full-scene and full-captain-subtree updates that duplicate the scoped
     ancestor updates already performed by `getWorldPosition()`/`getWorldQuaternion()`;
   - refresh only the changed shoulder/elbow chain between IK steps;
   - preserve trophy quaternion, grip anchors, solver order, and two-hand contact.
5. Re-run reach tests, 22.55s contact, carry, and peak. Record the new callback and matrix
   counts. If the gate passes, stop.
6. Reduce draw and shadow submission without changing appearance:
   - mark face, finger, trim, and interior detail meshes that do not affect the ground
     silhouette as non-shadow-casters;
   - keep torso, head mass, arms, legs, boots, trophy, podium, and other silhouette owners;
   - merge only static direct child meshes that share one animated parent, one material, and
     compatible geometry attributes;
   - if same-material batching still misses, bake exact source colors into normalized vertex
     color attributes and merge within one player-local matte or polished clay surface class;
   - never merge across bones, rigs, or dynamic finger/thumb owners;
   - register merged geometry with the existing owner and dispose superseded unreferenced
     geometry and materials exactly once;
   - transform positions/normals directly into the merged buffer so construction does not
     create a second full clone of every source geometry.
7. Re-run draw-call, shadow-caster, carry, peak, replay, and pixel/keyframe evidence. Stop if
   the gate passes.
8. If phone shadow work remains material:
   - reduce only the phone shadow-map budget and tighten its camera;
   - preserve desktop shadows;
   - compare contact and player silhouettes.
9. If hold/restore remains expensive:
   - keep the logical clock ticking every RAF;
   - add one named 30fps scene-render cadence from `26.2s` through `30.0s`;
   - sample current logical time whenever a scene frame is rendered;
   - do not freeze because flare cycles must continue visibly.
10. Re-run hold/restore. If the gate passes, stop.
11. Only after the zero-visual structural stages, test a lower phone DPR cap.
12. Only if those changes fail and the owner approves a visual tradeoff:
   - consider lower phone crowd/confetti counts or shadow removal;
   - document the rejected quality cost.
13. Add named helpers/constants and focused source/lifecycle tests for only the chosen changes.
14. Repeat all matched active windows and required keyframes.
15. If fidelity-preserving structural work cannot reach `16ms` on the 6x proxy, stop and
    report the best matched result. Do not silently weaken the approved scene or claim the
    original gate passed.

## Reasoning

Scoped matrix propagation and same-parent mesh merging remove duplicate work while preserving
the same transforms, materials, silhouettes, and pixels. Phone shadow-map and DPR changes are
later because they trade rendering quality for fill-rate relief. Particle or crowd-count
reductions remain last because they visibly weaken the payoff.

## Tradeoffs

- Same-parent merging lowers draw calls but adds geometry ownership and disposal complexity.
- Vertex-color consolidation preserves base colors but normalizes subtle roughness, sheen, and
  clearcoat differences into two bounded clay surface classes; visual comparison is mandatory.
- Selective shadow pruning must preserve every silhouette-defining body part.
- Crowd cadence saves little CPU by itself and may expose stepping if applied during peak
  cheering; its main hold benefit is avoiding repeated instance-buffer uploads.
- A 30fps hold reduces repeated work but cannot stop the scene because flares relaunch until
  teardown.
- Lower shadow resolution and DPR save GPU/raster cost but can soften the phone image.
- Extra cadence state adds complexity; use one clock and a small number of named thresholds.

## Edge cases a weaker model will miss

- Logical time must advance on every controller RAF even when scene rendering is skipped.
- Do not create a second accumulated clock for cadence.
- The first frame after a skipped interval must sample current time, not replay every missed
  update.
- `22.55s`, `27.5s`, and `29.2s` must remain deterministic.
- Backward scrub must reset trophy quaternion, rig state, effects, and cadence state.
- Context loss, replay, resize, and hidden resume cannot inherit a stale cadence timestamp.
- Completion and exact bracket restoration must still occur at logical `30.0s`.
- The review harness updates timeline DOM. Compare identical harness runs and verify the
  production dashboard separately.
- A lower callback p95 is not sufficient if GPU/raster or visual stutter worsens.
- No new arrays, objects, random values, geometry, materials, textures, or layout reads may
  enter frame paths.
- Do not use `InstancedMesh` across avatars: body proportions and materials are intentionally
  different.
- Do not share replacement player materials across the cast or merge across animated bones.
- A vertex-colored replacement material may not touch a geometry without a normalized `color`
  attribute; otherwise the mesh can render black.
- Animated thumbs remain protected leaf meshes, and animated fingers remain child Groups, so
  construction batching cannot erase their grip pivots.
- A merged geometry may not remain in the owner's disposal set twice or be disposed while a
  surviving mesh still uses it.
- `renderFrame(t)` must remain deterministic after backward scrub; cached instance matrices
  must be keyed to logical time or explicitly invalidated.

## Tests and browser evidence

- `node tests/animation-performance.mjs`
- `node tests/champion-celebration.mjs`
- carry desktop/phone matched traces;
- peak desktop/phone matched traces;
- hold/restore desktop/phone matched traces;
- synthetic hidden visibility;
- backward scrub and replay;
- context loss;
- desktop and phone screenshots at all required anchors;
- headed playback for visual cadence.
- before/after draw calls, shadow casters, materials, geometries, and triangle counts.

## Concrete acceptance criteria

- Phone 6x peak animation-frame callback p95 is at or below `16ms`.
- No sustained main-thread task exceeds `50ms`.
- Hold/restore retains visible cycling flares and exact 30-second completion.
- Approved desktop and phone keyframes remain visually equivalent.
- Hidden intervals perform zero scene RAF callback, Layout, or Paint work.
- Replay reuses one celebration canvas/context.
- No hot-path allocation, layout read, random generation, or resource construction.
- Draw calls and shadow casters materially decline from the measured 626 / 659 baseline
  without reducing the seven-player cast or approved scene content.
- If baseline was already green, runtime source remains unchanged.

## Lessons learned

Frame pacing is a product rule, not merely a `setTimeout`. First remove duplicate matrix and
draw work; then use one authoritative logical clock for any bounded cadence. A quality toggle
cannot solve an architecture that submits hundreds of independent meshes per frame.
