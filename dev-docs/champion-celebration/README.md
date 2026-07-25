# Champion celebration

Status: complete and release-authorized.

This package defines and records the hidden full-scale 3D soft-matte clay champion-box celebration for
the mirrored bracket table. The implementation is included in the July 13 celebration/performance
release. The experience is intentionally silent.

The untouched source brief remains at
[`../[05]-champion-celebration/BRIEF.md`](../%5B05%5D-champion-celebration/BRIEF.md). This package's
`BRIEF.md` is the revised, completed V1 contract.

The finished pass adds a scene-ready center-out card cascade with attached connector halves, a
centered straight-on clay stadium, a rear-to-front captain entrance, articulated avatar hands,
deterministic two-arm trophy contact, a smooth curved trophy, a generated
`2026 WORLD CUP CHAMPIONS` country banner, and an empty trophy plinth that disappears during the carry.

The Technical Taste Council review produced seven plans. Seven is the smallest reviewable split:
fewer plans would combine lifecycle, 3D construction, choreography, effects, and evidence
into an unsafe mega-task; more plans would split the same files without independent acceptance.

## Ranked execution order

1. [`PLAN-01-activation-and-lifecycle-spine.md`](plans/PLAN-01-activation-and-lifecycle-spine.md)
2. [`PLAN-02-trophy-continuity.md`](plans/PLAN-02-trophy-continuity.md)
3. [`PLAN-03-scene-runtime-and-country-identity.md`](plans/PLAN-03-scene-runtime-and-country-identity.md)
4. [`PLAN-04-stadium-and-player-rigs.md`](plans/PLAN-04-stadium-and-player-rigs.md)
5. [`PLAN-05-choreography-and-camera.md`](plans/PLAN-05-choreography-and-camera.md)
6. [`PLAN-06-payoff-effects-and-fallbacks.md`](plans/PLAN-06-payoff-effects-and-fallbacks.md)
7. [`PLAN-07-integrated-release-gate.md`](plans/PLAN-07-integrated-release-gate.md)

**Do Plan 01 first.** It proves the hidden trigger, active-bracket identity, lazy-import race
handling, accessibility isolation, and exact restoration before visual work creates sunk cost.

## Files

- [`BRIEF.md`](BRIEF.md) - product contract, choreography, constraints, and acceptance criteria.
- [`BASELINE.md`](BASELINE.md) - current bracket, trophy, flag, lifecycle, and test surfaces.
- [`plans/`](plans/) - seven ranked production execution contracts.
- [`RESULTS.md`](RESULTS.md) - implementation decisions, evidence, tradeoffs, and lessons.
- [`Brief_5_EXECUTION_REVIEW.HTML`](Brief_5_EXECUTION_REVIEW.HTML) - self-contained executive and
  engineering review artifact.
- [Interactive review](../dev-reports/champion-celebration/) - local controls for playing and
  scrubbing the production `createChampionScene()` renderer. The review surface no longer owns a
  duplicate camera, model, trophy, stadium, or choreography implementation.

## Local review

Open [`Brief_5_EXECUTION_REVIEW.HTML`](Brief_5_EXECUTION_REVIEW.HTML) directly in a browser for the
self-contained executive and engineering review.

To review the standalone choreography mock, from the repository root:

```powershell
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/dev-docs/dev-reports/champion-celebration/?scoutTheme=dark
```

To review the production feature, open the main dashboard, choose **Demo**, navigate to the mirrored
Bracket Table, and activate the visible champion country box four times within 2.5 seconds. The
interaction is intentionally undisclosed in the UI.

To force the production static fallback deterministically, open:

```text
http://127.0.0.1:8000/?mockCelebrationFallback=1
```

The standalone review is production-backed and publishes as an engineering report, not dashboard UI.
Separate owner approval authorizes this commit and main-branch push.
