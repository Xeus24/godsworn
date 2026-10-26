import type { Biome } from '../../engine/world/types';

type Horizon = 'hills' | 'pines' | 'dunes' | 'peaks' | 'sea' | 'cavern' | 'volcano' | 'spires' | 'dungeon';
type Ground = 'grass' | 'stone' | 'sand' | 'snow' | 'shore' | 'ash' | 'void';

interface Scene {
  /** Sky gradient, top to bottom (caves and dungeons have a dark ceiling instead). */
  sky: [string, string];
  horizon: Horizon;
  far: string;
  near: string;
  ground: [string, string];
  speck: string;
  accent: string;
  floor: Ground;
}

const SCENES: Record<Biome, Scene> = {
  meadow: { sky: ['#4a6fa8', '#e8b88a'], horizon: 'hills', far: '#5a7a5a', near: '#4a6a4a', ground: ['#5f8a3a', '#3a5a22'], speck: '#7aa84a', accent: '#e8d860', floor: 'grass' },
  forest: { sky: ['#2f4a58', '#88a070'], horizon: 'pines', far: '#27442c', near: '#1c3322', ground: ['#3a6a2a', '#22401a'], speck: '#58883a', accent: '#8a5a3a', floor: 'grass' },
  cave: { sky: ['#0e0c14', '#2a2430'], horizon: 'cavern', far: '#1c1822', near: '#13101a', ground: ['#4a4450', '#2a2630'], speck: '#5e5664', accent: '#7ad0e0', floor: 'stone' },
  desert: { sky: ['#6aa0d0', '#f0d098'], horizon: 'dunes', far: '#d0a868', near: '#b8905a', ground: ['#d4bc8c', '#a89060'], speck: '#e8d4a0', accent: '#8a7050', floor: 'sand' },
  snow: { sky: ['#8fb4d8', '#e8eef4'], horizon: 'peaks', far: '#a8bcd0', near: '#c8d6e4', ground: ['#e8eef4', '#b8c4d0'], speck: '#ffffff', accent: '#8ac0e8', floor: 'snow' },
  coast: { sky: ['#4a80b8', '#d8e0d8'], horizon: 'sea', far: '#2a6aaa', near: '#1a5a9a', ground: ['#d8c8a0', '#a89870'], speck: '#f0e4c0', accent: '#ffffff', floor: 'shore' },
  volcanic: { sky: ['#2a1418', '#a8442a'], horizon: 'volcano', far: '#2a1a1e', near: '#1a1014', ground: ['#3a2e2e', '#1e1618'], speck: '#5a4a46', accent: '#ff6a2a', floor: 'ash' },
  citadel: { sky: ['#140e24', '#4a2a6a'], horizon: 'spires', far: '#1e1630', near: '#120c1e', ground: ['#2a2434', '#14101e'], speck: '#4a4058', accent: '#a050ff', floor: 'void' },
  dungeon: { sky: ['#0c0a10', '#26222c'], horizon: 'dungeon', far: '#2e2a34', near: '#1c1822', ground: ['#5a5460', '#2e2a34'], speck: '#6a6270', accent: '#e8a040', floor: 'stone' },
};

