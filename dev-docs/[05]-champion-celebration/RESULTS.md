# Champion celebration results

Status: implementation complete and release-authorized.

## Outcome

The mirrored champion country box now owns a hidden four-activation celebration. The feature
lazy-loads one local Three.js scene, carries the visible bracket trophy into a deterministic
30-second full-scale soft-matte clay winners-stage sequence, uses shared fallbacks, remains
intentionally silent, then restores the dashboard exactly.

No backend, build step, runtime package, remote asset, player likeness, or cloud-agent task was added.
Commit and main-branch push were authorized after local verification.

## 1. Activation and lifecycle

**Observation:** Four bracket variants exist in the DOM at once, while CSS selects the active one.
A global champion query can therefore celebrate a hidden or wrong bracket.

**Evidence:** Mirrored rendering and Sideways rendering use different helpers. Browser review also
found one visible Actual trigger and one zero-sized My-picks trigger in the same document. The final
Technical Taste Council pass found that a fixed body-ID isolation list omitted the live
`#stalenote` control and any future direct-body control.

**Reasoning:** Resolve the active mirrored bracket and champion on every event. Give the celebration
its own lazy-import generation counter because the existing trophy generation cannot guard another
asynchronous feature.

**Decision:** `champion-celebration-trigger.js` owns the rolling four-event window and delegated
click/keyboard handling. `main.js` owns import invalidation, one active controller, trophy lookup,
rerender/Home teardown, and duplicate-start rejection. The modal snapshots and inerts every direct
body sibling, observes and isolates siblings added during playback, restores each prior state, and
traps Tab on Skip.

**Tradeoffs:** The interaction remains deliberately undisclosed, so accessibility comes from
keyboard parity and modal behavior rather than a visible hint. Isolating by body relationship rather
than known IDs adds a small observer, but it removes a brittle maintenance allowlist.

**Implementation order:** Mark only mirrored champion output, install delegated activation, add the
generation guard, snapshot state, append the body-level modal, and route every exit through one
idempotent destroy path.

**Lesson learned:** Hidden DOM variants are still live architecture. Visibility must be resolved at
the event boundary, not assumed from selectors written during render.

## 2. Trophy continuity

**Observation:** Cloning a WebGL canvas does not copy its pixels, and the live trophy renderer has
its own pause lifecycle.

**Evidence:** The browser opening frame initially showed the captured trophy floating because its
center was aligned to a 3D origin instead of its base to the plinth.

**Reasoning:** Share only the pure geometry factory. Keep live and cinematic scene objects
independent, render-and-copy the active canvas synchronously, and align the scaled capture's bottom
edge to the projected plinth top.

**Decision:** `trophy-geometry.js` builds independent smooth sculptures from a high-resolution globe,
curved tube supports, a lathed stem/base, and named left/right grip anchors. `trophy.js` exposes
capture and external suspension. The DOM capture remains visible through the acknowledgment and
approach beat, then crossfades to an independent scene-owned 3D trophy. A captain-owned world-space
carrier positions that trophy deterministically; only after placement does the frame read the two
grip anchors and solve both arms to them. The narrow-screen SVG fallback uses the same rounded
silhouette rather than the former faceted drawing.

**Tradeoffs:** A short aligned crossfade is less clever than reparenting the running live scene, but
it is deterministic, disposable, and works for both canvas and SVG trophy sources.

**Implementation order:** Extract geometry, preserve live behavior, add synchronous capture, add
external suspension, project plinth contact, add named trophy grips, drive the world-space carrier,
then solve both arms after trophy placement.

**Lesson learned:** Visual continuity is about contact points and pixels, not object identity.
Parenting a prop to one hand is not a substitute for solving both hands to physical grip targets.

## 3. Scene, rigs, and choreography

**Observation:** The first production pass exposed the podium before 9.6 seconds, left the captain
visible during the cleared hold, placed the final trophy in front of the captain's face, removed
bracket cards too quickly, faded connectors independently, left an empty trophy plinth in the carry,
used figures/stadium geometry that still read as a coarse blockout, and spent `6.2-8.25s` on a prop
gag rather than building anticipation for the trophy. The later clay pass still used a side-biased
camera, competing scene centerlines, simplified hands, a duplicated mock renderer, and a `4.55` lift
target that exceeded the captain's combined upper-arm and forearm reach.

