import { TEAM_CODE3, flagCode } from "../../js/flags.js";
import { createChampionScene } from "../../js/champion-celebration-scene.js";
import {
  CELEBRATION_DURATION,
  CELEBRATION_TIMING,
  CURTAIN_DURATION,
  TROPHY_CROSSFADE_END,
  TROPHY_CROSSFADE_START,
  celebrationProgressAt,
  phaseAt,
} from "../../js/champion-celebration-timeline.js";

const ACTIVATION_WINDOW_MS = 2500;
const TEAM_NAMES = Object.keys(TEAM_CODE3).sort((a, b) => a.localeCompare(b));
const DEFAULT_TEAM = "England";
const FORCE_WEBGL_FALLBACK =
  new URLSearchParams(window.location.search).get("mockWebglFallback") === "1";
const PHASE_LABELS = Object.freeze({
  opening: "Bracket opens as the captain enters behind the curtain",
  "cleared-hold": "Curtain clears around the moving captain",
  "captain-entry": "Captain continues side-on toward the trophy",
  "trophy-approach": "Side-on walk, crowd-hype fist, then trophy focus",
  "trophy-grab": "Crouch, close both hands, and lift from the plinth",
  "carry-reveal": "Natural rightward carry while teammates watch",
  "captain-joins": "Captain climbs the left steps and walks sideways to center",
  "team-settle": "Team plants, varies its fist gestures, and builds toward the lift",
  "lift-jump": "Full lift and synchronized team jump",
  "payoff-build": "The lift-synchronized flare, flag, and confetti burst continues",
  "champion-hold": "Champions face the viewer",
  restore: "Bracket restore",
});

const $ = selector => document.querySelector(selector);
const dom = {
  teamSelect: $("#teamSelect"),
  playButton: $("#playButton"),
  pauseButton: $("#pauseButton"),
  resetButton: $("#resetButton"),
  timeline: $("#timeline"),
  timeReadout: $("#timeReadout"),
  phaseReadout: $("#phaseReadout"),
  motionButton: $("#motionButton"),
  mockViewport: $("#mockViewport"),
  mockBracket: $("#mockBracket"),
  bracketGrid: $("#bracketGrid"),
  connectorSvg: $("#connectorSvg"),
  cinematic: $("#cinematic"),
  sceneCanvas: $("#sceneCanvas"),
  dissolveCanvas: $("#dissolveCanvas"),
  trophyMorph: $("#trophyMorph"),
  cinematicTeam: $("#cinematicTeam"),
  cinematicPhase: $("#cinematicPhase"),
  cinematicMotion: $("#cinematicMotion"),
  cinematicReplay: $("#cinematicReplay"),
  cinematicSkip: $("#cinematicSkip"),
  cinematicScrubber: $("#cinematicScrubber"),
  staticFallback: $("#staticFallback"),
  fallbackFlag: $("#fallbackFlag"),
  fallbackTeam: $("#fallbackTeam"),
};

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
const lerp = (start, end, progress) => start + (end - start) * progress;
const smooth = value => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

const state = {
  team: DEFAULT_TEAM,
  controller: null,
  controllerPromise: null,
  controllerAbort: null,
  sceneGeneration: 0,
  stageOpen: false,
  playing: false,
  starting: false,
  currentTime: 0,
  lastFrameAt: 0,
  frame: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  webglFailed: FORCE_WEBGL_FALLBACK,
  dissolveParticles: [],
  activationTimes: [],
  resizeFrame: 0,
  stageAnimation: null,
  trophyMorphSource: null,
  curtainAnimations: [],
};

function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function phaseLabel(time) {
  if (!state.stageOpen) return "Bracket ready";
  if (state.reducedMotion) return "Reduced-motion winner tableau";
  return PHASE_LABELS[phaseAt(time).id] || "Bracket ready";
}

function teamFlagUrl(team) {
  const code = flagCode(team);
  return code ? new URL(`../../flags/${code}.svg`, import.meta.url).href : "";
}

function createTeamRow(team) {
  const row = document.createElement("div");
  row.className = "mock-team-row";
  const url = teamFlagUrl(team);
  if (url) {
    const flag = document.createElement("img");
    flag.src = url;
    flag.alt = "";
    flag.decoding = "async";
    row.append(flag);
  }
  const label = document.createElement("span");
  label.textContent = TEAM_CODE3[team] || team;
  row.append(label);
  return row;
}

