import * as THREE from "./vendor/three.module.min.js";
import { flagCode } from "./flags.js";
import {
  TROPHY_BOTTOM_Y,
  TROPHY_TOP_Y,
  createTrophySculpture,
} from "./trophy-geometry.js";
import {
  STAGE_HEIGHTS,
  STAGE_LAYOUT,
  TEAMMATE_COUNT,
  createPlayerRig,
  createPodium,
  createStadium,
  createTrophyPlinth,
} from "./champion-celebration-models.js";
import { createCelebrationEffects } from "./champion-celebration-effects.js";
import {
  TROPHY_SCENE_SCALE,
  celebrationProgressAt,
  headingYaw,
  interpolateYaw,
  reachableLiftTarget,
} from "./champion-celebration-timeline.js";

export const CELEBRATION_DPR_LIMIT = 1.5;

const IDENTITY_CACHE = new Map();
const DESKTOP_CAMERA = Object.freeze({
  fov: 32,
  startX: STAGE_LAYOUT.cameraStartX,
  endX: STAGE_LAYOUT.cameraEndX,
  y: 4.75,
  z: 14.8,
  targetY: 2.02,
  targetZ: 0,
});
const PHONE_CAMERA = Object.freeze({
  fov: 38,
  startX: STAGE_LAYOUT.cameraStartX,
  endX: STAGE_LAYOUT.cameraEndX,
  y: 5.05,
  z: 20.2,
  targetY: 2.05,
  targetZ: 0,
});
const GROUND_TROPHY_CARRY_HEIGHT = 1.84;
const TROPHY_BASE_GRIP_SPAN = 0.34;
const TROPHY_BASE_GRIP_RISE = 0.02;
const TROPHY_BASE_GRIP_FORWARD = 0.05;
const CAPTAIN_ENTRY_YAW = headingYaw(
  STAGE_LAYOUT.captainEntryX,
  STAGE_LAYOUT.captainGroundZ,
  STAGE_LAYOUT.captainApproachX,
  STAGE_LAYOUT.captainApproachZ,
);
const CAPTAIN_APPROACH_YAW = headingYaw(
  STAGE_LAYOUT.captainApproachX,
  STAGE_LAYOUT.captainApproachZ,
  STAGE_LAYOUT.plinthX,
  STAGE_LAYOUT.captainPlinthZ,
);
const CAPTAIN_TROPHY_YAW = headingYaw(
  STAGE_LAYOUT.plinthX,
  STAGE_LAYOUT.captainPlinthZ,
  STAGE_LAYOUT.plinthX,
  STAGE_LAYOUT.plinthZ,
);
const CAPTAIN_CARRY_YAW = headingYaw(
  STAGE_LAYOUT.plinthX,
  STAGE_LAYOUT.captainPlinthZ,
  STAGE_LAYOUT.captainPodiumApproachX,
  STAGE_LAYOUT.captainPodiumApproachZ,
);
const CAPTAIN_JOIN_YAW = headingYaw(
  STAGE_LAYOUT.captainPodiumApproachX,
  STAGE_LAYOUT.captainPodiumApproachZ,
  STAGE_LAYOUT.captainFinalX,
  STAGE_LAYOUT.captainFinalZ,
);
const TEAM_ANTICIPATION_POSES = Object.freeze([
  Object.freeze({
    leftShoulderZ: 0.12,
    rightShoulderZ: -0.35,
    leftShoulderX: -0.1,
    rightShoulderX: -0.42,
    leftElbowZ: -0.1,
    rightElbowZ: 1.75,
    chestZ: -0.035,
    headYaw: 0.08,
    grip: 0.16,
  }),
  Object.freeze({
    leftShoulderZ: 0.35,
    rightShoulderZ: -0.12,
    leftShoulderX: -0.42,
    rightShoulderX: -0.1,
    leftElbowZ: -1.75,
    rightElbowZ: 0.1,
    chestZ: 0.025,
    headYaw: 0.04,
    grip: 0.22,
  }),
  Object.freeze({
    leftShoulderZ: 0.28,
    rightShoulderZ: -0.28,
    leftShoulderX: -0.38,
    rightShoulderX: -0.38,
    leftElbowZ: -1.65,
    rightElbowZ: 1.65,
    chestZ: -0.03,
    headYaw: -0.06,
    grip: 0.28,
  }),
  Object.freeze({
    leftShoulderZ: 0.1,
    rightShoulderZ: -0.5,
    leftShoulderX: -0.08,
    rightShoulderX: -0.4,
    leftElbowZ: -0.1,
    rightElbowZ: 1.55,
    chestZ: 0.03,
    headYaw: 0.06,
    grip: 0.28,
  }),
  Object.freeze({
    leftShoulderZ: 0.5,
    rightShoulderZ: -0.1,
    leftShoulderX: -0.4,
    rightShoulderX: -0.08,
    leftElbowZ: -1.55,
    rightElbowZ: 0.1,
    chestZ: -0.025,
    headYaw: -0.04,
    grip: 0.22,
  }),
  Object.freeze({
    leftShoulderZ: 0.4,
    rightShoulderZ: -0.4,
    leftShoulderX: -0.32,
    rightShoulderX: -0.32,
    leftElbowZ: -0.9,
    rightElbowZ: 0.9,
    chestZ: 0.035,
    headYaw: -0.08,
    grip: 0.16,
  }),
]);
const TEAM_CELEBRATION_POSES = Object.freeze([
  Object.freeze({
    leftShoulder: 0.28,
    rightShoulder: -2.3,
    leftElbow: -0.35,
    rightElbow: 0.08,
    chest: -0.04,
    headYaw: -0.08,
    headRoll: 0.02,
  }),
  Object.freeze({
    leftShoulder: 1.35,
    rightShoulder: -1.55,
    leftElbow: -0.55,
    rightElbow: 0.48,
    chest: 0.025,
    headYaw: 0.06,
    headRoll: -0.025,
  }),
  Object.freeze({
    leftShoulder: 0.6,
    rightShoulder: -2.55,
    leftElbow: -0.72,
    rightElbow: 0.05,
    chest: -0.02,
    headYaw: -0.04,
    headRoll: 0.03,
  }),
  Object.freeze({
    leftShoulder: 2.5,
    rightShoulder: -0.55,
    leftElbow: -0.05,
    rightElbow: 0.7,
    chest: 0.02,
    headYaw: 0.04,
    headRoll: -0.03,
  }),
  Object.freeze({
    leftShoulder: 1.9,
    rightShoulder: -1.25,
    leftElbow: -0.15,
    rightElbow: 0.62,
    chest: -0.03,
    headYaw: -0.07,
    headRoll: 0.02,
  }),
  Object.freeze({
    leftShoulder: 2.3,
    rightShoulder: -0.28,
    leftElbow: -0.08,
    rightElbow: 0.35,
    chest: 0.04,
    headYaw: 0.09,
    headRoll: -0.02,
  }),
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function smoothUnit(value) {
  const progress = clamp(value, 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(color) {
  return `#${color.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

function fallbackIdentity(team) {
  return {
    team,
    code: flagCode(team),
    seed: stableHash(team),
    flagCanvas: null,
    palette: {
      primary: "#c9a13a",
      secondary: "#16335c",
      accent: "#f3dd8b",
    },
  };
}

async function decodeImage(url, signal) {
  if (signal?.aborted) throw new DOMException("Celebration identity load aborted.", "AbortError");
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Celebration identity load aborted.", "AbortError"));
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Local champion flag failed to load: ${url}`));
    signal?.addEventListener("abort", onAbort, { once: true });
  });
  image.src = url;
  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      await loaded;
    }
  } else {
    await loaded;
  }
  if (signal?.aborted) throw new DOMException("Celebration identity load aborted.", "AbortError");
  return image;
}

