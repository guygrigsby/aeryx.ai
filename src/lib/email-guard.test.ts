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
