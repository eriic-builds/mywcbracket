import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const between = (source, start, end) => {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  return startAt >= 0 && endAt > startAt ? source.slice(startAt, endAt) : "";
};
const css = read("../docs/css/dashboard.css");
const celebrationCss = read("../docs/css/champion-celebration.css");
const index = read("../docs/index.html");
const interact = read("../docs/js/interact.js");
const builder = read("../docs/js/builder.js");
const render = read("../docs/js/render.js");
const matchDetails = read("../docs/js/match-details.js");
const trophy = read("../docs/js/trophy.js");
const celebration = read("../docs/js/champion-celebration.js");
const celebrationScene = read("../docs/js/champion-celebration-scene.js");
const celebrationModels = read("../docs/js/champion-celebration-models.js");
const celebrationEffects = read("../docs/js/champion-celebration-effects.js");

function check(name, test) {
  try {
    test();
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
}

check("score progress uses a full-width transform fill", () => {
  assert.match(
    css,
    /\.sb-track i\{[^}]*width:100%[^}]*transform-origin:left center[^}]*transition:transform \.35s/,
  );
  assert.doesNotMatch(css, /\.sb-track i\{[^}]*transition:width/);
  assert.match(render, /id="scBar" style="transform:scaleX\(\$\{progress\}\)"/);
  assert.match(interact, /bar\.style\.transform='scaleX\('\+ratio\+'\)'/);
  assert.doesNotMatch(interact, /bar\.style\.width/);
});

check("builder progress uses a full-width transform fill", () => {
  assert.match(
    index,
    /\.bld-prog i\{[^}]*width:100%[^}]*transform-origin:left center[^}]*transition:transform \.2s/,
  );
  assert.match(builder, /class="bld-prog"><i style="transform:scaleX\(\$\{totalPicked\(\) \/ 31\}\)"/);
  assert.doesNotMatch(builder, /class="bld-prog"><i style="width:/);
});

check("team stat card coalesces pointer tracking into translate", () => {
  const tracking = interact.match(
    /\/\/ ---- hover: quick World Cup stat card[\s\S]*?paintFav\(\);apply\(\);recalc\(\);drawConnectors\(\);/,
  )?.[0] || "";
  assert.match(css, /\.statcard\{[^}]*left:0;top:0[^}]*translate:0 0/);
  assert.match(tracking, /cardFrame=nextFrame\(placeCard\)/);
  assert.match(tracking, /card\.style\.translate=/);
  assert.doesNotMatch(tracking, /card\.style\.(?:left|top|transform)=/);
  assert.match(interact, /adapted from wc26-bracket/);
  assert.doesNotMatch(interact, /extracted VERBATIM/);
});

