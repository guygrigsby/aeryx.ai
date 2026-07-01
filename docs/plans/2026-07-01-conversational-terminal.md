# Conversational terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage terminal into one that answers natural-language questions about Guy from a fixed, correct response set, with easter eggs and an honest no-LLM fallback.

**Architecture:** Reuse the existing `runCommand(input, ctx): CommandResult` engine, which already holds every correct answer. Add one layer in front: `resolveIntent(input)` maps natural language to an existing command token. Literal commands keep working. No LLM, no backend.

**Tech Stack:** TypeScript, Astro, Vitest, jsdom. No new runtime dependency.

## Global Constraints

- No LLM call, no serverless function, no API key, no per-message cost.
- No fuzzy-match or NLP library. A regex intent table only.
- Email stays unscrapeable: the joined `guy@grigsby.dev` must never appear as a
  string literal in any source, test, or doc. Every response showing the email
  assembles it at runtime from `ctx.email.{user, domain}`, the same path
  `contact()` uses.
- Node 22 (repo `.nvmrc`).
- Commit style: terse, verb-first, no dashes, no Claude/Anthropic attribution.
- Reference spec: `docs/specs/2026-07-01-conversational-terminal-design.md`.

---

### Task 1: Intent resolver

**Files:**
- Create: `src/lib/intents.ts`
- Test: `src/lib/intents.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveIntent(input: string): string | null` returning a canonical
  command token (`contact`, `book`, `ls`, `research`, `about`, `honesty`, `hire`,
  `falcon`, `man`, `hello`) or `null` on no match.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/intents.test.ts
import { describe, it, expect } from 'vitest';
import { resolveIntent } from './intents';

