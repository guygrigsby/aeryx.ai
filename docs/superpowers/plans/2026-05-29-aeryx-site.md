# aeryx.ai Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page aeryx.ai studio site: a Daybreak-palette page with an interactive scripted terminal hero, static project/about/contact sections, and a boids easter-egg 404, deployed static to Cloudflare Pages.

**Architecture:** Astro with static output. All command logic lives in pure TypeScript modules (`src/lib/`) that are unit-tested in isolation; Astro components and a thin DOM controller consume them. The terminal is progressive enhancement: every piece of information it reveals also exists in static HTML sections below it, so the page works with JS off and for screen readers. A single typed `projects.ts` module is the one source of truth for project data, consumed by both the pure command layer and the Astro components.

**Tech Stack:** Astro, TypeScript, Vitest (jsdom), Cloudflare Pages. No runtime framework, no external fonts. Custom terminal (~150 lines) and boids canvas (~80 lines) instead of `xterm.js`/animation libs, because those are the wrong abstraction / overkill for a scripted narrative and a one-off animation.

---

## Design decisions worth knowing before you start

- **Single source of truth for projects** is `src/lib/projects.ts` (a typed array), NOT an Astro content collection. Reason: the pure command layer must be unit-testable with Vitest, and Astro content collections are build-time coupled and awkward to load in plain Vitest. The same typed array is imported directly by Astro components. This satisfies the spec's "single source of truth" while keeping the logic testable.
- **Pluma is excluded everywhere.** Four projects only: Talon, Jess, Perch, Rookery.
- **Talon copy must never mention "openclaw"** or name any other product it resembles. It is described only as "fast, secure agent runtime."
- **Email is never written into static HTML.** It is assembled at runtime in the bundled client JS from separate `user` and `domain` parts.
- **Fonts are system stacks** (no external requests): display = a system grotesk stack, mono = a system mono stack. This is a deliberate choice for speed and privacy; revisit only if the look needs a specific face.
- **All motion is gated** behind `prefers-reduced-motion: reduce`: typewriter, sky parallax, boids.

---

## File structure

Created files and their single responsibility:

- `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts` — project + test config.
- `src/lib/projects.ts` — typed project data (single source of truth) + `ProjectMeta` type.
- `src/lib/projects.test.ts` — asserts the four projects and the no-Pluma/no-openclaw invariants.
- `src/lib/commands.ts` — pure command registry and `runCommand(input, ctx)`. No DOM.
- `src/lib/commands.test.ts` — unit tests for every command.
- `src/lib/boids.ts` — pure `stepBoids(boids, opts)` simulation step + types.
- `src/lib/boids.test.ts` — unit test for separation behavior.
- `src/scripts/terminal.ts` — DOM controller: wires input + command chips to `runCommand`, renders output lines.
- `src/scripts/terminal.test.ts` — jsdom test of the controller.
- `src/styles/global.css` — Daybreak design tokens + base styles.
- `src/layouts/Base.astro` — html shell, meta, global styles.
- `src/components/Sky.astro` — Daybreak gradient frame + light parallax.
- `src/components/Terminal.astro` — terminal markup + mounts `terminal.ts`.
- `src/components/ProjectList.astro` — static project section, consumes `projects.ts`.
- `src/pages/index.astro` — assembles hero + terminal + static sections.
- `src/pages/404.astro` — boids canvas island.
- `src/scripts/boids-mount.ts` — mounts boids onto the 404 canvas.
- `public/_headers` — Cloudflare Pages security/cache headers.
- `public/favicon.svg` — simple falcon/feather mark.
- `README.md` — dev + deploy instructions.

---

### Task 1: Scaffold Astro + Vitest

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/lib/smoke.test.ts`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "aeryx-site",
  "type": "module",
  "version": "0.1.0",
  "license": "MIT",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  },
  "devDependencies": {
    "astro": "^5.0.0",
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aeryx.ai',
  output: 'static',
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "verbatimModuleSyntax": true
  }
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Write a smoke test at `src/lib/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Install and run the smoke test**

Run: `npm install && npm test`
Expected: PASS, 1 test passing.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src/lib/smoke.test.ts
git commit -m "chore: scaffold Astro project with Vitest"
```

---

### Task 2: Project data (single source of truth)

**Files:**
- Create: `src/lib/projects.ts`
- Test: `src/lib/projects.test.ts`

- [ ] **Step 1: Write the failing test at `src/lib/projects.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { projects, type ProjectMeta } from './projects';

