# Animation performance baseline

## ELI5 summary
The site is not failing or freezing. Steady frame tasks are short. The browser is still doing
work it does not need to do:

- The soccer-ball scene keeps running at display speed after the pile looks settled.
- Moving the control ball repeatedly changes an invisible touch target's box measurements,
  which creates hundreds of Layout events.
- The trophy renders continuously while it passively rotates.
- Score-progress changes resize the fill and create repeated Layout events.

The highest-leverage fix is to let decorative scenes sleep or run at a bounded rate, then
move DOM helpers with transforms instead of changing their layout coordinates.

## Baseline status

| Item | Value |
| --- | --- |
| Git commit | `1e36cdd` |
| Branch | `main` |
| Existing unrelated change | `JOURNEY.html` modified before this revision |
| Full test suite | Passed before runtime edits |
| App URL | `http://localhost:8000/` |
| Chrome | 150.0.7871.115 |
| Edge | 150.0.4078.50 |
| OS | macOS / Darwin |
| Node | 26.3.0 |
| Python | 3.9.6 |
| Trace method | Automated Chrome DevTools Protocol, headless browser |
| Trace artifacts | 16 compressed traces, 439 MB, stored outside the repository |

## Method
Both browsers used a new temporary profile, so saved brackets, themes, and Motion settings
could not alter startup.

Scenarios used:
- 1440x900 desktop landing load, idle, and pointer sweep.
- 390x844 mobile emulation at 2x DPR and 4x CPU slowdown with passive motion and touch drag.
- 1024x768 dashboard at 4x CPU slowdown for stat-card tracking, score changes, and overlays.
- 1440x900 desktop trophy with passive rotation and pointer drag.

The script captured:
- DevTools timeline Layout, Paint, DrawFrame, and RAF events.
- Performance-domain Layout, style, script, and task deltas.
- Main-thread task durations and long tasks over 50ms.
- Maximum observed layer count.
- Canvas count and loaded animation modules.

### Important limitation
These are controlled headless traces on this Mac, not physical low-end Windows hardware.
Use them for before/after comparison under the same conditions. Final visual and interaction
checks still need headed Chrome and Edge.

Chrome and Edge can also choose different compositor paths. A transform remains
compositor-eligible, not guaranteed to run on a separate thread.

## Chrome baseline

| Scenario | Layout | Paint | RAF fired | Draw frames | Long tasks | p95 task | Max task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Landing load | 124 | 1,006 | 448 | 458 | 1 | 0.46ms | 66.03ms |
| Landing idle, 5s | 0 | 1,203 | 601 | 601 | 0 | 0.54ms | 3.49ms |
| Landing pointer, 4s | 585 | 1,747 | 582 | 582 | 0 | 0.48ms | 9.24ms |
| Landing mobile throttled | 440 | 1,791 | 699 | 699 | 0 | 0.39ms | 9.99ms |
| Dashboard hover throttled | 0 | 1,021 | 0 | 509 | 0 | 0.88ms | 11.87ms |
| Dashboard score progress | 50 | 417 | 0 | 169 | 0 | 0.88ms | 6.04ms |
| Dashboard overlays | 63 | 558 | 108 | 270 | 0 | 0.35ms | 15.51ms |
| Dashboard trophy | 0 | 1,097 | 360 | 392 | 0 | 0.74ms | 10.88ms |

## Edge baseline

