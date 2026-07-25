import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CHAMPION_ACTIVATION_COUNT,
  CHAMPION_ACTIVATION_WINDOW_MS,
  createActivationWindow,
} from "../docs/js/champion-celebration-trigger.js";
import {
  CELEBRATION_DURATION,
  CELEBRATION_PHASES,
  CELEBRATION_TIMING,
  CURTAIN_DURATION,
  TROPHY_CROSSFADE_END,
  TROPHY_CROSSFADE_START,
  TROPHY_GRAB_TIME,
  TROPHY_SCENE_SCALE,
  celebrationProgressAt,
  createCelebrationClock,
  headingYaw,
  interpolateYaw,
  phaseAt,
  reachableLiftTarget,
  shoulderToGripDistanceAtLift,
  synchronizedJumpEnvelope,
} from "../docs/js/champion-celebration-timeline.js";
import {
  MAX_CROWD_INSTANCES,
  PHONE_CROWD_INSTANCES,
  PLAYER_CAP_SEGMENTS,
  PLAYER_FACIAL_HAIR_STYLE_COUNT,
  PLAYER_FINGER_COUNT,
  PLAYER_HAIR_STYLE_COUNT,
  PLAYER_HAIR_TONES,
  PLAYER_HEAD_SEGMENTS,
  PLAYER_PROPORTIONS,
  PLAYER_RADIAL_SEGMENTS,
  PLAYER_SKIN_TONES,
  STAGE_HEIGHTS,
  STAGE_LAYOUT,
  TEAMMATE_COUNT,
  TOTAL_PLAYER_COUNT,
  mergeRigidMeshes,
  playerAppearanceForVariant,
} from "../docs/js/champion-celebration-models.js";
import * as THREE from "../docs/js/vendor/three.module.min.js";
import { EFFECT_QUALITY } from "../docs/js/champion-celebration-effects.js";
import {
  TROPHY_BOTTOM_Y,
  TROPHY_TOP_Y,
} from "../docs/js/trophy-geometry.js";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const between = (source, start, end) => {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  return startAt >= 0 && endAt > startAt ? source.slice(startAt, endAt) : "";
};

function check(name, test) {
  try {
    test();
    console.log(`  ok   ${name}`);
  } catch (error) {
    console.error(`  FAIL ${name}`);
    throw error;
  }
}

check("activation contract is four events inside 2500ms", () => {
  assert.equal(CHAMPION_ACTIVATION_COUNT, 4);
  assert.equal(CHAMPION_ACTIVATION_WINDOW_MS, 2500);
  const window = createActivationWindow();
  assert.equal(window.record(0), false);
  assert.equal(window.record(1), false);
  assert.equal(window.record(2), false);
  assert.equal(window.record(3), true);
  assert.equal(window.record(4), false, "a successful activation must clear the window");
});

check("paced 2400ms sequence activates", () => {
  const window = createActivationWindow();
  assert.deepEqual(
    [0, 800, 1600, 2400].map(time => window.record(time)),
    [false, false, false, true],
  );
});

check("2500ms is accepted and a later event expires the first sample", () => {
  const exact = createActivationWindow();
  assert.deepEqual(
    [0, 1000, 2000, 2500].map(time => exact.record(time)),
    [false, false, false, true],
  );

  const late = createActivationWindow();
  assert.deepEqual(
    [0, 800, 1600, 2501].map(time => late.record(time)),
    [false, false, false, false],
  );
});

check("reset and invalid timestamps cannot create a false activation", () => {
  const window = createActivationWindow();
  window.record(10);
  window.record(20);
  window.reset();
  assert.equal(window.record(30), false);
  assert.equal(window.record(Number.NaN), false);
  assert.equal(window.record(40), false);
  assert.equal(window.record(35), false, "a backwards timestamp resets before recording");
  assert.equal(window.record(36), false);
  assert.equal(window.record(37), false);
  assert.equal(window.record(38), true);
});

const trigger = read("../docs/js/champion-celebration-trigger.js");
const controller = read("../docs/js/champion-celebration.js");
const main = read("../docs/js/main.js");
const interact = read("../docs/js/interact.js");
const render = read("../docs/js/render.js");
const index = read("../docs/index.html");
const css = read("../docs/css/champion-celebration.css");
const trophy = read("../docs/js/trophy.js");
const trophyGeometry = read("../docs/js/trophy-geometry.js");
const trophyFallback = read("../docs/assets/trophy-fallback.svg");
const timeline = read("../docs/js/champion-celebration-timeline.js");
const scene = read("../docs/js/champion-celebration-scene.js");
const models = read("../docs/js/champion-celebration-models.js");
const effects = read("../docs/js/champion-celebration-effects.js");
const mock = read("../docs/dev-reports/champion-celebration/mock.js");
const mockIndex = read("../docs/dev-reports/champion-celebration/index.html");

