import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|astro)$/.test(name) ? [p] : [];
  });
}

const attribution = '<p>Founded by <a href="https://grigsby.dev/">Guy Grigsby</a>.</p>';
const founderIdentity = `  founder: {
    '@type': 'Person',
    '@id': 'https://grigsby.dev/#person',
    name: 'Guy Grigsby',
    url: 'https://grigsby.dev/',
  },`;

function hasUnattributedName(file: string, source: string): boolean {
  let copy = source;
  if (file === join('pages', 'index.astro')) copy = copy.replace(attribution, '');
  if (file === join('layouts', 'Base.astro')) {
    copy = copy.replace(/^---\r?\n[\s\S]*?\r?\n---/, (frontmatter) =>
      frontmatter.replace(founderIdentity, ''),
    );
  }
  return /Guy Grigsby|Guy's/.test(copy);
}

// The site speaks as the studio. Intent patterns in intents.ts still accept
// "guy" as something a visitor types, so this guards the copy and not the
// inputs. Only the exact homepage attribution and Base layout's founder
// identity block are exempt; all other copy and frontmatter stay checked.
describe('studio voice', () => {
  it('keeps personal names out of the copy beyond the founder attribution', () => {
    const src = join(import.meta.dirname, '..');
    const offenders = walk(src)
      .filter((f) => !f.endsWith('voice.test.ts'))
      .filter((f) => hasUnattributedName(relative(src, f), readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it.each([
    ['attribution on another page', 'pages/privacy.astro', attribution],
    ['identity in another layout', 'layouts/Policy.astro', `---\n${founderIdentity}\n---`],
    ['identity outside frontmatter', 'layouts/Base.astro', founderIdentity],
    ['unrelated frontmatter copy', 'layouts/Base.astro', `---\n${founderIdentity}\nconst label = 'Guy Grigsby';\n---`],
    ['another name in the bio', 'pages/index.astro', `${attribution}\n<p>Guy Grigsby</p>`],
    ['repeated attribution', 'pages/index.astro', `${attribution}\n${attribution}`],
    ['possessive name', 'lib/site.ts', "Guy's studio"],
  ])('rejects %s', (_case, file, source) => {
    expect(hasUnattributedName(file, source)).toBe(true);
  });
});
