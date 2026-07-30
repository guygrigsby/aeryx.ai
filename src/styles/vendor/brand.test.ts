import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

// Recorded from aeryx-brand. These files are vendored, never hand-edited.
// To take a brand change: `npm run brand`, then record the new hashes here in
// the same commit.
const VENDORED = {
  'src/styles/vendor/tokens.css': 'c90e84343130dbe4211732c25a14802f1884ef9c6daaf71d78c96497d0572ee0',
  'src/styles/vendor/brand.css': '801ed10627e631f7bd54bc2a84871abb20836c9cae5a658bbb9c339c828c83e6',
  'src/styles/vendor/fonts.css': '07d9da3710c06ccce6c6791dde1db2610e7e9cb2366b6176c278132038a0f296',
};

const FONTS = ['public/fonts/hack-regular.woff2', 'public/fonts/hack-bold.woff2'];

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
}

describe('vendored brand assets', () => {
  for (const [path, want] of Object.entries(VENDORED)) {
    it(`${path} matches the recorded hash`, () => {
      expect(sha256(path),
        `${path} does not match the hash recorded in src/styles/vendor/brand.test.ts.\n` +
        `Vendored brand files are never hand-edited. Change brand/ in the aeryx-brand repo, ` +
        `run \`npm run brand\`, and record the new hash here in the same commit.`,
      ).toBe(want);
    });
  }

  it('serves every font face declared in fonts.css', () => {
    const css = readFileSync(join(root, 'src/styles/vendor/fonts.css'), 'utf8');
    const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(existsSync(join(root, 'public', url)), `fonts.css loads ${url}, which is not served from public${url}`).toBe(true);
    }
  });

  it('ships the fonts the brand expects', () => {
    for (const f of FONTS) {
      expect(existsSync(join(root, f)), `${f} is missing; run \`npm run brand\``).toBe(true);
    }
  });
});
