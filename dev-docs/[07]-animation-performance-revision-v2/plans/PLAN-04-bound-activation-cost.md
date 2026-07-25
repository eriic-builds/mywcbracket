# PLAN: Bound visible cold activation cost

**Rank: 4 of 5. Leverage: 8.7/10. Measurement- and perception-gated.**

## Execution result

Complete as a documented decision. No separate cold-only runtime architecture was added.

The active-frame batching selected in Plan 03 adds one-time buffer construction after the
fourth activation:

| Scenario | Baseline RAF p95 | Final RAF p95 | Baseline task max | Final task max |
| --- | ---: | ---: | ---: | ---: |
| Desktop 4x | 34.404ms | 34.432ms | 2009.028ms | 2791.273ms |
| Phone 6x | 105.389ms | 57.026ms | 1906.135ms | 2360.911ms |

Production-backed desktop/phone captures retained the protected curtain and frame-zero visual
contract, and browser lifecycle checks emitted no errors. The one-time construction cost is
therefore reported rather than moved onto the dormant dashboard through speculative preload.

No worker, cache, background prebuild, shared cross-rig geometry owner, or new dependency was
introduced. Cold activation remains a known tradeoff of the steady-state renderer reduction.

## Goal

Remove only visible frame-zero jank caused by one-time scene construction. Do not prebuild
while dormant, and do not refactor a documented one-time task that is not perceptible.

## Exact candidate files

- `docs/js/champion-celebration-models.js`
- `docs/js/champion-celebration-scene.js`
- `tests/champion-celebration.mjs`
- `tests/animation-performance.mjs`
- `dev-docs/[07]-animation-performance-revision-v2/RESULTS.md`

Do not edit the trigger or dashboard loading boundary in this plan.

## Observation

First activation constructs the stadium, seven detailed rigs, textures, materials, effects,
lights, shadows, renderer, and country identity. Several player shapes appear similar, but
body proportions, hair, facial hair, kit, and skin materials vary.

## Evidence required before editing

- Longest cold-activation main-thread tasks and trace stacks.
- Time from fourth click to stage, WebGL context, first rendered frame, and 3.2-second curtain.
- Headed desktop and phone observation of frame-zero jank.
- Construction attribution for:
  - country flag texture;
  - pitch/banner/armband canvases;
  - stadium;
  - player geometry;
  - materials/textures;
  - renderer/shadow setup.

Cold tasks over `50ms` are documented, not automatically optimized.

## Step-by-step implementation order

1. Confirm Plan 04 is required by both:
   - measured construction cost; and
   - visible headed jank.
2. Correlate the longest task to an exact construction function.
3. If repeated immutable geometry dominates:
   - create one scene-level geometry owner;
   - share only geometry with identical dimensions and topology;
   - keep every player material and appearance owner separate;
   - pass shared geometry explicitly into rig factories;
   - dispose shared buffers once from the scene owner.
4. Do not share geometry whose dimensions encode deterministic player variation.
5. Do not share mutable morph targets, skeleton state, matrices, materials, textures, or
   per-player appearance.
6. If generated 2D textures dominate:
   - cache only immutable identical texture data within the active scene lifecycle;
   - retain dynamic country and appearance data;
   - keep ownership and disposal explicit.
7. Do not move construction before activation. No idle callback, preload, speculative import,
   or hidden canvas may tax the dashboard.
8. Re-run cold activation and all reach/appearance/lifecycle tests.
9. Stop if the headed visual review is smooth even when a one-time task remains over `50ms`.

## Reasoning

Cold geometry sharing can reduce duplicate buffer creation without changing steady motion.
It is deliberately later than frame work because users experience sustained jank repeatedly,
while construction happens once and is protected by the opening curtain.

## Tradeoffs

- Shared immutable geometry saves time and memory but makes disposal ownership more complex.
- Prebuilding would improve click-to-frame time but violates the primary dormant-cost goal.
- Broad material sharing would be cheaper but destroy the diverse global cast.

## Edge cases a weaker model will miss

- Similar-looking limbs can have different radii or lengths because of deterministic body
  variation.
- Sharing a geometry and disposing it from every rig causes replay/context-loss failures.
- Sharing materials or textures can make one player's kit/skin update every other player.
- The trophy grip and arm reach contracts depend on unchanged limb metrics and pivots.
- Generated country textures are dynamic; never cache one country's flag for another.
- The opening curtain can hide construction without eliminating a long task. Use headed
  perception, not the number alone.
- A retained cache after teardown can turn a cold optimization into a replay memory leak.
- The first scene after context loss may require fresh GPU resources even when CPU geometry
  is cached.

## Tests and browser evidence

- `node tests/champion-celebration.mjs`
- `node tests/animation-performance.mjs`
- cold activation desktop 4x and phone 6x;
- all seven distinct appearance variants;
- trophy reach, named grips, and two-arm IK;
- replay x3 and context loss;
- forced GC and detached-node comparison;
- headed frame-zero and opening-curtain review.

## Concrete acceptance criteria

- Runtime changes occur only when cold cost is both measured and visibly janky.
- Fourth-click-to-first-frame and longest correlated construction task improve in the matched
  trace.
- No construction, import, canvas, or WebGL work occurs before fourth activation.
- Curtain timing, seven rigs, diverse materials, dynamic country, trophy contact, reach, and
  fallback remain unchanged.
- Shared geometry is immutable and disposed exactly once.
- Replay and context-loss cleanup remain correct.
- If visible jank is absent, this plan is verification-only.

## Lessons learned

Not every long task deserves an abstraction. Optimize the user-visible boundary, and share
only resources whose identity and ownership are truly the same.
