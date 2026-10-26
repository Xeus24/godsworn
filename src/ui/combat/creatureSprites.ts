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

const SIZE = 24;
const FIXED: Record<string, string> = { w: '#f4f0e8', k: '#1a1420', e: '#ffe14a' };

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

const cache = new Map<string, HTMLCanvasElement>();

/** A 24x24 canvas with the creature drawn and outlined (cached per family and palette). */
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
  const ox = Math.floor((SIZE - w) / 2);
  const oy = SIZE - h - 1;
  const filled = new Set<number>();
  rows.forEach((row, y) => [...row].forEach((ch, x) => palette[ch] && filled.add((oy + y) * SIZE + ox + x)));
  // A tinted outline reads softer than flat black and keeps each creature's colour.
  ctx.fillStyle = shade(main, -0.86);
  for (const p of filled) {
    const x = p % SIZE;
    const y = Math.floor(p / SIZE);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && !filled.has(ny * SIZE + nx)) ctx.fillRect(nx, ny, 1, 1);
    }
  }
  const has = (x: number, y: number): boolean => filled.has(y * SIZE + x);
  const lit = shade(main, 0.22);
  const shadow = shade(main, -0.28);
  const accentLit = shade(accent, 0.22);
  const accentShadow = shade(accent, -0.28);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      const px = ox + x;
      const py = oy + y;
      let out = color;
      // Light from the top left: body and accent pixels on an upper or left edge are lit,
      // those on a lower or right edge are in shadow. Hand-placed l/d pixels stay as drawn.
      if (ch === 'm' || ch === 'a') {
        const topLeft = !has(px, py - 1) || !has(px - 1, py);
        const bottomRight = !has(px, py + 1) || !has(px + 1, py);
        if (topLeft && !bottomRight) out = ch === 'm' ? lit : accentLit;
        else if (bottomRight && !topLeft) out = ch === 'm' ? shadow : accentShadow;
      }
      ctx.fillStyle = out;
      ctx.fillRect(px, py, 1, 1);
    }),
  );
  cache.set(key, canvas);
  return canvas;
}
