import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const rules = readFileSync(join(root, 'public', '_redirects'), 'utf8')
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.trim().split(/\s+/));

// Sock's pages live at joinsock.com. Old links (search results, earlier app
// builds, past review notes) must land on the same page there, not a 404.
describe('sock moved to joinsock.com', () => {
  it.each([
    ['/sock', 'https://joinsock.com/'],
    ['/sock/', 'https://joinsock.com/'],
    ['/sock/terms', 'https://joinsock.com/terms/'],
    ['/sock/terms/', 'https://joinsock.com/terms/'],
    ['/sock/privacy', 'https://joinsock.com/privacy/'],
    ['/sock/privacy/', 'https://joinsock.com/privacy/'],
    ['/sock/support', 'https://joinsock.com/support/'],
    ['/sock/support/', 'https://joinsock.com/support/'],
  ])('%s redirects permanently to %s', (from, to) => {
    expect(rules).toContainEqual([from, to, '301']);
  });

  it('sends anything else under /sock to the joinsock.com home', () => {
    expect(rules.at(-1)).toEqual(['/sock/*', 'https://joinsock.com/', '301']);
  });

  it('serves no sock pages of its own that would shadow the redirects', () => {
    expect(existsSync(join(root, 'src', 'pages', 'sock'))).toBe(false);
    expect(existsSync(join(root, 'public', 'sock'))).toBe(false);
  });
});