function createMatchBox(code, home, away, final = false) {
  const box = document.createElement("div");
  box.className = final ? "mock-final-box" : "mock-match-box";
  box.dataset.matchCode = code;
  const header = document.createElement("div");
  header.className = "mock-match-code";
  header.innerHTML = `<span>${code}</span><span>${final ? "Final" : "Knockout"}</span>`;
  box.append(header, createTeamRow(home), createTeamRow(away));
  return box;
}

function buildBracket() {
  state.curtainAnimations.forEach(animation => animation.cancel());
  state.curtainAnimations = [];
  dom.bracketGrid.replaceChildren();
  const pool = [
    "France", "Morocco", "Spain", "England", "Argentina", "Switzerland", "Brazil",
    "Portugal", "Germany", "Netherlands", "Colombia", "Japan", "United States",
    "Mexico", "Senegal", "Belgium", "Norway", "Croatia", "Ghana", "Australia",
    "Paraguay", "Canada", "Ecuador", "Sweden", "Austria", "Algeria", "South Africa",
    "Ivory Coast", "Egypt", "Cape Verde", "DR Congo", "Bosnia & Herz.",
  ];
  const definitions = [
    { count: 8, label: "Round of 32", side: "L" },
    { count: 4, label: "Round of 16", side: "L" },
    { count: 2, label: "Quarterfinals", side: "L" },
    { count: 1, label: "Semifinals", side: "L" },
    { center: true, label: "Winner stage", side: "C" },
    { count: 1, label: "Semifinals", side: "R" },
    { count: 2, label: "Quarterfinals", side: "R" },
    { count: 4, label: "Round of 16", side: "R" },
    { count: 8, label: "Round of 32", side: "R" },
  ];
  let code = 73;
  let teamOffset = 0;

  definitions.forEach((definition, columnIndex) => {
    const column = document.createElement("div");
    column.className = `mock-column${definition.center ? " mock-center" : ""}`;
    column.dataset.column = String(columnIndex);
    column.dataset.side = definition.side;
    const roundLabel = document.createElement("span");
    roundLabel.className = "mock-round-label";
    roundLabel.textContent = definition.label;
    column.append(roundLabel);

    if (definition.center) {
      const trophy = document.createElement("div");
      trophy.className = "mock-trophy-shell";
      trophy.innerHTML = '<img src="../../assets/trophy-fallback.svg" alt="">';
      const champion = document.createElement("div");
      champion.className = "mock-champion";
      champion.tabIndex = 0;
      champion.setAttribute("aria-label", "Champion box. Hidden mock trigger.");
      champion.innerHTML = '<img alt=""><span></span><b aria-hidden="true">Trophy</b>';
      const note = document.createElement("p");
      note.className = "mock-note";
      note.textContent = "The selected country is shown as the current champion.";
      const final = createMatchBox("M104", "Winner M101", "Winner M102", true);
      column.append(trophy, champion, note, final);
    } else {
      for (let index = 0; index < definition.count; index++) {
        const home = pool[teamOffset % pool.length];
        const away = pool[(teamOffset + 1) % pool.length];
        column.append(createMatchBox(`M${code++}`, home, away));
        teamOffset += 2;
      }
    }
    dom.bracketGrid.append(column);
  });

  updateChampion();
  const champion = dom.mockBracket.querySelector(".mock-champion");
  champion.addEventListener("click", registerHiddenActivation);
  champion.addEventListener("dblclick", event => event.preventDefault());
  champion.addEventListener("selectstart", event => event.preventDefault());
  champion.addEventListener("keydown", event => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    registerHiddenActivation();
  });
  requestAnimationFrame(drawConnectors);
}

function curtainKeyframes({
  direction,
  start,
  end,
  distance,
  vertical = 0,
  rotation = 0,
  scale = 0.95,
}) {
  const travelStart = start + (end - start) * 0.34;
  const settleTransform =
    `translate3d(${direction * distance * 0.18}vw, ${vertical * 0.18}vh, 0) ` +
    `rotate(${direction * rotation * 0.18}deg) scale(0.995)`;
  const endTransform =
    `translate3d(${direction * distance}vw, ${vertical}vh, 0) ` +
    `rotate(${direction * rotation}deg) scale(${scale})`;
  return [
    { offset: 0, transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1 },
    { offset: start, transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1 },
    { offset: travelStart, transform: settleTransform, opacity: 1 },
    { offset: end, transform: endTransform, opacity: 0 },
    { offset: 1, transform: endTransform, opacity: 0 },
  ];
}

