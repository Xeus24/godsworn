import { content } from '../../data';
import { baseOf } from '../../engine/items/lookup';
import type { ItemBaseDef, ItemInstance } from '../../engine/items/types';
import { ITEM_TILES } from './dcssItemTiles';
import { ITEM_PATTERNS, ITEM_PATTERN_VARIANTS } from './itemPatterns';

const SIZE = 16;
const OUTLINE = '#120c18';

/** Material colors per family, indexed by tier - 1. */
const FAMILY_COLORS: Record<string, string[]> = {
  metal: ['#9aa3ad', '#c3ccd6', '#a9dcff', '#7fa08a', '#c7b6ff', '#f2c94c', '#8a5cff'],
  wood: ['#a0683a', '#c08a50', '#6b4a2a', '#7a5a8a', '#9ab8d8', '#e8c060', '#5a3a8a'],
  cloth: ['#d8d0c0', '#9a7a5a', '#c04a6a', '#4a6ac0', '#c0c8e8', '#f2c94c', '#6a3ab0'],
  leather: ['#8a5a2a', '#6f4a2a', '#5a7a3a', '#3e3e52', '#3a7a8a', '#b08a4a', '#5a2a7a'],
  jewel: ['#c87a3a', '#d8d8e0', '#e8c040', '#eef0f8', '#c8b8ff', '#ffe080', '#8a5cff'],
};

const GEM_COLORS: Record<string, string> = {
  ruby: '#e0283c',
  sapphire: '#2f6fe0',
  topaz: '#f0b020',
  emerald: '#2fbf5a',
  diamond: '#eef6ff',
  amethyst: '#a050e0',
  onyx: '#3a3040',
};

