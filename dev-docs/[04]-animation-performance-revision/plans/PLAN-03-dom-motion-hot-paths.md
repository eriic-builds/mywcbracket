# PLAN: DOM motion hot paths

**Rank: 3 of 6. Run after Plan 02.**

## Goal
Remove repeated layout-triggering motion from the team stat card and both dynamic progress
bars while preserving exact scoring, builder progress, hover placement, and cleanup.

## Exact files to touch
- `docs/css/dashboard.css`
- `docs/index.html`
- `docs/js/interact.js`
- `docs/js/builder.js`
- `docs/js/render.js`
- `tests/animation-performance.mjs` - new
- `tests/fixtures/golden-sections.json`
- `package.json`

Do not touch `docs/js/match-details.js`. Its fact-card `left`/`top` writes occur only on open,
portrait load, or resize and are not an animation loop.

## Step-by-step implementation order
1. Read Plan 01's `BASELINE.md` and Plan 02's measured notes. Confirm the stat-card and width
   transitions appear in the trace before changing them.
2. In `dashboard.css`, change `.statcard`:
   - Keep `position:fixed`.
   - Anchor it at `left:0;top:0`.
   - Use the individual CSS `translate` property for viewport x/y placement.
   - Keep the existing `transform:translateY(4px)` to `translateY(0)` entrance and opacity
     transition. Individual `translate` composes with `transform` in the target Chrome and
     Edge browsers, so pointer tracking does not overwrite the entrance effect.
   - Do not transition `translate`; the card must track the pointer without lag.
3. In `interact.js`, update the file header. It currently says the interaction layer was
   extracted "VERBATIM." After this change that statement is false. Say it was adapted from
   the original source instead.
4. Add one tracked stat-card frame id and cached width/height to the existing lifecycle:
   - On first show or content change, populate the card, measure it once, calculate the safe
     viewport position, write `style.translate`, then add `.show`.
   - On `mousemove`, store only the latest pointer coordinates.
   - Schedule at most one existing `nextFrame()` callback.
   - In that callback, calculate from cached dimensions and write only `style.translate`.
   - Re-measure on viewport resize or card content change.
   - Cancel or harmlessly invalidate a pending callback on mouseleave and lifecycle teardown.
5. Preserve viewport collision logic:
   - 14px edge padding.
   - Prefer 16px down/right of the pointer.
   - Flip left when the card would cross the right edge.
   - Clamp at all viewport edges.
6. Convert the dashboard score bar:
   - In `.sb-track i`, use `width:100%`, `transform-origin:left center`, and
     `transition:transform .35s`.
   - In `render.js` `buildScorebar`, emit an initial inline
     `transform:scaleX(ratio)` instead of a percentage width.
   - Clamp the ratio to 0 through 1.
   - In `interact.js` `recalc()`, update the same transform model.
7. Convert the builder progress bar:
   - In `docs/index.html`, use full width, left transform origin, and transition transform.
   - In `builder.js`, emit `transform:scaleX(totalPicked / 31)` instead of inline width.
   - Builder rerenders replace the element, so the correct transform must be present in every
     render.
8. Add `tests/animation-performance.mjs`:
   - Read first-party CSS and JavaScript as text, following existing test style.
   - Assert stat-card CSS anchors at zero and uses `translate`.
   - Assert `interact.js` does not write stat-card left/top on mousemove.
   - Assert score and builder fills transition transform, not width.
   - Assert `render.js`, `interact.js`, and `builder.js` use `scaleX`.
   - Assert ratios are clamped or derived from fixed valid bounds.
   - Document `match-details.js` static positioning as an allowed exception rather than
     banning every `style.left` string in the repo.
9. Add `node tests/animation-performance.mjs` to the existing `package.json` test chain. Add
   no package and no build script.
10. Run `node tests/golden.mjs`. It must fail only in the `scorebar` section.
11. Run:
    ```bash
    node tests/golden.mjs --update
    git diff -- tests/fixtures/golden-sections.json
    ```
    Inspect the diff. Accept only the score-bar inline style change from width to transform.
    If any other section changes, stop and restore only the unintended generated change.
12. Run:
    ```bash
    node tests/animation-performance.mjs
    node tests/builder.mjs
    node tests/golden.mjs
    npm test
    ```
13. Repeat the Plan 01 stat-card and progress traces. Save results for Plan 06.

## Edge cases a weaker model will miss
- Updating `transform` directly for pointer placement would overwrite the card's existing
  entrance `transform`. Use individual `translate` for position and keep `transform` for the
  four-pixel entrance.
- Reading `offsetWidth` or `offsetHeight` after every pointer write can force synchronous
  layout. Measure once before the movement loop and re-measure only when content or viewport
  size changes.
- Pointer events can arrive faster than display frames. Coalesce to the newest coordinates
  rather than queueing one frame per event.
- `interact.js` has an `AbortController`, timer set, and frame set. Use that lifecycle so a
  dashboard rerender cannot leave a stale callback touching detached DOM.
- Match details intentionally suppress the quick stat card. A queued frame must not make the
  suppressed card reappear.
- The score bar is byte-locked through `render.js`. Regenerate with frozen fixture data only;
  never derive the golden from live `docs/data/results.json`.
- `buildScorebar` initial HTML and `recalc()` updates must use the same transform convention,
  or the bar can jump on the first score interaction.
- Builder progress reaches exactly 31/31. Do not produce `scaleX(1.00001)` or rely on string
  percentage parsing.
- The builder element is recreated on every step. A one-time post-render transform update is
  insufficient.
- The target browsers are current Chrome and Edge. Individual `translate` support is
  acceptable here; do not add a polyfill or framework.

## Concrete acceptance criteria
- Team stat-card movement performs at most one style write per display frame.
- Pointer tracking writes `translate`, not `left`, `top`, or `transform`.
- Stat-card edge flipping and clamping match current behavior.
- Score and builder progress animate with left-origin `scaleX()`.
- Score totals and builder 0/31 through 31/31 text remain unchanged.
- The golden fixture diff changes only the score-bar style representation.
- The matching Chrome trace shows no repeated Layout events from stat-card tracking or
  progress animation.
- `node tests/animation-performance.mjs`, builder test, golden test, and full `npm test`
  pass.
- No dependency or build command is added.