function buildCurtainAnimations() {
  if (typeof Element.prototype.animate !== "function") return;
  state.curtainAnimations.forEach(animation => animation.cancel());
  state.curtainAnimations = [];
  const duration = CURTAIN_DURATION * 1000;
  const add = (element, keyframes) => {
    if (!element) return;
    const animation = element.animate(keyframes, {
      duration,
      easing: "linear",
      fill: "both",
    });
    animation.pause();
    animation.currentTime = 0;
    state.curtainAnimations.push(animation);
  };

  dom.mockBracket.querySelectorAll('.mock-column[data-side="L"],.mock-column[data-side="R"]')
    .forEach(column => {
      const direction = column.dataset.side === "L" ? -1 : 1;
      const columnIndex = Number(column.dataset.column);
      const wave = Math.max(0, Math.abs(columnIndex - 4) - 1);
      const cards = [...column.querySelectorAll(":scope > .mock-match-box")];
      cards.forEach((card, row) => {
        const centeredRow = row - (cards.length - 1) / 2;
        const start = 0.055 + wave * 0.075 + row * 0.016;
        add(card, curtainKeyframes({
          direction,
          start,
          end: Math.min(0.94, start + 0.56),
          distance: 34 + wave * 7,
          vertical: centeredRow * 1.35,
          rotation: centeredRow * 0.8,
        }));
      });
      add(column.querySelector(":scope > .mock-round-label"), curtainKeyframes({
        direction,
        start: 0.08 + wave * 0.075,
        end: Math.min(0.9, 0.58 + wave * 0.075),
        distance: 30 + wave * 7,
        vertical: -1.2,
        rotation: 1.2,
        scale: 0.97,
      }));
    });

  const fade = (element, start, end, transform) => add(element, [
    { offset: 0, transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
    { offset: start, transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
    { offset: end, transform, opacity: 0 },
    { offset: 1, transform, opacity: 0 },
  ]);
  dom.connectorSvg.querySelectorAll("path[data-curtain-side]").forEach(path => {
    const side = path.dataset.curtainSide;
    if (side !== "L" && side !== "R") return;
    const direction = side === "L" ? -1 : 1;
    const columnIndex = Number(path.dataset.curtainCol);
    const row = Number(path.dataset.curtainRow);
    const count = Math.max(1, Number(path.dataset.curtainCount));
    const wave = Math.max(0, Math.abs(columnIndex - 4) - 1);
    const centeredRow = row - (count - 1) / 2;
    const start = 0.055 + wave * 0.075 + row * 0.016;
    add(path, curtainKeyframes({
      direction,
      start,
      end: Math.min(0.94, start + 0.56),
      distance: 34 + wave * 7,
      vertical: centeredRow * 1.35,
      scale: 1,
    }));
  });
  dom.connectorSvg.querySelectorAll('path[data-curtain-side="C"]').forEach(path => {
    fade(path, 0.12, 0.72, "translate3d(0,6vh,0) scale(0.95)");
  });
  fade(dom.mockBracket.querySelector(".mock-champion"), 0.14, 0.76, "translate3d(0,-7vh,0) scale(0.94)");
  fade(dom.mockBracket.querySelector(".mock-note"), 0.18, 0.72, "translate3d(0,-4vh,0) scale(0.96)");
  fade(dom.mockBracket.querySelector(".mock-final-box"), 0.12, 0.72, "translate3d(0,6vh,0) scale(0.95)");
  fade(dom.mockBracket.querySelector(".mock-trophy-shell"), 0.02, 0.16, "translate3d(0,1vh,0) scale(1.02)");
}

function setCurtainTime(time) {
  const restore = smooth((time - 28.5) / 1.5);
  const openingTime = Math.min(time, CURTAIN_DURATION) * 1000;
  const currentTime = restore > 0
    ? (1 - restore) * CURTAIN_DURATION * 1000
    : openingTime;
  state.curtainAnimations.forEach(animation => {
    animation.currentTime = currentTime;
  });
}

function updateChampion() {
  const champion = dom.mockBracket.querySelector(".mock-champion");
  if (!champion) return;
  const url = teamFlagUrl(state.team);
  champion.dataset.team = state.team;
  champion.querySelector("img").src = url;
  champion.querySelector("img").alt = `${state.team} flag`;
  champion.querySelector("span").textContent = state.team;
  dom.cinematicTeam.textContent = state.team;
  dom.fallbackTeam.textContent = state.team;
  dom.fallbackFlag.src = url;
  dom.fallbackFlag.alt = `${state.team} flag`;
}

function relativePoint(element, edge, gridRect) {
  const rect = element.getBoundingClientRect();
  return {
    x: edge === "left"
      ? rect.left - gridRect.left
      : edge === "right"
        ? rect.right - gridRect.left
        : (rect.left + rect.right) / 2 - gridRect.left,
    y: (rect.top + rect.bottom) / 2 - gridRect.top,
  };
}

function tagMockCurtainPath(path, element) {
  const card = element?.closest(".mock-match-box,.mock-final-box");
  const column = card?.closest(".mock-column[data-side]");
  if (!card || !column) return;
  const cards = [...column.children].filter(child =>
    child.classList.contains("mock-match-box") || child.classList.contains("mock-final-box"));
  path.dataset.curtainSide = column.dataset.side;
  path.dataset.curtainCol = column.dataset.column;
  path.dataset.curtainRow = String(Math.max(0, cards.indexOf(card)));
  path.dataset.curtainCount = String(Math.max(1, cards.length));
}

function appendConnector(from, to, fromEdge, toEdge, className = "") {
  if (!from || !to) return;
  const gridRect = dom.bracketGrid.getBoundingClientRect();
  const start = relativePoint(from, fromEdge, gridRect);
  const end = relativePoint(to, toEdge, gridRect);
  const middle = (start.x + end.x) / 2;
  const sourcePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  sourcePath.setAttribute("d", `M${start.x} ${start.y} H${middle}`);
  if (className) sourcePath.setAttribute("class", className);
  tagMockCurtainPath(sourcePath, from);
  const targetPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  targetPath.setAttribute("d", `M${middle} ${start.y} V${end.y} H${end.x}`);
  if (className) targetPath.setAttribute("class", className);
  tagMockCurtainPath(targetPath, to);
  dom.connectorSvg.append(sourcePath, targetPath);
}

function drawConnectors() {
  dom.connectorSvg.replaceChildren();
  const width = dom.bracketGrid.scrollWidth;
  const height = dom.bracketGrid.scrollHeight;
  dom.connectorSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  dom.connectorSvg.setAttribute("width", String(width));
  dom.connectorSvg.setAttribute("height", String(height));
  dom.connectorSvg.style.width = `${width}px`;
  dom.connectorSvg.style.height = `${height}px`;
  const columns = [...dom.bracketGrid.querySelectorAll(".mock-column")];
  for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
    const fromBoxes = [...columns[columnIndex].querySelectorAll(".mock-match-box")];
    const toBoxes = [...columns[columnIndex + 1].querySelectorAll(".mock-match-box")];
    fromBoxes.forEach((box, index) => {
      appendConnector(box, toBoxes[Math.floor(index / 2)], "right", "left");
    });
  }
  for (let columnIndex = 8; columnIndex > 4; columnIndex--) {
    const fromBoxes = [...columns[columnIndex].querySelectorAll(".mock-match-box")];
    const toBoxes = [...columns[columnIndex - 1].querySelectorAll(".mock-match-box")];
    fromBoxes.forEach((box, index) => {
      appendConnector(box, toBoxes[Math.floor(index / 2)], "left", "right");
    });
  }
  const final = columns[4].querySelector(".mock-final-box");
  appendConnector(columns[3].querySelector(".mock-match-box"), final, "right", "left");
  appendConnector(columns[5].querySelector(".mock-match-box"), final, "left", "right");
  const champion = columns[4].querySelector(".mock-champion");
  if (final && champion) {
    const gridRect = dom.bracketGrid.getBoundingClientRect();
    const start = relativePoint(final, "center", gridRect);
    const end = relativePoint(champion, "center", gridRect);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "champion-link");
    path.dataset.curtainSide = "C";
    path.setAttribute("d", `M${start.x} ${start.y} V${end.y}`);
    dom.connectorSvg.append(path);
  }
  buildCurtainAnimations();
  setCurtainTime(state.currentTime);
}

