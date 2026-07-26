// builder.js — interactive in-browser bracket builder. For people who don't have the
// Excel: click winners round by round and get the same picks object the parser produces,
// then the dashboard renders it. Structure/order are derived from data/topology.json so
// the output matches an uploaded workbook exactly.

// ── pure core (unit-testable) ────────────────────────────────────────────────
import { flagImg } from "./flags.js";

export function deriveStructure(topology) {
  const r32 = topology.r32.map(m => ({ code: m[0], date: m[1], a: m[2], b: m[3] }));
  const feedToCode = {};
  for (const k in topology.ko_feed) feedToCode[topology.ko_feed[k].join(",")] = k;
  const codeFor = (fa, fb) => feedToCode[fa + "," + fb] || feedToCode[fb + "," + fa];
  const r32codes = r32.map(m => m.code);
  const r16codes = [], qfcodes = [], sfcodes = [];
  for (let j = 0; j < 8; j++) r16codes.push(codeFor(r32codes[2 * j], r32codes[2 * j + 1]));
  for (let j = 0; j < 4; j++) qfcodes.push(codeFor(r16codes[2 * j], r16codes[2 * j + 1]));
  for (let j = 0; j < 2; j++) sfcodes.push(codeFor(qfcodes[2 * j], qfcodes[2 * j + 1]));
  const finalcode = codeFor(sfcodes[0], sfcodes[1]);
  const rounds = [
    { key: "r32", label: "Round of 32", codes: r32codes },
    { key: "r16", label: "Round of 16", codes: r16codes },
    { key: "qf", label: "Quarterfinals", codes: qfcodes },
    { key: "sf", label: "Semifinals", codes: sfcodes },
    { key: "final", label: "The Final", codes: [finalcode] },
  ];
  return { r32, seed: topology.seed || {}, koFeed: topology.ko_feed, rounds,
    r32codes, r16codes, qfcodes, sfcodes, finalcode };
}

// The two teams in a match, given current selections (feeder winners for KO rounds).
export function teamsFor(S, code, sel) {
  const m = S.r32.find(x => x.code === code);
  if (m) return [m.a, m.b];
  const [fa, fb] = S.koFeed[code];
  return [sel[fa] || null, sel[fb] || null];
}

// After a pick changes, drop any downstream selection whose team no longer advances.
export function repair(S, sel) {
  for (let r = 1; r < S.rounds.length; r++) {
    for (const code of S.rounds[r].codes) {
      const [a, b] = teamsFor(S, code, sel);
      if (sel[code] && sel[code] !== a && sel[code] !== b) delete sel[code];
    }
  }
  return sel;
}

export function buildPicks(topology, sel, entrant, tiebreaker) {
  const S = deriveStructure(topology);
  const r32 = S.r32.map(m => [m.code, m.date, m.a, m.b, sel[m.code]]);
  const r16_win = S.r16codes.map(c => sel[c]);
  const qf_win = S.qfcodes.map(c => sel[c]);
  const sf_win = S.sfcodes.map(c => sel[c]);
  const champ = sel[S.finalcode];
  const runner = sf_win.find(t => t && t !== champ) || "";
  const tb = parseInt(String(tiebreaker).replace(/[^\d-]/g, ""), 10);
  return {
    entrant: String(entrant || "").trim(), tiebreaker: isNaN(tb) ? 0 : tb,
    freebie_match: "M73", r32, r16_win, qf_win, sf_win, champ, runner, seed: S.seed,
  };
}

