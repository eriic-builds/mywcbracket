// render.js — the wc26-bracket render engine, ported from Python (build_dashboard.py)
// to run 100% client-side. Pure function of (picks, live, topology): given a parsed
// bracket + live results + the fixed topology, it returns the dashboard HTML string.
// Kept faithful to the Python so the golden test (tests/) can prove parity.

import { deriveBracketTree } from "./bracket-tree.js";
import { flagImg, teamCode3 } from "./flags.js";

const DASH = "\u2013";
const LINKEDIN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>';
const GITHUB_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>';
const BRACKET_TREE_CACHE = new Map();
const STATE_CACHE = new WeakMap();
const DASHBOARD_HTML_CACHE = new WeakMap();

function picksMemoSignature(picks) {
  return [
    picks?.entrant,
    picks?.tiebreaker,
    picks?.freebie_match,
    picks?.champ,
    picks?.runner,
    (picks?.r16_win || []).join(","),
    (picks?.qf_win || []).join(","),
    (picks?.sf_win || []).join(","),
    (picks?.r32 || []).map(match => `${match[0]}:${match[4]}`).join("|"),
  ].join("||");
}

function liveMemoSignature(live) {
  const resKeys = Object.keys(live?.res || {}).sort();
  const koKeys = Object.keys(live?.ko_fix || {}).sort();
  return [
    live?.refreshed || "",
    resKeys.length,
    koKeys.length,
    resKeys[0] || "",
    resKeys[resKeys.length - 1] || "",
    koKeys[0] || "",
    koKeys[koKeys.length - 1] || "",
  ].join("||");
}

function memoizedState(picks, live, topology) {
  if (!picks || !live || !topology) return computeState(picks, live, topology);
  let byLive = STATE_CACHE.get(picks);
  if (!byLive) {
    byLive = new WeakMap();
    STATE_CACHE.set(picks, byLive);
  }
  let byTopology = byLive.get(live);
  if (!byTopology) {
    byTopology = new WeakMap();
    byLive.set(live, byTopology);
  }
  const cached = byTopology.get(topology);
  const nextPicksSig = picksMemoSignature(picks);
  const nextLiveSig = liveMemoSignature(live);
  if (cached && cached.picksSig === nextPicksSig && cached.liveSig === nextLiveSig) {
    return cached.state;
  }
  const state = computeState(picks, live, topology);
  byTopology.set(topology, {
    picksSig: nextPicksSig,
    liveSig: nextLiveSig,
    state,
  });
  return state;
}

function bracketTreeKey(koFeed) {
  return Object.keys(koFeed)
    .sort((left, right) => left.localeCompare(right))
    .map(code => `${code}:${koFeed[code].join(",")}`)
    .join("|");
}

function cachedBracketTree(koFeed) {
  const key = bracketTreeKey(koFeed);
  if (!BRACKET_TREE_CACHE.has(key)) {
    BRACKET_TREE_CACHE.set(key, deriveBracketTree({ ko_feed: koFeed }));
  }
  return BRACKET_TREE_CACHE.get(key);
}

function localRefreshed(utcIso) {
  try {
    const date = new Date(utcIso);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateParts = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone,
    }).formatToParts(date);
    const part = (type) => dateParts.find(item => item.type === type).value;
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
    const zone = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone,
    }).formatToParts(date).find(item => item.type === "timeZoneName").value;
    return `${part("month")} ${part("day")}, ${part("year")} \u00b7 ${time} ${zone}`;
  } catch {
    return utcIso;
  }
}

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const codeNum = (c) => parseInt(c.slice(1), 10);
const byCode = (a, b) => codeNum(a) - codeNum(b);

