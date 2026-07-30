import { describe, it, expect, beforeEach } from 'vitest';
import { flockColor, FLOCK_FALLBACK } from './boids-mount';

describe('flockColor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.style.cssText = '';
  });

  it('reads the brand token so the flock cannot drift from the palette', () => {
    document.documentElement.style.setProperty('--aeryx-dim', '#73548f');
    const el = document.createElement('canvas');
    document.body.append(el);
    expect(flockColor(el)).toBe('#73548f');
  });

  it('falls back to the recorded dim value when the token is absent', () => {
    const el = document.createElement('canvas');
    document.body.append(el);
    expect(flockColor(el)).toBe(FLOCK_FALLBACK);
  });

  it('never falls back to a blue', () => {
    // The whole point of the repaint: nothing in the flock is blue any more.
    expect(FLOCK_FALLBACK.toLowerCase()).not.toBe('#5e9dff');
  });
});