**Evidence:** Exact logical-time scene captures showed the staging defects. Live opening captures at
approximately `0.35s`, `1.0s`, `1.85s`, and `2.8s` showed the transition rhythm. Desktop frames at
`3.2s`, `10.8s`, `18.8s`, and `22.8s`, plus a 390x844 hero frame, exposed the torso gap, duplicate
trophy overlap, intrusive tunnel, lingering plinth, weak anatomy, flag/banner competition, and
side-on performance. Measuring the rig proved the old overhead target was unreachable; comparing
production with the standalone mock also proved the two implementations had visibly drifted.

**Reasoning:** Preserve the approved 30-second phase contract and procedural/local architecture. Use
the opening as a loading mask rather than adding delay: wait for frame zero, move cards individually,
and split each elbow connector so both endpoints can follow independent cards. Raise visual fidelity
through bounded topology, anatomy, materials, pitch/stadium layers, and lighting rather than remote
models or unbounded geometry. For the rebuild, establish one centerline before tuning motion, derive
the lift from physical arm reach, and make hand contact a deterministic constraint rather than a
keyframed visual approximation.

**Decision:** The opening is now a 3.2-second center-out, card-by-card paused-WAAPI cascade. Inner
rounds leave first, rows stagger, cards remain opaque during initial travel, and source/destination
connector halves use the exact timing and transform of the cards they touch. The world clock starts
only after scene creation succeeds. The scene now contains one captain plus six teammates built from
24-segment capsules, 32-segment heads, smooth clay materials, layered faces/hair/kits/boots,
articulated palms/fingers/thumbs, and stable named rig anchors. The former prop-gag beat is replaced by
a viewer acknowledgment, trophy focus, measured approach, and continuous pre-grab reach. Desktop and
phone cameras are centered at `x = 0` with no lateral tracking; tunnel, trophy, plinth, podium, team,
flag, and banner share that axis. The captain enters rear-to-front and performs toward the viewer.
The trophy remains a scene child driven by a captain-owned carrier, the lift target is reduced to the
reachable `3.68`, and an allocation-free analytic two-bone solve keeps both hands on the trophy's
named grips throughout grab, carry, pumps, lift, jump, and hold. The world includes a rounded podium,
generated pitch markings, four-tier stands, side wings, roof/truss structure, smooth instanced crowd
bodies and heads, and a local `2026 WORLD CUP CHAMPIONS` banner with the selected country. The empty
plinth lowers, shrinks, fades, and is hidden from `9.0-10.3s`. One module-scoped celebration canvas
and browser WebGL context remain reused across replays.

**Tradeoffs:** Phone composition compresses teammate positions and podium width rather than reducing
player count or rebuilding resources. Figures remain intentionally generic and stylized rather than
photorealistic. Frontal perspective gives up some side-view parallax in exchange for direct viewer
interaction, clearer symmetry, and more reliable contact inspection. Separate desktop/phone camera
presets preserve full-scale depth. The banner uses a local CanvasTexture and the flag is slightly
smaller/lower so both can coexist. Retaining one bounded context avoids context churn, while per-run
renderer disposal keeps scene-owned GPU resources from accumulating.

**Implementation order:** Gate the curtain on scene readiness, split/tag connector paths, implement
card-level cascade timing, correct contact geometry and anatomy, deepen the world, add the banner,
dismiss the plinth during carry, align every major object to one centerline, add named trophy grips
and a reachable carrier path, solve both arms, consolidate the mock onto production, then tune
desktop/phone hero framing and final flag overlap.

**Lesson learned:** A static hero frame exposes rig and composition defects, while sampled transition
frames expose ownership defects that a final still cannot reveal. A visual joining two independently
moving objects often needs to be split so each half has one unambiguous owner. A dramatic pose must
also be mechanically reachable, and a review harness should reuse production rather than imitate it.

## 4. Country identity and payoff effects

**Observation:** A 48x32 palette canvas was adequate for color analysis but blurred detailed flags
when reused as the display texture. Anti-aliased flag colors and strong colored lights also risked
washing out neutral kit panels.

**Evidence:** Spain's crest blurred in the six-country matrix, and early England frames read as pink
rather than red/white.

