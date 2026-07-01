# Conversational terminal design

Status: approved 2026-07-01

## Goal

Replace the fixed-command terminal on the aeryx homepage with a conversational one:
it understands natural-language questions about Guy (what he builds, his research,
how to reach him) and answers from a fixed, correct set of responses. No LLM, no
backend, no new runtime dependency. The interaction reads like a chat; the look
stays a terminal.

The pitch is the mechanism: a visitor who stumps it gets an honest "I won't make
that up, there's no LLM here," not a fabricated answer. On a hire-me page for
someone selling safe agentic software, a bot that refuses to bullshit is the
impression to leave. The limitation is the feature.

## Non-goals

- No LLM call, no serverless function, no API key, no per-message cost.
- No fuzzy-match or NLP library. A regex intent table is enough.
- No visual redesign. The terminal chrome and CSS stay.

## Approach

Reuse the existing engine. `runCommand(input, ctx): CommandResult` in
`src/lib/commands.ts` already holds every correct answer (about, ls, cat, research,
contact, book). Add one layer in front that maps natural language to an existing
command. Literal commands keep working for anyone who pokes it like a real shell.

## Components

### `src/lib/intents.ts` (new)

`resolveIntent(input: string): string | null`. An ordered array of
`{ pattern: RegExp, command: string }`; first match wins; returns the canonical
command token or `null` on no match. One responsibility, fully unit-testable in
isolation.

Coverage (representative, not exhaustive):

- reach / email / contact / hire / "get in touch" / "talk to" -> `contact`
- book / call / meeting / schedule / "available" / availability -> `book`
- project / build / building / built / "working on" / "what do you make" -> `ls`
- research / paper / writeup / "hugging face" / model / ml -> `research`
- who / about / background / experience / "tell me about" / yourself -> `about`

Easter-egg intents resolve to their own tokens:

- `are you (an )?(ai|bot|chatgpt|llm|robot|real)` -> `honesty`
- `sudo hire`, `hire (guy|you)` -> `hire`
- `falcon`, `fly` -> `falcon`
- `man (guy|aeryx)` -> `man`

Konami is NOT here. It is a key sequence, not text, so it lives in the script layer.

### `src/lib/commands.ts`

- In the `default` branch (first token is not a known command), call
  `resolveIntent(trimmed)`. On a hit, dispatch that command. On a miss, return the
  honest fallback (below), not "command not found".
- Add handlers for the four egg tokens: `honesty`, `hire`, `falcon`, `man`.
- Contact and book handlers are unchanged. Those answers must stay deterministic
  and exact; they never route through anything lossy.

Honest fallback (replaces the current `command not found` for free-text misses):

> that one's not in what I know. I won't fake it, there is no LLM here, so no
> made-up answers. ask about Guy's work, projects, research, or how to reach him.

Honesty egg (`are you an ai?`):

> No. No LLM, no API bill, no invented facts. Just honest canned answers. Guy
> builds real agents, he just won't point a hallucinating one at his own resume.

Hire egg (`sudo hire guy`):

> permission granted. no password needed, just book a call, or guy@grigsby.dev

Falcon egg: small ASCII bird plus a one-line falconry-to-agent aside.

Man egg (`man guy`): a short mock man page (NAME / SYNOPSIS / DESCRIPTION).

### `src/scripts/terminal.ts`

- Add a keystroke buffer for the Konami sequence
  (up up down down left right left right b a). On match, dispatch an
  `aeryx:konami` CustomEvent on `window` and print the "flock scatters" line.
- Update the intro so it invites questions instead of dumping `help` (still keep a
  path to `help`).

### `src/scripts/boids-mount.ts`

Listen for `aeryx:konami` and scatter the flock, then let it reform. If the
scatter is more than a few lines against the existing boids sim, drop it: the
printed line already makes Konami "work," and the scatter is pure polish.

### `src/components/Terminal.astro`

- Replace the command chips with suggested questions: "what do you build?",
  "how do I reach you?", "what's your research?", "are you available?". Each chip
  submits its natural-language text, which the resolver maps.
- Drop the `jess run --think` chip. The animation stays reachable by typing the
  command; it is now an unadvertised egg.
- Tweak the intro copy to invite questions.

Rendering stays the terminal. The chat feel comes from natural language working
and a `>` prefix on response lines. Minimal CSS.

## Testing

Prove behavior, not just types.

- `src/lib/intents.test.ts` (new): representative phrasings map to the right
  command; clearly-unrelated input returns `null`.
- `src/lib/commands.test.ts`: a free-text miss returns the honest fallback (asserts
  it mentions there is no LLM and does NOT say "command not found"); each egg token
  returns its response; contact and book still return exact values.
- `src/scripts/terminal.test.ts`: a natural-language question submitted through the
  input renders the mapped answer; the Konami sequence dispatches `aeryx:konami`.

## Files touched

- `src/lib/intents.ts` (new)
- `src/lib/intents.test.ts` (new)
- `src/lib/commands.ts`
- `src/scripts/terminal.ts`
- `src/scripts/boids-mount.ts` (optional scatter)
- `src/components/Terminal.astro`
- `src/lib/commands.test.ts`, `src/scripts/terminal.test.ts`
