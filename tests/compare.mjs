// Leaderboard test: the pure standings/diff core
// (dev-docs/[01]-zero-backend-social-loop/BRIEF.md invariants 4, 5, 6).
// Crucially, the leaderboard's "confirmed" number is asserted equal to the number the
// dashboard itself renders for the same bracket — the two can never drift apart.
// Run: node tests/compare.mjs
import fs from "fs";
import { standings, diffPicks } from "../docs/js/compare.js";
import { deriveStructure, teamsFor, buildPicks } from "../docs/js/builder.js";
import { renderDashboard } from "../docs/js/render.js";

const data = (n) => JSON.parse(fs.readFileSync(new URL("../docs/data/" + n, import.meta.url)));
const fixture = (n) => JSON.parse(fs.readFileSync(new URL("./fixtures/" + n, import.meta.url)));
const topo = data("topology.json"), demo = data("demo-picks.json"), live = fixture("results.frozen.json");
const S = deriveStructure(topo);
const RES = live.res;

let fails = 0, n = 0;
function check(name, cond, detail = "") {
  n++;
  if (cond) { console.log("  ok   " + name); return; }
  fails++; console.log("  DIFF " + name + (detail ? "  " + detail : ""));
}

function selOf(picks) {
  const sel = {};
  picks.r32.forEach(m => { sel[m[0]] = m[4]; });
  S.r16codes.forEach((c, j) => { sel[c] = picks.r16_win[j]; });
  S.qfcodes.forEach((c, j) => { sel[c] = picks.qf_win[j]; });
  S.sfcodes.forEach((c, j) => { sel[c] = picks.sf_win[j]; });
  sel[S.finalcode] = picks.champ;
  return sel;
}

// 1. leaderboard "confirmed" == the dashboard's own scConfirmed for the same bracket
{
  const rows = standings([{ picks: demo, you: true }], live, topo);
  const html = renderDashboard(demo, live, topo);
  const conf = +/<span id="scConfirmed">(\d+)<\/span>/.exec(html)[1];
  const attain = +/<b id="scMax"[^>]*>(\d+)<\/b>/.exec(html)[1];
  check("standings row count", rows.length === 1);
  check("confirmed matches dashboard", rows[0].conf === conf, `${rows[0].conf} vs ${conf}`);
  check("attainable matches dashboard", rows[0].attain === attain, `${rows[0].attain} vs ${attain}`);
  check("you flag + name", rows[0].you === true && rows[0].name === demo.entrant);
}

// 2. diff: flipping the (undecided) Final pick shows exactly one 16-pt difference
{
  const sel = selOf(demo);
  const other = S.sfcodes.map(c => sel[c]).find(t => t !== demo.champ);
  sel[S.finalcode] = other;
  const rival = buildPicks(topo, sel, "Rival", 2);
  const ds = diffPicks(demo, rival, live, topo);
  check("final flip -> exactly one diff", ds.length === 1, JSON.stringify(ds));
  check("final flip -> 16 pts, final round", ds.length === 1 && ds[0].pts === 16 && ds[0].round === "final");
  check("final flip -> teams right", ds.length === 1 && ds[0].mine === demo.champ && ds[0].theirs === other);
}

// 3. diff excludes DECIDED matches: flip a decided R32 pick whose team demo didn't
//    advance (safe: no downstream picks depended on it) -> zero differences
{
  const target = demo.r32.find(m => (m[0] in RES) && !demo.r16_win.includes(m[4]));
  check("found a safe decided R32 match", !!target);
  if (target) {
    const sel = selOf(demo);
    sel[target[0]] = sel[target[0]] === target[2] ? target[3] : target[2];
    const rival = buildPicks(topo, sel, "Rival", 2);
    const ds = diffPicks(demo, rival, live, topo);
    check("decided-match flip -> no diffs", ds.length === 0, JSON.stringify(ds));
  }
}

// 4. ranking: equal confirmed -> attainable breaks the tie; then name asc
{
  const sel = selOf(demo);
  const other = S.sfcodes.map(c => sel[c]).find(t => t !== demo.champ);
  sel[S.finalcode] = other;                        // same past, different (undecided) future
  const rivalPicks = buildPicks(topo, sel, "Aaron", 2);
  const rows = standings([{ picks: demo, you: true }, { picks: rivalPicks }], live, topo);
  check("two rows", rows.length === 2);
  const sortedOK = rows[0].conf > rows[1].conf ||
    (rows[0].conf === rows[1].conf && (rows[0].attain > rows[1].attain ||
      (rows[0].attain === rows[1].attain && rows[0].name <= rows[1].name)));
  check("rank order respects conf desc, attain desc, name asc", sortedOK,
    JSON.stringify(rows.map(r => [r.name, r.conf, r.attain])));
}

// 5. diff ordering: two flips (one SF=8, one undecided R32/r16-level if any, else QF=4)
{
  const sel = selOf(demo);
  // flip one QF slot's effect: change an SF pick to the other feeder's winner
  const sfCode = S.sfcodes[0];
  const [fa, fb] = topo.ko_feed[sfCode];
  // flip the final too (16) — after repair-free reselect: set champ to sf winner of other side
  const other = S.sfcodes.map(c => sel[c]).find(t => t !== demo.champ);
  sel[S.finalcode] = other;
  const qfAlt = (() => {   // alternative winner for one QF match (an undecided slot)
    const qc = S.qfcodes[0];
    const [a, b] = teamsFor(S, qc, sel);
    return { qc, alt: sel[qc] === a ? b : a };
  })();
  sel[qfAlt.qc] = qfAlt.alt;
  // repair downstream: SF/final may now reference a dropped team — rebuild via repair-lite
  for (const r of [S.sfcodes, [S.finalcode]].flat()) {
    // if selection no longer valid, pick the first available team
    const [a, b] = teamsFor(S, r, sel);
    if (sel[r] !== a && sel[r] !== b) sel[r] = a;
  }
  const rival = buildPicks(topo, sel, "Rival", 2);
  const ds = diffPicks(demo, rival, live, topo);
  const sorted = ds.every((d, i) => i === 0 || ds[i - 1].pts >= d.pts);
  check("diff sorted by points at stake desc", sorted, JSON.stringify(ds.map(d => [d.code, d.pts])));
}

console.log(fails ? `\nFAILED: ${fails}/${n}` : `\nCOMPARE OK: standings tie to the dashboard, diffs cover undecided slots only (${n} checks)`);
process.exit(fails ? 1 : 0);
