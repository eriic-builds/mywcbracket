# Champion celebration V2 brief

Status: implemented, verified, and release-authorized.

Revision note: the July 12 avatar/environment refinement supersedes the original front-locked walk
and two partial trophy pumps. Travel now follows the captain's path, the captain uses one crowd-hype
fist before pickup, climbs the podium's left steps, walks sideways to center without showing his back,
and holds the trophy steady until the single full lift and synchronized jump. The final
trophy-standard fidelity pass replaces radial body forms with authored elliptical lofts, closes the
stadium corners, adds planted teammate anticipation, and starts the celebration burst during the actual
trophy rise. The carry-orientation revision now reveals the captain at `2.2s` behind the fading bracket,
shortens every story beat before restore, rotates the trophy from the captain's world-space carrier, and
guarantees a diverse seven-player appearance set with seven hair and five facial-hair styles.

## Goal

Revamp the hidden 30-second World Cup champion celebration around the supplied Trophy Lift
Storyboard. The result must feel like a premium, full-scale, warm soft-matte clay stadium scene:

- the captain renders behind the fading bracket from `2.2s`, enters from screen-left in a natural
  side-on walk, and raises one crowd-hype fist;
- the live bracket trophy settles continuously onto a tall square ivory plinth on the left;
- the captain reaches the trophy at about `7.2s` and lifts it with both articulated hands;
- the empty plinth disappears during the pickup;
- the captain carries the trophy right toward six teammates on a broad ivory winners podium;
- the camera translates right during the carry while remaining straight-on;
- the captain joins the team at about `17.2s`;
- the trophy stays steady while the captain and teammates settle facing front, then use varied planted
  fist and ready gestures without another hop or partial lift;
- one physically reachable full lift and one synchronized expressive jump happen from `21.2-24.2s`;
- flares begin at `21.28s` and confetti at `21.38s`, during the rise to the `22.55s` trophy apex; the
  same bounded flare instances relaunch deterministically through the `30.0s` teardown;
- flag, flashes, crowd response, and warm hero light layer in during the same lift beat and continue
  through the `24.2-26.2s` payoff;
- the complete tableau holds briefly before the original bracket is restored exactly.

The goal is not photorealism. The goal is a cohesive stylized clay film with smooth forms, readable
faces and hands, convincing trophy contact, warm depth, and deliberate motion.

## Authority and conflict resolution

This V2 brief supersedes only the following V1 art-direction rules:

- centered rear-to-front captain entrance;
- one permanent `x = 0` scene centerline;
- no lateral camera tracking;
- dark cylindrical plinth;
- dark round podium;
- early `17.7-19.9s` lift/jump timing;
- coarse capsule-heavy player silhouettes.

V1 remains authoritative for lifecycle, trigger, continuity, fallbacks, silence, deterministic time,
resource ownership, and exact restoration.

Earlier phrases such as "isometric" and "low-poly" are interpreted as art-direction shorthand for
clean layered depth and simplified shapes. They do not override the latest straight-on camera request,
and they do not allow visibly faceted or crude models. "Diorama" describes cohesion, not miniature
scale; do not add tilt-shift, depth-of-field blur, toy-size proportions, or orthographic framing.

## Protected runtime contract

V2 must preserve all of these behaviors:

1. Four activations within 2.5 seconds trigger only the active mirrored champion.
2. The bracket remains intact until the production Three.js scene has rendered frame zero.
3. The `0.0-3.2s` opening remains the existing center-out card cascade.
4. Every split connector half continues to move with the card it touches.
5. The dashboard trophy remains continuously visible and moves onto the scene plinth.
6. The DOM trophy and Three.js trophy crossfade under the captain's hands; there is no disappearance.
7. One reusable celebration canvas and WebGL context are reused across replays.
8. Scene time is a deterministic function of logical time and pauses while the page is hidden.
9. Reduced motion avoids importing the Three.js scene.
10. Initialization failure and WebGL context loss use the existing fallback and cleanup path.
11. Skip, Escape, completion, rerender, and teardown remain idempotent.
12. The experience remains intentionally silent.
13. The review harness continues to instantiate `createChampionScene()` rather than duplicate it.
14. Country identity remains dynamic and uses only bundled local flag assets.

