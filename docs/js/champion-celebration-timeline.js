export const CELEBRATION_DURATION = 30;
export const CURTAIN_DURATION = 3.2;
export const TROPHY_GRAB_TIME = 8.42;
export const TROPHY_CROSSFADE_START = 7.92;
export const TROPHY_CROSSFADE_END = 8.32;
export const TROPHY_SCENE_SCALE = 0.28;

export const CELEBRATION_TIMING = Object.freeze({
  openingStart: 0,
  openingEnd: CURTAIN_DURATION,
  clearedHoldEnd: 3.4,
  captainEntryStart: 3.4,
  captainWalkStart: 2.2,
  captainEntryEnd: 4.8,
  trophyApproachStart: 4.8,
  trophyApproachEnd: 6.9,
  trophyGrabStart: 6.9,
  trophyGrabEnd: 9,
  carryStart: 9,
  carryEnd: 12,
  joinStart: 12,
  joinEnd: 15.6,
  teamSettleStart: 15.6,
  teamSettleEnd: 18.2,
  liftStart: 18.2,
  liftEnd: 21,
  payoffStart: 21,
  payoffEnd: 23.2,
  holdStart: 23.2,
  holdEnd: 28.2,
  restoreStart: 28.2,
  restoreEnd: CELEBRATION_DURATION,
  stadiumRevealStart: 0.18,
  stadiumRevealEnd: 3.05,
  plinthRevealStart: 0.08,
  plinthRevealEnd: 2.72,
  trophySettleStart: 0.12,
  trophySettleEnd: 3,
  crowdHypeStart: 3.85,
  crowdHypeEnd: 6.75,
  trophyReachStart: 6.65,
  trophyReachEnd: 8.02,
  handCloseStart: 7.62,
  handCloseEnd: 8.25,
  trophyHandoffEnd: 8.82,
  plinthDismissStart: 8.5,
  plinthDismissEnd: 9.48,
  captainFrontStart: 15.6,
  captainFrontEnd: 16.4,
  teamAnticipationStart: 16.4,
  teamAnticipationEnd: 18,
  trophyLiftEnd: 19.8,
  jumpStart: 18.35,
  jumpEnd: 20.75,
  flaresStart: 18.28,
  flaresEnd: CELEBRATION_DURATION,
  flagStart: 19.2,
  flagEnd: 20,
  crowdPeakStart: 18.3,
  crowdPeakEnd: 20.6,
  lightingStart: 18.2,
  lightingEnd: 20.4,
  flashStart: 18.5,
  flashEnd: 22.1,
  confettiStart: 18.4,
  confettiEnd: 24.6,
});

