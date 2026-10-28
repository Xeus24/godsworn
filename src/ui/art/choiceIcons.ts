import { GREATER_CLASSES } from '../../data/classesGreater';
/**
 * Small pixel icons for the character-creation cards (difficulty, race, class,
 * birth sign). Each icon is a 12x12 string map: one character per pixel,
 * '.' is empty, letters index into a palette. Drawn crisp and scaled by CSS.
 */
const SIZE = 12;

type Art = { rows: string[]; colors: Record<string, string> };

const OUT = '#120c18';

const CLASS_ART: Record<string, Art> = {
  warrior: {
    rows: ['.....ww.....', '....wWw.....', '....wWw.....', '....wWw.....', '....wWw.....', '....wWw.....', '..gggggggg..', '....bbbb....', '.....bb.....', '.....bb.....', '....gggg....', '............'],
    colors: { w: '#a8b4c8', W: '#e8f0ff', g: '#d8a83a', b: '#6a3a1a' },
  },
  mage: {
    rows: ['.....pp.....', '....pPPp....', '.....pp.....', '......b.....', '......b.....', '.....bb.....', '.....b......', '.....b......', '....bb......', '....b.......', '...bb.......', '............'],
    colors: { p: '#9a5aff', P: '#e0c8ff', b: '#7a4a2a' },
  },
  rogue: {
    rows: ['........ss..', '.......sSs..', '......sSs...', '.....sSs....', '....sSs.....', '...sSs......', '..gGg.......', '..gg........', '.bb.........', '.b..........', '............', '............'],
    colors: { s: '#a8b4c8', S: '#e8f0ff', g: '#5a5a62', G: '#8a8a92', b: '#4a2a1a' },
  },
  cleric: {
    rows: ['.....yy.....', '.....yy.....', '.....yy.....', '..yyyyyyyy..', '..yyyyyyyy..', '.....yy.....', '.....yy.....', '.....yy.....', '.....yy.....', '.....yy.....', '............', '............'],
    colors: { y: '#ffd84a' },
  },
  ranger: {
    rows: ['..bb........', '..b.b.......', '..b..b......', '..b...b.....', '..bw..w.....', '..bw...w....', '..b...w.....', '..b..w......', '..b.b.......', '..bb........', '............', '............'],
    colors: { b: '#8a5a2a', w: '#e8e0d0' },
  },
  necromancer: {
    rows: ['...wwwwww...', '..wwwwwwww..', '.wwwwwwwwww.', '.wkkwwwwkkw.', '.wkkwwwwkkw.', '.wwwwddwwww.', '..wwwddwww..', '...wwwwww...', '...wgwgwgw..', '...wwwwww...', '............', '............'],
    colors: { w: '#d8d8c8', k: '#1a2a1a', d: '#6a6a60', g: '#4ad070' },
  },
  monk: {
    rows: ['....ffff....', '...ffffff...', '..ffoooooff.', '..ffoooooff.', '..fffooofff.', '...ffffff...', '....ffff....', '...rrrrrr...', '..rrrrrrrr..', '..rrrrrrrr..', '............', '............'],
    colors: { f: '#e8b078', o: '#c8905a', r: '#d86a2a' },
  },
  bard: {
    rows: ['..........n.', '.........nn.', '........n.n.', '.....bbb....', '....bBBBb...', '...bBBBBBb..', '...bBBhBBb..', '...bBBBBBb..', '....bBBBb...', '.....bbb....', '............', '............'],
    colors: { b: '#8a5a2a', B: '#c8883a', h: '#2a1a0a', n: '#ffd84a' },
  },
};