Do not rewrite `createCurtainAnimations()`, the trigger, dashboard rendering, connector generation,
modal isolation, or the one-canvas lifecycle unless a V2 regression proves a change is necessary.

## Story and timing contract

Total duration remains exactly 30 seconds.

| Time | Required beat |
| --- | --- |
| `0.0-3.2s` | Preserve the existing center-out bracket-card and connector cascade. The captured dashboard trophy moves continuously to the left plinth while the warm stadium, plinth, and podium rise. At `2.2s`, the captain becomes visible behind the fading map and begins walking from screen-left. |
| `3.2-3.4s` | The last curtain elements clear around the already-moving captain; do not pause the stage. |
| `3.4-5.0s` | Captain continues side-on along the entry path toward the left plinth. |
| `5.0-7.2s` | Captain raises one closed fist to energize the crowd, turns toward the trophy, and settles behind the plinth without intersecting it. |
| `7.2-9.2s` | Captain crouches, reaches, closes both hands around the named trophy grips, and rises with the trophy. DOM and Three.js trophies crossfade under the hands while the empty plinth shrinks/fades away. |
| `9.2-12.9s` | Captain carries the trophy right at chest height toward the podium's left steps. The trophy inherits the carrier's world orientation before named grip positions are read, so both hands rotate naturally with it. The camera translates right without yaw and the teammates watch the captain. |
| `12.9-17.2s` | Captain climbs the left steps, gains platform height, and keeps walking sideways across the platform to center at the same route speed. Trophy orientation follows the captain through the heading change and the captain never turns his back to the viewer. |
| `17.2-21.2s` | At center, the captain turns from side-on to front. From `18.35s`, the six teammates build anticipation with distinct compact fist/ready gestures and subtle chest/head motion. Every foot and the trophy remain planted. |
| `21.2-24.2s` | One full reachable trophy lift and one synchronized team jump. Flares launch at `21.28s`, confetti at `21.38s`, crowd/light response rises with them, and the flag begins at `22.35s`, making the burst visible by the `22.55s` trophy apex. The 12 flare instances relaunch on a deterministic two-second cycle. |
| `24.2-26.2s` | The bounded flare/confetti/flag/flash payoff continues and resolves without obscuring the trophy, captain, banner, hands, or faces; flare launches continue. |
| `26.2-28.5s` | Hold the complete champion tableau with restrained secondary motion and continuing flare launches. |
| `28.5-30.0s` | Fade the celebration and reverse the existing curtain while flare launches continue behind the fade until teardown restores the bracket exactly. |

## Stage and camera contract

- Player meshes are authored facing `+Z`, but the captain root rotates along each travel heading and
  returns to front only for pickup and the final tableau. The camera remains on the positive-Z side.
- Use named stage constants rather than anonymous literals:
  - left trophy plinth X;
  - right winners podium X;
  - captain entry X;
  - captain grab, left-step approach, final X, carry, and final Z;
  - camera establishing X and final podium X.
- The plinth is a square warm-ivory clay pedestal placed clearly farther left from the winners podium,
  with softened edges and proportions for a natural
  two-hand grab near the captain's mid-torso rather than exaggerated height, and a small restrained
  country-color inset. It is not cylindrical.
- The podium follows the storyboard:
  - broad white rear team platform;
  - layered side steps;
  - a lower circular captain platform at the front;
  - subtle country-color insets only;
  - enough width for six teammates without overlap.
- The podium is visible as destination architecture before the teammates fully reveal.
- The team stands behind the captain on the higher platform; the captain finishes on the lower front
  platform, matching the storyboard's readable depth.
- The stadium uses a warm clay/concrete palette, warm high-angle key light, soft fill, readable
  contact shadows, and a lighter pitch. Corner tiers, fascia, aisles, vomitories, roof underside,
  catwalks, and floodlight banks must make it read as one continuous full-scale arena rather than
  disconnected brown shelves or a black night void.
