# Live tournament readiness brief

## Provenance

This brief was reconstructed from the six plans committed together in
[`2aec517`](https://github.com/eriic-builds/sled-mywcbracket/commit/2aec5175dda61431d05669c84e41b078f4523f2d),
their implementation commits, and the repository state they describe.

The planning prompt asked for the highest-leverage work after the self-hosted Poppins pass
and called out bracket-map flags. The committed plan set contains six items, not five. This
brief preserves the six real artifacts instead of forcing them into a smaller invented set.

## Goal

Prepare the static bracket dashboard for the live knockout stage by improving six trust
signals:

1. Keep results fresh on match days and say when the feed is behind.
2. Make the tournament story advance with live results.
3. Reuse bundled country flags in the bracket map.
4. Reject malformed result data before it reaches `main`.
5. Turn silent failures and keyboard gaps into clear, usable states.
6. Rewrite visible copy in the owner's direct writing style.

The goal is not a redesign. It is a reliability and clarity pass over the existing product.

## Context

The tournament was live. Quarterfinal, semifinal, and final results needed to move through
the sync pipeline quickly. Several issues had different symptoms but one shared risk: a
reader might stop trusting the dashboard.

- Three daily syncs left long match-day gaps.
- "Game facts" moved with the feed while "How it played out" felt static.
- The builder had flags while the bracket map did not.
- The fetch job could commit malformed JSON after a successful process exit.
- Failed fetches and blocked browser storage were too quiet.
- Some controls lacked complete keyboard and dialog behavior.
- Long copy and em dashes did not match the owner's voice.

## Architecture contract

Preserve:

- Static GitHub Pages hosting.
- Vanilla HTML, CSS, JavaScript, and Python maintenance scripts.
- No frontend build step.
- No runtime package or framework.
- Browser-local bracket and rival storage.
- The existing results feed and scheduled GitHub Actions pipeline.
- Bundled flag SVGs and self-hosted fonts.

The work must not add a backend, account system, analytics, or new network write.

## Ranked plan set

| Rank | Plan | Leverage |
| ---: | --- | --- |
| 1 | [`PLAN-01-match-day-freshness.md`](plans/PLAN-01-match-day-freshness.md) | Live scoring loses value when the feed lags for hours. |
| 2 | [`PLAN-02-played-out-revamp.md`](plans/PLAN-02-played-out-revamp.md) | Conflicting story sections weaken trust in correct data. |
| 3 | [`PLAN-03-bracket-map-flags.md`](plans/PLAN-03-bracket-map-flags.md) | Reuses existing local assets for faster map scanning. |
| 4 | [`PLAN-04-ci-safety-net.md`](plans/PLAN-04-ci-safety-net.md) | Stops malformed live data before commit and deployment. |
| 5 | [`PLAN-05-hardening-a11y.md`](plans/PLAN-05-hardening-a11y.md) | Replaces blank or silent failure states and closes keyboard gaps. |
| 6 | [`PLAN-06-writing-style.md`](plans/PLAN-06-writing-style.md) | Makes the shipped voice consistent after behavior settles. |

## Which plan to do first

Start with match-day freshness because the tournament clock creates the highest user impact.
Keep the CI gate close to any sync work so denser automation does not increase publishing
risk.

The ranking expresses leverage. It does not mean every commit must land in strict rank
order. Small independent safety changes can land first when they are easier to verify.

## Dependency map

```text
results feed --------> freshness notice
     |
     +---------------> story cards
     |
     +---------------> validator -> commit -> deploy

bundled flags --------> bracket map

app controls ---------> loading, storage, keyboard, dialog hardening

all settled copy -----> writing-style pass
```

Plans 2, 3, and 6 touch the byte-locked render output. Review those changes together and
regenerate `tests/fixtures/golden-sections.json` only for intentional differences.

Plans 1 and 4 share the sync workflow. Plan 5 should avoid `render.js` unless a visible
failure state requires it.

## Shared execution rules

- Read `dev-docs/CLAUDE.md` and `dev-docs/TECHNICAL_TASTE_COUNCIL.md`.
- Keep the app no-build and dependency-free.
- Reuse `docs/js/flags.js` and existing state helpers.
- Treat `docs/data/results.json` as bot-written live data.
- Keep golden fixtures tied to frozen test data.
- Put validators before commit and deployment.
- Show failures. Do not leave a blank page or silently drop local writes.
- Preserve score values, match codes, and the en dash used between score numbers.
- Run the focused check first, then the full repository test suite.

## Acceptance gate

The brief is complete when:

- match-day runs are denser without noisy quiet-day commits
- delayed data produces a visible warning
- story cards move forward with the latest completed round
- real bracket teams show bundled flags and placeholders remain flag-free
- invalid result data blocks the sync before commit
- network, storage, keyboard, and dialog failure paths remain usable
- visible prose follows the owner's writing rules
- intentional render changes have reviewed golden fixture updates
- the full test suite passes

## Technical Taste Council call

- **Russinovich:** put a deterministic validator between an untrusted feed and deployment.
- **Karpathy:** reuse the flag helper and existing modules. Do not add a framework.
- **Naval:** focus on match-day trust because each change improves every visitor's session.
- **Sean Grove:** preserve the six plans as the execution spec and record deviations in
  `RESULTS.md`.
- **Willison and Hamel:** verify the written JSON, rendered story, keyboard flow, and golden
  output instead of trusting implementation intent.
- **Yegge:** keep commits bounded by concern so a live-tournament regression is easy to
  isolate.
- **Litt:** retain the no-build architecture so the owner can inspect and change every
  shipped file.
- **Hanselman:** use plain failure messages with a next action.
- **Context Engineering:** load one plan and its named files at a time.
