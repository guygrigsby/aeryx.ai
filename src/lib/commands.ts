import type { ProjectMeta } from './projects';
import type { ResearchItem } from './research';
import { resolveIntent } from './intents';

export interface CommandContext {
  projects: ProjectMeta[];
  research: ResearchItem[];
  hfProfile: string;
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

function help(): CommandResult {
  return {
    lines: [
      { text: 'available commands:', className: 'muted' },
      { text: '  ls            list the projects' },
      { text: '  cat <project> read about one project' },
      { text: '  about         who runs this studio' },
      { text: '  research      AI research and writeups' },
      { text: '  contact       reveal email' },
      { text: '  book          grab a call' },
      { text: '  jess run --think   watch an agent loop' },
      { text: '  clear         wipe the screen' },
    ],
  };
}

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
      { text: p.gloss ? `${p.name} — ${p.gloss}` : p.name, className: 'accent' },
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
      { text: 'Software engineer and AI researcher, in Denver.' },
      { text: 'Building agentic systems and AI tooling in Go.' },
      { text: 'The aeryx projects below are what I am shaping now.' },
    ],
  };
}

function research(ctx: CommandContext): CommandResult {
  const lines: OutputLine[] = [
    { text: 'AI research', className: 'accent' },
    { text: 'formal profile on Hugging Face', className: 'muted' },
    { text: ctx.hfProfile, className: 'link', href: ctx.hfProfile },
  ];
  for (const r of ctx.research) {
    lines.push({ text: '' });
    lines.push({ text: r.title });
    lines.push({ text: r.summary, className: 'muted' });
    lines.push({ text: 'writeup', className: 'link', href: r.writeupUrl });
  }
  lines.push({ text: 'more as they finish', className: 'muted' });
  return { lines };
}

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

export function runCommand(input: string, ctx: CommandContext): CommandResult {
  const trimmed = input.trim();
  if (trimmed === '') return { lines: [] };

  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = name.toLowerCase();

  switch (cmd) {
    case 'help':
      return help();
    case 'ls':
      return ls(ctx);
    case 'cat':
      return cat(args, ctx);
    case 'about':
    case 'whoami':
      return about();
    case 'research':
      return research(ctx);
    case 'contact':
      return contact(ctx);
    case 'book':
      return book(ctx);
    case 'jess':
      return jess(args);
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
    case 'clear':
      return { lines: [], clear: true };
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
  }
}
