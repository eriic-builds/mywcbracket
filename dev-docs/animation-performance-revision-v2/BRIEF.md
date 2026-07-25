# Animation performance revision V2 brief

Status: complete and release-authorized; strict active phone proxy budget remains unmet

Project phase: post-celebration client performance review, July 13, 2026.

## Goal

Keep the approved champion celebration and all existing dashboard motion while proving two
separate performance contracts:

1. Before its fourth valid activation, the hidden celebration adds no meaningful scene,
   canvas, WebGL, animation-frame, or heavy-module work to the primary dashboard.
2. While active, the 30-second celebration stays responsive on the agreed lower-end mobile
   proxy without weakening the approved choreography, visual quality, continuous finale
   flares, lifecycle, or accessibility behavior.

The July 11
[animation performance revision](../animation-performance-revision/README.md) already
measured and corrected the landing ball pit, stat-card pointer tracking, progress fills, CSS
motion primitives, and passive trophy. This V2 package measures the champion celebration
added afterward. It does not reopen previously optimized surfaces without new trace evidence.

## Architecture contract

The app remains:

- a static GitHub Pages site;
- vanilla HTML, CSS, and ES modules;
- locally vendored Three.js revision 170;
- zero backend and zero server-side session;
- no build step;
- no new runtime or development dependency;
- no external asset, analytics, or measurement service;
- private by default, with existing browser-local persistence unchanged.

No plan may add a worker, framework, bundler, pre-render service, runtime CDN, storage key, or
background prebuild. The reward may be rich while active, but its hidden state may not tax
the primary dashboard.

## Supported targets and evidence limits

Target behavior is current evergreen desktop and mobile browsers.

Local automated evidence is bounded to the browser installed on this machine:

| Evidence | Local status |
| --- | --- |
| Microsoft Edge on Windows | Automated CDP traces and headed visual review |
| 1024x768 dashboard, DPR 1 | 4x and 6x CPU throttles |
| 1440x900 celebration, DPR 1 | 4x CPU throttle |
| 390x844 celebration, DPR 2 with renderer cap 1.5 | 6x CPU throttle |
| Chrome | Owner-run gate |
| Firefox | Owner-run gate |
| Safari and iOS | Owner-run gate |
| Physical lower-end Android | Owner-run gate |

Edge emulation and headless traces are controlled proxies. They do not prove physical-device
thermals, browser-compositor promotion, Safari behavior, or every mobile GPU.

## Performance budgets

- Direct dashboard interaction: p95 main-thread animation work at or below `16ms`.
- Sustained active celebration: p95 scene animation-frame callback at or below `16ms`.
- Long task gate: no sustained task over `50ms`.
- Cold activation: record one-time work over `50ms`; change it only when the headed visual
  review shows frame-zero jank.
- Hidden celebration before first activation:
  - zero celebration stage;
  - zero celebration canvas;
  - zero celebration WebGL context;
  - zero celebration RAF or frame update;
  - zero request for `champion-celebration.js`, scene, models, or effects;
  - the same result after a three-click near miss.

The `16ms` budget is intentionally stricter than "the sequence eventually completes." It
protects input response and visible motion on the throttled proxy.

## Approved behavior that must remain

- Landing ball pit lifecycle, touch behavior, Motion preference, and reduced motion.
- Team stat card, match facts, menus, overlays, progress fills, and themes.
- Passive and interactive trophy behavior.
- Four valid winner activations inside 2.5 seconds, mirrored layout only.
- Dynamic winner identity and existing local flag assets.
- Exact 30-second celebration timeline and 3.2-second bracket curtain.
- Current captain travel, pickup, trophy orientation, two-hand IK, team choreography,
  diverse cast, stadium, trophy, confetti, and continuous finale flares.
- One reusable celebration canvas and WebGL context across replay.
- Pause on hidden visibility, fallback behavior, context-loss behavior, Escape/Skip, focus
  handling, exact bracket restoration, silence, and deterministic time.

## Technical corrections

1. `transform` and `opacity` are compositor-eligible, not guaranteed GPU promotion.
2. A WebGL scene can avoid DOM Layout and still miss the frame budget through JavaScript,
   matrix updates, draw submission, shadow work, raster, or GPU cost.
3. A frame-rate cap is useful only when logical time remains correct and the omitted work is
   genuinely skipped.
4. Hidden work and active work are different products. A lazy import proves only network
   isolation; stage, context, RAF, and replay lifetime must also be measured.
5. Cold construction and steady-state frame work must not be averaged together.
6. A single long task may be user-visible even when mean frame time looks acceptable.
7. Measurement code may observe the app but may not become a shipped dependency.

## Final measured outcome

The completed revision proves the hidden-feature contract and reduces repeated active renderer
submission without changing approved scene content:

| Metric | Baseline | Final |
| --- | ---: | ---: |
| Player/scene meshes | 667 | 342 |
| Renderer calls | about 626 | 303 |
| Shadow participants | 659 | 257 |
| Submitted triangles | 891,386 | 892,858 |

Matched carry and hold/restore windows improved substantially. The post-council full-matrix
phone-peak run recorded `78.617ms` p95, while three isolated fresh-browser repeats recorded
`78.516ms`, `85.905ms`, and `77.003ms`. Two focused attribution repeats recorded
`69.262ms` and `75.374ms`; bypassing only `renderer.render()` recorded `12.865ms` and
`13.315ms`. A broader attribution pass produced a `118.413ms` outlier and is retained in the
results rather than hidden.