function registerHiddenActivation() {
  const now = performance.now();
  state.activationTimes = state.activationTimes.filter(
    time => now - time <= ACTIVATION_WINDOW_MS,
  );
  state.activationTimes.push(now);
  if (state.activationTimes.length < 4) return;
  state.activationTimes = [];
  startMock();
}

function seededUnit(value) {
  let stateValue = 2166136261;
  for (const character of value) {
    stateValue ^= character.charCodeAt(0);
    stateValue = Math.imul(stateValue, 16777619);
  }
  return () => {
    stateValue = (stateValue * 1664525 + 1013904223) >>> 0;
    return stateValue / 0x100000000;
  };
}

function buildDissolveParticles() {
  const random = seededUnit(`${state.team}-dissolve`);
  const colors = [
    cssToken("--cp-border"),
    cssToken("--cp-text"),
    cssToken("--cp-accent"),
    cssToken("--cp-warning"),
  ];
  const elements = [
    ...dom.mockBracket.querySelectorAll(
      ".mock-match-box,.mock-final-box,.mock-champion,.mock-note",
    ),
  ];
  state.dissolveParticles = elements.flatMap((element, elementIndex) => {
    const rect = element.getBoundingClientRect();
    const count = Math.max(8, Math.min(22, Math.round(rect.width * rect.height / 520)));
    return Array.from({ length: count }, () => ({
      x: rect.left + random() * rect.width,
      y: rect.top + random() * rect.height,
      size: 1.5 + random() * 3.2,
      driftX:
        Math.sign(rect.left + rect.width / 2 - window.innerWidth / 2) *
          (36 + rect.width * 0.16) +
        (random() - 0.5) * (24 + rect.width * 0.1),
      driftY: -24 - random() * 56,
      spin: (random() - 0.5) * Math.PI * 3,
      delay: random() * 0.35 + (elementIndex % 5) * 0.025,
      color: colors[Math.floor(random() * colors.length)],
    }));
  });
}

