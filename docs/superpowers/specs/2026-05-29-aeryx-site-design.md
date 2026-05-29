# aeryx.ai site design

Date: 2026-05-29
Status: approved, ready for implementation plan

## What this is

A single-page studio site for aeryx.ai, served on two domains: `aeryx.ai` (the studio) and `grigsby.dev` (the person). One page, two doors. It presents Guy Grigsby and the aeryx banner as a solo studio for agentic software, with an interactive terminal hero as the centerpiece.

## Goals

- Read as credible craft to people sizing Guy up to hire him: prospective clients and recruiters.
- Show the agentic/AI focus, not just describe it. The interactive pieces double as proof of capability.
- Stay honest: the projects are works in progress, framed as "what I'm building," not shipped products.
- Low friction, low spam contact path.

Primary action: get in touch (email or book a call).

## Identity and voice

- Hero identity line: **Guy Grigsby · aeryx**. Tagline: *a studio for agentic software*.
- Solo studio. Person plus shingle together. Resolves "I vs we" as: it's Guy, named, building under the aeryx banner.
- Falconry/flight naming runs through everything (jess, perch, talon, pluma, rookery). Lean into it as connective tissue, never gimmicky.

## Direction (chosen)

Interactive terminal hero (the spine) inside a restrained falconry-sky frame. The boids flock concept is reserved for the 404 page as an easter egg.

Palette: **Daybreak**. Bright open sky (off-white to pale blue), ink text, electric-blue accent, with the terminal rendered as a dark inset that glows against the light. Clean modern studio, not "hacker."

Motion: light sky parallax. All motion (parallax, boids, typewriter) gated behind `prefers-reduced-motion`.

## Stack and hosting

- **Astro**, static output. Ships near-zero JS by default; the two interactive pieces are isolated islands that hydrate independently.
- **Cloudflare Pages** for hosting. Cloudflare is already the domain registrar, so DNS and deploy live in one place. Cloudflare Scrape Shield is on as a second net for email obfuscation.
- Content model: each project is a Markdown/MDX entry in an Astro content collection. Single source of truth, consumed by both the terminal (`ls`, `cat`) and the static project section.
- License: MIT.

### Library decisions (build-from-scratch is deliberate)

- **Terminal hero**: custom, roughly 150 lines. `xterm.js` is a real PTY emulator for live shells, the wrong abstraction and too heavy for a scripted narrative terminal. A small command-dispatch plus typewriter is the right fit.
- **Boids (404)**: custom canvas, roughly 80 lines. Classic algorithm; a dependency would be overkill.
- Everything else leans on the platform: Cloudflare Pages, Scrape Shield, and a hosted Cal.com link for booking.

Note: rookery (the daemon+CLI service template) does not apply here. This is a static marketing site, not a daemon/CLI service.

## Bounded components

Each piece has one purpose, a clear interface, and is testable on its own.

1. **`Terminal` island** — command registry plus renderer. Knows nothing about styling or content. Takes a command map, reads input (typed or chip click), emits output.
2. **`commands` module** — pure data and functions backing each command. No DOM. Unit-testable in isolation.
3. **`projects` content collection** — the projects as Markdown front-matter. Single source of truth.
4. **`Sky` frame** — the Daybreak gradient and light parallax. Pure presentation.
5. **`Boids` island** — self-contained canvas animation, only on the 404 route.

## Routes

- `/` — the single page.
- `/404` — boids easter egg.

## Page structure (top to bottom)

1. **Hero** — Daybreak sky with light parallax. Identity line "Guy Grigsby · aeryx" and the tagline. The live terminal sits front and center, already booted.

2. **Terminal** — boots, auto-runs a short intro line, then shows clickable command chips (`ls`, `about`, `contact`, `book`) so non-typers never have to type. Typers get a real prompt. Commands:
   - `help` — lists commands.
   - `ls` / `cat <project>` — the projects, from the content collection.
   - `about` / `whoami` — the bio.
   - `contact` — assembles and reveals the email in JS (never in static HTML).
   - `book` — prints the Cal.com link.
   - `jess run --think` — a faux agent loop, a roughly 3-second "▸ planning… ▸ tool… ▸ done" flourish that shows agentic work.
   - `clear`, plus an easter egg or two.
   - Unknown input prints `command not found, try help`.

3. **Projects (static section)** — four shown openly:
   - **Talon** — fast, secure agent runtime.
   - **Jess** — agent harness with memory and skills.
   - **Perch** — daemon/CLI foundation.
   - **Rookery** — service template built on Perch.
   Each entry: name, a falconry-term gloss, a one-line description, a "work in progress" note, and a GitHub link. **Pluma is excluded from the page entirely.**

4. **About** — short bio. Software engineer at HashiCorp, based in Denver, focused on agentic/AI and Go. Link to grigsby.dev / blog.

5. **Contact / footer** — `contact` and `book` mirrored as plain buttons. GitHub, blog, and socials.

## Load-bearing principle: terminal is enhancement, not a gate

Everything the terminal reveals (projects, bio, email, booking) also exists in the static sections below it. Consequences:

- Recruiters who will not play with a terminal still get everything.
- Works with JS off and with screen readers.
- SEO sees real content, not an empty shell.

## Contact and spam

- Email is never in the static HTML. The `contact` command assembles the address in JS at the moment it runs (for example from parts: `guy` + `@` + `grigsby.dev`). Scrapers reading page source find nothing.
- Cloudflare Scrape Shield obfuscates any address it does find, as a second net.
- A Cal.com hosted link covers high-intent visitors and exposes no address.
- Both paths mirrored as visible buttons in the contact section, so neither is locked behind typing.

## Error handling and edges

- Unknown command handled in-terminal with a friendly hint.
- Email obfuscated (JS-assembled plus Scrape Shield).
- Boids and parallax are capped and gated behind `prefers-reduced-motion`.
- Terminal failure (JS error or JS off) degrades to the static sections; no information is lost.

## Testing

- `commands` module is pure, so unit tests cover each command's output.
- `Terminal` island gets a component test: chip click and typed input both render correct output.
- `astro build` runs in CI.
- Manual Lighthouse pass and a `prefers-reduced-motion` pass.

## Out of scope

- Pluma (private LLM chat) is not mentioned anywhere.
- No contact form or backend. No CMS. No blog hosted here (blog stays at grigsby.dev's existing setup if separate).
- No analytics decision made yet; can be added later via Cloudflare.

## Open items for the plan

- Exact copy for hero, bio, and each project gloss.
- Final socials list for the footer (GitHub confirmed; X/LinkedIn TBD).
- Cal.com account/link URL.
- Font choices for the Daybreak treatment (display grotesk plus mono).
