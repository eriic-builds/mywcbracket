# PLAN 04: Prove the V2 release gate

**Rank: 4 of 4. Leverage: 9.0/10. Run after Plan 03.**

**Execution status: complete. Final evidence is recorded in `../RESULTS.md`.**

**Council call:** Willison/Hamel require measured evidence rather than confident prose. Yegge makes the
handoff reviewable. Context Engineering preserves V1 history and records only the high-signal V2 delta.

## Goal

Prove that the three V2 build increments compose into one reliable production behavior and leave a
self-contained learning record that a new engineer can trust.

This plan owns:

- focused and baseline automated validation;
- desktop and phone storyboard frame review;
- curtain-overlapped captain reveal, carrier-oriented trophy grip, and seven-player appearance review;
- country-variation review;
- actual dashboard cascade and off-center trophy continuity;
- replay, one-canvas reuse, Skip, reduced motion, forced fallback, context loss, hidden time, and
  cleanup;
- production-backed mock guidance;
- final V2 results and interactive execution review;
- confirmation that no protected bracket/dashboard surface changed unnecessarily.

## Observation

A visually attractive mock is not proof of shipped behavior. V1 already demonstrated that lifecycle,
resource, fallback, and review-renderer drift defects appear outside the hero frame. V2 also
intentionally rewrites tests that encoded the old centered composition, so the new lateral contract
must be locked with equal precision.

## Evidence

- The mock imports the production scene, but the actual dashboard owns the real trigger, trophy
  capture, curtain, modal isolation, and teardown.
- Existing tests statically guard one canvas, no frame allocation, silence, reduced-motion pre-import,
  context loss, named grips, and the curtain.
- Session browser scripts already validate replay, cleanup, fallback, and context loss.
- Full `npm test` has a known unrelated CRLF-sensitive `landing-ballpit.mjs` stop.

## Reasoning

The release gate should not become a fourth implementation pass. It should expose defects and route
them back to the owning plan. Evidence must cover both architecture and perception: tests prove
contracts, while browser frames prove hand contact, silhouettes, alignment, and story readability.

## Decision

- Keep V1 docs and review artifact unchanged except for the V2 pointer already added.
- Finish the new V2 package and self-contained review artifact.
- Use the production-backed mock for fast deterministic frame capture.
- Use the actual dashboard for curtain/trophy/lifecycle proof.
- Review at least three materially different country palettes.
- Report the known unrelated full-suite baseline without fixing it.
- Make no commit, push, deployment, or publication.

## Tradeoffs

- Browser evidence takes longer than source tests, but it is the only reliable way to judge the visual
  requirements.
- Three-country review is not exhaustive, but it catches the highest-risk palette cases without
  turning the gate into a full flag matrix.
- Preserving V1 and V2 artifacts duplicates some explanation but keeps the evolution and lessons
  understandable.

## Exact files to touch

- `tests/champion-celebration.mjs`
  - final deterministic/source contracts discovered during integration, including captain overlap,
    carrier quaternion/reset, hero appearance spread, and facial-hair geometry.
- `tests/animation-performance.mjs`
  - final resource/frame bounds only if needed.
- `dev-docs/[00]-dev-reports/[05]-champion-celebration/index.html`
  - final V2 review guidance and labels.
- `dev-docs/[00]-dev-reports/[05]-champion-celebration/mock.js`
  - only integration fixes; no duplicate renderer.
- `dev-docs/[06]-champion-celebration-v2/BRIEF.md`
  - only corrections revealed by implementation.
- `dev-docs/[06]-champion-celebration-v2/BASELINE.md`
  - only corrections to evidence.
- `dev-docs/[06]-champion-celebration-v2/README.md`
  - final status and links.
- `dev-docs/[06]-champion-celebration-v2/RESULTS.md`
  - complete implementation/evidence record.
- `dev-docs/[06]-champion-celebration-v2/Brief_5_V2_EXECUTION_REVIEW.HTML`
  - final self-contained executive/engineering learning artifact.
- Session-only browser scripts and screenshots under the Copilot session folder.

Do not add screenshots, temporary scripts, node modules, logs, or generated reports to the repository.
Do not edit render fixtures or the landing ballpit.

## Required HTML artifact

`Brief_5_V2_EXECUTION_REVIEW.HTML` must be one self-contained file with:

1. Executive Summary
2. Ranked Recommendations with leverage scores
3. Codebase Discovery
4. Architecture Overview
5. Dependency & Data Flow Analysis
6. PLAN Reviews for all four plans
7. Risks & Edge Cases
8. Alternative Approaches Considered
9. Reasoning Trace Summary as an evidence-to-decision trail, not hidden chain-of-thought
10. Learning Mode (ELI5)
11. What a Senior Engineer Would Notice
12. Recommended Execution Order
13. Lessons Learned

