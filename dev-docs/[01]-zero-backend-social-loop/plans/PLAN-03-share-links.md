# PLAN: Share links — your whole bracket in a URL, zero backend

**Rank: 3 of 5.** The pool is social: today the only way to show someone your bracket is
to send a JSON file and talk them through Import. A bracket is exactly **31 binary
choices** + a name + a tiebreaker — it fits in ~80 URL characters. "Here's my bracket:
<link>" with no server, no upload, no accounts is the highest product-leverage feature
per line of code in this repo, and it stays 100% true to the privacy promise.

## Goal

A "Share link" button that copies a URL like
`https://eriic-builds.github.io/my-wc26-bracket/#b=1.eyJ2IjoxLC...`
Opening that URL shows the sender's full live-scored dashboard in **view-only** mode
(does not overwrite the visitor's own saved bracket), with "Save as mine" and
"Back to my bracket" actions.

## Files to touch

| File | Change |
| --- | --- |
| `docs/js/share.js` | NEW — pure encode/decode (unit-testable, no DOM) |
| `docs/js/main.js` | Share button wiring; hash handling on load; view-only banner |
| `docs/index.html` | "Share link" button in `#viewerbar`; small banner styles |
| `tests/share.mjs` | NEW — round-trip + fuzz test |

`storage.js`, `render.js`, `builder.js` are **not modified** — but `share.js` imports
the pure helpers `deriveStructure`, `teamsFor`, `buildPicks` from `builder.js`.

## Encoding spec (keep it this simple)

Canonical match order = `deriveStructure(topology)`:
`r32codes` (16) + `r16codes` (8) + `qfcodes` (4) + `sfcodes` (2) + `finalcode` (1) = 31.

For each code in that order, one character: `"0"` if the picked winner is the **first**
team returned by `teamsFor(S, code, sel)`, `"1"` if the second. Later rounds' teams
depend on earlier picks, so encode **in order** while building up a `sel` map.

Payload object: `{"v":1,"b":"<31 chars of 0/1>","n":"<entrant>","t":<tiebreaker int>}`
→ `JSON.stringify` → UTF-8 bytes (`TextEncoder`) → base64url (replace `+/` with `-_`,
strip `=`). Hash param: `#b=<encoded>`.

Yes, base64(JSON) is bigger than raw bit-packing. It is also debuggable in one
`atob()` and versioned. Do not bit-pack.

## Step-by-step

### Step 1 — docs/js/share.js

```js
// share.js — encode a picks object into a URL-safe string and back. Pure module:
// no DOM, no storage. The bracket is 31 binary choices, so it travels as a bitstring.
import { deriveStructure, teamsFor, buildPicks } from "./builder.js";

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

export function encodeShare(picks, topology) {
  const S = deriveStructure(topology);
  const sel = {};
  picks.r32.forEach(m => { sel[m[0]] = m[4]; });
  S.r16codes.forEach((c, j) => { sel[c] = picks.r16_win[j]; });
  S.qfcodes.forEach((c, j) => { sel[c] = picks.qf_win[j]; });
  S.sfcodes.forEach((c, j) => { sel[c] = picks.sf_win[j]; });
  sel[S.finalcode] = picks.champ;
  const order = [...S.r32codes, ...S.r16codes, ...S.qfcodes, ...S.sfcodes, S.finalcode];
  let bits = "";
  for (const c of order) {
    const [a, b] = teamsFor(S, c, sel);
    if (sel[c] !== a && sel[c] !== b) throw new Error("bracket is inconsistent at " + c);
    bits += sel[c] === a ? "0" : "1";
  }
  const payload = { v: 1, b: bits, n: String(picks.entrant || ""), t: picks.tiebreaker | 0 };
  return b64url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeShare(str, topology) {
  const payload = JSON.parse(new TextDecoder().decode(unb64url(str)));
  if (payload.v !== 1) throw new Error("unsupported share-link version");
  if (!/^[01]{31}$/.test(payload.b)) throw new Error("malformed share link");
  const S = deriveStructure(topology);
  const order = [...S.r32codes, ...S.r16codes, ...S.qfcodes, ...S.sfcodes, S.finalcode];
  const sel = {};
  order.forEach((c, i) => {
    const [a, b] = teamsFor(S, c, sel);
    sel[c] = payload.b[i] === "0" ? a : b;
  });
  return buildPicks(topology, sel, String(payload.n || "shared bracket").slice(0, 40), payload.t);
}
```

### Step 2 — view-only rendering in main.js

1. Import: `import { encodeShare, decodeShare } from "./share.js";`
2. Add a module flag `let VIEW_ONLY = false;`
3. Extend `showDashboard(picks, isDemo = false, isShared = false)`:
   - **Only call `resetWhatIfsIfChanged(picks)` when `!isDemo && !isShared`.** (Today the
     demo path wipes the user's what-if overrides — see the hardening plan; do not
     replicate that bug for shared views. What-if edits made *while viewing* a shared
     bracket may bleed into the viewer's own hash-namespace otherwise — skipping the
     reset keeps the viewer's data intact, which is the priority.)
   - Set `VIEW_ONLY = isShared`; when shared, set
     `$("#vb-name").textContent = picks.entrant + " (shared)"` and show the
     "Save as mine" button, hide "Share link" (sharing a share is fine via the URL bar).
4. In the startup IIFE, **before** `const saved = loadPicks();`:

```js
const m = location.hash.match(/^#b=([A-Za-z0-9_-]+)$/);
if (m && TOPO) {
  try {
    const shared = validateAgainstTopology(decodeShare(m[1], TOPO), TOPO);
    showDashboard(shared, false, true);
    return;                     // do NOT fall through to the saved bracket
  } catch (e) {
    showError(["That share link couldn't be read — it may be truncated. " + (e.message || "")]);
    history.replaceState(null, "", location.pathname + location.search);
  }
}
```

Note: `TOPO` can be null if `loadData()` failed — the `&& TOPO` guard matters.
5. Wire buttons in `wire()`:
   - `#vb-share`: `const p = loadPicks(); if (p) { const url = location.origin + location.pathname + "#b=" + encodeShare(p, TOPO); navigator.clipboard?.writeText(url).then(ok, fallback) }` — fallback is `window.prompt("Copy your share link:", url)` (clipboard API requires HTTPS/localhost and can be denied).
   - `#vb-saveshared` (hidden by default): on click, take the currently shown shared picks (keep them in a module var `SHOWN`), `savePicks(SHOWN)`, `history.replaceState(null,"",location.pathname)`, re-show as own (`showDashboard(SHOWN)`).
   - "Back to my bracket" = existing `New bracket` semantics are wrong here; simplest:
     `#vb-back` button (shown only in shared mode) that clears the hash via
     `history.replaceState` and calls `location.reload()` — cheap and correct.

### Step 3 — index.html

In `#viewerbar`, add (order: after `vb-export`):

```html
<button id="vb-share" title="Copy a link that opens this bracket for anyone">Share link</button>
<button id="vb-saveshared" hidden title="Keep this shared bracket as yours on this device">Save as mine</button>
<button id="vb-back" hidden title="Return to your own saved bracket">Back to my bracket</button>
```

### Step 4 — tests/share.mjs

Model on `tests/builder.mjs` (pure Node, repo-local data only):

1. Round-trip the demo bracket: `decodeShare(encodeShare(demo, topo), topo)` deep-equals
   demo on `entrant, tiebreaker, r32, r16_win, qf_win, sf_win, champ, runner`, and
   `renderDashboard` output is byte-identical for both.
2. Fuzz: 500 random valid brackets (copy `randSel` from `tests/scoring.mjs`, then
   `buildPicks`) — round-trip each, assert deep equality of the pick fields.
3. Entrant edge: entrant `"Zoë 🚀 & Bob"` survives the round trip (TextEncoder handles
   UTF-8; this is the test that catches naive `btoa(JSON.stringify(...))`).
4. Malformed inputs: truncated string, valid b64 of garbage JSON, `b` of 30 chars —
   each must throw (assert with try/catch), never return a partial picks object.

Note for the test harness: `btoa/atob` exist in Node ≥ 16 globals — no polyfill needed.

## Edge cases a weaker model would miss

- **Naive `btoa(JSON.stringify(p))` throws on non-Latin1** (emoji/accented entrant
  names). The TextEncoder→bytes→base64 path is mandatory, not optional.
- **Decode must replay picks in round order** — `teamsFor` for an R16 match reads the
  two R32 winners out of `sel`; decoding out of order yields nulls.
- **The shared view must not call `savePicks` or `resetWhatIfsIfChanged`** — otherwise
  opening someone's link destroys the visitor's own bracket state. This is the whole
  reason `isShared` exists.
- **Guard `TOPO` being null** (data fetch failed): decoding requires topology; show the
  landing rather than throwing at startup.
- **`history.replaceState` after a failed decode** — otherwise every reload re-shows the
  error box forever.
- **Entrant length cap (40)** on decode: the URL is attacker-controllable input; the name
  is rendered via `esc()` everywhere in render.js (XSS-safe), but an unbounded string is
  still a layout/`localStorage` griefing vector via "Save as mine".
- **`picks.tiebreaker | 0`** coerces NaN/absent to 0, matching the parser's behavior.
- **Demo is not shareable as-is**: share reads `loadPicks()` (the saved bracket), which
  is correct — the demo path never saves, so the button silently no-ops there. Fine; the
  demo already has its own entry point.

## Acceptance criteria

1. `node tests/share.mjs` passes all four groups; add it to `npm test` in package.json.
2. Manual: load your bracket → Share link → paste URL in a private/incognito window →
   the full dashboard renders with "(shared)" in the viewer bar; DevTools →
   `localStorage` shows **no** `wcb.fan.picks.v1` key was created.
3. In the incognito window: "Save as mine" → reload → the bracket now auto-opens as the
   saved one, hash gone from the URL.
4. In a browser that already has a different saved bracket: open the share URL → shared
   bracket shows; click "Back to my bracket" → your own bracket returns, with any
   what-if overrides you had set still intact.
5. Corrupt the hash (`#b=abc`) → friendly error box, landing visible, URL cleaned.
6. URL length for the demo bracket is under 200 characters.
