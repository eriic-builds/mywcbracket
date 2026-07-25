# Animation performance revision V2 baseline

Recorded: July 13, 2026

Status: measured; runtime optimization required

## ELI5 summary

The hidden celebration is not secretly running behind the dashboard. Before the fourth valid
winner click, Edge loaded only the small trigger and stylesheet: no heavy scene files, modal,
celebration canvas, WebGL context, or celebration animation frame appeared. Three clicks did
nothing expensive.

The active celebration is the opposite. On the throttled phone proxy, a single scene frame
usually occupied roughly `77-104ms` and reached `136ms` p95 during the effects peak. That is
far above the `16ms` target, so the browser could render only a fraction of the intended
frames and the logical cutscene clock advanced slowly. The approved visuals can stay, but
the scene must perform much less repeated work.

## Baseline verdict

| Plan | Decision | Evidence |
| --- | --- | --- |
| Plan 02: dormant dashboard isolation | **Verification-only** | Idle and three-click traces had zero heavy requests, stage, celebration canvas, or celebration RAF. |
| Plan 03: active frame budget | **Required** | Every carry, peak, and hold window failed p95 and long-task gates. |
| Plan 04: cold activation | **Investigation required** | First activation contained a `1.91-2.01s` main-thread task; runtime change still requires headed proof of visible jank. |
| Plan 05: integrated gate | **Required after bounded changes** | Matched before/after traces, tests, visual review, and report remain outstanding. |

Do not lazy-load the celebration CSS or complicate the trigger. The measured dormant contract
already passes, and the primary problem is active scene work.

## Environment

| Field | Value |
| --- | --- |
| Commit | `80f365cf686f06c7ca4ca0320ae59291063f82d6` |
| Branch | `main` |
| Repository state | Existing local champion-celebration work was modified/untracked; no baseline runtime file was edited |
| Operating system | Windows 11 Enterprise, `Windows_NT 10.0.26200 x64` |
| CPU | AMD Ryzen AI 7 PRO 350 with Radeon 860M, 16 logical CPUs |
| Memory | 59.75GB |
| Node | `v24.18.0` |
| Edge | `150.0.4078.65` |
| Graphics | ANGLE D3D11 on AMD Radeon 860M |
| Browser mode | Headless Edge, fresh Playwright context per scenario |
| Server | `http://127.0.0.1:4173/` |
| Motion | on; `prefers-reduced-motion: no-preference` |
| Theme | light |
| Trace | CDP timeline, frame, user timing, compositor, viz, and GPU categories |

### Controlled conditions

- Dashboard: `1024x768`, DPR 1, 4x and 6x CPU throttle.
- Desktop celebration: `1440x900`, DPR 1, 4x CPU throttle.
- Phone celebration: `390x844`, browser DPR 2, renderer canvas `585x1266`, proving
  the existing DPR cap of 1.5, at 6x CPU throttle.
- Each scenario used a fresh browser context.
- Active logical windows used the standalone review surface, which imports and runs the
  production scene, models, effects, and timeline. Its timeline UI adds small Layout/Paint
  work; all before/after comparisons must use the same harness.

## Measurement method

The session-only runner recorded:

- CDP `FireAnimationFrame`, `RunTask`, Layout, style, Paint, raster, GPU, and frame events;
- Long Tasks API entries;
- resource timing and network requests;
- stage/canvas/context creation and loss;
- fixed wall-time active windows and final logical time;
- a marked five-second synthetic hidden interval;
- forced-GC heap snapshots before and after replay x3.

Raw evidence is under:

```text
<Copilot session>/files/[07]-animation-performance-revision-v2/
  baseline-2026-07-13T18-33-21-726Z/
```

The directory contains:

- `environment.json`
- `summary.json`
- `summary.csv`
- one `<scenario>.summary.json` per row below
- one `<scenario>.trace.json.gz` per row below
- replay `*.heapsnapshot.gz`
- scenario screenshots

No raw trace, browser profile, or measurement dependency was added to the repository.

## Primary dashboard evidence

`Task max` includes cold navigation and scripted click tasks. `RAF p95` isolates measured
animation-frame callbacks. The normal-interaction long tasks require attribution, but they
are not celebration work because no heavy celebration resource or stage existed.