- The dynamic champions banner and hanging country flag remain anchored to the central tunnel as the
  stadium identity layer. Confetti, flashes, glint, and hero light recenter on the final right-side
  podium. Review both layers together as the curtain clears near `3.2s`.
- Camera rotation stays frontal. During the carry:

  ```js
  camera.position.x = trackedX;
  cameraTarget.x = trackedX;
  ```

  Moving only the camera position is forbidden because it creates a side-view yaw.
- No tilt-shift, bokeh, depth-of-field pass, orthographic camera, or miniature lens treatment.
- Desktop and phone may use different distance/FOV and teammate spacing, but they tell the same story.

## Avatar contract

Create one captain and six generic teammates. No real-player likeness, logo, sponsor, or squad number.

- Smooth higher-density stylized anatomy with slimmer, connected silhouettes; use non-radial
  torso/pelvis/head profiles and overlapping shoulder, cuff, waist, knee, and ankle transitions instead
  of the assembled capsule/barrel look.
- Preserve the existing named root, joints, hand anchors, trophy carrier, arm chains, reset API, and
  allocation-free IK contract.
- Keep bounded geometry. Improve proportions, bevels, normals, material response, and silhouette before
  increasing segment counts.
- Soft-matte clay may use bounded `MeshPhysicalMaterial` response for cloth sheen, skin softness, and
  boot finish, but roughness stays high and clearcoat stays restrained; no plastic gloss or photoreal
  skin.
- Faces remain simple but readable from the hero camera: eyes, brows, nose, ears, and mouth must align.
- Hair is modeled geometry with seven deterministic style families. Every shell follows the head
  ellipsoid and every curl/lock is embedded into the scalp surface; do not use a floating, disappearing,
  or identical bowl cap.
- The final seven-player cast uses nine authored skin tones, eight hair tones, seven hair-style families,
  and five facial-hair states. Variants `0-6` must produce seven distinct skin tones, hair tones, and
  hairstyles, while retaining clean-shaven, moustache, goatee, beard, and sideburn/chin treatments.
- Appearance variation is driven by the generic rig variant, not the winning country, and must not imply
  nationality, ethnicity, or a real-player likeness.
- Each hand has one thick thumb and exactly three thick readable fingers.
- Skin tone, hair tone, height, face detail, and hair style vary deterministically and independently of
  country identity.
- The captain uses the primary country kit and captain armband.
- Teammates use deterministic primary/secondary/neutral-away kit combinations so two or three figures
  read as a cohesive alternate strip while country identity remains obvious.
- Feet contact the ground/podium at the shared stage heights after every scrub, jump, resize, and replay.

## Trophy contract

- Continue using the shared `createTrophySculpture()` factory for both dashboard and cutscene.
- Improve the sculptural silhouette and clay-metal material without changing the ownership/dispose API.
- Preserve named `leftGrip`, `rightGrip`, `top`, and `bottom` anchors.
- The trophy remains a scene-space prop driven by the captain's `trophyCarrier`.
- Read both the world position and world quaternion from `trophyCarrier`; interpolate from the rest
  quaternion during handoff, then solve both hands from the rotated named grips.
- Scrubbing backward before handoff must restore the trophy rest quaternion as well as position/scale.
- The trophy uses an oversized championship globe with multiple raised globe rings, stronger sweeping
  supports, and a broader multi-tier base so it reads as the hero object at group-shot distance.
- Never parent the trophy to one hand.
- Place the trophy before reading grip positions; solve both arms after body, pickup, and jump
  movement.
- The lift target itself must be reachable. Do not rely on IK clamping to hide an impossible carrier.
- The base rests on the plinth without hovering or penetrating.

## Bounded technical approach

- Use the existing local Three.js module. Add no external model, texture service, addon, or build step.
- Core `ExtrudeGeometry`, `LatheGeometry`, `TubeGeometry`, smooth cylinders/spheres, and computed normals
  are allowed.
- Bounded custom `BufferGeometry` is allowed for authored elliptical lofts when it is constructed once
  in the model factory and disposed through the existing owner.
