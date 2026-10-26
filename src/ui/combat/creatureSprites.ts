/**
 * Pixel sprites for creatures, one sketch per family, recolored per enemy
 * and outlined automatically. Enemies face left (toward the party).
 * Palette: m main, l light, d dark, a accent, e eye glow, w white, k black.
 */
const PATTERNS: Record<string, string[]> = {
  slime: [
    '......llll......',
    '....llmmmmll....',
    '...lmmmmmmmmd...',
    '..lmmwmmmmwmmd..',
    '..lmmkmmmmkmmd..',
    '.lmmmmmmmmmmmmd.',
    '.lmmmmaaaammmmd.',
    'lmmmmmmmmmmmmmmd',
    'lmmmmmmmmmmmmmmd',
    'dmmmmmmmmmmmmmmd',
    '.dddddddddddddd.',
  ],
  beast: [
    '..l.l...............',
    '.lmlml..............',
    '.lmmmml.............',
    'lemmmmmlllllllll....',
    'kmmmmmmmmmmmmmmmml..',
    '.ammmmmmmmmmmmmmmmd.',
    '..wwmmmmmmmmmmmmmmdd',
    '...dmmmmmmmmmmmmmmd.',
    '....mmd.mmd..mmd.md.',
    '....md..md...md..md.',
    '....dd..dd...dd..dd.',
  ],
  goblin: [
    'l..........l',
    'll.lllll..ll',
    '.llmmmmmlll.',
    '..lmemmeml..',
    '..lmmmmmmd..',
    '...dmwwmd...',
    '..aaaaaaaa..',
    'w.amaaaama..',
    'wlaaaaaaaa..',
    'w..aaaaaa...',
    '...mm..mm...',
    '...dd..dd...',
  ],
  humanoid: [
    '....aaaa....',
    '...aaaaaa...',
    '..aalmmmaa..',
    '..aamemmaa..',
    '..aammmmaa..',
    '...ammmma...',
    '.aaaaaaaaaa.',
    'aaaaaaaaaaaa',
    'mdaaaaaaaadm',
    'm.aaaaaaaa.m',
    '..aaa..aaa..',
    '..aaa..aaa..',
    '..ddd..ddd..',
  ],
  undead: [
    '...wwwww...',
    '..wwwwwww..',
    '..wkkwkkw..',
    '..wkewekw..',
    '...wwkww...',
    '...wkwkw...',
    '....www....',
    '.wwwwwwwww.',
    'w..wwwww..w',
    'w.wwwwwww.a',
    '...w...w..a',
    '..ww...ww.a',
  ],
  spirit: [
    '....llll....',
    '..llmmmmll..',
    '.lmmmmmmmml.',
    '.lmkkmmkkml.',
    '.lmkemmekml.',
    'lmmmmmmmmmml',
    'lmmmmkkmmmml',
    'lmmmmmmmmmml',
    '.mmmmmmmmmm.',
    '..mmmmmmmm..',
    '...mm.mm.m..',
    '....m..m....',
  ],
  spider: [
    'd..d....d..d',
    '.d..d..d..d.',
    '..d.lmml.d..',
    'dd.lmmmml.dd',
    '..lmemmeml..',
    '.lmmmmmmmml.',
    'dlmmaammaamd',
    '.lmmmmmmmml.',
    'd.dmmmmmmd.d',
    '.d..dddd..d.',
    'd..d....d..d',
  ],
  plant: [
    '..a..a..a...',
    '.aaa.aaa.aa.',
    'aaaaaaaaaaaa',
    '.aaammmmaaa.',
    '...mmmmmm...',
    '...mememm...',
    '...mmkkmm...',
    '..mmmmmmmm..',
    '.mm.mmmm.mm.',
    'm...mmmm...m',
    '....mmmm....',
    '...mm..mm...',
    '..mm....mm..',
  ],
  wisp: [
    '.....ll.....',
    '...llwwll...',
    '..lwwwwwwl..',
    '.lwwwwwwwwl.',
    '.lwwmmmmwwl.',
    'lwwmmeemmwwl',
    'lwwmmeemmwwl',
    '.lwwmmmmwwl.',
    '.lwwwwwwwwl.',
    '..lwwwwwwl..',
    '...llwwll...',
    '.....ll.....',
  ],
  bird: [
    '.......lll..........',
    '......lmmml.........',
    '.....lmemmmk........',
    '.....lmmmmmaa.......',
    'lll..dmmmmd.........',
    'lmmllmmmmmmll...lll.',
    '.dmmmmmmmmmmmlllmmd.',
    '..dmmmmmmmmmmmmmmd..',
    '....ddmmmmmmmdd.....',
    '......dmmmmd........',
    '.......a..a.........',
    '......aa..aa........',
  ],
  golem: [
    '.....llllll.....',
    '....lmmmmmmd....',
    '....lmeemmed....',
    '....dmmmmmmd....',
    '.llllmmmmmmlll..',
    'lmmmmmmmmmmmmmd.',
    'lmmmmaammaammmd.',
    'lmmd.lmmmmmd.mmd',
    'lmmd.lmmmmmd.mmd',
    'dddd.lmmmmmd.ddd',
    '.....lmd.lmd....',
    '.....lmd.lmd....',
    '....ddd...ddd...',
  ],
  elemental: [
    '.....l..l.....',
    '....lml.lml...',
    '...lmmmlmmml..',
    '..lmmwmmmwmmd.',
    '..lmmkmmmkmmd.',
    '.lmmmmmmmmmmmd',
    '.lmmmaaaammmmd',
    '..lmmmmmmmmmd.',
    '...lmmmmmmmd..',
    '....dmmmmmd...',
    '.....dmmmd....',
    '......dmd.....',
  ],
  serpent: [
    '...........llll.....',
    '..........lmmmml....',
    '..........lmemmmk...',
    '..........dmmmmmaa..',
    '...........dmmmd....',
    '...lllll....lmmd....',
    '..lmmmmmll..lmmd....',
    '.lmmddddmmllmmd.....',
    '.lmd....dmmmmd......',
    '.lmml....dddd.......',
    '..dmmmllllll........',
    '...ddmmmmmmmmd......',
    '.....ddddddddd......',
  ],
  drake: [
    '...l.l..............',
    '..lmlml.............',
    '.lmmmmml........l...',
    'lemmmmmml.....llml..',
    'kmmmmmmmml..llmmmml.',
    '.aammmmmmmllmmmmmmml',
    '..wwmmmmmmmmmmmmmmmd',
    '....dmmmmmmmmmmmmmd.',
    '.....mmd.mmd.mmmmd..',
    '.....md..md...mmd...',
    '.....dd..dd...dd....',
  ],
  demon: [
    'l..........l',
    'ml........lm',
    '.ml.llll.lm.',
    '..lmmmmmmd..',
    '..lmemmemd..',
    '..lmmmmmmd..',
    '...dmwwmd...',
    '.lmmmmmmmmd.',
    'lmmmammammmd',
    'm.dmmmmmmd.m',
    '...mm..mm...',
    '..ddd..ddd..',
  ],
};

