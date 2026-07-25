# PLAN: Integrated release gate

**Rank: 7 of 7. Run last.**

**Council call:** Willison/Hamel treat every implementation claim as untrusted until measured.
Yegge makes the handoff reviewable instead of hiding failures inside last-minute fixes. Hanselman
requires the final evidence to tell the next engineer what was checked and what remains uncertain.

## Goal

Prove all six implementation increments work together, preserve the static/no-build dashboard,
meet the full browser and production verification contract, release every resource across failure
paths and replay, and leave an auditable local result package for user review.

This plan is a gate and evidence pass. Do not hide a failure by making unrelated runtime edits here.
Route each defect back to the plan/file that owns it, rerun that plan's focused acceptance, then
return to this gate.

## Exact files to touch

- `tests/champion-celebration.mjs` - complete deterministic behavior and source guard suite.
- `tests/matchcards.mjs` - final mirrored-only trigger and champion identity assertions.
- `tests/animation-performance.mjs` - final lifecycle/performance source guards.
- `package.json` - confirm the focused celebration test remains in the full suite.
- `tests/fixtures/map-sections.frozen.json` - only if Plan 01's already-reviewed trigger attribute
  fixture was not finalized.
- `tests/fixtures/golden-sections.json` - only if Plan 01's already-reviewed trigger attribute
  fixture was not finalized.
- `dev-docs/[05]-champion-celebration/RESULTS.md` - **new** measured implementation and browser evidence.
- `dev-docs/[05]-champion-celebration/README.md` - mark execution complete only after every gate passes
  and link the result.

Do not edit runtime code, the standalone mock, vendor files, generated live data, or workflows in
this plan unless a failed gate is explicitly routed back to its owning plan.

## Step-by-step implementation order

1. Read the brief, baseline, all seven plans, current diff, and Technical Taste Council. Run:

   ```bash
   git status --short
   git diff --name-only
   ```

   Confirm every runtime/test change belongs to Plans 01-06 and the original brief/mock artifacts
   remain preserved.
2. Verify architecture invariants from source:
   - GitHub Pages from `docs/`.
   - Vanilla HTML/CSS/ES modules.
   - No build step or runtime package dependency.
   - Local Three.js and bundled flags only.
   - One celebration canvas at a time.
   - No sound control, audio module, Web Audio construction, account, analytics, API write, remote
     model/texture/font/script/media, or player likeness.
3. Complete deterministic `tests/champion-celebration.mjs` coverage:
   - Four-activation rolling window, exact 2500ms boundary, paced 2400ms trigger, reset, and invalid
     timestamp handling.
   - Active mirrored champion selection and Sideways rejection.
   - Actual-before/after-M104 versus My-picks identity.
   - Separate celebration generation and stale import rejection.
   - Duplicate start rejection during import and playback.
   - Every timeline boundary, 30s finish, hidden pause/resume, and capped visible delta.
   - Trophy capture path, suspension/release, named grip anchors, stable world-space carrier,
     two-arm targeting, reachable lift, and handoff instant.
   - Six teammates plus captain, shared stage heights, two fake pumps, one jump.
   - Shared 3.2-second center-out curtain, card/connector-half tagging and staggering, scene-ready
     ordering, bounded player segments, pitch/banner generation, and timed plinth dismissal.
   - Effect bounds, instancing, segmented flag, reduced motion, init failure, context loss, and
     fallback timer pause.
   - The silence contract: no sound control/module, audio cue API, or Web Audio construction.
4. Complete source/performance guards:
   - Celebration modules import only local Three.js/assets.
   - One renderer/canvas.
   - DPR, crowd, and confetti limits.
   - `InstancedMesh` for crowd/confetti.
   - No layout reads, `Math.random()`, arrays, geometry/material/texture construction, or image loads
     in frame/update functions.
   - Context loss, visibility, resize, reduced motion, skip, destroy, and generation invalidation are
     explicit.
   - All RAFs, timers, observers, listeners, animations, WebGL resources, and generated textures have
     teardown paths.
