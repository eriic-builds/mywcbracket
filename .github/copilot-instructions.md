# Copilot instructions for `sled-mywcbracket`

## Build, test, and lint commands

- **Runtime/build model:** no frontend build step. GitHub Pages serves `docs/` directly.
- **Local preview:** `python3 -m http.server 8000 --directory docs`
- **Full JS test suite:** `npm test`
- **Run a single JS test file:** `node tests/<name>.mjs` (example: `node tests/share.mjs`)
- **Render snapshot tests:**
  - Check: `node tests/golden.mjs`
  - Intentional snapshot update: `node tests/golden.mjs --update`
  - Map contract check: `node tests/map-frozen.mjs`
  - Intentional map snapshot update: `node tests/map-frozen.mjs --update`
- **Python validation/pipeline checks:**
  - `python3 scripts/validate_results.py`
  - `python3 tests/match_details.py`
  - `python3 scripts/validate_match_details.py`
  - Dry-run live sync: `python3 scripts/fetch_results.py --dry-run`
- **Lint:** no dedicated lint command is configured in `package.json`.

Use **Node 22** and **Python 3.12** to match CI.

## High-level architecture

This repository is a **static, zero-backend** app:

1. **Inputs**: picks come from either workbook parsing (`docs/js/parse-excel.js`) or the in-browser builder (`docs/js/builder.js`), then are validated against `docs/data/topology.json`.
2. **Public match data pipeline**: `scripts/fetch_results.py` generates `docs/data/results.json`, `docs/data/match-details.json`, and `docs/data/match-portraits.json`; validators gate correctness before publish.
3. **Render core**: `docs/js/render.js` computes scored state from `(picks, live results, topology)` and emits dashboard HTML sections.
4. **UI orchestration**: `docs/js/main.js` loads data, renders views, manages app modes (owner/demo/shared), and wires interactions from `docs/js/interact.js` and `docs/js/match-details.js`.
5. **Persistence and sharing**: local state is handled in `docs/js/storage.js`; one-bracket sharing is URL-fragment based via `docs/js/share.js`; local leaderboard/rival comparison is in `docs/js/compare.js`.
6. **Deploy path**: `deploy-pages.yml` publishes `docs/`; `sync-results.yml` refreshes data on schedule, validates it, commits bot-written data changes, and dispatches Pages deploy when needed.

## Key repository conventions

- Preserve the project contract: **static site, no backend, no frontend build step, browser-owned state**.
- `docs/js/vendor/` contains vendored runtime libs; treat these files as external bundles and avoid manual edits.
- `docs/js/render.js` output is treated as a **byte-level contract** via:
  - `tests/fixtures/golden-sections.json`
  - `tests/fixtures/map-sections.frozen.json`
- When render/map output intentionally changes, update frozen fixtures with `--update` and review diffs carefully.
- Snapshot tests are intentionally **hermetic**: golden/map tests use frozen fixture inputs, not live `docs/data/results.json`.
- `docs/data/results.json`, `docs/data/match-details.json`, and `docs/data/match-portraits.json` are generated pipeline artifacts; prefer scripts + validators over manual edits.
- `tests/parse.mjs` relies on a private workbook path and self-skips when unavailable (expected in CI).
- For larger, multi-plan workstreams, follow the established `dev-docs/<brief-name>/` package pattern (`BRIEF.md`, optional `BASELINE.md`, `plans/`, `RESULTS.md`, `README.md`) and publish interactive reports under `dev-docs/dev-reports/<brief-name>/`.
