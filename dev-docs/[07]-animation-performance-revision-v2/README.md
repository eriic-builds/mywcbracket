# Animation performance revision V2

Status: complete and release-authorized; measured renderer limit remains explicit

Project phase: post-celebration performance audit and bounded optimization, July 13, 2026.

This package measures the client after the champion celebration was added. It preserves the
completed July 11 performance evidence and focuses on two questions:

1. Does the hidden reward cost the primary dashboard anything meaningful before activation?
2. Can the active 30-second WebGL sequence meet the agreed throttled-mobile frame budget
   without losing approved motion or visual quality?

## Read in order

1. [Brief and project contract](BRIEF.md)
2. [Measured baseline](BASELINE.md)
3. [Ranked execution plans](plans/)
4. [Final measured results](RESULTS.md)
5. [Interactive performance review](../[00]-dev-reports/[07]-animation-performance-revision-v2/index.html)

## Package structure

```text
[07]-animation-performance-revision-v2/
├── BRIEF.md
├── BASELINE.md
├── plans/
│   ├── PLAN-01-measure-hidden-and-active-cost.md
│   ├── PLAN-02-isolate-primary-dashboard.md
│   ├── PLAN-03-bound-active-frame-cost.md
│   ├── PLAN-04-bound-activation-cost.md
│   └── PLAN-05-prove-performance-v2.md
├── RESULTS.md
└── README.md
```

## Relationship to the first revision

The first
[animation performance revision](../[04]-animation-performance-revision/README.md) remains the
historical source for ball-pit sleeping, pointer-write coalescing, transform progress fills,
CSS motion primitives, and passive trophy pacing.

V2 does not rewrite those measurements. It verifies them as smoke guards and measures the
new celebration boundary, active scene, hidden lifecycle, and replay lifetime.

## Execution rule

Run plans in rank order. Plans 02 through 04 are measurement gates, not promises to change
runtime code. Stop each plan as soon as its matched acceptance gate passes.

Session-only CDP scripts, traces, heap snapshots, CSV, JSON, and screenshots live outside the
repository under the Copilot session folder. Repository documents contain normalized raw
values and evidence filenames, not machine browser profiles or large trace payloads.

## Final result

- The dormant dashboard and three-click near miss request no heavy celebration modules and
  create no celebration stage, canvas, WebGL context, or RAF work.
- Scoped matrix updates, rigid same-parent player batching, player-local vertex colors, and
  selective shadow ownership reduced the active scene from `667` to `342` meshes and from
  about `626` to `303` renderer calls without reducing the approved scene.
- Phone carry improved from `115.162ms` to `75.394ms` p95. Phone hold/restore improved from
  `149.438ms` to `79.893ms` p95.
- The final matched phone peak measured `78.617ms` p95. Isolated repeats measured
  `78.516ms`, `85.905ms`, and `77.003ms`.
- Two focused attribution repeats measured `69.262ms` and `75.374ms`; renderer bypass
  measured `12.865ms` and `13.315ms`. Further small JavaScript cleanup is not the primary
  answer.
- The strict active `16ms` target remains red. Reaching it requires a larger avatar/rendering
  architecture change or an approved visible-content tradeoff.
- Focused and unaffected suites pass. Full `npm test` retains only the accepted unrelated
  Windows CRLF-sensitive `landing-ballpit.mjs` extraction failure.

## Release state

Separate owner approval authorizes this package's commit and main-branch push. The existing Pages
workflow publishes `docs/` changes; no separate deployment mechanism or cloud-agent execution was
added.
