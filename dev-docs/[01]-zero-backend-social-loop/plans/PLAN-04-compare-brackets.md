# PLAN: Compare brackets — a client-side mini-leaderboard for the pool

**Rank: 4 of 5.** The SLED pool is a *competition*, but the app only ever shows one
bracket. Rob scores everyone by hand; nobody can see the standings between his updates.
Let a user import colleagues' brackets (JSON backups or share-links) and get a live
leaderboard + "where we differ" view — all client-side, nothing uploaded, consistent
with the privacy promise. Builds on PLAN-share-links (decode reuse); do that one first.

## Goal

A "Compare" button that opens an overlay showing every stored bracket ranked by
confirmed points (with attainable as the tiebreak), plus a per-rival diff of remaining
picks ("M97 · QF: you Spain — them Brazil · 4 pts at stake").

## Files to touch

| File | Change |
| --- | --- |
| `docs/js/compare.js` | NEW — pure ranking/diff core + overlay UI |
| `docs/js/main.js` | "Compare" button wiring; pass `TOPO`/`LIVE` |
| `docs/index.html` | Button in `#viewerbar`; overlay `<div>`; styles |
| `tests/compare.mjs` | NEW — tests for the pure core |

`storage.js` is not modified; compare keeps its own key. `render.js` untouched.

## Data model

`localStorage["wcb.rivals.v1"]` = JSON array of full picks objects (same shape as
`demo-picks.json`), max 20 entries, deduplicated by `hashPicks` (import that from
`storage.js`). The user's own bracket is **not** stored here — it is read live via
`loadPicks()` so it can never fork from the source of truth.

## Step-by-step

### Step 1 — pure core in compare.js (top of file, no DOM)

```js
import { computeState } from "./render.js";
import { hashPicks } from "./storage.js";
import { decodeShare } from "./share.js";   // if share.js exists; see fallback below

export function standings(brackets, live, topology) {
  // brackets: [{picks, you:bool}] -> sorted rows of display data
  const rows = brackets.map(({ picks, you }) => {
    const D = computeState(picks, live, topology);
    return { you: !!you, name: picks.entrant || "?", conf: D.CONF, live: D.LIVE,
             attain: D.ATTAIN, champ: D.CHAMP, champAlive: D.CHAMP_ALIVE,
             tiebreaker: picks.tiebreaker, hash: hashPicks(picks) };
  });
  rows.sort((a, b) => (b.conf - a.conf) || (b.attain - a.attain) || a.name.localeCompare(b.name));
  return rows;
}

export function diffPicks(mine, theirs, live, topology) {
  const Dm = computeState(mine, live, topology);
  const Dt = computeState(theirs, live, topology);
  const PTS = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 };
  const out = [];
  // R32: fixed codes; later rounds: compare by bracket slot (same KO code).
  for (const [mc, dt, a, b, pk] of Dm.R32) {
    const tPk = Dt.R32.find(m => m[0] === mc)[4];
    if (pk !== tPk && !(mc in Dm.RES)) out.push({ code: mc, round: "r32", mine: pk, theirs: tPk, pts: 1 });
  }
  for (const code in Dm.PICK_BY_CODE) {
    if (code in Dm.RES) continue;                        // already decided
    const mineP = Dm.PICK_BY_CODE[code], theirP = Dt.PICK_BY_CODE[code];
    if (mineP !== theirP) out.push({ code, round: Dm.KO_ROUND[code], mine: mineP, theirs: theirP, pts: PTS[Dm.KO_ROUND[code]] });
  }
  out.sort((x, y) => (y.pts - x.pts) || (parseInt(x.code.slice(1), 10) - parseInt(y.code.slice(1), 10)));
  return out;
}
```

`computeState` is exported from render.js already and is pure (the `window.WCSTATS`
side effect lives in `renderDashboard`, not `computeState` — verified). It is cheap
(31 matches), so calling it per bracket per open is fine; no caching.

### Step 2 — overlay UI (same pattern as the builder overlay)

- `index.html`: `<div id="compare" class="builder" hidden><div class="bld-inner"></div></div>`
  — reuse the `.builder` overlay styles wholesale; add `.cmp-*` styles for the table
  (a simple grid: rank, name, confirmed, still-live, attainable, champion).
