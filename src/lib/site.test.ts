import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { apps, contactAddress, footerLinks, legalName, supportAddress } from './site';

describe('site contact', () => {
  it('joins the support address from its parts', () => {
    expect(supportAddress()).toBe('support@aeryx.ai');
  });

  it('sends new work to hello@, not to the support channel', () => {
    expect(contactAddress()).toBe('hello@aeryx.ai');
    expect(contactAddress()).not.toBe(supportAddress());
  });
});

describe('footer links', () => {
  it('offers privacy, support and github', () => {
    expect(footerLinks.map((l) => l.label)).toEqual(['privacy', 'support', 'github']);
  });

  it('points privacy at the page that exists', () => {
    const privacy = footerLinks.find((l) => l.label === 'privacy');
    expect(privacy?.href).toBe('/privacy');
    const page = join(import.meta.dirname, '..', 'pages', 'privacy.astro');
    expect(() => readFileSync(page, 'utf8')).not.toThrow();
  });

  it('makes support a mailto so the App Store contact link works', () => {
    const support = footerLinks.find((l) => l.label === 'support');
    expect(support?.href).toBe(`mailto:${supportAddress()}`);
  });

  it('marks off-site links external so they get rel=noopener', () => {
    const github = footerLinks.find((l) => l.label === 'github');
    expect(github?.external).toBe(true);
  });
});

// The Sky gradient is fixed and overhangs the page bottom, so without these two
// declarations it paints and hit-tests over the footer and swallows its links.
// jsdom has no layout or stacking, so the real check was a browser click and
// this only guards the fix from being deleted.
describe('footer sits above the Sky backdrop', () => {
  const read = (rel: string) => readFileSync(join(import.meta.dirname, '..', rel), 'utf8');

  it('keeps the gradient out of the hit test', () => {
    expect(read('components/Sky.astro')).toMatch(/pointer-events:\s*none/);
  });

  it('gives the footer its own stacking context', () => {
    const css = read('components/SiteFooter.astro');
    expect(css).toMatch(/position:\s*relative/);
    expect(css).toMatch(/z-index:\s*1/);
  });
});

// Apple rejects a policy that does not answer these, so they are asserted
// against the page source rather than left to a later reread.
describe('privacy policy page', () => {
  const page = readFileSync(join(import.meta.dirname, '..', 'pages', 'privacy.astro'), 'utf8');

  it('names every app the policy covers', () => {
    for (const app of apps) expect(page).toContain(app);
  });

  it('names the company behind the apps, so the controller is identifiable', () => {
    expect(page).toContain('legalName');
    expect(legalName).toBe('Aeryx Industries LLC');
  });

  it('carries the support address in static markup, not assembled by script', () => {
    expect(page).toContain(supportAddress());
  });

  it('answers collection, sharing, retention, deletion and children', () => {
    const lower = page.toLowerCase();
    for (const topic of ['collect', 'third part', 'retain', 'delete', 'children']) {
      expect(lower).toContain(topic);
    }
  });
});
