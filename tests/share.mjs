// Share-link test: encode/decode round-trips exactly
// (dev-docs/[01]-zero-backend-social-loop/BRIEF.md invariants 1 & 8),
// including emoji names, and malformed links always throw — never a partial bracket.
// Run: node tests/share.mjs
import fs from "fs";
import { encodeShare, decodeShare } from "../docs/js/share.js";
import { deriveStructure, teamsFor, buildPicks } from "../docs/js/builder.js";
import { renderDashboard } from "../docs/js/render.js";

const L = (n) => JSON.parse(fs.readFileSync(new URL("../docs/data/" + n, import.meta.url)));
const topo = L("topology.json"), demo = L("demo-picks.json"), live = L("results.json");
const S = deriveStructure(topo);

let fails = 0, n = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(name, cond, detail = "") {
  n++;
  if (cond) { console.log("  ok   " + name); return; }
  fails++; console.log("  DIFF " + name + (detail ? "  " + detail : ""));
}

const PICK_FIELDS = ["entrant", "tiebreaker", "r32", "r16_win", "qf_win", "sf_win", "champ", "runner"];
function roundTrips(picks, label, quiet = false) {
  const back = decodeShare(encodeShare(picks, topo), topo);
  const bad = PICK_FIELDS.filter(k => !eq(back[k], picks[k]));
  if (!quiet || bad.length)
    check(label, bad.length === 0, bad.length ? "fields differ: " + bad.join(",") : "");
  return bad.length === 0;
}

// 1. demo bracket round-trips, and renders byte-identically
roundTrips(demo, "demo round-trip");
{
  const back = decodeShare(encodeShare(demo, topo), topo);
  check("demo renders identically", renderDashboard(back, live, topo) === renderDashboard(demo, live, topo));
}

// 2. fuzz: 500 random valid brackets
function randSel() {
  const sel = {};
  for (const round of S.rounds) for (const c of round.codes) {
    const [a, b] = teamsFor(S, c, sel); sel[c] = Math.random() < 0.5 ? a : b;
  }
  return sel;
}
let fuzzOK = true;
for (let i = 0; i < 500; i++) {
  const p = buildPicks(topo, randSel(), "Fuzz #" + i, i % 9);
  if (!roundTrips(p, "fuzz#" + i, true)) fuzzOK = false;
}
check("fuzz 500 random brackets", fuzzOK);

// 3. emoji / non-Latin1 names survive (catches naive btoa(JSON) which throws here)
{
  const p = buildPicks(topo, randSel(), "Zoë 🚀 & Bob", 3);
  roundTrips(p, "emoji entrant name");
}

// 4. alias changes only the display name, never the picks (SPEC invariant 8)
{
  const aliased = decodeShare(encodeShare({ ...demo, entrant: "E.L. 🦊" }, topo), topo);
  check("alias: name applied", aliased.entrant === "E.L. 🦊");
  const same = PICK_FIELDS.filter(k => k !== "entrant").every(k => eq(aliased[k], demo[k]));
  check("alias: picks unchanged", same);
}

// 5. malformed links throw cleanly (never a partial picks object)
const bad = [
  ["truncated", encodeShare(demo, topo).slice(0, 10)],
  ["garbage json", Buffer.from("not json at all").toString("base64url")],
  ["short bitstring", Buffer.from(JSON.stringify({ v: 1, b: "0101", n: "x", t: 0 })).toString("base64url")],
  ["future version", Buffer.from(JSON.stringify({ v: 9, b: "0".repeat(31), n: "x", t: 0 })).toString("base64url")],
];
for (const [label, s] of bad) {
  let threw = false;
  try { decodeShare(s, topo); } catch (e) { threw = true; }
  check("throws on " + label, threw);
}

console.log(fails ? `\nFAILED: ${fails}/${n}` : `\nSHARE OK: round-trip, fuzz, alias and malformed-link handling all pass (${n} checks)`);
process.exit(fails ? 1 : 0);
