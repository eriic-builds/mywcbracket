# Animation performance revision V2 results

Status: implementation verified and commit-ready; synthetic active-scene budget remains unmet.

Recorded: July 13, 2026.

## Executive outcome

The celebration remains completely dormant before its fourth valid activation, and the approved
30-second trophy ceremony still renders with the same seven-player cast, choreography, stadium,
confetti, continuous flares, deterministic clock, fallbacks, and exact dashboard restoration.

The bounded performance work materially reduced repeated renderer submission:

| Scene inventory | Baseline | Final |
| --- | ---: | ---: |
| Objects | 873 | 548 |
| Meshes | 667 | 342 |
| Renderer calls | about 626 | 303 |
| Shadow participants | 659 | 257 |
| Materials | 102 | 77 |
| Geometries | 321 | 199 |
| Submitted triangles | 891,386 | 892,858 |

The triangle count stayed effectively unchanged because this revision removed submission and
matrix overhead rather than scene content.

The strict `16ms` p95 target on the 6x CPU phone proxy did not pass. The final matched
phone-peak run measured `78.617ms`; isolated repeats measured `78.516ms`, `85.905ms`, and
`77.003ms`. Two focused attribution runs measured `69.262ms` and `75.374ms`; bypassing only
`renderer.render()` measured `12.865ms` and `13.315ms`. This proves that the remaining cost is
renderer submission for the approved high-fidelity scene rather than layout, paint, or
unbounded JavaScript work. A broader attribution pass measured `118.413ms` and remains
reported as a noisy outlier.

This is therefore a substantial measured improvement, not a claim that the original synthetic
budget is green.

## Plan decisions

| Plan | Final decision |
| --- | --- |
| Plan 01: measured baseline | Complete. Dormant, cold, active, hidden, and replay evidence recorded. |
| Plan 02: isolate dashboard | Verification-only. The hidden and three-click boundaries already pass. |
| Plan 03: bound active frame cost | Implemented scoped IK matrices, rigid player batching, player-local vertex colors, and selective shadow ownership. |
| Plan 04: bound cold activation | No separate cold-only architecture. Construction remains after activation and is reported separately. |
| Plan 05: integrated proof | Complete locally. Matched traces, tests, lifecycle checks, keyframes, docs, and report recorded. |

## What changed

### 1. Scoped trophy and IK world-matrix work

`docs/js/champion-celebration-scene.js` no longer forces:

- a full `scene.updateMatrixWorld(true)` during trophy placement;
- repeated full captain-subtree updates during both arm solves;
- redundant trophy-subtree updates before reading named grips.

The existing `getWorldPosition()` and `getWorldQuaternion()` calls update the required ancestor
chains. The final Technical Taste Council pass also removed one duplicated shoulder-alignment
call that recomputed the same quaternion without changing the direction. The solver still runs
in the protected order:

```text
rig pose
  -> trophy carrier position/quaternion
  -> trophy named grip positions
  -> left/right arm IK
  -> renderer
```

This removed repeated matrix propagation without changing trophy orientation or hand contact.

### 2. Construction-time rigid player batching

`docs/js/champion-celebration-models.js` now batches only eligible direct leaf meshes:

- same animated parent;
- compatible `position`, `normal`, and `uv` attributes;
- no morph targets or interleaved attributes;
- no child objects;
- no `SkinnedMesh`, `InstancedMesh`, multi-material mesh, or custom depth/distance material;
- no protected animated thumb.

Animated finger meshes remain below their independent finger Groups, so grip pivots survive.
Nothing is merged across bones or rigs.

Positions and normals are transformed directly into the parent-local merged buffer. Indices are
offset into one bounded index buffer. Superseded unreferenced geometry and materials are removed
from the existing owner and disposed once.

### 3. Player-local vertex-color surface consolidation

Exact source colors are baked into normalized vertex-color attributes only for meshes that
actually merge. Each player owns:

