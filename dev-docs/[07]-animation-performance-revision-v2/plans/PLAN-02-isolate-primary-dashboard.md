# PLAN: Isolate the hidden feature from the primary dashboard

**Rank: 2 of 5. Leverage: 9.8/10. Run only after Plan 01.**

## Goal

Remove only dormant celebration cost proven material by the matched baseline. Preserve the
four-activation secret, immediate dashboard interactions, reduced-motion fallback, and replay.

If the baseline proves zero heavy runtime work and immaterial stylesheet/trigger cost, record
this plan as verification-only and change no runtime source.

## Exact candidate files

- `docs/index.html`
- `docs/js/interact.js`
- `docs/js/champion-celebration-trigger.js`
- `docs/js/main.js`
- `docs/js/champion-celebration.js`
- `docs/css/champion-celebration.css`
- `tests/animation-performance.mjs`
- `tests/champion-celebration.mjs`
- `dev-docs/[07]-animation-performance-revision-v2/RESULTS.md`

Touch only the subset required by the measured decision.

## Observation

The primary dashboard globally loads the 7,209-byte celebration stylesheet and statically
imports the 3,208-byte trigger. The approximately 138KB controller/scene/models/effects
source remains behind the fourth valid activation.

## Evidence required before editing

- No heavy celebration module request before click four.
- No celebration stage, canvas, WebGL context, or frame callback while dormant.
- Same result after three valid clicks.
- Measured cold/style cost for the global stylesheet and trigger.
- Primary-dashboard p95 and long-task result at 4x and 6x.

## Decision and implementation order

1. Read `BASELINE.md` and mark the branch:
   - `verification-only`; or
   - `stylesheet isolation required`; or
   - `trigger isolation required`.
2. If dormant heavy runtime isolation already passes and CSS/trigger cost is immaterial:
   - make no runtime change;
   - add only missing source/browser guards;
   - record why complexity was rejected.
3. If the global stylesheet has material measured cold/style cost:
   - remove only its unconditional `<link>` from `docs/index.html`;
   - add one named cached stylesheet loader at the existing celebration boundary in
     `docs/js/main.js` or `docs/js/champion-celebration.js`;
   - await `load` before creating the stage or fallback;
   - reject on `error` through the existing visible fallback/error behavior;
   - retain the loaded stylesheet for replay.
4. Do not dynamically complicate the trigger import unless its measured parse/evaluation
   cost is material.
5. If trigger isolation is required:
   - preserve one delegated owner;
   - do not attach listeners per match card;
   - retain the exact count/window/reset and active-mirror guards;
   - prove no race can start a stale stage after rerender.
6. Add focused tests for the exact branch taken.
7. Repeat dashboard cold, dormant, near-miss, fourth activation, reduced motion, and replay
   with the same runner.
8. Stop when the matched dormant gate passes. Do not optimize bytes for their own sake.

## Reasoning

The leverage is protecting every dashboard visit. The risk is replacing a simple static
boundary with asynchronous loading complexity that creates a flash, race, or failure path.
Measurement decides whether the extra machinery earns its keep.

## Tradeoffs

- Lazy CSS can remove cold parse/style work but creates an asynchronous readiness boundary.
- Keeping the small trigger static costs a few kilobytes but preserves immediate, simple,
  delegated input.
- Caching the stylesheet improves replay but intentionally keeps it after first use.

## Edge cases a weaker model will miss

- A stylesheet `load` event can fire after the bracket rerenders. Revalidate generation and
  trigger connectivity before stage creation.
- Reduced-motion and forced-WebGL fallback still require the celebration CSS.
- Starting before CSS readiness produces an unstyled full-screen modal flash.
- A failed stylesheet must not leave the dashboard inert or the trophy captured.
- Moving selectors into `dashboard.css` does not remove their parse/style cost.
- Four fast keyboard activations must behave like four clicks; `event.repeat` stays ignored.
- The hidden sideways or picked bracket trigger is invalid even if it exists in the DOM.
- Listener count alone is not a performance bug; four delegated listeners are bounded.

## Tests and browser evidence

- `node tests/animation-performance.mjs`
- `node tests/champion-celebration.mjs`
- dormant 4x and 6x trace;
- three-click near miss;
- fourth click full motion;
- reduced-motion tableau;
- stylesheet failure if a lazy loader was added;
- rerender during load;
- replay x3.

## Concrete acceptance criteria

- Before fourth activation: no heavy module request, stage, celebration canvas/context, or
  celebration frame work.
- Three clicks produce the same result.
- Primary-dashboard p95 stays at or below `16ms` with no task over `50ms`.
- Fourth activation, reduced motion, fallback, Escape, Skip, replay, and exact restore remain
  correct.
- No new dependency, persistence, build step, or external request.
- If the baseline was already green, runtime source remains unchanged.

## Lessons learned

The cheapest hidden feature is not necessarily the one with the fewest bytes. A small static
boundary can be better engineering than a fragile async loader when measured runtime cost is
already negligible.
