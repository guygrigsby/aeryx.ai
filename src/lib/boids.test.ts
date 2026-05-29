import { describe, it, expect } from 'vitest';
import { stepBoids, type Boid } from './boids';

const opts = { width: 100, height: 100, separation: 10, perception: 25, maxSpeed: 4 };

describe('stepBoids', () => {
  it('pushes two overlapping boids apart', () => {
    const before: Boid[] = [
      { x: 50, y: 50, vx: 0, vy: 0 },
      { x: 52, y: 50, vx: 0, vy: 0 },
    ];
    const distBefore = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
    const after = stepBoids(before, opts);
    const distAfter = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
    expect(distAfter).toBeGreaterThan(distBefore);
  });

  it('clamps speed to maxSpeed', () => {
    const after = stepBoids([{ x: 10, y: 10, vx: 999, vy: 999 }], opts);
    expect(Math.hypot(after[0].vx, after[0].vy)).toBeLessThanOrEqual(opts.maxSpeed + 1e-9);
  });

  it('returns the same number of boids', () => {
    const boids: Boid[] = Array.from({ length: 8 }, (_, i) => ({ x: i * 10, y: i * 10, vx: 1, vy: 0 }));
    expect(stepBoids(boids, opts).length).toBe(8);
  });
});