export const CELEBRATION_PHASES = Object.freeze([
  { id: "opening", start: CELEBRATION_TIMING.openingStart, end: CELEBRATION_TIMING.openingEnd },
  {
    id: "cleared-hold",
    start: CELEBRATION_TIMING.openingEnd,
    end: CELEBRATION_TIMING.clearedHoldEnd,
  },
  {
    id: "captain-entry",
    start: CELEBRATION_TIMING.captainEntryStart,
    end: CELEBRATION_TIMING.captainEntryEnd,
  },
  {
    id: "trophy-approach",
    start: CELEBRATION_TIMING.trophyApproachStart,
    end: CELEBRATION_TIMING.trophyApproachEnd,
  },
  {
    id: "trophy-grab",
    start: CELEBRATION_TIMING.trophyGrabStart,
    end: CELEBRATION_TIMING.trophyGrabEnd,
  },
  {
    id: "carry-reveal",
    start: CELEBRATION_TIMING.carryStart,
    end: CELEBRATION_TIMING.carryEnd,
  },
  {
    id: "captain-joins",
    start: CELEBRATION_TIMING.joinStart,
    end: CELEBRATION_TIMING.joinEnd,
  },
  {
    id: "team-settle",
    start: CELEBRATION_TIMING.teamSettleStart,
    end: CELEBRATION_TIMING.teamSettleEnd,
  },
  {
    id: "lift-jump",
    start: CELEBRATION_TIMING.liftStart,
    end: CELEBRATION_TIMING.liftEnd,
  },
  {
    id: "payoff-build",
    start: CELEBRATION_TIMING.payoffStart,
    end: CELEBRATION_TIMING.payoffEnd,
  },
  {
    id: "champion-hold",
    start: CELEBRATION_TIMING.holdStart,
    end: CELEBRATION_TIMING.holdEnd,
  },
  {
    id: "restore",
    start: CELEBRATION_TIMING.restoreStart,
    end: CELEBRATION_TIMING.restoreEnd,
  },
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function ease(value, easing) {
  if (easing === "linear") return value;
  if (easing === "in") return value * value;
  if (easing === "out") return 1 - (1 - value) * (1 - value);
  if (easing === "sine") return 0.5 - Math.cos(value * Math.PI) / 2;
  return value * value * (3 - 2 * value);
}

export function segmentProgress(timeSeconds, start, end, easing = "smooth") {
  if (!Number.isFinite(timeSeconds) || end <= start) return 0;
  return ease(clamp((timeSeconds - start) / (end - start), 0, 1), easing);
}

export function headingYaw(fromX, fromZ, toX, toZ) {
  const values = [fromX, fromZ, toX, toZ];
  if (values.some(value => !Number.isFinite(value))) {
    throw new TypeError("Heading calculations require finite stage coordinates.");
  }
  return Math.atan2(toX - fromX, toZ - fromZ);
}

export function interpolateYaw(start, end, amount) {
  if (![start, end, amount].every(value => Number.isFinite(value))) {
    throw new TypeError("Yaw interpolation requires finite angles and progress.");
  }
  const progress = clamp(amount, 0, 1);
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * progress;
}

function pulseEnvelope(timeSeconds, start, end) {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= start || timeSeconds >= end) return 0;
  return Math.sin(segmentProgress(timeSeconds, start, end, "linear") * Math.PI);
}

export function synchronizedJumpEnvelope(timeSeconds) {
  return pulseEnvelope(
    timeSeconds,
    CELEBRATION_TIMING.jumpStart,
    CELEBRATION_TIMING.jumpEnd,
  );
}

const TROPHY_GRIP_X = 0.34;
const TROPHY_GRIP_Y = -1.38;
const TROPHY_GRIP_Z = 0.08;
const TROPHY_LIFT_CARRIER_Z = 0.18;
const REACH_MARGIN = 0.06;

function requireReachInputs(metrics, stageHeights, trophyScale) {
  const values = [
    metrics?.shoulderHeight,
    metrics?.shoulderOffset,
    metrics?.upperArmLength,
    metrics?.forearmLength,
    stageHeights?.captainPodiumTop,
    stageHeights?.trophyLift,
    trophyScale,
  ];
  if (values.some(value => !Number.isFinite(value))) {
    throw new TypeError("Reach calculations require finite rig, stage, and trophy metrics.");
  }
}

export function reachableLiftTarget(metrics, stageHeights, trophyScale) {
  requireReachInputs(metrics, stageHeights, trophyScale);
  const maximumReach = metrics.upperArmLength + metrics.forearmLength - REACH_MARGIN;
  const horizontalDistance = Math.abs(
    metrics.shoulderOffset - TROPHY_GRIP_X * trophyScale,
  );
  const depthDistance = TROPHY_LIFT_CARRIER_Z + TROPHY_GRIP_Z * trophyScale;
  const verticalReachSquared =
    maximumReach * maximumReach -
    horizontalDistance * horizontalDistance -
    depthDistance * depthDistance;
  if (verticalReachSquared <= 0) {
    throw new RangeError("The configured trophy grip cannot be reached by the player rig.");
  }
  const shoulderY = stageHeights.captainPodiumTop + metrics.shoulderHeight;
  const reachableRootY =
    shoulderY + Math.sqrt(verticalReachSquared) - TROPHY_GRIP_Y * trophyScale;
  return Math.min(stageHeights.trophyLift, reachableRootY);
}

export function shoulderToGripDistanceAtLift(metrics, stageHeights, trophyScale) {
  requireReachInputs(metrics, stageHeights, trophyScale);
  const trophyRootY = reachableLiftTarget(metrics, stageHeights, trophyScale);
  const shoulderY = stageHeights.captainPodiumTop + metrics.shoulderHeight;
  const horizontalDistance = Math.abs(
    metrics.shoulderOffset - TROPHY_GRIP_X * trophyScale,
  );
  const verticalDistance = trophyRootY + TROPHY_GRIP_Y * trophyScale - shoulderY;
  const depthDistance = TROPHY_LIFT_CARRIER_Z + TROPHY_GRIP_Z * trophyScale;
  return Math.hypot(horizontalDistance, verticalDistance, depthDistance);
}

export function phaseAt(timeSeconds) {
  const time = Number(timeSeconds);
  if (!Number.isFinite(time) || time < 0) return CELEBRATION_PHASES[0];
  return CELEBRATION_PHASES.find(phase => time >= phase.start && time < phase.end) || {
    id: "finished",
    start: CELEBRATION_DURATION,
    end: CELEBRATION_DURATION,
  };
}

export function celebrationProgressAt(timeSeconds) {
  return {
    opening: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.openingStart,
      CELEBRATION_TIMING.openingEnd,
    ),
    stadiumReveal: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.stadiumRevealStart,
      CELEBRATION_TIMING.stadiumRevealEnd,
      "sine",
    ),
    plinthReveal: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.plinthRevealStart,
      CELEBRATION_TIMING.plinthRevealEnd,
    ),
    trophySettle: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.trophySettleStart,
      CELEBRATION_TIMING.trophySettleEnd,
    ),
    captainVisible: timeSeconds >= CELEBRATION_TIMING.captainWalkStart ? 1 : 0,
    captainEntry: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.captainWalkStart,
      CELEBRATION_TIMING.captainEntryEnd,
    ),
    approach: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.trophyApproachStart,
      CELEBRATION_TIMING.trophyApproachEnd,
    ),
    crowdHype: pulseEnvelope(
      timeSeconds,
      CELEBRATION_TIMING.crowdHypeStart,
      CELEBRATION_TIMING.crowdHypeEnd,
    ),
    grab: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.trophyGrabStart,
      CELEBRATION_TIMING.trophyGrabEnd,
    ),
    grip: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.trophyReachStart,
      CELEBRATION_TIMING.trophyReachEnd,
      "sine",
    ),
    handClose: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.handCloseStart,
      CELEBRATION_TIMING.handCloseEnd,
      "sine",
    ),
    trophyCrossfade: segmentProgress(
      timeSeconds,
      TROPHY_CROSSFADE_START,
      TROPHY_CROSSFADE_END,
    ),
    trophyHandoff: segmentProgress(
      timeSeconds,
      TROPHY_GRAB_TIME,
      CELEBRATION_TIMING.trophyHandoffEnd,
    ),
    plinthDismiss: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.plinthDismissStart,
      CELEBRATION_TIMING.plinthDismissEnd,
    ),
    teamVisible: timeSeconds >= CELEBRATION_TIMING.carryStart ? 1 : 0,
    carry: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.carryStart,
      CELEBRATION_TIMING.carryEnd,
      "linear",
    ),
    join: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.joinStart,
      CELEBRATION_TIMING.joinEnd,
      "linear",
    ),
    captainTravel: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.carryStart,
      CELEBRATION_TIMING.joinEnd,
      "linear",
    ),
    teamSettle: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.teamSettleStart,
      CELEBRATION_TIMING.teamSettleEnd,
      "sine",
    ),
    captainFront: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.captainFrontStart,
      CELEBRATION_TIMING.captainFrontEnd,
      "sine",
    ),
    teamAnticipation: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.teamAnticipationStart,
      CELEBRATION_TIMING.teamAnticipationEnd,
      "sine",
    ),
    lift: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.liftStart,
      CELEBRATION_TIMING.trophyLiftEnd,
    ),
    jump: synchronizedJumpEnvelope(timeSeconds),
    flares:
      timeSeconds >= CELEBRATION_TIMING.flaresStart &&
      timeSeconds < CELEBRATION_TIMING.flaresEnd
        ? 1
        : 0,
    flareElapsed: Math.max(0, timeSeconds - CELEBRATION_TIMING.flaresStart),
    payoff: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.payoffStart,
      CELEBRATION_TIMING.payoffEnd,
    ),
    flag: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.flagStart,
      CELEBRATION_TIMING.flagEnd,
    ),
    crowdPeak: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.crowdPeakStart,
      CELEBRATION_TIMING.crowdPeakEnd,
    ),
    lighting: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.lightingStart,
      CELEBRATION_TIMING.lightingEnd,
    ),
    flashes: pulseEnvelope(
      timeSeconds,
      CELEBRATION_TIMING.flashStart,
      CELEBRATION_TIMING.flashEnd,
    ),
    confetti: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.confettiStart,
      CELEBRATION_TIMING.confettiEnd,
    ),
    confettiElapsed: Math.max(0, timeSeconds - CELEBRATION_TIMING.confettiStart),
    finalHold: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.holdStart,
      CELEBRATION_TIMING.holdEnd,
      "linear",
    ),
    restore: segmentProgress(
      timeSeconds,
      CELEBRATION_TIMING.restoreStart,
      CELEBRATION_TIMING.restoreEnd,
    ),
  };
}