// ── country nickname / flag helpers (mirror the Python) ───────────────────────
const STORY_NICK = {
  "England":"\u{1F981}","France":"\u{1F413}","Netherlands":"\u{1F7E0}","Belgium":"\u{1F608}",
  "Germany":"\u{1F985}","Spain":"\u{1F402}","Australia":"\u{1F998}","Canada":"\u{1F341}",
  "Ivory Coast":"\u{1F418}","DR Congo":"\u{1F406}","Japan":"\u2694\uFE0F","Mexico":"\u{1F335}",
  "United States":"\u{1F5FD}","Algeria":"\u{1F98A}","Colombia":"\u2615","Cape Verde":"\u{1F988}",
  "Bosnia & Herz.":"\u{1F409}","Ghana":"\u2B50","Brazil":"\u{1F49B}","Argentina":"\u{1F499}",
  "Egypt":"\u{1F3FA}",
};
const STORY_ISO2 = {
  "Argentina":"AR","Australia":"AU","Austria":"AT","Belgium":"BE","Bosnia & Herz.":"BA","Brazil":"BR",
  "Canada":"CA","Cape Verde":"CV","Colombia":"CO","Croatia":"HR","DR Congo":"CD","Ecuador":"EC",
  "Egypt":"EG","France":"FR","Germany":"DE","Ghana":"GH","Ivory Coast":"CI","Japan":"JP","Mexico":"MX",
  "Morocco":"MA","Netherlands":"NL","Norway":"NO","Paraguay":"PY","Portugal":"PT","Senegal":"SN",
  "South Africa":"ZA","Spain":"ES","Sweden":"SE","Switzerland":"CH","United States":"US","Algeria":"DZ",
};
function storyFlag(iso2) {
  if (!iso2 || iso2.length !== 2 || !/^[A-Za-z]+$/.test(iso2)) return "";
  return [...iso2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join("");
}
function teamEmoji(name) {
  return STORY_NICK[name] || storyFlag(STORY_ISO2[name] || "") || "\u26BD";
}

const WC_HISTORY = {
  "Brazil":[5,"Champions \u00d75 (last 2002)"],"Germany":[4,"Champions \u00d74 (last 2014)"],
  "Argentina":[3,"Champions \u00d73 (2022)"],"France":[2,"Champions \u00d72 (2018)"],
  "Spain":[1,"Champions (2010)"],"England":[1,"Champions (1966)"],
  "Netherlands":[0,"Runners-up \u00d73"],"Croatia":[0,"Runners-up (2018)"],"Sweden":[0,"Runners-up (1958)"],
  "Portugal":[0,"Third place (1966)"],"United States":[0,"Third place (1930)"],"Belgium":[0,"Third place (2018)"],
  "Austria":[0,"Third place (1954)"],"Morocco":[0,"Fourth place (2022)"],"Mexico":[0,"Quarterfinals (1970, 1986)"],
  "Switzerland":[0,"Quarterfinals"],"Colombia":[0,"Quarterfinals (2014)"],"Ghana":[0,"Quarterfinals (2010)"],
  "Japan":[0,"Round of 16 \u00d74"],"Senegal":[0,"Quarterfinals (2002)"],"Australia":[0,"Round of 16 (2006, 2022)"],
  "Ecuador":[0,"Round of 16 (2006)"],"Norway":[0,"Round of 16 (1998)"],"Ivory Coast":[0,"Group stage \u00d73"],
  "Paraguay":[0,"Quarterfinals (2010)"],"Egypt":[0,"Group stage"],"Canada":[0,"First finals since 1986"],
  "DR Congo":[0,"Debut era"],"Cape Verde":[0,"World Cup debut"],"Bosnia & Herz.":[0,"Group stage (2014)"],
  "Algeria":[0,"Round of 16 (2014)"],"South Africa":[0,"Hosts 2010"],
};

// ── derive all state from (picks, live, topology) — mirrors the Python globals ──
export function computeState(picks, live, topology) {
  const D = {};
  D.ENTRANT = picks.entrant; D.TIEBREAKER = picks.tiebreaker; D.FREEBIE_MATCH = picks.freebie_match;
  D.SEED = topology.seed || picks.seed || {};
  D.R32 = picks.r32.map(r => r.slice(0, 5));         // [code,date,a,b,pick]
  D.R16_WIN = picks.r16_win; D.QF_WIN = picks.qf_win; D.SF_WIN = picks.sf_win;
  D.CHAMP = picks.champ; D.RUNNER = picks.runner;
  D.REFRESHED = live.refreshed; D.CREDIT = "Built with Microsoft Cowork, GitHub Copilot, and pure vibes";
  D.SYNC_URL = topology.sync_url || "";
  D.RES = {}; for (const k in live.res) D.RES[k] = live.res[k];
  D.KO_FIX = {}; for (const k in (live.ko_fix || {})) D.KO_FIX[k] = live.ko_fix[k];
  D.AUTO_HL = (live.auto_hl || []).map(e => e.slice());
  D.KO_FEED = {}; for (const k in topology.ko_feed) D.KO_FEED[k] = topology.ko_feed[k];
  D.KO_DATES = topology.ko_dates;
  D.R32_TIMES = topology.r32_times || {};
  D.R16_FIX = (topology.r16_fix || []).map(r => r.slice());
  D.KO_CITY = topology.ko_city || {};
  D.KO_WHEN = topology.ko_when || {};
  D.POINTS_MAX = 80;
  D.KO_ROUND_ORDER = [
    ["Round of 16", "r16", [89,90,91,92,93,94,95,96].map(n => "M" + n)],
    ["Quarterfinals", "qf", [97,98,99,100].map(n => "M" + n)],
    ["Semifinals", "sf", ["M101", "M102"]],
    ["Final", "final", ["M104"]],
  ];

  // topology: feeder -> code
  const feedToCode = {};
  for (const k in D.KO_FEED) feedToCode[D.KO_FEED[k].join(",")] = k;
  const codeFor = (fa, fb) => feedToCode[fa + "," + fb] || feedToCode[fb + "," + fa];
  D.PICK_BY_CODE = {}; D.KO_ROUND = {};
  const deriveRound = (prev, wins, short) => {
    const codes = [];
    wins.forEach((w, j) => {
      const c = codeFor(prev[2 * j], prev[2 * j + 1]);
      D.PICK_BY_CODE[c] = w; D.KO_ROUND[c] = short; codes.push(c);
    });
    return codes;
  };
  D._r32codes = D.R32.map(m => m[0]);
  D._r16codes = deriveRound(D._r32codes, D.R16_WIN, "r16");
  D._qfcodes = deriveRound(D._r16codes, D.QF_WIN, "qf");
  D._sfcodes = deriveRound(D._qfcodes, D.SF_WIN, "sf");
  D._finalcodes = deriveRound(D._sfcodes, [D.CHAMP], "final");
  D.R16_PICK = {}; D._r16codes.forEach(c => { D.R16_PICK[c] = D.PICK_BY_CODE[c]; });
  D.CODE_OF_PICK = {};
  for (const c in D.PICK_BY_CODE) D.CODE_OF_PICK[D.KO_ROUND[c] + "|" + D.PICK_BY_CODE[c]] = c;

  const pairs = (s) => { const o = []; for (let i = 0; i < s.length; i += 2) o.push([s[i], s[i + 1]]); return o; };
  const r32_win = D.R32.map(m => m[4]);
  D.rounds = [["Round of 32", "r32", 1, D.R32.map(m => [m[2], m[3], m[4]])]];
  const build = (field, w, label, short, pts) =>
    [label, short, pts, pairs(field).map(([a, b], i) => [a, b, w[i]])];
  D.rounds.push(build(r32_win, D.R16_WIN, "Round of 16", "r16", 2));
  D.rounds.push(build(D.R16_WIN, D.QF_WIN, "Quarterfinals", "qf", 4));
  D.rounds.push(build(D.QF_WIN, D.SF_WIN, "Semifinals", "sf", 8));
  D.rounds.push(build(D.SF_WIN, [D.CHAMP], "Final", "final", 16));

  // eliminations: R32 losers + later-round losers
  D.ELIM = new Set();
  for (const [mc, dt, a, b, pk] of D.R32) {
    if (has(D.RES, mc)) { const w = D.RES[mc][2]; D.ELIM.add(w === b ? a : b); }
  }
  D.R32_ACTUAL_WINNERS = new Set(Object.keys(D.RES).map(mc => D.RES[mc][2]));
  D.r32_pick_actual = {};
  for (const m of D.R32) if (has(D.RES, m[0])) D.r32_pick_actual[m[4]] = D.RES[m[0]][2];
  for (const mc in D.KO_FEED) {
    if (has(D.RES, mc)) {
      const [fa, fb] = D.KO_FEED[mc];
      const wa = has(D.RES, fa) ? D.RES[fa][2] : null;
      const wb = has(D.RES, fb) ? D.RES[fb][2] : null;
      const w = D.RES[mc][2];
      const loser = w === wb ? wa : (w === wa ? wb : null);
      if (loser) D.ELIM.add(loser);
    }
  }
  D.KO_WINNERS_BY_ROUND = {};
  for (const mc in D.KO_FEED) {
    if (has(D.RES, mc)) {
      const r = D.KO_ROUND[mc];
      (D.KO_WINNERS_BY_ROUND[r] = D.KO_WINNERS_BY_ROUND[r] || new Set()).add(D.RES[mc][2]);
    }
  }

  // scoring helpers (bound to D)
  const PREV_ROUND = { r16: "r32", qf: "r16", sf: "qf", final: "sf" };
  const PREV_OF = { r16: "r32", qf: "r16", sf: "qf", final: "sf", champion: "final" };
  const NEXT_OF = { r32: "r16", r16: "qf", qf: "sf", sf: "final", final: "champion" };
  D.actual_advancer = (short, team) => {
    const prev = PREV_ROUND[short]; if (!prev) return null;
    if (prev === "r32") return D.r32_pick_actual[team] || null;
    const code = D.CODE_OF_PICK[prev + "|" + team];
    if (code && has(D.RES, code)) return D.RES[code][2];
    return null;
  };
  D.won_into = (team, short) => {
    const prev = PREV_OF[short];
    if (prev === "r32") return D.R32_ACTUAL_WINNERS.has(team);
    if (prev) return (D.KO_WINNERS_BY_ROUND[prev] || new Set()).has(team);
    return false;
  };
  D.reach_status = (team, short) => {
    if (D.won_into(team, short)) return "won";
    if (D.ELIM.has(team)) return "lost";
    return "pending";
  };
  D.out_at_round = (team, short) => {
    if (!D.ELIM.has(team)) return false;
    if (!D.won_into(team, short)) return false;
    const nxt = NEXT_OF[short];
    if (nxt && D.won_into(team, nxt)) return false;
    return true;
  };
  D.pick_status = (short, team, mc = null) => {
    if (short === "r32") {
      if (mc && has(D.RES, mc)) return team === D.RES[mc][2] ? "won" : "lost";
      return "pending";
    }
    const code = D.CODE_OF_PICK[short + "|" + team];
    if (code && has(D.RES, code)) return team === D.RES[code][2] ? "won" : "lost";
    return D.ELIM.has(team) ? "lost" : "pending";
  };

  // totals
  let CONF = 0, OUT = 0, LIVE = 0, r32_decided = 0, r32_correct = 0;
  const EARNED = { r32: 0, r16: 0, qf: 0, sf: 0, final: 0 };   // confirmed points banked per round
  for (const [mc, dt, a, b, pk] of D.R32) {
    const st = D.pick_status("r32", pk, mc);
    if (st === "won") { CONF += 1; r32_decided += 1; r32_correct += 1; EARNED.r32 += 1; }
    else if (st === "lost") { OUT += 1; r32_decided += 1; }
    else LIVE += 1;
  }
  for (const [label, short, pts, ms] of D.rounds.slice(1)) {
    for (const [a, b, w] of ms) {
      const st = D.pick_status(short, w);
      if (st === "won") { CONF += pts; EARNED[short] += pts; } else if (st === "lost") OUT += pts; else LIVE += pts;
    }
  }
  const roundVal = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 };
  const roundCodes = {
    r32: D._r32codes,
    r16: D._r16codes,
    qf: D._qfcodes,
    sf: D._sfcodes,
    final: D._finalcodes,
  };
  const SETTLED = {};
  for (const round in roundVal) {
    SETTLED[round] = roundCodes[round].filter(code => has(D.RES, code)).length * roundVal[round];
  }
  D.SETTLED_TOTAL = Object.values(SETTLED).reduce((total, points) => total + points, 0);
  D.CONF = CONF; D.OUT = OUT; D.LIVE = LIVE; D.ATTAIN = CONF + LIVE; D.DECIDED = CONF + OUT; D.EARNED = EARNED; D.SETTLED = SETTLED;
  D.r32_decided = r32_decided; D.r32_correct = r32_correct;
  D.N_R32 = D.R32.length; D.R32_DONE = D.R32.filter(m => has(D.RES, m[0])).length;
  D.CHAMP_ALIVE = !D.ELIM.has(D.CHAMP);
  D.CHAMP_STATUS = D.CHAMP_ALIVE ? "still alive" : "out";
  D.BUSTED = D.R32.filter(m => has(D.RES, m[0]) && D.RES[m[0]][2] !== m[4]).map(m => m[4]);
  for (const code in D.KO_FEED) {
    if (has(D.RES, code)) {
      const [fa, fb] = D.KO_FEED[code];
      const pk = D.PICK_BY_CODE[code];
      const wa = has(D.RES, fa) ? D.RES[fa][2] : null;
      const wb = has(D.RES, fb) ? D.RES[fb][2] : null;
      if (pk && (pk === wa || pk === wb) && pk !== D.RES[code][2]) D.BUSTED.push(pk);
    }
  }
  D.BUSTED_NOTE = D.BUSTED.length ? (D.BUSTED.join(" & ") + " branch" + (D.BUSTED.length > 1 ? "es" : "")) : "none yet";
  if (D.ELIM.has(D.CHAMP)) D.CHAMP_NOTE = `${D.CHAMP} is out`;
  else if (D.R32_ACTUAL_WINNERS.has(D.CHAMP)) D.CHAMP_NOTE = `Alive \u2014 ${D.CHAMP} has advanced so far`;
  else D.CHAMP_NOTE = "Your champion pick";
  D.FF_ALIVE = D.QF_WIN.filter(t => !D.ELIM.has(t)).length;

  // current-round + stage tracking
  D.ROUND_TAGS = { r32: "R32", r16: "R16", qf: "QF", sf: "SF", final: "Final" };
  D.ROUND_FULL = { r32: "Round of 32", r16: "Round of 16", qf: "Quarterfinals", sf: "Semifinals", final: "Final" };
  D.ROUND_SEQ = ["r32", "r16", "qf", "sf", "final"];
  D.ROUND_PICKS = { r16: D.R16_WIN, qf: D.QF_WIN, sf: D.SF_WIN, final: [D.CHAMP] };
  D.STAGE_ROUNDS = [["Round of 32", "r32", "Jun 28\u2013Jul 3", D.R32_DONE, D.N_R32]];
  const koDates = { r16: "Jul 4\u20137", qf: "Jul 9\u201311", sf: "Jul 14\u201315", final: "Sun Jul 19 \u00b7 MetLife" };
  for (const [label, short, codes] of D.KO_ROUND_ORDER) {
    D.STAGE_ROUNDS.push([label, short, koDates[short], codes.filter(mc => has(D.RES, mc)).length, codes.length]);
  }
  D.CURRENT_ROUND = (() => {
    for (const [l, short, dates, done, total] of D.STAGE_ROUNDS) if (total === 0 || done < total) return short;
    return D.STAGE_ROUNDS[D.STAGE_ROUNDS.length - 1][1];
  })();
  const cur = D.STAGE_ROUNDS.find(r => r[1] === D.CURRENT_ROUND) || D.STAGE_ROUNDS[0];
  D.CUR_LABEL = cur[0]; D.CUR_DONE = cur[3]; D.CUR_TOTAL = cur[4]; D.CUR_REMAIN = D.CUR_TOTAL - D.CUR_DONE;
  D.round_tally = (short) => {
    let seq;
    if (short === "r32") seq = D.R32.map(([mc, dt, a, b, pk]) => D.pick_status("r32", pk, mc));
    else seq = (D.ROUND_PICKS[short] || []).map(w => D.pick_status(short, w));
    const corr = seq.filter(s => s === "won").length;
    const dec = seq.filter(s => s !== "pending").length;
    return [corr, dec, seq.length - dec];
  };
  [D.CUR_CORR, D.CUR_DEC, D.CUR_LIVE] = D.round_tally(D.CURRENT_ROUND);
  const ci = D.ROUND_SEQ.indexOf(D.CURRENT_ROUND);
  D.NEXT_ROUND = ci >= 0 && ci < D.ROUND_SEQ.length - 1 ? D.ROUND_SEQ[ci + 1] : null;
  D.NEXT_LABEL = D.NEXT_ROUND ? D.ROUND_FULL[D.NEXT_ROUND] : "";
  D.CUR_SUBTITLE = (() => {
    const tag = D.ROUND_TAGS[D.CURRENT_ROUND] || D.CUR_LABEL;
    if (D.CUR_TOTAL && D.CUR_DONE >= D.CUR_TOTAL) return `All ${D.CUR_TOTAL} ${tag} final`;
    if (D.CUR_DONE === 0) return `${tag} up next \u00b7 ${D.CUR_TOTAL} to play`;
    return `${D.CUR_DONE} of ${D.CUR_TOTAL} ${tag} final \u00b7 ${D.CUR_REMAIN} to play`;
  })();
  D.LIVE_STATUS = (() => {
    const full = D.ROUND_FULL[D.CURRENT_ROUND] || D.CUR_LABEL;
    if (D.CUR_TOTAL && D.CUR_DONE >= D.CUR_TOTAL) return `The ${full} is complete.` + (D.NEXT_LABEL ? ` The ${D.NEXT_LABEL} is up next.` : "");
    if (D.CUR_DONE === 0) return `The ${full} is up next \u2014 ${D.CUR_TOTAL} games to play.`;
    const nxt = D.NEXT_LABEL ? `, then the ${D.NEXT_LABEL}` : "";
    return `The ${full} is underway \u2014 ${D.CUR_DONE} of ${D.CUR_TOTAL} final, ${D.CUR_REMAIN} to go${nxt}.`;
  })();
  D.STAGES = (() => {
    const stages = [["Group stage", "Ended Jun 27", "done"]];
    let activeTaken = false;
    for (const [label, short, dates, done, total] of D.STAGE_ROUNDS) {
      if (total > 0 && done === total) stages.push([label, `${dates} \u00b7 ${done}/${total}`, "done"]);
      else if (!activeTaken) { stages.push([label, total ? `${dates} \u00b7 ${done}/${total}` : dates, "active"]); activeTaken = true; }
      else stages.push([label, dates, "up"]);
    }
    return stages;
  })();

  // WCSTATS for hover cards (results-derived "y" + topology seed/history)
  D.team_2026 = (t) => D.ELIM.has(t) ? "Out \u2014 Round of 32" : (D.R32_ACTUAL_WINNERS.has(t) ? "Into the Round of 16" : "Round of 32 \u2014 to play");
  D.WCSTATS = {};
  for (const t in D.SEED) {
    const h = WC_HISTORY[t] || [0, "\u2014"];
    D.WCSTATS[t] = { t: h[0], b: h[1], y: D.team_2026(t), s: D.SEED[t] || "" };
  }
  return D;
}