function drawDissolve(time) {
  const context = dom.dissolveCanvas.getContext("2d");
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (time <= 0 || time >= 3.5) return;
  const progress = clamp(time / 3);
  state.dissolveParticles.forEach(particle => {
    const local = smooth((progress - particle.delay) / Math.max(0.01, 1 - particle.delay));
    if (local <= 0 || local >= 1) return;
    context.save();
    context.globalAlpha = 1 - local;
    context.fillStyle = particle.color;
    context.translate(
      particle.x + particle.driftX * local,
      particle.y + particle.driftY * local,
    );
    context.rotate(particle.spin * local);
    context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    context.restore();
  });
}

function positionTrophyMorph() {
  const source = dom.mockBracket.querySelector(".mock-trophy-shell");
  if (!source) return;
  const rect = source.getBoundingClientRect();
  state.trophyMorphSource = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  Object.assign(dom.trophyMorph.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  dom.trophyMorph.hidden = false;
}

function renderTrophyMorph(time) {
  if (
    !state.stageOpen ||
    !state.trophyMorphSource ||
    time >= TROPHY_CROSSFADE_END + 0.1
  ) {
    dom.trophyMorph.hidden = true;
    return;
  }
  dom.trophyMorph.hidden = false;
  const settle = celebrationProgressAt(time).trophySettle;
  const source = state.trophyMorphSource;
  let targetLeft = source.left;
  let targetTop = source.top;
  let targetWidth = source.width;
  let targetHeight = source.height;
  if (state.controller) {
    const target = state.controller.projectAnchor("trophy-rest");
    targetHeight = Math.max(1, target.height);
    targetWidth = targetHeight * (source.width / source.height);
    targetLeft = target.x - targetWidth / 2;
    targetTop = target.y - targetHeight / 2;
  }
  Object.assign(dom.trophyMorph.style, {
    left: `${lerp(source.left, targetLeft, settle)}px`,
    top: `${lerp(source.top, targetTop, settle)}px`,
    width: `${lerp(source.width, targetWidth, settle)}px`,
    height: `${lerp(source.height, targetHeight, settle)}px`,
    opacity: String(
      1 - smooth(
        (time - TROPHY_CROSSFADE_START) /
          (TROPHY_CROSSFADE_END - TROPHY_CROSSFADE_START),
      ),
    ),
    transform: "none",
  });
}

function disposeScene() {
  state.sceneGeneration += 1;
  state.controllerAbort?.abort();
  state.controllerAbort = null;
  state.controller?.destroy();
  state.controller = null;
  state.controllerPromise = null;
}

async function ensureScene() {
  if (state.controller) return state.controller;
  if (state.webglFailed || state.reducedMotion) return null;
  if (state.controllerPromise) return state.controllerPromise;
  const generation = state.sceneGeneration;
  const abort = new AbortController();
  state.controllerAbort = abort;
  const promise = createChampionScene({
    canvas: dom.sceneCanvas,
    team: state.team,
    signal: abort.signal,
    onContextLoss: error => {
      console.warn("Champion celebration review switched to its static fallback.", error);
      disposeScene();
      state.webglFailed = true;
      state.playing = false;
      stopLoop();
      showStaticFallback();
    },
  }).then(controller => {
    if (abort.signal.aborted || generation !== state.sceneGeneration) {
      controller.destroy();
      return null;
    }
    state.controller = controller;
    resizeScene();
    return controller;
  }).catch(error => {
    if (error?.name === "AbortError") return null;
    console.warn("Champion celebration review could not initialize WebGL.", error);
    state.webglFailed = true;
    showStaticFallback();
    return null;
  }).finally(() => {
    if (state.controllerPromise === promise) state.controllerPromise = null;
  });
  state.controllerPromise = promise;
  return promise;
}

function resizeScene() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  dom.dissolveCanvas.width = Math.round(width * ratio);
  dom.dissolveCanvas.height = Math.round(height * ratio);
  dom.dissolveCanvas.style.width = `${width}px`;
  dom.dissolveCanvas.style.height = `${height}px`;
  dom.dissolveCanvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
  state.controller?.resize({ width, height, devicePixelRatio: window.devicePixelRatio || 1 });
}

