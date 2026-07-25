# PLAN: Hardening and accessibility — close real holes

**Rank: 5 of 6.** Small, independent, safe fixes that each close a concrete failure or
accessibility gap found in the live app. Land them one commit each, in any order. Note: a
pool leaderboard and URL sharing already exist (`compare.js`, `share.js`), so this replaces
a "build standings" plan, which is already done.

## Goal
The app degrades gracefully when the network or storage fails, and the interactive controls
work for keyboard and screen-reader users.

## Fixes (each is independent, one commit each)

### 1. `loadData` has no error handling
- File: `docs/js/main.js` around lines 37-42. `loadData()` calls
  `fetch("data/results.json", { cache: "no-cache" })` and `data/topology.json` with no
  `.catch`. A failed fetch rejects startup and leaves a blank page.
- Fix: wrap the loads in try/catch. On failure, render a clear inline error with a retry
  button ("Could not load live results. Retry."). Keep the last-known cached view if one is
  in `localStorage`.
- Verify: block the requests in devtools and confirm a readable error, not a blank page.

### 2. Compare overlay is not a labelled dialog
- File: `docs/js/compare.js` around lines 123-169. The overlay is a modal but `#cmp-close`
  has only `title="Close"` and the ✕ glyph, with no `aria-label` and no dialog role.
- Fix: add `role="dialog"` and `aria-modal="true"` to the overlay container, `aria-label`
  to the close button, move focus to the dialog on open, return focus to `#vb-compare` on
  close, and close on Escape.
- Verify: open with keyboard only, tab stays within the dialog, Escape closes, focus returns.

### 3. Drop zone has no keyboard handler
- Files: `docs/index.html` around lines 339-341 (the drop zone is `role="button"`,
  `tabindex="0"`, with an `aria-label`) and `docs/js/main.js` around lines 282-286 (only
  click and drag are wired).
- Fix: add a `keydown` handler so Enter and Space trigger the same file picker as click.
- Verify: focus the drop zone, press Enter, the file dialog opens.

### 4. localStorage failures are swallowed silently
- Files: `docs/js/storage.js` around lines 8-10 and `docs/js/compare.js` around lines 13-17.
  Both catch `localStorage` exceptions and drop them, so private-mode or quota failures are
  invisible and picks silently do not save.
- Fix: on a write failure, show a one-time non-blocking notice ("Your browser blocked local
  saving, so changes will not persist"). Keep the app usable in memory.
- Verify: disable storage in the browser and confirm the notice appears once and the app
  still runs.

### 5. Share popover lacks dialog semantics and focus trap
- Files: `docs/index.html` around lines 267-290 and `docs/js/main.js` around lines 159-177.
  The popover is modal-like but has no `role="dialog"`/`aria-modal` and only partial focus
  handling.
- Fix: add dialog semantics, trap focus while open, return focus to the trigger on close,
  and close on Escape.
- Verify: keyboard-only open/close with correct focus behavior.

## Edge cases a weaker model will miss
- Do not change any golden-tested render output. These fixes live in `main.js`, `compare.js`,
  `storage.js`, `index.html`, and CSS, not in the snapshotted sections of `render.js`. If a
  change does touch a snapshotted string, run `node tests/golden.mjs --update`.
- Keep Escape-to-close from also closing the whole app or losing unsaved what-if state.
- Do not trap focus so hard that the browser chrome becomes unreachable; only cycle within
  the dialog on Tab.
- Screen-reader text must not leak into the visual layout; use existing visually-hidden
  patterns if any, otherwise `aria-label` on the control.

## Acceptance criteria
- With the network blocked, the app shows a readable, retryable error rather than a blank
  page.
- Compare and share dialogs are reachable and operable by keyboard only, announce as dialogs,
  and return focus on close.
- The drop zone activates from the keyboard.
- A blocked `localStorage` shows one clear notice and the app keeps working in memory.
- `npm test` still passes.