const seedOf = (D, t) => D.SEED[t] || "";

// ── bracket ───────────────────────────────────────────────────────────────────
function matchWhen(D, node) {
  if (node.round === "r32") return D.R32.find(([code]) => code === node.code)?.[1] || "";
  if (has(D.KO_FIX, node.code)) {
    const fixture = D.KO_FIX[node.code];
    return fixture[fixture.length - 4] || "";
  }
  if (node.round === "r16") return D.R16_FIX.find(([code]) => code === node.code)?.[1] || D.KO_DATES.r16 || "";
  if (has(D.KO_WHEN, node.code)) return D.KO_WHEN[node.code][0] || "";
  return D.KO_DATES[node.round] || "";
}
function r32_cell(D, team, picked, decided, real_winner, freebie, score) {
  const cls = ["team"]; let badge = "";
  if (decided) {
    if (picked && real_winner) { cls.push("adv"); badge = '<span class="rb ok">\u2713</span>'; }
    else if (picked && !real_winner) { cls.push("busted"); badge = '<span class="rb no">\u2715</span>'; }
    else if (!picked && real_winner) { cls.push("realadv"); badge = '<span class="rb up">\u25B2</span>'; }
    else cls.push("out");
  } else cls.push(picked ? "adv" : "out");
  const ftag = freebie ? '<span class="tt" title="Freebie \u2014 Canada 1\u20130 South Africa, auto-credited">\u{1F381}</span>' : "";
  return `<div class="${cls.join(" ")}" data-team="${esc(team)}" data-round="r32" tabindex="0">` +
    `<span class="fav-bar"></span>${flagImg(team, "mflag")}<span class="tname">${esc(team)}</span>` +
    `<span class="tcode" aria-hidden="true">${esc(teamCode3(team))}</span>` +
    `${score == null ? "" : `<span class="tscore">${esc(score)}</span>`}${ftag}${badge}</div>`;
}
const MAP_ROUND_LABEL = { r32: "Round of 32", r16: "Round of 16", qf: "Quarterfinals", sf: "Semifinals", final: "Final" };
const ARIA_ROUND_LABEL = { r32: "Round of 32", r16: "Round of 16", qf: "Quarterfinal", sf: "Semifinal", final: "Final" };

function placeholderRow(node, feeder) {
  const number = feeder.slice(1);
  return `<div class="team placeholder" data-feeder="${esc(feeder)}" data-round="${node.round}" aria-label="Winner of match ${esc(number)}">` +
    `<span class="tname">Winner ${esc(feeder)}</span></div>`;
}

function pickedFeederWinner(D, tree, feeder) {
  if (tree.byCode[feeder].round === "r32") return D.R32.find(([code]) => code === feeder)?.[4] || "";
  return D.PICK_BY_CODE[feeder] || "";
}

function pickBox(D, team, picked, short, champ, st, feeder = null, score = null) {
  const cls = ["team", "st-" + st];
  if (champ) cls.push("champ");
  if (picked && !champ) cls.push("advancer");
  const gone = st === "won" && D.out_at_round(team, short);
  if (gone) cls.push("gone");
  const badge = st === "won"
    ? (gone ? "" : '<span class="rb ok">\u2713</span>')
    : (st === "lost" ? '<span class="rb no">\u2715</span>' : "");
  const tag = champ ? '<span class="tt">\u{1F3C6}</span>' : "";
  const chev = picked && !champ ? '<span class="adv-arrow" title="you have this team advancing">\u203A</span>' : "";
  const feederAttr = feeder ? ` data-feeder="${esc(feeder)}"` : "";
  const celebrationAttr = champ ? " data-champion-celebration-trigger" : "";
  return `<div class="${cls.join(" ")}" data-team="${esc(team)}"${feederAttr}${celebrationAttr} data-round="${short}" tabindex="0">` +
    `<span class="fav-bar"></span>${flagImg(team, "mflag")}<span class="tname">${esc(team)}</span>` +
    `<span class="tcode" aria-hidden="true">${esc(teamCode3(team))}</span>` +
    `${score == null ? "" : `<span class="tscore">${esc(score)}</span>`}${tag}${badge}${chev}</div>`;
}

function actualReplacementRow(D, team, pickedTeam, node, feeder, score) {
  const gone = D.ELIM.has(team);
  const cls = "team st-actual" + (gone ? " gone" : "");
  const round = ARIA_ROUND_LABEL[node.round] || "this round";
  const tip = gone
    ? `${team} advanced in your ${pickedTeam} pick's place, but is now out`
    : `actually advanced to the ${round} \u2014 you picked ${pickedTeam}`;
  return `<div class="${cls}" data-team="${esc(team)}" data-feeder="${esc(feeder)}" data-round="${node.round}" tabindex="0">` +
    `<span class="fav-bar"></span>${flagImg(team, "mflag")}<span class="tname">${esc(team)}</span>` +
    `<span class="tcode" aria-hidden="true">${esc(teamCode3(team))}</span>` +
    `${score == null ? "" : `<span class="tscore">${esc(score)}</span>`}` +
    `<span class="rb up" title="${esc(tip)}">\u25B2</span></div>`;
}

function renderKoRow(D, tree, node, mode, feeder, feederIndex) {
  const pickedTeam = pickedFeederWinner(D, tree, feeder);
  const actualTeam = has(D.RES, feeder) ? D.RES[feeder][2] : null;
  const team = mode === "actual" ? actualTeam : pickedTeam;
  if (!team) return placeholderRow(node, feeder);

  const decided = has(D.RES, node.code);
  const isActualParticipant = team === actualTeam;
  const score = decided && isActualParticipant ? D.RES[node.code][feederIndex] : null;
  if (mode === "actual" && actualTeam !== pickedTeam) {
    return actualReplacementRow(D, actualTeam, pickedTeam, node, feeder, score);
  }

  const winner = decided ? D.RES[node.code][2] : null;
  const status = decided && isActualParticipant
    ? (team === winner ? "won" : "lost")
    : D.reach_status(team, node.round);
  return pickBox(D, team, D.PICK_BY_CODE[node.code] === team, node.round, false, status, feeder, score);
}

