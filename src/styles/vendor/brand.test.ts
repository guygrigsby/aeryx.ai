import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

// The aeryx-brand commit these files were fetched from. Kept in step with
// `config.brandRef` in package.json, which is what `npm run brand` fetches.
const BRAND_REF = 'f7f1e798e8dbde869e6e0c74e2818fdadad1762d';

// Recorded from aeryx-brand. These files are vendored, never hand-edited.
// To take a brand change: bump config.brandRef, `npm run brand`, then record
// the new ref and hashes here in the same commit.
const VENDORED = {
  'src/styles/vendor/tokens.css': '912c9596173109e4a97b985f098b91c4063c37fb75a6b6ddd392c6f6457914e8',
  'src/styles/vendor/brand.css': '3e05b7087141e1de0c5cb4e6741bf2419715485a3cefb1c2650b5f73b1c8e492',
  'src/styles/vendor/fonts.css': '07d9da3710c06ccce6c6791dde1db2610e7e9cb2366b6176c278132038a0f296',
};

const FONTS = ['public/fonts/hack-regular.woff2', 'public/fonts/hack-bold.woff2'];

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
}

describe('vendored brand assets', () => {
  it('pins the brand to an immutable commit', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const ref = pkg.config?.brandRef;
    expect(ref, 'package.json has no config.brandRef for `npm run brand` to fetch').toBeTruthy();
    expect(ref,
      `config.brandRef must be a full 40-character commit SHA, not a branch or tag. ` +
      `A mutable ref means the build can change without a commit here.`,
    ).toMatch(/^[0-9a-f]{40}$/);
    expect(ref,
      `package.json fetches aeryx-brand@${ref} but the hashes below were recorded from ${BRAND_REF}.\n` +
      `Fix: run \`npm run brand\` and record the new hashes, or restore the ref.`,
    ).toBe(BRAND_REF);
  });

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
