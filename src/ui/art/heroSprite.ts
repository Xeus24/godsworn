import type { GearLook } from '../../engine/items/equipment';
import { drawPortrait } from './portraits';

/** Logical size of a hero body sprite (drawn about 1.5x in battle). */
export const HERO_W = 48;
export const HERO_H = 64;

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

type Px = (color: string, x: number, y: number, w?: number, h?: number) => void;

const STEEL = '#d8dce8';
const STEEL_DARK = '#8a90a8';
const GOLD = '#d8a838';
const WOOD = '#7a5230';

/** The weapon held in the hero's right hand (screen right), by weapon type. */
function drawWeapon(px: Px, type: string, accent: string): void {
  switch (type) {
    case 'greatsword':
      px(STEEL, 39, 6, 3, 34);
      px(STEEL_DARK, 41, 6, 1, 34);
      px(GOLD, 36, 40, 9, 2);
      px(WOOD, 39, 42, 3, 6);
      break;
    case 'axe':
    case 'greataxe':
      px(WOOD, 40, 12, 2, 36);
      px(STEEL, 41, 12, 6, 9);
      px(STEEL_DARK, 45, 13, 2, 7);
      if (type === 'greataxe') px(STEEL, 34, 12, 6, 9);
      break;
    case 'mace':
    case 'warhammer':
      px(WOOD, 40, 16, 2, 32);
      px(STEEL, 37, 8, 8, type === 'warhammer' ? 9 : 7);
      px(STEEL_DARK, 43, 9, 2, 6);
      break;
    case 'dagger':
    case 'throwing':
    case 'fist':
      px(STEEL, 40, 28, 2, 12);
      px(GOLD, 38, 40, 6, 2);
      px(WOOD, 40, 42, 2, 4);
      break;
    case 'rapier':
      px(STEEL, 40, 10, 1, 30);
      px(GOLD, 37, 40, 7, 2);
      px(WOOD, 40, 42, 2, 5);
      break;
    case 'spear':
      px(WOOD, 40, 6, 2, 46);
      px(STEEL, 39, 0, 4, 7);
      px(STEEL_DARK, 41, 1, 1, 6);
      break;
    case 'scythe':
      px(WOOD, 40, 8, 2, 42);
      px(STEEL, 34, 4, 9, 3);
      px(STEEL, 30, 6, 6, 3);
      px(STEEL_DARK, 28, 9, 4, 2);
      break;
    case 'bow':
    case 'crossbow':
      px(WOOD, 40, 12, 3, 4);
      px(WOOD, 42, 16, 2, 24);
      px(WOOD, 40, 40, 3, 4);
      px('#e8e0d0', 40, 16, 1, 24);
      break;
    case 'staff':
      px(WOOD, 40, 12, 2, 38);
      px(accent, 38, 5, 6, 6);
      px('#ffffff', 39, 6, 2, 2);
      break;
    case 'wand':
      px(WOOD, 40, 28, 2, 14);
      px(accent, 39, 25, 4, 4);
      break;
    case 'instrument':
      px(WOOD, 36, 26, 8, 12);
      px('#3a2210', 39, 29, 2, 3);
      px(WOOD, 40, 12, 2, 14);
      break;
    default:
      // Sword.
      px(STEEL, 40, 14, 2, 26);
      px(STEEL_DARK, 41, 14, 1, 26);
      px(GOLD, 37, 40, 8, 2);
      px(WOOD, 40, 42, 2, 5);
  }
}

/** A hand-held offhand item on the left: a shield, tome or orb. */
function drawOffhand(px: Px, type: string, accent: string): void {
  if (type === 'shield') {
    px(shade(accent, -0.35), 2, 28, 11, 13);
    px(STEEL, 3, 29, 9, 11);
    px(accent, 5, 31, 5, 7);
    px(GOLD, 7, 33, 1, 3);
  } else if (type === 'tome') {
    px('#5a2a2a', 3, 32, 9, 11);
    px('#e8dcb8', 4, 33, 7, 9);
    px(GOLD, 7, 35, 1, 4);
  } else if (type === 'orb') {
    px(accent, 4, 32, 7, 7);
    px('#ffffff', 5, 33, 2, 2);
  }
}


/** Base metal/cloth/leather tones by armor weight; the rarity color is used only for trim. */
const WEIGHT_TONE: Record<string, string> = { cloth: '#7a6aa8', leather: '#7a5230', mail: '#9aa2b8', plate: '#d0d6e6' };
const tone = (weight: string, fallback: string): string => WEIGHT_TONE[weight] ?? fallback;

/** Helm, pauldrons and the like, painted over the base body. Each piece shows its weight and a rarity-colored trim. */
function drawHelm(px: Px, p: NonNullable<GearLook['head']>): void {
  const base = tone(p.weight, '#9aa2b8');
  if (p.weight === 'cloth') {
    // Hood: a peaked cowl over the hair, falling in folds past the cheeks, with a shadowed opening.
    px(base, 18, -2, 12, 3);
    px(base, 15, 1, 18, 7);
    px(shade(base, -0.3), 14, 6, 3, 14);
    px(shade(base, -0.3), 31, 6, 3, 14);
    px(shade(base, -0.55), 17, 7, 14, 1);
    px(shade(base, 0.2), 20, -1, 8, 1);
    px(p.color, 15, 7, 18, 1);
  } else if (p.weight === 'leather') {
    px(base, 16, 1, 16, 5);
    px(shade(base, -0.3), 15, 5, 18, 2);
    px(p.color, 16, 1, 16, 1);
  } else {
    // Helm with a brow guard and a crest of trim.
    px(base, 15, 0, 18, 8);
    px(shade(base, 0.3), 16, 1, 16, 2);
    px(shade(base, -0.35), 15, 7, 18, 2);
    px(shade(base, -0.35), 23, 7, 2, 7);
    px(p.color, 23, -3, 2, 3);
    px(p.color, 15, 0, 18, 1);
  }
}