- one matte clay replacement surface;
- one polished boot/sole clay replacement surface;
- retained special materials where a merge is not valid.

This preserves the visible skin, hair, kit, face, and boot colors and does not share appearance
materials across the cast. It intentionally normalizes subtle roughness/sheen/clearcoat
differences into two bounded clay surface classes. Desktop and phone keyframes remained visually
coherent.

### 4. Selective shadow ownership

Small face, trim, finger, and highlight details no longer own independent shadow work. Body mass,
head/hair silhouette, limbs, hands, boots, trophy, podium, and environment silhouettes retain
shadows. When detail geometry is merged into a silhouette owner, the merged object keeps the
silhouette shadow contract.

## Matched before/after evidence

Conditions match `BASELINE.md`: Edge 150 on Windows, fresh context per scenario, desktop 4x CPU,
phone 6x CPU, fixed viewport/DPR, identical wall window and review harness.

### Active windows

| Scenario | Baseline p50 / p95 / max | Final p50 / p95 / max | Baseline logical end | Final logical end |
| --- | --- | --- | --- | --- |
| Carry desktop | 53.865 / 81.970 / 105.302ms | 28.402 / 40.611 / 55.904ms | 12.8s | 14.1s |
| Carry phone | 76.508 / 115.162 / 127.791ms | 54.537 / 75.394 / 88.870ms | 11.7s | 12.5s |
| Peak desktop | 51.063 / 87.421 / 111.485ms | 36.639 / 51.800 / 89.286ms | 24.9s | 25.8s |
| Peak phone, full matrix | 89.174 / 136.386 / 147.103ms | 49.845 / 78.617 / 97.212ms | 23.4s | 24.7s |
| Hold/restore desktop | 51.908 / 82.892 / 89.128ms | 30.887 / 41.706 / 48.570ms | 28.9s | 29.9s |
| Hold/restore phone | 104.451 / 149.438 / 185.243ms | 51.718 / 79.893 / 85.737ms | 27.7s | 28.8s |

An earlier pre-council final checkpoint produced a `131.086ms` full-matrix phone-peak p95.
The post-council matrix produced `78.617ms`. Removing one redundant shoulder calculation does
not explain that entire difference, so both raw runs remain evidence of proxy variance and no
percentage claim is made from them.

Three current isolated fresh-browser repeats measured:

| Isolated phone peak | RAF p50 | RAF p95 | RAF max | Logical end |
| --- | ---: | ---: | ---: | ---: |
| Repeat 1 | 55.027ms | 78.516ms | 98.534ms | 24.5s |
| Repeat 2 | 54.787ms | 85.905ms | 108.941ms | 24.5s |
| Repeat 3 | 57.595ms | 77.003ms | 91.111ms | 24.5s |

These repeats are reported separately rather than substituted into the matched full-matrix row.
The harness jumps directly into newly visible team/effect states, while the production sequence
normally warms player programs earlier in the story. Focused final attribution measured:

| Variant | RAF p50 | RAF p95 | RAF max | Tasks over 50ms |
| --- | ---: | ---: | ---: | ---: |
| Renderer active, focused repeat 1 | 53.937ms | 69.262ms | 78.230ms | 42 |
| Renderer bypassed, focused repeat 1 | 8.459ms | 12.865ms | 15.658ms | 0 |
| Renderer active, focused repeat 2 | 56.608ms | 75.374ms | 87.026ms | 41 |
| Renderer bypassed, focused repeat 2 | 8.321ms | 13.315ms | 14.575ms | 0 |
| Renderer active, broader-pass outlier | 89.090ms | 118.413ms | 167.182ms | 27 |
| Renderer bypassed in broader pass | 10.688ms | 13.433ms | 16.800ms | 0 |

The remaining bottleneck is renderer submission. Layout, Paint, raster, and traced GPU tasks
remain small compared with the animation callback.

### Cold activation