**Reasoning:** Separate cheap sampling from presentation, preserve light/dark flag neutrals, and use
bounded unlit instance colors for confetti so country colors remain readable.

**Decision:** Flags use a separate 320x240 local raster texture on a 14x8 segmented cloth mesh.
Crowd and confetti remain instanced and bounded. The championship banner is generated locally from
the same palette with auto-fitted country text. Lighting, flashes, glint, pole, country-color
confetti, and secondary teammate motion build in the approved sequence.

**Tradeoffs:** The flag texture is cached per celebrated country, increasing small local memory use
in exchange for crisp bundled emblems and no remote request.

**Implementation order:** Sample palette, build the high-resolution local texture, assemble country
materials, add segmented flag/crowd/confetti, then tune light intensity against all required flags.

**Lesson learned:** Analysis resolution and presentation resolution are different requirements and
should not share one asset by convenience.

## 5. Fallback and silence

**Observation:** Reduced motion, initialization failure, and context loss need one behavior contract;
parallel fallback clocks would drift and leak.

**Evidence:** Browser scenarios confirmed reduced motion never requested the scene module, forced
fallback restored in 6.073 seconds, and a cancelable real `webglcontextlost` event switched the one
active stage to the same fallback.

**Reasoning:** Branch before the Three.js import when possible and reuse the visibility-aware logical
clock so every fallback shares timing and cleanup.

**Decision:** One static tableau serves all fallback causes. The celebration has no sound control,
audio module, cue API, Web Audio construction, media element, or audio asset.

**Tradeoffs:** The fallback is intentionally short and near-static rather than a reduced version of
the full choreography.

**Implementation order:** Build one fallback element, drive it with the shared clock, wire context
loss, and keep production and the standalone mock under the same silence contract.

**Lesson learned:** Failure modes become maintainable when they converge before timing and cleanup
logic diverge.

## Verification evidence

- Five Skip replays: one attached stage/canvas while active and no attached stage/canvas afterward.
- Five full completions: `29.937-30.005s`, with no WebGL warnings or accumulated stage/canvas.
- Final replay identity check: `sameCanvas=true`, `sameContext=true`, and
  `activeCanvasCount=1`; teardown detached the singleton and disposed the per-run renderer/resources.
- A sampled live mid-cascade frame produced the same computed transform for a moving card and its
  connector half (`matrix(0.996212, 0, 0, 0.996212, -66.7717, 0)`), with both still at full opacity.
- A final adversarial check found that the two center-side connector halves entering M104 were tagged
  but skipped by the left/right animation branch. After correction, both halves match M104's moving
  transform (`matrix(0.998281, 0, 0, 0.998281, 0, 1.85625)`) and opacity (`0.965625`), and M104 owns
  exactly one animation rather than a redundant center-column cascade plus its explicit fade.
- Opening frames at approximately `0.35s`, `1.0s`, `1.85s`, and `2.8s` show the center-out cascade
  opening onto the already initialized stadium rather than a blank stage.
- Exact desktop frames at `3.2s`, `10.8s`, `18.8s`, and `22.8s` and the 390x844 `22.8s` frame confirm
  the revised anatomy, plinth dismissal, championship banner, and final hero composition.
- Clay-direction production captures at desktop `6.8s`, `9.2s`, `18.8s`, and `24s`, plus phone
  `6.8s`, `9.8s`, `18.8s`, and `24s`, confirm the full-scale perspective, natural approach, clean
  plinth contact, nonintersecting grab, rounded avatars, smaller trophy carry, readable banner, and
  complete final tableau. The phone opening confirms the smooth replacement SVG rather than the old
  faceted fallback.
- Frontal-rebuild desktop and phone frames at `6.8s`, `9.2s`, `11.5s`, `15.8s`, `18.8s`, and `24s`
  confirm direct viewer-facing staging, the shared centerline, rear-to-front entrance, reachable
  overhead lift, both hands on named trophy grips, and no banner/flag obstruction.
- Final production lifecycle automation confirmed same-canvas replay, exactly one stage/canvas while
  active, zero attached stage/canvas after Skip, exact root/body class restoration, no scene-module
  request under reduced motion, the shared forced fallback, and context-loss fallback with the failed
  canvas hidden.
