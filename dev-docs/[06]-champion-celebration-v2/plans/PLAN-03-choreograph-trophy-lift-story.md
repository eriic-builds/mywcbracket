# PLAN 03: Choreograph the Trophy Lift story

**Rank: 3 of 4. Leverage: 9.6/10. Run after Plan 02.**

**Execution status: complete. Final evidence is recorded in `../RESULTS.md`.**

**Post-execution revision:** the July 12 user review supersedes the original front-locked walk and
partial trophy-pump beat. The current contract uses path-facing travel, one crowd-hype fist,
teammate gaze, route-distance pacing, zero preliminary hops, one full lift/jump, and synchronized
flare/confetti payoff. The final fidelity pass fills the pre-lift hold with six planted anticipation
poses and starts the effect burst during the `21.2-22.55s` trophy rise. The final carry revision starts
captain travel at `2.2s` behind the fading bracket and rotates the scene-space trophy from the captain
carrier's world quaternion before reading grips and solving both arms.

**Council call:** Sean Grove makes the storyboard's story anchors executable, then the pacing review
shifts the pre-restore story `0.8s` earlier without changing duration or curtain ownership.
Willison/Hamel require boundary tests and key-frame evidence. Russinovich preserves the allocation-free
render path and existing logical clock.

## Goal

Connect Plan 02's approved static key poses into one deterministic 30-second story:

1. preserve the bracket cascade and trophy-to-left-plinth opening;
2. captain appears at `2.2s` behind the fading bracket and enters from screen-left;
3. captain walks side-on, raises one crowd-hype fist, turns toward the trophy, and reaches it near
   `7.2s`;
4. both hands acquire named grips and the plinth disappears;
5. captain carries right with path-facing body rotation while the trophy inherits the carrier's world
   orientation and the frontal camera translates right;
6. teammates reveal as the destination and watch the captain;
7. captain climbs the left steps and walks sideways to center at the same route speed, joining near
   `17.2s`;
8. captain and teammates turn front together, hold the trophy steady, and build through varied planted
   upper-body anticipation with no fake jumps;
9. one reachable full lift and one synchronized jump occur from `21.2-24.2s`;
10. flares, confetti, crowd, light, flag, and flashes build during the lift and continue through payoff;
11. tableau holds and bracket restores exactly.

## Observation

V1's scene is already a pure function of logical time and already orders body movement, trophy
placement, grip reads, arm solves, effects, and rendering correctly. The choreography needs new
positions and phase windows, not a new animation system.

## Evidence

- `CELEBRATION_PHASES` and `celebrationProgressAt()` own current timing.
- `createCelebrationClock()` already pauses hidden time and caps visible gaps.
- `updateTrophy()` keeps the trophy in scene space and follows `trophyCarrier`.
- `updateCaptainGrip()` reads named trophy grips after trophy position and orientation are updated.
- `renderFrame()` currently calls body/team updates before trophy placement and arm solving.
- The controller and mock duplicate trophy crossfade timing with literals that can drift.
- Root rotation is reset to front every frame, making lateral travel read as an unnatural shuffle.

## Reasoning

The safest implementation is to preserve the clock and frame order, centralize all new timing
constants, and interpolate between Plan 02's reviewed key poses. Travel headings should own captain
root yaw; camera-facing posture returns only for trophy contact and the final tableau.

## Decision

- Keep 12 named phases and total duration 30 seconds.
- Keep opening and restore boundaries unchanged.
- Preserve the storyboard sequence while using the approved `7.2/17.2/24.2s` pacing anchors.
- Export trophy crossfade constants so production, scene, and mock cannot drift.
- Derive carried trophy orientation from `trophyCarrier.getWorldQuaternion()` and interpolate from the
  plinth rest quaternion during handoff.
- Keep the camera rotation frontal by tracking position and target X together.
- Allocate carry and podium-walk time in proportion to route distance, with linear positional progress
  and walk cycles that end neutral at the waypoint.
