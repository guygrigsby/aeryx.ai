import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sock, supportAddress } from './site';

const page = (name: string) =>
  readFileSync(join(import.meta.dirname, '..', 'pages', 'sock', `${name}.astro`), 'utf8');

// Apple reads these pages during review, and the app links to each by URL, so
// the requirements are asserted against the source instead of left to a reread.
describe('sock pages', () => {
  it('has the four pages the app and the listing link to', () => {
    for (const name of ['index', 'privacy', 'terms', 'support']) {
      expect(() => page(name)).not.toThrow();
    }
  });

  it('carries the support address in static markup on every page', () => {
    for (const name of ['index', 'privacy', 'terms', 'support']) {
      expect(page(name)).toContain(supportAddress());
    }
  });
});

describe('sock terms', () => {
  const terms = page('terms');

  it('states the version the app sends as accepted_terms_version', () => {
    expect(sock.termsVersion).toBe('2026-10-11');
    expect(terms).toContain('sock.termsVersion');
  });

  it('says there is no tolerance for objectionable content or abusive users', () => {
    expect(terms.toLowerCase()).toContain('no tolerance');
    expect(terms.toLowerCase()).toContain('abusive users');
  });

  it('commits to reviewing reports and removing violators', () => {
    expect(terms).toContain('24 hours');
    expect(terms.toLowerCase()).toContain('suspend');
  });

  it('names the company and the law it is under', () => {
    expect(terms).toContain('legalName');
    expect(terms).toContain('Colorado');
  });
});

describe('sock privacy policy', () => {
  const policy = page('privacy').toLowerCase();

  it('answers collection, sharing, retention, deletion and children', () => {
    for (const topic of ['collect', 'third part', 'kept', 'delete', 'children']) {
      expect(policy).toContain(topic);
    }
  });

  it('names the processors and the Sign in with Apple revocation', () => {
    expect(policy).toContain('render');
    expect(policy).toContain('revoke');
  });
});

describe('the aeryx privacy policy', () => {
  it('points Sock users at the Sock policy, which differs from it', () => {
    const shared = readFileSync(join(import.meta.dirname, '..', 'pages', 'privacy.astro'), 'utf8');
    expect(shared).toContain('/sock/privacy');
  });
});