| Scenario | Layout | Paint | RAF fired | Draw frames | Long tasks | p95 task | Max task |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Landing load | 115 | 516 | 220 | 230 | 17 | 0.38ms | 1,548.09ms |
| Landing idle, 5s | 0 | 1,202 | 601 | 601 | 0 | 0.46ms | 3.02ms |
| Landing pointer, 4s | 596 | 1,780 | 593 | 593 | 0 | 0.56ms | 9.27ms |
| Landing mobile throttled | 408 | 1,692 | 666 | 666 | 0 | 0.37ms | 2.70ms |
| Dashboard hover throttled | 0 | 1,026 | 0 | 513 | 0 | 0.89ms | 3.04ms |
| Dashboard score progress | 49 | 412 | 0 | 168 | 0 | 0.92ms | 18.76ms |
| Dashboard overlays | 63 | 565 | 108 | 262 | 1 | 0.34ms | 92.59ms |
| Dashboard trophy | 0 | 1,082 | 361 | 392 | 0 | 0.83ms | 5.50ms |

The Edge landing-load long tasks are a cold headless startup outlier. Steady scenarios do not
repeat the 1.5-second task. Keep the value visible, but do not attribute it to one app
animation without a matching steady-state reproduction.

## Highest-leverage bottlenecks

### 1. Ball pit never sleeps
Both browsers fired about 601 animation frames during the five-second untouched landing
trace. The scene also produced about 1,200 Paint events.

Source:
- `docs/js/landing-ballpit.js`
- `animate()` always schedules another frame while lifecycle conditions allow it.

Target:
- Detect consecutive settled physics frames.
- Render the final state once.
- Request no more physics/render frames until a real wake trigger occurs.

### 2. Ball touch target creates animation-time Layout
The desktop pointer trace produced 585 Chrome and 596 Edge Layout events. The throttled
mobile trace produced 440 Chrome and 408 Edge Layout events.

Source:
- `updateMatrices()` reads `frameHost.clientWidth/clientHeight`.
- It writes touch-target width, height, left, and top every rendered frame.

Target:
- Cache frame dimensions and touch-target size in `resize()`.
- Write one transform during motion.

### 3. Trophy passively renders at display rate
The trophy trace fired about 360 RAF callbacks and more than 1,080 Paint events per browser
during the passive-rotation plus short-drag scenario.

Source:
- `docs/js/trophy.js`
- Passive auto-rotation requests every display frame.

Target:
- Cap passive render work at 30fps.
- Keep drag and keyboard rendering immediate.
- Release the scene when the phone fallback takes over.

### 4. Score progress animates layout
Eight scripted score changes produced 50 Chrome and 49 Edge Layout events.

Source:
- `.sb-track i` transitions `width`.
- `interact.js` writes `bar.style.width`.

Target:
- Use a full-width fill and left-origin `scaleX()`.

### 5. Paint-heavy pulse and broad transitions remain source risks
The landing and dashboard live dots animate `box-shadow`. Many controls use a duration-only
transition shorthand, which means every animatable property is eligible.

The pulse cost is mixed with canvas paints in the trace, so the baseline cannot isolate an
exact count. The source path is still known and can be guarded directly.

Target:
- Pulse a pseudo-element with transform and opacity.
- Name every transitioned property.

### 6. Team stat-card source path is inefficient but did not reproduce Layout in automation
`interact.js` reads card dimensions and writes left/top on every mousemove. The automated
dashboard scenario did not report repeated Layout, likely because match-detail suppression
and headless pointer behavior prevented the same visible hover path.

Target:
- Keep this refactor because the source has an event-frequency layout hazard.
- Recheck it in headed Chrome/Edge before declaring the trace clean.

## Already-good safeguards
- Ball pit and trophy request low-power WebGL contexts.
- Ball count and device pixel ratio are capped.
- Both scenes pause when off-screen or in a hidden tab.
- Ball pit pauses behind dashboard and full-screen overlays.
- Reduced motion is supported.
- Motion off prevents the ball-pit module from loading after reload.
- WebGL context loss falls back to static visuals.
- Only one visible trophy canvas initialized in the measured desktop scenario.

## Baseline conclusion
The app's steady main-thread tasks are short, but decorative motion stays continuously active
and some helper DOM work forces layout at frame frequency. Proceed with the six plans in
order. Do not add a framework, worker, or blanket GPU-promotion rule.