- Use no preliminary hop or fake-jump windows.
- Keep one shared full-jump envelope with small bounded per-player amplitude variation.
- Export pure heading/interpolation helpers so natural travel is covered by numeric tests.
- Derive the lift from stage height and captain scale; add a shortest-captain reach test.

## Tradeoffs

- The longer carry and later lift shorten the final hold.
- Path-facing travel briefly shows side/back views, but the camera itself remains frontal and the final
  front turn becomes more readable.
- Replacing preliminary hops with compact fist/ready gestures keeps the team active while protecting the
  single lift jump as the only vertical celebration accent.

## Exact files to touch

- `docs/js/champion-celebration-timeline.js`
  - phase table;
  - trophy grab/crossfade constants;
  - progress windows;
  - pure heading interpolation and continuous captain-travel progress;
  - pure shortest-captain lift/reach helpers shared by production and tests.
- `docs/js/champion-celebration.js`
  - import shared trophy crossfade constants only;
  - replace crossfade literals;
  - do not alter curtain construction or lifecycle.
- `docs/js/champion-celebration-scene.js`
  - captain base height and left-to-right path;
  - side-on crowd-hype fist and trophy approach;
  - grab/carry/join carrier positions;
  - preallocated rest/carrier quaternions and carrier-driven trophy orientation;
  - teammate reveal;
  - teammate gaze, front-facing settle, and planted anticipation poses;
  - lift/jump/flare envelope;
  - plinth dismissal;
  - camera track timing;
  - reachable lift derivation.
- `docs/js/champion-celebration-effects.js`
  - flag, flashes, crowd, lighting, confetti, and secondary-motion timing.
- `dev-docs/[00]-dev-reports/[05]-champion-celebration/mock.js`
  - import shared crossfade constants;
  - phase labels;
  - remove duplicated handoff timing literals.
- `dev-docs/[00]-dev-reports/[05]-champion-celebration/index.html`
  - review language for side-on entry, constant-speed watched carry, single jump, and final podium.
- `tests/champion-celebration.mjs`
  - new exact phase boundaries;
  - shared crossfade constants;
  - left/right path guards;
  - route-speed parity and zero preliminary hops;
  - one jump;
  - shortest-captain reach proof;
  - preserved carrier/IK/frame order, rotated grip sampling, and backward-scrub quaternion reset.
- `tests/animation-performance.mjs`
  - only if frame-source names change.

Do not modify trigger, connector drawing, dashboard rendering, fixtures, one-canvas lifecycle, logical
clock internals, reduced-motion branch, context-loss fallback, or vendor code.

## Timeline interface

`champion-celebration-timeline.js` must expose:

```js
export const CELEBRATION_DURATION = 30;
export const CURTAIN_DURATION = 3.2;
export const TROPHY_GRAB_TIME = 8.42;
export const TROPHY_CROSSFADE_START = 7.92;
export const TROPHY_CROSSFADE_END = 8.32;
export function headingYaw(fromX, fromZ, toX, toZ) {}
export function interpolateYaw(start, end, amount) {}
export function reachableLiftTarget(metrics, stageHeights) {}
export function shoulderToGripDistanceAtLift(metrics, stageHeights, trophyScale) {}

export const CELEBRATION_PHASES = Object.freeze([
  { id: "opening", start: 0, end: 3.2 },
  { id: "cleared-hold", start: 3.2, end: 3.4 },
  { id: "captain-entry", start: 3.4, end: 5.0 },
  { id: "trophy-approach", start: 5.0, end: 7.2 },
  { id: "trophy-grab", start: 7.2, end: 9.2 },
  { id: "carry-reveal", start: 9.2, end: 12.9 },
  { id: "captain-joins", start: 12.9, end: 17.2 },
  { id: "team-settle", start: 17.2, end: 21.2 },
  { id: "lift-jump", start: 21.2, end: 24.2 },
  { id: "payoff-build", start: 24.2, end: 26.2 },
  { id: "champion-hold", start: 26.2, end: 28.5 },
  { id: "restore", start: 28.5, end: 30.0 },
]);
```

