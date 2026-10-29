/**
 * Animated weather over a canvas view: rain, thunderstorm with lightning,
 * snow, fog banks, heat shimmer, sandstorm streaks, falling ash, blood-moon
 * motes. Purely cosmetic and screen-space; the tints stay in the caller.
 */
const wrap = (v: number, m: number): number => ((v % m) + m) % m;

/** A cheap deterministic hash in 0..1 so each particle keeps its own lane. */
const lane = (i: number, salt: number): number => {
  const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

import { settings } from '../settings';
export function drawWeather(g: CanvasRenderingContext2D, weather: string, w: number, h: number, now: number): void {
  const t = now / 1000;
  g.save();
  switch (weather) {
    case 'rain':
    case 'storm': {
      const storm = weather === 'storm';
      const n = storm ? 200 : 130;
      g.strokeStyle = storm ? 'rgba(200,220,255,0.8)' : 'rgba(180,210,250,0.7)';
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const speed = (storm ? 620 : 420) * (0.8 + lane(i, 1) * 0.4);
        const x = wrap(lane(i, 2) * (w + 80) - t * (storm ? 160 : 90) * (0.8 + lane(i, 3) * 0.4), w + 80) - 40;
        const y = wrap(lane(i, 4) * h + t * speed, h + 30) - 15;
        g.moveTo(x, y);
        g.lineTo(x - (storm ? 5 : 3), y + (storm ? 14 : 10));
      }
      g.stroke();
      if (storm) {
        // A flash roughly every 7 seconds, with a quick second flicker.
        const c = t % 7;
        const flash = c < 0.12 ? 1 - c / 0.12 : c > 0.25 && c < 0.33 ? 0.5 * (1 - (c - 0.25) / 0.08) : 0;
        if (flash > 0 && !settings().reduceFlashing) {
          g.fillStyle = `rgba(220,230,255,${(flash * 0.35).toFixed(3)})`;
          g.fillRect(0, 0, w, h);
        }
      }
      break;
    }
    case 'snow': {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 90; i++) {
        const size = lane(i, 5) > 0.7 ? 3 : 2;
        const x = wrap(lane(i, 6) * w + Math.sin(t * 0.9 + i) * 16, w);
        const y = wrap(lane(i, 7) * h + t * (28 + lane(i, 8) * 36), h);
        g.fillRect(Math.round(x), Math.round(y), size, size);
      }
      break;
    }
    case 'fog': {
      for (let i = 0; i < 5; i++) {
        const y = (i + 0.5) * (h / 5) + Math.sin(t * 0.25 + i * 2) * 14;
        const x = wrap(t * (6 + i * 2) + i * 230, w + 400) - 400;
        const grad = g.createLinearGradient(x, 0, x + 400, 0);
        grad.addColorStop(0, 'rgba(210,214,224,0)');
        grad.addColorStop(0.5, 'rgba(210,214,224,0.3)');
        grad.addColorStop(1, 'rgba(210,214,224,0)');
        g.fillStyle = grad;
        g.fillRect(x, y - 34, 400, 68);
      }
      break;
    }
    case 'heatwave': {
      // Rising shimmer bands and a warm bloom from the top.
      const bloom = g.createLinearGradient(0, 0, 0, h * 0.5);
      bloom.addColorStop(0, 'rgba(255,210,120,0.16)');
      bloom.addColorStop(1, 'rgba(255,210,120,0)');
      g.fillStyle = bloom;
      g.fillRect(0, 0, w, h * 0.5);
      g.fillStyle = 'rgba(255,230,170,0.12)';
      for (let i = 0; i < 14; i++) {
        const y = wrap(h - (t * (18 + lane(i, 9) * 14) + lane(i, 10) * h), h);
        g.fillRect(lane(i, 11) * w, y, 30 + lane(i, 12) * 40, 2);
      }
      break;
    }
    case 'sandstorm': {
      g.fillStyle = 'rgba(232,192,120,0.16)';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(240,206,140,0.85)';
      for (let i = 0; i < 220; i++) {
        const x = wrap(lane(i, 13) * (w + 60) + t * (260 + lane(i, 14) * 180), w + 60) - 30;
        const y = lane(i, 15) * h + Math.sin(t * 2 + i) * 6;
        g.fillRect(x, y, 10 + lane(i, 16) * 16, 2);
      }
      break;
    }
    case 'ashfall': {
      for (let i = 0; i < 140; i++) {
        g.fillStyle = lane(i, 17) > 0.85 ? 'rgba(255,150,70,0.95)' : 'rgba(200,190,190,0.8)';
        const x = wrap(lane(i, 18) * w + Math.sin(t * 0.7 + i) * 20 + t * 12, w);
        const y = wrap(lane(i, 19) * h + t * (22 + lane(i, 20) * 30), h);
        g.fillRect(Math.round(x), Math.round(y), 3, 3);
      }
      break;
    }
    case 'blood-moon': {
      const vig = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
      vig.addColorStop(0, 'rgba(120,10,20,0)');
      vig.addColorStop(1, 'rgba(120,10,20,0.35)');
      g.fillStyle = vig;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,90,90,0.6)';
      for (let i = 0; i < 24; i++) {
        const x = wrap(lane(i, 21) * w + Math.sin(t * 0.5 + i) * 14, w);
        const y = wrap(lane(i, 22) * h - t * (10 + lane(i, 23) * 14), h);
        g.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      break;
    }
  }
  g.restore();
}