function renderAt(time) {
  state.currentTime = clamp(Number(time), 0, CELEBRATION_DURATION);
  const progress = celebrationProgressAt(state.currentTime);
  const opening = Math.min(progress.opening, 1 - progress.restore);
  dom.mockBracket.classList.toggle("is-dissolving", state.stageOpen);
  dom.mockBracket.style.setProperty("--dissolve-progress", opening.toFixed(4));
  dom.cinematic.style.setProperty("--stage-opacity", opening.toFixed(3));
  setCurtainTime(state.currentTime);
  drawDissolve(state.currentTime);
  state.controller?.renderFrame(state.currentTime);
  renderTrophyMorph(state.currentTime);
  const label = phaseLabel(state.currentTime);
  dom.phaseReadout.textContent = label;
  dom.cinematicPhase.textContent = label;
  dom.timeline.value = String(state.currentTime);
  dom.cinematicScrubber.value = String(state.currentTime);
  dom.timeReadout.textContent =
    `${state.currentTime.toFixed(1)} / ${CELEBRATION_DURATION.toFixed(1)}s`;
}

function stopLoop() {
  if (state.frame) cancelAnimationFrame(state.frame);
  state.frame = 0;
  state.lastFrameAt = 0;
}

function animate(now) {
  state.frame = 0;
  if (!state.playing || !state.stageOpen || document.hidden || state.reducedMotion) return;
  const delta = state.lastFrameAt ? Math.min((now - state.lastFrameAt) / 1000, 0.05) : 0;
  state.lastFrameAt = now;
  renderAt(state.currentTime + delta);
  if (state.currentTime >= CELEBRATION_DURATION) {
    closeStage();
    return;
  }
  state.frame = requestAnimationFrame(animate);
}

function startLoop() {
  if (state.frame || !state.playing || !state.stageOpen || document.hidden || state.reducedMotion) {
    return;
  }
  state.lastFrameAt = performance.now();
  state.frame = requestAnimationFrame(animate);
}