- Keep `flatShading: false`.
- Keep celebration DPR capped at `1.5`.
- Keep the crowd and confetti instanced and bounded.
- Do not construct geometry, material, texture, arrays, or Three.js objects inside frame-update paths.
- Scene/effect update functions may not own anonymous beat-second literals. Import named timing
  constants or consume pure progress/envelope helpers from `champion-celebration-timeline.js`.
- Dispose every new geometry, material, and texture through the existing owner/resource patterns.
- Preserve dynamic country sampling and local flag loading.

## Required review frames

Capture and inspect desktop plus `390x844` phone frames at approximately:

- `1.6s` - bracket cascade and trophy path before captain reveal;
- `2.6s` and `3.2s` - captain already walking behind and then clear of the fading bracket;
- `5.8s` - side-on approach and crowd-hype fist;
- `7.8s` - two-hand grab and trophy/plinth alignment;
- `10.6s` - rightward carry with trophy/carrier orientation and hand alignment;
- `14.8s` - constant-speed sideways platform walk with the rotated trophy still gripped;
- `17.2s` - center arrival;
- `19.6s` and `21.2s` - diverse cast and six compact anticipation gestures with no neighboring-arm lattice,
  root bounce, preliminary jump, or trophy rise;
- `22.55s` - reachable overhead lift, synchronized jump, six varied teammate arm poses, and the
  flare/confetti burst already visible;
- `24.8s` - continuing flares through falling flag/confetti/flash payoff;
- `27.5s` - final tableau with continuing flare launches;
- `29.2s` - flare launches still visible behind the bracket restore fade.

Also verify at least three materially different country palettes, including one with a light secondary
color, one dark secondary color, and one high-saturation combination.

## Acceptance criteria

V2 is complete only when:

1. The four plans in `plans/` are executed in order.
2. A static side-by-side comparison shows materially better player and trophy silhouettes than V1.
3. Hands visibly contain three fingers and a thumb and remain aligned to named trophy grips.
4. The opening cascade and split connector motion are behaviorally unchanged.
5. The dashboard trophy moves continuously to the off-center left plinth.
6. The plinth is square/ivory, the podium is broad/ivory/stepped, and the stadium reads warm.
7. Captain movement is left-to-right and path-facing, not rear-to-front or camera-locked.
8. Camera position and target share the same tracked X, preserving frontal rotation.
9. The captain becomes visible during the bracket fade, reaches the trophy near `7.2s`, and joins the
   team near `17.2s`.
10. There are zero partial trophy pumps, zero preliminary hops, six planted pre-lift anticipation poses,
    one full lift, one synchronized jump, six distinct teammate celebration poses, and bounded flares
    overlapping falling confetti before the trophy reaches its apex, then deterministically relaunching
    through the `30.0s` teardown without creating new instances.
11. Trophy world orientation follows the carrier through carry/join headings; backward scrubbing restores
    the rest quaternion and both hands stay on rotated named grips.
12. Variants `0-6` yield seven distinct skin tones, hair tones, and hairstyles plus multiple facial-hair
    states independent of country identity.
13. The lift is physically reachable for the shortest supported captain scale.
14. The flag, banner, trophy, and faces do not obscure each other in desktop or phone hero frames.
15. Scrubbing backward restores plinth/team/trophy opacity and transforms deterministically.
16. Replay reuses the same canvas; Skip and context loss release scene resources.
17. Reduced motion still avoids scene import and the experience remains silent.
18. Focused tests and validators pass. The known unrelated CRLF-sensitive `landing-ballpit.mjs`
    baseline is reported rather than changed.
19. V1 documents remain preserved and linked to this V2 package.
20. No commit, push, publication, deployment, or cloud execution occurs before separate owner
    approval; that approval was later granted for this release's commit and main-branch push.

The shortest-captain reach criterion must be implemented through one pure exported numeric helper used
by both production choreography and Node tests. A duplicated test-only formula is not evidence.

## Non-goals

- No gameplay changes.
- No visible trigger hint.
- No audio.
- No player likenesses.
- No logos or numbers.
- No external GLTF/FBX assets.
- No post-processing stack.
- No physics engine.
- No new production controls, scrubber, replay button, or phase label.
- No unrelated cleanup of dashboard, bracket, landing-page, or fixture code.