| Scenario | Baseline RAF p50 / p95 / max | Final RAF p50 / p95 / max | Baseline task max | Final task max |
| --- | --- | --- | ---: | ---: |
| Desktop 4x | 24.365 / 34.404 / 964.109ms | 20.914 / 34.432 / 1467.739ms | 2009.028ms | 2791.273ms |
| Phone 6x | 44.621 / 105.389 / 114.389ms | 33.414 / 57.026 / 112.673ms | 1906.135ms | 2360.911ms |

Batch construction adds one-time buffer work. It remains behind the post-activation loading
boundary, never moves onto the dormant dashboard, and is kept separate from steady-state claims.
No speculative preload, worker, framework, cache, or hidden prebuild was added.

## Dormant dashboard evidence

| Scenario | Final RAF p95 | Final task max | Heavy celebration requests | Stage / canvas |
| --- | ---: | ---: | ---: | --- |
| Cold 4x | 5.302ms | 945.440ms | 0 | 0 / 0 |
| Dormant idle 4x | 0ms | 1.020ms | 0 | 0 / 0 |
| Three-click near miss 4x | 0ms | 5.560ms | 0 | 0 / 0 |
| Normal interactions 4x | 3.329ms | 60.349ms | 0 | 0 / 0 |
| Cold 6x | 8.523ms | 1677.457ms | 0 | 0 / 0 |
| Dormant idle 6x | 0ms | 1.456ms | 0 | 0 / 0 |
| Three-click near miss 6x | 0ms | 10.574ms | 0 | 0 / 0 |
| Normal interactions 6x | 5.817ms | 243.777ms | 0 | 0 / 0 |

The dashboard still requests no controller, scene, models, effects, stage, celebration canvas,
WebGL context, or celebration RAF before the fourth valid activation.

## Hidden and replay lifecycle

The final synthetic hidden interval lasted `5010.999ms` and recorded:

- zero celebration animation-frame callbacks;
- zero Layout events;
- zero Paint events;
- maximum main-thread task `3.915ms`;
- logical time resumed at `21.9s`.

Replay x3 recorded one celebration WebGL context at every checkpoint:

| Form factor | Celebration WebGL by cycle | Total contexts by cycle | Attached stage/canvas after Skip |
| --- | --- | --- | --- |
| Desktop | 1, 1, 1 | 6, 9, 12 | 0 / 0 |
| Phone | 1, 1, 1 | 6, 9, 12 | 0 / 0 |

The three extra contexts per cycle are the same generated 2D construction canvases documented
in the baseline. Forced-GC snapshots reported `+30` detached nodes (`+4728` bytes), including
ten generic `Attr` nodes beyond the baseline `+20` stage-element set. Connected DOM, stage,
canvas, and WebGL counts do not accumulate; inspector retention remains the more plausible
explanation than a live runtime leak.

Edge repeated the existing `texImage3D` flip/premultiply warning during replay. Playback and
teardown completed.

## Visual and behavioral verification

Current production-backed desktop and phone captures cover:

- `2.6s` curtain-overlapped captain entry;
- `7.8s` pickup;
- `10.6s` carrier-oriented trophy carry;
- `14.8s` podium walk;
- `19.6s` diverse planted anticipation;
- `22.55s` two-hand apex and synchronized jump;
- `27.5s` and `29.2s` continuous flares.

No console or page errors were emitted.

Actual dashboard validation confirmed:

- two responsive mirrored trigger nodes, exactly one visible;
- one active stage and canvas;
- 31 animated cards;
- 60 animated connector paths (`L=29`, `R=29`, `C=2`);
- exact Escape restoration of layout, classes, styles, 31 cards, and champion identity;
- zero attached stage/canvas after teardown.

Lifecycle validation confirmed:

- replay reuses the same canvas;
- reduced motion requests no scene module and shows the shared static tableau;
- forced fallback owns one stage;
- synthetic context loss is canceled, hides the failed canvas, and switches to the shared
  fallback;
- Skip restores root/body classes and removes attached resources.

