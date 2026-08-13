import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|astro)$/.test(name) ? [p] : [];
  });
}

// The site speaks as the studio. Intent patterns in intents.ts still accept
// "guy" as something a visitor types, so this guards the copy and not the
// inputs, and it leaves github.com/guygrigsby alone because a URL is not prose.
describe('studio voice', () => {
  it('never signs the copy with a personal name', () => {
    const src = join(import.meta.dirname, '..');
    const offenders = walk(src)
      .filter((f) => !f.endsWith('voice.test.ts'))
      .filter((f) => /Guy Grigsby|Guy's/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
