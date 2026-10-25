/**
 * Procedural 32x32 pixel portraits. Each race has its own palette and
 * features (elf ears, orc tusks, dwarf beard, beastkin ears, nephilim halo);
 * the variant number picks skin tone, hair color and hair style.
 */
export const PORTRAIT_SIZE = 32;
export const PORTRAIT_VARIANTS = 8;

interface RacePalette {
  skins: string[];
  hairs: string[];
  clothes: string[];
}

const PALETTES: Record<string, RacePalette> = {
  human: {
    skins: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'],
    hairs: ['#2c1b10', '#6b4423', '#c9a66b', '#a33a1c', '#d8d0c0', '#151515'],
    clothes: ['#3b5b8a', '#7a3b3b', '#4a6a3a', '#5a4a7a'],
  },
  elf: {
    skins: ['#f6e0c8', '#e8cfb4', '#d9c8e6', '#c9a98a'],
    hairs: ['#f4f1d0', '#c0c8d8', '#2b2b3a', '#7a4c8a', '#d8b25a'],
    clothes: ['#2f6a5a', '#4a3a7a', '#6a8a4a', '#3a4a6a'],
  },
  dwarf: {
    skins: ['#e8b48a', '#d19a6a', '#a8704a', '#f0c8a0'],
    hairs: ['#a33a1c', '#6b4423', '#c9a66b', '#8a8a8a', '#2c1b10'],
    clothes: ['#6a4a2a', '#5a5a6a', '#7a3a2a', '#3a4a3a'],
  },
  orc: {
    skins: ['#6b8e3a', '#4f7a2e', '#7a9a5a', '#5a6e4a'],
    hairs: ['#151515', '#3a2a1a', '#5a1a1a', '#5a5a5a'],
    clothes: ['#5a3a2a', '#3a3a3a', '#6a2a2a', '#4a4a2a'],
  },
  beastkin: {
    skins: ['#b07a44', '#d8b07a', '#6a6a6a', '#e8e0d0', '#8a5a2a'],
    hairs: ['#5a3a1a', '#8a6a3a', '#2a2a2a', '#c8c0b0'],
    clothes: ['#4a5a2a', '#6a4a2a', '#2a4a5a', '#5a2a3a'],
  },
  nephilim: {
    skins: ['#f8e8d8', '#d8c0a8', '#a88868', '#e8d0c0'],
    hairs: ['#fff4c0', '#e8e8f8', '#d8a838', '#c8b8e8'],
    clothes: ['#e8e0c8', '#c8a848', '#8898c8', '#f0f0f0'],
  },
  gnome: {
    skins: ['#f0c8a0', '#e0a880', '#c88a60', '#f8d8b8'],
    hairs: ['#e8e0d0', '#c9a66b', '#a33a1c', '#8a8a8a'],
    clothes: ['#3a7a5a', '#a33a1c', '#4a5a9a', '#8a6a2a'],
  },
  fae: {
    skins: ['#d8f0e0', '#c8e0f8', '#e8d0f0', '#f0f0c8'],
    hairs: ['#9af0c8', '#f0a8e8', '#a8c8ff', '#fff0a0'],
    clothes: ['#5ac88a', '#a878e8', '#e878b8', '#78b8e8'],
  },
  giant: {
    skins: ['#a89080', '#8a8a90', '#b8a088', '#7a8a78'],
    hairs: ['#3a2a1a', '#5a5a5a', '#8a6a3a', '#c8c0b0'],
    clothes: ['#5a4a3a', '#4a4a4a', '#6a5a3a', '#3a4a4a'],
  },
  dragon: {
    skins: ['#c8442a', '#2a8a5a', '#2a5ac8', '#c89a2a', '#8a8a98'],
    hairs: ['#3a1a10', '#102a1a', '#10203a', '#3a2a10'],
    clothes: ['#7a2a1a', '#1a4a3a', '#2a3a6a', '#6a5a1a'],
  },
  primordial: {
    skins: ['#2a2a4a', '#3a2a5a', '#1a3a4a', '#4a3a6a'],
    hairs: ['#e8f0ff', '#c8a8ff', '#a8e8ff', '#fff0c8'],
    clothes: ['#1a1a2a', '#2a1a3a', '#101a2a', '#2a2a3a'],
  },
};