function animateStageFromBracket() {
  if (state.reducedMotion || typeof dom.cinematic.animate !== "function") return;
  state.stageAnimation?.cancel();
  const rect = dom.mockViewport.getBoundingClientRect();
  state.stageAnimation = dom.cinematic.animate(
    [
      {
        clipPath: `inset(${Math.max(0, rect.top)}px ` +
          `${Math.max(0, window.innerWidth - rect.right)}px ` +
          `${Math.max(0, window.innerHeight - rect.bottom)}px ` +
          `${Math.max(0, rect.left)}px round 16px)`,
      },
      { clipPath: "inset(0 0 0 0 round 0)" },
    ],
    { duration: 620, easing: "cubic-bezier(.2,.75,.2,1)", fill: "both" },
  );
}

function openStage() {
  if (state.stageOpen) return;
  state.stageOpen = true;
  document.body.classList.add("cinematic-active");
  dom.cinematic.classList.add("is-open");
  dom.cinematic.setAttribute("aria-hidden", "false");
  buildDissolveParticles();
  positionTrophyMorph();
  resizeScene();
  animateStageFromBracket();
  dom.cinematicSkip.focus({ preventScroll: true });
}

function closeStage() {
  stopLoop();
  disposeScene();
  state.stageAnimation?.cancel();
  state.stageAnimation = null;
  state.playing = false;
  state.stageOpen = false;
  state.currentTime = 0;
  state.activationTimes = [];
  document.body.classList.remove("cinematic-active");
  dom.cinematic.classList.remove("is-open");
  dom.cinematic.setAttribute("aria-hidden", "true");
  dom.mockBracket.classList.remove("is-dissolving");
  dom.mockBracket.style.setProperty("--dissolve-progress", "0");
  dom.cinematic.style.setProperty("--stage-opacity", "0");
  dom.dissolveCanvas.getContext("2d").clearRect(0, 0, window.innerWidth, window.innerHeight);
  dom.staticFallback.hidden = true;
  dom.trophyMorph.hidden = true;
  state.trophyMorphSource = null;
  dom.pauseButton.disabled = true;
  dom.pauseButton.textContent = "Pause";
  dom.playButton.textContent = "Play";
  renderAt(0);
  dom.mockBracket.querySelector(".mock-champion")?.focus({ preventScroll: true });
}

function showStaticFallback() {
  dom.staticFallback.hidden = false;
  dom.sceneCanvas.style.visibility = "hidden";
  dom.cinematic.style.setProperty("--stage-opacity", "0");
}

function hideStaticFallback() {
  dom.staticFallback.hidden = true;
  dom.sceneCanvas.style.visibility = "";
}

async function startMock({ fromStart = true } = {}) {
  if (state.starting) return;
  state.starting = true;
  try {
    const controller = state.reducedMotion ? null : await ensureScene();
    if (!state.reducedMotion && !state.webglFailed && !controller) return;
    openStage();
    if (state.reducedMotion || state.webglFailed) {
      showStaticFallback();
      state.playing = false;
      renderAt(CELEBRATION_TIMING.holdStart + 0.5);
      dom.pauseButton.disabled = true;
      dom.playButton.textContent = "Show tableau";
      return;
    }
    hideStaticFallback();
    if (fromStart || state.currentTime >= CELEBRATION_DURATION) renderAt(0);
    state.playing = true;
    dom.pauseButton.disabled = false;
    dom.pauseButton.textContent = "Pause";
    dom.playButton.textContent = "Replay";
    startLoop();
  } finally {
    state.starting = false;
  }
}

function togglePause() {
  if (!state.stageOpen || state.reducedMotion || state.webglFailed) return;
  state.playing = !state.playing;
  dom.pauseButton.textContent = state.playing ? "Pause" : "Resume";
  if (state.playing) startLoop();
  else stopLoop();
}

async function scrubTo(value) {
  const controller = state.reducedMotion ? null : await ensureScene();
  if (!state.reducedMotion && !state.webglFailed && !controller) return;
  openStage();
  state.stageAnimation?.finish();
  state.playing = false;
  stopLoop();
  dom.pauseButton.disabled = state.reducedMotion || state.webglFailed;
  dom.pauseButton.textContent = "Resume";
  dom.playButton.textContent = "Replay";
  if (state.reducedMotion || state.webglFailed) showStaticFallback();
  else hideStaticFallback();
  renderAt(value);
}

