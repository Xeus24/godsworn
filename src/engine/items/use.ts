import { content, type Content } from '../../data';
import type { StartingKitItem } from '../../data/items/loot';
import { characterStats } from '../character/stats';
import { reduceMeter } from '../world/mechanics';
import type { Character } from '../character/types';
import type { Result } from './equipment';
import { equipFromInventory } from './equipment';
import { createItem } from './generate';
import { addItem, consumeOne, expandInventory, type Inventory } from './inventory';
import { baseOf } from './lookup';

export type UseResult = { ok: true; message: string } | { ok: false; reason: string };

const fail = (reason: string): UseResult => ({ ok: false, reason });

/**
 * Uses a consumable outside combat. Combat-only items (bombs, escape
 * scrolls, feathers) are refused here and handled by the combat engine.
 * Identify scrolls need a target, so they go through identifyWith instead.
 */
export function useConsumableInField(char: Character, inv: Inventory, index: number, c: Content = content): UseResult {
  const item = inv.slots[index];
  if (!item) return fail('Nothing there.');
  const base = baseOf(item, c);
  if (base.category !== 'consumable') return fail('That cannot be used.');
  if (base.usableIn === 'combat') return fail('That can only be used in battle.');
  if (char.level < base.level) return fail(`Requires level ${base.level}.`);

  const action = base.action;
  if (c.races.get(char.raceId).noPotions && action.kind === 'effects' && action.effects.some((e) => e.kind === 'heal' || e.kind === 'restoreMp')) return fail('Your frame cannot drink potions. Mend with ore instead.');
  const stats = characterStats(char, {}, c);
  let message: string;
  switch (action.kind) {
    case 'effects': {
      let healed = 0;
      let restored = 0;
      for (const e of action.effects) {
        if (e.kind === 'heal') {
          const amount = Math.round((stats.maxHp * (e.percentMaxHp ?? 0)) / 100 + (e.base ?? 0));
          const before = char.hp;
          char.hp = Math.min(stats.maxHp, char.hp + amount);
          healed += char.hp - before;
        } else if (e.kind === 'restoreMp') {
          const before = char.mp;
          char.mp = Math.min(stats.maxMp, char.mp + e.amount);
          restored += char.mp - before;
        }
      }
      if (healed === 0 && restored === 0) return fail('You are already at full strength.');
      message = [healed ? `+${healed} HP` : '', restored ? `+${restored} MP` : ''].filter(Boolean).join(', ');
      break;
    }
    case 'timedBuff': {
      // Using the same elixir again refreshes its duration instead of stacking.
      char.timedBuffs = char.timedBuffs.filter((b) => b.id !== action.buffId);
      char.timedBuffs.push({ id: action.buffId, name: action.name, modifiers: action.modifiers, battlesLeft: action.battles });
      message = `${action.name}: active for ${action.battles} battles.`;
      break;
    }
    case 'meter': {
      if (!reduceMeter(char, action.meter, action.amount)) return fail('You have no need of that here.');
      message = 'You feel better for it.';
      break;
    }
    case 'skillPoint': {
      const primary = char.classes.find((p) => p.slot === 'primary');
      if (!primary) return fail('No class to train.');
      primary.skillPoints++;
      message = `+1 ${c.classes.get(primary.classId).name} skill point.`;
      break;
    }
    case 'expandInventory': {
      if (!expandInventory(inv, action.slots)) return fail('Your packs cannot get any bigger.');
      message = `+${action.slots} inventory slots.`;
      break;
    }
    case 'identify':
      return fail('Choose an item to identify.');
    case 'escape':
    case 'revive':
      return fail('That can only be used in battle.');
    case 'key':
      return fail(action.text);
  }
  consumeOne(inv, index);
  return { ok: true, message };
}

/** Removes one battle from every timed buff and drops expired ones. Returns the names that expired. */
export function tickTimedBuffs(char: Character): string[] {
  const expired: string[] = [];
  for (const b of char.timedBuffs) b.battlesLeft--;
  char.timedBuffs = char.timedBuffs.filter((b) => {
    if (b.battlesLeft > 0) return true;
    expired.push(b.name);
    return false;
  });
  return expired;
}

/** Gives a new character their class kit, equipping what can be equipped. */
export function applyStartingKit(
  char: Character,
  inv: Inventory,
  kit: readonly StartingKitItem[],
  newUid: () => string,
  c: Content = content,
): Result {
  for (const entry of kit) {
    const item = createItem(entry.itemId, entry.qty ?? 1, newUid, c);
    addItem(inv, item, c);
    if (entry.equip) {
      const index = inv.slots.indexOf(item);
      const result = equipFromInventory(char, inv, index, characterStats(char, {}, c), undefined, c);
      if (!result.ok) return { ok: false, reason: `${entry.itemId}: ${result.reason}` };
    }
  }
  return { ok: true };
}

/** Share of max HP one ore, leather or wood material restores when a Forged hero mends outside battle. */
export const MEND_SHARE = 0.35;

/** A Forged hero mends with materials from the pack: one ore, hide or plank restores 35% max HP. */
export function mendWithMaterial(char: Character, inv: Inventory, c: Content = content): UseResult {
  if (!c.races.get(char.raceId).noPotions) return fail('Only the Forged mend with materials.');
  const stats = characterStats(char, {}, c);
  if (char.hp >= stats.maxHp) return fail('You are already whole.');
  const index = inv.slots.findIndex((it) => {
    if (!it) return false;
    const b = baseOf(it, c);
    return b.category === 'material' && (b.kind === 'ore' || b.kind === 'leather' || b.kind === 'wood');
  });
  if (index < 0) return fail('You need ore, leather or wood in your pack.');
  const item = inv.slots[index];
  consumeOne(inv, index);
  const before = char.hp;
  char.hp = Math.min(stats.maxHp, char.hp + Math.round(stats.maxHp * MEND_SHARE));
  return { ok: true, message: `You mend with ${item ? baseOf(item, c).name : 'spare material'}: +${char.hp - before} HP.` };
}