const OUTLINE = '#120c18';

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amount));
  const g = clamp(((n >> 8) & 255) * (1 + amount));
  const b = clamp((n & 255) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function drawPortrait(canvas: HTMLCanvasElement, raceId: string, variant: number, background = '#2a2038'): void {
  const S = PORTRAIT_SIZE;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw the figure on its own layer so it can be outlined.
  const layer = document.createElement('canvas');
  layer.width = S;
  layer.height = S;
  const f = layer.getContext('2d');
  if (!f) return;

  const pal = PALETTES[raceId] ?? (PALETTES.human as RacePalette);
  const v = Math.abs(Math.floor(variant));
  const skin = pal.skins[v % pal.skins.length] as string;
  const hair = pal.hairs[(v * 3 + 1) % pal.hairs.length] as string;
  const cloth = pal.clothes[(v + 2) % pal.clothes.length] as string;
  const style = v % 3;
  const skinDark = shade(skin, -0.22);
  const px = (x: number, y: number, w = 1, h = 1, c = skin): void => {
    f.fillStyle = c;
    f.fillRect(x, y, w, h);
  };

  // Shoulders and neck.
  px(5, 27, 22, 5, cloth);
  px(5, 27, 22, 1, shade(cloth, 0.25));
  px(13, 22, 6, 5, skinDark);

  // Head: rows of [y, left, right].
  const head: [number, number, number][] = [
    [8, 12, 20], [9, 10, 22], [10, 9, 23], [11, 9, 23], [12, 9, 23], [13, 9, 23], [14, 9, 23], [15, 9, 23],
    [16, 9, 23], [17, 9, 23], [18, 10, 22], [19, 10, 22], [20, 11, 21], [21, 12, 20], [22, 13, 19],
  ];
  for (const [y, l, r] of head) px(l, y, r - l, 1, skin);
  // Cheek shading on the right side.
  for (const [y, , r] of head) if (y > 10) px(r - 1, y, 1, 1, skinDark);

  // Ears (race-specific).
  if (raceId === 'elf' || raceId === 'fae') {
    px(6, 11, 3, 2); px(5, 9, 2, 2); px(7, 13, 2, 3);
    px(23, 11, 3, 2); px(25, 9, 2, 2); px(23, 13, 2, 3);
  } else if (raceId === 'gnome') {
    px(7, 12, 2, 3); px(6, 13, 1, 2); px(23, 12, 2, 3); px(25, 13, 1, 2);
  } else if (raceId === 'orc') {
    px(7, 13, 2, 3); px(6, 12, 1, 1); px(23, 13, 2, 3); px(25, 12, 1, 1);
  } else if (raceId !== 'beastkin') {
    px(8, 14, 1, 3); px(23, 14, 1, 3);
  }

  // Eyes and brows.
  const glow = raceId === 'nephilim' || raceId === 'primordial';
  const eyeWhite = raceId === 'primordial' ? '#e8f0ff' : raceId === 'dragon' ? '#ffd070' : glow ? '#fff7c0' : '#f4f0e8';
  const pupil = raceId === 'primordial' ? '#6a4aff' : raceId === 'dragon' ? '#d82a10' : raceId === 'fae' ? '#2a8a6a' : glow ? '#e8a800' : raceId === 'beastkin' || raceId === 'gnome' ? '#c8a020' : '#2a1a10';
  px(11, 15, 3, 2, eyeWhite);
  px(18, 15, 3, 2, eyeWhite);
  px(12, 15, 2, 2, pupil);
  px(19, 15, 2, 2, pupil);
  const browY = raceId === 'orc' || raceId === 'giant' ? 13 : 14;
  px(11, browY, 4, 1, shade(hair, -0.2));
  px(18, browY, 4, 1, shade(hair, -0.2));

  // Nose and mouth.
  if (raceId === 'beastkin') {
    px(15, 18, 2, 1, '#2a1a1a');
    px(16, 19, 1, 1, '#2a1a1a');
    px(8, 18, 3, 1, '#e8e0d0'); px(22, 18, 3, 1, '#e8e0d0');
  } else {
    px(16, 17, 1, 2, skinDark);
  }
  px(14, 20, 4, 1, shade(skin, -0.4));

  if (raceId === 'gnome') {
    // A big round nose and a pointed cap.
    px(15, 17, 3, 3, shade(skin, -0.12));
    px(12, 3, 8, 3, '#a33a1c'); px(14, 1, 4, 2, '#a33a1c'); px(15, 0, 2, 1, '#c8c8c8');
  }
  if (raceId === 'giant') {
    // Heavy brow ridge, broad jaw and short tusks.
    px(10, 12, 12, 1, shade(skin, -0.25));
    px(8, 20, 2, 5, skin); px(22, 20, 2, 5, skin);
    px(13, 19, 1, 1, '#e8e0d0'); px(18, 19, 1, 1, '#e8e0d0');
  }
  if (raceId === 'dragon') {
    // Swept-back horns, cheek scales and a dragon's slit pupils.
    px(9, 6, 2, 3, '#d8c8a8'); px(8, 3, 2, 4, '#d8c8a8'); px(7, 1, 2, 3, '#b8a888');
    px(21, 6, 2, 3, '#d8c8a8'); px(22, 3, 2, 4, '#d8c8a8'); px(23, 1, 2, 3, '#b8a888');
    px(10, 17, 1, 1, shade(skin, 0.3)); px(12, 19, 1, 1, shade(skin, 0.3)); px(21, 17, 1, 1, shade(skin, 0.3)); px(19, 19, 1, 1, shade(skin, 0.3));
    px(13, 15, 1, 2, '#120c18'); px(20, 15, 1, 2, '#120c18');
  }
  if (raceId === 'primordial') {
    // Starlight freckled across a night-dark face.
    px(11, 18, 1, 1, '#e8f0ff'); px(20, 17, 1, 1, '#e8f0ff'); px(13, 12, 1, 1, '#c8a8ff'); px(19, 20, 1, 1, '#a8e8ff'); px(15, 11, 1, 1, '#fff0c8');
  }
  if (raceId === 'orc') {
    // Tusks jutting up from the jaw.
    px(13, 19, 1, 2, '#f4f0d8');
    px(18, 19, 1, 2, '#f4f0d8');
  }

  // Hair.
  px(10, 6, 12, 3, hair);
  px(9, 8, 14, 2, hair);
  px(8, 10, 2, 3, hair);
  px(22, 10, 2, 3, hair);
  px(12, 5, 8, 1, hair);
  px(12, 6, 6, 1, shade(hair, 0.3));
  if (style === 1) {
    // Long hair falling past the jaw.
    px(7, 10, 3, 14, hair);
    px(22, 10, 3, 14, hair);
    px(7, 23, 2, 4, shade(hair, -0.15));
    px(23, 23, 2, 4, shade(hair, -0.15));
  } else if (style === 2) {
    // Topknot / crest.
    px(14, 2, 4, 4, hair);
    px(15, 1, 2, 1, hair);
    px(15, 2, 1, 2, shade(hair, 0.3));
  }

  if (raceId === 'dwarf') {
    // Big braided beard covering the jaw.
    for (let y = 18; y < 30; y++) {
      const inset = Math.max(0, y - 25);
      px(10 + inset, y, 12 - inset * 2, 1, y % 3 === 0 ? shade(hair, -0.15) : hair);
    }
    px(14, 19, 4, 1, shade(skin, -0.4));
    px(15, 29, 2, 2, '#c9a227');
  }

  if (raceId === 'beastkin') {
    // Pointed animal ears on top of the head.
    px(9, 3, 3, 6, skin); px(10, 1, 1, 2, skin); px(10, 4, 1, 4, '#e8a0a0');
    px(20, 3, 3, 6, skin); px(21, 1, 1, 2, skin); px(21, 4, 1, 4, '#e8a0a0');
  }

  // Outline every figure pixel that touches empty space.
  const img = f.getImageData(0, 0, S, S);
  const solid = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < S && y < S && (img.data[(y * S + x) * 4 + 3] ?? 0) > 0;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, S, S);
  const grad = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S * 0.75);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  if (raceId === 'nephilim') {
    // Halo drawn behind the head.
    ctx.fillStyle = '#ffd54a';
    ctx.fillRect(10, 2, 12, 1);
    ctx.fillRect(9, 3, 1, 1);
    ctx.fillRect(22, 3, 1, 1);
    ctx.fillRect(10, 4, 12, 1);
    ctx.fillStyle = 'rgba(255,213,74,0.35)';
    ctx.fillRect(8, 1, 16, 5);
  }

  if (raceId === 'fae') {
    // Translucent wings behind the shoulders.
    ctx.fillStyle = 'rgba(168,232,255,0.45)';
    ctx.fillRect(1, 12, 6, 9); ctx.fillRect(25, 12, 6, 9);
    ctx.fillStyle = 'rgba(240,168,232,0.45)';
    ctx.fillRect(2, 21, 5, 6); ctx.fillRect(25, 21, 5, 6);
  }
  if (raceId === 'primordial') {
    // A slow ring of stars and a void-dark halo.
    ctx.fillStyle = 'rgba(106,74,255,0.35)';
    ctx.fillRect(7, 1, 18, 7);
    ctx.fillStyle = '#e8f0ff';
    for (const [x, y] of [[4, 5], [27, 7], [3, 17], [28, 20], [6, 27], [25, 28], [15, 1]] as const) ctx.fillRect(x, y, 1, 1);
  }

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.drawImage(layer, 0, 0);
}

const portraitCache = new Map<string, HTMLCanvasElement>();

/** A cached portrait canvas on a tinted background (battle and overworld sprites). */
export function portraitCanvas(raceId: string, variant: number, color: string): HTMLCanvasElement {
  const key = `${raceId}|${variant}|${color}`;
  let c = portraitCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    drawPortrait(c, raceId, variant, `${color}55`);
    portraitCache.set(key, c);
  }
  return c;
}