- Existing and dynamically added direct-body controls became `inert` and `aria-hidden`; teardown
  restored their exact prior states. Tab and Shift+Tab remained on Skip.
- Hidden-tab review: backdrop opacity stayed `0.205618` while hidden, then resumed to `0.516975`.
- Exact prior-state restoration preserved root/body classes, inline overflow, existing `inert` and
  `aria-hidden`, map class/text/expanded state, stat-card class/translation, scroll, and focus.
- Reduced motion loaded no celebration scene module.
- Context loss used one stage, hid the dead canvas, showed the shared fallback, and restored.
- Sideways remained inert; four Enter activations started the mirrored feature; Escape did not
  reach a background listener.
- Phone portrait used a DPR-capped `585x1266` backing canvas; landscape used `1266x585`; neither
  introduced horizontal overflow and both kept controls inside the viewport.
- England, France, Spain, Argentina, Switzerland, and Germany were reviewed at desktop and phone
  hero frames.
- Browser network review found no external request.
- Source guards confirm there is no sound control, celebration audio module, cue API, or Web Audio
  construction.
- The post-removal browser pass confirmed production exposes exactly one control, Skip; Tab and
  Shift+Tab remain contained, replay preserves canvas/context identity, and reduced-motion and real
  context-loss fallbacks still restore correctly.
- The standalone review has no duplicate renderer, sound control, or media element; it imports the
  production scene controller while play, scrub, team selection, phone resize, reduced-motion preview,
  replay, and Skip remain functional.
- Focused celebration, performance, match-card, frozen-map, and golden tests pass.
- Every suite after `landing-ballpit.mjs` in `npm test` passes independently.
- `validate_results.py`, `validate_match_details.py`, and `tests/match_details.py` pass.

## Final Technical Taste Council review

- **Russinovich / Grove:** The first implementation created a new celebration canvas on replay.
  Resolution: retain one module-scoped canvas and browser context, dispose every per-run scene and
  renderer, and prove identity equality across teardown/replay.
- **Hanselman / Litt:** The first modal isolation pass depended on a fixed body-ID list and missed
  `#stalenote`. Resolution: isolate all current body siblings, observe future direct-body additions,
  restore every prior state, and trap focus inside the dialog controls.
- **Product direction:** Sound was removed after implementation. Resolution: delete the production
  and mock audio paths, collapse the roadmap to seven plans, and enforce intentional silence in tests.
- **Game-design / 3D-modeling refinement:** The initial production art still read as a blockout and
  the opening did not create enough anticipation. Resolution: preserve the fixed phase timing while
  adding a card-and-line curtain, smooth clay-avatar anatomy, a curved premium trophy, a warm
  full-scale three-quarter stadium, a championship banner, motivated plinth disappearance, and a
  gratitude-to-trophy approach beat in place of the former prop gag.
- **Frontal rebuild review:** The later clay pass remained side-biased and its overhead trophy target
  was outside the rig's physical reach. The mock duplicated production and therefore concealed drift.
  Resolution: align the full world to `x = 0`, move the captain rear-to-front, remove lateral camera
  tracking, add articulated hands and named trophy grips, lower the lift to `3.68`, solve both arms
  analytically after trophy placement, and make the review harness instantiate production directly.
- **Post-refinement adversarial review:** The center-side connector halves entering M104 carried
  metadata but were ignored by both the left/right cascade and generic fade. Resolution: scope the
  round cascade to left/right columns and give center-tagged paths M104's exact downward fade in both
  production and the mock. The same review added a maximum text width for future long banner labels.

After those corrections, the final council pass reported no other material correctness or
brief-compliance gaps.

## Known local validation caveat

`npm test` stops at the unchanged `tests/landing-ballpit.mjs` source-extraction guard in this Windows
checkout. The guarded source contains the expected `touchTarget.style.transform`, but both unchanged
files use CRLF locally and the test's regex requires LF-only separators. Git reports no diff for
`docs/js/landing-ballpit.js` or `tests/landing-ballpit.mjs`. This feature did not modify that area.

## Frozen output review

Only `bracket_actual` and `bracket_picked` changed in each frozen fixture. Each change is the expected
mirrored champion attribute:

```html
data-champion-celebration-trigger
```

Sideways output and every other frozen section remain unchanged.