It must also include:

- the required Clawpilot theme-detection script before other JavaScript;
- the exact required `--cp-*` light/dark variables;
- only `var(--cp-*)` component colors;
- Segoe UI/Aptos/Calibri typography;
- interactive sidebar navigation;
- collapsible sections;
- search/filter for plan reviews;
- confidence indicators;
- inline HTML/SVG architecture and storyboard-flow diagrams;
- responsive desktop/mobile layout;
- no external assets or dependencies.

## Step-by-step implementation order

1. Query task tracking and confirm Plans 01-03 are complete.
2. Run focused automated validation:
   - `node tests/champion-celebration.mjs`;
   - `node tests/animation-performance.mjs`;
   - `node tests/matchcards.mjs`;
   - `node tests/production-regressions.mjs`;
   - frozen, golden, match-details, bracket, and parse suites that cover touched surfaces.
3. Run the Python validators already present in the repository.
4. Run full `npm test`:
   - if it stops only at the known CRLF `landing-ballpit.mjs` assertion, record that exact baseline;
   - if anything touched by V2 fails, fix it before continuing.
5. Validate the production-backed mock:
   - no console/page errors;
   - scrub to every required frame;
   - scrub backward after plinth dismissal and team reveal;
   - switch countries while open;
   - resize between desktop and phone while open;
   - replay.
6. Capture desktop and `390x844` phone frames at all required times.
7. Review the frames explicitly for:
   - avatar/trophy quality;
   - three-finger hands;
   - trophy/plinth contact;
   - captain already moving behind the bracket fade at `2.6s` and clear at `3.2s`;
   - left-to-right story;
   - trophy rotation and both-hand grip alignment at `10.6s` and `14.8s`;
   - seven visibly distinct hero skin tones, hair tones/styles, and varied facial hair;
   - frontal camera;
   - constant-speed carry and podium traversal with no fast-forward;
   - no preliminary hops or fake jumps before the one synchronized lift jump;
   - six planted, compact pre-lift anticipation gestures with no neighboring-arm lattice;
   - reachable lift;
   - synchronized jump/landing;
   - flares and confetti visible by the `22.55s` trophy apex;
   - repeated flare launches still visible at `27.5s` and behind the `29.2s` restore fade;
   - flag/banner/trophy/face separation;
   - warm stadium and ivory stage;
   - phone cropping and readability.
8. Repeat final and grab frames with at least three country palettes:
   - one light-secondary palette;
   - one dark-secondary palette;
   - one high-saturation palette.
9. Validate the actual dashboard:
   - four activations trigger only mirrored champion;
   - scene renders frame zero before curtain;
   - center-out card cascade and split connector halves remain intact;
   - captured dashboard trophy moves continuously to the off-center left plinth;
   - crossfade occurs under the hands;
   - carried trophy follows the captain carrier's world quaternion and rotated named grips;
   - restore returns exact bracket state.
10. Validate lifecycle:
    - replay reuses the same canvas node;
    - Skip removes stage resources;
    - Escape works;
    - hidden tab pauses logical time;
    - reduced motion avoids scene import;
    - forced initialization fallback works;
    - synthetic context loss enters fallback and cleans up;
    - dashboard rerender/landing teardown are safe.
11. Validate performance/resource behavior:
    - DPR remains capped at 1.5;
    - crowd/confetti counts remain bounded;
    - frame functions contain no layout reads, random calls, or resource construction;
    - the source guard spans every frame-called effect helper, not only the top-level dispatcher;
    - no per-instance literal-array iteration or unnecessary per-frame normal recomputation remains;
    - all new geometry/material/texture factories dispose.
12. Inspect the diff:
    - trigger, connector drawing, render fixtures, vendor code, and unrelated pages should be untouched;
    - any unexpected change is either removed or explained.
13. Complete `RESULTS.md` using:
    - Observation;
    - Evidence;
    - Reasoning;
    - Decision;
    - Tradeoffs;
    - Implementation;
    - Verification;
    - Lessons learned.
14. Complete and browser-review the interactive V2 HTML artifact in light/dark, desktop/mobile.
15. Update README status to complete only after all evidence is present.
16. Keep every repository change local and uncommitted.

The final tests must encode brief relationships rather than copy new implementation snapshots:

