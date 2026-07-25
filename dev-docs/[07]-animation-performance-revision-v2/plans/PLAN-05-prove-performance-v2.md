# PLAN: Prove the integrated V2 performance gate

**Rank: 5 of 5. Leverage: 8.5/10. Run last.**

## Execution result

Complete locally.

- Matched dormant, cold, carry, peak, hold/restore, hidden, replay, and attribution evidence
  is recorded in `BASELINE.md` and `RESULTS.md`.
- Current dashboard, replay, reduced-motion, fallback, context-loss, exact-restoration, and
  desktop/phone keyframe checks pass.
- Focused and unaffected tests pass; full `npm test` retains only the accepted unrelated
  Windows CRLF-sensitive landing-ballpit extractor failure.
- The self-contained report is available at
  `dev-docs/[00]-dev-reports/[07]-animation-performance-revision-v2/index.html`.
- Claude Opus 4.8 returned **APPROVE**. Its two bounded follow-ups were applied: the duplicate
  shoulder-alignment call was removed and rigid batching gained a behavior-level geometry,
  normal, color, index, and disposal test.
- Chrome, Firefox, Safari/iOS, and physical lower-end Android remain explicitly not run.
- The strict 6x phone active-scene budget remains red. This blocks a claim of budget
  compliance, not the verified behavior/lifecycle handoff.
- Work remains local, uncommitted, unpublished, and undeployed.

## Goal

Repeat the exact baseline after all required bounded changes, prove preserved behavior, and
publish an honest local engineering/learning report. Do not hide a failed gate with unrelated
runtime edits inside this plan; route it back to the owning plan.

## Exact files to touch

- `dev-docs/[07]-animation-performance-revision-v2/RESULTS.md`
- `dev-docs/[07]-animation-performance-revision-v2/README.md`
- `dev-docs/PROJECT-HISTORY.md`
- `dev-docs/README.md`
- `dev-docs/[00]-dev-reports/[07]-animation-performance-revision-v2/index.html`
- focused tests already owned by Plans 02 through 04

No new production source should be introduced here.

## Observation

Performance changes are easy to overclaim when the before/after browser, viewport, throttle,
window, cache, or interaction differs. The repository also has one known Windows-only CRLF
test-harness failure that must not obscure new regressions.

## Step-by-step implementation order

1. Read:
   - `BRIEF.md`
   - `BASELINE.md`
   - all five plans
   - current diff
2. Verify the changed runtime/test files are limited to the measured branches selected by
   Plans 02 through 04.
3. Run focused suites:
   ```powershell
   node tests/animation-performance.mjs
   node tests/champion-celebration.mjs
   node tests/production-regressions.mjs
   node tests/matchcards.mjs
   node tests/map-frozen.mjs
   ```
4. Run the existing full suite with `npm test`.
5. Accept only the exact known Windows CRLF-sensitive `landing-ballpit.mjs` extraction
   failure. Any other failure blocks completion.
6. Repeat every Plan 01 Edge scenario with the same runner, viewport, DPR, throttle,
   recording action, wall window, and headless mode.
7. Compare raw values:
   - dormant resource/stage/context/RAF;
   - callback p50/p95/max;
   - task p95/max and count over `50ms`;
   - Layout, Paint, raster, GPU;
   - logical time reached;
   - hidden interval work;
   - replay heap/context lifetime;
   - cold activation separately from steady state.
8. Run headed browser behavior:
   - dashboard normal interactions;
   - full celebration desktop and phone;
   - reduced motion;
   - hidden resume;
   - replay;
   - fallback;
   - context loss;
   - exact restore;
   - 22.55s, 27.5s, and 29.2s keyframes.
9. Re-run source/smoke guards for the July 11 optimized surfaces. Reopen them only if a fresh
   trace proves a regression.
10. Record Chrome, Firefox, Safari/iOS, and physical Android as pass, fail, or not run. Do not
    infer them from Edge.
11. Write `RESULTS.md` with:
    - ELI5 result;
    - exact selected decisions for Plans 02 through 04;
    - raw before/after tables;
    - code changes and why they remove work;
    - visual/lifecycle evidence;
    - tests;
    - remaining cost and unsupported targets.
12. Build one self-contained no-build HTML report at
    `dev-docs/[00]-dev-reports/[07]-animation-performance-revision-v2/index.html`:
    - required Clawpilot theme variables;
    - no external requests;
    - responsive light/dark layout;
    - sidebar navigation;
    - collapsible sections;
    - raw metric tables;
    - architecture and lifecycle SVG diagrams;
    - plan reviews;
    - risks, alternatives, senior-engineer observations, ELI5 learning, and lessons.
13. Update the documentation indexes and project history.
14. Open the app and report locally for owner review.
15. Stop before commit, push, deployment, or publication.

## Reasoning

The final gate turns code-shape claims into a reproducible engineering result. It also teaches
why each optimization was selected or rejected, so a future engineer can avoid redoing the
same investigation.

## Tradeoffs

- Raw tables are less exciting than percentage cards but remain honest when conditions differ.
- The self-contained report duplicates selected evidence from Markdown so a new engineer can
  learn from one artifact.
- Unsupported browsers remain explicit owner work rather than false confidence.

## Edge cases a weaker model will miss

- Do not claim a percentage when trace conditions or browser versions differ.
- Compare fixed wall windows and report the final logical time reached; faster logical
  progress is itself evidence.
- Cold-start improvements may not change steady p95. Keep separate tables.
- A lower main-thread callback can coincide with worse raster/GPU cost.
- Synthetic hidden visibility proves lifecycle response, not operating-system tab scheduling.
- One retained celebration canvas/context after first use is intentional only if replay count
  stays stable and no frame loop survives teardown.
- Heap snapshots can retain inspector objects temporarily. Use forced GC and compare named
  detached nodes carefully.
- Do not edit the CRLF-sensitive landing-ballpit extractor to make the full suite look green.
- Report HTML must work from `file://`; module fetches or external Mermaid scripts violate the
  self-contained requirement.
- Do not publish local machine paths, private browser profiles, or raw user storage.

## Concrete acceptance criteria

- Approved dashboard and celebration behavior remains unchanged.
- Dormant celebration has zero heavy runtime work before activation.
- Dashboard interaction and active celebration meet the local proxy budgets, or the report
  clearly blocks release and names the remaining measured cost.
- Hidden interval has zero celebration RAF callback, Layout, and Paint work.
- Replay x3 uses one intended celebration WebGL context without cumulative stage/canvas leaks.
- No unapproved dependency, build step, storage key, privacy, or architecture change.
- Focused suites pass; full suite has no failure beyond the accepted Windows CRLF baseline.
- Every before/after comparison uses matched inputs and reports raw values.
- Unsupported browser/device gates are explicit.
- HTML works locally from `file://` in light/dark and desktop/mobile with no external request.
- App and report are opened locally.
- Nothing is committed, pushed, deployed, or published.

## Lessons learned

Performance work is complete only when lifecycle, visual fidelity, raw measurements, tests,
and architectural constraints all agree. A green source grep is not a runtime result, and a
fast trace is not permission to weaken the product.