5. Re-run byte-lock workflow:
   - Run `node tests/map-frozen.mjs` and `node tests/golden.mjs` before any update.
   - If they fail beyond Plan 01's already-reviewed mirrored trigger attribute, stop and route the
     regression to the owning plan.
   - Never regenerate from live `docs/data/results.json`.
   - Review every fixture diff; Sideways and non-bracket sections remain unchanged.
6. Run focused tests:

   ```bash
   node tests/champion-celebration.mjs
   node tests/matchcards.mjs
   node tests/animation-performance.mjs
   node tests/map-frozen.mjs
   node tests/golden.mjs
   ```

7. Run the full repository gates:

   ```bash
   npm test
   python scripts/validate_results.py
   python scripts/validate_match_details.py
   python tests/match_details.py
   ```

8. Start the no-build server:

   ```bash
   python -m http.server 8000 --directory docs
   ```

   Use fresh Chrome/Edge profiles so stored layout, Motion, picks, themes, and rivals do not
   contaminate scenarios.
9. Generate six temporary valid review brackets outside the repository:
   - England, France, Spain, Argentina, Switzerland, and Germany.
   - Use existing `deriveStructure`, `teamsFor`, and `buildPicks` helpers.
   - Iterate matches in tournament order; when the target team is present, choose it, otherwise
     choose the first valid team.
   - Import each generated JSON through the real app.
   - Delete temporary review files after evidence capture.
10. Browser trigger matrix:
    - Mirrored Actual and My picks.
    - Pre-M104 user champion.
    - Post-M104 Actual real champion using a temporary DevTools Local Override for
      `data/results.json`; disable the override afterward and confirm no tracked file changed.
    - Click, touch/tap, Enter, Space.
    - Paced 2400ms activation.
    - Repeated key suppression.
    - Sideways inert.
    - Edge/Chrome selection UI does not appear.
11. Browser lifecycle matrix:
    - Normal dashboard.
    - Map-expanded launch and exact restoration.
    - Resize/orientation during opening, carry, payoff, and hold.
    - Hidden tab for at least 10 seconds, then resume with no timeline jump.
    - Skip while scene import is pending.
    - Skip during opening, trophy approach, carry, jump, and final hold.
    - Home/dashboard rerender during pending import and playback.
    - Replay after Skip and full completion.
    - Reduced motion.
    - WebGL initialization failure.
    - Real context loss, tested last.
12. Visual/art review for every required country:
    - Country palette and local flag.
    - Trophy continuity.
    - Center-out bracket cascade at approximately `0.35s`, `1.0s`, `1.85s`, and `2.8s`.
    - Connector halves remain attached to their moving cards and restore cleanly.
    - Plinth/stadium/banner reveal during bracket dissolve.
    - Cleared hold.
    - Centered rear-to-front captain entry, direct viewer acknowledgment, readable right-arm `C`.
    - Trophy focus and measured forward approach.
    - Grab/carry with both hands on named grips and symmetric team reveal from depth.
    - Empty plinth is gone by `10.3s`.
    - Viewer-facing join.
    - Two slow fake pumps.
    - One physically reachable full lift and synchronized jump with continuous two-hand contact.
    - Flag/crowd/light/confetti sequence.
    - Strong full final hold with readable `2026 WORLD CUP CHAMPIONS` and country text.
    - Desktop and 390x844 frontal framing with camera, tunnel, trophy, plinth, team, flag, and banner
      on one centerline.
13. Performance/resource evidence:
    - Record one desktop and one 390x844 4x-CPU-throttled Performance trace.
    - Record long tasks over 50ms, main-thread frame cost, rendered frame stability, and GPU/canvas
      count.
    - Confirm no layout event repeats from celebration frame code.
    - Confirm only one celebration RAF runs.
    - Confirm hidden/closed state has zero celebration RAF work.
    - Run five full completions and five early skips while monitoring attached canvas count, stable
      singleton canvas/context identity, listeners, timers, and heap trend.
    - Bound claims to the measured browsers/devices; do not call emulation proof for all phones.
14. Network/privacy evidence:
    - Clear DevTools network, activate celebration, complete, and replay.
    - Requests may include only the existing app's same-origin static files/data and bundled flag.
    - No analytics, remote asset, media request, API write, or social network write.
