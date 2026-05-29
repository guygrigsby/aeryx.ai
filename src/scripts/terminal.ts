import { runCommand, type CommandContext, type OutputLine } from '../lib/commands';

export interface TerminalOptions {
  screen: HTMLElement;
  input: HTMLInputElement;
  ctx: CommandContext;
  /** when true, no typewriter / animation delay (used by tests and reduced-motion) */
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
