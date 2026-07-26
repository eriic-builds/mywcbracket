# Animation performance revision

Status: complete

Project phase: client-side animation and WebGL performance, July 11, 2026.

This folder keeps the original brief, its six execution plans, the measured starting point,
and the final result together.

## Read in order

1. [Brief](BRIEF.md)
2. [Measured baseline](BASELINE.md)
3. [Execution plans](plans/)
4. [Final results](RESULTS.md)
5. [Reusable audit prompt](BRIEF.md#reusable-client-side-performance-review-prompt)
6. [Interactive report](https://github.com/eriic-builds/mywcbracket/tree/main/dev-docs/[00]-dev-reports/[04]-animation-performance-revision/)

The interactive report source lives at
[`dev-docs/[00]-dev-reports/[04]-animation-performance-revision/index.html`](../[00]-dev-reports/[04]-animation-performance-revision/index.html).
Keeping it under `dev-docs/` keeps the report alongside planning artifacts in one package.
The report's **Reuse prompt** tab contains the same project-agnostic client-side audit
prompt in a copy-ready format.

## Package structure

```text
[04]-animation-performance-revision/
├── BRIEF.md
├── BASELINE.md
├── plans/
│   ├── PLAN-01-baseline-and-safety-rails.md
│   ├── PLAN-02-ballpit-runtime-budget.md
│   ├── PLAN-03-dom-motion-hot-paths.md
│   ├── PLAN-04-css-compositor-primitives.md
│   ├── PLAN-05-trophy-frame-budget.md
│   └── PLAN-06-integrated-performance-gate.md
├── RESULTS.md
└── README.md
```

## Place in the project

This revision followed the
[production match experience](../[03]-production-match-experience/README.md), private pool
backup, and the interactive soccer-ball hero. It kept the approved motion while reducing
layout, paint, RAF, and WebGL work.

See the [project history](../PROJECT-HISTORY.md) for the full sequence.
