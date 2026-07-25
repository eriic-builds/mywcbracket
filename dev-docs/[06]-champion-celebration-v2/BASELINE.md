# Champion celebration V2 baseline

## Observation

V1 solved the difficult runtime problems: hidden activation, race-safe loading, exact modal
restoration, one-canvas reuse, deterministic time, trophy continuity, two-arm IK, fallbacks, silence,
and a production-backed review harness. The remaining gap is visible and concentrated: player
silhouettes still read as capsule blockouts, the stage is dark and round, and the current centered
rear-to-front blocking contradicts the supplied left-to-right storyboard.

## Evidence

| Surface | Current evidence | V2 implication |
| --- | --- | --- |
| Timeline | `champion-celebration-timeline.js` lifts/jumps at `17.7-19.9s`; tests lock every boundary. | Initial V2 target was the storyboard's 8/18/25 rhythm; the final pacing review re-locks it at `7.2/17.2/24.2s`, starts captain travel at `2.2s`, and preserves 30 seconds plus the `3.2s` curtain. |
| Camera | `applyCamera()` writes X as `0`; tests assert the centered value. | Translate camera position and target together on X. |
| Captain path | `updateCaptain()` starts at `[0, ground, -3.8]` and advances on Z. | Replace with an off-left X entry and rightward carry. |
| Plinth | Inline dark `CylinderGeometry` at X `0`. | Move left and replace with a named square ivory model factory. |
| Podium | Dark round cylinders with two side pieces. | Replace with the storyboard's broad white platform, side steps, and front captain drum. |
| Team | Six rigs reveal symmetrically from depth around X `0`. | Place them on the right rear platform and reveal them as the carry destination. |
| Avatars | Smooth normals exist, but torso/pelvis/shoulder masses are capsule-heavy; all hair shares one cap pattern; hands have four small fingers. | Improve silhouette and connected clothing masses, vary hair, and use three thick fingers plus thumb. |
| Trophy | Shared smooth sculpture and named grips already exist. | Refine proportions/material only; preserve anchors and ownership. |
| Effects | Flag, spots, glint, flashes, and confetti are centered at X `0`. | Parameterize them around the right podium center. |
| Continuity | Controller and mock both call `projectAnchor("plinth")`. | Moving the anchor should move the captured trophy target without re-plumbing the controller. Verify in browser. |
| Mock | Imports `createChampionScene()` directly. | Keep it as a thin harness; update only labels and shared timing constants. |

## Reasoning

- **Karpathy:** preserve the working runtime spine and change only the visual/staging delta.
- **Naval:** the anchor-driven trophy seam and pure-time scene are the leverage points; use them instead
  of rebuilding continuity or lifecycle.
- **Sean Grove:** encode the storyboard in one V2 brief and one phase table before animation work.
- **Willison/Hamel:** replace stale centered tests with explicit lateral tests and verify the off-center
  trophy handoff in a real browser.
- **Russinovich:** improve static geometry/materials, not DPR, per-frame allocation, or post-processing.
- **Hanselman/Litt:** name stage positions and factories so a non-specialist can change them later.
- **Yegge:** use four reviewable increments; do not hide model defects behind the final animation.

## Decision

Use four plans:

1. Raise avatar and shared trophy fidelity without changing staging.
2. Build and approve static left-plinth/right-podium/camera key poses.
3. Animate the approved key poses on the new deterministic timeline.
4. Prove lifecycle, performance, responsive framing, country variation, and documentation.

## Protected seams

The following code paths are out of scope unless validation finds a regression:

- `champion-celebration-trigger.js`;
- `createCurtainAnimations()` in `champion-celebration.js`;
- connector splitting/tagging in `interact.js`;
- dashboard render and fixture generation;
- one-canvas creation and modal isolation;
- logical clock implementation;
- reduced-motion pre-import branch;
- context-loss fallback;
- country palette sampling;
- trophy scene-space carrier and analytic two-arm IK algorithm;
- mock ownership of the production renderer.

## Hidden hazards

1. `projectAnchor()` is mathematically center-agnostic, but the off-center handoff has never been
   browser-proven.
2. The IK reach clamp can hide an impossible trophy target. Test the carrier target against the
   shortest captain's actual arm lengths.
3. A near-white podium exposes weak contact shadows and can clip under warm light.
4. Scrubbing backward can leave a dismissed plinth hidden unless visibility, scale, and opacity are
   reset deterministically every frame.
5. Moving only `camera.position.x` creates yaw and recreates the rejected side-view composition.
6. The phone view cannot show the whole lateral stage at once. It should frame the current story beat,
   then pan to the team, rather than flattening all world coordinates.
7. A broad podium nested inside a hidden team group would disappear during the opening. Podium
   architecture and teammate reveal need separate visibility ownership.
8. The central flag/banner identity layer and right-side payoff layer can collide in projection; their
   depth, height, and X ownership need independent review.
9. Taller plinth geometry changes trophy rest height, grab reach, ghost target, and plinth dismissal
   together.
10. Four small fingers are visually noisy at this scale. Three thicker fingers are both more legible
    and closer to the reference.
11. Country palettes with white or near-black secondaries can erase kit separation; neutral-away
    materials need a fixed warm ivory with country-color trims.
12. Adding material sheen without high roughness turns clay into plastic.
13. Any geometry/texture created during `renderFrame()` will violate the established frame-path guard.
14. The known full-suite stop in `landing-ballpit.mjs` is unrelated and must not become V2 scope.
15. The scene currently duplicates beat times across update functions. Changing only the phase table
    would leave old grab, pump, lift, plinth, and effect windows running.
16. A DOM-less Node test cannot instantiate the current captain rig. Reach proof needs one pure numeric
    helper shared by production and tests.

## Tradeoffs

- Lateral storytelling is more expressive but loses the free symmetry of V1.
- A short final hold better matches the storyboard but leaves less time for payoff reading.
- Procedural models cannot reach authored-film fidelity without external assets; the bounded target is
  premium stylized clay, not a realistic digital human.
- A static model gate adds an extra review step but prevents motion and confetti from masking weak
  anatomy.
- Preserving V1 docs creates some duplication, but it protects the user's learning history and makes
  the intentional V2 reversal auditable.

## Lessons already earned from V1

- Solve geometry and reach in a static frame before choreography.
- Place the trophy, then read grips, then solve arms.
- Keep the trophy outside either hand hierarchy.
- One production renderer prevents mock drift.
- Art-direction assertions in tests are useful only when rewritten deliberately after an approved
  direction change.
- The bracket curtain and trophy continuity are valuable product identity; visual revamps should not
  casually rewrite them.

## Known validation baseline

Focused celebration, performance, match-card, frozen, golden, and production regression suites were
green at the end of V1. Full `npm test` can stop at the unrelated CRLF-sensitive
`tests/landing-ballpit.mjs` source-extraction assertion. V2 must rerun that baseline and report it
plainly without modifying the landing ballpit.

## Final implementation correction

The baseline assumption that moving `projectAnchor("plinth")` was sufficient proved incomplete in the
actual dashboard. The live WebGL trophy capture included transparent canvas padding, so element bounds
did not equal visible-pixel bounds. V2 now alpha-crops the capture once and projects shared trophy
top/bottom anchors at `projectAnchor("trophy-rest")`; the protected capture/ownership seam remains
intact while the visible handoff is exact.