function renderMatchCard(D, tree, node, mode) {
  const decided = has(D.RES, node.code);
  let home, away, pick, rows;

  if (node.round === "r32") {
    const [, , a, b, picked] = D.R32.find(([code]) => code === node.code);
    home = a; away = b; pick = picked;
    const [gA, gB, winner] = decided ? D.RES[node.code] : [null, null, null];
    const freebie = node.code === D.FREEBIE_MATCH;
    rows = r32_cell(D, a, picked === a, decided, winner === a, freebie && picked === a, gA) +
      r32_cell(D, b, picked === b, decided, winner === b, freebie && picked === b, gB);
  } else {
    const actualTeams = node.feeders.map((feeder) => has(D.RES, feeder) ? D.RES[feeder][2] : null);
    const pickedTeams = node.feeders.map((feeder) => pickedFeederWinner(D, tree, feeder));
    [home, away] = mode === "actual" ? actualTeams : pickedTeams;
    pick = D.PICK_BY_CODE[node.code];
    rows = node.feeders.map((feeder, index) => renderKoRow(D, tree, node, mode, feeder, index)).join("");
  }

  const when = matchWhen(D, node);
  const [gA, gB, winner, note] = decided ? D.RES[node.code] : [null, null, null, ""];
  const homeLabel = home || `winner of ${node.feeders?.[0] || ""}`;
  const awayLabel = away || `winner of ${node.feeders?.[1] || ""}`;
  const label = decided
    ? `${node.code}, ${ARIA_ROUND_LABEL[node.round]}: ${homeLabel} ${gA}, ${awayLabel} ${gB}. ${winner} advance.`
    : `${node.code}, ${ARIA_ROUND_LABEL[node.round]}: ${homeLabel} vs ${awayLabel}, ${when}`;
  const status = D.pick_status(node.round, pick, node.code);
  const actualAttrs = mode === "actual" && decided
    ? ` data-played="true" data-home="${esc(home)}" data-away="${esc(away)}"`
    : "";
  const detailControlAttrs = mode === "actual" && decided
    ? ` role="button" tabindex="0" aria-haspopup="dialog" aria-controls="matchdlg" aria-label="${esc(label)}"`
    : "";

  return `<div class="mcard st-${status}" data-match-code="${esc(node.code)}" data-round="${node.round}" data-side="${node.side}"${actualAttrs} aria-label="${esc(label)}">` +
    `<div class="mhead"${detailControlAttrs}><span class="mcode">${esc(node.code)}</span><span class="mwhen">${esc(when)}</span>` +
    `${note ? `<span class="mnote">${esc(note)}</span>` : ""}</div>${rows}</div>`;
}

function displayedChampion(D, mode) {
  if (mode === "actual" && has(D.RES, "M104")) {
    return {
      team: D.RES.M104[2],
      note: "World champion",
      status: "won",
      subtitle: "actual result",
    };
  }
  return {
    team: D.CHAMP,
    note: D.CHAMP_NOTE,
    status: D.reach_status(D.CHAMP, "champion"),
    subtitle: "your pick",
  };
}

function renderCenterStage(D, tree, mode) {
  const champion = displayedChampion(D, mode);
  return `<div class="center-stage"><div class="trophy-slot" data-trophy></div>` +
    `<div class="champ-state">` +
    `${pickBox(D, champion.team, mode === "picked", "champion", true, champion.status)}` +
    `<div class="champ-note">${esc(champion.note)}</div></div>` +
    `<div class="bkhead">Final \u00b7 ${esc(D.KO_DATES.final || "")}</div>` +
    `${renderMatchCard(D, tree, tree.byCode.M104, mode)}</div>`;
}

function renderMiniOverview(tree, D, mode) {
  const points = {};
  for (const node of tree.nodes) {
    const count = tree.columns[node.col - 1].codes.length;
    points[node.code] = {
      x: 8 + (node.col - 1) * 43,
      y: (node.slot + 0.5) / count * 200,
    };
  }

  const edges = tree.edges.map((edge) => {
    const fromNode = tree.byCode[edge.from], from = points[edge.from], to = points[edge.to];
    const movingLeft = fromNode.col > tree.byCode[edge.to].col;
    const startX = from.x + (movingLeft ? -1.5 : 1.5);
    const endX = to.x + (movingLeft ? 1.5 : -1.5);
    const middleX = (startX + endX) / 2;
    return `<path class="mm-edge" d="M${startX} ${from.y} H${middleX} V${to.y} H${endX}"></path>`;
  });
  const nodes = tree.nodes.map((node) => {
    const point = points[node.code];
    const pick = node.round === "r32"
      ? D.R32.find(([code]) => code === node.code)?.[4]
      : D.PICK_BY_CODE[node.code];
    const status = D.pick_status(node.round, pick, node.code);
    return `<rect class="mm-node mm-${status}" x="${point.x - 1.5}" y="${point.y - 4.5}" width="3" height="9"></rect>`;
  });

  return `<svg class="mini-map" data-view="${mode}" aria-hidden="true" viewBox="0 0 360 200" role="presentation">` +
    edges.join("") + nodes.join("") + "</svg>";
}

export function buildBracket(D, mode = "actual") {
  const tree = cachedBracketTree(D.KO_FEED);
  const columns = tree.columns.map((column) => {
    const center = column.side === "C";
    const cards = center
      ? renderCenterStage(D, tree, mode)
      : `<div class="bkhead">${MAP_ROUND_LABEL[column.round]}</div>` +
        column.codes.map((code) => renderMatchCard(D, tree, tree.byCode[code], mode)).join("");
    return `<div class="bkcol${center ? " bkcenter" : ""}" data-col="${column.col}" data-side="${column.side}" data-round="${column.round}">${cards}</div>`;
  });
  return `<div class="bracket layout-mirror mode-${mode}"><svg class="bksvg" aria-hidden="true"></svg>${renderMiniOverview(tree, D, mode)}<div class="bkgrid">${columns.join("")}</div></div>`;
}

function legacyR32Cell(D, team, picked, decided, realWinner, freebie) {
  const classes = ["team"];
  let badge = "";
  if (decided) {
    if (picked && realWinner) {
      classes.push("adv");
      badge = '<span class="rb ok">\u2713</span>';
    } else if (picked && !realWinner) {
      classes.push("busted");
      badge = '<span class="rb no">\u2715</span>';
    } else if (!picked && realWinner) {
      classes.push("realadv");
      badge = '<span class="rb up">\u25B2</span>';
    } else {
      classes.push("out");
    }
  } else {
    classes.push(picked ? "adv" : "out");
  }
  const freebieTag = freebie
    ? '<span class="tt" title="Freebie \u2014 Canada 1\u20130 South Africa, auto-credited">\u{1F381}</span>'
    : "";
  return `<div class="${classes.join(" ")}" data-team="${esc(team)}" data-round="r32" tabindex="0">` +
    `<span class="fav-bar"></span>${flagImg(team, "mflag")}<span class="tname">${esc(team)}</span>${freebieTag}${badge}</div>`;
}

function legacyPickBox(D, team, picked, round, champion, status) {
  const classes = ["team", "st-" + status];
  if (champion) classes.push("champ");
  if (picked && !champion) classes.push("advancer");
  const gone = status === "won" && D.out_at_round(team, round);
  if (gone) classes.push("gone");
  const badge = status === "won"
    ? (gone ? "" : '<span class="rb ok">\u2713</span>')
    : (status === "lost" ? '<span class="rb no">\u2715</span>' : "");
  const trophy = champion ? '<span class="tt">\u{1F3C6}</span>' : "";
  const chevron = picked && !champion
    ? '<span class="adv-arrow" title="you have this team advancing">\u203A</span>'
    : "";
  return `<div class="${classes.join(" ")}" data-team="${esc(team)}" data-round="${round}" tabindex="0">` +
    `<span class="fav-bar"></span>${flagImg(team, "mflag")}<span class="tname">${esc(team)}</span>${trophy}${badge}${chevron}</div>`;
}

function legacyLaterCell(D, team, picked, round, champion = false, actual = null, mode = "actual") {
  if (mode === "picked") {
    return legacyPickBox(D, team, picked, round, champion, D.reach_status(team, round));
  }
  const status = D.reach_status(team, round);
  if (status !== "won" && D.ELIM.has(team)) {
    if (actual) {
      const gone = D.ELIM.has(actual);
      const classes = "team st-actual" + (gone ? " gone" : "");
      const label = { r16: "Round of 16", qf: "Quarterfinal", sf: "Semifinal", final: "Final" }[round] || "this round";
      let title;
      if (actual === team) title = `${actual} reached the ${label}` + (gone ? ", but is now out" : "");
      else if (gone) title = `${actual} advanced in your ${team} pick's place, but is now out`;
      else title = `actually advanced \u2014 you picked ${team}`;
      return `<div class="${classes}" data-team="${esc(actual)}" data-round="${round}" tabindex="0">` +
        `<span class="fav-bar"></span>${flagImg(actual, "mflag")}<span class="tname">${esc(actual)}</span>` +
        `<span class="rb up" title="${esc(title)}">\u25B2</span></div>`;
    }
    return '<div class="team blank"><span class="tname">&nbsp;</span></div>';
  }
  return legacyPickBox(D, team, picked, round, champion, status);
}

function sidewaysActualMatchAttrs(D, mode, code, home, away, round) {
  if (mode !== "actual" || !code || !has(D.RES, code)) {
    return { match: "", control: "" };
  }
  let participants = [home, away];
  const feeders = D.KO_FEED[code];
  if (feeders && feeders.length === 2) {
    participants = feeders.map(feeder => has(D.RES, feeder) ? D.RES[feeder][2] : null);
  }
  if (!participants[0] || !participants[1]) return { match: "", control: "" };
  const [homeGoals, awayGoals, winner, note] = D.RES[code];
  const roundLabel = ARIA_ROUND_LABEL[round] || "Knockout";
  const label = `${code}, ${roundLabel}: ${participants[0]} ${homeGoals}, ${participants[1]} ${awayGoals}. ${winner} advance.${note ? " " + note + "." : ""}`;
  return {
    match: ` data-match-code="${esc(code)}" data-played="true" data-home="${esc(participants[0])}" data-away="${esc(participants[1])}"`,
    control: ` role="button" tabindex="0" aria-haspopup="dialog" aria-controls="matchdlg" aria-label="${esc(label)}"`,
  };
}

