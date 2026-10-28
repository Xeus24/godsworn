import { content, type Content } from '../../data';
import type { ArmorSlot, EquipSlot } from './types';
import { ARMOR_SLOTS } from './types';
import { baseOf } from './lookup';
import type { Character } from '../character/types';
import type { ItemInstance } from './types';

/** Transmog, dyes and portrait frames. Skins are armor looks (weight and tier per slot), unlocked by owning one. */
export interface AppearanceState {
  /** Slot -> skin id (`weight:tier`) shown instead of the worn piece. */
  transmog: Partial<Record<ArmorSlot, string>>;
  /** Slot -> dye id. */
  dyes: Partial<Record<ArmorSlot, string>>;
  /** Skin ids per slot that have been owned: `slot:weight:tier`. */
  unlockedSkins: string[];
  unlockedDyes: string[];
  frame: string;
  unlockedFrames: string[];
}

export function createAppearanceState(): AppearanceState {
  return { transmog: {}, dyes: {}, unlockedSkins: [], unlockedDyes: [], frame: 'plain', unlockedFrames: ['plain'] };
}

export type AppearanceResult = { ok: true } | { ok: false; reason: string };

export const SKIN_SLOTS: readonly ArmorSlot[] = ARMOR_SLOTS.filter((s) => s !== 'belt');

const skinKey = (slot: string, weight: string, tier: number): string => `${slot}:${weight}:${tier}`;

export function skinLabel(weight: string, tier: number): string {
  return `${weight[0]?.toUpperCase()}${weight.slice(1)} (tier ${tier})`;
}

/** Records the look of an armor piece so it can be reused later. */
export function unlockSkinOf(app: AppearanceState, item: ItemInstance, c: Content = content): void {
  const b = baseOf(item, c);
  if (b.category !== 'armor') return;
  const key = skinKey(b.slot, b.weight, b.tier);
  if (!app.unlockedSkins.includes(key)) app.unlockedSkins.push(key);
}

/** Learns every look the hero wears or holds, every free dye, and every frame whose achievement is earned. */
export function syncAppearance(app: AppearanceState, char: Character, held: readonly (ItemInstance | null | undefined)[], achievements: Record<string, number>, c: Content = content): void {
  for (const it of Object.values(char.equipment)) if (it) unlockSkinOf(app, it, c);
  for (const it of held) if (it) unlockSkinOf(app, it, c);
  for (const d of c.dyes.all()) if (d.cost === 0 && !app.unlockedDyes.includes(d.id)) app.unlockedDyes.push(d.id);
  for (const f of c.frames.all()) {
    if (f.achievement && achievements[f.achievement] !== undefined && !app.unlockedFrames.includes(f.id)) app.unlockedFrames.push(f.id);
  }
}

/** Skins usable on a slot: tier and weight of unlocked pieces made for that slot. */
export function skinsFor(app: AppearanceState, slot: ArmorSlot): { id: string; weight: string; tier: number }[] {
  return app.unlockedSkins
    .filter((k) => k.startsWith(`${slot}:`))
    .map((k) => {
      const [, weight = 'cloth', tier = '1'] = k.split(':');
      return { id: `${weight}:${tier}`, weight, tier: Number(tier) };
    })
    .sort((a, b) => a.weight.localeCompare(b.weight) || a.tier - b.tier);
}

export function setTransmog(app: AppearanceState, slot: EquipSlot, skin: string | null): AppearanceResult {
  if (!(SKIN_SLOTS as readonly string[]).includes(slot)) return { ok: false, reason: 'That slot cannot be transmogrified.' };
  const s = slot as ArmorSlot;
  if (skin === null) {
    delete app.transmog[s];
    return { ok: true };
  }
  if (!skinsFor(app, s).some((k) => k.id === skin)) return { ok: false, reason: 'You have not owned that look for this slot yet.' };
  app.transmog[s] = skin;
  return { ok: true };
}

export function setDye(app: AppearanceState, slot: EquipSlot, dye: string | null): AppearanceResult {
  if (!(SKIN_SLOTS as readonly string[]).includes(slot)) return { ok: false, reason: 'That slot cannot be dyed.' };
  const s = slot as ArmorSlot;
  if (dye === null) {
    delete app.dyes[s];
    return { ok: true };
  }
  if (!app.unlockedDyes.includes(dye)) return { ok: false, reason: 'You have not learned that dye.' };
  app.dyes[s] = dye;
  return { ok: true };
}

export function setFrame(app: AppearanceState, frame: string): AppearanceResult {
  if (!app.unlockedFrames.includes(frame)) return { ok: false, reason: 'That frame is still locked.' };
  app.frame = frame;
  return { ok: true };
}

/** Learning a premium dye costs gold; the caller spends it. */
export function dyeCost(dyeId: string, c: Content = content): number {
  return c.dyes.get(dyeId).cost;
}

export function learnDye(app: AppearanceState, dyeId: string, c: Content = content): AppearanceResult {
  if (!c.dyes.has(dyeId)) return { ok: false, reason: 'Unknown dye.' };
  if (app.unlockedDyes.includes(dyeId)) return { ok: false, reason: 'Already learned.' };
  app.unlockedDyes.push(dyeId);
  return { ok: true };
}