check("trigger uses one click path and keyboard repeat protection", () => {
  assert.match(trigger, /wrap\.addEventListener\("click"/);
  assert.doesNotMatch(trigger, /pointerup|touchend/);
  assert.match(trigger, /event\.repeat/);
  assert.match(trigger, /event\.preventDefault\(\)/);
  assert.match(trigger, /selectstart/);
  assert.match(trigger, /dblclick/);
});

check("active mirrored bracket is resolved for every event", () => {
  assert.match(trigger, /getActiveBracket\(\)/);
  assert.match(trigger, /wrap\.dataset\.layout !== "mirror"/);
  assert.match(trigger, /activeTrigger = bracket\.querySelector/);
  assert.match(trigger, /trigger !== activeTrigger/);
});

check("only the mirrored champion helper receives the trigger contract", () => {
  const mirroredHelper = render.slice(render.indexOf("function pickBox"), render.indexOf("function legacyR32Cell"));
  const sideways = render.slice(render.indexOf("function legacyR32Cell"));
  assert.match(mirroredHelper, /data-champion-celebration-trigger/);
  assert.doesNotMatch(sideways, /data-champion-celebration-trigger/);
});

check("main owns a separate generation-guarded lazy lifecycle", () => {
  assert.match(main, /let CELEBRATION_GENERATION = 0/);
  assert.match(main, /import\("\.\/champion-celebration\.js"\)/);
  assert.match(main, /generation !== CELEBRATION_GENERATION/);
  assert.match(main, /CELEBRATION_LOAD \|\| CELEBRATION_CONTROLLER/);
  assert.match(main, /controller\.destroy\("stale-start"\)/);
  assert.match(main, /teardownChampionCelebration\("dashboard-rerender"\)/);
  assert.match(main, /teardownChampionCelebration\("show-landing"\)/);
});

check("stage reuses one canvas and owns complete modal isolation", () => {
  assert.match(controller, /let celebrationCanvas = null/);
  assert.match(controller, /function getCelebrationCanvas\(\)/);
  assert.match(controller, /if \(!celebrationCanvas\)/);
  assert.match(controller, /const canvas = getCelebrationCanvas\(\)/);
  assert.equal(
    (controller.match(/document\.createElement\("canvas"\)/g) || []).length,
    1,
    "the controller must have one singleton celebration-canvas construction path",
  );
  assert.match(controller, /body\.append\(stage\)/);
  assert.match(controller, /aria-modal/);
  assert.match(controller, /Array\.from\(body\.children\)/);
  assert.doesNotMatch(controller, /BACKGROUND_ROOT_IDS/);
  assert.match(controller, /new MutationObserver/);
  assert.match(controller, /backgroundObserver\?\.disconnect\(\)/);
  assert.match(controller, /element\.inert = true/);
  assert.match(controller, /element\.inert = state\.inert/);
  assert.match(controller, /document\.addEventListener\("keydown", onDocumentKeyDown, true\)/);
  assert.match(controller, /event\.key !== "Tab"/);
  assert.match(controller, /skip\.focus\(\{ preventScroll: true \}\)/);
  assert.match(controller, /event\.stopImmediatePropagation\(\)/);
  assert.match(controller, /if \(destroyed\) return/);
  assert.match(controller, /window\.scrollTo\(snapshot\.scrollX, snapshot\.scrollY\)/);
});

check("connector drawing is suspended and trigger selection suppression is scoped", () => {
  assert.match(interact, /champion-celebration-active/);
  assert.match(interact, /celebrationTrigger\.reset\(\)/);
  assert.match(css, /^\[data-champion-celebration-trigger\]/);
  assert.doesNotMatch(css, /\*\s*\{[^}]*user-select:\s*none/);
  assert.match(index, /href="css\/champion-celebration\.css"/);
});

check("live and celebration trophies share construction without sharing instances", () => {
  assert.match(trophy, /createTrophySculpture/);
  assert.match(trophyGeometry, /export function createTrophySculpture/);
  assert.match(trophyGeometry, /dispose\(\)/);
  assert.match(trophyGeometry, /new Set\(geometries\)/);
});

check("trophy controller exposes capture and external suspension", () => {
  assert.match(trophy, /return \{\s*slot,\s*destroy,\s*suspend,\s*captureVisual,/);
  assert.match(trophy, /externalSuspensions\.size === 0/);
  assert.match(trophy, /function release\(\)/);
  const capture = between(trophy, "function captureVisual()", "function destroy()");
  assert.match(capture, /renderNow\(\)/);
  assert.match(capture, /context\.drawImage\(canvas, 0, 0\)/);
  assert.match(capture, /context\.getImageData\(0, 0, copy\.width, copy\.height\)/);
  assert.match(capture, /left: rect\.left \+ minimumX \* cssScaleX/);
  assert.ok(
    capture.indexOf("renderNow()") < capture.indexOf("context.drawImage"),
    "capture must render and copy synchronously in that order",
  );
  assert.doesNotMatch(capture, /canvas\.cloneNode/);
});

check("main passes only the active bracket trophy and releases suspension", () => {
  assert.match(main, /context\.bracket\.querySelector\("\[data-trophy\]"\)/);
  assert.match(main, /TROPHY_CONTROLLERS\.get\(trophySlot\)/);
  assert.match(main, /setTrophiesSuspended/);
  assert.match(controller, /trophyController\.captureVisual\(\)/);
  assert.match(controller, /setTrophiesSuspended\(true\)/);
  assert.match(controller, /setTrophiesSuspended\(false\)/);
  assert.match(controller, /champion-celebration-trophy-ghost/);
  assert.match(controller, /projectAnchor\("trophy-rest"\)/);
  assert.match(controller, /projected\.height \/ sourceHeight/);
});

check("timeline owns every approved phase boundary", () => {
  assert.equal(CELEBRATION_DURATION, 30);
  assert.equal(CURTAIN_DURATION, 3.2);
  assert.deepEqual(
    CELEBRATION_PHASES.map(({ id, start, end }) => [id, start, end]),
    [
      ["opening", 0, 3.2],
      ["cleared-hold", 3.2, 3.4],
      ["captain-entry", 3.4, 4.8],
      ["trophy-approach", 4.8, 6.9],
      ["trophy-grab", 6.9, 9],
      ["carry-reveal", 9, 12],
      ["captain-joins", 12, 15.6],
      ["team-settle", 15.6, 18.2],
      ["lift-jump", 18.2, 21],
      ["payoff-build", 21, 23.2],
      ["champion-hold", 23.2, 28.2],
      ["restore", 28.2, 30],
    ],
  );
  for (const phase of CELEBRATION_PHASES) {
    assert.equal(phaseAt(phase.start).id, phase.id);
  }
  assert.equal(phaseAt(30).id, "finished");
});

check("V2 timing owns trophy handoff, one lift jump, and payoff", () => {
  assert.ok(TROPHY_GRAB_TIME >= 8 && TROPHY_GRAB_TIME <= 10);
  assert.ok(TROPHY_CROSSFADE_START < TROPHY_CROSSFADE_END);
  assert.ok(TROPHY_CROSSFADE_END <= TROPHY_GRAB_TIME);
  assert.ok(TROPHY_CROSSFADE_END - TROPHY_CROSSFADE_START <= 0.45);

  const sampledPeaks = (sample, start, end, step = 0.01) => {
    const values = [];
    for (let time = start; time <= end + step / 2; time += step) {
      values.push(sample(time));
    }
    let peaks = 0;
    for (let index = 1; index < values.length - 1; index++) {
      if (
        values[index] > 0.95 &&
        values[index] >= values[index - 1] &&
        values[index] > values[index + 1]
      ) {
        peaks++;
      }
    }
    return peaks;
  };

  assert.equal(
    sampledPeaks(
      synchronizedJumpEnvelope,
      CELEBRATION_TIMING.jumpStart,
      CELEBRATION_TIMING.jumpEnd,
    ),
    1,
  );
  assert.equal(synchronizedJumpEnvelope(CELEBRATION_TIMING.jumpStart - 0.01), 0);
  assert.equal(synchronizedJumpEnvelope(CELEBRATION_TIMING.jumpEnd + 0.01), 0);

  assert.ok(CELEBRATION_TIMING.captainWalkStart < CELEBRATION_TIMING.openingEnd);
  assert.ok(CELEBRATION_TIMING.clearedHoldEnd - CELEBRATION_TIMING.openingEnd <= 0.2);
  assert.equal(celebrationProgressAt(2.19).captainVisible, 0);
  assert.equal(celebrationProgressAt(2.2).captainVisible, 1);
  assert.ok(celebrationProgressAt(3.1).captainEntry > 0);
  assert.ok(celebrationProgressAt(3.1).captainEntry < 1);
  assert.equal(phaseAt(3.1).id, "opening");
  assert.equal(celebrationProgressAt(7.2).approach, 1);
  assert.equal(celebrationProgressAt(17.2).join, 1);
  const travelMidpoint =
    (CELEBRATION_TIMING.carryStart + CELEBRATION_TIMING.joinEnd) / 2;
  assert.ok(
    Math.abs(celebrationProgressAt(travelMidpoint).captainTravel - 0.5) < 1e-12,
  );
  assert.ok(celebrationProgressAt(19).teamSettle > 0);
  assert.ok(celebrationProgressAt(19.7).teamAnticipation > 0.65);
  assert.equal(
    celebrationProgressAt(CELEBRATION_TIMING.teamAnticipationStart - 0.01).teamAnticipation,
    0,
  );
  assert.equal("teamBounce" in celebrationProgressAt(20), false);
  assert.equal("pump" in celebrationProgressAt(19), false);
  assert.equal("fakePumps" in celebrationProgressAt(19), false);
  assert.ok(celebrationProgressAt(24.4).flares > 0);
  assert.ok(celebrationProgressAt(24.4).confetti > 0);
  assert.ok(celebrationProgressAt(21.6).flares > 0);
  assert.ok(celebrationProgressAt(21.6).confetti > 0);
  assert.equal(celebrationProgressAt(27.5).flares, 1);
  assert.equal(celebrationProgressAt(29.99).flares, 1);
  assert.equal(celebrationProgressAt(30).flares, 0);
  assert.ok(CELEBRATION_TIMING.flaresStart >= CELEBRATION_TIMING.liftStart);
  assert.ok(CELEBRATION_TIMING.flaresStart <= CELEBRATION_TIMING.liftStart + 0.15);
  assert.equal(CELEBRATION_TIMING.flaresEnd, CELEBRATION_DURATION);
  assert.ok(CELEBRATION_TIMING.confettiStart <= CELEBRATION_TIMING.liftStart + 0.2);
  assert.ok(CELEBRATION_TIMING.flaresStart < CELEBRATION_TIMING.trophyLiftEnd);
  assert.ok(CELEBRATION_TIMING.confettiStart < CELEBRATION_TIMING.trophyLiftEnd);
  assert.doesNotMatch(timeline, /PUMP_WINDOWS|twoPumpEnvelope|fake-pumps|pumpsStart/);
  assert.equal(
    celebrationProgressAt(CELEBRATION_TIMING.payoffStart - 0.01).payoff,
    0,
  );
  assert.ok(
    celebrationProgressAt(CELEBRATION_TIMING.payoffStart + 0.5).payoff > 0,
  );
  assert.equal(CELEBRATION_TIMING.restoreStart, 28.2);
  assert.doesNotMatch(timeline, /TEAM_BOUNCE_WINDOWS|teamBounceEnvelope|teamBounceStart/);
});

check("captain carry and podium walk preserve one continuous pace", () => {
  const carryDistance = Math.hypot(
    STAGE_LAYOUT.captainPodiumApproachX - STAGE_LAYOUT.plinthX,
    STAGE_LAYOUT.captainPodiumApproachZ - STAGE_LAYOUT.captainPlinthZ,
  );
  const joinDistance = Math.hypot(
    STAGE_LAYOUT.captainFinalX - STAGE_LAYOUT.captainPodiumApproachX,
    STAGE_LAYOUT.captainFinalZ - STAGE_LAYOUT.captainPodiumApproachZ,
  );
  const carrySpeed =
    carryDistance / (CELEBRATION_TIMING.carryEnd - CELEBRATION_TIMING.carryStart);
  const joinSpeed =
    joinDistance / (CELEBRATION_TIMING.joinEnd - CELEBRATION_TIMING.joinStart);
  const relativeDifference =
    Math.abs(carrySpeed - joinSpeed) / Math.max(carrySpeed, joinSpeed);

  assert.ok(relativeDifference < 0.03);
  assert.ok(
    Math.abs(
      celebrationProgressAt(
        (CELEBRATION_TIMING.carryStart + CELEBRATION_TIMING.carryEnd) / 2,
      ).carry - 0.5,
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(
      celebrationProgressAt(
        (CELEBRATION_TIMING.joinStart + CELEBRATION_TIMING.joinEnd) / 2,
      ).join - 0.5,
    ) < 1e-12,
  );
});

check("captain headings follow travel direction before returning front", () => {
  assert.ok(Math.abs(headingYaw(0, 0, 1, 0) - Math.PI / 2) < 1e-9);
  assert.equal(headingYaw(0, 0, 0, 1), 0);
  assert.ok(Math.abs(Math.abs(headingYaw(0, 0, 0, -1)) - Math.PI) < 1e-9);
  const podiumWalkYaw = headingYaw(
    STAGE_LAYOUT.captainPodiumApproachX,
    STAGE_LAYOUT.captainPodiumApproachZ,
    STAGE_LAYOUT.captainFinalX,
    STAGE_LAYOUT.captainFinalZ,
  );
  assert.ok(podiumWalkYaw > Math.PI / 2 && podiumWalkYaw < Math.PI * 0.56);
  const halfway = interpolateYaw(Math.PI * 0.75, -Math.PI * 0.75, 0.5);
  assert.ok(Math.abs(Math.abs(halfway) - Math.PI) < 1e-9);
  assert.throws(() => headingYaw(0, Number.NaN, 1, 0), /finite stage coordinates/);
});

check("the shortest supported captain can reach the shared trophy grips", () => {
  const heightScale = PLAYER_PROPORTIONS.minimumHeightScale;
  const shortestMetrics = {
    shoulderHeight: PLAYER_PROPORTIONS.shoulderHeight * heightScale,
    shoulderOffset: 0.39 * 1.08 * heightScale,
    upperArmLength: PLAYER_PROPORTIONS.upperArmLength * heightScale,
    forearmLength: PLAYER_PROPORTIONS.forearmLength * heightScale,
  };
  const liftTarget = reachableLiftTarget(
    shortestMetrics,
    STAGE_HEIGHTS,
    TROPHY_SCENE_SCALE,
  );
  const gripDistance = shoulderToGripDistanceAtLift(
    shortestMetrics,
    STAGE_HEIGHTS,
    TROPHY_SCENE_SCALE,
  );
  const armReach = shortestMetrics.upperArmLength + shortestMetrics.forearmLength;
  assert.ok(liftTarget <= STAGE_HEIGHTS.trophyLift);
  assert.ok(STAGE_HEIGHTS.trophyCarry + 0.3 < liftTarget);
  assert.ok(gripDistance < armReach - 0.05);
});

check("logical clock pauses hidden time and caps visible gaps", () => {
  const clock = createCelebrationClock();
  clock.start(1000);
  assert.equal(clock.tick(1050), 0.05);
  assert.ok(
    Math.abs(clock.tick(2050) - 0.15) < 1e-9,
    "a visible one-second gap is capped to 100ms",
  );
  clock.pause(2100);
  const pausedAt = clock.value();
  clock.resume(22100);
  assert.ok(
    Math.abs(clock.tick(22150) - (pausedAt + 0.05)) < 1e-9,
    "hidden time must not advance",
  );
});

check("models expose bounded named production contracts", () => {
  assert.equal(TEAMMATE_COUNT, 6);
  assert.equal(TOTAL_PLAYER_COUNT, 7);
  assert.equal(MAX_CROWD_INSTANCES, 480);
  assert.equal(PHONE_CROWD_INSTANCES, 260);
  assert.equal(PLAYER_RADIAL_SEGMENTS, 32);
  assert.equal(PLAYER_HEAD_SEGMENTS, 40);
  assert.equal(PLAYER_CAP_SEGMENTS, 14);
  assert.equal(PLAYER_FINGER_COUNT, 3);
  assert.equal(PLAYER_HAIR_STYLE_COUNT, 7);
  assert.equal(PLAYER_FACIAL_HAIR_STYLE_COUNT, 5);
  assert.equal(PLAYER_SKIN_TONES.length, 9);
  assert.equal(PLAYER_HAIR_TONES.length, 8);
  const playerAppearances = Array.from(
    { length: TOTAL_PLAYER_COUNT },
    (_, variant) => playerAppearanceForVariant(variant),
  );
  assert.equal(new Set(playerAppearances.map(({ skinTone }) => skinTone)).size, TOTAL_PLAYER_COUNT);
  assert.equal(new Set(playerAppearances.map(({ hairTone }) => hairTone)).size, TOTAL_PLAYER_COUNT);
  assert.equal(new Set(playerAppearances.map(({ hairStyle }) => hairStyle)).size, TOTAL_PLAYER_COUNT);
  assert.equal(
    new Set(playerAppearances.map(({ facialHairStyle }) => facialHairStyle)).size,
    PLAYER_FACIAL_HAIR_STYLE_COUNT,
  );
  assert.throws(() => playerAppearanceForVariant(-1), /non-negative integer/);
  assert.equal(PLAYER_PROPORTIONS.minimumHeightScale, 0.94);
  assert.equal(PLAYER_PROPORTIONS.maximumHeightScale, 1.06);
  assert.equal(PLAYER_PROPORTIONS.shoulderHeight, 2.08);
  assert.equal(PLAYER_PROPORTIONS.upperArmLength, 0.58);
  assert.equal(PLAYER_PROPORTIONS.forearmLength, 0.56);
  assert.ok(STAGE_LAYOUT.plinthX < STAGE_LAYOUT.bannerX);
  assert.ok(STAGE_LAYOUT.bannerX < STAGE_LAYOUT.podiumX);
  assert.ok(STAGE_LAYOUT.captainPodiumApproachX < STAGE_LAYOUT.captainFinalX);
  assert.equal(STAGE_LAYOUT.captainFinalX, STAGE_LAYOUT.podiumX);
  assert.equal(STAGE_HEIGHTS.playerFoot, STAGE_HEIGHTS.teammatePodiumTop);
  assert.equal(STAGE_HEIGHTS.podiumTop, STAGE_HEIGHTS.teammatePodiumTop);
  assert.ok(STAGE_HEIGHTS.teammatePodiumTop > STAGE_HEIGHTS.captainPodiumTop);
  assert.ok(STAGE_HEIGHTS.trophyRest > STAGE_HEIGHTS.plinthTop);
  assert.ok(
    Math.abs(
      STAGE_HEIGHTS.trophyRest -
        (STAGE_HEIGHTS.plinthTop - TROPHY_BOTTOM_Y * TROPHY_SCENE_SCALE),
    ) < 0.01,
  );
  assert.ok(STAGE_HEIGHTS.trophyCarry > STAGE_HEIGHTS.trophyRest);
  assert.ok(STAGE_HEIGHTS.trophyLift > STAGE_HEIGHTS.trophyCarry);
  assert.equal(EFFECT_QUALITY.desktop.confetti, 384);
  assert.equal(EFFECT_QUALITY.phone.confetti, 192);
  assert.match(models, /captain-right-arm-band/);
  assert.match(models, /captain-right-arm-c/);
  assert.match(models, /new THREE\.CanvasTexture/);
  assert.match(models, /new THREE\.InstancedMesh/);
  assert.match(models, /trophyCarrier/);
  assert.match(models, /setHandGrip/);
  assert.match(models, /setRightHandGrip/);
  assert.match(
    models,
    /upperArmLength: PLAYER_PROPORTIONS\.upperArmLength \* heightScale/,
  );
  assert.match(
    models,
    /forearmLength: PLAYER_PROPORTIONS\.forearmLength \* heightScale/,
  );
  assert.match(
    models,
    /shoulderHeight: PLAYER_PROPORTIONS\.shoulderHeight \* heightScale/,
  );
  assert.match(models, /shoulderOffset: shoulderOffset \* heightScale/);
  assert.match(models, /Array\.from\(\{ length: PLAYER_FINGER_COUNT \}/);
  assert.match(models, /-finger-/);
  assert.match(models, /body\.scale\.setScalar\(heightScale\)/);
  assert.doesNotMatch(models, /root\.scale\.setScalar\(heightScale\)/);
  assert.match(models, /jersey-collar/);
  assert.match(models, /clay-avatar-face/);
  assert.match(models, /organic-jersey-yoke/);
  assert.match(models, /boot-sole/);
  assert.match(models, /new THREE\.CapsuleGeometry/);
  assert.match(models, /new THREE\.ExtrudeGeometry/);
  assert.match(models, /createTaperedClayGeometry/);
  assert.match(models, /createEllipticalLoftGeometry/);
  assert.match(models, /const kitVariant = captain \? 0 : variant % 3/);
  assert.match(models, /sculpted-hair-clump/);
  assert.match(models, /fitted-hair-shell/);
  assert.match(models, /scalpSurfaceY/);
  assert.match(models, /facial-hair-moustache/);
  assert.match(models, /facial-hair-goatee/);
  assert.match(models, /facial-hair-jaw/);
  assert.match(models, /facial-hair-sideburn/);
  assert.doesNotMatch(models, /flatShading:\s*true/);
  assert.match(models, /new THREE\.MeshPhysicalMaterial/);
  assert.match(models, /sheenRoughness/);
  assert.match(models, /clearcoatRoughness/);
  assert.match(models, /anatomical-avatar-torso/);
  assert.match(models, /anatomical-avatar-pelvis/);
  assert.match(models, /sculpted-deltoid/);
  assert.match(models, /jersey-sculpted-hem/);
  assert.match(models, /shorts-waistband/);
  assert.match(models, /boot-upper/);
  assert.match(models, /boot-tongue/);
  assert.match(models, /pupilGeometry/);
  assert.match(models, /createPitchTexture/);
  assert.match(models, /fillStyle = "#3d844d"/);
  assert.doesNotMatch(models, /strokeRect\(32, 32/);
  assert.match(models, /crowd-arms/);
  assert.match(models, /stadium-corner-tier/);
  assert.match(models, /stadium-vomitory/);
  assert.match(models, /stadium-roof-catwalk/);
  assert.match(models, /const scales = new Float32Array\(MAX_CROWD_INSTANCES\)/);
  assert.match(models, /2026 WORLD CUP CHAMPIONS/);
  assert.match(models, /champions-banner/);
  assert.match(models, /strokeText\(label, canvas\.width \/ 2, 174, canvas\.width - 110\)/);
  assert.doesNotMatch(models, /stadium-stars/);
  const plinthFactory = between(
    models,
    "export function createTrophyPlinth",
    "export function createPodium",
  );
  assert.match(plinthFactory, /trophy-plinth/);
  assert.match(plinthFactory, /plinth-top-anchor/);
  assert.match(plinthFactory, /createRoundedClayGeometry/);
  assert.doesNotMatch(plinthFactory, /CylinderGeometry/);
  const podiumFactory = between(
    models,
    "export function createPodium",
    "export function createStadium",
  );
  assert.match(podiumFactory, /rear-team-platform/);
  assert.match(podiumFactory, /captain-front-platform/);
  assert.match(podiumFactory, /sideName = sideSign < 0 \? "left" : "right"/);
  assert.match(podiumFactory, /podium-stair-low/);
});

check("rigid batching preserves articulated player boundaries and ownership", () => {
  const playerFactory = between(
    models,
    "export function createPlayerRig",
    "export function createTrophyPlinth",
  );
  assert.match(models, /function mergeRigidMeshes/);
  assert.match(models, /function preparePlayerMaterialMerges/);
  assert.match(models, /child\.children\.length/);
  assert.match(models, /protectedMeshes\.has\(child\)/);
  assert.match(models, /child\.isSkinnedMesh/);
  assert.match(models, /child\.isInstancedMesh/);
  assert.match(models, /object\.userData\.mergeColor = sourceMaterial\.color/);
  assert.match(models, /new THREE\.BufferAttribute\(colors, 3, true\)/);
  assert.match(models, /owner\.retainGeometries\(retainedGeometries\)/);
  assert.match(models, /owner\.retainMaterials\(retainedMaterials\)/);
  assert.match(
    playerFactory,
    /mergeRigidMeshes\(root, owner, new Set\(\[leftArm\.thumb, rightArm\.thumb\]\)\)/,
  );
  assert.ok(
    playerFactory.indexOf("applyPlayerShadowBudget(") <
      playerFactory.indexOf("preparePlayerMaterialMerges(") &&
      playerFactory.indexOf("preparePlayerMaterialMerges(") <
      playerFactory.indexOf("mergeRigidMeshes("),
    "shadow state and vertex-color merge intent must be finalized before rigid batching",
  );
  assert.doesNotMatch(playerFactory, /new THREE\.SkinnedMesh|new THREE\.BatchedMesh/);
});

check("rigid batching transforms geometry, normals, colors, indices, and ownership", () => {
  const makeGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ], 3));
    const unit = Math.SQRT1_2;
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute([
      unit, unit, 0,
      unit, unit, 0,
      unit, unit, 0,
    ], 3));
    geometry.setIndex([0, 1, 2]);
    return geometry;
  };

  const sourceMaterial = new THREE.MeshBasicMaterial({ name: "source" });
  const mergedMaterial = new THREE.MeshBasicMaterial({
    name: "merged",
    vertexColors: true,
  });
  const firstGeometry = makeGeometry();
  const secondGeometry = makeGeometry();
  const disposed = new Map([
    [firstGeometry, 0],
    [secondGeometry, 0],
    [sourceMaterial, 0],
    [mergedMaterial, 0],
  ]);
  for (const resource of disposed.keys()) {
    resource.addEventListener("dispose", () => {
      disposed.set(resource, disposed.get(resource) + 1);
    });
  }

  const trackedGeometries = new Set([firstGeometry, secondGeometry]);
  const trackedMaterials = new Set([sourceMaterial, mergedMaterial]);
  const owner = {
    geometry(geometry) {
      trackedGeometries.add(geometry);
      return geometry;
    },
    retainGeometries(retained) {
      for (const geometry of [...trackedGeometries]) {
        if (retained.has(geometry)) continue;
        geometry.dispose();
        trackedGeometries.delete(geometry);
      }
    },
    retainMaterials(retained) {
      for (const material of [...trackedMaterials]) {
        if (retained.has(material)) continue;
        material.dispose();
        trackedMaterials.delete(material);
      }
    },
  };

  const root = new THREE.Group();
  const parent = new THREE.Group();
  parent.name = "test-rig";
  root.add(parent);
  const first = new THREE.Mesh(firstGeometry, sourceMaterial);
  first.name = "first";
  first.position.set(2, 0, 0);
  first.userData.mergeMaterial = mergedMaterial;
  first.userData.mergeColor = new THREE.Color("#ff0000");
  const second = new THREE.Mesh(secondGeometry, sourceMaterial);
  second.name = "second";
  second.position.set(-1, 3, 0);
  second.scale.set(2, 1, 1);
  second.userData.mergeMaterial = mergedMaterial;
  second.userData.mergeColor = new THREE.Color("#0000ff");
  parent.add(first, second);

  mergeRigidMeshes(root, owner, new Set());

  assert.equal(parent.children.length, 1);
  const merged = parent.children[0];
  assert.equal(merged.geometry.attributes.position.count, 6);
  assert.deepEqual([...merged.geometry.index.array], [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(
    [...merged.geometry.attributes.position.array],
    [
      2, 0, 0,
      3, 0, 0,
      2, 1, 0,
      -1, 3, 0,
      1, 3, 0,
      -1, 4, 0,
    ],
  );
  const normals = merged.geometry.attributes.normal.array;
  for (let index = 0; index < normals.length; index += 3) {
    assert.ok(
      Math.abs(Math.hypot(normals[index], normals[index + 1], normals[index + 2]) - 1) <
        1e-6,
      "merged normals must remain unit length",
    );
  }
  assert.ok(Math.abs(normals[9] - Math.sqrt(0.2)) < 1e-6);
  assert.ok(Math.abs(normals[10] - Math.sqrt(0.8)) < 1e-6);
  const colors = merged.geometry.attributes.color;
  assert.equal(colors.count, 6);
  assert.equal(colors.normalized, true);
  assert.deepEqual([...colors.array.slice(0, 3)], [255, 0, 0]);
  assert.deepEqual([...colors.array.slice(9, 12)], [0, 0, 255]);
  assert.equal(disposed.get(firstGeometry), 1);
  assert.equal(disposed.get(secondGeometry), 1);
  assert.equal(disposed.get(sourceMaterial), 1);
  assert.equal(disposed.get(mergedMaterial), 0);

  merged.geometry.dispose();
  mergedMaterial.dispose();
});

check("curtain cascades boxes and connector halves with the loaded scene", () => {
  const curtain = between(controller, "function createCurtainAnimations", "export async function");
  assert.match(curtain, /CURTAIN_DURATION \* 1000/);
  assert.match(curtain, /cascadeKeyframes/);
  assert.match(curtain, /\.bkcol\[data-side="L"\], \.bkcol\[data-side="R"\]/);
  assert.doesNotMatch(curtain, /querySelectorAll\("\.bkcol\[data-side\]"\)/);
  assert.match(curtain, /wave \* 0\.075 \+ row \* 0\.016/);
  assert.match(curtain, /\.bksvg path\[data-curtain-side\]/);
  assert.match(curtain, /path\[data-curtain-side="C"\]/);
  assert.doesNotMatch(curtain, /add\(column,/);
  assert.match(interact, /function tagCurtainPath/);
  assert.match(interact, /function addCurtainPath/);
  assert.match(interact, /data-curtain-count/);
  assert.match(interact, /addCurtainPath\('M'\+Math\.round\(x1\)/);
  assert.match(interact, /addCurtainPath\('M'\+xm/);
  assert.ok(
    controller.indexOf("created = await module.createChampionScene") <
      controller.indexOf("curtainAnimations = createCurtainAnimations"),
    "the bracket must remain readable until the 3D world is ready",
  );
  assert.match(mock, /function buildCurtainAnimations/);
  assert.match(mock, /tagMockCurtainPath/);
  assert.match(mock, /path\[data-curtain-side="C"\]/);
  assert.match(models, /fillText\(label, canvas\.width \/ 2, 174, canvas\.width - 110\)/);
  assert.match(mock, /import \{ createChampionScene \}/);
  assert.doesNotMatch(mock, /new THREE\.WebGLRenderer|createSceneBundle|function createPlayer/);
});

check("scene is one bounded local Three.js runtime with explicit failure paths", () => {
  const armSolver = between(scene, "function solveArmToTarget", "function updateTrophy");
  assert.match(scene, /from "\.\/vendor\/three\.module\.min\.js"/);
  assert.match(scene, /export const CELEBRATION_DPR_LIMIT = 1\.5/);
  assert.match(scene, /new THREE\.WebGLRenderer/);
  assert.match(scene, /fov: 32/);
  assert.match(scene, /startX: STAGE_LAYOUT\.cameraStartX/);
  assert.match(scene, /endX: STAGE_LAYOUT\.cameraEndX/);
  assert.match(scene, /new THREE\.PerspectiveCamera/);
  assert.equal(
    armSolver.match(/alignNegativeYToWorldDirection\(arm\.shoulder, boneDirection\)/g)?.length,
    1,
    "each arm frame should align the shoulder once before solving the elbow",
  );
  assert.doesNotMatch(scene, /OrthographicCamera|BokehPass|DepthOfField/);
  assert.doesNotMatch(scene, /\bgolf\b/i);
  assert.match(scene, /webglcontextlost/);
  assert.match(scene, /renderer\.setPixelRatio\(Math\.min/);
  assert.match(scene, /flagCode\(team\)/);
  assert.match(scene, /sampleCanvas\.width = 48/);
  assert.match(scene, /flagCanvas\.width = 320/);
  assert.match(scene, /captain\.anchors\.trophyCarrier\.getWorldPosition/);
  assert.match(scene, /captain\.anchors\.trophyCarrier\.getWorldQuaternion/);
  assert.match(scene, /trophy\.anchors\.leftGrip\.getWorldPosition/);
  assert.match(scene, /trophy\.anchors\.top\.getWorldPosition/);
  assert.match(scene, /trophy\.anchors\.bottom\.getWorldPosition/);
  assert.match(scene, /height: Math\.abs\(bottomY - topY\)/);
  assert.match(scene, /function solveArmToTarget/);
  assert.match(scene, /function alignNegativeYToWorldDirection/);
  assert.doesNotMatch(scene, /\.attach\(trophy\.root\)/);
  assert.match(scene, /captain\.root\.visible = Boolean\(progress\.captainVisible\)/);
  assert.match(scene, /teamGroup\.visible = Boolean\(progress\.teamVisible\)/);
  assert.match(scene, /const CAPTAIN_ENTRY_YAW = headingYaw/);
  assert.match(scene, /const TEAM_CELEBRATION_POSES = Object\.freeze/);
  assert.match(scene, /const TEAM_ANTICIPATION_POSES = Object\.freeze/);
  assert.match(scene, /TEAM_CELEBRATION_POSES\[index % TEAM_CELEBRATION_POSES\.length\]/);
  assert.match(scene, /captain\.root\.rotation\.y = CAPTAIN_ENTRY_YAW/);
  assert.match(scene, /interpolateYaw\(\s*CAPTAIN_JOIN_YAW,/);
  assert.match(scene, /poseCaptainCrowdHype/);
  assert.match(scene, /poseTeammateAnticipation/);
  assert.match(scene, /progress\.teamAnticipation \* \(1 - progress\.lift\)/);
  assert.match(scene, /rig\.root\.rotation\.y = interpolateYaw\(watchYaw, 0, frontTurn\)/);
  assert.match(scene, /STAGE_LAYOUT\.captainPodiumApproachX/);
  assert.match(scene, /STAGE_LAYOUT\.captainFinalX/);
  assert.match(scene, /function updatePlinth/);
  assert.match(scene, /const dismiss = progress\.plinthDismiss/);
  assert.match(scene, /createTrophyPlinth/);
  assert.match(scene, /reachableLiftTarget\(/);
  assert.match(scene, /lerp\(joinedCarryHeight, captainLiftTarget, progress\.lift\)/);
  const trophyUpdate = between(scene, "function updateTrophy", "function updateCaptainGrip");
  assert.match(trophyUpdate, /trophy\.root\.quaternion\.slerpQuaternions/);
  assert.match(trophyUpdate, /trophyCarrierQuaternion/);
  assert.doesNotMatch(trophyUpdate, /trophy\.root\.rotation\.set\(0, 0, 0\)/);
  assert.match(scene, /trophy\.root\.quaternion\.copy\(trophyRestQuaternion\)/);
  assert.doesNotMatch(scene, /progress\.pump|progress\.fakePumps/);
  assert.match(scene, /const jump = progress\.jump \* STAGE_HEIGHTS\.teamJump/);
  assert.match(scene, /const carryPush = progress\.captainTravel/);
  assert.doesNotMatch(scene, /progress\.teamBounce|const teamBounce/);
  assert.match(scene, /STAGE_LAYOUT\.plinthX/);
  assert.match(scene, /STAGE_LAYOUT\.podiumX/);
  assert.match(scene, /STAGE_HEIGHTS\.captainPodiumTop/);
  assert.match(scene, /STAGE_HEIGHTS\.teammatePodiumTop/);
  assert.match(scene, /const cameraX = THREE\.MathUtils\.lerp/);
  assert.match(scene, /camera\.position\.set\(\s*cameraX,/);
  assert.match(scene, /cameraTarget\.set\(\s*cameraX,/);
  assert.doesNotMatch(scene, /const winnersGroup/);
  assert.doesNotMatch(scene, /new THREE\.CylinderGeometry\(\s*0\.72/);
  assert.match(scene, /stadium\.banner\.material\.emissiveIntensity/);
  assert.match(scene, /renderer\?\.dispose\(\)/);
  assert.doesNotMatch(scene, /if \(!contextLost\) renderer\?\.dispose/);
  const renderFrame = between(scene, "function renderFrame(timeSeconds)", "function resize(");
  assert.doesNotMatch(renderFrame, /getBoundingClientRect|clientWidth|clientHeight|Math\.random/);
  assert.doesNotMatch(renderFrame, /new THREE\.|new Array/);
  const frameOrder = [
    "resetRigs()",
    "updateOpening(progress)",
    "updateCaptain(progress)",
    "updateTeam(time, progress)",
    "updateTrophy(progress)",
    "updatePlinth(progress)",
    "applyCamera(time, progress)",
    "effects.update(time, progress)",
    "updateCaptainGrip(progress)",
    "renderer.render(scene, camera)",
  ];
  for (let index = 1; index < frameOrder.length; index++) {
    assert.ok(
      renderFrame.indexOf(frameOrder[index - 1]) < renderFrame.indexOf(frameOrder[index]),
      `${frameOrder[index - 1]} must run before ${frameOrder[index]}`,
    );
  }
  const ik = between(scene, "function alignNegativeYToWorldDirection", "function updateTrophy");
  assert.doesNotMatch(ik, /new THREE\.|new Array|Math\.random/);
  assert.doesNotMatch(ik, /captain\.root\.updateMatrixWorld\(true\)|scene\.updateMatrixWorld/);
  assert.match(ik, /arm\.shoulder\.getWorldPosition\(shoulderWorld\)/);
  assert.match(ik, /arm\.elbow\.getWorldPosition\(elbowWorld\)/);
  assert.doesNotMatch(trophyUpdate, /updateMatrixWorld\(true\)/);
  const runtimeUpdates = between(scene, "function updateOpening", "function renderFrame");
  assert.doesNotMatch(
    runtimeUpdates,
    /6\.2|8\.25|9\.6|14\.2|15\.4|17\.7|19\.9|8\.62|9\.07|9\.35/,
  );
});

check("shared trophy is smooth, curved, and premium in both surfaces", () => {
  assert.match(trophyGeometry, /new THREE\.MeshPhysicalMaterial/);
  assert.match(trophyGeometry, /new THREE\.SphereGeometry\(0\.64, 64, 40\)/);
  assert.match(trophyGeometry, /new THREE\.LatheGeometry/);
  assert.match(trophyGeometry, /new THREE\.TubeGeometry/);
  assert.match(trophyGeometry, /trophy-globe-meridian-front/);
  assert.match(trophyGeometry, /trophy-globe-upper-latitude/);
  assert.match(trophyGeometry, /trophy-left-grip/);
  assert.match(trophyGeometry, /trophy-right-grip/);
  assert.equal(TROPHY_TOP_Y, 1.78);
  assert.equal(TROPHY_BOTTOM_Y, -1.62);
  assert.doesNotMatch(trophyGeometry, /IcosahedronGeometry|flatShading:\s*true/);
  assert.match(mock, /createChampionScene/);
  assert.match(trophyFallback, /radialGradient/);
  assert.match(trophyFallback, /C62 84 53 105/);
  assert.doesNotMatch(trophyFallback, /<polygon|M90 10 69 24/);
});

check("the pre-grab beat is a path-facing walk and crowd-hype fist", () => {
  assert.match(timeline, /id: "trophy-approach"/);
  assert.match(timeline, /captainWalkStart: 2\.2/);
  assert.match(timeline, /trophyApproachEnd: 6\.9/);
  assert.match(timeline, /crowdHypeStart: 3\.85/);
  assert.match(scene, /poseCaptainCrowdHype\(captain, progress\.crowdHype\)/);
  assert.match(scene, /const grip = progress\.grip/);
  assert.match(mock, /Side-on walk, crowd-hype fist, then trophy focus/);
  assert.doesNotMatch([timeline, scene, mock].join("\n"), /\bgolf\b/i);
});

check("all trophy surfaces share one crossfade contract", () => {
  assert.match(controller, /TROPHY_CROSSFADE_START/);
  assert.match(controller, /TROPHY_CROSSFADE_END/);
  assert.match(scene, /progress\.trophyCrossfade/);
  assert.match(mock, /TROPHY_CROSSFADE_START/);
  assert.match(mock, /TROPHY_CROSSFADE_END/);
  assert.doesNotMatch([controller, scene, mock].join("\n"), /8\.62|9\.07|8\.7/);
});

check("effects are deterministic, segmented, instanced, and bounded", () => {
  assert.match(effects, /const flagWidth = 4\.6/);
  assert.match(effects, /flagGroup\.position\.set\(bannerX,/);
  assert.match(effects, /heroSpot\.target\.position\.set\(podiumCenterX,/);
  assert.match(effects, /spawn\[offset3\] = podiumCenterX/);
  assert.match(effects, /progress\.confettiElapsed/);
  assert.match(effects, /progress\.flashes/);
  assert.match(effects, /champion-flare-comets/);
  assert.match(effects, /progress\.flareElapsed/);
  assert.match(effects, /elapsed % flareRelaunchSeconds/);
  assert.match(effects, /progress\.flares > 0\.001 && local > 0 && local < 1/);
  assert.match(effects, /crowd\.arms\.setMatrixAt/);
  assert.match(effects, /const figureScale = crowd\.scales\[index\]/);
  assert.match(effects, /Math\.floor\(index \/ 2\) \* 0\.14/);
  assert.doesNotMatch(effects, /20\.8|18\.2|19\.4/);
  assert.match(effects, /new THREE\.InstancedMesh/);
  assert.match(effects, /new Float32Array/);
  assert.doesNotMatch(
    between(effects, "function update(timeSeconds, progress)", "function destroy()"),
    /Math\.random|getBoundingClientRect|new THREE\.|new Array/,
  );
});

check("reduced motion avoids scene import and fallback uses a pausable clock", () => {
  assert.match(controller, /prefers-reduced-motion: reduce/);
  assert.ok(
    controller.indexOf("if (reducedMotion)") < controller.indexOf("initializeScene();"),
    "reduced motion must branch before the scene import helper is invoked",
  );
  assert.match(controller, /duration: nextMode === "timeline" \? CELEBRATION_DURATION : FALLBACK_DURATION/);
  assert.match(controller, /clock\.pause\(performance\.now\(\)\)/);
  assert.match(controller, /clock\.resume\(performance\.now\(\)\)/);
  assert.match(controller, /mockCelebrationFallback/);
});

check("review harness rejects stale scene starts and releases context-loss resources", () => {
  const ensureScene = between(mock, "async function ensureScene()", "function resizeScene()");
  const startMock = between(mock, "async function startMock", "function togglePause");
  const scrubTo = between(mock, "async function scrubTo", "async function selectTeam");
  assert.match(mock, /sceneGeneration: 0/);
  assert.match(mock, /function disposeScene\(\) \{\s*state\.sceneGeneration \+= 1/);
  assert.match(ensureScene, /generation !== state\.sceneGeneration/);
  assert.match(ensureScene, /onContextLoss:[\s\S]*?disposeScene\(\)[\s\S]*?showStaticFallback\(\)/);
  assert.match(startMock, /const controller = state\.reducedMotion \? null : await ensureScene\(\)/);
  assert.match(startMock, /!state\.reducedMotion && !state\.webglFailed && !controller/);
  assert.match(scrubTo, /!state\.reducedMotion && !state\.webglFailed && !controller/);
});

check("celebration is intentionally silent", () => {
  const stageFactory = between(controller, "function createStage", "function createCurtainAnimations");
  assert.equal(
    fs.existsSync(new URL("../docs/js/champion-celebration-audio.js", import.meta.url)),
    false,
  );
  assert.equal(
    (stageFactory.match(/document\.createElement\("button"\)/g) || []).length,
    1,
    "Skip must be the stage's only control",
  );
  assert.doesNotMatch(
    [controller, timeline, scene, models, effects].join("\n"),
    /AudioContext|audioController|createCelebrationAudio|champion-celebration-sound|Sound off/,
  );
  assert.doesNotMatch(timeline, /AUDIO_CUES|cueStateAt/);
  assert.doesNotMatch(mock, /\b(?:sound|audio)\b|AudioContext|createOscillator|createBufferSource/i);
  assert.doesNotMatch(mockIndex, /soundButton|cinematicSound|>\s*Sound\b/i);
});

console.log("\nCHAMPION CELEBRATION CORE OK");