export function buildSidewaysBracket(D, mode = "actual") {
  const columns = [];
  const r32Matches = [];
  for (const [code, date, home, away, pick] of D.R32) {
    const decided = has(D.RES, code);
    const realWinner = decided ? D.RES[code][2] : null;
    let score;
    if (decided) {
      const [homeGoals, awayGoals, , note] = D.RES[code];
      score = `<div class="mscore">${esc(home)} ${homeGoals}${DASH}${awayGoals} ${esc(away)}${note ? " \u00b7 " + note : ""}</div>`;
    } else {
      score = `<div class="mscore up">kick-off ${esc(date)}</div>`;
    }
    const freebie = code === D.FREEBIE_MATCH;
    const matchAttrs = sidewaysActualMatchAttrs(D, mode, code, home, away, "r32");
    r32Matches.push(
      `<div class="match" data-status="${D.pick_status("r32", pick, code)}"${matchAttrs.match}>` +
      `<div class="mlabel"${matchAttrs.control}>${esc(code)} \u00b7 ${esc(date)}</div>${score}` +
      legacyR32Cell(D, home, pick === home, decided, realWinner === home, freebie && pick === home) +
      legacyR32Cell(D, away, pick === away, decided, realWinner === away, freebie && pick === away) +
      "</div>",
    );
  }
  columns.push(
    `<div class="round"><div class="rhead">Round of 32<span>${D.R32_DONE} of ${D.N_R32} final</span></div>` +
    `<div class="matches">${r32Matches.join("")}</div></div>`,
  );

  const metadata = [
    ["Round of 16", "r16", "Jul 4\u20137", D.rounds[1][3]],
    ["Quarterfinals", "qf", "Jul 9\u201311", D.rounds[2][3]],
    ["Semifinals", "sf", "Jul 14\u201315", D.rounds[3][3]],
    ["Final", "final", "Jul 19", D.rounds[4][3]],
  ];
  const roundCodes = {
    r16: D._r16codes,
    qf: D._qfcodes,
    sf: D._sfcodes,
    final: D._finalcodes,
  };
  const r16Days = {};
  for (const [code, day] of D.R16_FIX) r16Days[code] = day;

  for (const [label, round, subtitle, matches] of metadata) {
    const cells = [];
    const codes = roundCodes[round] || [];
    matches.forEach(([home, away, winner], index) => {
      const final = label === "Final";
      const actualHome = D.actual_advancer(round, home);
      const actualAway = D.actual_advancer(round, away);
      const code = index < codes.length ? codes[index] : "";
      const when = r16Days[code] || "";
      const matchAttrs = sidewaysActualMatchAttrs(
        D,
        mode,
        code,
        actualHome,
        actualAway,
        round,
      );
      const matchLabel = code
        ? `<div class="mlabel up"${matchAttrs.control}>${esc(code)}${when ? " \u00b7 " + esc(when) : ""}</div>`
        : "";
      cells.push(
        `<div class="match"${matchAttrs.match}>${matchLabel}` +
        legacyLaterCell(D, home, winner === home, round, final && winner === home, actualHome, mode) +
        legacyLaterCell(D, away, winner === away, round, final && winner === away, actualAway, mode) +
        "</div>",
      );
    });
    columns.push(
      `<div class="round"><div class="rhead">${esc(label)}<span>${esc(subtitle)}</span></div>` +
      `<div class="matches">${cells.join("")}</div></div>`,
    );
  }

  const champion = displayedChampion(D, mode);
  columns.push(
    `<div class="round champcol"><div class="rhead">Champion<span>${champion.subtitle}</span></div><div class="matches">` +
    `<div class="match"><div class="trophy-slot" data-trophy></div>` +
    `${legacyPickBox(D, champion.team, mode === "picked", "champion", true, champion.status)}` +
    `<div class="champ-note">${esc(champion.note)}</div></div></div></div>`,
  );
  return `<div class="bracket layout-sideways mode-${mode}"><svg class="bksvg" aria-hidden="true"></svg>` +
    columns.join("") + "</div>";
}

// ── scorecard ───────────────────────────────────────────────────────────────
function scrow(pid, short, pts, pick, detail, def, a, b) {
  return `<div class="scrow" data-pick="${pid}" data-round="${short}" data-pts="${pts}" ` +
    `data-default="${def}" data-team="${esc(a)}|${esc(b)}">` +
    `<div class="tc"><span class="rpill r-${short}">${esc(short.toUpperCase())}</span></div>` +
    `<div class="tc match-cell"><span class="win">${esc(pick)}</span>` +
    `<span class="det">${detail}</span></div>` +
    `<div class="tc pts-cell">${pts}<span class="ptsu">pt${pts > 1 ? "s" : ""}</span></div>` +
    `<div class="tc seg-cell"><div class="seg" role="group">` +
    `<button data-set="won" title="Correct">\u2713</button>` +
    `<button data-set="pending" title="Not decided">\u2013</button>` +
    `<button data-set="lost" title="Wrong / out">\u2715</button></div></div></div>`;
}
export function buildScorecard(D) {
  const rows = [];
  for (const [mc, dt, a, b, pk] of D.R32) {
    const st = D.pick_status("r32", pk, mc), pid = "r32-" + mc;
    let detail;
    if (has(D.RES, mc)) {
      const [gA, gB, w, note] = D.RES[mc], loser = w === b ? a : b;
      if (st === "won") detail = `beat ${esc(loser)} ${a === w ? gA : gB}${DASH}${a === w ? gB : gA}${note ? " (" + note + ")" : ""}`;
      else detail = `lost to ${esc(w)} ${gA}${DASH}${gB}${note ? " (" + note + ")" : ""}`;
    } else detail = `vs ${esc(pk === a ? b : a)} \u00b7 ${esc(dt)}`;
    rows.push(scrow(pid, "r32", 1, pk, detail, st, a, b));
  }
  const intoNext = { r16: "into the quarterfinals", qf: "into the semifinals", sf: "into the Final", final: "champions \u{1F3C6}" };
  const throughNext = { r16: "through to the quarterfinals", qf: "through to the semifinals", sf: "through to the Final", final: "lifted the trophy \u{1F3C6}" };
  const toReach = { r16: "to reach the quarterfinals", qf: "to reach the semifinals", sf: "to reach the Final", final: "to lift the trophy" };
  for (const [label, short, pts, ms] of D.rounds.slice(1)) {
    ms.forEach(([a, b, w], i) => {
      const st = D.pick_status(short, w), pid = `${short}-${i}`, code = D.CODE_OF_PICK[short + "|" + w];
      let detail;
      if (st === "won") {
        if (code && has(D.RES, code)) { const [gA, gB, ww, note] = D.RES[code]; detail = `won ${gA}${DASH}${gB}${note ? " (" + note + ")" : ""} \u2014 ${intoNext[short]}`; }
        else detail = throughNext[short];
      } else if (st === "lost") {
        const parts = new Set();
        if (code) for (const f of D.KO_FEED[code]) if (has(D.RES, f)) parts.add(D.RES[f][2]);
        if (code && has(D.RES, code) && parts.has(w)) { const [gA, gB, ww, note] = D.RES[code]; detail = `lost to ${esc(ww)} ${gA}${DASH}${gB}${note ? " (" + note + ")" : ""}`; }
        else detail = "out \u2014 pick eliminated earlier";
      } else detail = toReach[short];
      rows.push(scrow(pid, short, pts, w, detail, st, a, b));
    });
  }
  const head = '<div class="scrow schead"><div class="tc">Round</div><div class="tc">Your pick &amp; result</div>' +
    '<div class="tc">Value</div><div class="tc">Status</div></div>';
  return '<div class="scard" id="scard">' + head + rows.join("") + '</div>';
}
export function buildScorebar(D) {
  const progress = D.POINTS_MAX
    ? Math.max(0, Math.min(1, D.CONF / D.POINTS_MAX))
    : 0;
  return '<div class="scorebar glass" id="scorebar"><div class="sb-main">' +
    `<div class="sb-big"><span id="scConfirmed">${D.CONF}</span><span class="sb-slash">/ ${D.POINTS_MAX}</span></div>` +
    '<div class="sb-cap" title="Settled = points you\u2019ve already won or lost. Still-live points aren\u2019t counted here yet, so this total grows \u2014 and can differ between brackets \u2014 as your picks get decided.">points confirmed \u00b7 <b id="scSoFar">' + `${D.CONF}/${D.DECIDED}` + '</b> settled</div>' +
    `<div class="sb-track"><i id="scBar" style="transform:scaleX(${progress})"></i></div></div>` +
    '<div class="sb-stats">' +
    `<div class="sb-stat s-win"><b id="scConfirmed2">${D.CONF}</b><span>confirmed</span></div>` +
    `<div class="sb-stat s-live"><b id="scLive">${D.LIVE}</b><span>still live</span></div>` +
    `<div class="sb-stat s-out"><b id="scOut">${D.OUT}</b><span>eliminated</span></div>` +
    `<div class="sb-stat s-max"><b id="scMax" data-max="${D.POINTS_MAX}">${D.ATTAIN}</b><span>still attainable</span></div>` +
    '</div></div>';
}
export function buildKpis(D) {
  const rnd_full = D.ROUND_FULL[D.CURRENT_ROUND] || D.CUR_LABEL;
  let rnd_note;
  if (D.CUR_REMAIN) rnd_note = `${D.CUR_REMAIN} game${D.CUR_REMAIN !== 1 ? "s" : ""} left`;
  else if (D.NEXT_LABEL) rnd_note = `${D.NEXT_LABEL} next`;
  else rnd_note = "round complete";
  const kpis = [
    ["Confirmed points", `<span id='kpiConfirmed'>${D.CONF}</span><span class='kunit'>/ ${D.POINTS_MAX}</span>`, "\u2705", "teal", `${D.r32_correct} of ${D.r32_decided} R32 picks right`],
    [rnd_full, `${D.CUR_CORR}<span class='kunit'>/ ${D.CUR_DEC}</span>`, "\u26BD", "blue", rnd_note],
    ["Still live", `<span id='kpiLive'>${D.LIVE}</span>`, "\u26A1", "blue", "across your open picks"],
    ["Max attainable", `${D.ATTAIN}`, "\u{1F3AF}", "green", "if your path holds"],
    ["Champion pick", D.CHAMP, "\u{1F3C6}", "gold", D.CHAMP_STATUS],
    ["Points lost", `${D.OUT}`, "\u{1F6AB}", "red", D.BUSTED_NOTE],
  ];
  return kpis.map(([l, v, ic, t, n]) => `<div class="glass kpi t-${t}"><div class="kpi-ic">${ic}</div>` +
    `<div class="kpi-l">${esc(l)}</div><div class="kpi-v">${v}</div><div class="kpi-n">${esc(n)}</div></div>`).join("");
}
export function buildFinalfour(D) {
  const out = [];
  for (const tm of D.QF_WIN) {
    const role = tm === D.CHAMP ? "Champion" : (tm === D.RUNNER ? "Runner-up" : "Semifinalist");
    const alive = !D.ELIM.has(tm);
    const cls = tm === D.CHAMP ? "ff-champ" : (tm === D.RUNNER ? "ff-run" : "");
    const dot = alive ? '<span class="ff-live">\u25CF alive</span>' : '<span class="ff-dead">\u2715 out</span>';
    out.push(`<div class="ff ${cls}" data-team="${esc(tm)}"><span class="ff-seed">${esc(seedOf(D, tm))}</span>` +
      `<span class="ff-name">${esc(tm)}</span><span class="ff-role">${role} \u00b7 ${dot}</span></div>`);
  }
  return out.join("");
}

