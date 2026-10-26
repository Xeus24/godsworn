/** Pixel-art skylines for the five towns, drawn at 240x48 and scaled up crisp. */
export const BANNER_W = 240;
export const BANNER_H = 48;

type Draw = (g: CanvasRenderingContext2D, night: boolean) => void;

const px = (g: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

function sky(g: CanvasRenderingContext2D, night: boolean, day: [string, string], dusk: [string, string]): void {
  const [top, bottom] = night ? dusk : day;
  const grad = g.createLinearGradient(0, 0, 0, BANNER_H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, BANNER_W, BANNER_H);
  if (night) {
    for (let i = 0; i < 40; i++) px(g, i % 5 === 0 ? '#fff8d8' : '#b8b8e0', (i * 53) % BANNER_W, (i * 17) % 26);
    px(g, '#f4f0d8', 200, 6, 5, 5);
    px(g, dusk[0], 202, 6, 3, 3);
  } else {
    px(g, '#fff4c0', 24, 7, 6, 6);
  }
}

/** A cottage: walls, a pitched roof and a window that glows at night. */
function house(g: CanvasRenderingContext2D, night: boolean, x: number, base: number, w: number, h: number, wall: string, roof: string): void {
  px(g, wall, x, base - h, w, h);
  px(g, 'rgba(0,0,0,0.18)', x, base - h, w, 1);
  for (let r = 0; w + 2 - r * 2 > 0; r++) px(g, roof, x - 1 + r, base - h - 1 - r, w + 2 - r * 2, 1);
  const win = night ? '#ffd070' : '#6a8cb8';
  px(g, win, x + 2, base - h + 2, 2, 2);
  if (w > 7) px(g, win, x + w - 4, base - h + 2, 2, 2);
  px(g, '#4a3220', x + Math.floor(w / 2) - 1, base - 3, 2, 3);
}

function ground(g: CanvasRenderingContext2D, top: string, bottom: string, y = 38): void {
  px(g, top, 0, y, BANNER_W, 2);
  px(g, bottom, 0, y + 2, BANNER_W, BANNER_H - y - 2);
}

const TOWNS: Record<string, Draw> = {
  // A market town by a clear river: cottages, a mill and a bridge.
  brightwater: (g, night) => {
    sky(g, night, ['#5a86c0', '#f0d0a0'], ['#10122e', '#4a3a5a']);
    g.fillStyle = night ? '#1c2a3a' : '#6a8a6a';
    for (let x = 0; x < BANNER_W; x += 2) g.fillRect(x, 24 - Math.round(7 * Math.sin(x * 0.04) + 4 * Math.sin(x * 0.11)), 2, 20);
    ground(g, night ? '#2a4a2a' : '#5f9a3a', night ? '#1e3a1e' : '#4a7a2a');
    px(g, night ? '#1a3a6a' : '#4a8ad0', 0, 42, BANNER_W, 3);
    px(g, night ? '#2a5a9a' : '#8ac0f0', 20, 43, 14, 1);
    px(g, night ? '#2a5a9a' : '#8ac0f0', 120, 44, 18, 1);
    house(g, night, 14, 38, 12, 8, '#e8d8b0', '#a84a3a');
    house(g, night, 40, 38, 9, 6, '#d8c8a0', '#8a3a2a');
    house(g, night, 150, 38, 14, 9, '#e8d8b0', '#5a6aa8');
    house(g, night, 180, 38, 10, 7, '#d8c8a0', '#a84a3a');
    house(g, night, 206, 38, 12, 8, '#e8d8b0', '#8a3a2a');
    // The mill.
    px(g, '#d8c8a0', 92, 20, 12, 18);
    px(g, '#8a3a2a', 90, 16, 16, 4);
    px(g, '#5a3a1a', 97, 30, 3, 8);
    px(g, '#e8e0d0', 98, 8, 1, 14);
    px(g, '#e8e0d0', 91, 15, 15, 1);
    // A bridge over the river.
    px(g, '#8a6a4a', 60, 39, 30, 2);
    px(g, '#6a4a2a', 62, 41, 2, 4);
    px(g, '#6a4a2a', 86, 41, 2, 4);
  },
  // A hunters' village at the forest edge: huts under tall pines, smoke and lanterns.
  thornwick: (g, night) => {
    sky(g, night, ['#3a5a58', '#a8b890'], ['#0a1220', '#2a3a40']);
    for (let x = 0; x < BANNER_W; x += 12) {
      const h = 14 + ((x * 7) % 11);
      px(g, night ? '#0e1e1a' : '#274a30', x, 38 - h, 10, h);
    }
    ground(g, night ? '#1c3a1c' : '#3a6a2a', night ? '#122612' : '#27471c');
    for (let x = 4; x < BANNER_W; x += 38) {
      const h = 30 + ((x * 5) % 9);
      g.fillStyle = night ? '#0a2214' : '#1c3a22';
      for (let r = 0; r < 7; r++) g.fillRect(x + 6 - 1 - r, 38 - h + r * (h / 7), 2 + r * 2, h / 7 + 1);
      px(g, '#3a2210', x + 5, 36, 2, 4);
    }
    house(g, night, 58, 38, 12, 7, '#8a6a46', '#4a5a2a');
    house(g, night, 118, 38, 14, 8, '#7a5a3a', '#5a3a1a');
    house(g, night, 168, 38, 10, 6, '#8a6a46', '#4a5a2a');
    // Smoke.
    px(g, 'rgba(220,220,230,0.5)', 126, 24, 2, 2);
    px(g, 'rgba(220,220,230,0.35)', 128, 20, 3, 2);
    px(g, 'rgba(220,220,230,0.2)', 126, 16, 3, 2);
    // Lanterns.
    for (const lx of [90, 150, 200]) {
      px(g, '#3a2a1a', lx, 28, 1, 10);
      px(g, night ? '#ffd070' : '#c89040', lx - 1, 27, 3, 3);
    }
  },
  // A walled oasis: sandstone towers, domes and palms.
  sandhaven: (g, night) => {
    sky(g, night, ['#78aedc', '#f6dca0'], ['#14102a', '#5a3a4a']);
    g.fillStyle = night ? '#4a3a40' : '#d8b878';
    for (let x = 0; x < BANNER_W; x += 2) g.fillRect(x, 30 - Math.round(5 * Math.sin(x * 0.03 + 1)), 2, 12);
    ground(g, night ? '#6a5a50' : '#e0c890', night ? '#54463e' : '#c4a870');
    const sand = night ? '#8a7060' : '#e8cc90';
    const shade = night ? '#6a5448' : '#c8a870';
    px(g, sand, 8, 24, 224, 14);
    for (let x = 8; x < 232; x += 6) px(g, sand, x, 22, 4, 2);
    px(g, shade, 8, 36, 224, 2);
    for (const tx of [30, 100, 170, 214]) {
      px(g, sand, tx, 10, 12, 28);
      px(g, shade, tx + 9, 10, 3, 28);
      px(g, night ? '#ffd070' : '#3a3a4a', tx + 4, 16, 3, 5);
    }
    // Domes.
    for (const [dx, dc] of [[56, '#3a8aa8'], [124, '#a8503a'], [190, '#3a8aa8']] as const) {
      px(g, sand, dx, 18, 16, 20);
      px(g, dc, dx + 2, 12, 12, 6);
      px(g, dc, dx + 4, 9, 8, 3);
      px(g, '#ffd84a', dx + 7, 5, 2, 4);
      px(g, night ? '#ffd070' : '#3a3a4a', dx + 6, 24, 4, 6);
    }
    px(g, '#2a2a30', 84, 28, 6, 10);
    // Palms.
    for (const palm of [14, 150, 228]) {
      px(g, '#7a5a30', palm, 26, 2, 14);
      px(g, '#3a8a3a', palm - 5, 24, 6, 2);
      px(g, '#3a8a3a', palm + 1, 24, 6, 2);
      px(g, '#3a8a3a', palm - 3, 22, 4, 2);
      px(g, '#3a8a3a', palm + 1, 22, 4, 2);
    }
  },
  // A mountain fortress: a keep carved into the rock, snow, and warm windows.
  frosthold: (g, night) => {
    sky(g, night, ['#8fb4d8', '#e4eef8'], ['#0a1230', '#3a4a6a']);
    for (const [mx, mh, mc] of [[10, 34, night ? '#3a4a60' : '#a8bcd0'], [80, 40, night ? '#34445a' : '#98aec4'], [150, 36, night ? '#3a4a60' : '#a8bcd0'], [210, 32, night ? '#34445a' : '#98aec4']] as const) {
      g.fillStyle = mc;
      g.beginPath();
      g.moveTo(mx - 38, 40);
      g.lineTo(mx, 40 - mh);
      g.lineTo(mx + 38, 40);
      g.fill();
      px(g, '#ffffff', mx - 5, 40 - mh, 10, 3);
      px(g, '#ffffff', mx - 8, 40 - mh + 3, 16, 2);
    }
    ground(g, night ? '#9aa8c0' : '#f4f8fc', night ? '#7a88a0' : '#d4dee8');
    // The fortress.
    const stone = night ? '#3a3a50' : '#7a7a90';
    px(g, stone, 70, 14, 100, 24);
    px(g, night ? '#2a2a3c' : '#5a5a70', 70, 34, 100, 4);
    for (let x = 70; x < 170; x += 8) px(g, stone, x, 11, 5, 3);
    for (const tx of [64, 108, 164]) {
      px(g, stone, tx, 4, 12, 34);
      px(g, '#ffffff', tx - 1, 3, 14, 2);
      for (let x = tx; x < tx + 12; x += 4) px(g, stone, x, 1, 3, 3);
    }
    px(g, night ? '#ffd070' : '#8aa0c0', 69, 12, 2, 4);
    px(g, night ? '#ffd070' : '#8aa0c0', 113, 12, 2, 4);
    px(g, night ? '#ffd070' : '#8aa0c0', 169, 12, 2, 4);
    px(g, '#2a2030', 112, 26, 16, 12);
    px(g, night ? '#ffd070' : '#5a4a6a', 114, 28, 12, 10);
    px(g, '#2a2030', 119, 28, 2, 10);
    // Banners.
    px(g, '#4a6aa8', 66, 9, 4, 8);
    px(g, '#4a6aa8', 166, 9, 4, 8);
    // Falling snow.
    for (let i = 0; i < 26; i++) px(g, 'rgba(255,255,255,0.8)', (i * 47) % BANNER_W, (i * 29) % 40);
  },
  // A harbour: masts, a lighthouse, and warehouses on the water.
  saltmere: (g, night) => {
    sky(g, night, ['#4a80b8', '#e0e4dc'], ['#0c1030', '#3a3a5a']);
    px(g, night ? '#143a6a' : '#2a6aaa', 0, 30, BANNER_W, 18);
    for (let i = 0; i < 40; i++) px(g, night ? '#2a5a9a' : '#6aa4d8', (i * 37) % BANNER_W, 32 + ((i * 11) % 14), 6, 1);
    // The quay.
    px(g, night ? '#4a4048' : '#8a7a6a', 0, 30, BANNER_W, 4);
    px(g, night ? '#2a2630' : '#5a4a40', 0, 34, BANNER_W, 2);
    for (let x = 4; x < BANNER_W; x += 12) px(g, '#3a2a1a', x, 34, 2, 8);
    // Warehouses and houses.
    house(g, night, 8, 30, 14, 10, '#8a7a6a', '#5a4a40');
    house(g, night, 28, 30, 10, 7, '#6a7a8a', '#3a4a5a');
    house(g, night, 150, 30, 14, 10, '#8a7a6a', '#5a4a40');
    house(g, night, 172, 30, 10, 7, '#7a6a5a', '#3a4a5a');
    // The lighthouse.
    px(g, '#f4f0e8', 206, 8, 8, 22);
    px(g, '#c8503a', 206, 14, 8, 3);
    px(g, '#c8503a', 206, 22, 8, 3);
    px(g, '#2a2a30', 205, 5, 10, 3);
    px(g, night ? '#fff0a0' : '#ffe880', 207, 2, 6, 3);
    if (night) {
      g.fillStyle = 'rgba(255,240,160,0.16)';
      g.beginPath();
      g.moveTo(206, 4);
      g.lineTo(60, 0);
      g.lineTo(60, 14);
      g.fill();
    }
    // Ships.
    for (const [sx, sw] of [[56, 20], [100, 24]] as const) {
      px(g, '#5a3a1a', sx, 29, sw, 4);
      px(g, '#3a2210', sx + 2, 33, sw - 4, 2);
      px(g, '#5a3a1a', sx + sw / 2, 8, 2, 21);
      px(g, '#f4f0e8', sx + sw / 2 + 2, 10, 9, 14);
      px(g, '#e8e0d0', sx + sw / 2 - 8, 14, 8, 10);
    }
    // Gulls.
    for (const [bx, by] of [[40, 12], [130, 8], [178, 16]] as const) {
      px(g, '#f4f0e8', bx, by, 2, 1);
      px(g, '#f4f0e8', bx + 3, by, 2, 1);
      px(g, '#f4f0e8', bx + 2, by + 1, 1, 1);
    }
  },
};

const cache = new Map<string, HTMLCanvasElement>();

/** The banner for a town, by day or night (cached). */
export function townBanner(townId: string, night: boolean): HTMLCanvasElement {
  const key = `${townId}|${night}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = BANNER_W;
  canvas.height = BANNER_H;
  const g = canvas.getContext('2d');
  if (g) {
    g.imageSmoothingEnabled = false;
    (TOWNS[townId] ?? TOWNS.brightwater as Draw)(g, night);
  }
  cache.set(key, canvas);
  return canvas;
}