const HORIZON_Y = 260;

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Paints the battle backdrop for a biome into `g` (once; the scene reuses the canvas). */
export function paintBattlefield(g: CanvasRenderingContext2D, w: number, h: number, biome: Biome, night: boolean): void {
  const sc = SCENES[biome];
  const rand = rng(1337);
  const indoor = sc.horizon === 'cavern' || sc.horizon === 'dungeon';

  const sky = g.createLinearGradient(0, 0, 0, HORIZON_Y);
  sky.addColorStop(0, sc.sky[0]);
  sky.addColorStop(1, sc.sky[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, HORIZON_Y);

  paintHorizon(g, w, sc, rand);

  const ground = g.createLinearGradient(0, HORIZON_Y - 10, 0, h);
  ground.addColorStop(0, sc.ground[0]);
  ground.addColorStop(1, sc.ground[1]);
  g.fillStyle = ground;
  g.fillRect(0, HORIZON_Y - 10, w, h - HORIZON_Y + 10);

  paintFloor(g, w, h, sc, rand);

  if (night) {
    g.fillStyle = indoor ? 'rgba(6,6,20,0.25)' : 'rgba(8,10,44,0.5)';
    g.fillRect(0, 0, w, h);
    if (!indoor) {
      g.fillStyle = '#f4f0d8';
      for (let i = 0; i < 70; i++) g.fillRect((i * 131) % w, (i * 37) % 200, 2, 2);
    }
  }
}

function paintHorizon(g: CanvasRenderingContext2D, w: number, sc: Scene, rand: () => number): void {
  const y0 = HORIZON_Y;
  switch (sc.horizon) {
    case 'hills':
      g.fillStyle = sc.far;
      for (let x = 0; x < w; x += 4) {
        const hh = 40 + 20 * Math.sin(x * 0.01) + 12 * Math.sin(x * 0.037 + 2);
        g.fillRect(x, y0 - hh, 4, hh + 10);
      }
      break;
    case 'pines': {
      // Two layers of treeline: a distant dark band, then taller pines.
      g.fillStyle = sc.far;
      for (let x = 0; x < w; x += 4) g.fillRect(x, y0 - 52 - 8 * Math.sin(x * 0.02), 4, 70);
      g.fillStyle = sc.near;
      for (let x = -10; x < w + 10; x += 34) {
        const hh = 70 + rand() * 40;
        for (let r = 0; r < 6; r++) {
          const half = 6 + r * 4;
          g.fillRect(x + 17 - half, y0 - hh + r * (hh / 6), half * 2, hh / 6 + 1);
        }
        g.fillRect(x + 15, y0 - 6, 4, 14);
      }
      break;
    }
    case 'dunes':
      for (const [color, amp, base, f] of [[sc.far, 26, 50, 0.008], [sc.near, 18, 30, 0.014]] as const) {
        g.fillStyle = color;
        for (let x = 0; x < w; x += 4) g.fillRect(x, y0 - base - amp * Math.sin(x * f + base), 4, base + amp + 10);
      }
      // A pale sun.
      g.fillStyle = 'rgba(255,248,210,0.85)';
      g.beginPath();
      g.arc(760, 90, 26, 0, Math.PI * 2);
      g.fill();
      break;
    case 'peaks':
      for (const [color, hgt, step] of [[sc.far, 120, 180], [sc.near, 80, 130]] as const) {
        g.fillStyle = color;
        for (let x = -40; x < w + 40; x += step) {
          const ph = hgt * (0.7 + rand() * 0.5);
          g.beginPath();
          g.moveTo(x, y0 + 4);
          g.lineTo(x + step / 2, y0 - ph);
          g.lineTo(x + step, y0 + 4);
          g.fill();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.moveTo(x + step / 2, y0 - ph);
          g.lineTo(x + step / 2 - 14, y0 - ph + ph * 0.22);
          g.lineTo(x + step / 2 + 14, y0 - ph + ph * 0.22);
          g.fill();
          g.fillStyle = color;
        }
      }
      break;
    case 'sea': {
      g.fillStyle = sc.far;
      g.fillRect(0, y0 - 46, w, 56);
      g.fillStyle = sc.near;
      g.fillRect(0, y0 - 18, w, 28);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 50; i++) g.fillRect(Math.floor(rand() * w), y0 - 44 + Math.floor(rand() * 50), 10 + Math.floor(rand() * 14), 2);
      // A distant sail.
      g.fillStyle = '#f4f0e8';
      g.beginPath();
      g.moveTo(610, y0 - 44);
      g.lineTo(610, y0 - 78);
      g.lineTo(630, y0 - 44);
      g.fill();
      break;
    }
    case 'volcano': {
      g.fillStyle = sc.far;
      g.beginPath();
      g.moveTo(240, y0 + 4);
      g.lineTo(420, y0 - 150);
      g.lineTo(520, y0 - 150);
      g.lineTo(700, y0 + 4);
      g.fill();
      // Glow and lava in the crater, with a smoke plume.
      const glow = g.createRadialGradient(470, y0 - 150, 4, 470, y0 - 150, 90);
      glow.addColorStop(0, 'rgba(255,140,40,0.9)');
      glow.addColorStop(1, 'rgba(255,100,20,0)');
      g.fillStyle = glow;
      g.fillRect(360, y0 - 250, 220, 200);
      g.fillStyle = sc.accent;
      g.fillRect(430, y0 - 152, 80, 4);
      g.fillStyle = sc.near;
      for (let x = 0; x < w; x += 4) g.fillRect(x, y0 - 20 - 10 * Math.sin(x * 0.03), 4, 40);
      break;
    }
    case 'spires':
      g.fillStyle = sc.far;
      for (let x = 20; x < w; x += 90) {
        const hh = 70 + rand() * 120;
        g.fillRect(x, y0 - hh, 28, hh + 6);
        g.beginPath();
        g.moveTo(x - 4, y0 - hh);
        g.lineTo(x + 14, y0 - hh - 40);
        g.lineTo(x + 32, y0 - hh);
        g.fill();
      }
      g.fillStyle = sc.accent;
      for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rand() * w), Math.floor(rand() * 200), 2, 2);
      g.fillStyle = sc.near;
      g.fillRect(0, y0 - 14, w, 24);
      break;
    case 'cavern':
      // Rock walls with stalactites and a few glowing crystals.
      g.fillStyle = sc.far;
      g.fillRect(0, 0, w, y0 + 6);
      g.fillStyle = sc.near;
      for (let x = 0; x < w; x += 18) {
        const len = 30 + rand() * 90;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + 9, len);
        g.lineTo(x + 18, 0);
        g.fill();
      }
      g.fillStyle = sc.accent;
      for (let i = 0; i < 9; i++) {
        const x = 40 + Math.floor(rand() * (w - 80));
        const y = 150 + Math.floor(rand() * 90);
        g.fillRect(x, y, 6, 14);
        g.fillRect(x + 6, y + 6, 4, 8);
      }
      break;
    case 'dungeon': {
      // Brick wall with torches.
      g.fillStyle = sc.far;
      g.fillRect(0, 0, w, y0 + 6);
      g.fillStyle = sc.near;
      for (let row = 0; row * 22 < y0; row++) {
        const off = row % 2 ? 0 : 30;
        for (let x = -off; x < w; x += 60) g.fillRect(x + 2, row * 22 + 2, 56, 18);
      }
      for (const tx of [150, 480, 810]) {
        g.fillStyle = '#4a3a2a';
        g.fillRect(tx - 3, 120, 6, 40);
        const flame = g.createRadialGradient(tx, 112, 2, tx, 112, 70);
        flame.addColorStop(0, 'rgba(255,190,80,0.85)');
        flame.addColorStop(1, 'rgba(255,140,40,0)');
        g.fillStyle = flame;
        g.fillRect(tx - 70, 40, 140, 140);
        g.fillStyle = sc.accent;
        g.fillRect(tx - 4, 104, 8, 12);
      }
      break;
    }
  }
}