## Tests

Passed:

- `node tests/animation-performance.mjs`
- `node tests/champion-celebration.mjs`
- `node tests/production-regressions.mjs`
- `node tests/matchcards.mjs`
- `node tests/map-frozen.mjs`
- `python scripts/validate_results.py`
- `python scripts/validate_match_details.py`

The final council correction also adds a behavior-level batching test that merges two toy
indexed geometries and verifies transformed positions, index offsets, unit normals, normalized
vertex colors, and exactly-once source disposal. The previous source-shape guards remain.

`npm test` reaches only the accepted Windows CRLF-sensitive
`tests/landing-ballpit.mjs` source-extraction failure:

```text
frame loop moves the touch target without layout properties
expected /touchTarget.style.transform/, received an empty extracted source slice
```

This revision does not edit that unrelated harness.

## Alternatives considered and rejected

| Alternative | Decision |
| --- | --- |
| Lazy celebration CSS or trigger rewrite | Rejected: dormant cost already passes. |
| Cross-rig instancing or merging | Rejected: body proportions, bones, and appearance ownership differ. |
| One rigid crowd mesh | Rejected: it would lose independent skin/shirt colors and animated arm waves. |
| Blanket shadow removal | Rejected: visibly flattened the scene and still measured above budget. |
| Phone DPR 1 | Rejected: visibly softened the image and did not improve main-thread p95. |
| Static stadium batching | Reverted: draw count fell, but matched p95 did not materially improve. |
| Render-frame skipping | Rejected: it lowers total work but not per-render p95 and would add visible stutter. |
| Lower cast, crowd, confetti, or triangle counts | Rejected: approved fidelity is the primary product contract. |
| Whole-avatar rigid skinning rewrite | Deferred: high leverage but disproportionate ownership and bind-pose risk for this release. |

## Limits and release interpretation

- Edge is the only local browser.
- Headless CDP and 6x CPU throttle are controlled proxies, not physical-device proof.
- Chrome, Firefox, Safari/iOS, and physical lower-end Android remain owner-run gates.
- The `16ms` active phone target is still red.
- The JavaScript-only scene path measures `12.865-13.315ms` p95 in focused final repeats when
  renderer submission is bypassed; the broader pass measured `13.433ms`.
- Reaching `16ms` with the approved `~893k`-triangle scene would require a larger renderer/model
  architecture change or visible content tradeoff.

The correct release statement is: behavior and lifecycle are commit-ready, repeated work was
materially reduced, and the strict synthetic active-scene budget remains an explicit known limit.

## Raw evidence

Session-only evidence directories:

```text
baseline-2026-07-13T18-33-21-726Z/
baseline-2026-07-13T20-22-44-280Z/  (post-council full matrix; runner default label)
final-council-phone-peak-1-2026-07-13T20-35-45-395Z/
final-council-phone-peak-2-2026-07-13T20-36-13-235Z/
final-council-phone-peak-3-2026-07-13T20-36-41-305Z/
attribution-2026-07-13T20-28-31-227Z/
attribution-2026-07-13T20-32-11-715Z/
attribution-2026-07-13T20-32-50-010Z/
```

Raw traces, heap snapshots, browser profiles, and machine paths remain outside the repository.

## Lessons learned

1. A WebGL scene can have negligible Layout and Paint cost while main-thread draw submission
   remains the bottleneck.
2. Measure the hidden product and the active reward as separate systems.
3. Remove redundant world-matrix propagation before changing pixels.
4. Batch only below one clear animation owner.
5. Vertex colors can preserve diverse appearance while reducing material/draw fragmentation,
   but every replacement geometry must own a valid color attribute.
6. Disposal is part of batching correctness.
7. Cold construction and sustained frame cost must remain separate tables.
8. Warmed, isolated, and full-matrix traces answer different questions; report all of them.
9. A strict synthetic gate should be reported honestly when approved fidelity makes it
   incompatible with the current renderer architecture.
