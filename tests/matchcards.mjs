import fs from "fs";
import { deriveBracketTree } from "../docs/js/bracket-tree.js";
import { buildBracket, buildSidewaysBracket, computeState, esc, renderDashboard } from "../docs/js/render.js";

const load = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const picks = load("../docs/data/demo-picks.json");
const topology = load("../docs/data/topology.json");
const frozen = load("./fixtures/results.frozen.json");
const tree = deriveBracketTree(topology);
const D = computeState(picks, frozen, topology);
const actual = buildBracket(D, "actual");
const picked = buildBracket(D, "picked");
const sidewaysActual = buildSidewaysBracket(D, "actual");
const sidewaysPicked = buildSidewaysBracket(D, "picked");
let fails = 0;

function check(name, pass, detail = "") {
  if (pass) {
    console.log("  ok   " + name);
    return;
  }
  fails++;
  console.log("  DIFF " + name + (detail ? "\n    " + detail : ""));
}

function same(actualValue, expectedValue) {
  return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
}

function cardTags(html) {
  return [...html.matchAll(/<div class="mcard[^>]*>/g)].map((match) => match[0]);
}

function cardTag(html, code) {
  return cardTags(html).find((tag) => tag.includes(`data-match-code="${code}"`)) || "";
}

function sidewaysPlayedTags(html) {
  return [...html.matchAll(/<div class="match"[^>]*data-played="true"[^>]*>/g)]
    .map((match) => match[0]);
}

function detailControlTags(html, className) {
  return [...html.matchAll(new RegExp(`<div class="${className}[^"]*"[^>]*role="button"[^>]*>`, "g"))]
    .map((match) => match[0]);
}

function cardChunk(html, code) {
  const marker = `<div class="mcard`;
  const codeAt = html.indexOf(`data-match-code="${code}"`);
  const start = html.lastIndexOf(marker, codeAt);
  const end = html.indexOf(marker, codeAt);
  return html.slice(start, end < 0 ? html.length : end);
}

function attribute(tag, name) {
  return new RegExp(` ${name}="([^"]*)"`).exec(tag)?.[1] ?? null;
}

function geometrySequence(html) {
  return [...html.matchAll(/data-(match-code|feeder)="([^"]+)"/g)]
    .map((match) => `${match[1]}:${match[2]}`);
}

function championChunk(html, sideways = false) {
  const start = html.indexOf(sideways ? '<div class="round champcol">' : '<div class="champ-state">');
  const end = sideways
    ? html.indexOf("</div></div></div>", start) + "</div></div></div>".length
    : html.indexOf('<div class="bkhead">Final', start);
  return html.slice(start, end);
}

for (const [name, html] of [["actual", actual], ["picked", picked]]) {
  const tags = cardTags(html);
  const codes = tags.map((tag) => attribute(tag, "data-match-code"));
  check(`${name} has 31 match cards`, tags.length === 31, `got ${tags.length}`);
  check(`${name} map has no seed labels`, !html.includes('class="seed"'));
  check(`${name} has every expected code once`, same(codes, tree.nodes.map((node) => node.code)), `got ${JSON.stringify(codes)}`);
  check(
    `${name} cards carry round and side`,
    tags.every((tag) => / data-round="(?:r32|r16|qf|sf|final)"/.test(tag) && / data-side="[LRC]"/.test(tag)),
  );
}

for (const [name, html] of [["actual", sidewaysActual], ["picked", sidewaysPicked]]) {
  check(
    `sideways ${name} restores six legacy columns`,
    (html.match(/class="round(?: |")/g) || []).length === 6,
  );
  check(
    `sideways ${name} restores 32 legacy country-box groups`,
    (html.match(/class="match(?: |")/g) || []).length === 32,
  );
  check(
    `sideways ${name} keeps country boxes with flags and no seeds`,
    !html.includes('class="mcard') &&
      html.includes('class="mflag"') &&
      !html.includes('class="seed"'),
  );
  check(
    `sideways ${name} keeps the champion column`,
    /class="round champcol"[\s\S]*?class="trophy-slot" data-trophy[\s\S]*?data-team="England"/.test(html),
  );
}
const sidewaysPlayed = sidewaysPlayedTags(sidewaysActual);
const sidewaysControls = detailControlTags(sidewaysActual, "mlabel");
check(
  "sideways actual exposes every decided match for facts",
  sidewaysPlayed.length === Object.keys(frozen.res).length
    && sidewaysPlayed.every(tag =>
      /data-match-code="M\d+"/.test(tag)
      && /data-home="[^"]+"/.test(tag)
      && /data-away="[^"]+"/.test(tag)
    ),
  `got ${sidewaysPlayed.length}`,
);
check(
  "sideways actual gives every decided match an accessible detail control",
  sidewaysControls.length === Object.keys(frozen.res).length
    && sidewaysControls.every(tag =>
      /tabindex="0"/.test(tag)
      && /aria-haspopup="dialog"/.test(tag)
      && /aria-controls="matchdlg"/.test(tag)
    ),
  `got ${sidewaysControls.length}`,
);
check(
  "sideways picked exposes no match facts",
  !sidewaysPicked.includes('data-played="true"')
    && !sidewaysPicked.includes('data-home=')
    && detailControlTags(sidewaysPicked, "mlabel").length === 0,
);

