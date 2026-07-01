import { stepBoids, type Boid, type BoidOpts } from '../lib/boids';

export function mountBoids(canvas: HTMLCanvasElement, count = 60): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  addEventListener('resize', resize);

  let boids: Boid[] = Array.from({ length: count }, (_, i) => ({
    x: (i * 37) % Math.max(canvas.width, 1),
    y: (i * 53) % Math.max(canvas.height, 1),
    vx: Math.cos(i) * 2,
    vy: Math.sin(i) * 2,
  }));

  addEventListener('aeryx:konami', () => {
    boids = boids.map((b, i) => ({ ...b, vx: Math.cos(i * 1.7) * 12, vy: Math.sin(i * 1.7) * 12 }));
  });

  let raf = 0;
  const loop = () => {
    const opts: BoidOpts = {
      width: canvas.width, height: canvas.height,
      separation: 18, perception: 50, maxSpeed: 3,
    };
    boids = stepBoids(boids, opts);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5e9dff';
    for (const b of boids) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
}