function drawShoulders(px: Px, p: NonNullable<GearLook['shoulders']>): void {
  const base = tone(p.weight, '#9aa2b8');
  for (const x of [9, 32]) {
    px(shade(base, -0.2), x, 22, 7, 6);
    px(shade(base, 0.3), x, 22, 7, 1);
    px(p.color, x, 27, 7, 1);
  }
}

const cache = new Map<string, HTMLCanvasElement>();

/**
 * A full-body battle sprite: the race's portrait as the head and shoulders,
 * with a cloak, armour in the class colour, legs and boots, and the hero's
 * weapon. Cached per look and loadout.
 */
export function heroSprite(raceId: string, variant: number, classColor: string, weapons: string[], look: GearLook = {}): HTMLCanvasElement {
  const key = `${raceId}|${variant}|${classColor}|${weapons.join(',')}|${JSON.stringify(look)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = HERO_W;
  canvas.height = HERO_H;
  const g = canvas.getContext('2d');
  if (!g) return canvas;
  const layer = document.createElement('canvas');
  layer.width = HERO_W;
  layer.height = HERO_H;
  const f = layer.getContext('2d');
  if (!f) return canvas;
  const px: Px = (color, x, y, w = 1, h = 1) => {
    f.fillStyle = color;
    f.fillRect(x, y, w, h);
  };
  const classMain = /^#[0-9a-f]{6}$/i.test(classColor) ? classColor : '#8a8aa0';
  // Worn chest armor recolors the torso (the class color remains for the cloak and offhand).
  const main = look.chest ? shade(tone(look.chest.weight, classMain), 0) : classMain;
  const dark = shade(look.cloak ? tone(look.cloak.weight, classMain) : classMain, -0.4);
  const light = shade(main, 0.3);
  const weapon = weapons.find((w) => w !== 'shield' && w !== 'tome' && w !== 'orb') ?? 'fist';
  const offhand = weapons.find((w) => w === 'shield' || w === 'tome' || w === 'orb');

  // Cloak, behind everything.
  px(dark, 12, 22, 24, 28);
  px(shade(dark, -0.2), 12, 44, 24, 6);
  // Legs and boots.
  const legs = look.legs ? shade(tone(look.legs.weight, '#2a2438'), -0.25) : '#2a2438';
  px(legs, 17, 40, 6, 12);
  px(legs, 25, 40, 6, 12);
  px('#1a1620', 17, 40, 1, 12);
  const boots = look.boots ? shade(tone(look.boots.weight, '#3a2a1a'), -0.3) : '#3a2a1a';
  px(boots, 15, 51, 9, 6);
  px(boots, 24, 51, 9, 6);
  if (look.boots) {
    px(look.boots.color, 15, 51, 9, 1);
    px(look.boots.color, 24, 51, 9, 1);
  }
  px('#5a4228', 15, 51, 9, 1);
  px('#5a4228', 24, 51, 9, 1);
  // Torso armour with a belt.
  px(main, 15, 24, 18, 16);
  px(light, 15, 24, 18, 2);
  px(light, 15, 24, 2, 16);
  px(shade(main, -0.25), 31, 26, 2, 14);
  px(GOLD, 15, 37, 18, 2);
  px('#fff4c0', 23, 37, 2, 2);
  px(shade(main, -0.2), 21, 28, 6, 6);
  if (look.chest) {
    px(look.chest.color, 15, 24, 18, 1);
    px(look.chest.color, 22, 29, 4, 4);
  }
  // Arms with gloves.
  px(shade(main, -0.15), 11, 25, 4, 12);
  px(shade(main, -0.15), 33, 25, 4, 12);
  const gloves = look.gloves ? shade(tone(look.gloves.weight, '#4a3a2a'), -0.2) : '#4a3a2a';
  px(gloves, 11, 36, 4, 4);
  px(gloves, 33, 36, 4, 4);
  if (look.gloves) {
    px(look.gloves.color, 11, 36, 4, 1);
    px(look.gloves.color, 33, 36, 4, 1);
  }

  // Head and shoulders from the portrait, over the body.
  const head = document.createElement('canvas');
  drawPortrait(head, raceId, variant, 'rgba(0,0,0,0)');
  f.drawImage(head, 8, -6);
  if (look.shoulders) drawShoulders(px, look.shoulders);
  if (look.head) drawHelm(px, look.head);

  drawOffhand(px, offhand ?? '', main);
  drawWeapon(px, weapon, main);

  // Tinted outline around the whole figure.
  g.drawImage(layer, 0, 0);
  const img = f.getImageData(0, 0, HERO_W, HERO_H);
  const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < HERO_W && y < HERO_H && (img.data[(y * HERO_W + x) * 4 + 3] ?? 0) > 20;
  g.fillStyle = '#120c18';
  for (let y = 0; y < HERO_H; y++) {
    for (let x = 0; x < HERO_W; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) g.fillRect(x, y, 1, 1);
    }
  }
  // Rim light on the upper-left edges and a cool shade on the lower-right, so the figure reads as lit from above left.
  for (let y = 0; y < HERO_H; y++) {
    for (let x = 0; x < HERO_W; x++) {
      if (!solid(x, y)) continue;
      if (!solid(x - 1, y) || !solid(x, y - 1)) {
        g.fillStyle = 'rgba(255,244,214,0.3)';
        g.fillRect(x, y, 1, 1);
      } else if (!solid(x + 1, y) || !solid(x, y + 1)) {
        g.fillStyle = 'rgba(24,12,56,0.3)';
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  cache.set(key, canvas);
  return canvas;
}