| Scenario | RAF p95 | Task max | Tasks >50ms | Heavy celebration requests | Stage / celebration canvas | Result |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Cold 4x | 7.781ms | 1090.103ms | 9 | 0 | 0 / 0 | Animation callback passes; cold page load separated |
| Dormant idle 4x | 0ms | 2.617ms | 0 | 0 | 0 / 0 | Pass |
| Three-click near miss 4x | 0ms | 5.892ms | 0 | 0 | 0 / 0 | Pass |
| Normal interactions 4x | 2.646ms | 68.230ms | 2 | 0 | 0 / 0 | RAF passes; task attribution pending |
| Cold 6x | 14.104ms | 1795.851ms | 12 | 0 | 0 / 0 | Animation callback passes; cold page load separated |
| Dormant idle 6x | 0ms | 4.805ms | 0 | 0 | 0 / 0 | Pass |
| Three-click near miss 6x | 0ms | 9.395ms | 0 | 0 | 0 / 0 | Pass |
| Normal interactions 6x | 4.224ms | 118.988ms | 8 | 0 | 0 / 0 | RAF passes; task attribution pending |

### Dormant network and runtime proof

Before activation, the dashboard requested only:

- `docs/css/champion-celebration.css`: 7,209 raw bytes;
- `docs/js/champion-celebration-trigger.js`: 3,208 raw bytes.

It did not request:

- `champion-celebration.js`;
- `champion-celebration-timeline.js`;
- `champion-celebration-scene.js`;
- `champion-celebration-models.js`;
- `champion-celebration-effects.js`.

The heavy files total 152,199 raw bytes and remained absent through the three-click near miss.
No celebration stage, celebration canvas, celebration WebGL context, or celebration RAF was
created.

This is the primary product decision: Plan 02 must not add an asynchronous CSS loader or
trigger framework to optimize a dormant boundary that already passes.

## Cold activation evidence

All five heavy modules loaded only after the fourth valid activation. Resource Timing recorded
164,716 transferred bytes for all celebration-named resources, including the already loaded
stylesheet and trigger.

| Scenario | RAF p50 | RAF p95 | RAF max | Task max | Tasks >50ms | Layout / Paint | GPU task total |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Desktop 4x | 24.365ms | 34.404ms | 964.109ms | 2009.028ms | 9 | 37.370 / 11.790ms | 2336.272ms |
| Phone 6x | 44.621ms | 105.389ms | 114.389ms | 1906.135ms | 50 | 18.889 / 12.339ms | 338.593ms |

The one-time construction task is large enough to investigate. Plan 04 may edit construction
only if a headed run shows visible frame-zero or opening-curtain jank. It may not prebuild the
scene while dormant.

## Active steady-state evidence

Every active window fails. `Final logical time` shows how far the deterministic clock advanced
inside the fixed wall window; the `0.1s` maximum clock delta prevents a giant jump after a
slow frame, so sustained slow frames lengthen the perceived sequence.

| Scenario | RAF p50 | RAF p95 | RAF max | Tasks >50ms | Layout / Paint | GPU total | Final logical time |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| Carry desktop 4x, 5s wall | 53.865ms | 81.970ms | 105.302ms | 71 | 165.802 / 168.085ms | 545.855ms | 12.8s from 9.2s |
| Carry phone 6x, 5s wall | 76.508ms | 115.162ms | 127.791ms | 52 | 198.573 / 208.372ms | 360.452ms | 11.7s from 9.2s |
| Peak desktop 4x, 5s wall | 51.063ms | 87.421ms | 111.485ms | 75 | 148.279 / 148.823ms | 573.203ms | 24.9s from 21.2s |
| Peak phone 6x, 5s wall | 89.174ms | 136.386ms | 147.103ms | 44 | 162.021 / 183.485ms | 343.174ms | 23.4s from 21.2s |
| Hold/restore desktop 4x, 4s wall | 51.908ms | 82.892ms | 89.128ms | 55 | 114.778 / 126.989ms | 414.376ms | 28.9s from 26.2s |
| Hold/restore phone 6x, 4s wall | 104.451ms | 149.438ms | 185.243ms | 31 | 126.531 / 138.878ms | 259.225ms | 27.7s from 26.2s |

The callback itself is the dominant failure. The review UI explains some Layout/Paint, but it
does not explain `82-149ms` scene callbacks. Plan 03 is required.

## Source-level attribution targets

These are candidate hot paths confirmed by source inventory, not yet percentage claims:

