import { describe, it, expect } from 'vitest';
import { projects } from './projects';

describe('projects', () => {
  it('lists exactly the public projects in order', () => {
    expect(projects.map((p) => p.slug)).toEqual(['jess', 'lmkit', 'lmkit-go', 'ago']);
  });

  it('points ago at its own site as well as the repo', () => {
    const ago = projects.find((p) => p.slug === 'ago');
    expect(ago?.site).toBe('https://ago.aeryx.ai');
  });

  it('never includes pluma', () => {
    expect(projects.some((p) => p.slug === 'pluma')).toBe(false);
  });

  it('gives every project a github repo url', () => {
    for (const p of projects) {
      expect(p.repo).toMatch(/^https:\/\/github\.com\/guygrigsby\//);
    }
  });
});
