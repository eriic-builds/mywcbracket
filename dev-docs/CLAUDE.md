# Repository guidance for coding agents

This tracked file contains project-wide engineering rules. It is not personal local
configuration and contains no credentials, private workbook data, or machine-specific
secrets.

Keep it in the repository so future coding sessions load the same architecture, privacy,
fixture, testing, and documentation boundaries.

## Project contract

`mywcbracket` is a static, zero-backend World Cup bracket dashboard.

Preserve:

- GitHub Pages hosting from `docs/`.
- Vanilla HTML, CSS, and ES modules.
- No frontend build step.
- No package-manager runtime dependency.
- Browser-local picks, rivals, themes, favorites, Motion, and what-if values.
- Consent-based one-bracket sharing through a URL fragment.
- Public live data generated and validated by GitHub Actions.

Do not add an account system, central pool registry, analytics, server session, or network
write from social modules without an explicit new brief.

## Commands

```bash
python3 -m http.server 8000 --directory docs
npm test
node tests/golden.mjs --update
python3 scripts/fetch_results.py --dry-run
python3 scripts/validate_results.py
python3 scripts/validate_match_details.py
python3 tests/match_details.py
```

Use Node 22 and Python 3.12 to match CI. No `npm install` is required.

## Runtime architecture

- `docs/js/render.js` computes scored state and returns dashboard HTML.
- `docs/js/bracket-tree.js` derives the shared tournament tree for mirrored and Sideways
  layouts.
- `docs/js/builder.js` owns the pure pick topology and click-to-pick flow.
- `docs/js/parse-excel.js` validates the workbook entirely in the browser.
- `docs/js/main.js` orchestrates landing, loading, render modes, social controls, backup,
  freshness, and feature lifecycle.
- `docs/js/interact.js` owns themes, navigation, filtering, map layout, fit-screen behavior,
  and stat interactions.
- `docs/js/share.js` owns versioned bracket URL encoding and decoding.
- `docs/js/compare.js` owns local rival storage, standings, and pick differences.
- `docs/js/storage.js` owns local persistence, preview isolation, and private pool backup.
- `docs/js/match-details.js` owns facts, accessible dialogs, and intent-gated portraits.
- `docs/js/trophy.js` owns the desktop WebGL trophy and responsive fallback.
- `docs/js/landing-ballpit.js` owns landing physics, Motion control, sleep, wake, and WebGL
  lifecycle.
- `docs/js/vendor/` contains reviewed local SheetJS and Three.js files. Do not edit vendored
  bundles.

Reuse existing pure helpers. Do not duplicate bracket, score, flag, or storage logic.

## Generated data

- `docs/data/topology.json` is fixed tournament structure and schedule.
- `docs/data/results.json` is bot-written canonical score data.
- `docs/data/match-details.json` and `docs/data/match-portraits.json` are bot-written
  enrichment data.
- `docs/data/demo-picks.json` is the deterministic demo bracket.
- `scripts/fetch_results.py` writes the generated files.
- `scripts/validate_results.py` and `scripts/validate_match_details.py` gate publishing.

Never make a golden fixture depend on live `results.json`. Use frozen test inputs.

## Byte-locked output

`docs/js/render.js` output is protected by:

- `tests/fixtures/golden-sections.json`
- `tests/fixtures/map-sections.frozen.json`

An intentional render change requires:

1. Run the focused test before updating a fixture.
2. Run the fixture update command.
3. Review every changed section.
4. Explain why each byte-level output change is expected.
5. Run the full suite.

A regenerated passing snapshot does not prove the new output is correct.

## Social and privacy rules

[`[01]-zero-backend-social-loop/BRIEF.md`]([01]-zero-backend-social-loop/BRIEF.md) is the source of
truth.

Non-negotiable rules:

- `share.js` and `compare.js` make no network writes.
- Rivals never appear in a URL.
- A share URL contains only the sender's chosen name, tiebreaker, and one bracket.
- Whole-pool backup is a private local download, not a sharing feature.
- Demo and shared previews never mutate the owner's saved bracket or what-if values.
- External match portraits wait for user intent and keep visible credit.

## Motion and WebGL rules

- Prefer transform and opacity for repeated visual motion.
- Treat compositor eligibility as a browser decision, not a guaranteed GPU thread.
- Do not add broad `transition: all` or blanket `will-change`.
- Coalesce high-frequency pointer DOM writes.
- Pause hidden work and sleep settled simulations.
- Dispose WebGL resources when a responsive fallback replaces a scene.
- Preserve `prefers-reduced-motion` and the in-product Motion setting.

The reusable audit method is in
[`[04]-animation-performance-revision/BRIEF.md`]([04]-animation-performance-revision/BRIEF.md#reusable-client-side-performance-review-prompt).

## Documentation process

Read [`PROJECT-HISTORY.md`](PROJECT-HISTORY.md) before reconstructing why a feature exists.

New multi-plan work belongs in `dev-docs/<brief-name>/`:

```text
BRIEF.md
BASELINE.md        optional
plans/             when source plans exist
RESULTS.md
README.md
```

Put interactive reports in `dev-docs/[00]-dev-reports/<brief-name>/` and link either the repo file path
or the GitHub repository URL from the package README.

Preserve original source artifacts. Mark reconstructed briefs. Do not invent missing
historical plans.

## Change workflow

1. Read this file, the relevant brief, and `TECHNICAL_TASTE_COUNCIL.md`.
2. Inspect `git status` and preserve unrelated user changes.
3. Use the smallest focused test while editing.
4. Run `npm test` and relevant Python validators before completion.
5. Serve `docs/` and inspect changed UI in a target browser.
6. Review generated and golden diffs.
7. Do not commit, push, or deploy unless the task includes that approval.