async function selectTeam(team) {
  if (team === state.team) return;
  const wasOpen = state.stageOpen;
  const previousTime = state.currentTime;
  const wasPlaying = state.playing;
  stopLoop();
  state.playing = false;
  state.team = team;
  state.webglFailed = FORCE_WEBGL_FALLBACK;
  updateChampion();
  disposeScene();
  hideStaticFallback();
  if (wasOpen) {
    const controller = state.reducedMotion ? null : await ensureScene();
    if (!state.reducedMotion && !state.webglFailed && !controller) return;
    renderAt(previousTime);
    state.playing = wasPlaying && !state.reducedMotion && !state.webglFailed;
    if (state.playing) startLoop();
  }
}

async function toggleReducedMotion() {
  state.reducedMotion = !state.reducedMotion;
  [dom.motionButton, dom.cinematicMotion].forEach(button => {
    button.setAttribute("aria-pressed", state.reducedMotion ? "true" : "false");
  });
  dom.motionButton.textContent = state.reducedMotion
    ? "Reduced-motion preview on"
    : "Reduced-motion preview off";
  dom.cinematicMotion.textContent = state.reducedMotion ? "Full motion" : "Reduced motion";
  if (state.reducedMotion) {
    stopLoop();
    state.playing = false;
    disposeScene();
    if (!state.stageOpen) return;
    showStaticFallback();
    renderAt(24.5);
    dom.pauseButton.disabled = true;
    return;
  }
  if (!state.stageOpen) return;
  stopLoop();
  state.playing = false;
  hideStaticFallback();
  const controller = await ensureScene();
  if (!state.webglFailed && !controller) return;
  renderAt(Math.min(state.currentTime, CELEBRATION_TIMING.restoreStart));
  dom.pauseButton.disabled = state.webglFailed;
}

function onResize() {
  if (state.resizeFrame) cancelAnimationFrame(state.resizeFrame);
  state.resizeFrame = requestAnimationFrame(() => {
    state.resizeFrame = 0;
    drawConnectors();
    resizeScene();
    if (state.stageOpen) {
      buildDissolveParticles();
      renderAt(state.currentTime);
    }
  });
}

function initializeControls() {
  TEAM_NAMES.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    option.selected = team === DEFAULT_TEAM;
    dom.teamSelect.append(option);
  });
  dom.teamSelect.addEventListener("change", () => selectTeam(dom.teamSelect.value));
  dom.playButton.addEventListener("click", () => startMock());
  dom.pauseButton.addEventListener("click", togglePause);
  dom.resetButton.addEventListener("click", closeStage);
  dom.timeline.addEventListener("input", () => scrubTo(dom.timeline.value));
  dom.motionButton.addEventListener("click", toggleReducedMotion);
  dom.cinematicMotion.addEventListener("click", toggleReducedMotion);
  dom.cinematicReplay.addEventListener("click", () => startMock());
  dom.cinematicSkip.addEventListener("click", closeStage);
  dom.cinematicScrubber.addEventListener("input", () => scrubTo(dom.cinematicScrubber.value));
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !state.stageOpen) return;
    event.preventDefault();
    event.stopPropagation();
    closeStage();
  }, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else if (state.playing) startLoop();
  });
  window.addEventListener("resize", onResize);
}

async function initialize() {
  buildBracket();
  initializeControls();
  updateChampion();
  [dom.motionButton, dom.cinematicMotion].forEach(button => {
    button.setAttribute("aria-pressed", state.reducedMotion ? "true" : "false");
  });
  dom.motionButton.textContent = state.reducedMotion
    ? "Reduced-motion preview on"
    : "Reduced-motion preview off";
  dom.cinematicMotion.textContent = state.reducedMotion ? "Full motion" : "Reduced motion";
  renderAt(0);
}

window.addEventListener("beforeunload", () => {
  stopLoop();
  disposeScene();
});

window.__championMockDebug = () => ({
  team: state.team,
  stageOpen: state.stageOpen,
  playing: state.playing,
  time: state.currentTime,
  hasScene: Boolean(state.controller),
  webglFailed: state.webglFailed,
  productionScene: true,
});

initialize().catch(error => {
  console.error(error);
  state.webglFailed = true;
  showStaticFallback();
});
