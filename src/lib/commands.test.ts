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
    expect(text).toContain('Streaming agent harness');
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