check("connector redraw uses lifecycle caches and coalesced scheduling", () => {
  const connectorSection = between(interact, "function drawConnectors()", "window.__drawConn=drawConnectors;");
  assert.match(interact, /var connectorCache=\{/);
  assert.match(interact, /function getConnectorContext\(\)/);
  assert.match(interact, /function scheduleConnectorDraw\(delay\)/);
  assert.match(connectorSection, /var context=getConnectorContext\(\);if\(!context\)return;/);
  assert.match(connectorSection, /var fromCard=context\.cardsByCode\[row\.dataset\.feeder\]/);
  assert.match(connectorSection, /context\.teamsByCode\[row\.dataset\.feeder\]/);
  assert.match(connectorSection, /var rounds=context\.rounds;/);
  assert.match(connectorSection, /var finalCard=context\.finalCard;/);
  assert.doesNotMatch(connectorSection, /bracket\.querySelector\('\.mcard\[data-match-code="'\+row\.dataset\.feeder/);
  assert.match(interact, /scheduleConnectorDraw\(60\)/);
});

check("static match fact-card positioning remains an intentional exception", () => {
  assert.match(matchDetails, /function positionFactCard\(card\)/);
  assert.match(matchDetails, /factcard\.style\.left/);
  assert.match(matchDetails, /factcard\.style\.top/);
  assert.doesNotMatch(matchDetails, /requestAnimationFrame\([^)]*positionFactCard/);
});

check("match details geometry refresh is frame-throttled and memoized", () => {
  const runtime = between(matchDetails, "const controller = new AbortController();", "return () => {");
  assert.match(runtime, /let layoutFrame = 0/);
  assert.match(runtime, /function scheduleGeometryRefresh\(\)/);
  assert.match(runtime, /if \(layoutFrame\) return;/);
  assert.match(runtime, /layoutFrame = requestAnimationFrame\(\(\) => \{/);
  assert.match(runtime, /container\.dataset\.portraitWidth = String\(availableWidth\)/);
  assert.match(runtime, /container\.dataset\.portraitMode = mode/);
  assert.match(runtime, /window\.addEventListener\("resize", \(\) => \{[\s\S]*scheduleGeometryRefresh\(\)/);
});

check("runtime CSS names every transitioned property", () => {
  const declarations = [...`${css}\n${celebrationCss}\n${index}`.matchAll(/transition\s*:\s*([^;}]+)/g)]
    .map(match => match[1].trim());
  assert.ok(declarations.length > 20, "expected to audit the full runtime transition surface");
  for (const declaration of declarations) {
    for (const item of declaration.split(",")) {
      assert.doesNotMatch(
        item.trim(),
        /^(?:\d*\.)?\d+(?:ms|s)\b/,
        `duration-only transition animates every property: ${declaration}`,
      );
      assert.doesNotMatch(
        item,
        /\b(?:left|right|top|bottom|width|height|margin|padding|max-height)\b/,
        `layout property must not transition: ${declaration}`,
      );
    }
  }
});

check("toggle and live pulses use compositor-eligible properties", () => {
  assert.match(css, /\.toggle input:checked \+ \.tsw::after\{[^}]*transform:translateX\(16px\)/);
  assert.doesNotMatch(css, /\.toggle input:checked \+ \.tsw::after\{[^}]*left:/);
  assert.match(css, /\.pill\.live \.dot::after\{[^}]*animation:pulse/);
  assert.match(css, /@keyframes pulse\{[^}]*opacity:[^}]*transform:scale/);
  assert.doesNotMatch(css, /@keyframes pulse\{[^\n]*box-shadow/);
  assert.match(index, /\.badge \.dot::after\{[^}]*animation:lbadge-pulse/);
  assert.match(index, /@keyframes lbadge-pulse\{[^}]*opacity:[^}]*transform:scale/);
  assert.doesNotMatch(index, /@keyframes lbadge-pulse\{[^\n]*box-shadow/);
});

check("reduced motion includes pulse pseudo-elements", () => {
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{/);
  assert.match(css, /data-theme="easy"\] \.pill\.live \.dot::after\{animation:none\}/);
  assert.match(css, /data-theme="geocities"\] \.pill\.live \.dot::after\{animation:none\}/);
  assert.match(index, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(index, /#landing \.badge \.dot::after\{animation:none\}/);
});

check("trophy bounds passive rendering and releases phone WebGL", () => {
  assert.match(trophy, /const AUTO_FRAME_MS = 1000 \/ 30/);
  assert.match(trophy, /now - lastFrame < AUTO_FRAME_MS/);
  assert.match(
    trophy,
    /now - lastFrame < AUTO_FRAME_MS\)[\s\S]*?requestAnimationFrame\(animate\)[\s\S]*?return/,
  );
  assert.match(
    trophy,
    /if \(phone\) \{[\s\S]*?disposeScene\(\)[\s\S]*?classList\.remove\("trophy-ready"\)/,
  );
  assert.match(trophy, /if \(dragging && event\.pointerId === pointerId\)[\s\S]*?renderNow\(\)/);
  for (const lifecycle of [
    "IntersectionObserver",
    "visibilitychange",
    "prefers-reduced-motion: reduce",
    "webglcontextlost",
    "powerPreference: \"low-power\"",
  ]) {
    assert.ok(trophy.includes(lifecycle), `missing trophy lifecycle safeguard: ${lifecycle}`);
  }
  assert.match(trophy, /externalSuspensions\.size === 0/);
  assert.match(trophy, /renderNow\(\)[\s\S]*?context\.drawImage\(canvas, 0, 0\)/);
});

check("champion celebration bounds WebGL and frame-owned resources", () => {
  assert.match(celebrationScene, /CELEBRATION_DPR_LIMIT = 1\.5/);
  assert.match(celebrationScene, /renderer\.setPixelRatio\(Math\.min/);
  assert.equal((celebration.match(/className = "champion-celebration-canvas"/g) || []).length, 1);
  assert.match(celebrationModels, /MAX_CROWD_INSTANCES = 480/);
  assert.match(celebrationModels, /PHONE_CROWD_INSTANCES = 260/);
  assert.match(celebrationModels, /new THREE\.InstancedMesh/);
  assert.match(celebrationEffects, /confetti: 384/);
  assert.match(celebrationEffects, /confetti: 192/);
  assert.match(celebrationEffects, /new THREE\.InstancedMesh/);
  assert.doesNotMatch(celebrationCss, /transition\s*:\s*all\b/);
  assert.match(celebration, /visibilitychange/);
  assert.match(celebration, /ResizeObserver/);
  assert.match(celebrationScene, /webglcontextlost/);
});

check("celebration frame paths avoid layout and resource construction", () => {
  const sceneFrame = between(celebrationScene, "function renderFrame(timeSeconds)", "function resize(");
  const effectsFrame = between(celebrationEffects, "function updateFlag(", "function destroy()");
  for (const frameSource of [sceneFrame, effectsFrame]) {
    assert.doesNotMatch(frameSource, /getBoundingClientRect|clientWidth|clientHeight|Math\.random/);
    assert.doesNotMatch(frameSource, /new THREE\.|new Array|new Float32Array|new Uint8Array/);
    assert.doesNotMatch(frameSource, /for\s*\([^)]*\bof\s*\[/);
  }
  assert.doesNotMatch(
    celebrationScene,
    /scene\.updateMatrixWorld\(true\)|captain\.root\.updateMatrixWorld\(true\)/,
  );
  assert.doesNotMatch(effectsFrame, /computeVertexNormals/);
  assert.match(celebration, /sceneController\?\.destroy\(\)/);
  assert.doesNotMatch(
    [celebration, celebrationScene, celebrationModels, celebrationEffects].join("\n"),
    /AudioContext|createOscillator|createBufferSource|audioController/,
  );
});

console.log("\nANIMATION PERFORMANCE GUARDS OK");