## Step-by-step implementation order

1. Update the phase table and tests first. Confirm every phase owns `start <= time < end` and
   `phaseAt(30)` remains `finished`.
2. Export shared grab/crossfade constants. Import them in:
   - scene trophy opacity/handoff;
   - production DOM trophy ghost;
   - review mock trophy morph.
   Use the authoritative `7.92`, `8.32`, and `8.42` values; remove old duplicated handoff literals.
3. Update `celebrationProgressAt()`:
   - captain visible/walking from `2.2s`, even while `phaseAt()` still reports opening;
   - captain entry phase `3.4-5.0`;
   - approach `5.0-7.2`;
   - grab `7.2-9.2`;
   - carry `9.2-12.9`;
   - join `12.9-17.2`;
   - steady trophy/front-facing team settle plus planted upper-body anticipation `17.2-21.2`;
   - lift `21.2-24.2`;
   - lift-synchronized flare/confetti/crowd/light/flag/flash values from `21.2`;
   - final hold `26.2-28.5`;
   - restore unchanged.
4. Remove anonymous beat-time ownership from runtime update functions:
   - `updateCaptain`, `updateTeam`, `updateTrophy`, `updateCaptainGrip`, `updatePlinth`,
     `updateOpening`, camera updates, and effect windows must consume progress values, pure envelope
     helpers, or named exported constants;
   - no stale V1 beat seconds such as `6.2`, `8.25`, `9.6`, `14.2`, `15.4`, `17.7`, `19.9`,
     `8.62`, `9.07`, `9.35`, or literal focal X `0` may remain inside those update functions;
   - add a source guard so changing the phase table cannot silently leave old scene windows active.
5. Captain entry overlap and phase `2.2-5.0`:
   - start off-screen left at `STAGE_LAYOUT.captainEntryX`;
   - make the rig visible and begin travel at `2.2s` behind the fading bracket;
   - do not shorten, bypass, or rebuild the protected `0-3.2s` curtain;
   - walk side-on along the named approach path toward the left plinth;
   - derive root yaw from travel direction;
   - use leg cadence and a small body lean to support the path;
   - begin one closed-fist crowd-hype gesture without moving the trophy.
6. Trophy approach `5.0-7.2`:
   - settle behind the plinth at the approved Z separation;
   - finish the crowd-hype fist, then rotate root/head/chest toward the trophy;
   - end continuously in the first grab pose;
   - trophy stays on the plinth.
7. Grab `7.2-9.2`:
   - crouch and lean into the hand reach before the visual crossfade;
   - close all three fingers and thumb around the two named grips;
   - begin 3D trophy opacity only under the hands;
   - at `TROPHY_GRAB_TIME`, interpolate trophy root from rest to the captain carrier;
   - dismiss the empty square plinth only after the trophy has begun leaving it.
8. Carry `9.2-12.9`:
   - interpolate captain from the left plinth to the podium's left-step approach;
   - use linear position progress so the segment does not ease in, lag, and then rush;
   - keep chest-height trophy carrier stable;
   - read the carrier's world position and quaternion, apply both to the trophy, and only then sample the
     named grip anchors;
   - use walking legs while IK owns both arms;
   - move camera X and target X together using one continuous `9.2-17.2` captain-travel progress;
   - reveal teammates on the right platform and rotate them to watch the captain;
   - keep podium architecture visible throughout.
9. Join `12.9-17.2`:
   - climb the left steps, then move sideways to the lower front platform center;
   - use linear X/Z progress and a short smooth height ramp from ground to `captainPodiumTop`;
   - keep segment speed within 3% of the carry speed by allocating time from route distance;
   - use a whole-number walk-cycle count so the legs reach neutral at center;
   - settle both feet without teleport or penetration;
   - stay side-on through travel, settle both feet, then turn front;
   - teammates interpolate from watching the captain to facing front.