describe('projects', () => {
  it('lists exactly the four public projects in order', () => {
    expect(projects.map((p) => p.slug)).toEqual(['talon', 'jess', 'perch', 'rookery']);
  });

  it('never includes pluma', () => {
    expect(projects.some((p) => p.slug === 'pluma')).toBe(false);
  });

  it('does not mention openclaw anywhere in talon copy', () => {
    const talon = projects.find((p) => p.slug === 'talon') as ProjectMeta;
    const blob = `${talon.gloss} ${talon.summary}`.toLowerCase();
    expect(blob.includes('openclaw')).toBe(false);
  });

  it('gives every project a github repo url', () => {
    for (const p of projects) {
      expect(p.repo).toMatch(/^https:\/\/github\.com\/guygrigsby\//);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/projects.test.ts`
Expected: FAIL, cannot find module `./projects`.

- [ ] **Step 3: Write `src/lib/projects.ts`**

```ts
export interface ProjectMeta {
  slug: string;
  name: string;
  /** falconry-term gloss, e.g. "the strap on the falcon's leg" */
  gloss: string;
  /** one-line description */
  summary: string;
  status: string;
  repo: string;
}

export const projects: ProjectMeta[] = [
  {
    slug: 'talon',
    name: 'Talon',
    gloss: 'the grip',
    summary: 'Fast, secure agent runtime.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/talon',
  },
  {
    slug: 'jess',
    name: 'Jess',
    gloss: "the strap on the falcon's leg",
    summary: 'Streaming agent-loop runtime with memory and skills.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/jess',
  },
  {
    slug: 'perch',
    name: 'Perch',
    gloss: 'where it rests',
    summary: 'Shared foundation for daemon and CLI apps: transport, config, lifecycle.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/perch',
  },
  {
    slug: 'rookery',
    name: 'Rookery',
    gloss: 'the nesting colony',
    summary: 'Service template that scaffolds a daemon and CLI on Perch.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/rookery',
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/projects.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/projects.ts src/lib/projects.test.ts
git commit -m "feat: add project data as single source of truth"
```

---

### Task 3: Command layer — core dispatch (`help`, `clear`, unknown)

**Files:**
- Create: `src/lib/commands.ts`
- Test: `src/lib/commands.test.ts`

- [ ] **Step 1: Write the failing test at `src/lib/commands.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { runCommand, type CommandContext } from './commands';
import { projects } from './projects';

const ctx: CommandContext = {
  projects,
  email: { user: 'guy', domain: 'grigsby.dev' },
  calLink: 'https://cal.com/guygrigsby',
};

describe('runCommand core', () => {
  it('lists available commands for help', () => {
    const out = runCommand('help', ctx);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain('ls');
    expect(text).toContain('contact');
    expect(text).toContain('book');
  });

  it('signals clear', () => {
    const out = runCommand('clear', ctx);
    expect(out.clear).toBe(true);
    expect(out.lines).toEqual([]);
  });

  it('handles unknown commands gracefully', () => {
    const out = runCommand('frobnicate', ctx);
    expect(out.lines[0].className).toBe('error');
    expect(out.lines[0].text.toLowerCase()).toContain('command not found');
  });

  it('treats empty input as a no-op', () => {
    const out = runCommand('   ', ctx);
    expect(out.lines).toEqual([]);
  });

  it('is case-insensitive and trims input', () => {
    const out = runCommand('  HELP  ', ctx);
    expect(out.lines.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: FAIL, cannot find module `./commands`.

- [ ] **Step 3: Write `src/lib/commands.ts`**

```ts
import type { ProjectMeta } from './projects';

export interface CommandContext {
  projects: ProjectMeta[];
  email: { user: string; domain: string };
  calLink: string;
}

export interface OutputLine {
  text: string;
  className?: 'muted' | 'accent' | 'error' | 'link';
  href?: string;
}

export interface CommandResult {
  lines: OutputLine[];
  /** when true, the controller wipes the screen before rendering */
  clear?: boolean;
  /** when set, the controller plays a scripted animation after the lines */
  animate?: 'agent-loop';
}

const COMMAND_NAMES = ['help', 'ls', 'cat', 'about', 'whoami', 'contact', 'book', 'jess', 'clear'];

function help(): CommandResult {
  return {
    lines: [
      { text: 'available commands:', className: 'muted' },
      { text: '  ls            list the projects' },
      { text: '  cat <project> read about one project' },
      { text: '  about         who runs this studio' },
      { text: '  contact       reveal email' },
      { text: '  book          grab a call' },
      { text: '  jess run --think   watch an agent loop' },
      { text: '  clear         wipe the screen' },
    ],
  };
}

export function runCommand(input: string, ctx: CommandContext): CommandResult {
  const trimmed = input.trim();
  if (trimmed === '') return { lines: [] };

  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = name.toLowerCase();

  switch (cmd) {
    case 'help':
      return help();
    case 'clear':
      return { lines: [], clear: true };
    default:
      return {
        lines: [
          { text: `command not found: ${name}. try help`, className: 'error' },
        ],
      };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands.ts src/lib/commands.test.ts
git commit -m "feat: add command dispatch with help, clear, unknown handling"
```

---

### Task 4: Command layer — info commands (`ls`, `cat`, `about`/`whoami`)

**Files:**
- Modify: `src/lib/commands.ts`
- Modify: `src/lib/commands.test.ts`

- [ ] **Step 1: Add failing tests to `src/lib/commands.test.ts`** (append inside the file, after the existing `describe`)

```ts
describe('runCommand info', () => {
  it('ls prints every project slug', () => {
    const out = runCommand('ls', ctx);
    const text = out.lines.map((l) => l.text).join(' ');
    for (const p of projects) expect(text).toContain(p.slug);
  });

  it('cat <project> prints that project name, summary, and repo link', () => {
    const out = runCommand('cat jess', ctx);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain('Jess');
    expect(text).toContain('Streaming agent-loop runtime');
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.href).toBe('https://github.com/guygrigsby/jess');
  });

  it('cat with an unknown project errors', () => {
    const out = runCommand('cat pluma', ctx);
    expect(out.lines[0].className).toBe('error');
  });

  it('cat with no argument lists usage', () => {
    const out = runCommand('cat', ctx);
    expect(out.lines[0].text.toLowerCase()).toContain('usage');
  });

  it('about and whoami both return the bio mentioning HashiCorp and Denver', () => {
    for (const c of ['about', 'whoami']) {
      const text = runCommand(c, ctx).lines.map((l) => l.text).join('\n');
      expect(text).toContain('HashiCorp');
      expect(text).toContain('Denver');
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: FAIL (ls/cat/about unimplemented; unknown-command branch hit instead).

- [ ] **Step 3: Implement in `src/lib/commands.ts`**

Add these helper functions above `runCommand`:

```ts
function ls(ctx: CommandContext): CommandResult {
  return {
    lines: [
      { text: ctx.projects.map((p) => p.slug).join('   '), className: 'accent' },
      { text: 'cat <project> for detail', className: 'muted' },
    ],
  };
}

function cat(args: string[], ctx: CommandContext): CommandResult {
  if (args.length === 0) {
    return { lines: [{ text: 'usage: cat <project>', className: 'muted' }] };
  }
  const p = ctx.projects.find((x) => x.slug === args[0].toLowerCase());
  if (!p) {
    return { lines: [{ text: `no such project: ${args[0]}. try ls`, className: 'error' }] };
  }
  return {
    lines: [
      { text: `${p.name} — ${p.gloss}`, className: 'accent' },
      { text: p.summary },
      { text: p.status, className: 'muted' },
      { text: p.repo, className: 'link', href: p.repo },
    ],
  };
}

function about(): CommandResult {
  return {
    lines: [
      { text: 'Guy Grigsby', className: 'accent' },
      { text: 'Software engineer at HashiCorp, in Denver.' },
      { text: 'Building agentic systems and AI tooling in Go.' },
      { text: 'The aeryx projects below are what I am shaping now.' },
    ],
  };
}
```

Then add cases to the `switch` in `runCommand` (before `default`):

```ts
    case 'ls':
      return ls(ctx);
    case 'cat':
      return cat(args, ctx);
    case 'about':
    case 'whoami':
      return about();
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands.ts src/lib/commands.test.ts
git commit -m "feat: add ls, cat, and about commands"
```

---

### Task 5: Command layer — action commands (`contact`, `book`, `jess run --think`)

**Files:**
- Modify: `src/lib/commands.ts`
- Modify: `src/lib/commands.test.ts`

- [ ] **Step 1: Add failing tests to `src/lib/commands.test.ts`**

```ts
describe('runCommand actions', () => {
  it('contact assembles the email from parts and exposes it as a mailto link', () => {
    const out = runCommand('contact', ctx);
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.text).toBe('guy@grigsby.dev');
    expect(link?.href).toBe('mailto:guy@grigsby.dev');
  });

  it('book prints the cal.com link', () => {
    const out = runCommand('book', ctx);
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.href).toBe('https://cal.com/guygrigsby');
  });

  it('jess run --think requests the agent-loop animation', () => {
    const out = runCommand('jess run --think', ctx);
    expect(out.animate).toBe('agent-loop');
  });

  it('bare jess hints at the run subcommand without animating', () => {
    const out = runCommand('jess', ctx);
    expect(out.animate).toBeUndefined();
    expect(out.lines.map((l) => l.text).join('\n').toLowerCase()).toContain('run --think');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: FAIL (contact/book/jess unimplemented).

- [ ] **Step 3: Implement in `src/lib/commands.ts`**

Add helpers above `runCommand`:

```ts
function contact(ctx: CommandContext): CommandResult {
  const addr = `${ctx.email.user}@${ctx.email.domain}`;
  return {
    lines: [
      { text: 'reach me at', className: 'muted' },
      { text: addr, className: 'link', href: `mailto:${addr}` },
    ],
  };
}

function book(ctx: CommandContext): CommandResult {
  return {
    lines: [
      { text: 'grab a slot', className: 'muted' },
      { text: ctx.calLink, className: 'link', href: ctx.calLink },
    ],
  };
}

function jess(args: string[]): CommandResult {
  if (args[0] === 'run' && args.includes('--think')) {
    return {
      lines: [{ text: 'jess: starting agent loop…', className: 'muted' }],
      animate: 'agent-loop',
    };
  }
  return { lines: [{ text: 'try: jess run --think', className: 'muted' }] };
}
```

Add cases to the `switch` (before `default`):

```ts
    case 'contact':
      return contact(ctx);
    case 'book':
      return book(ctx);
    case 'jess':
      return jess(args);
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/commands.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands.ts src/lib/commands.test.ts
git commit -m "feat: add contact, book, and jess agent-loop commands"
```

---

### Task 6: Boids simulation

**Files:**
- Create: `src/lib/boids.ts`
- Test: `src/lib/boids.test.ts`

- [ ] **Step 1: Write the failing test at `src/lib/boids.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { stepBoids, type Boid } from './boids';

const opts = { width: 100, height: 100, separation: 10, perception: 25, maxSpeed: 4 };

describe('stepBoids', () => {
  it('pushes two overlapping boids apart', () => {
    const before: Boid[] = [
      { x: 50, y: 50, vx: 0, vy: 0 },
      { x: 52, y: 50, vx: 0, vy: 0 },
    ];
    const distBefore = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
    const after = stepBoids(before, opts);
    const distAfter = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
    expect(distAfter).toBeGreaterThan(distBefore);
  });

  it('clamps speed to maxSpeed', () => {
    const after = stepBoids([{ x: 10, y: 10, vx: 999, vy: 999 }], opts);
    expect(Math.hypot(after[0].vx, after[0].vy)).toBeLessThanOrEqual(opts.maxSpeed + 1e-9);
  });

  it('returns the same number of boids', () => {
    const boids: Boid[] = Array.from({ length: 8 }, (_, i) => ({ x: i * 10, y: i * 10, vx: 1, vy: 0 }));
    expect(stepBoids(boids, opts).length).toBe(8);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/boids.test.ts`
Expected: FAIL, cannot find module `./boids`.

- [ ] **Step 3: Write `src/lib/boids.ts`**

```ts
export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BoidOpts {
  width: number;
  height: number;
  separation: number;
  perception: number;
  maxSpeed: number;
}

function clampSpeed(b: Boid, max: number): void {
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > max && speed > 0) {
    b.vx = (b.vx / speed) * max;
    b.vy = (b.vy / speed) * max;
  }
}

/** One pure simulation step. Returns a new array; does not mutate the input. */
export function stepBoids(boids: Boid[], opts: BoidOpts): Boid[] {
  const next = boids.map((b) => ({ ...b }));

  for (let i = 0; i < next.length; i++) {
    const b = next[i];
    let sepX = 0, sepY = 0;
    let alignX = 0, alignY = 0;
    let cohX = 0, cohY = 0;
    let neighbors = 0;

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const o = boids[j];
      const d = Math.hypot(b.x - o.x, b.y - o.y);
      if (d > 0 && d < opts.separation) {
        sepX += (b.x - o.x) / d;
        sepY += (b.y - o.y) / d;
      }
      if (d < opts.perception) {
        alignX += o.vx;
        alignY += o.vy;
        cohX += o.x;
        cohY += o.y;
        neighbors++;
      }
    }

    b.vx += sepX * 0.5;
    b.vy += sepY * 0.5;
    if (neighbors > 0) {
      b.vx += (alignX / neighbors) * 0.05;
      b.vy += (alignY / neighbors) * 0.05;
      b.vx += (cohX / neighbors - b.x) * 0.005;
      b.vy += (cohY / neighbors - b.y) * 0.005;
    }

    clampSpeed(b, opts.maxSpeed);
    b.x = (b.x + b.vx + opts.width) % opts.width;
    b.y = (b.y + b.vy + opts.height) % opts.height;
  }

  return next;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/boids.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/boids.ts src/lib/boids.test.ts
git commit -m "feat: add pure boids simulation step"
```

---

### Task 7: Terminal DOM controller

**Files:**
- Create: `src/scripts/terminal.ts`
- Test: `src/scripts/terminal.test.ts`

The controller is DOM-light: it takes element references and the context, and it renders synchronously (no typewriter delay) so it is testable. The typewriter/animation timing is layered on separately in the Astro component via options that default to instant in tests.

- [ ] **Step 1: Write the failing test at `src/scripts/terminal.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTerminal } from './terminal';
import { projects } from '../lib/projects';

const ctx = {
  projects,
  email: { user: 'guy', domain: 'grigsby.dev' },
  calLink: 'https://cal.com/guygrigsby',
};

function setup() {
  document.body.innerHTML = `
    <div id="screen"></div>
    <input id="input" />
  `;
  const screen = document.getElementById('screen') as HTMLElement;
  const input = document.getElementById('input') as HTMLInputElement;
  const term = createTerminal({ screen, input, ctx, instant: true });
  return { screen, input, term };
}

describe('createTerminal', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders output when a command is submitted', () => {
    const { screen, term } = setup();
    term.submit('ls');
    expect(screen.textContent).toContain('talon');
  });

  it('echoes the command as a prompt line', () => {
    const { screen, term } = setup();
    term.submit('help');
    expect(screen.textContent).toContain('help');
  });

  it('clears the screen on clear', () => {
    const { screen, term } = setup();
    term.submit('ls');
    term.submit('clear');
    expect(screen.textContent?.includes('talon')).toBe(false);
  });

  it('renders links as anchors with href', () => {
    const { screen, term } = setup();
    term.submit('contact');
    const a = screen.querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('mailto:guy@grigsby.dev');
  });

  it('runs a command on Enter from the input', () => {
    const { screen, input } = setup();
    input.value = 'about';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(screen.textContent).toContain('HashiCorp');
    expect(input.value).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/scripts/terminal.test.ts`
Expected: FAIL, cannot find module `./terminal`.

- [ ] **Step 3: Write `src/scripts/terminal.ts`**

```ts
import { runCommand, type CommandContext, type OutputLine } from '../lib/commands';

export interface TerminalOptions {
  screen: HTMLElement;
  input: HTMLInputElement;
  ctx: CommandContext;
  /** when true, no typewriter delay (used by tests) */
  instant?: boolean;
}

export interface Terminal {
  submit(raw: string): void;
}

function renderLine(line: OutputLine): HTMLElement {
  const el = document.createElement('div');
  el.className = `line ${line.className ?? ''}`.trim();
  if (line.href) {
    const a = document.createElement('a');
    a.href = line.href;
    a.textContent = line.text;
    if (line.href.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    el.appendChild(a);
  } else {
    el.textContent = line.text;
  }
  return el;
}

export function createTerminal(opts: TerminalOptions): Terminal {
  const { screen, input, ctx } = opts;

  function echo(raw: string): void {
    const el = document.createElement('div');
    el.className = 'line prompt';
    el.textContent = `aeryx ~ % ${raw}`;
    screen.appendChild(el);
  }

  function playAgentLoop(): void {
    const steps = ['▸ planning…', '▸ tool: search', '▸ tool: edit', '▸ done'];
    if (opts.instant) {
      for (const s of steps) screen.appendChild(renderLine({ text: s, className: 'accent' }));
      return;
    }
    steps.forEach((s, i) => {
      setTimeout(() => {
        screen.appendChild(renderLine({ text: s, className: 'accent' }));
        screen.scrollTop = screen.scrollHeight;
      }, (i + 1) * 700);
    });
  }

  function submit(raw: string): void {
    echo(raw);
    const result = runCommand(raw, ctx);
    if (result.clear) {
      screen.innerHTML = '';
      return;
    }
    for (const line of result.lines) screen.appendChild(renderLine(line));
    if (result.animate === 'agent-loop') playAgentLoop();
    screen.scrollTop = screen.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = input.value;
      input.value = '';
      submit(raw);
    }
  });

  return { submit };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/scripts/terminal.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/terminal.ts src/scripts/terminal.test.ts
git commit -m "feat: add terminal DOM controller"
```

---

### Task 8: Design tokens and base layout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/Base.astro`
- Create: `public/favicon.svg`

No automated test (pure presentation). Verified by build + manual check in Task 12.

- [ ] **Step 1: Write `src/styles/global.css`** (Daybreak tokens)

```css
:root {
  --sky-top: #eef3fb;
  --sky-bottom: #dce7f5;
  --ink: #16243d;
  --muted: #5b6b85;
  --accent: #2f6bff;
  --term-bg: #0c1322;
  --term-fg: #dce7f5;
  --term-muted: #6f87b3;
  --term-accent: #5e9dff;
  --term-error: #ff8d7a;
  --font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-display);
  color: var(--ink);
  background: var(--sky-bottom);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent); }

.wrap { max-width: 880px; margin: 0 auto; padding: 0 24px; }

h1, h2 { letter-spacing: -0.02em; font-weight: 800; }

.section { padding: 72px 0; }
.label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 2: Write `public/favicon.svg`** (simple feather mark)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M25 5C14 7 8 15 7 26c0 0 6-2 9-6 0 0-3 1-5 0 0 0 8-2 11-9 0 0-4 2-6 1 0 0 9-3 9-8z" fill="#2f6bff"/>
</svg>
```

- [ ] **Step 3: Write `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
interface Props { title: string; description?: string; }
const { title, description = 'A studio for agentic software, by Guy Grigsby.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx astro check`
Expected: 0 errors (warnings about unused are acceptable at this stage).

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/Base.astro public/favicon.svg
git commit -m "feat: add Daybreak design tokens and base layout"
```

---

### Task 9: Sky frame and Terminal component

**Files:**
- Create: `src/components/Sky.astro`
- Create: `src/components/Terminal.astro`

- [ ] **Step 1: Write `src/components/Sky.astro`**

```astro
---
// Daybreak gradient frame. Light parallax via a CSS variable updated on scroll;
// disabled under prefers-reduced-motion (see global.css).
---
<div class="sky">
  <div class="sky-grad" data-parallax></div>
  <slot />
</div>

<style>
  .sky { position: relative; isolation: isolate; }
  .sky-grad {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: linear-gradient(170deg, var(--sky-top) 0%, var(--sky-bottom) 70%);
    transform: translateY(calc(var(--scroll, 0) * -0.04px));
  }
</style>

<script>
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    const el = document.querySelector('[data-parallax]') as HTMLElement | null;
    if (el) {
      addEventListener('scroll', () => {
        el.style.setProperty('--scroll', String(window.scrollY));
      }, { passive: true });
    }
  }
</script>
```

- [ ] **Step 2: Write `src/components/Terminal.astro`**

The component renders the terminal shell, passes the context as a typed object to the client script, and runs an intro on load. Email parts stay separate; they are only joined inside the bundled JS at runtime.

```astro
---
import { projects } from '../lib/projects';

const ctx = {
  projects,
  email: { user: 'guy', domain: 'grigsby.dev' },
  calLink: 'https://cal.com/guygrigsby',
};
---
<div class="term" role="region" aria-label="interactive terminal">
  <div class="term-bar"><span></span><span></span><span></span> aeryx</div>
  <div id="screen" class="term-screen" aria-live="polite"></div>
  <div class="term-input-row">
    <span class="term-prompt">aeryx ~ %</span>
    <input id="input" class="term-input" autocomplete="off" spellcheck="false"
           aria-label="terminal command input" placeholder="type a command, or tap below" />
  </div>
  <div class="chips" role="group" aria-label="quick commands">
    <button class="chip" data-cmd="ls">ls</button>
    <button class="chip" data-cmd="about">about</button>
    <button class="chip" data-cmd="contact">contact</button>
    <button class="chip" data-cmd="book">book</button>
    <button class="chip" data-cmd="jess run --think">jess run --think</button>
  </div>
</div>

<script define:vars={{ ctx }}>
  import { createTerminal } from '../scripts/terminal.ts';

  const screen = document.getElementById('screen');
  const input = document.getElementById('input');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const term = createTerminal({ screen, input, ctx, instant: reduce });

  // intro
  term.submit('help');

  document.querySelectorAll('.chip').forEach((b) => {
    b.addEventListener('click', () => {
      term.submit(b.getAttribute('data-cmd'));
      input.focus();
    });
  });
</script>

<style>
  .term {
    background: var(--term-bg);
    color: var(--term-fg);
    border-radius: 12px;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    box-shadow: 0 24px 60px rgba(22, 36, 61, 0.22);
    overflow: hidden;
  }
  .term-bar { padding: 10px 14px; color: var(--term-muted); font-size: 0.75rem; }
  .term-bar span { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #2a3550; margin-right: 5px; }
  .term-screen { padding: 14px; min-height: 220px; max-height: 360px; overflow-y: auto; }
  .term-screen :global(.line) { white-space: pre-wrap; }
  .term-screen :global(.prompt) { color: var(--term-muted); }
  .term-screen :global(.muted) { color: var(--term-muted); }
  .term-screen :global(.accent) { color: var(--term-accent); }
  .term-screen :global(.error) { color: var(--term-error); }
  .term-screen :global(a) { color: var(--term-accent); }
  .term-input-row { display: flex; gap: 8px; padding: 8px 14px; border-top: 1px solid #1b263f; }
  .term-prompt { color: var(--term-muted); }
  .term-input { flex: 1; background: transparent; border: 0; color: var(--term-fg); font: inherit; outline: none; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 14px; }
  .chip { background: #16223c; color: var(--term-accent); border: 1px solid #243456; border-radius: 999px; padding: 4px 12px; font: inherit; font-size: 0.8rem; cursor: pointer; }
  .chip:hover { background: #1d2c4c; }
</style>
```

- [ ] **Step 3: Verify type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sky.astro src/components/Terminal.astro
git commit -m "feat: add sky frame and terminal component"
```

---

### Task 10: Static project section and home page

**Files:**
- Create: `src/components/ProjectList.astro`
- Create: `src/pages/index.astro`

This is the load-bearing accessibility piece: the static sections mirror everything the terminal reveals, so the page is whole with JS off.

- [ ] **Step 1: Write `src/components/ProjectList.astro`**

```astro
---
import { projects } from '../lib/projects';
---
<section class="section" id="projects">
  <div class="wrap">
    <p class="label">What I'm building</p>
    <h2>Projects</h2>
    <ul class="projects">
      {projects.map((p) => (
        <li class="project">
          <h3>{p.name} <span class="gloss">— {p.gloss}</span></h3>
          <p>{p.summary}</p>
          <p class="status">{p.status}</p>
          <a href={p.repo} target="_blank" rel="noopener">github →</a>
        </li>
      ))}
    </ul>
  </div>
</section>

<style>
  .projects { list-style: none; display: grid; gap: 28px; margin-top: 24px; }
  .project h3 { font-size: 1.2rem; }
  .gloss { color: var(--muted); font-weight: 400; font-style: italic; }
  .status { color: var(--muted); font-size: 0.85rem; }
</style>
```

- [ ] **Step 2: Write `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Sky from '../components/Sky.astro';
import Terminal from '../components/Terminal.astro';
import ProjectList from '../components/ProjectList.astro';

const calLink = 'https://cal.com/guygrigsby';
---
<Base title="aeryx — a studio for agentic software">
  <Sky>
    <header class="hero section">
      <div class="wrap">
        <p class="label">Guy Grigsby · aeryx</p>
        <h1>A studio for agentic software.</h1>
        <p class="lede">Agent runtimes, AI tooling, and the systems that hold them up. Built in Go, in Denver.</p>
        <div class="term-shell"><Terminal /></div>
      </div>
    </header>

    <ProjectList />

    <section class="section" id="about">
      <div class="wrap">
        <p class="label">About</p>
        <h2>Guy Grigsby</h2>
        <p>Software engineer at HashiCorp, based in Denver. Building agentic systems and AI tooling, mostly in Go. The projects above are works in progress, the things I'm shaping now.</p>
      </div>
    </section>

    <footer class="section" id="contact">
      <div class="wrap">
        <p class="label">Contact</p>
        <h2>Let's talk.</h2>
        <p>Hiring for a project, or just curious what I'm up to?</p>
        <div class="actions">
          <a class="btn" id="email-btn" href="#">email me</a>
          <a class="btn" href={calLink} target="_blank" rel="noopener">book a call</a>
          <a class="btn ghost" href="https://github.com/guygrigsby" target="_blank" rel="noopener">github</a>
        </div>
      </div>
    </footer>
  </Sky>

  <script>
    // assemble the email at runtime; never present in static HTML source
    const u = 'guy', d = 'grigsby.dev';
    const btn = document.getElementById('email-btn');
    if (btn) {
      btn.setAttribute('href', `mailto:${u}@${d}`);
      btn.textContent = `${u}@${d}`;
    }
  </script>

  <style>
    .hero { padding-top: 96px; }
    .hero h1 { font-size: clamp(2.2rem, 6vw, 3.6rem); margin: 6px 0 12px; }
    .lede { font-size: 1.15rem; color: var(--muted); max-width: 38ch; }
    .term-shell { margin-top: 40px; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
    .btn { display: inline-block; background: var(--accent); color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .btn.ghost { background: transparent; color: var(--ink); border: 1px solid var(--muted); }
  </style>
</Base>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds, `dist/index.html` exists.

- [ ] **Step 4: Verify the email is NOT in the static HTML**

Run: `! grep -q "guy@grigsby.dev" dist/index.html && echo OK-not-present`
Expected: prints `OK-not-present` (the literal address must not appear in built HTML; it is assembled at runtime).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectList.astro src/pages/index.astro
git commit -m "feat: add static project section and home page"
```

---

### Task 11: 404 page with boids easter egg

**Files:**
- Create: `src/scripts/boids-mount.ts`
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write `src/scripts/boids-mount.ts`**

```ts
import { stepBoids, type Boid, type BoidOpts } from '../lib/boids';

export function mountBoids(canvas: HTMLCanvasElement, count = 60): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  addEventListener('resize', resize);

  let boids: Boid[] = Array.from({ length: count }, (_, i) => ({
    x: (i * 37) % canvas.width,
    y: (i * 53) % canvas.height,
    vx: Math.cos(i) * 2,
    vy: Math.sin(i) * 2,
  }));

  let raf = 0;
  const loop = () => {
    const opts: BoidOpts = {
      width: canvas.width, height: canvas.height,
      separation: 18, perception: 50, maxSpeed: 3,
    };
    boids = stepBoids(boids, opts);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2f6bff';
    for (const b of boids) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
}
```

- [ ] **Step 2: Write `src/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="404 — aeryx">
  <main class="lost">
    <canvas id="flock" aria-hidden="true"></canvas>
    <div class="lost-copy">
      <h1>Off the perch.</h1>
      <p>This page flew the rookery. <a href="/">Back home →</a></p>
    </div>
  </main>

  <script>
    import { mountBoids } from '../scripts/boids-mount.ts';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.getElementById('flock');
    if (canvas && !reduce) mountBoids(canvas);
  </script>

  <style>
    .lost { position: relative; min-height: 100vh; display: grid; place-items: center; background: var(--term-bg); color: var(--term-fg); }
    #flock { position: absolute; inset: 0; width: 100%; height: 100%; }
    .lost-copy { position: relative; text-align: center; }
    .lost-copy h1 { font-size: clamp(2rem, 6vw, 3rem); }
    .lost-copy a { color: var(--term-accent); }
  </style>
</Base>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds, `dist/404.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/boids-mount.ts src/pages/404.astro
git commit -m "feat: add boids easter-egg 404 page"
```

---

### Task 12: Deploy config, README, and full verification

**Files:**
- Create: `public/_headers`
- Create: `README.md`

- [ ] **Step 1: Write `public/_headers`** (Cloudflare Pages security + cache headers)

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY

/favicon.svg
  Cache-Control: public, max-age=86400
```

- [ ] **Step 2: Write `README.md`**

```markdown
# aeryx.ai

Single-page studio site for aeryx.ai / grigsby.dev. Astro, static, deployed to Cloudflare Pages.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (Vitest)
npm run check    # type-check (astro check)
npm run build    # static build to dist/
```

## Deploy (Cloudflare Pages)

1. Push to the connected GitHub repo.
2. In Cloudflare Pages, create a project from the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Add custom domains `aeryx.ai` and `grigsby.dev` in the Pages project (Cloudflare is the registrar, so DNS is one click).
5. Scrape Shield (email obfuscation) is on by default; leave it on.

## Notes

- Project data lives in `src/lib/projects.ts` (single source of truth).
- The email address is never in static HTML; it is assembled in JS at runtime.
- All motion respects `prefers-reduced-motion`.
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS, all suites (projects, commands, boids, terminal).

- [ ] **Step 4: Type-check and build**

Run: `npm run check && npm run build`
Expected: 0 type errors; build succeeds; `dist/index.html`, `dist/404.html`, `dist/favicon.svg` present.

- [ ] **Step 5: Re-verify the email is not leaked in the build**

Run: `! grep -rq "guy@grigsby.dev" dist/ && echo OK-not-present`
Expected: prints `OK-not-present`.

- [ ] **Step 6: Manual check with `npm run preview`**

Run: `npm run preview`
Then in a browser confirm:
- Terminal boots with `help` output and command chips work.
- `ls`, `cat jess`, `contact`, `book`, `jess run --think` all behave.
- Static project/about/contact sections render below the hero.
- `/some-missing-url` shows the boids 404.
- Toggle OS "reduce motion" and confirm parallax/boids/typewriter stop.

- [ ] **Step 7: Commit**

```bash
git add public/_headers README.md
git commit -m "chore: add Cloudflare Pages config and README"
```

---

## Self-review notes

- **Spec coverage:** terminal hero (Tasks 3-5, 7, 9), Daybreak palette (Task 8), Sky/parallax (Task 9), four projects + no Pluma + no openclaw (Task 2, enforced by tests), static mirror sections (Task 10), JS-assembled email + verification it's absent from HTML (Tasks 5, 10, 12), Cal.com booking (Tasks 5, 10), boids 404 (Tasks 6, 11), reduced-motion gating (Tasks 8, 9, 11), Cloudflare Pages deploy (Task 12), testing strategy (every lib + controller has unit tests). All spec sections map to a task.
- **Type consistency:** `CommandContext`, `OutputLine`, `CommandResult`, `ProjectMeta`, `Boid`, `BoidOpts`, `createTerminal`/`TerminalOptions`, `runCommand`, `stepBoids`, `mountBoids` are each defined once and consumed with matching signatures across tasks.
- **No placeholders:** every code step contains complete code; all copy (hero, bio, glosses, summaries) is final text, not TBD.
- **Open spec items now resolved in-plan:** fonts (system stacks, Task 8), socials (GitHub + email + book only, Task 10), Cal.com URL (https://cal.com/guygrigsby), all project copy.
