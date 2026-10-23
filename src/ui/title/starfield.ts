/**
 * Low-resolution animated backdrop for the title screen: twinkling stars
 * and embers drifting up from below. Uses Math.random because it is purely
 * cosmetic and must not disturb the game's seeded RNG.
 */
const W = 320;
const H = 180;

interface Star {
  x: number;
  y: number;
  phase: number;
  speed: number;
  bright: boolean;
}

interface Ember {
  x: number;
  y: number;
  vy: number;
  drift: number;
  life: number;
}

export function startStarfield(canvas: HTMLCanvasElement): () => void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const stars: Star[] = Array.from({ length: 90 }, () => ({
    x: Math.floor(Math.random() * W),
    y: Math.floor(Math.random() * H * 0.8),
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 2,
    bright: Math.random() < 0.15,
  }));
  const embers: Ember[] = [];

  let frame = 0;
  let last = performance.now();
  const tick = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#07050c');
    sky.addColorStop(0.6, '#140d1f');
    sky.addColorStop(1, '#2b1424');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const t = now / 1000;
    for (const s of stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.fillStyle = s.bright ? `rgba(255,230,170,${a})` : `rgba(200,190,255,${a * 0.8})`;
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.bright && a > 0.9) {
        ctx.fillRect(s.x - 1, s.y, 3, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 3);
      }
    }

    // Distant mountains, drawn as a stepped silhouette.
    ctx.fillStyle = '#0b0710';
    for (let x = 0; x < W; x += 2) {
      const h = 18 + Math.round(10 * Math.sin(x * 0.03) + 6 * Math.sin(x * 0.11 + 1.7));
      ctx.fillRect(x, H - h, 2, h);
    }

    if (Math.random() < 0.35) {
      embers.push({ x: Math.random() * W, y: H, vy: 8 + Math.random() * 14, drift: Math.random() * 6 - 3, life: 1 });
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i] as Ember;
      e.y -= e.vy * dt;
      e.x += Math.sin(t * 2 + e.drift) * 0.15 + e.drift * dt;
      e.life -= dt * 0.12;
      if (e.life <= 0 || e.y < 0) {
        embers.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(255,${120 + Math.floor(100 * e.life)},60,${e.life})`;
      ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    }

    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