10. Team settle `17.2-21.2`:
   - captain and teammates complete the front turn;
   - captain and trophy remain steady at chest height;
   - from `18.35s`, blend six explicit compact anticipation poses with varied one-fist, two-fist, and
     low-pump configurations;
   - use shoulder/elbow/head/chest motion only; teammate roots and both feet stay on podium height;
   - keep gestures inside each player's silhouette so neighboring arms do not form a lattice;
   - no preliminary hops, partial lifts, or fake jumps exist.
11. Lift/jump `21.2-24.2`:
   - raise the trophy to its reachable target by the jump apex;
    - calculate target adjustment from captain height;
    - use one shared jump envelope for all seven players;
    - allow small deterministic amplitude/arm-pose variation without changing takeoff/landing times;
    - start flares at `21.28s` and confetti at `21.38s`, with compressed deterministic flare launch
      spacing so the first comets peak near the `22.55s` trophy apex;
    - reuse the same 12 flare instances on a deterministic two-second relaunch cycle through `30.0s`;
    - start crowd/light response with the rise, the flag at `22.35s`, and flashes at `21.65s`;
    - blend anticipation out as lift celebration poses blend in;
    - land every foot on its correct platform height.
12. Reach proof:
    - export one pure numeric helper that accepts `PLAYER_PROPORTIONS`-derived metrics,
      `STAGE_HEIGHTS`, and trophy scale;
    - production `updateCaptain` must use `reachableLiftTarget()` rather than its own height formula;
    - Node tests must import the same helper and evaluate
      `PLAYER_PROPORTIONS.minimumHeightScale`;
    - assert shoulder-to-grip distance is below upper-arm plus forearm length with a margin;
    - lower the carrier target if necessary; do not rely on solver clamping or a duplicated test-only
      formula.
13. Payoff `24.2-26.2`:
    - continue and resolve the hanging country flag, flashes, crowd peak, warm hero lights, and confetti
      that began during the lift while flare instances keep relaunching;
    - do not hide trophy, banner, eyes, or hands.
14. Hold/restore:
    - restrained secondary motion only from `26.2-28.5`, with continuing flare launches;
    - reverse the existing curtain and fade from `28.5-30.0` while flares continue behind the fade;
    - completion calls the same idempotent destroy path as Skip/Escape.
15. Preserve render order:
    1. reset rigs;
    2. opening/stage state;
    3. captain body/root;
    4. team gaze/settle/jump/root;
    5. trophy position and carrier-driven orientation;
    6. plinth state;
    7. camera/effects;
    8. rotated trophy grip reads and both-arm solve;
    9. render.
16. Update mock labels and review copy. The mock must remain production-backed.
17. Browser-review every required beat on desktop and phone and tune only named constants/easing.

## Edge cases a weaker model will miss

- A shared logical clock already exists; using wall-clock time would reintroduce hidden-tab jumps.
- A lateral walk can look like a moonwalk if root speed and foot cycles do not match.
- Giving 46% of the route 6.5 seconds and the longer remaining 54% only 1.5 seconds creates an obvious
  fast-forward even when every individual interpolation is mathematically smooth.
- `poseWalk()` modifies shoulders, but IK must overwrite both arms after trophy placement during carry.
- Starting the trophy crossfade before hands mask it exposes two trophies.
- Copying only `trophyCarrier` position leaves the trophy world-fixed while the captain turns and forces
  the two arm solvers into a mangled grip. Copy the carrier world quaternion before reading either grip.
- Interpolating trophy Euler angles can take the long path across wraparound; use quaternion slerp/copy
  with preallocated scratch values.
- The plinth can disappear before the trophy leaves if dismissal is keyed to phase start rather than
  handoff progress.
- Scrubbing backward requires deterministic resets for trophy opacity, plinth visibility, team
  visibility, root transforms, and trophy rest quaternion.