const BIRTH_ART: Record<string, Art> = {
  'the-forge': {
    rows: ['............', '..aaaaaaaaa.', '.aAAAAAAAAa.', '..aaaaaaaa..', '....aAAa....', '....aAAa....', '....aAAa....', '...aaAAaa...', '..aaAAAAaa..', '..aaaaaaaa..', '............', '............'],
    colors: { a: '#5a5a66', A: '#9a9aa8' },
  },
  'the-dawn': {
    rows: ['.....y......', '..y..y..y...', '...y.y.y....', '....yyy.....', '.y.yYYYy.y..', '..yYYYYYy...', '.y.yYYYy.y..', '....yyy.....', '...y.y.y....', '..y..y..y...', '.....y......', '............'],
    colors: { y: '#ffb83a', Y: '#fff0a8' },
  },
  'the-raven': {
    rows: ['............', '....kkk.....', '...kkkkk....', '..kkkwkkk...', '.kkkkkkkkk..', 'okkkkkkkk...', '.kkkkkkk....', '..kkkkk.....', '...k.k......', '...k.k......', '............', '............'],
    colors: { k: '#3a3a4a', w: '#e8e8ff', o: '#e8a83a' },
  },
  'the-banner': {
    rows: ['.pppppppppp.', '.pPPPPPPPPp.', '.pPPPyyPPPp.', '.pPPyyyyPPp.', '.pPPPyyPPPp.', '.pPPPPPPPPp.', '.ppPPPPPPpp.', '..ppPPPPpp..', '...ppPPpp...', '....pppp....', '.....pp.....', '............'],
    colors: { p: '#6a2a8a', P: '#9a4ac8', y: '#ffd84a' },
  },
  'the-coin': {
    rows: ['....yyyy....', '..yyYYYYyy..', '.yYYYddYYYy.', '.yYYdYYdYYy.', 'yYYYdYYYYYYy', 'yYYYdddYYYYy', 'yYYYdYYdYYYy', '.yYYdYYdYYy.', '.yYYYddYYYy.', '..yyYYYYyy..', '....yyyy....', '............'],
    colors: { y: '#c8901a', Y: '#ffd84a', d: '#8a5a12' },
  },
  'the-antler': {
    rows: ['............', '.a..a..a..a.', '.aa.a..a.aa.', '..aaa..aaa..', '...aaaaaa...', '....aaaa....', '....bbbb....', '...bbbbbb...', '...bbkkbb...', '....bbbb....', '.....bb.....', '............'],
    colors: { a: '#a8825a', b: '#8a5a32', k: '#1a1020' },
  },
  'the-tide': {
    rows: ['............', '............', '..ww....ww..', '.wWWw..wWWw.', '.wWWWwwWWWw.', 'wWWWWWWWWWWw', 'wwwwwwwwwwww', '.wWWWwwWWWw.', '..wwww.wwww.', '............', '............', '............'],
    colors: { w: '#3a78c8', W: '#8ac8f0' },
  },
  'the-hearth': {
    rows: ['.....r......', '....rrr.....', '...rroorr...', '..rrooyorr..', '..rroyyorr..', '..rrooyorr..', '...rrooorr..', '..bbbbbbbbb.', '.bbbbbbbbbbb', '.bbbbbbbbbbb', '............', '............'],
    colors: { r: '#c8402a', o: '#f08a2a', y: '#ffd84a', b: '#5a4a3a' },
  },
  'the-ledger': {
    rows: ['............', '.gggggggggg.', '.gGGGGGGGGg.', '.gGkkkkkkGg.', '.gGGGGGGGGg.', '.gGkkkkkGGg.', '.gGGGGGGGGg.', '.gGkkkkkkGg.', '.gGGGGGGGGg.', '.gggggggggg.', '............', '............'],
    colors: { g: '#4a6a3a', G: '#8ab070', k: '#2a3a20' },
  },
  'the-hollow': {
    rows: ['............', '....vvvv....', '..vvVVVVvv..', '.vVV....VVv.', '.vV..vv..Vv.', '.vV.vvvv.Vv.', '.vV..vv..Vv.', '.vVV....VVv.', '..vvVVVVvv..', '....vvvv....', '............', '............'],
    colors: { v: '#3a1a5a', V: '#8a4ad0' },
  },
  'the-tome': {
    rows: ['............', '.bbbbbbbbbb.', '.bBBBBBBBBb.', '.bBwwwwwwBb.', '.bBBBBBBBBb.', '.bBwwwwwBBb.', '.bBBBBBBBBb.', '.bBwwwwwwBb.', '.bBBBBBBBBb.', '.bbbbbbbbbb.', '............', '............'],
    colors: { b: '#4a2a6a', B: '#7a4aa8', w: '#e8dcb8' },
  },
};

