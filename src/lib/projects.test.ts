import { describe, it, expect } from 'vitest';
import { projects, type ProjectMeta } from './projects';

describe('projects', () => {
  it('lists exactly the four public projects in order', () => {
    expect(projects.map((p) => p.slug)).toEqual(['talon', 'jess', 'perch', 'rookery']);
  });

  it('never includes pluma', () => {
    expect(projects.some((p) => p.slug === 'pluma')).toBe(false);
  });

  it('does not mention openclaw anywhere in talon copy', () => {
    const talon = projects.find((p) => p.slug === 'talon') as ProjectMeta;
    const blob = `${talon.gloss} ${talon.summary}`.toLowerCase();
    expect(blob.includes('openclaw')).toBe(false);
  });

  it('gives every project a github repo url', () => {
    for (const p of projects) {
      expect(p.repo).toMatch(/^https:\/\/github\.com\/guygrigsby\//);
    }
  });
});
