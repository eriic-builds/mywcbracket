# Champion celebration V2

Status: complete, verified, and release-authorized.

This package turns the supplied Trophy Lift Storyboard into a mechanical revamp of the existing
champion celebration. It preserves the mature V1 runtime and replaces only the visual fidelity,
stage blocking, camera travel, choreography, carrier orientation, and hero-cast appearance contracts
that conflict with the new reference.

## Source hierarchy

When two sources disagree, use this order:

1. [`BRIEF.md`](BRIEF.md) - executable V2 intent and acceptance contract.
2. The owner-supplied `Trophy Lift Storyboard.html` and four-panel image, retained as session source
   artifacts rather than repository files - art, pose, stage, and story reference.
3. The protected runtime rules listed in [`BASELINE.md`](BASELINE.md) - lifecycle behavior that V2
   may not regress.
4. `../[05]-champion-celebration/SOURCE_BRIEF.md` - historical V1 record.
5. Existing code - evidence of current behavior, not authority when it conflicts with V2.

## Ranked work

| Rank | Leverage | Plan | Why it comes here |
| --- | ---: | --- | --- |
| 1 | 9.9/10 | [`PLAN-01-raise-avatar-and-trophy-fidelity.md`](plans/PLAN-01-raise-avatar-and-trophy-fidelity.md) | The explicit unresolved defect is the coarse blockout read. Static model quality must be proven before motion can hide it. |
| 2 | 9.8/10 | [`PLAN-02-build-lateral-storyboard-stage.md`](plans/PLAN-02-build-lateral-storyboard-stage.md) | The storyboard cannot exist until the left plinth, right podium, warm stadium, and translation-only camera track are real. |
| 3 | 9.6/10 | [`PLAN-03-choreograph-trophy-lift-story.md`](plans/PLAN-03-choreograph-trophy-lift-story.md) | This connects the accepted static key poses into the `7.2/17.2/24.2s` story while preserving deterministic time, rotated trophy contact, and the protected curtain. |
| 4 | 9.0/10 | [`PLAN-04-prove-v2-release-gate.md`](plans/PLAN-04-prove-v2-release-gate.md) | The last plan proves composition, lifecycle, performance, fallbacks, and documentation as one auditable release gate. |

**Execution result:** all four plans are complete. Plan 01 remained the correct first move because its
static silhouette gate prevented stage motion from hiding avatar and trophy defects.

## Council decisions

- Claude Opus 4.8 performed the authoritative Technical Taste Council analysis.
- Claude Opus 4.8 performed the final post-build council review and returned **APPROVE** with no material
  findings for carrier orientation, curtain-overlapped entry, cast variation, or protected contracts.
- Four plans are the smallest safe split: three independently reviewable build increments and one
  evidence gate.
- "Low-poly clay" means simplified, cohesive forms. It does not permit visible facets, crude capsule
  blockouts, miniature tilt-shift, or photoreal skin.
- The newest straight-on direction wins over earlier isometric side-view language. The camera may
  translate on X, but its target translates by the same amount so the viewing direction stays frontal.
- Frontal camera does not lock performers to the user: the captain now follows travel headings, uses one
  crowd-hype fist, turns toward the trophy, watches the team approach, and faces front only after joining.
- The captain begins moving at `2.2s` behind the fading bracket; overlap shortens perceived intro time
  without rewriting the protected `3.2s` curtain.
- The trophy remains scene-space owned but inherits the captain carrier's world quaternion before named
  grips are sampled and both arms are solved.
- The seven hero variants guarantee distinct skin tones, hair tones, and hairstyles plus five
  facial-hair states without linking appearance to the winning country.
- Ivory Coast is a visual reference only. Production remains driven by the active winning country.

## Artifacts

- [`BRIEF.md`](BRIEF.md) - V2 contract.
- [`BASELINE.md`](BASELINE.md) - codebase discoveries and protected seams.
- [`RESULTS.md`](RESULTS.md) - implementation and verification evidence.
- [`plans/`](plans/) - the four mechanical execution plans.
- `Brief_5_V2_EXECUTION_REVIEW.HTML` - self-contained executive and engineering review.

## Final evidence

- Focused celebration, performance, touched-surface regression, and Python validator gates pass.
- Full `npm test` stops only at the known unrelated CRLF-sensitive landing-ballpit assertion.
- Desktop and phone storyboard frames render without browser errors.
- Authored elliptical avatar massing, restrained cloth/skin/boot material response, seven fitted hair
  families, nine skin tones, eight hair tones, five facial-hair states, grass-only field treatment,
  closed stadium corners/openings/roof depth, varied articulated
  supporters, six planted anticipation poses, six distinct lift poses, distance-proportional captain
  travel beginning during the curtain, carrier-oriented trophy contact, one synchronized jump, and a
  flare/confetti burst visible by the `22.55s` trophy apex pass visual review. The same 12 bounded flare
  instances relaunch every two seconds through the final `30.0s` fade.
- England, Brazil, and Ivory Coast palettes remain readable.
- The actual dashboard proves the 31-card/60-connector curtain, off-center trophy continuity, Escape
  restoration, carrier orientation, replay canvas reuse, reduced motion, forced fallback, and
  context-loss fallback.
- [`RESULTS.md`](RESULTS.md) contains the complete observation-to-evidence record.

Separate owner approval authorizes this package's commit and main-branch push. It adds no hosted
asset, external 3D model, new build step, backend dependency, or cloud-agent execution.
