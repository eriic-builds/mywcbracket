# Zero-backend social loop results

## ELI5 outcome

A bracket is 31 two-choice answers. The app writes those answers into the private fragment
of a share link. A recipient opens the link, reviews the bracket, and chooses whether to
save it to a leaderboard in their own browser.

The link carries the data. No account, database, pool registry, or paid service is involved.

## Architecture result

| Constraint | Result |
| --- | --- |
| Hosting | Static GitHub Pages files |
| Runtime | Vanilla HTML, CSS, and ES modules |
| Backend | None |
| Build step | None |
| Share transport | URL fragment after `#b=` |
| Rival storage | Recipient-controlled `localStorage` |
| Whole-pool sharing | Deliberately omitted |
| Network writes from social modules | None |

The app is zero-backend, not fully stateless. A browser remembers the owner's bracket,
what-if changes, and saved rivals locally.

## Brief provenance

The source brief was committed as `SPEC.md` in Stage 0. It now lives at `BRIEF.md` so this
package follows the repository's brief convention without rewriting the original
requirements.

The two loose product plans were:

| Original rank | Preserved plan | Shipped stage |
| ---: | --- | --- |
| 3 of 5 | [`PLAN-03-share-links.md`](plans/PLAN-03-share-links.md) | Stage 1 |
| 4 of 5 | [`PLAN-04-compare-brackets.md`](plans/PLAN-04-compare-brackets.md) | Stages 2 and 3 |

The original rank-1 CI plan is still readable in
[commit `003c056`](https://github.com/eriic-builds/sled-mywcbracket/blob/003c0567d7b17c2673c6b8d2787e48614ae8c728/PLAN-ci-safety-net.md).
The later live-tournament brief reused the filename, so this package links the exact
historical version instead of duplicating or mislabeling it.

## Five-stage implementation

| Stage | Commit | Outcome |
| --- | --- | --- |
| 0 | [`003c056`](https://github.com/eriic-builds/sled-mywcbracket/commit/003c0567d7b17c2673c6b8d2787e48614ae8c728) | Added the brief, hermetic golden fixtures, CI, repo guidance, and the pilot foundation. |
| 1 | [`97e3c67`](https://github.com/eriic-builds/sled-mywcbracket/commit/97e3c67) | Added pure share encode/decode, view-only shared brackets, aliases, malformed-link handling, and share tests. |
| 2 and 3 | [`22d4bb5`](https://github.com/eriic-builds/sled-mywcbracket/commit/22d4bb5) | Added local rivals, add-by-link, standings, pick differences, rename and remove controls, and comparison tests. |
| 4 | [`65d4019`](https://github.com/eriic-builds/sled-mywcbracket/commit/65d4019) | Made the leaderboard visible, added the landing pool card and demo path, and clarified privacy copy. |
| Report | [`bd5ca44`](https://github.com/eriic-builds/sled-mywcbracket/commit/bd5ca44) | Added the interactive stage-by-stage build story. |

## Main implementation

### Share links

`docs/js/share.js` owns a pure, versioned encoder and decoder:

```text
31 picks + display name + tiebreaker
               |
               v
UTF-8 JSON -> base64url -> #b=<payload>
```

The payload is in the URL fragment. Browsers do not send fragments in HTTP requests, so
GitHub Pages never receives a person's name or picks from the share link.

Opening a shared bracket is view-only. It does not overwrite the visitor's saved bracket or
what-if state. Invalid and unsupported payloads fail with a useful message and the bad hash
is removed.

### Local comparison

`docs/js/compare.js` stores rivals only in the recipient's browser. It:

- deduplicates by bracket content, not by display name
- caps the list at 20
- ranks by confirmed points, attainable points, then name
- shows undecided pick differences in points-at-stake order
- reuses the dashboard's scoring state instead of calculating a second score

There is no whole-pool export. A recipient cannot rebroadcast another person's bracket from
the app.

### Thin integration

`docs/js/main.js` wires share and comparison modules into the existing page. The new social
logic went around the render engine instead of rewriting it. `docs/js/storage.js` gained
stash and restore behavior so demo and shared previews do not destroy local what-if edits.

## Verification at delivery

The original delivery recorded:

| Gate | Result |
| --- | --- |
| Share unit checks | 10 of 10 |
| Compare unit checks | 12 of 12 |
| Share round-trip fuzzing | 500 generated brackets |
| Existing scoring and builder tests | Passed |
| Golden render snapshot | Passed with frozen inputs |
| Real Chrome share-to-leaderboard walk | Passed |
| GitHub Actions and Pages | Green |

The current repository test suite continues to cover share round trips, malformed payloads,
leaderboard scoring parity, ranking, differences, local pool backup, and the byte-locked
render output.

## Round 2

The pilot was promoted to `sled-mywcbracket` in commit
[`f60c0f2`](https://github.com/eriic-builds/sled-mywcbracket/commit/f60c0f2).
That round added non-destructive Home navigation and rebuilt the actual-path bracket so it
derives occupants from live results instead of following the owner's pick tree.

Commit [`ad380d4`](https://github.com/eriic-builds/sled-mywcbracket/commit/ad380d4)
updated the report and documented the revocation boundary: a link contains a copy of the
data, so it cannot be revoked after another person saves it. The alias field limits what a
sender reveals before sharing.

## Final report

Open the
[interactive build story](https://github.com/eriic-builds/sled-mywcbracket/tree/main/dev-docs/dev-reports/zero-backend-social-loop/)
for the full stage timeline, Technical Taste Council calls, code map, verification table,
and ELI5 explanations.
