/**
 * Icons built from Dungeon Crawl tiles that need a little work first: cropped and enlarged
 * (the doll pieces for shoulders, belts and legs) or tinted (gems, ore, hides, essences).
 * `composedIconUrl` returns undefined until the tile has loaded, so callers fall back to the procedural icon.
 */
const SIZE = 32;
const images = new Map<string, HTMLImageElement | null>();
const cache = new Map<string, string>();

function load(name: string): HTMLImageElement | null | undefined {
  if (images.has(name)) return images.get(name);
  images.set(name, null);
  const img = new Image();
  img.onload = () => images.set(name, img);
  img.onerror = () => images.set(name, null);
  img.src = `${import.meta.env.BASE_URL}art/items/x__${name}.png`;
  return null;
}

export const COMPOSED_TILES = ['misc__crystal', 'misc__phial', 'misc__stone', 'p_body__shoulder_pad', 'p_legs__belt_gray', 'p_legs__belt_redbrown', 'p_legs__pants_blue', 'p_legs__pants_brown', 'p_legs__pants_black', 'p_legs__leg_armor_0', 'p_legs__leg_armor_2', 'p_legs__leg_armor_4', 'p_legs__metal_gray', 'boulder', 'animal_skin', 'cloak2', 'quarterstaff', 'plant', 'bone', 'goldfish'];
COMPOSED_TILES.forEach(load);

export interface ComposedOptions {
  tint?: string;
  strength?: number;
  /** Crop to the opaque pixels, enlarge by whole steps and centre (for pieces that sit off-centre in their tile). */
  center?: boolean;
}

export function composedIconUrl(name: string, options: ComposedOptions = {}): string | undefined {
  const key = `${name}|${options.tint ?? ''}|${options.strength ?? ''}|${options.center ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const img = load(name);
  if (!img) return undefined;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext('2d');
  if (!g) return undefined;
  g.imageSmoothingEnabled = false;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (options.center) {
    const probe = document.createElement('canvas');
    probe.width = sw;
    probe.height = sh;
    const p = probe.getContext('2d');
    if (!p) return undefined;
    p.drawImage(img, 0, 0);
    const data = p.getImageData(0, 0, sw, sh).data;
    let x0 = sw;
    let y0 = sh;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if ((data[(y * sw + x) * 4 + 3] ?? 0) > 20) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      }
    }
    if (x1 >= 0) {
      sx = x0;
      sy = y0;
      sw = x1 - x0 + 1;
      sh = y1 - y0 + 1;
    }
  }
  const scale = Math.max(1, Math.floor(28 / Math.max(sw, sh)));
  const w = sw * scale;
  const h = sh * scale;
  const dx = Math.floor((SIZE - w) / 2);
  const dy = Math.floor((SIZE - h) / 2);
  g.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
  if (options.tint) {
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = options.strength ?? 0.5;
    g.fillStyle = options.tint;
    g.fillRect(0, 0, SIZE, SIZE);
  }
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