async function loadCountryIdentity(team, signal) {
  const code = flagCode(team);
  if (!code) return fallbackIdentity(team);
  const url = new URL(`../flags/${code}.svg`, import.meta.url);
  const image = await decodeImage(url.href, signal);
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 48;
  sampleCanvas.height = 32;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Champion flag palette could not create a 2D canvas.");
  context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);

  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const histogram = new Map();
  let opaquePixels = 0;
  let lightPixels = 0;
  let darkPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 160) continue;
    opaquePixels++;
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    if (luminance < 26) {
      darkPixels++;
      continue;
    }
    if (luminance > 232) {
      lightPixels++;
      continue;
    }
    const quantized = [
      Math.round(red / 32) * 32,
      Math.round(green / 32) * 32,
      Math.round(blue / 32) * 32,
    ].map(channel => Math.min(255, channel));
    const key = quantized.join(",");
    histogram.set(key, (histogram.get(key) || 0) + 1);
  }

  const colors = [...histogram.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key.split(",").map(Number));
  const primary = colors[0] || [201, 161, 58];
  const lightNeutral = [236, 240, 245];
  const darkNeutral = [24, 32, 48];
  const lightShare = lightPixels / Math.max(1, opaquePixels);
  const darkShare = darkPixels / Math.max(1, opaquePixels);
  const secondary = colors.find(candidate => colorDistance(candidate, primary) > 120) ||
    (lightShare > 0.08 ? lightNeutral : null) ||
    (darkShare > 0.08 ? darkNeutral : null) ||
    colors[1] || [22, 51, 92];
  const accent = colors.find(candidate =>
    colorDistance(candidate, primary) > 112 && colorDistance(candidate, secondary) > 112) ||
    (secondary !== lightNeutral && lightShare > 0.08 ? lightNeutral : null) ||
    (secondary !== darkNeutral && darkShare > 0.08 ? darkNeutral : null) ||
    [218, 178, 72];
  const flagCanvas = document.createElement("canvas");
  flagCanvas.width = 320;
  flagCanvas.height = 240;
  const flagContext = flagCanvas.getContext("2d");
  if (!flagContext) throw new Error("Champion flag texture could not create a 2D canvas.");
  flagContext.drawImage(image, 0, 0, flagCanvas.width, flagCanvas.height);

  return {
    team,
    code,
    seed: stableHash(team),
    flagCanvas,
    palette: {
      primary: rgbToHex(primary),
      secondary: rgbToHex(secondary),
      accent: rgbToHex(accent),
    },
  };
}

async function getCountryIdentity(team, signal) {
  let promise = IDENTITY_CACHE.get(team);
  if (!promise) {
    promise = loadCountryIdentity(team, signal);
    IDENTITY_CACHE.set(team, promise);
  }
  try {
    return await promise;
  } catch (error) {
    IDENTITY_CACHE.delete(team);
    if (error?.name === "AbortError") throw error;
    console.warn(`Champion celebration could not sample the local flag for ${team}.`, error);
    return fallbackIdentity(team);
  }
}

function setMaterialOpacity(materials, opacity) {
  for (const material of materials) {
    material.transparent = opacity < 0.999;
    material.opacity = opacity;
    material.depthWrite = opacity >= 0.999;
  }
}

