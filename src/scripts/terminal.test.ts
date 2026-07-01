import { describe, it, expect, beforeEach } from 'vitest';
import { createTerminal } from './terminal';
import { projects } from '../lib/projects';
import { research, hfProfile } from '../lib/research';

const ctx = {
  projects,
  research,
  hfProfile,
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
    expect(screen.textContent).toContain('jess');
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
