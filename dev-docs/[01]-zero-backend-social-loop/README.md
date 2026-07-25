# Zero-backend social loop

Status: complete

Project phase: social foundation and pilot promotion, July 7-8, 2026.

This package records how bracket sharing and local comparison were designed, built, and
verified.

## Read in this order

1. [`BRIEF.md`](BRIEF.md) is the original `SPEC.md`. It defines the privacy model, wire
   format, behavioral invariants, and deliberate omissions.
2. [`plans/PLAN-03-share-links.md`](plans/PLAN-03-share-links.md) specifies the
   bracket-in-a-URL flow.
3. [`plans/PLAN-04-compare-brackets.md`](plans/PLAN-04-compare-brackets.md) specifies the
   local leaderboard and pick-difference flow.
4. [`RESULTS.md`](RESULTS.md) maps the brief to the shipped files and commits.
5. [Open the interactive build story](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/[00]-dev-reports/[01]-zero-backend-social-loop/)
   for the stage-by-stage explanation and ELI5 view.

## Historical note

The two preserved product plans keep their original ranks, 3 of 5 and 4 of 5. The initial
five-item planning pass also produced a rank-1 CI safety plan, preserved in
[commit `003c056`](https://github.com/eriic-builds/sled-mywcbracket/blob/003c0567d7b17c2673c6b8d2787e48614ae8c728/PLAN-ci-safety-net.md).
That filename was later reused for a different live-data plan.

Ranks 2 and 5 did not survive as standalone source files. They are not recreated as fake
historical plans. The five-stage implementation record in `RESULTS.md` and the interactive
report shows what was built around the preserved plans.

The compatibility redirect now lives at
`dev-docs/[01]-zero-backend-social-loop/ANALYSIS.html` for `JOURNEY.html`.

## Place in the project

This work followed the first client-side viewer port. It established the privacy and local
ownership rules that every later workstream preserved.

The next formal package is
[live tournament readiness](../[02]-live-tournament-readiness/README.md). The production match
port later added richer bracket and match surfaces without changing this share format.

See the [project history](../PROJECT-HISTORY.md) for the full sequence.