- `compare.js` exports `openCompare(topology, live)`:
  1. Load rivals from `wcb.rivals.v1` (try/catch → `[]`), `mine = loadPicks()`.
  2. Render standings table (rows from `standings()`; bold the `you` row; 🏆 with
     strikethrough if `!champAlive`).
  3. Per rival row: a "differences" toggle that renders `diffPicks()` as
     `M97 · QF — you: Spain · them: Brazil · 4 pts` lines, and a ✕ remove button.
  4. "Add bracket" controls: a file input (accepts `.json`, may select multiple) and a
     paste field for share-links (extract `#b=...` with the same regex main.js uses,
     `decodeShare`). Every added bracket goes through `validateAgainstTopology` before
     storing; on error, show the messages in the overlay (reuse `ValidationError.problems`).
  5. All rendering escapes names with the local `esc` pattern from builder.js.

### Step 3 — wiring

- `index.html` viewerbar: `<button id="vb-compare" title="Rank this bracket against friends' brackets">Compare</button>`
- `main.js`: `$("#vb-compare").onclick = () => { if (TOPO && LIVE) openCompare(TOPO, LIVE); };`
  Import `openCompare` at the top. Hide the button in demo/shared view (`isDemo || isShared`).

### Step 4 — tests/compare.mjs

Repo-local data only (like builder.mjs):

1. `standings([{picks:demo,you:true}], live, topo)` → one row, `conf` equals the number
   extracted from `renderDashboard`'s `scConfirmed` span (same regex as scoring.mjs) —
   ties the leaderboard number to the dashboard number forever.
2. Build a rival from demo by flipping one **undecided** pick (find an R32 code not in
   `live.res`; if all 16 are decided — true from Jul 3 on — flip an undecided KO slot
   instead: rebuild via `buildPicks` with one changed `sel`). Assert:
   - `diffPicks(demo, rival, …)` contains exactly the flipped slot(s) with right `pts`;
   - flipping a **decided** match produces `[]` from the R32 branch (decided = excluded).
3. Ranking: craft rival with strictly more confirmed points impossible client-side?
   No — just reorder check: two brackets with equal `conf` sort by `attain` descending.
   (Use two hand-built brackets whose picks differ only in eliminated teams.)

## Edge cases a weaker model would miss

- **Never store the user's own bracket in the rivals list** — it would silently fork
  from `wcb.fan.picks.v1` the next time they re-upload. Read it via `loadPicks()` at
  open time, every time.
- **Never call `resetWhatIfsIfChanged`/`savePicks` for rivals** — `resetWhatIfs` keys on
  a global hash; running it on a rival would wipe the user's what-if overrides. The
  compare path must only use `computeState`, which is pure.
- **A rival flipping a *decided* match is not a "difference that matters"** — the diff
  is about points still in play; decided slots are excluded by the `in Dm.RES` guard on
  both branches. (Their disagreement on decided games is already visible in `conf`.)
- **KO diff must compare by bracket slot (KO code), not by team** — two brackets can
  both "have Spain in the semis" via different paths; `PICK_BY_CODE` keyed by code is
  the correct join.
- **Duplicate names ≠ duplicate brackets**: dedupe by `hashPicks`, never by entrant;
  two "Alex"es are legal. When names collide, suffix the display name with `·2` at
  render time only (don't mutate stored data).
- **The demo bracket is Eric's real bracket** — if a user imports the demo JSON as a
  rival and also uploaded the same workbook as themselves, dedupe-by-hash makes it
  vanish confusingly. Acceptable; but the "you" row must be excluded from dedupe.
- **Overlay reuses `.builder` CSS** — both overlays exist in the DOM; make sure
  `openBuilder` and `openCompare` each target their own host div by id, and Escape/✕
  close only their own.
- **20-bracket cap**: enforce on add with a clear message; ~4 KB each keeps well inside
  localStorage quotas, but Safari private mode still throws — wrap writes in try/catch
  (mirror `safeSet` semantics locally).

## Acceptance criteria

1. `node tests/compare.mjs` passes; added to `npm test`.
2. Manual: with your bracket loaded, Compare shows a 1-row table of you. Import the demo
   JSON (export it first from the demo… actually use "Save a copy" on a second browser
   profile, or `docs/data/demo-picks.json` directly) → 2 rows, correctly ranked, your
   row bolded.
3. The rival's "differences" list shows only undecided matches, sorted by points at
   stake descending, and each line's two team names really are that slot's picks in the
   respective brackets.
4. Remove (✕) a rival → gone after reload. Add the same file twice → one entry.
5. Your what-if overrides (scorecard toggles) survive an entire compare session.
6. Compare button hidden while viewing the demo or a shared link.
7. With `localStorage` blocked (Safari private mode), Compare still opens showing you +
   session-only rivals, and never throws.