1. `renderFrame()` resets all seven rigs, updates every animation branch, solves both captain
   arms, updates the scene graph, and renders every display RAF.
2. Phone crowd work performs four matrix writes per supporter: 260 bodies, 260 heads, and
   520 arms, for 1,040 `setMatrixAt()` calls plus matrix composition every scene frame.
3. Desktop crowd work performs 1,920 matrix writes per scene frame.
4. Phone peak adds 192 confetti matrices and 12 flare matrices each frame.
5. Captain grip solving performs a full scene world-matrix update, trophy world update, and
   repeated captain world updates for two-arm IK.
6. Seven high-fidelity rigs and stadium meshes cast/receive PCF soft shadows.
7. The renderer submits a full DPR-1.5 phone image even during the mostly static final hold.

The next step is a CPU/profile and bounded feature-toggle attribution pass. Do not reduce
counts or visual quality before that evidence.

## Hidden visibility evidence

The browser automation protocol did not expose native page-visibility emulation. The runner
therefore overrode `document.hidden` and `visibilityState` only inside the measurement
context, dispatched the production `visibilitychange` event, and marked the interval.

| Hidden interval | Value |
| --- | ---: |
| Duration | 5011.538ms |
| Celebration RAF callbacks | 0 |
| Layout events | 0 |
| Paint events | 0 |
| Main-thread task max | 4.860ms |

Logical time resumed at 21.8s after starting at 21.2s and allowing 0.7s visible after the
pause. The lifecycle rule passes: the scene does no useful frame, Layout, or Paint work while
hidden.

This proves controller response to the visibility contract, not operating-system tab
scheduling on every target browser.

## Replay and lifetime evidence

| Scenario | Celebration/total WebGL checkpoints | Total context checkpoints | Heap node delta | Detached-node delta | Detached bytes |
| --- | --- | --- | ---: | ---: | ---: |
| Desktop 4x replay x3 | `1, 1, 1` | `6, 9, 12` | +32,104 | +20 | +3,608 |
| Phone 6x replay x3 | total WebGL `2, 2, 2` | `15, 18, 21` | +21,058 | +20 | +3,608 |

Interpretation:

- The intended celebration WebGL context count stays stable across all three cycles.
- No celebration stage or celebration canvas remains connected after Skip.
- Three new 2D construction contexts appear per replay. They are cold-scene texture work,
  not extra WebGL renderers.
- The forced-GC snapshot contains one detached celebration-stage element set (+20 nodes), not
  evidence of three accumulating stages. Plan 05 must repeat lifetime checks after any
  construction or teardown change.
- Replay emitted four Edge WebGL warnings about `texImage3D` flip/premultiply flags in each
  replay scenario. They did not abort playback but must be recorded and rechecked.

Heap snapshots are inspector evidence and can retain tooling objects. WebGL and connected-DOM
counts are the stronger lifecycle signals.

## Ranked measured costs

1. **Sustained full-scene frame callback** - `81.970-149.438ms` p95 across active windows.
2. **Cold scene construction** - `1.906-2.009s` maximum main-thread task.
3. **Replay construction churn** - three additional 2D contexts per cycle, while WebGL stays
   stable.
4. **Normal dashboard scripted long tasks** - animation callback p95 passes, but task max
   reaches `118.988ms`; attribution is required before reopening prior optimized surfaces.
5. **Dormant celebration boundary** - measured pass and not a bottleneck.

## Technical Taste Council decision

- Preserve the simple trigger and global stylesheet because the hidden runtime gate passes.
- Profile the active callback before editing.
- Prefer removing repeated work over reducing approved scene content.
- Test phone shadows and DPR only after CPU attribution.
- Keep one logical clock; cadence changes may skip bounded scene work but may not distort
  completion, replay, hidden resume, or flare timing.
- Treat cold activation separately and optimize it only when headed review confirms visible
  jank.

## Test baseline

Focused champion-celebration and animation-performance suites were green before this V2
runtime work. The full Windows suite retains the accepted pre-existing
`tests/landing-ballpit.mjs` CRLF-sensitive source-extraction failure. This package does not
edit that test.

## Limits

- Edge is the only locally installed browser.
- CPU throttling and headless traces are proxies.
- The standalone review timeline adds some DOM work.
- GPU event totals are trace signals, not physical power or thermal measurements.
- Transform usage does not prove compositor promotion.
- Chrome, Firefox, Safari/iOS, and physical Android remain owner-run gates.