function poseWalk(rig, progress, cycles = 2.4, weight = 1) {
  const phase = progress * Math.PI * 2 * cycles;
  const swing = Math.sin(phase);
  const stride = Math.abs(swing);
  const bounce = 0.5 - 0.5 * Math.cos(phase * 2);
  const strideWeight = clamp(weight, 0, 1);
  const leadLeft = Math.max(0, -swing);
  const leadRight = Math.max(0, swing);
  const trailLeft = Math.max(0, swing);
  const trailRight = Math.max(0, -swing);

  rig.joints.leftHip.rotation.x = swing * 0.43 * strideWeight;
  rig.joints.rightHip.rotation.x = -swing * 0.43 * strideWeight;
  rig.joints.leftKnee.rotation.x = (leadLeft * 0.52 + trailLeft * 0.18) * strideWeight;
  rig.joints.rightKnee.rotation.x = (leadRight * 0.52 + trailRight * 0.18) * strideWeight;
  rig.joints.leftShoulder.rotation.x = -swing * 0.4 * strideWeight;
  rig.joints.rightShoulder.rotation.x = swing * 0.4 * strideWeight;
  rig.joints.leftElbow.rotation.x = -0.18 - stride * 0.22 * strideWeight;
  rig.joints.rightElbow.rotation.x = -0.18 - stride * 0.22 * strideWeight;
  rig.joints.leftFoot.rotation.x = (leadRight * 0.14 - trailRight * 0.06) * strideWeight;
  rig.joints.rightFoot.rotation.x = (leadLeft * 0.14 - trailLeft * 0.06) * strideWeight;
  rig.joints.hips.position.y = 1.186 + bounce * 0.02 * strideWeight;
  rig.joints.chest.rotation.z = Math.sin(phase * 0.5) * 0.03 * strideWeight;
  rig.joints.chest.rotation.y = swing * 0.03 * strideWeight;
  rig.joints.head.rotation.y = -swing * 0.03 * strideWeight;
}

function poseCaptainCrowdHype(rig, amount) {
  if (amount <= 0) return;
  rig.joints.rightShoulder.rotation.set(-0.2 * amount, 0, -1.42 * amount);
  rig.joints.rightElbow.rotation.set(-0.28 * amount, 0, -1.34 * amount);
  rig.joints.rightHand.rotation.z = -0.16 * amount;
  rig.joints.chest.rotation.z -= 0.045 * amount;
  rig.setRightHandGrip(amount);
}

function poseTeammateCelebrate(rig, index, amount) {
  const pose = TEAM_CELEBRATION_POSES[index % TEAM_CELEBRATION_POSES.length];
  rig.joints.leftShoulder.rotation.z += amount * pose.leftShoulder;
  rig.joints.rightShoulder.rotation.z += amount * pose.rightShoulder;
  rig.joints.leftElbow.rotation.z += amount * pose.leftElbow;
  rig.joints.rightElbow.rotation.z += amount * pose.rightElbow;
  rig.joints.leftElbow.rotation.x -= amount * (0.1 + (index % 3) * 0.04);
  rig.joints.rightElbow.rotation.x -= amount * (0.16 - (index % 2) * 0.04);
  rig.joints.chest.rotation.z += amount * pose.chest;
  rig.joints.head.rotation.y += amount * pose.headYaw;
  rig.joints.head.rotation.z += amount * pose.headRoll;
}

function poseTeammateAnticipation(rig, index, amount, timeSeconds) {
  if (amount <= 0) return;
  const pose = TEAM_ANTICIPATION_POSES[index % TEAM_ANTICIPATION_POSES.length];
  const pulse = Math.sin(timeSeconds * (1.65 + index * 0.045) + index * 0.92);
  const motion = pulse * amount;
  rig.joints.leftShoulder.rotation.z +=
    pose.leftShoulderZ * amount + motion * 0.045;
  rig.joints.rightShoulder.rotation.z +=
    pose.rightShoulderZ * amount - motion * 0.045;
  rig.joints.leftShoulder.rotation.x += pose.leftShoulderX * amount;
  rig.joints.rightShoulder.rotation.x += pose.rightShoulderX * amount;
  rig.joints.leftElbow.rotation.z += pose.leftElbowZ * amount - motion * 0.055;
  rig.joints.rightElbow.rotation.z += pose.rightElbowZ * amount + motion * 0.055;
  rig.joints.leftElbow.rotation.x -= amount * (0.18 + (index % 2) * 0.04);
  rig.joints.rightElbow.rotation.x -= amount * (0.16 + ((index + 1) % 2) * 0.04);
  rig.joints.chest.rotation.z += pose.chestZ * amount + motion * 0.025;
  rig.joints.chest.rotation.y += motion * 0.045;
  rig.joints.head.rotation.y += pose.headYaw * amount - motion * 0.03;
  rig.joints.head.rotation.x -= amount * 0.035;
  rig.setHandGrip(0.08 + pose.grip * amount);
}

