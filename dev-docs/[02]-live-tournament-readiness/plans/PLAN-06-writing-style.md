# PLAN: Rewrite user-facing copy in the owner's writing style

**Rank: 6 of 6.** Voice polish across the app. The dashboard copy uses em dashes and long
clauses that do not match the owner's writing style. Rewrite the visible strings to the
style below. This overlaps ranks 2 and 3 because all three touch golden-locked `render.js`
copy, so coordinate the golden regeneration.

## Goal
Every visible string reads in the owner's voice: short, direct, active, second person, no em
dashes, no semicolons, no banned words. Numbers and behavior stay identical; only wording
changes.

## The style (apply exactly)
Do:
- Use clear, simple language. Be direct and informative.
- Write short, impactful sentences. Use active voice.
- Focus on practical, actionable points. Use data and examples when they fit.
- Address the reader as "you" and "your". Use bullet points where a list helps.

Do not:
- No em dashes anywhere. No emojis added to prose (existing section icons stay).
- Use commas or periods only. No semicolons. No asterisks. No hashtags.
- No "not just this, but also this" constructions. No cliches. No generalizations.
- No setup phrases like "in conclusion" or "in closing". No rhetorical questions.
- Remove unnecessary adjectives and adverbs. Avoid stop-start sentence patterns.

Banned words (do not use):
can, may, just, that, very, really, literally, actually, certainly, probably, basically,
could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine,
realm, game changer, unlock, discover, skyrocket, abyss, not alone, in a world where,
revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil,
pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking,
cutting edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark,
testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful,
inquiries, ever evolving.

## Exact files and the copy to rewrite
- `docs/js/render.js` (golden-locked). Rewrite the visible strings:
  - Section headers built by `shead(...)`: "Scorecard — your path, scored live",
    "Game facts — recent games", "How it played out", "Scoring & schedule", and the
    subtitles next to them. Remove the em dashes.
  - Hero copy (section `#intro`): "Backing <champ> — and still in it" / "— but knocked out",
    and the "<round> is <x> of <y> final — you're <c> of <d> right this round..." sentence.
  - The "How this is scored" note ("...update on their own — no refresh needed...").
  - Story card text in `storyCards` ("No games are final yet — your first results will land
    here...", card headings and bodies).
  - Scoring section prose ("Earned is the points... — they add up...", "Tiebreaker: total
    goals in the Final at the end of extra time — penalties don't count.", "Live results as
    of ... — auto-syncs a few times a day", the Sources footer).
- `docs/index.html` (not golden-locked, but `bracketmap.mjs`/other tests may read some ids):
  - Buttons and labels, the share popover text, landing cards ("Open my dashboard",
    "Upload my Excel"), and the search placeholder ("Track a team through the bracket — try
    England, Morocco, Paraguay…").

## Step-by-step
1. Inventory every visible string. Grep `render.js` and `index.html` for the em dash
   `\u2014` and for each banned word. Build a checklist of hits.
2. Rewrite each hit in the style above. Prefer splitting an em-dash clause into two short
   sentences. Replace "auto-syncs a few times a day — no refresh needed" with two sentences,
   for example "Scores update on their own. You do not need to refresh."
3. Keep every dynamic value and template expression (`${...}`) exactly as is. Only change the
   literal words around them.
4. Because `render.js` is golden-locked, run `node tests/golden.mjs --update` and commit
   `tests/fixtures/golden-sections.json`. If you also do ranks 2 and 3, do all render edits
   first, then update the golden once.
5. Re-grep the built output for the em dash and banned words. The only dashes left should be
   the score separator (see edge cases). Fix any remaining prose hits.

## Edge cases a weaker model will miss
- Do NOT remove the score separator. Match scores render with an en dash via the `DASH`
  constant, for example "Germany 1–0 Spain". That en dash (`\u2013`) is data formatting, not
  prose. Only remove em dashes (`\u2014`) used as clause separators in sentences.
- Do not touch check/cross/triangle glyphs (`\u2713`, `\u2715`, `\u25B2`) or section icon
  emoji. The style bans emojis in prose you write, not the existing status markers.
- Keep the meaning and every number identical. This is a wording pass, not a data change.
- Some strings appear in both the rail nav and a section header (for example "How it played
  out"). Update both so the nav and the section still match, or the scrollspy label mismatch
  will look broken.
- "Game facts — recent games" and similar headers pass through `shead`. Changing them changes
  the snapshot; that is expected, update the golden.
- Watch for the word "that" and "just" used as filler in the note copy; rephrase without
  changing meaning.

## Acceptance criteria
- A grep of the built page copy finds no em dash (`\u2014`) in prose and no banned word.
- Score lines still show the en dash separator ("1–0"), and status glyphs are unchanged.
- Every number, template value, and behavior is identical to before.
- `npm test` passes with an updated `tests/fixtures/golden-sections.json`.