const SRC = 24;
/** Sprites are drawn at twice the sketch resolution (Scale2x), so edges can be lit and outlined at half-pixel detail. */
const SIZE = SRC * 2;
const FIXED: Record<string, string> = { w: '#f4f0e8', k: '#1a1420', e: '#ffe14a' };

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

const cache = new Map<string, HTMLCanvasElement>();

type Cell = { color: string; shaded: 'm' | 'a' | undefined } | undefined;

const same = (a: Cell, b: Cell): boolean => (a === undefined || b === undefined ? a === b : a.color === b.color);

/** Scale2x: doubles the grid and rounds off staircase diagonals without blurring. */
function scale2x(grid: Cell[][]): Cell[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const at = (x: number, y: number): Cell => (x < 0 || y < 0 || x >= w || y >= h ? undefined : grid[y]?.[x]);
  const out: Cell[][] = Array.from({ length: h * 2 }, () => new Array<Cell>(w * 2).fill(undefined));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y);
      const a = at(x, y - 1);
      const b = at(x + 1, y);
      const c = at(x - 1, y);
      const d = at(x, y + 1);
      let e0 = p;
      let e1 = p;
      let e2 = p;
      let e3 = p;
      if (!same(a, d) && !same(c, b)) {
        if (same(c, a)) e0 = a;
        if (same(a, b)) e1 = b;
        if (same(d, c)) e2 = c;
        if (same(b, d)) e3 = d;
      }
      // Single-pixel features (eyes, teeth) are kept whole rather than eaten by neighbours.
      const row = out[y * 2] as Cell[];
      const row2 = out[y * 2 + 1] as Cell[];
      row[x * 2] = e0;
      row[x * 2 + 1] = e1;
      row2[x * 2] = e2;
      row2[x * 2 + 1] = e3;
    }
  }
  return out;
}

/** A 48x48 canvas with the creature drawn, lit from the top left and outlined (cached per family and palette). */
export function creatureSprite(family: string, main: string, accent: string): HTMLCanvasElement {
  const key = `${family}|${main}|${accent}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = PATTERNS[family] ?? (PATTERNS.slime as string[]);
  const palette: Record<string, string> = { ...FIXED, m: main, l: shade(main, 0.35), d: shade(main, -0.35), a: accent };
  // Wisps glow in their own color.
  if (family === 'wisp') palette.w = shade(main, 0.6);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const ox = Math.floor((SRC - w) / 2);
  const oy = SRC - h - 1;
  const grid: Cell[][] = Array.from({ length: SRC }, () => new Array<Cell>(SRC).fill(undefined));
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      const cell = (grid[oy + y] as Cell[]);
      if (color) cell[ox + x] = { color, shaded: ch === 'm' || ch === 'a' ? ch : undefined };
    }),
  );
  const big = scale2x(grid);
  const filled = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < SIZE && y < SIZE && big[y]?.[x] !== undefined;
  // A tinted outline reads softer than flat black and keeps each creature's colour.
  ctx.fillStyle = shade(main, -0.86);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (filled(x, y)) continue;
      if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) ctx.fillRect(x, y, 1, 1);
    }
  }
  const lit = shade(main, 0.22);
  const shadow = shade(main, -0.28);
  const accentLit = shade(accent, 0.22);
  const accentShadow = shade(accent, -0.28);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = big[y]?.[x];
      if (!cell) continue;
      let out = cell.color;
      // Light from the top left: body and accent pixels on an upper or left edge are lit,
      // those on a lower or right edge are in shadow. Hand-placed l/d pixels stay as drawn.
      if (cell.shaded) {
        const topLeft = !filled(x, y - 1) || !filled(x - 1, y) || !filled(x - 1, y - 1);
        const bottomRight = !filled(x, y + 1) || !filled(x + 1, y) || !filled(x + 1, y + 1);
        if (topLeft && !bottomRight) out = cell.shaded === 'm' ? lit : accentLit;
        else if (bottomRight && !topLeft) out = cell.shaded === 'm' ? shadow : accentShadow;
      }
      ctx.fillStyle = out;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  cache.set(key, canvas);
  return canvas;
}