describe('resolveIntent', () => {
  it('maps contact phrasings to contact', () => {
    for (const s of ['how do I reach you?', 'what is your email', 'can I get in touch']) {
      expect(resolveIntent(s)).toBe('contact');
    }
  });

  it('maps booking phrasings to book', () => {
    for (const s of ['are you available?', 'can we schedule a call', 'book time']) {
      expect(resolveIntent(s)).toBe('book');
    }
  });

  it('maps build/project phrasings to ls', () => {
    for (const s of ['what do you build?', 'show me your projects', 'what are you working on']) {
      expect(resolveIntent(s)).toBe('ls');
    }
  });

  it('maps research phrasings to research', () => {
    for (const s of ['what is your research', 'any papers?', 'tell me about the attention work']) {
      expect(resolveIntent(s)).toBe('research');
    }
  });

  it('maps about phrasings to about', () => {
    for (const s of ['who are you', 'tell me about yourself', 'what is your background']) {
      expect(resolveIntent(s)).toBe('about');
    }
  });

  it('routes egg and greeting phrases to their tokens', () => {
    expect(resolveIntent('are you an AI?')).toBe('honesty');
    expect(resolveIntent('is this chatgpt')).toBe('honesty');
    expect(resolveIntent('sudo hire guy')).toBe('hire');
    expect(resolveIntent('man guy')).toBe('man');
    expect(resolveIntent('falcon')).toBe('falcon');
    expect(resolveIntent('hey')).toBe('hello');
  });

  it('returns null for input it cannot place', () => {
    expect(resolveIntent('frobnicate the quux')).toBeNull();
    expect(resolveIntent('   ')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/intents.test.ts`
Expected: FAIL, cannot resolve import `./intents`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/intents.ts
export interface Intent {
  pattern: RegExp;
  command: string;
}

// Ordered: first match wins. Specific egg and greeting patterns sit above the
// broad topic patterns so a precise phrase is not swallowed by a general one.
export const intents: Intent[] = [
  { pattern: /\bare you (an?\s+)?(ai|bot|chat\s?gpt|gpt|llm|robot|real|human|a person)\b/, command: 'honesty' },
  { pattern: /\bis this (chat\s?gpt|an? (ai|llm|bot))\b/, command: 'honesty' },
  { pattern: /\bsudo\s+hire\b|\bhire (you|guy|him)\b/, command: 'hire' },
  { pattern: /\bman\s+(guy|aeryx)\b/, command: 'man' },
  { pattern: /\b(falcon|fly)\b/, command: 'falcon' },
  { pattern: /^(hi|hey|hello|yo|howdy|sup|hiya)\b/, command: 'hello' },
  { pattern: /\b(email|e-mail|reach|contact|hire|get in touch|talk to|message|connect)\b/, command: 'contact' },
  { pattern: /\b(book|call|meeting|schedule|availab|free to|set up|chat with)\b/, command: 'book' },
  { pattern: /\b(research|paper|writeup|write-up|hugging\s?face|\bml\b|model|classifier|attention)\b/, command: 'research' },
  { pattern: /\b(project|build|building|built|working on|work on|make|made|creating|ship)\b/, command: 'ls' },
  { pattern: /\b(who|about|background|experience|yourself|resume|cv|bio|do you do|guy)\b/, command: 'about' },
];

export function resolveIntent(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  for (const { pattern, command } of intents) {
    if (pattern.test(s)) return command;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/intents.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intents.ts src/lib/intents.test.ts
git commit -m "Add natural-language intent resolver for terminal"
```

---

### Task 2: Intent-aware runCommand, honest fallback, egg handlers

**Files:**
- Modify: `src/lib/commands.ts`
- Test: `src/lib/commands.test.ts`

**Interfaces:**
- Consumes: `resolveIntent` from Task 1.
- Produces: `runCommand` now dispatches natural language via the resolver and, on a
  miss, returns the honest fallback. New command tokens handled: `honesty`, `hire`,
  `falcon`, `man`, `hello`. New internal helper `emailAddr(ctx)` shared by
  `contact()` and `hire()`.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/commands.test.ts`. Also REPLACE the existing
`handles unknown commands gracefully` test (asserts `command not found`) and the
existing `contact assembles the email...` test (hardcodes the joined address).

Replace the unknown-command test with:

```ts
  it('refuses gracefully instead of hallucinating on unknown input', () => {
    const out = runCommand('frobnicate the quux', ctx);
    const text = out.lines.map((l) => l.text).join('\n').toLowerCase();
    expect(text).not.toContain('command not found');
    expect(text).toContain('no llm');
  });
```

Replace the contact test with (builds the address from parts, no joined literal):

```ts
  it('contact assembles the email from parts and exposes it as a mailto link', () => {
    const out = runCommand('contact', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.text).toBe(addr);
    expect(link?.href).toBe(`mailto:${addr}`);
  });
```

Add a new describe block:

```ts
describe('runCommand natural language and eggs', () => {
  it('maps a plain-language contact question to the contact answer', () => {
    const out = runCommand('how do I reach you?', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.href).toBe(`mailto:${addr}`);
  });

  it('maps "what do you build" to the project list', () => {
    const text = runCommand('what do you build?', ctx).lines.map((l) => l.text).join(' ');
    expect(text).toContain('jess');
  });

  it('owns being deterministic when asked if it is an AI', () => {
    const text = runCommand('are you an AI?', ctx).lines.map((l) => l.text).join('\n').toLowerCase();
    expect(text).toContain('no llm');
  });

  it('sudo hire guy offers the booking link and the email', () => {
    const out = runCommand('sudo hire guy', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const links = out.lines.filter((l) => l.className === 'link');
    expect(links.some((l) => l.href === ctx.calLink)).toBe(true);
    expect(links.some((l) => l.href === `mailto:${addr}`)).toBe(true);
  });

  it('man guy prints a mock man page', () => {
    const text = runCommand('man guy', ctx).lines.map((l) => l.text).join('\n');
    expect(text).toContain('NAME');
  });

  it('falcon prints ascii flavor', () => {
    const out = runCommand('falcon', ctx);
    expect(out.lines.length).toBeGreaterThan(1);
  });

  it('hello greets and invites questions', () => {
    const text = runCommand('hello', ctx).lines.map((l) => l.text).join('\n').toLowerCase();
    expect(text).toContain('ask me anything');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: FAIL. New egg tokens hit the old `command not found` default; the
fallback and hire/man/falcon/hello lines do not exist yet.

- [ ] **Step 3: Implement**

In `src/lib/commands.ts`:

Add the import at the top:

```ts
import { resolveIntent } from './intents';
```

Add a shared helper and refactor `contact()` to use it:

```ts
function emailAddr(ctx: CommandContext): string {
  return `${ctx.email.user}@${ctx.email.domain}`;
}

function contact(ctx: CommandContext): CommandResult {
  const addr = emailAddr(ctx);
  return {
    lines: [
      { text: 'reach me at', className: 'muted' },
      { text: addr, className: 'link', href: `mailto:${addr}` },
    ],
  };
}
```

Add the new handlers:

```ts
function honesty(): CommandResult {
  return {
    lines: [
      { text: 'No LLM here.', className: 'accent' },
      { text: 'No API bill, no invented facts, just honest canned answers.' },
      { text: "Guy builds real agents, he just won't point a hallucinating one at his own resume.", className: 'muted' },
    ],
  };
}

function hire(ctx: CommandContext): CommandResult {
  const addr = emailAddr(ctx);
  return {
    lines: [
      { text: 'permission granted.', className: 'accent' },
      { text: 'no password needed, just book a call', className: 'muted' },
      { text: ctx.calLink, className: 'link', href: ctx.calLink },
      { text: addr, className: 'link', href: `mailto:${addr}` },
    ],
  };
}

function falcon(): CommandResult {
  return {
    lines: [
      { text: '   /\\', className: 'accent' },
      { text: '  <  >', className: 'accent' },
      { text: '   \\/', className: 'accent' },
      { text: 'a falcon is a trained hunter. so is a good agent.', className: 'muted' },
    ],
  };
}

function man(): CommandResult {
  return {
    lines: [
      { text: 'GUY(1)', className: 'muted' },
      { text: 'NAME', className: 'accent' },
      { text: '  guy grigsby, builds agentic software' },
      { text: 'SYNOPSIS', className: 'accent' },
      { text: '  guy [--go] [--agents] [--security]' },
      { text: 'DESCRIPTION', className: 'accent' },
      { text: '  Software engineer in Denver. Builds agent runtimes and AI tooling,' },
      { text: '  and helps teams put agentic development and security to work.' },
      { text: "  see 'ls', 'research', 'contact'.", className: 'muted' },
    ],
  };
}

function hello(): CommandResult {
  return {
    lines: [
      { text: 'ask me anything about Guy.', className: 'accent' },
      { text: "what he builds, his research, or how to reach him. type 'help' for commands.", className: 'muted' },
    ],
  };
}
```

Add cases to the switch in `runCommand`, and replace the `default` branch:

```ts
    case 'honesty':
      return honesty();
    case 'hire':
      return hire(ctx);
    case 'falcon':
      return falcon();
    case 'man':
      return man();
    case 'hello':
      return hello();
    default: {
      const resolved = resolveIntent(trimmed);
      if (resolved && resolved !== cmd) {
        return runCommand(resolved, ctx);
      }
      return {
        lines: [
          { text: "that one's not in what I know.", className: 'accent' },
          { text: "I won't fake it, there is no LLM here, so no made-up answers.", className: 'error' },
          { text: "ask about Guy's work, projects, research, or how to reach him.", className: 'muted' },
        ],
      };
    }
```

Note: the `man` intent passes the whole phrase (e.g. `man guy`) through the
default branch; `resolveIntent('man guy')` returns `'man'`, and `runCommand('man', ctx)`
hits the new `case 'man'`. The recursion depth is 1 because resolver tokens are
always known commands.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands.ts src/lib/commands.test.ts
git commit -m "Route natural language and eggs through runCommand; honest no-LLM fallback"
```

---

### Task 3: Konami sequence in the terminal script

**Files:**
- Modify: `src/scripts/terminal.ts`
- Test: `src/scripts/terminal.test.ts`

**Interfaces:**
- Consumes: existing `createTerminal(opts)`.
- Produces: pressing the Konami sequence in the input dispatches a
  `window` `CustomEvent('aeryx:konami')` and prints a line.

- [ ] **Step 1: Write the failing test**

Add to `src/scripts/terminal.test.ts` inside the `describe('createTerminal', ...)`:

```ts
  it('fires aeryx:konami on the konami sequence', () => {
    const { input } = setup();
    let fired = false;
    window.addEventListener('aeryx:konami', () => { fired = true; }, { once: true });
    const keys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    for (const key of keys) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
    expect(fired).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/scripts/terminal.test.ts`
Expected: FAIL, `fired` stays false.

- [ ] **Step 3: Implement**

In `src/scripts/terminal.ts`, add the sequence constant above `createTerminal`:

```ts
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
```

Inside `createTerminal`, after the existing Enter listener, add:

```ts
  const konamiBuf: string[] = [];
  input.addEventListener('keydown', (e) => {
    konamiBuf.push(e.key.toLowerCase());
    if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
    if (konamiBuf.length === KONAMI.length && KONAMI.every((k, i) => konamiBuf[i] === k)) {
      konamiBuf.length = 0;
      window.dispatchEvent(new CustomEvent('aeryx:konami'));
      screen.appendChild(renderLine({ text: 'the flock scatters across the sky, then reforms. nicely done.', className: 'accent' }));
      screen.scrollTop = screen.scrollHeight;
    }
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/scripts/terminal.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/terminal.ts src/scripts/terminal.test.ts
git commit -m "Add hidden konami sequence to terminal"
```

---

### Task 4: Boids scatter reacts to konami

**Files:**
- Modify: `src/scripts/boids-mount.ts`

**Interfaces:**
- Consumes: the `aeryx:konami` event from Task 3.
- Produces: on that event, the flock velocities are bumped so it scatters, then
  `stepBoids` renormalizes it back over the next frames.

No unit test: this is a trivial velocity bump against a canvas/RAF loop that jsdom
cannot render. Verify by build and eye (Task 6 final check).

- [ ] **Step 1: Implement**

In `src/scripts/boids-mount.ts`, after the `boids` array is initialized (right
after the `let boids = ...` block), add:

```ts
  addEventListener('aeryx:konami', () => {
    boids = boids.map((b, i) => ({ ...b, vx: Math.cos(i * 1.7) * 12, vy: Math.sin(i * 1.7) * 12 }));
  });
```

- [ ] **Step 2: Verify it type-checks and builds**

Run: `npx astro build`
Expected: build completes with no type error.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/boids-mount.ts
git commit -m "Scatter the boid flock on konami"
```

---

### Task 5: Suggested-question chips and conversational intro

**Files:**
- Modify: `src/components/Terminal.astro`

**Interfaces:**
- Consumes: the `hello` command (Task 2) and the resolver (Task 1) via the chips.
- Produces: the visible UI now shows natural-language suggestions and boots with a
  greeting instead of a command dump. The `jess run --think` chip is gone; the
  animation stays reachable by typing.

No unit test: markup, covered by build and the existing terminal tests (which drive
`createTerminal` directly, not the Astro intro).

- [ ] **Step 1: Implement the chip swap**

In `src/components/Terminal.astro`, replace the `.chips` block:

```html
  <div class="chips" role="group" aria-label="suggested questions">
    <button class="chip" data-cmd="what do you build?">what do you build?</button>
    <button class="chip" data-cmd="how do I reach you?">how do I reach you?</button>
    <button class="chip" data-cmd="what's your research?">research</button>
    <button class="chip" data-cmd="are you available?">are you available?</button>
  </div>
```

- [ ] **Step 2: Swap the intro command**

In the same file's client `<script>`, change the intro line:

```ts
    // intro
    term.submit('hello');
```

Also update the input `placeholder` for the conversational framing:

```html
    <input id="input" class="term-input" autocomplete="off" spellcheck="false"
           aria-label="terminal command input" placeholder="ask a question, or tap below" />
```

- [ ] **Step 3: Verify build and existing terminal tests still pass**

Run: `npx astro build && npx vitest run src/scripts/terminal.test.ts`
Expected: build completes; terminal tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Terminal.astro
git commit -m "Swap terminal chips to suggested questions; conversational intro"
```

---

### Task 6: Email scrape-protection guard and full verification

**Files:**
- Create: `src/lib/email-guard.test.ts`

**Interfaces:**
- Consumes: the whole `src/` tree.
- Produces: a test that fails if any `.ts`/`.astro` source file contains the joined
  address as a literal.

- [ ] **Step 1: Write the guard test**

```ts
// src/lib/email-guard.test.ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|astro)$/.test(name)) out.push(p);
  }
  return out;
}

describe('email scrape protection', () => {
  it('never stores the joined address as a literal in source', () => {
    // needle built from fragments so this file does not itself contain it
    const needle = 'guy' + '@' + 'grigsby' + '.dev';
    const srcRoot = join(import.meta.dirname, '..');
    const offenders = walk(srcRoot).filter((f) => readFileSync(f, 'utf8').includes(needle));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the guard and the full suite**

Run: `npx vitest run`
Expected: PASS across all files. If the guard reports offenders, fix each to
assemble the address from `ctx.email` parts (Task 2 already fixed `contact()` and
the two affected tests; a fresh offender means a literal slipped in).

- [ ] **Step 3: Full build check**

Run: `npx astro build`
Expected: 2 pages built, no error.

- [ ] **Step 4: Manual behavior check**

Run: `npx astro dev`, open the site, and confirm:
- typing `what do you build?` lists jess / lmkit / lmkit-go
- typing `how do I reach you?` shows the email and booking link
- typing `are you an AI?` returns the no-LLM answer
- typing `frobnicate` returns the honest fallback, not "command not found"
- the konami sequence scatters the background flock
- no `jess run --think` chip is visible, but typing it still animates

- [ ] **Step 5: Commit**

```bash
git add src/lib/email-guard.test.ts
git commit -m "Guard against joined email literal in source"
```

---

## Notes for the implementer

- Run tests with `npx vitest run <path>` (single file) or `npx vitest run` (all).
- The response answers already exist and are correct; do not rewrite `about`, `ls`,
  `cat`, `research`, `contact`, `book`, or `jess`. This work only adds the resolver,
  the fallback, the eggs, and the UI/intro swap.
- Keep the terminal look. No CSS redesign beyond what the tasks specify.
