export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BoidOpts {
  width: number;
  height: number;
  separation: number;
  perception: number;
  maxSpeed: number;
}

function clampSpeed(b: Boid, max: number): void {
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > max && speed > 0) {
    b.vx = (b.vx / speed) * max;
    b.vy = (b.vy / speed) * max;
  }
}

/** One pure simulation step. Returns a new array; does not mutate the input. */
export function stepBoids(boids: Boid[], opts: BoidOpts): Boid[] {
  const next = boids.map((b) => ({ ...b }));

  for (let i = 0; i < next.length; i++) {
    const b = next[i];
    let sepX = 0, sepY = 0;
    let alignX = 0, alignY = 0;
    let cohX = 0, cohY = 0;
    let neighbors = 0;

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const o = boids[j];
      const d = Math.hypot(b.x - o.x, b.y - o.y);
      if (d > 0 && d < opts.separation) {
        sepX += (b.x - o.x) / d;
        sepY += (b.y - o.y) / d;
      }
      if (d < opts.perception) {
        alignX += o.vx;
        alignY += o.vy;
        cohX += o.x;
        cohY += o.y;
        neighbors++;
      }
    }

    b.vx += sepX * 0.5;
    b.vy += sepY * 0.5;
    if (neighbors > 0) {
      b.vx += (alignX / neighbors) * 0.05;
      b.vy += (alignY / neighbors) * 0.05;
      b.vx += (cohX / neighbors - b.x) * 0.005;
      b.vy += (cohY / neighbors - b.y) * 0.005;
    }

    clampSpeed(b, opts.maxSpeed);
    b.x = (b.x + b.vx + opts.width) % opts.width;
    b.y = (b.y + b.vy + opts.height) % opts.height;
  }

  return next;
}