// ── "How it played out" story ─────────────────────────────────────────────────
const STORY_ROUND_NAME = { 0: "Round of 32", 1: "Round of 16", 2: "Quarterfinal", 3: "Semifinal", 4: "Final" };
const STORY_LEVEL_PTS = [1, 2, 4, 8, 16];
const STORY_KO_LEVEL = { r16: 1, qf: 2, sf: 3, final: 4 };
function levelsPicked(D, team) {
  const lv = [0];
  if (D.R16_WIN.includes(team)) lv.push(1);
  if (D.QF_WIN.includes(team)) lv.push(2);
  if (D.SF_WIN.includes(team)) lv.push(3);
  if (team === D.CHAMP) lv.push(4);
  return lv;
}
function forfeited(D, team, elimLevel) {
  return levelsPicked(D, team).filter(l => l >= elimLevel).reduce((s, l) => s + STORY_LEVEL_PTS[l], 0);
}
function collectBusts(D) {
  const busts = [];
  for (const [mc, dt, a, b, pk] of D.R32) {
    if (has(D.RES, mc)) { const [gA, gB, w, note] = D.RES[mc]; if (pk !== w) busts.push([0, codeNum(mc), pk, w, a, b, gA, gB, note]); }
  }
  for (const code in D.KO_FEED) {
    if (has(D.RES, code)) {
      const [fa, fb] = D.KO_FEED[code];
      const wa = has(D.RES, fa) ? D.RES[fa][2] : null, wb = has(D.RES, fb) ? D.RES[fb][2] : null;
      const pk = D.PICK_BY_CODE[code]; const [gA, gB, w, note] = D.RES[code];
      if (pk && (pk === wa || pk === wb) && pk !== w) busts.push([STORY_KO_LEVEL[D.KO_ROUND[code]], codeNum(code), pk, w, wa, wb, gA, gB, note]);
    }
  }
  return busts;
}
export function storyCards(D) {
  const cards = [];
  const played = D.ROUND_SEQ.map(s => [s, D.round_tally(s)]);
  const bits = played.filter(([s, [c, d, l]]) => d).map(([s, [c, d, l]]) => `${c} of ${d} in the ${D.ROUND_FULL[s]}`);
  const tot_c = played.reduce((a, [s, [c]]) => a + c, 0);
  const tot_d = played.reduce((a, [s, [c, d]]) => a + d, 0);
  if (!bits.length) cards.push(["\u26BD", "The story so far", "Kicking off", "No games are final yet \u2014 your first results will land here as they finish."]);
  else {
    const head = tot_c === tot_d ? "Perfect run" : (tot_c * 2 >= tot_d ? "Holding strong" : "Bumpy road");
    const body = bits.join(" \u00b7 ") + `. ${D.CONF} points banked, ${D.LIVE} still live.`;
    cards.push([tot_c === tot_d ? "\u2705" : "\u{1F4CA}", `${tot_c} of ${tot_d} picks right so far`, head, body]);
  }
  const busts = collectBusts(D);
  if (busts.length) {
    busts.sort((x, y) => (forfeited(D, y[2], y[0]) - forfeited(D, x[2], x[0])) || (y[0] - x[0]) || (x[1] - y[1]));
    const [lvl, _n, pk, w, a, b, gA, gB, note] = busts[0];
    const sc = `${a} ${gA}${DASH}${gB} ${b}` + (note ? ` (${note})` : "");
    const forfeit = forfeited(D, pk, lvl), n = busts.length;
    const lead = lvl === 0 ? `${w} knocked out your ${pk} pick \u2014 ${sc}.` : `${w} ended your ${pk} run in the ${STORY_ROUND_NAME[lvl]} \u2014 ${sc}.`;
    const tail = n > 1 ? ` It's the costliest of ${n} branches that have busted, ${D.OUT} points gone in all.` : ` That's ${forfeit} point${forfeit !== 1 ? "s" : ""} off your board.`;
    cards.push([teamEmoji(w), "Biggest swing", `${w} over ${pk}`, lead + tail]);
  } else cards.push(["\u{1F3AF}", "Clean sheet", "No busted branches yet", "Every team you've backed so far is still standing \u2014 nothing off your board."]);
  const ce = teamEmoji(D.CHAMP);
  if (D.ELIM.has(D.CHAMP)) cards.push([ce, "What's at stake", `${D.CHAMP} is out`, `Your title pick is gone, so the Champion\u2019s 16 points are off the board \u2014 ${D.ATTAIN} still attainable.`]);
  else {
    const ff = D.QF_WIN.filter(t => !D.ELIM.has(t)).join(", ") || "\u2014";
    const nxt = D.NEXT_LABEL ? ` Up next: the ${D.NEXT_LABEL}.` : "";
    cards.push([ce, "What's at stake", `${D.CHAMP} still standing`, `${D.CHAMP} is alive, with ${D.FF_ALIVE} of your final four (${ff}) still in it.${nxt}`]);
  }
  return cards.slice(0, 3);
}
export function buildStory(D) {
  return storyCards(D).map(([ic, tag, ti, bd]) => `<div class="glass story"><div class="story-ic">${ic}</div>` +
    `<div class="story-tag">${esc(tag)}</div><div class="story-title">${esc(ti)}</div>` +
    `<div class="story-body">${esc(bd)}</div></div>`).join("");
}
export function buildStages(D) {
  const dot = { done: "\u25CF", active: "\u25C9", up: "\u25CB" };
  return D.STAGES.map(([n, d, st]) => `<div class="stage s-${st}"><span class="sdot">${dot[st]}</span>` +
    `<div><div class="sname">${esc(n)}</div><div class="sdate">${esc(d)}</div></div></div>`).join("");
}
export function buildResultsPanel(D) {
  const rows = [];
  for (const [mc, dt, a, b, pk] of D.R32) {
    if (has(D.RES, mc)) {
      const [gA, gB, w, note] = D.RES[mc], ok = (w === pk);
      const badge = ok ? '<span class="res-ok">\u2713 you</span>' : '<span class="res-no">\u2715 you</span>';
      rows.push(`<div class="rr"><div class="rr-m">${esc(mc)}</div>` +
        `<div class="rr-s"><b class="${w === a ? "w" : "l"}">${esc(a)}</b> ${gA}${DASH}${gB} <b class="${w === b ? "w" : "l"}">${esc(b)}</b>` +
        `${note ? " <i>" + note + "</i>" : ""}</div><div class="rr-p">${badge}</div></div>`);
    }
  }
  const up = [];
  for (const [mc, dt, a, b, pk] of D.R32) {
    if (!has(D.RES, mc)) {
      const [d, et, ct, ptz] = D.R32_TIMES[mc] || [dt, "", "", ""];
      up.push(`<div class="rr up"><div class="rr-m">${esc(mc)}</div>` +
        `<div class="rr-s">${esc(a)} vs ${esc(b)}<span class="rr-t">${d} \u00b7 ${ptz} PT \u00b7 ${ct} CT \u00b7 ${et} ET</span></div>` +
        `<div class="rr-p"><span class="res-soon">your pick: ${esc(pk)}</span></div></div>`);
    }
  }
  return '<div class="glass rrbox res-panel" data-round="r32"><div class="rr-h">Round of 32 results \u00b7 your pick ' +
    `<b>${D.r32_correct}/${D.r32_decided}</b></div>` + rows.join("") +
    '<div class="rr-h" style="margin-top:12px">Still to play</div>' + up.join("") + '</div>';
}
export function buildRoundResultsPanel(D, label, short, codes) {
  const r16day = {}; for (const [mc, day, a, b, et, ct, ptz] of D.R16_FIX) r16day[mc] = [day, et, ct, ptz];
  const rows = []; let done = 0, dec = 0, corr = 0;
  for (const mc of codes) {
    const [fa, fb] = D.KO_FEED[mc];
    const a = has(D.RES, fa) ? D.RES[fa][2] : null, b = has(D.RES, fb) ? D.RES[fb][2] : null;
    const pk = D.PICK_BY_CODE[mc];
    if (has(D.RES, mc)) {
      done++; dec++;
      const [gA, gB, w, note] = D.RES[mc]; const an = a || "?", bn = b || "?";
      let badge;
      if (pk === w) { badge = '<span class="res-ok">\u2713 you</span>'; corr++; }
      else if (D.ELIM.has(pk)) badge = '<span class="res-no">\u2715 pick out</span>';
      else badge = '<span class="res-no">\u2715 you</span>';
      const sc = `<b class="${w === an ? "w" : "l"}">${esc(an)}</b> ${gA}${DASH}${gB} ` +
        `<b class="${w === bn ? "w" : "l"}">${esc(bn)}</b>` + (note ? ' <i>' + esc(note) + '</i>' : '');
      rows.push(`<div class="rr"><div class="rr-m">${esc(mc)}</div><div class="rr-s">${sc}</div><div class="rr-p">${badge}</div></div>`);
    } else {
      let when;
      if (has(D.KO_FIX, mc)) {
        const fixture = D.KO_FIX[mc];
        const day = fixture[fixture.length - 4];
        const et = fixture[fixture.length - 3];
        const ct = fixture[fixture.length - 2];
        const pt = fixture[fixture.length - 1];
        when = `${day} \u00b7 ${pt} PT \u00b7 ${ct} CT \u00b7 ${et} ET`;
      }
      else if (short === "r16" && r16day[mc]) { const [day, et, ct, ptz] = r16day[mc]; when = `${day} \u00b7 ${ptz} PT \u00b7 ${ct} CT \u00b7 ${et} ET`; }
      else if (has(D.KO_WHEN, mc)) { const [day, et, ct, ptz] = D.KO_WHEN[mc]; when = `${day} \u00b7 ${ptz} PT \u00b7 ${ct} CT \u00b7 ${et} ET`; }
      else when = D.KO_DATES[short];
      if (has(D.KO_CITY, mc)) when += ` \u00b7 ${D.KO_CITY[mc]}`;
      const ta = a || ("Winner " + fa), tb = b || ("Winner " + fb);
      let pkt;
      if (pk && D.ELIM.has(pk)) pkt = `<span class="res-no">pick ${esc(pk)} out</span>`;
      else if (pk) pkt = `<span class="res-soon">your pick: ${esc(pk)}</span>`;
      else pkt = "";
      rows.push(`<div class="rr up"><div class="rr-m">${esc(mc)}</div>` +
        `<div class="rr-s">${esc(ta)} vs ${esc(tb)}<span class="rr-t">${when}</span></div>` +
        `<div class="rr-p">${pkt}</div></div>`);
    }
  }
  const acc = dec ? `${corr}/${dec}` : "\u2014";
  return `<div class="glass rrbox res-panel" data-round="${short}">` +
    `<div class="rr-h">${esc(label)} results \u00b7 your pick <b>${acc}</b> \u00b7 ${done}/${codes.length} final</div>` +
    rows.join("") + '</div>';
}
export function buildHighlights(D) {
  const HL = [...(D.AUTO_HL)];  // FEATURED is empty
  return HL.map(([ic, tag, ti, wh, bd]) => `<div class="glass story"><div class="story-ic">${ic}</div>` +
    `<div class="story-tag">${esc(tag)}</div><div class="story-title">${esc(ti)}</div>` +
    `<div class="story-when">\u{1F4C5} ${esc(wh)}</div>` +
    `<div class="story-body">${esc(bd)}</div></div>`).join("");
}
export function buildLegend() {
  const items = [
    ['<span class="lg-box lg-won">\u2713</span>', "Your pick \u2014 won / through"],
    ['<span class="lg-box lg-lost">\u2715</span>', "Your pick \u2014 out"],
    ['<span class="lg-line lg-line-won"></span>', "Correct path \u2014 feeder line into the next game"],
    ['<span class="lg-line lg-line-pend"></span>', "Still to play \u2014 pending feeder line"],
    ['<span class="lg-box lg-actual">\u25B2</span>', "Who actually advanced (you had the other team)"],
    ['<span class="lg-line lg-line-actual"></span>', "Actual path \u2014 feeder line of the real result"],
    ['<span class="lg-chev">\u203A</span>', "You have this team advancing"],
    ['<span class="lg-box lg-champ">\u{1F3C6}</span>', "Your champion pick"],
  ];
  return '<div class="legend glass"><span class="lg-cap">How to read this bracket</span>' +
    items.map(([sw, t]) => `<div class="lg-item">${sw}<span>${esc(t)}</span></div>`).join("") + '</div>';
}
function chip(D, t) {
  const el = D.ELIM.has(t) ? " eliminated" : "";
  return `<button class="chip${el}" data-team="${esc(t)}"><span class="star" data-star="${esc(t)}" role="button" aria-label="favorite" tabindex="0">\u2606</span>` +
    `${flagImg(t, "chip-flag")}<span class="ctxt">${esc(t)}</span></button>`;
}
function shead(sid, icon, title, cap) {
  return `<div class="shead" id="${sid}">` +
    `<button class="sec-toggle" type="button" aria-expanded="true" aria-controls="${sid}-body" aria-label="Collapse section">\u25BE</button>` +
    `<span class="tile">${icon}</span><h2>${title}</h2>` +
    `<span class="cap">${cap}</span></div>` +
    `<div class="sec-body" id="${sid}-body">`;
}