export function createCelebrationClock({
  duration = CELEBRATION_DURATION,
  maxDeltaSeconds = 0.1,
} = {}) {
  let time = 0;
  let lastNow = null;
  let running = false;
  let paused = false;
  let stopped = false;

  function start(now, at = 0) {
    time = clamp(Number.isFinite(at) ? at : 0, 0, duration);
    lastNow = Number.isFinite(now) ? now : null;
    running = time < duration;
    paused = false;
    stopped = false;
    return time;
  }

  function tick(now) {
    if (!running || paused || stopped || !Number.isFinite(now)) return time;
    if (lastNow === null || now < lastNow) {
      lastNow = now;
      return time;
    }
    const delta = Math.min(Math.max((now - lastNow) / 1000, 0), maxDeltaSeconds);
    lastNow = now;
    time = Math.min(duration, time + delta);
    if (time >= duration) running = false;
    return time;
  }

  function pause(now) {
    if (!running || paused || stopped) return time;
    tick(now);
    paused = true;
    lastNow = null;
    return time;
  }

  function resume(now) {
    if (stopped || time >= duration) return time;
    paused = false;
    running = true;
    lastNow = Number.isFinite(now) ? now : null;
    return time;
  }

  function value() {
    return time;
  }

  function stop() {
    stopped = true;
    running = false;
    paused = false;
    lastNow = null;
    return time;
  }

  return {
    start,
    tick,
    pause,
    resume,
    value,
    stop,
  };
}