- `STAGE_LAYOUT.plinthX < 0 < STAGE_LAYOUT.podiumX`;
- team platform height is above captain platform height;
- camera position X and target X come from the same tracked value;
- carry and podium-walk speeds differ by less than 3%;
- captain visibility/motion begins at `2.2s` while the protected curtain still ends at `3.2s`;
- carrier quaternion is applied before named grips are read and both arms are solved;
- backward scrubbing before handoff restores the trophy rest quaternion;
- variants `0-6` have seven distinct skin tones, hair tones, and hairstyle indexes;
- no preliminary hop, partial trophy-lift envelope, or carrier offset exists during team settle;
- teammate roots remain planted while named anticipation progress drives upper-body poses;
- flare/confetti start after `21.2s` but before the `22.55s` trophy apex;
- flare timing ends at `CELEBRATION_DURATION` and the existing instances use deterministic relaunch
  modulo rather than new allocations;
- the shared shortest-captain reach helper passes with margin.

Do not regenerate a passing snapshot and treat that as proof.

## Edge cases a weaker model will miss

- The production mock can pass while the real dashboard trophy capture or curtain is broken.
- Scrubbing only forward misses stale hidden/opacity/scale state.
- A replay that creates a new canvas can appear correct while leaking WebGL contexts.
- Country switching can expose low-contrast neutral kit or banner combinations.
- Phone portrait can crop outer teammates even when desktop is excellent.
- The shortest captain, not the average captain, owns the reach acceptance.
- Confetti can visually hide a floating hand; inspect the lift before the densest payoff.
- A pre-lift pose can be individually valid yet still form a lattice when six adjacent arm spans overlap;
  inspect `19.6s` and `21.2s` as group compositions, not isolated rigs.
- A flare can technically start during the lift yet peak too late; inspect the actual `22.55s` apex.
- A flare timing window can remain active while every one-shot comet is already finished; inspect
  `27.5s` and `29.2s` and require deterministic relaunch of the existing instances.
- Position-only trophy following can pass static pickup review and still mangle both hands during the
  side-facing carry; inspect the two travel headings, not only the front-facing lift.
- A diverse palette list is not proof of a diverse cast if modulo selection repeats visible attributes;
  inspect all seven hero variants together and test their selected indexes.
- Captain motion can begin at `2.2s` but remain visually hidden if render visibility is still phase-gated
  to `captain-entry`; capture the overlapping curtain frame.
- A context-loss fallback can appear while old scene resources remain attached.
- Full-suite failure at a touched test is not the known landing baseline.
- HTML can look correct but violate theme requirements through one hardcoded component color.
- `file://` review can break code that assumes HTTP; the self-contained HTML must not fetch anything.
- V1 docs should not be rewritten to pretend V2 was always the design.
- Temporary browser scripts/screenshots must remain outside the repository.

## Concrete acceptance criteria

- [ ] Plans 01-03 are complete before this gate begins.
- [ ] Focused celebration and performance tests pass.
- [ ] All touched-surface regression suites pass.
- [ ] Full-suite result is recorded accurately, including the known unrelated baseline if present.
- [ ] Re-locked tests assert V2 relationships/invariants rather than mirroring emitted source or
      regenerated snapshots.
- [ ] Python validators pass.
- [ ] Desktop and phone required frames have no console/page errors.
- [ ] `2.6s` and `3.2s` prove the captain is moving before the protected curtain completes.
- [ ] `7.8s` proves a natural two-hand pickup; `10.6s` and `14.8s` prove carrier-oriented trophy/grip
      continuity through both travel headings.
- [ ] `19.6s` proves seven-player skin, hair-color/style, and facial-hair variation.
- [ ] `19.6s` and `21.2s` prove planted roots/trophy height and readable varied anticipation.
- [ ] `22.55s` proves the flare/confetti burst is already visible at the lift apex.
- [ ] `27.5s` and `29.2s` prove bounded flare relaunches continue through the hold and restore fade.
- [ ] Three country palettes remain readable.
- [ ] Actual dashboard cascade and split connector motion remain intact.
- [ ] Dashboard trophy continuously reaches the off-center plinth, crossfades under hands, and rotates
      with the carrier before both-arm IK.
- [ ] Replay uses the exact same canvas node.
- [ ] Skip, Escape, context loss, rerender, and completion clean up.
- [ ] Reduced motion avoids scene import.
- [ ] Celebration remains silent.
- [ ] DPR, crowd, confetti, and frame-allocation bounds remain intact.
- [ ] Trigger, vendor code, render fixtures, and landing ballpit are unchanged by V2.
- [ ] V1 brief/results/review remain preserved and link to V2.
- [ ] V2 `RESULTS.md` is complete and evidence-based.
- [ ] `Brief_5_V2_EXECUTION_REVIEW.HTML` contains all 13 sections and required interactions/theme.
- [ ] The V2 HTML works from `file://`, light/dark, desktop/mobile, with no external requests.
- [ ] Work remains local, uncommitted, unpublished, and undeployed.

## Completion rule

Do not declare V2 complete because the hero screenshot looks good. Declare it complete only when every
acceptance item above is evidenced and the task tracker has no open V2 work.
