import { describe, it, expect } from 'vitest';
import { projects } from './projects';

describe('projects', () => {
  it('lists exactly the public projects in order', () => {
    expect(projects.map((p) => p.slug)).toEqual(['jess', 'lmkit', 'lmkit-go']);
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
