# Zero-backend social loop brief

Intent (stable across sessions; code is the byproduct): let coworkers compare World Cup
brackets **without any central storage**, so nobody's name or picks are surfaced
anywhere they didn't personally opt into, and the whole thing costs $0.

## The loop

1. **Share**: I click "Share link", optionally edit the display name ("share as"),
   and send the URL to whoever I choose (chat, email).
2. **View**: opening the link renders my full live-scored dashboard for the recipient,
   view-only. Their own saved bracket and what-if edits are untouched.
3. **Add**: one button — "➕ Add to my leaderboard" — stores my bracket in *their*
   browser only.
4. **Compare**: their leaderboard ranks everyone they've added (plus themselves) by
   live score, with a per-rival "where we differ" list for undecided games.

There is no step 5. No server, no pool code, no registry.

## Wire format

`#b=<base64url(UTF-8 JSON {v:1, b:"<31 chars of 0|1>", n:"<display name>", t:<int tiebreaker>})>`

- Bit order = `deriveStructure(topology)`: r32codes(16) + r16codes(8) + qfcodes(4) +
  sfcodes(2) + finalcode(1). `0` = first team of `teamsFor(S, code, sel)` wins.
  Encode/decode must process codes in round order (later teams depend on earlier picks).
- Decode → `buildPicks()` → `validateAgainstTopology()`. Malformed/unsupported →
  friendly error, hash stripped via `history.replaceState`.
- `v` bumps on any breaking change; decoder rejects unknown `v` with a clear message.

## Behavioral invariants (each has a test or a manual check)

| # | Invariant | Verified by |
|---|---|---|
| 1 | encode→decode round-trips picks exactly (incl. emoji names) | `tests/share.mjs` (demo + 500 fuzz) |
| 2 | Opening a share link never mutates `wcb.fan.picks.v1` or what-if keys | manual two-browser E2E |
| 3 | Add is idempotent (dedupe by `hashPicks`), capped at 20 with a clear message | `tests/compare.mjs` + manual |
| 4 | Leaderboard numbers equal the dashboard's numbers for the same bracket | `tests/compare.mjs` ties them |
| 5 | Rank = confirmed desc, then attainable desc, then name asc | `tests/compare.mjs` |
| 6 | Diff lists undecided picks only, sorted by points at stake desc | `tests/compare.mjs` |
| 7 | No `fetch(`/network write in `share.js`/`compare.js`; rivals never appear in a URL | grep check in CI-less review |
| 8 | "Share as" alias changes only the display name in the link, never the picks | `tests/share.mjs` |
| 9 | Pool backup stays local; import replaces "my bracket" and merges missing rivals without duplicates | `tests/backup.mjs` |

## Decisions (deliberate, not omissions)

- **Private pool backup, not pool sharing.** "Back up my pool" may download the
  owner's bracket plus the rivals already saved on that device so the same user can
  recover or move their pool. The file is never uploaded or placed in a URL, and the
  UI warns that it contains other people's shared picks and should be kept private.
  There is still no "share whole pool" action.
- **No backend, even a tiny one.** Free tier today is a bill or a deprecation tomorrow;
  links + localStorage have no such cliff. Revisit only if real usage shows the manual
  link exchange failing socially.
- **Base64(JSON), not bit-packing.** ~80 chars fits any chat; debuggable with `atob()`.
- **Rivals cap = 20.** ~4 KB each; well inside localStorage quotas including Safari.
- **No share-link revocation.** A link IS the data (like an attachment); with no server
  there is nothing to revoke against, and even server-based revocation can't reach saved
  copies or screenshots. Mitigation is prevention: the "share as" alias keeps a real name
  out of the link entirely. If true revocation ever becomes a requirement, that is the
  one feature that justifies a tiny backend (links become references, deletable at the
  source) — deferred deliberately, not forgotten.
- **Bracket map "actual" view reads slots from results, not from the user's pick tree**
  (rebuilt Jul 8). Decided slot → real occupant (▲ if not your pick); undecided slot with
  a busted pick → a "Winner MXX" placeholder, never a blank. Locked by `tests/bracketmap.mjs`.

## Out of scope for the pilot

Automatic cross-device sync of rivals; editing a rival's bracket; notifications; any analytics.
