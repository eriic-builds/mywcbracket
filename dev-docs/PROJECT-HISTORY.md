# Project history and build map

## Purpose

This file connects the current repository to the decisions and milestones that produced it.
It separates product commits from automated score updates and links formal brief packages
where source artifacts exist.

The history is not a changelog of every line. It is a map for someone asking:

- Why is this architecture static and browser-local?
- Which workstream introduced a feature?
- Where is the original brief or final evidence?
- Which later commit changed the first implementation?
- How should the next brief fit the same process?

## Current product

`sled-mywcbracket` is a no-build, zero-backend World Cup bracket dashboard hosted on GitHub
Pages.

A visitor can build or import a bracket, score it against live results, inspect two bracket
layouts, open match facts, share one bracket through a URL fragment, save received brackets
to a local leaderboard, back up the local pool, switch visual modes, and control decorative
motion. The mirrored champion box also owns a hidden, deterministic 30-second clay-stadium
trophy celebration that remains lazy and dormant until its fourth valid activation.

Personal picks and rivals stay in browser storage. Scheduled GitHub Actions update public
match data and deploy static files.

## Milestone timeline

Automated `chore: auto-sync World Cup match data` commits are omitted. They update generated
data but do not change product architecture.

| Phase | Date | Anchor commits | What changed | Evidence |
| ---: | --- | --- | --- | --- |
| 1 | Jul 7 | [`4546950`](https://github.com/eriic-builds/sled-mywcbracket/commit/4546950), [`a35fa5b`](https://github.com/eriic-builds/sled-mywcbracket/commit/a35fa5b) | Ported the Python dashboard to a client-side fan viewer, added import and builder flows, local state, live scoring, and the first golden parity guard. | Root README and current tests |
| 2 | Jul 7-8 | [`003c056`](https://github.com/eriic-builds/sled-mywcbracket/commit/003c056), [`97e3c67`](https://github.com/eriic-builds/sled-mywcbracket/commit/97e3c67), [`22d4bb5`](https://github.com/eriic-builds/sled-mywcbracket/commit/22d4bb5), [`65d4019`](https://github.com/eriic-builds/sled-mywcbracket/commit/65d4019) | Built private share links and a recipient-controlled local leaderboard with no central pool database. | [Zero-backend social loop](zero-backend-social-loop/README.md) |
| 3 | Jul 8-9 | [`f60c0f2`](https://github.com/eriic-builds/sled-mywcbracket/commit/f60c0f2), [`788e9ad`](https://github.com/eriic-builds/sled-mywcbracket/commit/788e9ad), [`b6c91eb`](https://github.com/eriic-builds/sled-mywcbracket/commit/b6c91eb), [`1e92880`](https://github.com/eriic-builds/sled-mywcbracket/commit/1e92880) | Promoted the pilot, rebuilt the actual path, improved navigation and social UX, added a glass landing, bundled flags, and self-hosted typography. | Social report Round 2 |
| 4 | Jul 9 | [`2aec517`](https://github.com/eriic-builds/sled-mywcbracket/commit/2aec517), [`d47d038`](https://github.com/eriic-builds/sled-mywcbracket/commit/d47d038), [`05445a0`](https://github.com/eriic-builds/sled-mywcbracket/commit/05445a0), [`c717610`](https://github.com/eriic-builds/sled-mywcbracket/commit/c717610) | Added match-day freshness, live-data validation, map flags, clearer tournament stories, failure states, accessibility, and the owner voice. | [Live tournament readiness](live-tournament-readiness/README.md) |
| 5 | Jul 9-10 | [`417148f`](https://github.com/eriic-builds/sled-mywcbracket/commit/417148f), [`7aeb91c`](https://github.com/eriic-builds/sled-mywcbracket/commit/7aeb91c), [`8112ce5`](https://github.com/eriic-builds/sled-mywcbracket/commit/8112ce5), [`e5e3efb`](https://github.com/eriic-builds/sled-mywcbracket/commit/e5e3efb) | Added consistent Home chrome, contact links, Sticker Book, OpenDyslexic Easy mode, seed-free maps, and correct settled-points accounting. | Current CSS, scoring tests, and golden fixtures |
| 6 | Jul 10 | [`38d6b5d`](https://github.com/eriic-builds/sled-mywcbracket/commit/38d6b5d), [`cceb234`](https://github.com/eriic-builds/sled-mywcbracket/commit/cceb234), [`fe2179d`](https://github.com/eriic-builds/sled-mywcbracket/commit/fe2179d), [`b13b34c`](https://github.com/eriic-builds/sled-mywcbracket/commit/b13b34c) | Ported mirrored and Sideways bracket tables, match facts, portraits, the trophy, lifecycle cleanup, and data validators, then restored production-specific polish. | [Production match experience](production-match-experience/README.md) |
| 7 | Jul 10 | [`c419612`](https://github.com/eriic-builds/sled-mywcbracket/commit/c419612) | Added private pool backup and merge-safe import without creating whole-pool sharing. | `tests/backup.mjs` and social brief invariant 9 |
| 8 | Jul 11 | [`1e36cdd`](https://github.com/eriic-builds/sled-mywcbracket/commit/1e36cdd) | Added the interactive low-poly soccer-ball hero, local flag decals, Motion control, reduced-motion behavior, and deterministic physics tests. | `tests/landing-ballpit.mjs` |
| 9 | Jul 11 | [`f5696d1`](https://github.com/eriic-builds/sled-mywcbracket/commit/f5696d1) | Reduced layout, paint, RAF, and WebGL work while keeping the ball pit and trophy. | [Animation performance revision](animation-performance-revision/README.md) |
| 10 | Jul 11 | [`7ab8948`](https://github.com/eriic-builds/sled-mywcbracket/commit/7ab8948) | Grouped legacy plans, briefs, results, and reports into a stable documentation system. | [Development briefs](README.md) |
| 11 | Jul 12-13 | Release commit: `feat: add champion celebration and renderer performance pass` | Built and repeatedly refined the hidden champion celebration: exact modal lifecycle, shared trophy continuity, diverse premium clay avatars, lateral winners stage, articulated two-hand carry/lift, country identity, confetti, and continuous finale flares. | [Champion celebration V2](champion-celebration-v2/README.md) |
| 12 | Jul 13 | Release commit: `feat: add champion celebration and renderer performance pass` | Proved zero dormant celebration runtime and cut active renderer submission through scoped IK matrices, rigid same-parent batching, player-local vertex colors, and selective shadow ownership while preserving the approved scene. | [Animation performance revision V2](animation-performance-revision-v2/README.md) |

## How the current process works

New multi-plan work follows a reviewable sequence:

```text
Goal / Context / Source / Expectations
                  |
                  v
            BRIEF.md
                  |
                  v
       ranked plans with exact files
                  |
                  v
     small implementation checkpoints
                  |
                  v
 tests + validators + browser evidence
                  |
                  v
  RESULTS.md + rendered Pages report
```

The Technical Taste Council is an architecture review lens, not an extra runtime system.
Its role is to challenge complexity, protect the no-build contract, keep the next human in
mind, and demand evidence before release.

## Repository map

| Path | Purpose |
| --- | --- |
| `docs/` | Entire deployed GitHub Pages site |
| `docs/js/` | Browser runtime, render model, interactions, storage, social features, match details, trophy, and ball pit |
| `docs/css/` | Dashboard, bracket, font, and theme styles |
| `docs/data/` | Fixed topology, demo picks, and bot-generated public match data |
| `dev-docs/dev-reports/` | Pages-rendered development and learning reports |
| `docs/reports/` | Compatibility redirects for older report URLs |
| `scripts/` | Result fetch, detail generation, and publishing validators |
| `tests/` | Hermetic JavaScript and Python behavior, snapshot, and pipeline coverage |
| `dev-docs/` | Briefs, plans, results, project history, and engineering guidance |
| `.github/workflows/` | Tests, live-data sync, and Pages deployment |

## Source artifact rules

- Preserve original briefs and plans when they exist.
- Mark reconstructed briefs as reconstructions.
- Do not create fake historical plans to fill missing rank numbers.
- Link implementation commits so claims remain auditable.
- Keep measured delivery evidence at its original point in time.
- Record later fixes in the relevant results file.
- Publish interactive HTML under `dev-docs/dev-reports/` so GitHub Pages renders it.
- Keep compatibility redirects when an older tracked document links the previous path.

## Current brief packages

| Brief | Source | Plans | Result |
| --- | --- | ---: | --- |
| [Zero-backend social loop](zero-backend-social-loop/README.md) | Original `SPEC.md` | 2 preserved, 1 historical link | Complete |
| [Live tournament readiness](live-tournament-readiness/README.md) | Reconstructed from six committed plans | 6 | Complete |
| [Production match experience](production-match-experience/README.md) | Reconstructed from report and delivery | 0 standalone, 6 report phases | Complete |
| [Animation performance revision](animation-performance-revision/README.md) | Original brief | 6 | Complete |
| [Champion celebration](champion-celebration/README.md) | Revised completed V1 contract; [source brief preserved](%5B05%5D-champion-celebration/BRIEF.md) | 7 | Complete |
| [Champion celebration V2](champion-celebration-v2/README.md) | Trophy Lift storyboard and owner revisions | 4 | Complete |
| [Animation performance revision V2](animation-performance-revision-v2/README.md) | Original performance contract and measured baseline | 5 | Complete with known renderer limit |

## What remains outside a formal brief

Small or one-commit milestones stay in this history instead of receiving artificial brief
packages. These include the font pass, individual themes, settled scoring, private pool
backup, and the first soccer-ball hero delivery.

If one of those areas grows into new multi-plan work, create a new brief package and link it
back to the relevant milestone here.