function paintFloor(g: CanvasRenderingContext2D, w: number, h: number, sc: Scene, rand: () => number): void {
  const yMin = HORIZON_Y + 2;
  const span = h - yMin - 8;
  const spot = (): [number, number] => [Math.floor(rand() * w), yMin + Math.floor(rand() * span)];
  switch (sc.floor) {
    case 'grass':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 240; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3, 3);
        g.fillRect(x + 3, y - 3, 3, 3);
        g.fillRect(x - 3, y - 2, 3, 3);
      }
      // Flowers, mushrooms or stones depending on the accent.
      g.fillStyle = sc.accent;
      for (let i = 0; i < 26; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 4, 4);
      }
      break;
    case 'stone':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 160; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3 + Math.floor(rand() * 3), 2);
      }
      // Flagstone seams that narrow toward the horizon.
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = yMin + 14, gap = 14; y < h; y += gap, gap += 6) g.fillRect(0, y, w, 2);
      g.fillStyle = sc.accent;
      for (let i = 0; i < 8; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3, 3);
      }
      break;
    case 'sand':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 120; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 10 + Math.floor(rand() * 14), 2);
      }
      g.fillStyle = sc.accent;
      for (let i = 0; i < 14; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 5, 3);
        g.fillRect(x + 1, y - 2, 3, 2);
      }
      break;
    case 'snow':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 160; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 6 + Math.floor(rand() * 10), 3);
      }
      g.fillStyle = sc.accent;
      for (let i = 0; i < 16; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3, 3);
      }
      break;
    case 'shore':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 150; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3, 2);
      }
      // Foam line where the surf meets the sand.
      g.fillStyle = sc.accent;
      for (let x = 0; x < w; x += 6) g.fillRect(x, yMin + 2 + Math.round(2 * Math.sin(x * 0.05)), 6, 2);
      break;
    case 'ash':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 160; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 3, 3);
      }
      // Glowing cracks.
      g.fillStyle = sc.accent;
      for (let i = 0; i < 14; i++) {
        let [x, y] = spot();
        for (let k = 0; k < 7; k++) {
          g.fillRect(x, y, 4, 2);
          x += 4;
          y += Math.floor(rand() * 5) - 2;
        }
      }
      break;
    case 'void':
      g.fillStyle = sc.speck;
      for (let i = 0; i < 140; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 4, 2);
      }
      g.fillStyle = sc.accent;
      for (let i = 0; i < 30; i++) {
        const [x, y] = spot();
        g.fillRect(x, y, 2, 2);
      }
      break;
  }
}