15. Write `RESULTS.md`:
    - ELI5 outcome.
    - Exact runtime/test files changed by each plan.
    - Test command results.
    - Fixture diff review.
    - Browser/device matrix.
    - Performance/resource measurements.
    - Visual hero-frame checklist.
    - Silence-contract evidence.
    - Failure/fallback evidence.
    - Remaining measured uncertainty or blocked acceptance.
    - Clear statement that no commit, push, PR, or deploy occurred unless separately approved.
16. Update `README.md` to `Status: complete` only if every acceptance criterion passes. Link all
    seven plans and `RESULTS.md`. For any implementation/test failure, leave status
    `implementation in progress`.
17. Stop at local review. Do not commit, push, deploy, or start a cloud-agent task without separate
    approval.

## Edge cases a weaker model will miss

- The production app reads live results, while tests use frozen results. Use a temporary browser
  override for post-M104 review; never rewrite tracked/generated live data for evidence.
- A regenerated passing fixture can still encode an unintended Sideways or team-identity regression.
- Chrome mobile emulation is not physical low-end hardware; label evidence accurately.
- DevTools itself adds overhead. Use the same setup for compared traces.
- Test context loss last; it intentionally makes that scene controller unusable.
- Five replays must include both full completion and early Skip because leak paths differ.
- Canvas count alone does not prove no leak; inspect WebGL contexts, listeners, timers, and heap
  trend.
- The intended post-close WebGL baseline is one detached singleton canvas/context, not zero contexts.
  Fail the gate if replay changes identity or context count grows.
- Hidden-tab testing must span phase boundaries to prove no catch-up.
- A static source guard cannot approve acknowledgment readability, two-hand contact, centerline
  alignment, or phone framing.
- A source guard also cannot prove connector halves visually track cards, the banner survives flag
  overlap, or the empty plinth is absent from the carry shot.
- The product Motion toggle controls landing balls only. Do not use it as the celebration
  reduced-motion gate.
- Existing live-data requests are same-origin and expected. The prohibition is new external or
  write traffic.
- Temporary review brackets and DevTools overrides must leave no tracked artifact.
- Do not "fix" a failing gate by weakening the assertion or silently updating the fixture.

## Concrete acceptance criteria

- Every focused test, full `npm test`, and relevant Python validator passes.
- Frozen output changes are limited to the reviewed mirrored trigger attribute.
- All brief trigger, identity, timing, choreography, visual, accessibility, lifecycle,
  fallback, performance, privacy, and restoration requirements have explicit passing evidence.
- Exact review frames prove the card/line curtain at `0.35s`, `1.0s`, `1.85s`, and `2.8s`, plus the
  world/carry/lift/hero composition at `3.2s`, `10.8s`, `18.8s`, and `22.8s` on desktop and the final
  hero at 390x844.
- The final scene uses bounded 24/32/10 player body/head/cap segment profiles, a generated pitch, a
  generated champions banner, and a plinth that is hidden after the grab.
- The final scene uses a centered frontal camera, rear-to-front captain staging, named trophy grip
  anchors, a reachable `3.68` lift target, and deterministic two-arm targeting.
- Required six-country, desktop/phone, pre/post-M104, input, map-expanded, resize, hidden, replay,
  Skip, reduced-motion, initialization-failure, and real-context-loss reviews pass.
- One stage, one attached celebration canvas, one renderer, and one RAF exist during playback. After
  close, stage/renderer/RAF reach zero, the singleton canvas is detached, and canvas/context identity
  remains stable for replay.
- Five full runs and five early skips show no accumulating resource count or meaningful heap trend.
- No repeated layout read occurs in the frame path and no unbounded DPR/instance count exists.
- No sound control, audio module, Web Audio construction, external request, dependency, backend,
  account, analytics, model, texture, font, script, media file, or player likeness is introduced.
- `RESULTS.md` records measured evidence and uncertainty honestly.
- `README.md` links the complete ranked plan set and result.
- The feature remains local and uncommitted until the user separately approves commit/push/deploy.