/** Race icons share one head: skin tone, plus ears, tusks, horns, beards and so on. */
const SKIN: Record<string, string> = {
  human: '#e8b078', elf: '#f0d8b0', dwarf: '#d89a6a', orc: '#6aa84a', beastkin: '#c8883a', nephilim: '#f4e8d0',
  gnome: '#e8a890', fae: '#b8e8d8', giant: '#a8b8c8', dragon: '#c83a3a', primordial: '#6a4ab0',
  'wood-elf': '#d8c4a0', ashborn: '#b0604a', tidekin: '#7ab0c8', scaleborn: '#7a9a4a', shadekin: '#5a5a78', forged: '#8a929a', revenant: '#b8c0b0', hearthfolk: '#f4c8a0',
};

function raceArt(id: string): Art {
  const s = SKIN[id] ?? '#e8b078';
  const rows = ['............', '....ssss....', '...ssssss...', '..essssssse.', '..esKssKse..', '...ssssss...', '...ssmmss...', '....ssss....', '.....ss.....', '............', '............', '............'];
  const colors: Record<string, string> = { s: s, e: s, K: '#1a1020', m: '#8a3a3a' };
  const set = (r: number, c: number, ch: string): void => {
    rows[r] = (rows[r] as string).slice(0, c) + ch + (rows[r] as string).slice(c + 1);
  };
  switch (id) {
    case 'wood-elf':
      set(2, 0, 'e'); set(2, 1, 'e'); set(2, 10, 'e'); set(2, 11, 'e');
      break;
    case 'ashborn':
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#ffb030'; set(0, 3, 'h'); set(0, 8, 'h'); colors.h = '#3a2a2a';
      break;
    case 'tidekin':
      set(3, 0, 'w'); set(4, 0, 'w'); set(3, 11, 'w'); set(4, 11, 'w'); colors.w = '#4a98c8';
      break;
    case 'scaleborn':
      set(0, 4, 'h'); set(0, 7, 'h'); set(1, 5, 'h'); set(1, 6, 'h'); colors.h = '#5a7a30'; set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#e8d030';
      break;
    case 'shadekin':
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#c8a0ff'; set(2, 0, 'e'); set(2, 11, 'e');
      break;
    case 'forged':
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#60d8ff'; set(6, 5, 'm'); set(6, 6, 'm'); colors.m = '#4a4a52';
      break;
    case 'revenant':
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#a0f0c0'; set(6, 4, 'm'); set(6, 7, 'm'); colors.m = '#4a5a50';
      break;
    case 'hearthfolk':
      set(1, 4, 'h'); set(1, 7, 'h'); colors.h = '#8a5a2a';
      break;
    case 'elf':
      set(2, 0, 'e'); set(2, 1, 'e'); set(2, 10, 'e'); set(2, 11, 'e'); set(1, 1, '.');
      break;
    case 'dwarf':
      for (const [r, c] of [[6, 3], [6, 8], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [8, 4], [8, 5], [8, 6], [8, 7], [9, 5], [9, 6]] as const) set(r, c, 'b');
      colors.b = '#b0602a';
      break;
    case 'orc':
      set(6, 3, 'w'); set(6, 8, 'w'); colors.w = '#f4f0e0';
      break;
    case 'beastkin':
      set(0, 2, 'e'); set(0, 9, 'e'); set(1, 2, 'e'); set(1, 9, 'e');
      break;
    case 'nephilim':
      set(0, 3, 'h'); set(0, 4, 'h'); set(0, 5, 'h'); set(0, 6, 'h'); set(0, 7, 'h'); set(0, 8, 'h'); colors.h = '#ffd84a';
      break;
    case 'gnome':
      for (const c of [3, 4, 5, 6, 7, 8]) set(0, c, 'c');
      set(1, 3, 'c'); set(1, 8, 'c');
      colors.c = '#c83a3a';
      break;
    case 'fae':
      set(2, 0, 'w'); set(3, 0, 'w'); set(3, 1, 'w'); set(2, 11, 'w'); set(3, 11, 'w'); set(3, 10, 'w'); colors.w = '#ffffff';
      break;
    case 'giant':
      set(0, 3, 'h'); set(0, 8, 'h'); set(1, 3, 'h'); set(1, 8, 'h');
      colors.h = '#8a8a92';
      break;
    case 'dragon':
      set(0, 2, 'h'); set(1, 2, 'h'); set(0, 9, 'h'); set(1, 9, 'h'); set(2, 3, 'h'); set(2, 8, 'h'); colors.h = '#e8d8b0';
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#ffd84a';
      break;
    case 'primordial':
      set(0, 5, 'g'); set(0, 6, 'g'); set(1, 4, 'g'); set(1, 7, 'g'); colors.g = '#d8a0ff';
      set(4, 4, 'Y'); set(4, 7, 'Y'); colors.Y = '#d8a0ff';
      break;
  }
  return { rows, colors };
}