const FIXED: Record<string, string> = {
  g: '#5a3418',
  h: '#8a5a2a',
  a: '#e0a63a',
  w: '#f4f0e8',
  p: '#e8dcc0',
  k: '#2a2030',
  r: '#d9433b',
  v: '#4fa34a',
  c: '#5fd1e4',
  y: '#ffd54a',
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

interface IconSpec {
  pattern: string;
  main: string;
  energy: string;
  /** Silhouette variant (0 = the default pattern) and trim color; both are optional. */
  variant?: number;
  accent?: string;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function weaponFamily(type: string): string {
  if (['bow', 'crossbow', 'staff', 'wand', 'instrument'].includes(type)) return 'wood';
  if (type === 'tome') return 'leather';
  return 'metal';
}

function liquidColor(base: ItemBaseDef): string {
  if (base.id.startsWith('health')) return '#d9433b';
  if (base.id.startsWith('mana')) return '#3f7fe8';
  if (base.id.startsWith('spirit')) return '#4fd36b';
  return '#b05cff';
}

/** Chooses pattern and colors for an item. `energy` defaults to the rarity color. */
function baseSpec(item: ItemInstance): IconSpec {
  const base = baseOf(item);
  const rarityColor = content.rarities.get(item.rarity).color;
  const energy = item.rarity === 'common' || item.rarity === 'junk' ? '#7fd8ff' : rarityColor;
  const tierColor = (family: string, tier: number): string => (FAMILY_COLORS[family] ?? [])[tier - 1] ?? '#9aa3ad';
  switch (base.category) {
    case 'weapon':
      return { pattern: base.weaponType, main: tierColor(weaponFamily(base.weaponType), base.tier), energy };
    case 'armor':
      return { pattern: base.slot, main: tierColor(base.weight === 'mail' || base.weight === 'plate' ? 'metal' : base.weight, base.tier), energy };
    case 'accessory':
      return { pattern: base.kind, main: tierColor('jewel', base.tier), energy };
    case 'relic':
      return { pattern: 'relic', main: '#b08a4a', energy: '#ffe08a' };
    case 'gem':
      return { pattern: 'gem', main: GEM_COLORS[base.gemType] ?? '#ffffff', energy };
    case 'rune':
      return { pattern: 'rune', main: '#7a7f8a', energy: '#7fd8ff' };
    case 'consumable': {
      const pattern: Record<string, string> = {
        potion: 'potion',
        elixir: 'flask',
        food: 'food',
        throwable: base.id === 'oil-flask' || base.id === 'holy-water' ? 'flask' : 'bomb',
        scroll: 'scroll',
        revive: 'feather',
        cleanse: 'salts',
        tome: 'book',
        bag: 'bag',
      };
      const energyByKind = base.kind === 'potion' || base.kind === 'elixir' ? liquidColor(base) : base.id === 'holy-water' ? '#ffe08a' : '#f0a020';
      return { pattern: pattern[base.kind] ?? 'potion', main: '#8a6a4a', energy: energyByKind };
    }
    case 'material': {
      const byKind: Record<string, [string, string]> = {
        ore: ['ore', tierColor('metal', Math.min(7, base.tier + 1))],
        wood: ['plank', '#a0683a'],
        leather: ['hide', tierColor('leather', base.tier)],
        cloth: ['cloth', tierColor('cloth', base.tier)],
        herb: ['herb', '#4fa34a'],
        essence: ['essence', '#7fd8ff'],
        monster: ['fang', '#e8e0d0'],
        divine: ['shard', '#ffd54a'],
        void: ['fragment', '#2b1b3d'],
        fish: ['fish', tierColor('jewel', base.tier + 1)],
      };
      const [pattern, main] = byKind[base.kind] ?? ['ore', '#9aa3ad'];
      const essenceColors = ['#d8d8d8', '#4fd36b', '#4a8dff', '#ff9a1f', '#ff3b3b', '#ff7ff0'];
      return { pattern, main, energy: base.kind === 'essence' ? (essenceColors[base.tier - 1] ?? '#ffffff') : '#b05cff' };
    }
    case 'curiosity':
      return { pattern: 'curiosity', main: '#e8e0d0', energy };
    case 'book':
      // Skillbooks are bound in their rarity's color; Grimoires in black leather.
      return { pattern: 'tome', main: base.grimoire ? '#2a2030' : rarityColor === '#f2f2f2' ? '#8a6a4a' : rarityColor, energy: base.grimoire ? '#c02a4a' : '#ffe08a' };
    case 'recipe':
      return { pattern: 'scroll', main: '#e8dcb8', energy: rarityColor };
    case 'quest':
      return { pattern: 'curiosity', main: '#ffd84a', energy: '#ff9a1f' };
  }
}

/**
 * Chooses an icon's shape and trim: the shape varies by base item, and Epic and
 * better items wear their rarity color as trim so rarity reads inside the icon.
 */
export function iconSpec(item: ItemInstance): IconSpec {
  const spec = baseSpec(item);
  const variants = ITEM_PATTERN_VARIANTS[spec.pattern]?.length ?? 0;
  const out: IconSpec = { ...spec };
  if (variants) out.variant = hash(item.baseId) % (variants + 1);
  const order = content.rarities.get(item.rarity).order;
  if (order >= 4) out.accent = spec.energy;
  // Uniques get a slightly different metal tone each, so two uniques of one base differ.
  if (item.uniqueId) out.main = shade(spec.main, ((hash(item.uniqueId) % 5) - 2) * 0.07);
  return out;
}

const cache = new Map<string, string>();

/** Renders (and caches) an icon as a PNG data URL. */
export function iconUrl(spec: IconSpec): string {
  const key = `${spec.pattern}|${spec.main}|${spec.energy}|${spec.variant ?? 0}|${spec.accent ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const alt = spec.variant ? ITEM_PATTERN_VARIANTS[spec.pattern]?.[spec.variant - 1] : undefined;
  const rows = alt ?? ITEM_PATTERNS[spec.pattern] ?? ITEM_PATTERNS.curiosity ?? [];
  const palette: Record<string, string> = {
    ...FIXED,
    m: spec.main,
    l: shade(spec.main, 0.35),
    d: shade(spec.main, -0.35),
    e: spec.energy,
    ...(spec.accent ? { a: spec.accent } : {}),
  };
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const ox = Math.floor((SIZE - w) / 2);
  const oy = Math.floor((SIZE - h) / 2);
  const filled = new Set<number>();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      filled.add((oy + y) * SIZE + ox + x);
    });
  });
  // Outline first, then fills on top.
  ctx.fillStyle = OUTLINE;
  for (const p of filled) {
    const x = p % SIZE;
    const y = Math.floor(p / SIZE);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      if (!filled.has(ny * SIZE + nx)) ctx.fillRect(nx, ny, 1, 1);
    }
  }
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    });
  });
  // Edge shading: a light rim toward the upper left and a cool shadow toward the lower right.
  for (const p of filled) {
    const x = p % SIZE;
    const y = Math.floor(p / SIZE);
    const has = (dx: number, dy: number): boolean => filled.has((y + dy) * SIZE + x + dx);
    if (!has(-1, 0) || !has(0, -1)) {
      ctx.fillStyle = 'rgba(255,246,220,0.28)';
      ctx.fillRect(x, y, 1, 1);
    } else if (!has(1, 0) || !has(0, 1)) {
      ctx.fillStyle = 'rgba(24,12,56,0.28)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

export function itemIconUrl(item: ItemInstance): string {
  return tileIconUrl(item) ?? iconUrl(iconSpec(item));
}

/** The Dungeon Crawl tile for a mapped item, or undefined when it keeps its procedural icon. */
function tileIconUrl(item: ItemInstance): string | undefined {
  const base = baseOf(item);
  const pick = (key: string, tier?: number): string | undefined => {
    const list = ITEM_TILES[key];
    if (!list?.length) return undefined;
    const idx = tier ? Math.min(tier - 1, 6) % list.length : hash(base.id) % list.length;
    return `${import.meta.env.BASE_URL}art/items/${list[idx]}.png`;
  };
  switch (base.category) {
    case 'weapon':
      return pick(`weapon:${base.weaponType}`, base.tier);
    case 'armor':
      return pick(`armor:${base.slot}:${base.weight}`, base.tier) ?? pick(`armor:${base.slot}`, base.tier);
    case 'accessory':
      return pick(`accessory:${base.kind}`, base.tier);
    case 'consumable':
      if (base.kind === 'potion' || base.kind === 'elixir') {
        const liquid = base.kind === 'potion' && /^(health|mana|spirit)/.exec(base.id)?.[1];
        return pick(`potion:${liquid || 'other'}`);
      }
      if (base.kind === 'food') return pick('food');
      if (base.kind === 'scroll') return pick('scroll');
      if (base.kind === 'tome') return pick('book');
      if (base.kind === 'bag') return pick('bag');
      return undefined;
    case 'book':
      return pick('book');
    case 'recipe':
      return pick('scroll');
    default:
      return undefined;
  }
}