The evidence therefore supports two different conclusions:

1. The dormant dashboard, lifecycle, and bounded JavaScript scene work pass their contracts.
2. Renderer submission for the approved approximately `893k`-triangle scene still exceeds the
   strict `16ms` p95 target on the 6x CPU phone proxy.

The revision does not weaken the budget, hide the outlier, or claim unsupported browser/device
coverage. See [RESULTS.md](RESULTS.md) for raw evidence and release interpretation.

## Current source inventory

### Primary dashboard boundary

| Surface | Current ownership | Expected hidden cost |
| --- | --- | --- |
| Celebration stylesheet | `docs/index.html` | 7,209 raw bytes loaded globally |
| Activation state machine | `docs/js/champion-celebration-trigger.js` | 3,208 raw bytes and four delegated listeners |
| Heavy controller import | `docs/js/main.js` | lazy after fourth valid activation |
| Stage/canvas/context | `docs/js/champion-celebration.js` | none before activation |

### Active celebration

| Work | Current behavior |
| --- | --- |
| Controller | One display-rate RAF for the 30-second logical clock |
| Renderer | DPR capped at 1.5; PCF soft shadows |
| Crowd | 480 desktop / 260 phone instances |
| Confetti | 384 desktop / 192 phone instances |
| Flares | 12 reused instanced comets, cycling every two seconds through teardown |
| Players | Seven detailed independent rigs, two-arm IK, diverse appearance |
| Scene | Stadium, field, flag, lighting, shadows, camera, trophy, effects |

Existing source guards already reject layout reads, random generation, and resource
construction inside the celebration frame path. Browser evidence is still required because
source shape alone cannot prove the runtime budget.

## Ranked plan set

| Rank | Plan | Leverage | Decision |
| ---: | --- | ---: | --- |
| 1 | [Measure hidden and active cost](plans/PLAN-01-measure-hidden-and-active-cost.md) | 10.0/10 | Always run first |
| 2 | [Isolate the primary dashboard](plans/PLAN-02-isolate-primary-dashboard.md) | 9.8/10 | Change runtime only if dormant evidence fails |
| 3 | [Bound active frame cost](plans/PLAN-03-bound-active-frame-cost.md) | 9.4/10 | Change runtime only for a measured sustained miss |
| 4 | [Bound visible activation cost](plans/PLAN-04-bound-activation-cost.md) | 8.7/10 | Change runtime only for measured and visible cold jank |
| 5 | [Prove performance V2](plans/PLAN-05-prove-performance-v2.md) | 8.5/10 | Always run last |

## Which plan to do first

Start with
[PLAN-01-measure-hidden-and-active-cost.md](plans/PLAN-01-measure-hidden-and-active-cost.md).

Do not begin by lowering particle counts, deleting shadows, or moving files. The baseline is
the decision boundary. Plans 02 through 04 explicitly collapse to verification-only when
their matched gate is green.

## Execution order

Run the plans sequentially because Plans 02 through 04 can overlap in the controller, scene,
tests, and browser evidence.

```text
PLAN-01 matched baseline
        |
PLAN-02 dormant dashboard isolation, if measured
        |
PLAN-03 active steady-state budget, if measured
        |
PLAN-04 visible cold-start budget, if measured
        |
PLAN-05 integrated tests, matched traces, report
```

## Technical Taste Council decision

- **Russinovich:** instrument the actual lifecycle and separate dormant, cold, steady, peak,
  hidden, and replay cost before editing.
- **Karpathy:** use the smallest named constants and branches that remove proven work; do not
  invent an animation framework.
- **Naval:** preserve the emotionally valuable reward while keeping its dormant cost near
  zero.
- **Willison / Hamel:** raw Edge numbers prove only the matched Edge runs. Record unsupported
  browser and device gates as not run.
- **Sean Grove / Yegge:** five sequential plans are easier to review and execute than a
  cross-cutting performance rewrite.
- **Litt / Hanselman:** lifecycle and cadence rules must be obvious in vanilla JavaScript and
  searchable by name.
- **Context Engineering:** load only the active plan and its exact candidate files.

## Test and baseline rule

The Windows checkout has one accepted pre-existing full-suite failure:
`tests/landing-ballpit.mjs` uses an LF-sensitive source extractor against a CRLF file.

Do not edit that test in this work. Every focused and otherwise unaffected suite must pass.
An LF environment remains the full-suite authority.

## Deliverables

- This brief.
- A measured `BASELINE.md`.
- Five ranked standalone execution plans.
- Focused source and lifecycle guards for changed hot paths.
- `RESULTS.md` with raw matched before/after values.
- A self-contained no-build report at
  `dev-docs/dev-reports/animation-performance-revision-v2/index.html`.

## Acceptance gate

- Approved dashboard and celebration behavior remains correct.
- No new dependency, build step, storage key, privacy behavior, or architecture.
- No heavy celebration runtime exists before the fourth valid activation.
- Three clicks remain a dormant near miss.
- Hidden celebration intervals perform no useful scene frame, Layout, or Paint work.
- Responsive or destroyed scenes release the resources they replace, while replay reuses one
  intended canvas/context.
- Measured direct interactions and sustained celebration work meet the agreed local proxy
  budgets, or the report blocks release and states the remaining cost honestly.
- Existing tests, reduced-motion checks, lifecycle checks, and matched browser scenarios are
  recorded.
- Work remained local, uncommitted, unpublished, and undeployed until owner approval; that approval
  was granted for this release's commit and main-branch push.