export async function createChampionScene({
  canvas,
  team,
  signal,
  onContextLoss,
}) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError("Champion scene requires a canvas.");
  }
  const identity = await getCountryIdentity(team, signal);
  if (signal?.aborted) throw new DOMException("Champion scene creation aborted.", "AbortError");

  let destroyed = false;
  let contextLost = false;
  let width = 1;
  let height = 1;
  let profile = "desktop";
  let projectionDirty = true;
  let renderer = null;
  let effects = null;
  const ownedGeometries = [];
  const ownedMaterials = [];
  const ownedTextures = [];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#5b382b");
  scene.fog = new THREE.FogExp2("#7d563e", 0.018);
  const camera = new THREE.PerspectiveCamera(DESKTOP_CAMERA.fov, 1, 0.1, 60);
  const cameraTarget = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const projectedTop = new THREE.Vector3();
  const projectedBottom = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const trophyRestPosition = new THREE.Vector3(
    STAGE_LAYOUT.plinthX,
    STAGE_HEIGHTS.trophyRest,
    STAGE_LAYOUT.plinthZ,
  );
  const trophyCarrierPosition = new THREE.Vector3();
  const trophyRestQuaternion = new THREE.Quaternion();
  const trophyCarrierQuaternion = new THREE.Quaternion();
  const leftGripWorld = new THREE.Vector3();
  const rightGripWorld = new THREE.Vector3();
  const trophyBottomWorld = new THREE.Vector3();
  const trophyBaseLeftWorld = new THREE.Vector3();
  const trophyBaseRightWorld = new THREE.Vector3();
  const trophyGripAxisX = new THREE.Vector3();
  const trophyGripAxisY = new THREE.Vector3();
  const trophyGripAxisZ = new THREE.Vector3();
  const trophyWorldQuaternion = new THREE.Quaternion();
  const leftHandWorld = new THREE.Vector3();
  const rightHandWorld = new THREE.Vector3();
  const leftHandleTargetWorld = new THREE.Vector3();
  const rightHandleTargetWorld = new THREE.Vector3();
  const leftBaseTargetWorld = new THREE.Vector3();
  const rightBaseTargetWorld = new THREE.Vector3();
  const leftTargetWorld = new THREE.Vector3();
  const rightTargetWorld = new THREE.Vector3();
  const shoulderWorld = new THREE.Vector3();
  const elbowWorld = new THREE.Vector3();
  const targetDirection = new THREE.Vector3();
  const poleDirection = new THREE.Vector3();
  const elbowTarget = new THREE.Vector3();
  const boneDirection = new THREE.Vector3();
  const localBoneDirection = new THREE.Vector3();
  const negativeY = new THREE.Vector3(0, -1, 0);
  const parentWorldQuaternion = new THREE.Quaternion();

  const ambient = new THREE.HemisphereLight("#ffe8c7", "#6f4c3b", 1.92);
  const key = new THREE.DirectionalLight("#ffd29c", 2.72);
  key.position.set(-4.8, 9.2, 8.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -11;
  key.shadow.camera.right = 11;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -3;
  const rim = new THREE.DirectionalLight(identity.palette.accent, 0.46);
  rim.position.set(0, 6.2, -6.2);
  const fill = new THREE.DirectionalLight("#fff0d5", 1.34);
  fill.position.set(5.4, 5.2, 8.4);
  scene.add(ambient, key, rim, fill);

  const stadium = createStadium({
    palette: identity.palette,
    seed: identity.seed,
    team: identity.team,
    profile,
  });
  scene.add(stadium.root);

  const podium = createPodium({ palette: identity.palette });
  podium.root.position.set(
    STAGE_LAYOUT.podiumX,
    STAGE_HEIGHTS.ground,
    STAGE_LAYOUT.podiumZ,
  );
  scene.add(podium.root);

  const teamGroup = new THREE.Group();
  teamGroup.name = "teammate-reveal-group";
  teamGroup.position.set(
    STAGE_LAYOUT.podiumX,
    STAGE_HEIGHTS.ground,
    STAGE_LAYOUT.podiumZ + STAGE_LAYOUT.teamZ,
  );
  teamGroup.visible = false;
  const teammatePositions = [-2.2, -1.34, -0.5, 0.5, 1.34, 2.2];
  const teammateDepths = [-0.16, -0.02, -0.24, -0.24, -0.02, -0.16];
  const teammates = [];
  for (let index = 0; index < TEAMMATE_COUNT; index++) {
    const rig = createPlayerRig({
      palette: identity.palette,
      seed: identity.seed,
      variant: index + 1,
    });
    rig.root.position.x = teammatePositions[index];
    rig.root.position.z = teammateDepths[index];
    rig.root.rotation.y = 0;
    teamGroup.add(rig.root);
    teammates.push(rig);
  }
  scene.add(teamGroup);

  const captain = createPlayerRig({
    palette: identity.palette,
    seed: identity.seed,
    variant: 0,
    captain: true,
  });
  captain.root.position.set(
    STAGE_LAYOUT.captainEntryX,
    STAGE_HEIGHTS.ground,
    STAGE_LAYOUT.captainGroundZ,
  );
  captain.root.visible = false;
  scene.add(captain.root);
  const captainLiftTarget = reachableLiftTarget(
    captain.metrics,
    STAGE_HEIGHTS,
    TROPHY_SCENE_SCALE,
  );

  const plinth = createTrophyPlinth({ palette: identity.palette });
  plinth.root.position.set(
    STAGE_LAYOUT.plinthX,
    STAGE_HEIGHTS.ground,
    STAGE_LAYOUT.plinthZ,
  );
  scene.add(plinth.root);
  const plinthAnchor = plinth.anchors.top;

  const trophy = createTrophySculpture({
    body: "#d8b34b",
    inset: "#254538",
    seam: "#8c6b22",
  });
  trophy.root.name = "celebration-trophy";
  trophy.root.scale.setScalar(TROPHY_SCENE_SCALE);
  trophy.root.position.copy(trophyRestPosition);
  trophy.root.rotation.set(0, 0, 0);
  const trophyMaterials = [trophy.materials.body, trophy.materials.inset, trophy.materials.seam];
  setMaterialOpacity(trophyMaterials, 0);
  scene.add(trophy.root);

  const flagTexture = identity.flagCanvas
    ? new THREE.CanvasTexture(identity.flagCanvas)
    : null;
  if (flagTexture) {
    flagTexture.colorSpace = THREE.SRGBColorSpace;
    flagTexture.flipY = false;
    flagTexture.needsUpdate = true;
    ownedTextures.push(flagTexture);
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor("#5b382b", 1);

    effects = createCelebrationEffects({
      scene,
      palette: identity.palette,
      flagTexture,
      seed: identity.seed,
      stadium,
      captain,
      teammates,
      profile,
      bannerX: STAGE_LAYOUT.bannerX,
      podiumCenterX: STAGE_LAYOUT.podiumX,
    });
  } catch (error) {
    stadium.dispose();
    podium.dispose();
    plinth.dispose();
    captain.dispose();
    for (const rig of teammates) rig.dispose();
    trophy.dispose();
    for (const geometry of ownedGeometries) geometry.dispose();
    for (const material of ownedMaterials) material.dispose();
    for (const texture of ownedTextures) texture.dispose();
    renderer?.dispose();
    throw error;
  }

  function applyCamera(timeSeconds, progress) {
    const config = profile === "phone" ? PHONE_CAMERA : DESKTOP_CAMERA;
    const carryPush = progress.captainTravel;
    const liftPush = progress.lift;
    const holdBreath = Math.sin(timeSeconds * 0.2) * 0.035 * progress.finalHold;
    const cameraX = THREE.MathUtils.lerp(config.startX, config.endX, carryPush);
    const nextFov = config.fov - liftPush * (profile === "phone" ? 0.6 : 1.2);
    if (Math.abs(camera.fov - nextFov) > 1e-4) {
      camera.fov = nextFov;
      projectionDirty = true;
    }
    camera.position.set(
      cameraX,
      config.y + liftPush * (profile === "phone" ? 0.38 : 0.1),
      config.z - carryPush * (profile === "phone" ? 0.42 : 0.6) -
        liftPush * (profile === "phone" ? 0.42 : 0.72) + holdBreath,
    );
    cameraTarget.set(
      cameraX,
      config.targetY + liftPush * (profile === "phone" ? 0.72 : 0.62),
      config.targetZ + carryPush * 0.08,
    );
    camera.lookAt(cameraTarget);
    if (projectionDirty) {
      camera.updateProjectionMatrix();
      projectionDirty = false;
    }
  }

  function profileTeammateX(index) {
    const source = teammatePositions[index];
    return profile === "phone" ? source * 0.86 : source;
  }

  function applyProfileComposition() {
    podium.root.scale.set(1, 1, 1);
    podium.root.position.set(
      STAGE_LAYOUT.podiumX,
      STAGE_HEIGHTS.ground,
      STAGE_LAYOUT.podiumZ,
    );
    teamGroup.position.x = STAGE_LAYOUT.podiumX;
    teamGroup.position.z = STAGE_LAYOUT.podiumZ + STAGE_LAYOUT.teamZ;
  }

  function resetRigs() {
    captain.resetPose();
    for (let index = 0; index < teammates.length; index++) {
      const rig = teammates[index];
      rig.resetPose();
      rig.root.position.x = profileTeammateX(index);
      rig.root.position.z = teammateDepths[index];
      rig.root.rotation.y = 0;
    }
  }

  function updateOpening(progress) {
    stadium.root.position.y = lerp(-1.4, 0, progress.stadiumReveal);
    podium.root.position.y = lerp(-0.72, STAGE_HEIGHTS.ground, progress.stadiumReveal);
    const restScale = lerp(0.34, TROPHY_SCENE_SCALE, progress.trophySettle);
    if (progress.trophyHandoff <= 0) {
      trophy.root.quaternion.copy(trophyRestQuaternion);
      trophy.root.position.set(
        trophyRestPosition.x,
        lerp(
          STAGE_HEIGHTS.trophyRest + 0.5,
          STAGE_HEIGHTS.trophyRest,
          progress.trophySettle,
        ),
        trophyRestPosition.z,
      );
      trophy.root.scale.setScalar(restScale);
    }
    stadium.banner.material.emissiveIntensity = 0.12 + progress.opening * 0.16;
  }

  function captainBaseHeight(progress) {
    const stepUp = smoothUnit(progress.join / 0.24);
    return lerp(
      STAGE_HEIGHTS.ground,
      STAGE_HEIGHTS.captainPodiumTop,
      stepUp,
    );
  }

  function captainFrontTurn(progress) {
    return progress.captainFront;
  }

  function updateCaptain(progress) {
    const baseHeight = captainBaseHeight(progress);
    captain.root.visible = Boolean(progress.captainVisible);
    captain.root.position.set(
      STAGE_LAYOUT.captainEntryX,
      baseHeight,
      STAGE_LAYOUT.captainGroundZ,
    );
    captain.root.rotation.set(0, 0, 0);
    captain.anchors.trophyCarrier.position.set(
      0,
      GROUND_TROPHY_CARRY_HEIGHT - baseHeight,
      0.52,
    );
    if (!progress.captainVisible) return;

    if (progress.captainEntry < 1) {
      captain.root.position.x = lerp(
        STAGE_LAYOUT.captainEntryX,
        STAGE_LAYOUT.captainApproachX,
        progress.captainEntry,
      );
      captain.root.position.z = lerp(
        STAGE_LAYOUT.captainGroundZ,
        STAGE_LAYOUT.captainApproachZ,
        progress.captainEntry,
      );
      captain.root.rotation.y = CAPTAIN_ENTRY_YAW;
      poseWalk(captain, progress.captainEntry, 3.2);
      const lateralLean = Math.sin(progress.captainEntry * Math.PI);
      captain.joints.chest.rotation.z = -0.055 * lateralLean;
      captain.joints.head.rotation.z = 0.025 * lateralLean;
      poseCaptainCrowdHype(captain, progress.crowdHype);
      captain.joints.head.rotation.y -= CAPTAIN_ENTRY_YAW * 0.58 * progress.crowdHype;
      return;
    }

    if (progress.approach < 1) {
      const pathTurn = smoothUnit((progress.approach - 0.58) / 0.42);
      captain.root.position.x = lerp(
        STAGE_LAYOUT.captainApproachX,
        STAGE_LAYOUT.plinthX,
        progress.approach,
      );
      captain.root.position.z = lerp(
        STAGE_LAYOUT.captainApproachZ,
        STAGE_LAYOUT.captainPlinthZ,
        progress.approach,
      );
      const walkingYaw = interpolateYaw(
        CAPTAIN_ENTRY_YAW,
        CAPTAIN_APPROACH_YAW,
        smoothUnit(progress.approach / 0.35),
      );
      captain.root.rotation.y = interpolateYaw(
        walkingYaw,
        CAPTAIN_TROPHY_YAW,
        pathTurn,
      );
      poseWalk(captain, progress.approach, 2.6);
      poseCaptainCrowdHype(captain, progress.crowdHype);
      captain.joints.head.rotation.y -=
        captain.root.rotation.y * 0.62 * progress.crowdHype;
      captain.joints.chest.rotation.x = -0.07 * pathTurn;
      captain.anchors.trophyCarrier.position.z = 0.62;
      return;
    }

    if (progress.grab < 1) {
      captain.root.position.x = STAGE_LAYOUT.plinthX;
      captain.root.position.z = STAGE_LAYOUT.captainPlinthZ;
      captain.root.rotation.y = CAPTAIN_TROPHY_YAW;
      const crouch = Math.sin(Math.min(1, progress.grab / 0.72) * Math.PI) * 0.09;
      captain.root.position.y = baseHeight - crouch;
      captain.joints.hips.rotation.x = crouch * 1.15;
      captain.joints.leftKnee.rotation.x = crouch * 2.6;
      captain.joints.rightKnee.rotation.x = crouch * 2.6;
      captain.joints.chest.rotation.x =
        -0.14 * progress.grip + 0.055 * progress.trophyHandoff;
      captain.joints.head.rotation.x =
        0.075 * progress.grip - 0.035 * progress.trophyHandoff;
      captain.anchors.trophyCarrier.position.z =
        lerp(0.62, 0.52, progress.trophyHandoff);
      return;
    }

    if (progress.carry < 1) {
      captain.root.position.x = lerp(
        STAGE_LAYOUT.plinthX,
        STAGE_LAYOUT.captainPodiumApproachX,
        progress.carry,
      );
      captain.root.position.z = lerp(
        STAGE_LAYOUT.captainPlinthZ,
        STAGE_LAYOUT.captainPodiumApproachZ,
        progress.carry,
      );
      const departureTurn = smoothUnit(progress.carry / 0.18);
      const arrivalTurn = smoothUnit((progress.carry - 0.82) / 0.18);
      captain.root.rotation.y = interpolateYaw(
        interpolateYaw(CAPTAIN_TROPHY_YAW, CAPTAIN_CARRY_YAW, departureTurn),
        CAPTAIN_JOIN_YAW,
        arrivalTurn,
      );
      poseWalk(captain, progress.carry, 4.2);
      captain.joints.chest.rotation.z =
        -0.045 * Math.sin(progress.carry * Math.PI);
      captain.anchors.trophyCarrier.position.y +=
        Math.sin(progress.carry * Math.PI * 8) * 0.022;
      return;
    }

    const joinSettle = smoothUnit((progress.join - 0.72) / 0.28);
    const joinStrideWeight = 1 - joinSettle;

    captain.root.position.x = lerp(
      STAGE_LAYOUT.captainPodiumApproachX,
      STAGE_LAYOUT.captainFinalX,
      progress.join,
    );
    captain.root.position.z = lerp(
      STAGE_LAYOUT.captainPodiumApproachZ,
      STAGE_LAYOUT.captainFinalZ,
      progress.join,
    );
    if (progress.join < 1) poseWalk(captain, progress.join, 4.9, joinStrideWeight);
    captain.root.rotation.y = interpolateYaw(
      CAPTAIN_JOIN_YAW,
      CAPTAIN_TROPHY_YAW,
      captainFrontTurn(progress),
    );
    const joinedCarryHeight = lerp(
      GROUND_TROPHY_CARRY_HEIGHT,
      STAGE_HEIGHTS.trophyCarry,
      progress.join,
    );
    const anticipation = progress.teamAnticipation * (1 - progress.lift);
    const liftHero = smoothUnit((progress.lift - 0.84) / 0.16);
    const liftHeightBonus = progress.lift * 0.16;
    captain.anchors.trophyCarrier.position.set(
      0,
      lerp(joinedCarryHeight, captainLiftTarget, progress.lift) -
        baseHeight +
        liftHeightBonus +
        (progress.join < 1
          ? Math.sin(progress.join * Math.PI * 10) * 0.018 * joinStrideWeight
          : 0),
      lerp(0.5 - anticipation * 0.06, 0.34, progress.lift),
    );
    captain.joints.chest.rotation.x =
      captain.joints.chest.rotation.x - anticipation * 0.035 + liftHero * 0.022;
    captain.joints.head.rotation.x =
      -anticipation * 0.045 + 0.04 * progress.lift + liftHero * 0.018;
  }

  function updateTeam(timeSeconds, progress) {
    teamGroup.visible = Boolean(progress.teamVisible);
    teamGroup.position.x = STAGE_LAYOUT.podiumX;
    teamGroup.position.y = STAGE_HEIGHTS.ground;
    teamGroup.position.z = lerp(
      STAGE_LAYOUT.podiumZ + STAGE_LAYOUT.teamZ - 1.15,
      STAGE_LAYOUT.podiumZ + STAGE_LAYOUT.teamZ,
      progress.captainTravel,
    );
    const jump = progress.jump * STAGE_HEIGHTS.teamJump;
    const frontTurn = captainFrontTurn(progress);
    const anticipation = progress.teamAnticipation * (1 - progress.lift);

    captain.root.position.y = captainBaseHeight(progress) + jump;

    for (let index = 0; index < teammates.length; index++) {
      const rig = teammates[index];
      const jumpVariation = 0.9 + index * 0.02;
      rig.root.position.y = STAGE_HEIGHTS.teammatePodiumTop + jump * jumpVariation;
      const teammateWorldX = teamGroup.position.x + rig.root.position.x;
      const teammateWorldZ = teamGroup.position.z + rig.root.position.z;
      const watchYaw = clamp(
        headingYaw(
          teammateWorldX,
          teammateWorldZ,
          captain.root.position.x,
          captain.root.position.z,
        ),
        -1.08,
        1.08,
      );
      rig.root.rotation.y = interpolateYaw(watchYaw, 0, frontTurn);
      const idle = Math.sin(timeSeconds * (1.45 + index * 0.04) + index * 0.9) *
        0.035 * progress.carry * frontTurn;
      rig.joints.chest.rotation.z += idle;
      rig.joints.head.rotation.y += idle * 1.6;
      poseTeammateAnticipation(rig, index, anticipation, timeSeconds);
      poseTeammateCelebrate(
        rig,
        index,
        clamp(progress.lift + progress.payoff, 0, 1),
      );
    }
  }

  function alignNegativeYToWorldDirection(bone, direction) {
    bone.parent.getWorldQuaternion(parentWorldQuaternion).invert();
    localBoneDirection.copy(direction).applyQuaternion(parentWorldQuaternion).normalize();
    bone.quaternion.setFromUnitVectors(negativeY, localBoneDirection);
  }

  function solveArmToTarget(arm, target) {
    arm.shoulder.getWorldPosition(shoulderWorld);
    targetDirection.subVectors(target, shoulderWorld);
    const upperLength = captain.metrics.upperArmLength;
    const lowerLength = captain.metrics.forearmLength;
    const minimumReach = Math.abs(upperLength - lowerLength) + 0.001;
    const maximumReach = upperLength + lowerLength - 0.001;
    const distance = clamp(targetDirection.length(), minimumReach, maximumReach);
    targetDirection.normalize();

    poleDirection.set(arm.side * 0.72, -0.1, 0.38);
    poleDirection.addScaledVector(
      targetDirection,
      -poleDirection.dot(targetDirection),
    );
    if (poleDirection.lengthSq() < 0.0001) {
      poleDirection.set(arm.side, 0, 0);
    }
    poleDirection.normalize();

    const along =
      (upperLength * upperLength - lowerLength * lowerLength + distance * distance) /
      (2 * distance);
    const outward = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
    elbowTarget
      .copy(shoulderWorld)
      .addScaledVector(targetDirection, along)
      .addScaledVector(poleDirection, outward);
    boneDirection.subVectors(elbowTarget, shoulderWorld).normalize();
    alignNegativeYToWorldDirection(arm.shoulder, boneDirection);
    arm.elbow.getWorldPosition(elbowWorld);
    boneDirection.subVectors(target, elbowWorld).normalize();
    alignNegativeYToWorldDirection(arm.elbow, boneDirection);
    arm.hand.rotation.set(-0.18, arm.side * 0.2, arm.side * 0.12);
  }

  function updateTrophy(progress) {
    setMaterialOpacity(trophyMaterials, progress.trophyCrossfade);
    if (progress.trophyHandoff <= 0) return;
    captain.anchors.trophyCarrier.getWorldPosition(trophyCarrierPosition);
    captain.anchors.trophyCarrier.getWorldQuaternion(trophyCarrierQuaternion);
    trophy.root.position.lerpVectors(
      trophyRestPosition,
      trophyCarrierPosition,
      progress.trophyHandoff,
    );
    trophy.root.quaternion.slerpQuaternions(
      trophyRestQuaternion,
      trophyCarrierQuaternion,
      progress.trophyHandoff,
    );
    trophy.root.scale.setScalar(TROPHY_SCENE_SCALE);
  }

  function updateCaptainGrip(progress) {
    const grip = progress.grip;
    if (grip <= 0) return;
    trophy.anchors.leftGrip.getWorldPosition(leftGripWorld);
    trophy.anchors.rightGrip.getWorldPosition(rightGripWorld);
    trophy.anchors.bottom.getWorldPosition(trophyBottomWorld);
    trophy.root.getWorldQuaternion(trophyWorldQuaternion);
    trophyGripAxisX.set(1, 0, 0).applyQuaternion(trophyWorldQuaternion);
    trophyGripAxisY.set(0, 1, 0).applyQuaternion(trophyWorldQuaternion);
    trophyGripAxisZ.set(0, 0, 1).applyQuaternion(trophyWorldQuaternion);
    trophyBaseLeftWorld
      .copy(trophyBottomWorld)
      .addScaledVector(trophyGripAxisX, -TROPHY_BASE_GRIP_SPAN)
      .addScaledVector(trophyGripAxisY, TROPHY_BASE_GRIP_RISE)
      .addScaledVector(trophyGripAxisZ, TROPHY_BASE_GRIP_FORWARD);
    trophyBaseRightWorld
      .copy(trophyBottomWorld)
      .addScaledVector(trophyGripAxisX, TROPHY_BASE_GRIP_SPAN)
      .addScaledVector(trophyGripAxisY, TROPHY_BASE_GRIP_RISE)
      .addScaledVector(trophyGripAxisZ, TROPHY_BASE_GRIP_FORWARD);
    captain.anchors.leftHand.getWorldPosition(leftHandWorld);
    captain.anchors.rightHand.getWorldPosition(rightHandWorld);
    const straightHandleMatch =
      leftHandWorld.distanceToSquared(leftGripWorld) +
      rightHandWorld.distanceToSquared(rightGripWorld);
    const crossedHandleMatch =
      leftHandWorld.distanceToSquared(rightGripWorld) +
      rightHandWorld.distanceToSquared(leftGripWorld);
    if (crossedHandleMatch < straightHandleMatch) {
      leftHandleTargetWorld.copy(rightGripWorld);
      rightHandleTargetWorld.copy(leftGripWorld);
    } else {
      leftHandleTargetWorld.copy(leftGripWorld);
      rightHandleTargetWorld.copy(rightGripWorld);
    }

    const straightBaseMatch =
      leftHandWorld.distanceToSquared(trophyBaseLeftWorld) +
      rightHandWorld.distanceToSquared(trophyBaseRightWorld);
    const crossedBaseMatch =
      leftHandWorld.distanceToSquared(trophyBaseRightWorld) +
      rightHandWorld.distanceToSquared(trophyBaseLeftWorld);
    if (crossedBaseMatch < straightBaseMatch) {
      leftBaseTargetWorld.copy(trophyBaseRightWorld);
      rightBaseTargetWorld.copy(trophyBaseLeftWorld);
    } else {
      leftBaseTargetWorld.copy(trophyBaseLeftWorld);
      rightBaseTargetWorld.copy(trophyBaseRightWorld);
    }

    const liftHoldBlend = smoothUnit(progress.lift / 0.14);
    leftTargetWorld.lerpVectors(leftHandleTargetWorld, leftBaseTargetWorld, liftHoldBlend);
    rightTargetWorld.lerpVectors(rightHandleTargetWorld, rightBaseTargetWorld, liftHoldBlend);
    leftHandWorld.lerp(leftTargetWorld, grip);
    rightHandWorld.lerp(rightTargetWorld, grip);
    captain.setHandGrip(progress.handClose);
    solveArmToTarget(captain.arms.left, leftHandWorld);
    solveArmToTarget(captain.arms.right, rightHandWorld);
  }

  function updatePlinth(progress) {
    const dismiss = progress.plinthDismiss;
    plinth.root.position.y =
      lerp(-1.25, STAGE_HEIGHTS.ground, progress.plinthReveal) -
      dismiss * 0.48;
    plinth.root.scale.set(
      lerp(1, 0.9, dismiss),
      lerp(1, 0.58, dismiss),
      lerp(1, 0.9, dismiss),
    );
    setMaterialOpacity(Object.values(plinth.materials), 1 - dismiss);
    plinth.root.visible = dismiss < 0.999;
  }

  function renderFrame(timeSeconds) {
    if (destroyed || contextLost || signal?.aborted) return;
    const time = clamp(Number.isFinite(timeSeconds) ? timeSeconds : 0, 0, 30);
    const progress = celebrationProgressAt(time);
    resetRigs();
    updateOpening(progress);
    updateCaptain(progress);
    updateTeam(time, progress);
    updateTrophy(progress);
    updatePlinth(progress);
    applyCamera(time, progress);
    effects.update(time, progress);
    updateCaptainGrip(progress);
    stadium.banner.material.emissiveIntensity =
      0.12 + progress.opening * 0.16 + progress.lighting * 0.42;
    renderer.render(scene, camera);
  }

  function resize({ width: nextWidth, height: nextHeight, devicePixelRatio }) {
    if (destroyed || contextLost || nextWidth < 2 || nextHeight < 2) return;
    width = nextWidth;
    height = nextHeight;
    profile = width <= 600 ? "phone" : "desktop";
    camera.aspect = width / height;
    projectionDirty = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CELEBRATION_DPR_LIMIT));
    renderer.setSize(width, height, false);
    effects.setProfile(profile);
    applyProfileComposition();
    applyCamera(0, celebrationProgressAt(0));
  }

  function projectAnchor(name) {
    if (name === "trophy" || name === "trophy-rest") {
      if (name === "trophy-rest") {
        projectedTop
          .set(
            trophyRestPosition.x,
            trophyRestPosition.y + TROPHY_TOP_Y * TROPHY_SCENE_SCALE,
            trophyRestPosition.z,
          )
          .project(camera);
        projectedBottom
          .set(
            trophyRestPosition.x,
            trophyRestPosition.y + TROPHY_BOTTOM_Y * TROPHY_SCENE_SCALE,
            trophyRestPosition.z,
          )
          .project(camera);
        projected.copy(trophyRestPosition).project(camera);
      } else {
        trophy.root.updateMatrixWorld(true);
        trophy.anchors.top.getWorldPosition(worldPosition);
        projectedTop.copy(worldPosition).project(camera);
        trophy.anchors.bottom.getWorldPosition(worldPosition);
        projectedBottom.copy(worldPosition).project(camera);
        trophy.root.getWorldPosition(worldPosition);
        projected.copy(worldPosition).project(camera);
      }
      const topY = (-projectedTop.y * 0.5 + 0.5) * height;
      const bottomY = (-projectedBottom.y * 0.5 + 0.5) * height;
      return {
        x: (projected.x * 0.5 + 0.5) * width,
        y: (topY + bottomY) / 2,
        height: Math.abs(bottomY - topY),
      };
    }
    const anchor = plinthAnchor;
    anchor.getWorldPosition(worldPosition);
    projected.copy(worldPosition).project(camera);
    return {
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
      scale: clamp(1.2 / Math.max(0.35, camera.position.distanceTo(worldPosition)), 0.08, 1),
    };
  }

  function handleContextLoss(event) {
    event.preventDefault();
    if (contextLost || destroyed) return;
    contextLost = true;
    onContextLoss?.(new Error("Champion celebration WebGL context was lost."));
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    canvas.removeEventListener("webglcontextlost", handleContextLoss);
    effects?.destroy();
    stadium.dispose();
    podium.dispose();
    plinth.dispose();
    captain.dispose();
    for (const rig of teammates) rig.dispose();
    trophy.dispose();
    for (const geometry of ownedGeometries) geometry.dispose();
    for (const material of ownedMaterials) material.dispose();
    for (const texture of ownedTextures) texture.dispose();
    renderer?.dispose();
    scene.clear();
    effects = renderer = null;
  }

  canvas.addEventListener("webglcontextlost", handleContextLoss);
  renderFrame(0);
  return {
    resize,
    renderFrame,
    projectAnchor,
    destroy,
  };
}