// ── interactive UI ───────────────────────────────────────────────────────────
const DRAFT = "wcb.fan.draft.v1";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function openBuilder(topology, onDone, onCancel, resume = true) {
  const S = deriveStructure(topology);
  let sel = {}, step = 0, entrant = "", tiebreaker = "";
  if (resume) {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (d) { sel = d.sel || {}; step = d.step || 0; entrant = d.entrant || ""; tiebreaker = d.tiebreaker || ""; repair(S, sel); }
    } catch (e) {}
  }
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ sel, step, entrant, tiebreaker })); } catch (e) {} };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch (e) {} };

  const host = document.getElementById("builder");
  host.hidden = false;
  const inner = host.querySelector(".bld-inner");
  let advancing = false, advToken = 0;
  const seedTag = (t) => S.seed[t] ? `<span class="seed">${esc(S.seed[t])}</span>` : "";
  const roundDone = (r) => S.rounds[r].codes.every(c => sel[c]);
  const totalPicked = () => S.rounds.reduce((n, r) => n + r.codes.filter(c => sel[c]).length, 0);
  // first round that still has an unmade pick — also the furthest round you can jump to
  const firstOpen = () => { for (let r = 0; r < S.rounds.length; r++) if (!roundDone(r)) return r; return S.rounds.length - 1; };
  const SHORT = ["32", "16", "QF", "SF", "F"];
  let nodes = null;

  function ensureShell() {
    if (nodes) return;
    inner.innerHTML = `
      <div class="bld-head">
        <div><div class="bld-title">Build your bracket</div><div class="bld-sub">Tap who you think wins \u2014 winners move on for you.</div></div>
        <button class="bld-x" id="bld-cancel" title="Close">\u2715</button>
      </div>
      <div class="bld-steps" id="bld-steps"></div>
      <div class="bld-roundhead" id="bld-roundhead"></div>
      <div class="bld-body" id="bld-body"></div>
      <div class="bld-foot" id="bld-foot"></div>`;
    nodes = {
      steps: inner.querySelector("#bld-steps"),
      roundHead: inner.querySelector("#bld-roundhead"),
      body: inner.querySelector("#bld-body"),
      foot: inner.querySelector("#bld-foot"),
    };
  }

  function matchCard(code, nextUp) {
    const [a, b] = teamsFor(S, code, sel);
    const w = sel[code], m = S.r32.find(x => x.code === code), fa = m ? null : S.koFeed[code];
    const teamBtn = (t, feeder) => {
      if (!t) return `<div class="bld-team tbd">Winner of ${esc(feeder)}</div>`;
      const cls = w === t ? " picked" : (w ? " dim" : "");
      return `<button class="bld-team${cls}" data-code="${esc(code)}" data-team="${esc(t)}">` +
        `${flagImg(t)}${seedTag(t)}<span class="tname">${esc(t)}</span><span class="bld-adv">through \u2713</span></button>`;
    };
    // friendly context instead of the internal match code: the date for R32, nothing later
    const tag = m ? `<div class="bld-mc">${esc(m.date)}</div>` : "";
    return `<div class="bld-match${w ? " done" : ""}${nextUp ? " next-up" : ""}">${tag}` +
      teamBtn(a, fa ? fa[0] : "") + `<div class="bld-vs">or</div>` + teamBtn(b, fa ? fa[1] : "") + `</div>`;
  }

  function render() {
    ensureShell();
    const maxNav = firstOpen();
    if (step > maxNav) step = maxNav;                       // never sit on a locked round
    const r = S.rounds[step], isFinal = step === S.rounds.length - 1;
    const complete = roundDone(step), picked = r.codes.filter(c => sel[c]).length;
    const steps = S.rounds.map((rr, i) =>
      `<span class="bld-dot${i === step ? " on" : ""}${roundDone(i) ? " ok" : ""}${i > maxNav ? " locked" : ""}" data-step="${i}" title="${esc(rr.label)}">${SHORT[i]}</span>`).join('<span class="bld-sep"></span>');
    const nextCode = isFinal ? null : r.codes.find(c => !sel[c]);   // the match to guide the eye to
    const grid = `<div class="bld-grid${isFinal ? " final" : ""}">${r.codes.map(c => matchCard(c, c === nextCode)).join("")}</div>`;
    const champ = sel[S.finalcode];
    const finishPanel = isFinal ? `
      <div class="bld-finish">
        <div class="bld-fh">${champ ? "\u{1F3C6} Your champion: <b>" + esc(champ) + "</b>" : "\u{1F3C6} Tap your winner above to crown your champion"}</div>
        <label class="bld-field"><span>Your name</span><input id="bld-name" type="text" maxlength="40" placeholder="e.g. Alex" value="${esc(entrant)}"></label>
        <label class="bld-field"><span>Tiebreaker <small>(total goals in the Final)</small></span><input id="bld-tb" type="number" min="0" max="20" placeholder="e.g. 3" value="${esc(tiebreaker)}"></label>
        <div class="bld-note">\u{1F512} Saves right here in <b>this browser</b> \u2014 nothing is uploaded. Want a backup or another device? Tap <b>Back up my pool</b> on your dashboard; keep that private file safe.</div>
      </div>` : "";
    const status = complete
      ? `<span class="bld-ok-tag">\u2713 ${isFinal ? "bracket complete" : esc(r.label) + " done"}</span>`
      : `<span class="bld-rprog">${picked} of ${r.codes.length} picked</span>`;
    nodes.steps.innerHTML = steps;
    nodes.roundHead.innerHTML = `<b>${esc(isFinal ? "The Final" : r.label)}</b> ${status}`;
    nodes.body.innerHTML = `${grid}${finishPanel}`;
    nodes.foot.innerHTML = `
      <button class="bld-btn ghost" id="bld-back"${step === 0 ? " disabled" : ""}>\u2190 Back</button>
      <div class="bld-prog"><i style="transform:scaleX(${totalPicked() / 31})"></i></div>
      <span class="bld-count">${totalPicked()}/31</span>
      ${isFinal
        ? `<button class="bld-btn go" id="bld-done"${champ ? "" : " disabled"}>See my dashboard \u2192</button>`
        : `<button class="bld-btn go${complete ? " ready" : ""}" id="bld-next"${complete ? "" : " disabled"}>Next \u2192</button>`}
    `;
    const nu = inner.querySelector(".bld-match.next-up");
    if (nu && totalPicked() > 0) try { nu.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
  }

  function pick(code, team) {
    if (advancing) return;
    sel[code] = team; repair(S, sel); saveDraft();
    if (roundDone(step) && step < S.rounds.length - 1) {     // round finished -> glide to the next
      advancing = true; const my = ++advToken; render();
      setTimeout(() => {
        if (my !== advToken) return;                         // cancelled by Back / a round jump
        advancing = false; step = firstOpen(); render();
        try { host.scrollTop = 0; } catch (e) {}
      }, 680);
    } else render();
  }
  function goTo(s) { advToken++; advancing = false; step = Math.max(0, Math.min(s, firstOpen())); render(); }

  function wire() {
    const onClick = (e) => {
      const team = e.target.closest(".bld-team[data-team]");
      if (team) { pick(team.dataset.code, team.dataset.team); return; }
      const dot = e.target.closest(".bld-dot:not(.locked)");
      if (dot) { goTo(+dot.dataset.step); return; }
      if (e.target.closest("#bld-back")) { goTo(step - 1); return; }
      if (e.target.closest("#bld-next")) { if (roundDone(step)) goTo(step + 1); return; }
      if (e.target.closest("#bld-cancel")) { close(); if (onCancel) onCancel(); return; }
      if (e.target.closest("#bld-done")) finish();
    };
    const onInput = (e) => {
      const t = e.target;
      if (t && t.id === "bld-name") { entrant = t.value; saveDraft(); }
      if (t && t.id === "bld-tb") { tiebreaker = t.value; saveDraft(); }
    };
    inner.addEventListener("click", onClick);
    inner.addEventListener("input", onInput);
    wire.dispose = () => {
      inner.removeEventListener("click", onClick);
      inner.removeEventListener("input", onInput);
      wire.dispose = null;
    };
  }

  function finish() {
    const problems = [];
    if (totalPicked() < 31) problems.push("Pick a winner in every match first.");
    if (!String(entrant).trim()) problems.push("Add your name.");
    if (problems.length) { alert(problems.join("\n")); return; }
    const picks = buildPicks(topology, sel, entrant, tiebreaker);
    clearDraft(); close();
    onDone(picks);
  }
  function close() {
    if (wire.dispose) wire.dispose();
    nodes = null;
    host.hidden = true;
    inner.innerHTML = "";
  }

  step = firstOpen();
  wire();
  render();
}
