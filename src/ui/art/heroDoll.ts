import type { GearLook } from '../../engine/items/equipment';
import { DOLL } from './dcssDoll';

/**
 * The hero as a layered Dungeon Crawl Stone Soup paper doll (CC0, public/art/player), so heroes
 * match the monster tiles: race body, legs, boots, torso armor, cloak, gloves, hair, headgear and
 * the weapon and offhand, picked from the worn gear's weight and tier. Returns undefined until every
 * layer has loaded; callers then draw the procedural hero sprite instead.
 */
const SCALE = 3;
const PAD = 4;
const SIZE = 32 * SCALE + PAD * 2;
const OUTLINE = '#120c18';
const HAIRED = new Set(['human', 'elf', 'dwarf', 'gnome', 'fae', 'nephilim']);

type Layers = string[];

const images = new Map<string, HTMLImageElement | null>();
const built = new Map<string, HTMLCanvasElement>();

const at = (list: (string | null)[] | undefined, i: number): string | undefined => {
  const l = (list ?? []).filter((x): x is string => !!x);
  return l.length ? l[Math.max(0, Math.min(i, l.length - 1))] : undefined;
};

function layersFor(raceId: string, variant: number, weapons: string[], look: GearLook): Layers {
  const v = Math.abs(Math.floor(variant));
  const out: Layers = [];
  const bases = DOLL.base as Record<string, (string | null)[]>;
  const base = at(bases[raceId] ?? bases.human, v % 2);
  const piece = (layer: 'body' | 'legs' | 'boots' | 'gloves' | 'head', worn: GearLook[keyof GearLook]): string | undefined => {
    const table = DOLL[layer] as Record<string, (string | null)[]>;
    if (!worn) return layer === 'body' || layer === 'legs' || layer === 'boots' ? at(table.default, layer === 'body' ? v % 4 : 0) : undefined;
    return at(table[worn.weight] ?? table.leather, worn.tier - 1);
  };
  if (base) out.push(base);
  for (const l of [piece('boots', look.boots), piece('legs', look.legs), piece('body', look.chest)]) if (l) out.push(l);
  if (look.cloak) {
    const c = at((DOLL.cloak as Record<string, (string | null)[]>).any, look.cloak.tier - 1);
    if (c) out.push(c);
  }
  const gloves = piece('gloves', look.gloves);
  if (gloves) out.push(gloves);
  if (HAIRED.has(raceId) && !look.head) {
    const h = at(DOLL.hair as (string | null)[], v % (DOLL.hair as unknown[]).length);
    if (h) out.push(h);
  }
  const head = piece('head', look.head);
  if (head) out.push(head);
  const right = DOLL.right as Record<string, string | null>;
  const left = DOLL.left as Record<string, string | null>;
  const main = weapons.find((w) => right[w]);
  if (main && right[main]) out.push(right[main] as string);
  const off = weapons.find((w) => w === 'shield' || w === 'tome' || w === 'orb');
  if (off && left[off]) out.push(left[off] as string);
  return out;
}

function load(name: string): HTMLImageElement | null | undefined {
  if (images.has(name)) return images.get(name);
  images.set(name, null);
  const img = new Image();
  img.onload = () => images.set(name, img);
  img.onerror = () => images.set(name, null);
  img.src = `${import.meta.env.BASE_URL}art/player/${name}.png`;
  return null;
}

export function heroDoll(raceId: string, variant: number, weapons: string[], look: GearLook = {}): HTMLCanvasElement | undefined {
  const key = `${raceId}|${variant}|${weapons.join(',')}|${JSON.stringify(look)}`;
  const hit = built.get(key);
  if (hit) return hit;
  const names = layersFor(raceId, variant, weapons, look);
  if (!names.length) return undefined;
  const imgs = names.map(load);
  if (imgs.some((i) => !i)) return undefined;
  const sprites = imgs as HTMLImageElement[];
  const out = document.createElement('canvas');
  out.width = SIZE;
  out.height = SIZE;
  const g = out.getContext('2d');
  const sil = document.createElement('canvas');
  sil.width = SIZE;
  sil.height = SIZE;
  const s = sil.getContext('2d');
  if (!g || !s) return undefined;
  g.imageSmoothingEnabled = false;
  s.imageSmoothingEnabled = false;
  for (const img of sprites) s.drawImage(img, PAD, PAD, 32 * SCALE, 32 * SCALE);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = OUTLINE;
  s.fillRect(0, 0, SIZE, SIZE);
  for (const [dx, dy] of [[SCALE, 0], [-SCALE, 0], [0, SCALE], [0, -SCALE]] as const) g.drawImage(sil, dx, dy);
  for (const img of sprites) g.drawImage(img, PAD, PAD, 32 * SCALE, 32 * SCALE);
  built.set(key, out);
  return out;
}
