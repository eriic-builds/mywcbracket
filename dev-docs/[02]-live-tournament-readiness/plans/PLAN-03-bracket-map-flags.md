# PLAN: Country flags in the bracket map

**Rank: 3 of 6.** The builder already shows flags next to every team. The bracket map (the
results view) shows plain text. Adding the same flags makes the map instantly readable and
reuses code that already exists. User asked for this directly.

## Goal
Render a country flag next to each team in the "Bracket map" section, using the same
`flags.js` helper the builder uses, without breaking the golden or bracket-map tests.

## Exact files to touch
- `docs/js/render.js` — `r32_cell` (around line 297), `pickBox` (around line 310),
  `laterCell` (around line 331), all inside `buildBracket` (around line 353).
- `docs/css/dashboard.css` — a flag size/spacing rule for bracket cells.
- `tests/fixtures/golden-sections.json` — regenerate after the render change.
- Possibly `tests/bracketmap.mjs` expectations — only if it asserts exact cell HTML.

## What already exists (reuse it)
- `docs/js/flags.js` exports `flagImg(name, cls = "bld-flag")`, which returns
  `<img class="<cls>" src="flags/<code>.svg" alt="<name> flag" width="22" height="16"
  loading="lazy" decoding="async">`, or `""` when the name has no flag.
- `docs/js/builder.js` line 98 already calls `flagImg(t)` before the team name. Copy that
  pattern.
- Flag SVGs live in `docs/flags/*.svg`, keyed by the `FLAG_CODE` map in `flags.js`
  (lowercase ISO alpha-2, England is `gb-eng`).

## Step-by-step
1. Import the helper at the top of `render.js`: `import { flagImg } from "./flags.js";`.
   Confirm `render.js` currently does not import it, and that adding the import does not
   break the golden harness (the harness imports `render.js` as a module).
2. In `r32_cell`, insert `flagImg(team, "bk-flag")` right before the `<span class="tname">`.
   The current return builds `...${sh}<span class="tname">${esc(team)}</span>...`. Put the
   flag between the seed span `sh` and the tname span.
3. In `pickBox`, do the same before its `<span class="tname">${esc(team)}</span>`.
4. In `laterCell`, there are two team renders: the "actual occupant" branch (renders
   `actual`) and the placeholder branch (renders `Winner M53`/`TBD`). Add `flagImg(actual,
   "bk-flag")` in the actual branch. Do NOT add a flag to the placeholder branch, since
   `Winner M53`/`TBD` has no country.
5. Add CSS in `dashboard.css` for `.bk-flag`: `width:18px;height:13px;border-radius:2px;
   margin-right:6px;vertical-align:-1px;flex:0 0 auto`. Match the cell layout so the flag
   sits left of the seed/name without shifting alignment. Check the doodle theme, which
   grayscales flags; reuse the existing `[data-theme="doodle"] img` filter if present.
6. Regenerate the golden snapshot: `node tests/golden.mjs --update`, then run `npm test` and
   confirm `bracket_actual` and `bracket_picked` sections match the new output.
7. Run `node tests/bracketmap.mjs` (part of `npm test`). It asserts the actual path has no
   blanks and placeholders appear. If it checks exact HTML, update its expectation to include
   the flag `<img>` only where a real team renders.

## Edge cases a weaker model will miss
- `buildBracket` is golden-locked. The change WILL fail `tests/golden.mjs` until you run
  `--update` and commit `tests/fixtures/golden-sections.json`. That is expected, not a bug.
- Placeholder cells (`Winner M53`, `TBD`) and the champion note must not get a flag. Only add
  flags where an actual team name renders.
- `flagImg` returns `""` for any unmapped name, so an unknown team degrades to no flag with
  no error. Do not add a fallback emoji; empty string is the intended miss behavior.
- England renders as `gb-eng`, not `gb`. This is already handled by `FLAG_CODE`; do not
  "fix" it.
- Keep `alt="<name> flag"` from `flagImg` for accessibility. Do not pass an empty alt.
- Do not change the builder. Flags there already work; this is map-only.
- `flagImg` src is `flags/<code>.svg`, relative to `index.html` at the repo docs root, which
  is where the bracket renders. The path is already correct for the map.

## Acceptance criteria
- Every real team in both bracket views ("Actual path" and "My picks") shows its flag; the
  builder still shows flags unchanged.
- Placeholder and champion-note cells show no flag and throw no console error.
- `npm test` passes with an updated `tests/fixtures/golden-sections.json`.
- No external requests added; flags are the existing bundled `docs/flags/*.svg`.
