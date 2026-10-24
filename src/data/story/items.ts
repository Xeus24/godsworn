import type { QuestItemDef } from '../../engine/items/types';

const q = (id: string, name: string, description: string, stack = 1): QuestItemDef => ({ id, name, category: 'quest', level: 1, value: 0, stack, description });

/** Items carried for quests: they cannot be sold or destroyed. */
export const QUEST_ITEMS: QuestItemDef[] = [
  q('unsworn-sigil', 'Unsworn Sigil', 'A wooden token carved with a broken circle. It is warm, and it should not be.'),
  q('severance-shard', 'Severance Shard', 'A splinter of nothing, wrapped in cloth. Your prayers feel quieter when you carry it.'),
  q('unsworn-orders', 'Unsworn Orders', 'Sealed orders for Legion-made blades, signed “I. Kaur”.'),
  q('oath-ring', 'Saint Orren’s Ring', 'A plain iron ring. Two hundred years ago, a boy swore an oath on it.'),
  q('letter-thornwick', 'Letter for Old Pell', 'Marked URGENT. It is probably a birthday card.'),
  q('water-skin', 'Water Skin', 'Full, cool and precious. Rule one.', 3),
  q('sun-crown', 'Crown of the Sun-King', 'Heavy, gold and cursed with the promise of eternity.'),
  q('smuggled-crate', 'Smuggled Crate', 'Very heavy, very locked. Smells of the Black Market.'),
  q('leviathan-egg', 'Leviathan Egg', 'Very large, very warm. Something inside is moving.'),
  q('stolen-ring', 'A Very Stolen Ring', 'Pretty. Do not look at it too long.'),
];