// ── the full dashboard (inner HTML of div.wrap) ───────────────────────────────
export function renderDashboard(picks, live, topology) {
  const D = memoizedState(picks, live, topology);
  if (typeof window !== "undefined") window.WCSTATS = D.WCSTATS;  // hover-card stats
  const cachedHtml = DASHBOARD_HTML_CACHE.get(D);
  if (cachedHtml) return cachedHtml;
  const r32_win = D.R32.map(m => m[4]);
  const syncBtn = D.SYNC_URL ? `<a class="synbtn glass" id="syncBtn" href="${esc(D.SYNC_URL)}" target="_blank" rel="noopener" title="Pull the latest results"><span class="syn-ic">\u{1F504}</span><span class="syn-tx">Sync now</span></a>` : "";
  const html = '<div class="topbar"><div class="brand"><span class="orb"></span><div>2026 FIFA World Cup - Bracket Dashboard - MSFT SLED<small>Live results vs your picks</small></div></div>' +
    '<div class="upd-group">' +
    `<div class="refreshed glass" id="topRefreshed" title="Results auto-sync from FIFA\u2019s live feed a few times a day, no manual refresh needed"><span class="rf-dot"></span>Last Synced: ${localRefreshed(D.REFRESHED)}</div>` +
    syncBtn + '</div>' +
    '<div class="modes glass">' +
    '<div class="theme-toggle" role="group" aria-label="Light or dark theme">' +
    '<button data-mode="light" class="tg-ic" title="Light">\u2600\uFE0F</button>' +
    '<button data-mode="dark" class="tg-ic on" title="Dark">\u{1F319}</button>' +
    '</div>' +
    '<button data-mode="easy" class="mode-lbl" title="Easy reading mode \u2014 larger, high-contrast text, extra spacing, sentence case, no italics, and left-aligned content. May improve readability for some people, including readers with dyslexia or low vision."><span class="mi">\u{1F453}</span> Easy</button>' +
    '<div class="fun-wrap" id="funWrap"><button class="fun-btn" id="funBtn" aria-haspopup="true" aria-expanded="false" title="Fun themes"><span class="mi">\u{1F3A8}</span> Fun <span class="fun-car">\u25BE</span></button>' +
    '<div class="fun-menu glass" id="funMenu" role="menu">' +
    '<button data-mode="focus" role="menuitem"><span class="fm-em">\u25C6</span> Focus</button>' +
    '<button data-mode="geocities" role="menuitem"><span class="fm-em">\u{1F310}</span> GeoCities</button>' +
    '<button data-mode="minecraft" role="menuitem"><span class="fm-em">\u26CF\uFE0F</span> Minecraft</button>' +
    '<button data-mode="winxp" role="menuitem"><span class="fm-em">\u{1FA9F}</span> Windows XP</button>' +
    '<button data-mode="sticker" role="menuitem"><span class="fm-em">\u{1F3F7}\uFE0F</span> Sticker Book</button>' +
    '</div></div></div></div>' +
    '<div class="shell"><div class="side"><nav class="rail glass" id="rail">' +
    '<button class="navtoggle" id="navToggle" aria-expanded="false" aria-controls="railLinks"><span class="nav-ic">\u{1F4D1}</span> Contents \u2630</button>' +
    '<div class="links" id="railLinks"><div class="rt">On this page</div>' +
    '<a href="#intro"><span class="ic">\u{1F50E}</span> Overview</a>' +
    '<a href="#sec-standing"><span class="ic">\u{1F4CA}</span> Live standing</a>' +
    '<a href="#sec-scorecard"><span class="ic">\u{1F9EE}</span> Scorecard</a>' +
    '<a href="#sec-r32"><span class="ic">\u26BD</span> Round-by-round results</a>' +
    '<a href="#sec-news"><span class="ic">\u{1F4F0}</span> Game facts</a>' +
    '<a href="#sec-bracket"><span class="ic">\u{1F5FA}\uFE0F</span> Bracket Table</a>' +
    '<a href="#sec-finalfour"><span class="ic">\u{1F3C5}</span> Final four</a>' +
    '<a href="#sec-story"><span class="ic">\u2728</span> How it played out</a>' +
    '<a href="#sec-scoring"><span class="ic">\u{1F3AF}</span> Scoring &amp; schedule</a>' +
    '</div></nav>' +
    '<div class="railfilter glass" id="railFilter">' +
    '<button class="rf-toggle" id="rfToggle" type="button" aria-expanded="false" aria-controls="rfBody">' +
    '<span class="rt">Filter by team</span><span class="rf-car">\u25BE</span></button>' +
    '<div class="rf-body" id="rfBody">' +
    '<div class="chips">' + r32_win.map(t => chip(D, t)).join("") + '</div>' +
    '<div class="rf-foot"><label class="toggle"><input type="checkbox" id="favonly"><span class="tsw"></span>Favorites only</label>' +
    '<span class="count" id="count"></span></div></div></div>' +
    '</div><div class="content">' +
    `<section class="hero glass" id="intro"><div class="eyebrow">${esc(D.ENTRANT)} \u00b7 live results vs your picks</div>` +
    `<h1>Backing <span class="g">${esc(D.CHAMP)}</span> ${D.CHAMP_ALIVE ? "\u2014 and still in it" : "\u2014 but knocked out"}</h1>` +
    `<p class="sub">The <b>${esc(D.CUR_LABEL)}</b> is <b>${D.CUR_DONE} of ${D.CUR_TOTAL} final</b> \u2014 you're <b>${D.CUR_CORR} of ${D.CUR_DEC} right</b> this round, ` +
    `with <b>${D.CONF} points</b> banked and <b>${D.LIVE}</b> still live. Your champion ${esc(D.CHAMP)} is <b>${D.CHAMP_STATUS}</b>.` +
    (D.NEXT_LABEL ? ` The ${esc(D.NEXT_LABEL)} is up next.` : "") + '</p>' +
    '<div class="badges">' +
    `<span class="pill live"><span class="dot"></span>${D.CONF} pts confirmed</span>` +
    `<span class="pill"><span class="dot"></span>${esc(D.ROUND_TAGS[D.CURRENT_ROUND] || D.CUR_LABEL)} ${D.CUR_CORR}/${D.CUR_DEC}</span>` +
    `<span class="pill"><span class="dot"></span>Max attainable ${D.ATTAIN}</span>` +
    `<span class="pill"><span class="dot"></span>${esc(D.CHAMP)} ${D.CHAMP_ALIVE ? "alive" : "out"}</span></div>` +
    '<div class="composer"><span class="corb"></span><span class="plus">+</span>' +
    '<input id="search" type="text" placeholder="Track a team through the bracket \u2014 try England, Morocco, Paraguay\u2026" autocomplete="off">' +
    '<span class="mic">\u{1F3A4}</span><button class="clr" id="clear">Clear</button></div></section>' +
    shead("sec-standing", "\u{1F4CA}", "Your live standing", "6 signals") +
    `<div class="kpigrid">${buildKpis(D)}</div>` + '</div>' +
    shead("sec-scorecard", "\u{1F9EE}", "Scorecard \u2014 your path, scored live", `${D.CONF} confirmed \u00b7 ${D.LIVE} live`) +
    '<div class="note"><b>How this is scored.</b> Results are pulled from live web coverage (ESPN, CBS Sports, FIFA) and matched to your Excel picks. ' +
    'A background job <b>auto-syncs the live feed a few times a day</b>, so scores update on their own \u2014 no refresh needed. ' +
    `The <b>${esc(D.CUR_LABEL)}</b> stands at <b>${D.CUR_DONE} of ${D.CUR_TOTAL}</b> \u2014 you sit on <b>${D.CONF} points</b> (${D.CUR_CORR}/${D.CUR_DEC} right this round). ` +
    `${esc(D.LIVE_STATUS)} Later rounds stay <b>pending</b> until they\u2019re played. ` +
    'Flip any row yourself as games finish \u2014 totals recompute and save on this device.</div>' +
    buildScorebar(D) + `<div class="glass">${buildScorecard(D)}</div>` +
    '<div style="text-align:right;margin-top:10px"><button class="chip" id="scReset" style="cursor:pointer">\u21BA Reset to live results</button></div>' + '</div>' +
    shead("sec-r32", "\u26BD", "Round-by-round results", D.CUR_SUBTITLE) +
    '<div class="res-toggle">' +
    `<button data-view="r32" class="${D.CURRENT_ROUND === "r32" ? "on" : ""}">Round of 32</button>` +
    D.KO_ROUND_ORDER.map(([label, short, codes]) => `<button data-view="${short}" class="${short === D.CURRENT_ROUND ? "on" : ""}">${esc(label)}</button>`).join("") +
    '</div>' +
    `<div class="res-wrap" data-view="${D.CURRENT_ROUND}">${buildResultsPanel(D)}` +
    D.KO_ROUND_ORDER.map(([label, short, codes]) => buildRoundResultsPanel(D, label, short, codes)).join("") +
    '</div>' + '</div>' +
    shead("sec-news", "\u{1F4F0}", "Game facts \u2014 recent games", "newest first") +
    `<div class="g3">${buildHighlights(D)}</div>` + '</div>' +
    shead("sec-bracket", "\u{1F5FA}\uFE0F", "Bracket Table", "\u2713 hit \u00b7 \u2715 miss \u00b7 \u25B2 who went through") +
    buildLegend() +
    '<div class="brk-controls"><div class="brk-toggle" role="group" aria-label="Bracket Table data view">' +
    '<button data-view="actual" class="on">Actual path</button><button data-view="picked">My picks</button></div>' +
    '<button class="map-expand-toggle" id="mapExpandToggle" type="button" aria-expanded="false" aria-controls="bracketMap">Expand table</button>' +
    '<div class="layout-toggle" role="group" aria-label="Bracket Table layout">' +
    '<button data-layout="mirror" class="on" aria-pressed="true">Mirrored</button>' +
    '<button data-layout="sideways" aria-pressed="false">Sideways</button></div></div>' +
    `<div class="glass brk-wrap" id="bracketMap" data-view="actual" data-layout="mirror">${buildBracket(D, "actual")}${buildBracket(D, "picked")}` +
    `${buildSidewaysBracket(D, "actual")}${buildSidewaysBracket(D, "picked")}</div>` + '</div>' +
    shead("sec-finalfour", "\u{1F3C5}", "Your final four", `${D.FF_ALIVE}/${D.QF_WIN.length} still alive`) +
    `<div class="ffgrid">${buildFinalfour(D)}</div>` + '</div>' +
    shead("sec-story", "\u2728", "How it played out", "so far") +
    `<div class="g3">${buildStory(D)}</div>` + '</div>' +
    shead("sec-scoring", "\u{1F3AF}", "Scoring &amp; schedule", "80 max") +
    '<div class="g2"><div class="glass" style="padding:20px"><div style="font-weight:700;margin-bottom:12px">Points double every round</div>' +
    '<div class="scard" style="padding:0">' +
    '<div class="scrow schead" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc">Round</div><div class="tc">Games</div><div class="tc">Pts</div><div class="tc">Earned</div><div class="tc">Settled</div><div class="tc">Max</div></div>' +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc">Round of 32</div><div class="tc">16</div><div class="tc">1</div><div class="tc"><b>${D.EARNED.r32}</b></div><div class="tc">${D.SETTLED.r32}</div><div class="tc">16</div></div>` +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc">Round of 16</div><div class="tc">8</div><div class="tc">2</div><div class="tc"><b>${D.EARNED.r16}</b></div><div class="tc">${D.SETTLED.r16}</div><div class="tc">16</div></div>` +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc">Quarterfinals</div><div class="tc">4</div><div class="tc">4</div><div class="tc"><b>${D.EARNED.qf}</b></div><div class="tc">${D.SETTLED.qf}</div><div class="tc">16</div></div>` +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc">Semifinals</div><div class="tc">2</div><div class="tc">8</div><div class="tc"><b>${D.EARNED.sf}</b></div><div class="tc">${D.SETTLED.sf}</div><div class="tc">16</div></div>` +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px"><div class="tc"><b>Final (Champion)</b></div><div class="tc">1</div><div class="tc">16</div><div class="tc"><b>${D.EARNED.final}</b></div><div class="tc">${D.SETTLED.final}</div><div class="tc">16</div></div>` +
    `<div class="scrow" style="grid-template-columns:1fr 46px 42px 56px 60px 44px;border-top:1px solid var(--border)"><div class="tc"><b>Total</b></div><div class="tc">31</div><div class="tc"></div><div class="tc"><b>${D.CONF}</b></div><div class="tc"><b id="scSettled">${D.SETTLED_TOTAL}</b></div><div class="tc"><b>80</b></div></div>` +
    '</div><div style="font-size:.8rem;color:var(--muted);margin-top:12px;line-height:1.5"><b>Earned</b> is what you\u2019ve banked in each round. <b>Settled</b> is the most those completed games could pay, so you\u2019re on <b>' + `${D.CONF} of ${D.SETTLED_TOTAL}` + '</b> settled right now, out of <b>80</b> max. Each pick is scored on its own, and the Champion is worth a full 16. ' +
    `Tiebreaker: total goals in the Final at the end of extra time \u2014 penalties don\u2019t count. Your tiebreaker: <b>${esc(D.TIEBREAKER)}</b>.</div></div>` +
    '<div class="glass" style="padding:20px"><div style="font-weight:700;margin-bottom:4px">Where the tournament stands</div>' +
    `<div style="font-size:.8rem;color:var(--muted);margin-bottom:8px">Live results as of ${localRefreshed(D.REFRESHED)} \u00b7 auto-syncs a few times a day</div>` +
    `<div class="stages" style="grid-template-columns:1fr;padding:0;gap:8px">${buildStages(D)}</div></div></div>` + '</div>' +
    '<div class="glass foot"><b>Sources.</b> Your picks, scoring, tiebreaker and any host bonus rule from your <b>SLED World Cup 2026 bracket workbook</b> and the challenge instructions. ' +
    'Match results, scores and kickoff times from <b>FIFA official match records</b> (fifa.com), corroborated by NBC Sports, CBS Sports, ESPN and Sporting News, for the 2026 FIFA World Cup. Kickoff times anchored to ET, converted to CT/PT. Hover-card country pedigree (titles, best finish) from public FIFA World Cup historical records.' +
    `<div class="src"><b>Status.</b> ${esc(D.LIVE_STATUS)} ` +
    `You have <b>${D.CONF} points</b> confirmed, <b>${D.LIVE}</b> live, max attainable <b>${D.ATTAIN}</b>. ` +
    `This is your personal, <b>unofficial</b> tally for Rob to review \u2014 his scoring is authoritative. Champion ${esc(D.CHAMP)} \u00b7 runner-up ${esc(D.RUNNER)}.</div>` +
    `<div class="src">Live results as of <b>${localRefreshed(D.REFRESHED)}</b> \u00b7 reading mode, favorites and any manual score edits are saved on this device.</div>` +
    '<div class="src">\u{1F3C6} Thank you to <b>Rob Brautigam</b> for hosting the 2026 FIFA World Cup bracket challenge for SLED.</div>' +
    (D.CREDIT ? `<div class="src credit"><span>${esc(D.CREDIT)}</span>` +
      '<span class="credit-social" role="group" aria-label="Project links">' +
      `<a href="https://www.linkedin.com/in/ericxlam/" target="_blank" rel="noopener" aria-label="Eric Lam on LinkedIn" title="LinkedIn">${LINKEDIN_ICON}</a>` +
      `<a href="https://github.com/eriic-builds/sled-mywcbracket" target="_blank" rel="noopener" aria-label="This project on GitHub" title="GitHub repo">${GITHUB_ICON}</a>` +
      '</span></div>' : "") + '</div>' +
    '</div></div>';   // close .content, .shell
  DASHBOARD_HTML_CACHE.set(D, html);
  return html;
}