/** A shield that fills with more skull-red pips as the difficulty rises. */
function difficultyArt(index: number, count: number): Art {
  const t = count <= 1 ? 0 : index / (count - 1);
  const hue = Math.round(120 - 120 * t);
  const main = `hsl(${hue} 55% 42%)`;
  const hi = `hsl(${hue} 60% 62%)`;
  const rows = ['.mmmmmmmmmm.', 'mhhhhhhhhhhm', 'mhppppppppm.', 'mhppppppppm.', 'mhppppppppm.', 'mhppppppppm.', '.mhppppppm..', '..mhppppm...', '...mhppm....', '....mmmm....', '............', '............'];
  const pips = 1 + Math.round(t * 4);
  const order = [[3, 3], [3, 8], [5, 5], [5, 6], [3, 5]] as const;
  for (let i = 0; i < pips; i++) {
    const [r, c] = order[i] as readonly [number, number];
    rows[r] = (rows[r] as string).slice(0, c) + 'k' + (rows[r] as string).slice(c + 1);
  }
  // Mirror the left half so the shield is symmetric.
  const sym = rows.map((row) => {
    const half = row.slice(0, 6);
    return half + [...half].reverse().join('');
  });
  return { rows: sym, colors: { m: '#2a1a30', h: hi, p: main, k: '#1a1020' } };
}

const cache = new Map<string, HTMLCanvasElement>();

function paint(key: string, art: Art): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  art.rows.forEach((row, y) => {
    for (let x = 0; x < SIZE; x++) {
      const ch = row[x] ?? '.';
      const color = art.colors[ch];
      if (ch === '.' || !color) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  });
  // 1px outline so the glyph reads on dark cards.
  const img = g.getImageData(0, 0, SIZE, SIZE);
  const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < SIZE && y < SIZE && (img.data[(y * SIZE + x) * 4 + 3] ?? 0) > 0;
  g.fillStyle = OUT;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!solid(x, y) && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1))) g.fillRect(x, y, 1, 1);
  c.className = 'choice-icon pixel';
  cache.set(key, c);
  return c;
}

export type ChoiceKind = 'difficulty' | 'race' | 'class' | 'birth';

/** A fresh canvas element (a clone, so it can sit in the DOM more than once). */
export function choiceIcon(kind: ChoiceKind, id: string, index = 0, count = 1, tint = '#ffd84a'): HTMLCanvasElement {
  let art: Art;
  switch (kind) {
    case 'class':
      art = CLASS_ART[id] ?? GREATER_CLASSES.find((g) => g.def.id === id)?.art ?? { rows: Array(SIZE).fill('..tttttttt..'), colors: { t: tint } };
      break;
    case 'birth':
      art = BIRTH_ART[id] ?? { rows: Array(SIZE).fill('..tttttttt..'), colors: { t: tint } };
      break;
    case 'race':
      art = raceArt(id);
      break;
    default:
      art = difficultyArt(index, count);
  }
  const src = paint(`${kind}|${id}|${index}`, art);
  const copy = document.createElement('canvas');
  copy.width = SIZE;
  copy.height = SIZE;
  copy.className = src.className;
  (copy.getContext('2d') as CanvasRenderingContext2D).drawImage(src, 0, 0);
  return copy;
}
