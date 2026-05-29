import { describe, it, expect } from 'vitest';
import { research, hfProfile } from './research';

describe('research', () => {
  it('exposes the formal Hugging Face profile', () => {
    expect(hfProfile).toBe('https://huggingface.co/guygrigsby');
  });

  it('includes the diff-mlx writeup', () => {
    const item = research.find((r) => r.slug === 'diff-mlx');
    expect(item).toBeTruthy();
    expect(item?.writeupUrl).toMatch(/^https:\/\/github\.com\/guygrigsby\/diff-mlx\/.*final-writeup\.md$/);
  });

  it('gives every item a title, summary, and writeup url', () => {
    for (const r of research) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.summary.length).toBeGreaterThan(0);
      expect(r.writeupUrl).toMatch(/^https:\/\//);
    }
  });
});