for (const code of Object.keys(frozen.res)) {
  const tag = cardTag(actual, code);
  const node = tree.byCode[code];
  const participants = node.round === "r32"
    ? topology.r32.find(([matchCode]) => matchCode === code).slice(2, 4)
    : node.feeders.map((feeder) => frozen.res[feeder][2]);
  check(
    `${code} exposes frozen actual participants`,
    attribute(tag, "data-played") === "true" &&
      attribute(tag, "data-home") === esc(participants[0]) &&
      attribute(tag, "data-away") === esc(participants[1]),
    `got ${tag}`,
  );
}

check("picked view exposes no played state", !picked.includes("data-played="));
check("picked view exposes no actual participant attributes", !picked.includes("data-home=") && !picked.includes("data-away="));
for (const [name, html] of [["actual", actual], ["picked", picked]]) {
  const namedRows = [...html.matchAll(/<div class="team[^>]*data-team="[^"]+"[^>]*>[\s\S]*?<\/div>/g)].map((match) => match[0]);
  check(
    `${name} named rows carry visual team codes`,
    namedRows.length > 0 && namedRows.every((row) => /<span class="tcode" aria-hidden="true">[A-Z]{3}<\/span>/.test(row)),
  );
}
const mirrorControls = detailControlTags(actual, "mhead");
check(
  "only decided actual cards expose accessible detail controls",
  mirrorControls.length === Object.keys(frozen.res).length
    && mirrorControls.every(tag =>
      /tabindex="0"/.test(tag)
      && /aria-haspopup="dialog"/.test(tag)
      && /aria-controls="matchdlg"/.test(tag)
    )
    && cardTags(actual).every(tag => !tag.includes('tabindex="0"')),
);
check(
  "picked cards expose no detail controls",
  detailControlTags(picked, "mhead").length === 0
    && cardTags(picked).every(tag => !tag.includes('tabindex="0"')),
);

const unresolvedActualSlots = tree.nodes
  .filter((node) => node.feeders)
  .flatMap((node) => node.feeders)
  .filter((feeder) => !Object.hasOwn(frozen.res, feeder)).length;
check("neither view emits invisible blank rows", !actual.includes("team blank") && !picked.includes("team blank"));
check(
  "every unresolved actual feeder is visible",
  (actual.match(/class="team placeholder"/g) || []).length === unresolvedActualSlots,
  `expected ${unresolvedActualSlots}`,
);
check("picked chain has no unresolved slots", !picked.includes('class="team placeholder"'));
check("actual placeholders name their feeder", /Winner M\d+/.test(actual));
check("pending headers use readable dates, not raw UTC", !actual.includes("T19:00:00Z") && !actual.includes("T21:00:00Z"));
check("M99 header uses its scheduled day", cardChunk(actual, "M99").includes("Sat Jul 11"));

const m97 = cardChunk(actual, "M97");
check("M97 France is the winning row with score 2", /class="team st-won[^"]*" data-team="France"[\s\S]*?<span class="tscore">2<\/span>/.test(m97));
check("M97 Morocco is the losing row with score 0", /class="team st-lost[^"]*" data-team="Morocco"[\s\S]*?<span class="tscore">0<\/span>/.test(m97));
check(
  "M104 actual card has two feeder placeholders",
  (cardChunk(actual, "M104").match(/class="team placeholder"/g) || []).length === 2,
);
check(
  "picked champion state keeps England gold",
  /class="team st-pending champ" data-team="England"[\s\S]*?<span class="tt">\u{1F3C6}<\/span>/u.test(picked),
);
check(
  "only mirrored champions expose the celebration trigger",
  (actual.match(/data-champion-celebration-trigger/g) || []).length === 1
    && (picked.match(/data-champion-celebration-trigger/g) || []).length === 1
    && !sidewaysActual.includes("data-champion-celebration-trigger")
    && !sidewaysPicked.includes("data-champion-celebration-trigger"),
);

const completedFinal = structuredClone(frozen);
Object.assign(completedFinal.res, {
  M98: [1, 0, "Spain", ""],
  M99: [0, 1, "England", ""],
  M100: [2, 0, "Argentina", ""],
  M101: [0, 1, "Spain", ""],
  M102: [1, 2, "Argentina", ""],
  M104: [1, 2, "Argentina", ""],
});
const finalState = computeState(picks, completedFinal, topology);
const completedActual = buildBracket(finalState, "actual");
const completedPicked = buildBracket(finalState, "picked");
const completedSidewaysActual = buildSidewaysBracket(finalState, "actual");
const completedSidewaysPicked = buildSidewaysBracket(finalState, "picked");
const actualChampion = championChunk(completedActual);
const pickedChampion = championChunk(completedPicked);
const sidewaysActualChampion = championChunk(completedSidewaysActual, true);
const sidewaysPickedChampion = championChunk(completedSidewaysPicked, true);
check(
  "completed Final shows the real champion in mirrored Actual mode",
  actualChampion.includes('class="team st-won champ" data-team="Argentina"')
    && actualChampion.includes("data-champion-celebration-trigger")
    && actualChampion.includes("World champion")
    && !actualChampion.includes('data-team="England"'),
);
check(
  "completed Final keeps the entrant champion in mirrored My picks",
  pickedChampion.includes('data-team="England"')
    && pickedChampion.includes("data-champion-celebration-trigger")
    && !pickedChampion.includes('data-team="Argentina"'),
);
check(
  "completed Final shows the real champion in Sideways Actual mode",
  sidewaysActualChampion.includes("<span>actual result</span>")
    && sidewaysActualChampion.includes('class="team st-won champ" data-team="Argentina"')
    && sidewaysActualChampion.includes("World champion"),
);
check(
  "completed Final keeps the entrant champion in Sideways My picks",
  sidewaysPickedChampion.includes("<span>your pick</span>")
    && sidewaysPickedChampion.includes('data-team="England"'),
);

for (const [name, html] of [["actual", actual], ["picked", picked]]) {
  const trophyAt = html.indexOf('<div class="trophy-slot" data-trophy></div>');
  const championAt = html.indexOf('<div class="champ-state">', trophyAt);
  const finalAt = html.indexOf('<div class="bkhead">Final', trophyAt);
  const m104At = html.indexOf('data-match-code="M104"', trophyAt);
  check(
    `${name} places the champion country directly below the trophy`,
    trophyAt >= 0 && championAt > trophyAt && finalAt > championAt && m104At > finalAt,
  );
}
check("penalty notes remain visible", ["M74", "M75", "M88", "M96"].every((code) => cardChunk(actual, code).includes(esc(frozen.res[code][3]))));

const hostile = JSON.parse(JSON.stringify(picks));
hostile.entrant = "<script>alert('entrant')</script>";
const hostileHtml = renderDashboard(hostile, frozen, topology);
check("hostile pick text is escaped", !hostileHtml.includes("<script") && hostileHtml.includes("&lt;script&gt;"));
const dashboard = renderDashboard(picks, frozen, topology);
check(
  "dashboard footer links LinkedIn and GitHub icons",
  dashboard.includes('href="https://www.linkedin.com/in/ericxlam/"')
    && dashboard.includes('aria-label="Eric Lam on LinkedIn"')
    && dashboard.includes('href="https://github.com/eriic-builds/mywcbracket"')
    && dashboard.includes('aria-label="This project on GitHub"'),
);
const railFilterAt = dashboard.indexOf('<div class="railfilter glass" id="railFilter">');
const contentAt = dashboard.indexOf('<div class="content">');
const railFilter = dashboard.slice(railFilterAt, contentAt);
check(
  "dashboard restores a standalone team filter below page navigation",
  railFilterAt > dashboard.indexOf('</nav>')
    && contentAt > railFilterAt
    && railFilter.includes('id="rfToggle"')
    && railFilter.includes('id="count"')
    && (railFilter.match(/<button class="chip/g) || []).length === 16
    && (railFilter.match(/class="chip-flag"/g) || []).length === 16
    && !railFilter.includes('class="cseed"')
    && !dashboard.includes('class="filterbar'),
);
check(
  "dashboard exposes mirrored and sideways layout controls",
  dashboard.includes('data-layout="mirror"') &&
    dashboard.includes('data-layout="sideways"') &&
    dashboard.includes('class="bracket layout-mirror mode-actual"') &&
    dashboard.includes('class="bracket layout-sideways mode-actual"'),
);
check(
  "dashboard exposes an accessible map expansion control",
  dashboard.includes('id="mapExpandToggle"') &&
    dashboard.includes('aria-expanded="false"') &&
    dashboard.includes('aria-controls="bracketMap"') &&
    dashboard.includes('id="bracketMap"'),
);
check(
  "dashboard uses Bracket Table wording",
  dashboard.includes("Bracket Table</a>")
    && dashboard.includes('aria-label="Bracket Table data view"')
    && dashboard.includes(">Expand table</button>")
    && !dashboard.includes("Bracket map")
    && !dashboard.includes("Expand map"),
);
check(
  "map expansion control sits between data and layout toggles",
  dashboard.indexOf('class="brk-toggle"') <
    dashboard.indexOf('id="mapExpandToggle"') &&
    dashboard.indexOf('id="mapExpandToggle"') <
    dashboard.indexOf('class="layout-toggle"'),
);

check(
  "both views share match and feeder geometry",
  same(geometrySequence(actual), geometrySequence(picked)),
);
check("both views include an empty trophy mount", [actual, picked].every((html) => html.includes('<div class="trophy-slot" data-trophy></div>')));
for (const [name, html] of [["actual", actual], ["picked", picked]]) {
  const overview = /<svg class="mini-map"[^>]*>[\s\S]*?<\/svg>/.exec(html)?.[0] || "";
  check(
    `${name} mini overview is decorative`,
    /aria-hidden="true"/.test(overview) && /role="presentation"/.test(overview),
  );
  check(
    `${name} mini overview has 31 nodes`,
    (overview.match(/<rect class="mm-node /g) || []).length === 31,
  );
  check(
    `${name} mini overview has 30 edges`,
    (overview.match(/<path class="mm-edge"/g) || []).length === 30,
  );
}

console.log(fails ? `\nFAILED: ${fails}` : "\nMATCH CARDS OK: both 31-game views share geometry and preserve frozen match state");
process.exit(fails ? 1 : 0);
