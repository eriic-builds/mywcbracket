import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const between = (source, start, end) => {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  return startAt >= 0 && endAt > startAt ? source.slice(startAt, endAt) : "";
};

const interact = read("../docs/js/interact.js");
const render = read("../docs/js/render.js");
const matchDetails = read("../docs/js/match-details.js");
const celebrationScene = read("../docs/js/champion-celebration-scene.js");

function check(name, test) {
  try {
    test();
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
}

check("connector redraw caches structural lookups", () => {
  const connector = between(interact, "function drawConnectors()", "window.__drawConn=drawConnectors;");
  assert.match(interact, /var connectorCache=\{/);
  assert.match(interact, /function invalidateConnectorCache\(\)/);
  assert.match(interact, /function getConnectorContext\(\)/);
  assert.match(interact, /function scheduleConnectorDraw\(delay\)/);
  assert.match(connector, /var context=getConnectorContext\(\);if\(!context\)return;/);
  assert.match(connector, /context\.cardsByCode\[row\.dataset\.feeder\]/);
  assert.match(connector, /context\.teamsByCode\[row\.dataset\.feeder\]/);
  assert.match(connector, /context\.curtainMeta/);
  assert.doesNotMatch(connector, /querySelector\('\.mcard\[data-match-code="'\+row\.dataset\.feeder/);
});

check("render orchestration memoizes state and html", () => {
  const dashboard = between(render, "export function renderDashboard", "</div></div>';   // close .content, .shell");
  assert.match(render, /const STATE_CACHE = new WeakMap\(\)/);
  assert.match(render, /const DASHBOARD_HTML_CACHE = new WeakMap\(\)/);
  assert.match(render, /function picksMemoSignature\(picks\)/);
  assert.match(render, /function liveMemoSignature\(live\)/);
  assert.match(render, /function memoizedState\(picks, live, topology\)/);
  assert.match(dashboard, /const D = memoizedState\(picks, live, topology\)/);
  assert.match(dashboard, /const cachedHtml = DASHBOARD_HTML_CACHE\.get\(D\)/);
  assert.match(dashboard, /if \(cachedHtml\) return cachedHtml;/);
  assert.match(render, /DASHBOARD_HTML_CACHE\.set\(D, html\)/);
});

check("match-details geometry work is frame-throttled", () => {
  const runtime = between(matchDetails, "const controller = new AbortController();", "return () => {");
  assert.match(runtime, /let layoutFrame = 0/);
  assert.match(runtime, /function scheduleGeometryRefresh\(\)/);
  assert.match(runtime, /if \(layoutFrame\) return;/);
  assert.match(runtime, /layoutFrame = requestAnimationFrame\(\(\) => \{/);
  assert.match(runtime, /container\.dataset\.portraitWidth = String\(availableWidth\)/);
  assert.match(runtime, /container\.dataset\.portraitMode = mode/);
  assert.match(runtime, /window\.addEventListener\("resize", \(\) => \{[\s\S]*scheduleGeometryRefresh\(\)/);
});

check("celebration camera projection updates are gated", () => {
  const camera = between(celebrationScene, "function applyCamera(timeSeconds, progress)", "function profileTeammateX");
  assert.match(celebrationScene, /let projectionDirty = true/);
  assert.match(camera, /if \(Math\.abs\(camera\.fov - nextFov\) > 1e-4\) \{/);
  assert.match(camera, /projectionDirty = true/);
  assert.match(camera, /if \(projectionDirty\) \{[\s\S]*camera\.updateProjectionMatrix\(\);[\s\S]*projectionDirty = false;/);
});

console.log("\nPERFORMANCE BUDGET SUITE OK");