- `captainVisible` cannot be gated only by the `captain-entry` phase because travel intentionally begins
  at `2.2s` while `phaseAt()` still returns `opening`.
- Uniform or overly wide anticipation poses form a crossed lattice across neighboring players; use six
  compact asymmetric shoulder/elbow/head poses rather than one mirrored template.
- The lift target can be unreachable even when the IK solver visually clamps the elbow.
- A DOM-less Node test cannot construct the current rig. Production and tests must import the same pure
  reach helper rather than reimplementing the formula.
- Updating grips before jump/root movement creates one-frame hand lag.
- Camera and target X must stay equal for the entire track.
- The camera should pan to the team; do not compress world X on phone until both locations fit at once.
- Confetti local time must shift to the named `21.38s` start so it is absent during carry but visible by
  the trophy apex.
- Extending `flaresEnd` alone does not keep comets visible because the original per-instance trajectory
  is one-shot. Relaunch the existing instances with deterministic modulo time; do not allocate or append
  new flare objects.
- Flash windows and flag progress must shift with the phase table.
- Captain and teammates use different final platform heights.
- Auto-finish and Skip can happen on the same frame; cleanup must remain idempotent.
- Do not leak mock labels or scrubber controls into production.

## Concrete acceptance criteria

- [ ] Exact 12-phase table matches the V2 timing contract.
- [ ] `CURTAIN_DURATION === 3.2` and total duration remains 30.
- [ ] Production, scene, and mock import the shared `7.92-8.32s` trophy crossfade and `8.42s` handoff.
- [ ] Captain is visible and moving from `2.2s` while the existing curtain continues to `3.2s`.
- [ ] Captain enters from negative X and carries to positive X.
- [ ] Camera position and target share one tracked X value.
- [ ] Captain reaches the trophy near `7.2s` and joins near `17.2s`.
- [ ] Carry and podium-walk speeds differ by less than 3%, use linear positional progress, and do not
      fast-forward at the left-step waypoint.
- [ ] Both hands remain attached to named grips from full acquisition through final hold.
- [ ] Trophy world quaternion follows `trophyCarrier` through carry and join, then both arms solve from
      the rotated named grips.
- [ ] Scrubbing backward before handoff restores the trophy rest quaternion.
- [ ] Plinth begins dismissal only after trophy handoff begins.
- [ ] No teammate or captain hop occurs from `17.2-21.2s`.
- [ ] Trophy height remains at the joined carry target throughout `17.2-21.2s`.
- [ ] From `18.35-21.2s`, six varied compact anticipation poses animate only upper bodies; teammate roots
      and feet remain planted and arms do not create a neighboring-player lattice.
- [ ] Exactly one synchronized jump envelope exists from `21.2-24.2s`.
- [ ] Shortest supported captain can physically reach both grips at maximum lift.
- [ ] Production and tests use the same exported pure lift/reach helper.
- [ ] Flares begin at `21.28s` and confetti at `21.38s`, after carry and before the `22.55s` apex; flag,
      crowd, lighting, and flashes layer into the same lift beat.
- [ ] The same 12 flare instances relaunch every two seconds, remain active at `27.5s` and `29.2s`, and
      stop only at the `30.0s` teardown.
- [ ] All seven figures land on their correct platform heights.
- [ ] Scrubbing in either direction produces the same frame for the same time.
- [ ] Hidden time does not advance logical time.
- [ ] The bracket curtain and exact restore behavior are unchanged.
- [ ] Frame paths remain allocation-free.
- [ ] Runtime scene/effect update functions contain no stale V1 beat literals or literal centerline X
      values that bypass named timing/layout contracts.

## Validation

Run:

```powershell
node tests/champion-celebration.mjs
node tests/animation-performance.mjs
```

Then review desktop and phone frames at `1.6`, `2.6`, `3.2`, `5.8`, `7.8`, `10.6`, `14.8`, `17.2`,
`19.6`, `21.2`, `22.55`, `24.8`, `27.5`, and `29.2` seconds.
