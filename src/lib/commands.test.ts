import { describe, it, expect } from 'vitest';
import { runCommand, type CommandContext } from './commands';
import { projects } from './projects';
import { research, hfProfile } from './research';

const ctx: CommandContext = {
  projects,
  research,
  hfProfile,
  email: { user: 'guy', domain: 'grigsby.dev' },
};

describe('runCommand core', () => {
  it('lists available commands for help', () => {
    const out = runCommand('help', ctx);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain('ls');
    expect(text).toContain('contact');
    expect(text).not.toContain('book');
  });

  it('signals clear', () => {
    const out = runCommand('clear', ctx);
    expect(out.clear).toBe(true);
    expect(out.lines).toEqual([]);
  });

  it('refuses gracefully instead of hallucinating on unknown input', () => {
    const out = runCommand('frobnicate the quux', ctx);
    const text = out.lines.map((l) => l.text).join('\n').toLowerCase();
    expect(text).not.toContain('command not found');
    expect(text).toContain("not an llm");
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

describe('runCommand info', () => {
  it('ls prints every project slug', () => {
    const out = runCommand('ls', ctx);
    const text = out.lines.map((l) => l.text).join(' ');
    for (const p of projects) expect(text).toContain(p.slug);
  });

  // Asserts against the project data rather than copies of it, so renaming a
  // project cannot break this test.
  it('cat <project> prints that project name, summary, and repo link', () => {
    const jess = projects.find((p) => p.slug === 'jess');
    expect(jess).toBeDefined();
    const out = runCommand('cat jess', ctx);
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain(jess!.name);
    expect(text).toContain(jess!.summary);
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.href).toBe(jess!.repo);
  });

  it('cat with an unknown project errors', () => {
    const out = runCommand('cat pluma', ctx);
    expect(out.lines[0].className).toBe('error');
  });

  it('cat with no argument lists usage', () => {
    const out = runCommand('cat', ctx);
    expect(out.lines[0].text.toLowerCase()).toContain('usage');
  });

  it('about and whoami both return the bio mentioning Denver', () => {
    for (const c of ['about', 'whoami']) {
      const text = runCommand(c, ctx).lines.map((l) => l.text).join('\n');
      expect(text).toContain('Denver');
    }
  });

  it('research links the Hugging Face profile and each writeup', () => {
    const out = runCommand('research', ctx);
    const links = out.lines.filter((l) => l.className === 'link');
    expect(links.some((l) => l.href === hfProfile)).toBe(true);
    for (const r of research) {
      expect(links.some((l) => l.href === r.writeupUrl)).toBe(true);
    }
    const text = out.lines.map((l) => l.text).join('\n');
    expect(text).toContain('Differential Transformer');
  });
});

describe('runCommand actions', () => {
  it('contact assembles the email from parts and exposes it as a mailto link', () => {
    const out = runCommand('contact', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const link = out.lines.find((l) => l.className === 'link');
    expect(link?.text).toBe(addr);
    expect(link?.href).toBe(`mailto:${addr}`);
  });

  it('book falls back to contact instead of a booking link', () => {
    const out = runCommand('book', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const links = out.lines.filter((l) => l.className === 'link');
    expect(links.map((l) => l.href)).toEqual([`mailto:${addr}`]);
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

  it('sudo hire guy offers the email and nothing to book', () => {
    const out = runCommand('sudo hire guy', ctx);
    const addr = `${ctx.email.user}@${ctx.email.domain}`;
    const links = out.lines.filter((l) => l.className === 'link');
    expect(links.map((l) => l.href)).toEqual([`mailto:${addr}`]);
    expect(out.lines.map((l) => l.text).join('\n')).not.toContain('book');
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
