import { content } from '../../data';
import { characterStats } from '../../engine/character/stats';
import { compareEquip } from '../../engine/items/compare';
import { canEquip, defaultSlot, setPieceCounts } from '../../engine/items/equipment';
import { activeRuneword, baseStatMultiplier, itemValue, sellValue } from '../../engine/items/itemStats';
import { baseOf, isGear, requiredLevel, uniqueOf } from '../../engine/items/lookup';
import { itemName } from '../../engine/items/naming';
import { usesOf } from '../../engine/items/uses';
import type { ItemInstance } from '../../engine/items/types';
import type { GameSession } from '../../engine/state/gameState';
import { formatStat } from '../format';
import { el } from '../screen';
import { formatModifier, slotLabel } from './itemText';

const line = (cls: string, text: string): HTMLElement => el('div', { class: cls }, text);

/** Full tooltip for an item, with comparison against equipped gear when `session` is given. */
export function itemTooltip(item: ItemInstance, session?: GameSession, equippedHere = false): HTMLElement {
  const base = baseOf(item);
  const rarity = content.rarities.get(item.rarity);
  const unique = uniqueOf(item);
  const out: HTMLElement[] = [];

  out.push(el('div', { class: 'tip-title', style: `color:${rarity.color === '#1a1a1a' ? '#c8b8ff' : rarity.color}` }, itemName(item)));

  // Type line.
  const typeName =
    base.category === 'weapon'
      ? content.weaponTypes.get(base.weaponType).name
      : base.category === 'armor'
        ? `${content.armorWeights.get(base.weight).name} ${slotLabel(base.slot)}`
        : base.category === 'accessory'
          ? slotLabel(base.kind === 'ring' ? 'ring1' : base.kind === 'earring' ? 'earring1' : base.kind)
          : base.category[0]?.toUpperCase() + base.category.slice(1);
  const quality = item.quality !== 'normal' && isGear(item) ? ` · ${content.qualities.get(item.quality).name}` : '';
  out.push(line('tip-desc', `${rarity.name} ${typeName}${quality}${isGear(item) ? ` · iLvl ${item.itemLevel}` : ''}`));
  if (item.corruption) out.push(line('tip-corrupt', 'Corrupted'));
  if (item.junk) out.push(line('tip-junk', 'Marked as junk'));

  if (!item.identified) {
    out.push(line('tip-bad', 'Unidentified. Use a Scroll of Identify (or Appraise) to reveal its powers.'));
  }

  // Skillbooks: what they teach and how far along you are.
  if (base.category === 'book') {
    const skill = content.generalSkills.find(base.teaches);
    if (skill) {
      const rank = session?.player.generalSkills[skill.id]?.rank ?? 0;
      out.push(line('tip-base', `Teaches ${skill.name} (${skill.category})`));
      out.push(line('tip-desc', skill.description));
      if (session) out.push(line(rank >= skill.maxRank ? 'tip-bad' : 'tip-good', rank > 0 ? `You know it: rank ${rank}/${skill.maxRank}` : 'Not yet learned.'));
      if (skill.requirements?.level) out.push(line('tip-desc', `Requires level ${skill.requirements.level}`));
    }
  }

  // Base numbers.
  const mult = baseStatMultiplier(item);
  const r = item.baseRolls;
  const baseLines: string[] = [];
  if (r.damage) baseLines.push(`${Math.round(r.damage * mult)} Weapon Damage`);
  if (r.magic) baseLines.push(`${Math.round(r.magic * mult)} Weapon Magic`);
  if (r.armor) baseLines.push(`${Math.round(r.armor * mult)} Armor`);
  if (r.resist) baseLines.push(`${Math.round(r.resist * mult)} Magic Resist`);
  for (const b of baseLines) out.push(line('tip-base', b));
  if ((base.category === 'weapon' || base.category === 'armor' || base.category === 'accessory') && base.implicit.length) {
    for (const m of base.implicit) out.push(line('tip-implicit', formatModifier(m)));
  }

  if (item.identified) {
    for (const a of item.affixes) {
      const def = content.affixes.get(a.id);
      def.stats.forEach((s, i) => {
        out.push(el('div', { class: 'tip-affix' }, formatModifier({ ...s, value: a.values[i] ?? 0 }), el('span', { class: 'tip-tier' }, ` T${a.tier + 1}`)));
      });
    }
    if (unique) {
      for (const m of unique.modifiers) out.push(line('tip-unique', formatModifier(item.ascended ? { ...m, value: Math.round(m.value * 1.25 * 10) / 10 } : m)));
      for (const t of unique.effectText) out.push(line('tip-unique', t));
    }
    if (item.corruption) {
      out.push(line('tip-corrupt', content.corruptions.get(item.corruption.boon).text));
      out.push(line('tip-bad', content.corruptions.get(item.corruption.drawback).text));
    }
  }

  // Sockets and runewords.
  if (item.sockets.length > 0) {
    const rw = activeRuneword(item);
    if (rw) out.push(line('tip-runeword', `Runeword: ${rw.name} — ${rw.text}`));
    for (const s of item.sockets) out.push(line(s ? 'tip-socket' : 'tip-desc', s ? `◆ ${content.items.get(s).name}` : '◇ Empty socket'));
  }

  // Set progress.
  if (unique?.setId && session) {
    const set = content.itemSets.get(unique.setId);
    const have = setPieceCounts(session.player).get(set.id) ?? 0;
    out.push(line('tip-set', `${set.name} (${have}/${set.pieces.length})`));
    const equippedIds = new Set(Object.values(session.player.equipment).map((i) => i?.uniqueId));
    for (const p of set.pieces) out.push(line(equippedIds.has(p) ? 'tip-set' : 'tip-desc', `  ${content.uniques.get(p).name}`));
    for (const b of set.bonuses) out.push(line(have >= b.pieces ? 'tip-set' : 'tip-desc', `(${b.pieces}) ${b.text}`));
  }

  // Abilities.
  const ability = unique?.activeAbility ?? (base.category === 'accessory' ? base.onUse : undefined);
  if (ability && item.identified) out.push(line('tip-ability', `Use: ${ability.name} — ${ability.description} (${ability.cooldown}-turn cooldown)`));
  if (unique?.awakening && item.identified) {
    const aw = unique.awakening;
    const progress = item.awakening?.progress ?? 0;
    out.push(
      item.awakening?.awakened
        ? line('tip-unique', `Awakened: ${aw.effectText}`)
        : line('tip-desc', `Dormant: ${aw.description} (${progress}/${aw.count}). Awakens: ${aw.effectText}`),
    );
  }

  if (base.description) out.push(line('tip-desc', base.description));
  if (base.category === 'curiosity' && base.lovedBy?.length) {
    out.push(line('tip-desc', `Treasured by ${base.lovedBy.map((g) => content.gods.get(g).name).join(' and ')}.`));
  }
  if (unique?.lore && item.identified) out.push(line('tip-lore', unique.lore));

  // Durability and requirements.
  if (item.durability) {
    const d = item.durability;
    out.push(line(d.current === 0 ? 'tip-bad' : 'tip-desc', d.current === 0 ? 'BROKEN: repair to restore its stats' : `Durability ${d.current}/${d.max}`));
  }
  if (session) {
    const req = requiredLevel(item);
    if (req > 1) out.push(line(session.player.level >= req ? 'tip-desc' : 'tip-bad', `Requires level ${req}`));
    if (isGear(item) && !equippedHere) {
      const slot = defaultSlot(session.player, item);
      const check = slot ? canEquip(session.player, item, slot, characterStats(session.player)) : { ok: false as const, reason: 'Cannot be equipped.' };
      // The level requirement already has its own line above; only other reasons are new information.
      if (!check.ok && item.identified && !/^Requires level/i.test(check.reason)) out.push(line('tip-bad', check.reason));
      else if (item.identified) {
        const deltas = compareEquip(session.player, item);
        if (deltas.length > 0) {
          out.push(line('tip-desc', slot && session.player.equipment[slot] ? 'If equipped (vs current):' : 'If equipped:'));
          for (const { stat, delta } of deltas.slice(0, 12)) {
            // For Damage Taken, lower is better.
            const good = stat === 'damageTaken' ? delta < 0 : delta > 0;
            out.push(line(good ? 'tip-good' : 'tip-bad', `${delta > 0 ? '+' : ''}${formatStat(stat, delta)} ${content.stats.get(stat).name}`));
          }
        }
      }
    }
  }
  if (item.locked) out.push(line('tip-desc', 'Locked: safe from salvage, selling, offering and auto-stash.'));
  if (item.found) out.push(line('tip-lore', `Found on day ${item.found.day} in ${item.found.zone}.`));
  if (session) {
    const uses = usesOf(session.state, item.baseId);
    const names = (list: string[]): string => `${list.slice(0, 3).join(', ')}${list.length > 3 ? ` +${list.length - 3} more` : ''}`;
    if (uses.quests.length > 0) out.push(line('tip-good', `Needed for: ${names(uses.quests)}`));
    if (uses.recipes.length > 0) out.push(line('tip-desc', `Crafting: ${names(uses.recipes)}`));
  }
  out.push(line('tip-value', `Value ${itemValue(item)}g · sells for ${sellValue(item)}g`));
  return el('div', { class: 'item-tip' }, ...out);
}

/**
 * The tooltip for a bag or stash item: for gear that would replace something,
 * the item's card with the currently equipped item's card beside it.
 */
export function compareTooltip(item: ItemInstance, session: GameSession): HTMLElement {
  const card = itemTooltip(item, session);
  if (!isGear(item) || !item.identified) return card;
  const slot = defaultSlot(session.player, item);
  const worn = slot ? session.player.equipment[slot] : undefined;
  if (!worn || worn === item) return card;
  return el('div', { class: 'tip-pair' }, card, el('div', { class: 'tip-worn' }, el('div', { class: 'tip-worn-label' }, 'Currently equipped'), itemTooltip(worn, session, true)));
}
