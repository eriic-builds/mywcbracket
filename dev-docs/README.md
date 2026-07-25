# Development documentation

This directory explains how the product was designed, implemented, tested, and revised.
Runtime files stay under `docs/`. Planning and engineering evidence stay here.

## Start here

| Document | Use it for |
| --- | --- |
| [`PROJECT-HISTORY.md`](PROJECT-HISTORY.md) | Follow the repository from the first client-side port through the current documentation system. |
| [Interactive project history](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/project-history/) | Filter the twelve product phases and inspect the current system and build process. |
| [Interactive report gallery](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/) | Review completed workstreams as rendered web pages. |
| [`TECHNICAL_TASTE_COUNCIL.md`](TECHNICAL_TASTE_COUNCIL.md) | Apply the architecture and execution review lens. |
| [`CLAUDE.md`](CLAUDE.md) | Load current commands, safety rails, privacy rules, and agent-facing repository guidance. |

## Brief package convention

Multi-plan work receives one directory:

```text
brief-name/
├── BRIEF.md
├── BASELINE.md        optional measured starting point
├── plans/             present when source plan files exist
│   ├── PLAN-01-*.md
│   └── PLAN-02-*.md
├── RESULTS.md
└── README.md
```

Interactive HTML belongs under `dev-docs/dev-reports/<brief-name>/` so GitHub Pages renders it
instead of GitHub showing raw HTML source.

If an original brief or plan is missing:

- reconstruct only from verified plans, commits, reports, tests, and repository history
- label the reconstruction
- do not create fake historical plan files
- link the exact delivery commits

## Current process

```text
Goal / Context / Source / Expectations
                  |
                  v
                brief
                  |
                  v
        ranked execution plans
                  |
                  v
       review-sized implementation
                  |
                  v
 tests + validators + browser evidence
                  |
                  v
       results + rendered report
```

## Brief packages

| Brief | Provenance | Status | Final report | Interactive preview |
| --- | --- | --- | --- | --- |
| [Zero-backend social loop](zero-backend-social-loop/README.md) | Original spec, two preserved product plans, one historical CI plan link | Complete | [Results](zero-backend-social-loop/RESULTS.md) | [Open build story](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/zero-backend-social-loop/) |
| [Live tournament readiness](live-tournament-readiness/README.md) | Reconstructed from six committed plans | Complete | [Results](live-tournament-readiness/RESULTS.md) | [Open report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/live-tournament-readiness/) |
| [Production match experience](production-match-experience/README.md) | Reconstructed from the shipped report and production port | Complete | [Results](production-match-experience/RESULTS.md) | [Open report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/production-match-experience/) |
| [Animation performance revision](animation-performance-revision/README.md) | Original brief, baseline, six plans, matched browser traces | Complete | [Results](animation-performance-revision/RESULTS.md) | [Open report](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/animation-performance-revision/) |
| [Champion celebration](champion-celebration/README.md) | Revised completed V1 contract, [preserved source brief](%5B05%5D-champion-celebration/BRIEF.md), seven plans, production-backed scene review | Complete | [Results](champion-celebration/RESULTS.md) | [Open choreography review](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/champion-celebration/) |
| [Champion celebration V2](champion-celebration-v2/README.md) | Trophy Lift storyboard, four plans, repeated Technical Taste Council review | Complete | [Results](champion-celebration-v2/RESULTS.md) | [Open choreography review](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/champion-celebration/) |
| [Animation performance revision V2](animation-performance-revision-v2/README.md) | Measured dormant/active celebration audit, five plans, matched Edge traces | Complete with known renderer limit | [Results](animation-performance-revision-v2/RESULTS.md) | [Open performance review](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/animation-performance-revision-v2/) |

## Smaller milestones

Not every focused commit needs a synthetic brief. Typography, themes, scoring clarity,
private pool backup, and the first soccer-ball hero delivery are mapped in
[`PROJECT-HISTORY.md`](PROJECT-HISTORY.md).

Create a new package when work needs multiple ranked plans, a measured baseline, or a
separate review and acceptance boundary.

## Why `CLAUDE.md` is tracked

`CLAUDE.md` is repository guidance, not private local configuration. It contains no keys,
tokens, workbook data, or user secrets. It stays tracked because future coding agents need
the same no-build, privacy, fixture, testing, and documentation rules.

Do not place credentials, personal data, or machine-specific private paths in it.

## Compatibility paths

- `ANALYSIS.html` redirects the older `JOURNEY.html` link to the rendered social-loop report.
- `docs/reports/production-port.html` redirects the original production report route to its
  brief-centered Pages location.

Compatibility redirects preserve old links while keeping full report sources inside the
report gallery.
