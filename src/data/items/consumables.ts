import type { ConsumableDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';

interface BuffConsumable {
  id: string;
  name: string;
  kind: 'elixir' | 'food';
  level: number;
  value: number;
  mods: ModifierSpec[];
  battles: number;
  desc: string;
}

const SIZES = [
  { id: 'minor', name: 'Minor', level: 1, pct: 25, value: 15 },
  { id: 'lesser', name: 'Lesser', level: 12, pct: 35, value: 45 },
  { id: 'greater', name: 'Greater', level: 25, pct: 50, value: 120 },
  { id: 'major', name: 'Major', level: 40, pct: 70, value: 300 },
  { id: 'supreme', name: 'Supreme', level: 55, pct: 100, value: 700 },
];

/** Health potions heal a share of max HP; mana potions restore flat MP scaled by size. */
const potions: ConsumableDef[] = SIZES.flatMap((s, i): ConsumableDef[] => [
  {
    id: `health-potion-${s.id}`,
    name: `${s.name} Health Potion`,
    category: 'consumable',
    kind: 'potion',
    usableIn: 'both',
    level: s.level,
    value: s.value,
    stack: 99,
    description: `Restores ${s.pct}% of max HP.`,
    action: { kind: 'effects', effects: [{ kind: 'heal', percentMaxHp: s.pct, target: 'self' }] },
  },
  {
    id: `mana-potion-${s.id}`,
    name: `${s.name} Mana Potion`,
    category: 'consumable',
    kind: 'potion',
    usableIn: 'both',
    level: s.level,
    value: s.value,
    stack: 99,
    description: `Restores ${[40, 100, 220, 450, 900][i]} MP.`,
    action: { kind: 'effects', effects: [{ kind: 'restoreMp', amount: [40, 100, 220, 450, 900][i] ?? 40, target: 'self' }] },
  },
  {
    id: `spirit-tonic-${s.id}`,
    name: `${s.name} Spirit Tonic`,
    category: 'consumable',
    kind: 'potion',
    usableIn: 'combat',
    level: s.level,
    value: Math.round(s.value * 1.2),
    stack: 99,
    description: `Restores ${[20, 30, 45, 65, 100][i]}% of your class resource.`,
    action: { kind: 'effects', effects: [{ kind: 'gainResource', resource: 'class', amount: [20, 30, 45, 65, 100][i] ?? 20 }] },
  },
]);

/** Elixirs and food last several battles and stack with each other (one of each id). */
const BUFFS: BuffConsumable[] = [
  { id: 'elixir-of-might', name: 'Elixir of Might', kind: 'elixir', level: 5, value: 80, mods: [{ stat: 'physicalAttack', type: 'percent', value: 15 }], battles: 10, desc: '+15% physical attack for 10 battles.' },
  { id: 'elixir-of-the-mind', name: 'Elixir of the Mind', kind: 'elixir', level: 5, value: 80, mods: [{ stat: 'magicAttack', type: 'percent', value: 15 }], battles: 10, desc: '+15% magic attack for 10 battles.' },
  { id: 'elixir-of-iron', name: 'Elixir of Iron Skin', kind: 'elixir', level: 10, value: 100, mods: [{ stat: 'defense', type: 'percent', value: 20 }], battles: 10, desc: '+20% defense for 10 battles.' },
  { id: 'elixir-of-fortune', name: 'Elixir of Fortune', kind: 'elixir', level: 15, value: 150, mods: [{ stat: 'magicFind', type: 'flat', value: 25 }, { stat: 'goldFind', type: 'flat', value: 25 }], battles: 15, desc: '+25% magic and gold find for 15 battles.' },
  { id: 'elixir-of-wisdom', name: 'Elixir of Wisdom', kind: 'elixir', level: 15, value: 150, mods: [{ stat: 'xpGain', type: 'flat', value: 20 }], battles: 15, desc: '+20% XP for 15 battles.' },
  { id: 'hearty-stew', name: 'Hearty Stew', kind: 'food', level: 1, value: 25, mods: [{ stat: 'maxHp', type: 'percent', value: 8 }, { stat: 'hpRegen', type: 'flat', value: 3 }], battles: 5, desc: '+8% max HP, +3 HP regen for 5 battles.' },
  { id: 'spiced-fish', name: 'Spiced Fish', kind: 'food', level: 8, value: 40, mods: [{ stat: 'speed', type: 'flat', value: 2 }, { stat: 'critChance', type: 'flat', value: 2 }], battles: 5, desc: '+2 speed, +2% crit for 5 battles.' },
  { id: 'honeyed-bread', name: 'Honeyed Bread', kind: 'food', level: 4, value: 30, mods: [{ stat: 'mpRegen', type: 'flat', value: 3 }, { stat: 'maxMp', type: 'percent', value: 8 }], battles: 5, desc: '+8% max MP, +3 MP regen for 5 battles.' },
  { id: 'silverfin-platter', name: 'Silverfin Platter', kind: 'food', level: 18, value: 70, mods: [{ stat: 'critDamage', type: 'flat', value: 12 }, { stat: 'accuracy', type: 'flat', value: 4 }], battles: 6, desc: '+12% crit damage, +4 accuracy for 6 battles.' },
  { id: 'feast-of-heroes', name: 'Feast of Heroes', kind: 'food', level: 40, value: 250, mods: [{ stat: 'damageBonus', type: 'flat', value: 10 }, { stat: 'maxHp', type: 'percent', value: 10 }, { stat: 'xpGain', type: 'flat', value: 10 }], battles: 10, desc: '+10% damage, +10% max HP and +10% XP for 10 battles.' },
  { id: 'dragon-pepper-roast', name: 'Dragon-Pepper Roast', kind: 'food', level: 30, value: 120, mods: [{ stat: 'fireDamage', type: 'flat', value: 15 }, { stat: 'fireResist', type: 'flat', value: 15 }], battles: 8, desc: '+15% fire damage and resist for 8 battles.' },
];

const buffs: ConsumableDef[] = BUFFS.map((b): ConsumableDef => ({
  id: b.id,
  name: b.name,
  category: 'consumable',
  kind: b.kind,
  usableIn: 'field',
  level: b.level,
  value: b.value,
  stack: 99,
  description: b.desc,
  action: { kind: 'timedBuff', buffId: b.id, name: b.name, modifiers: b.mods, battles: b.battles },
}));

const misc: ConsumableDef[] = [
  { id: 'fire-bomb', name: 'Fire Bomb', category: 'consumable', kind: 'throwable', usableIn: 'combat', level: 1, value: 30, stack: 99, description: 'Deals fire damage to all enemies and may Burn them.', action: { kind: 'effects', effects: [{ kind: 'damage', element: 'fire', base: 25, scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'allEnemies' }, { kind: 'applyStatus', status: 'burn', duration: 2, chance: 50, target: 'allEnemies' }] } },
  { id: 'frost-bomb', name: 'Frost Bomb', category: 'consumable', kind: 'throwable', usableIn: 'combat', level: 10, value: 50, stack: 99, description: 'Deals ice damage to all enemies and may Freeze them.', action: { kind: 'effects', effects: [{ kind: 'damage', element: 'ice', base: 40, scaling: { stat: 'physicalAttack', ratio: 0.5 }, target: 'allEnemies' }, { kind: 'applyStatus', status: 'freeze', duration: 1, chance: 30, target: 'allEnemies' }] } },
  { id: 'oil-flask', name: 'Oil Flask', category: 'consumable', kind: 'throwable', usableIn: 'combat', level: 1, value: 20, stack: 99, description: 'Douses an enemy in oil: Slowed and Vulnerable for 3 turns.', action: { kind: 'effects', effects: [{ kind: 'applyStatus', status: 'slow', duration: 3, target: 'target' }, { kind: 'applyStatus', status: 'vulnerable', duration: 3, target: 'target' }] } },
  { id: 'holy-water', name: 'Holy Water', category: 'consumable', kind: 'throwable', usableIn: 'combat', level: 5, value: 40, stack: 99, description: 'Sears an enemy with holy damage.', action: { kind: 'effects', effects: [{ kind: 'damage', element: 'holy', base: 30, scaling: { stat: 'divinePower', ratio: 1 }, target: 'target' }] } },
  { id: 'scroll-of-identify', name: 'Scroll of Identify', category: 'consumable', kind: 'scroll', usableIn: 'field', level: 1, value: 20, stack: 99, description: 'Reveals the properties of an unidentified item.', action: { kind: 'identify' } },
  { id: 'scroll-of-escape', name: 'Scroll of Escape', category: 'consumable', kind: 'scroll', usableIn: 'combat', level: 1, value: 60, stack: 99, description: 'Guarantees escape from any battle except boss fights.', action: { kind: 'escape' } },
  { id: 'phoenix-feather', name: 'Phoenix Feather', category: 'consumable', kind: 'revive', usableIn: 'combat', level: 5, value: 150, stack: 99, description: 'Revives a fallen ally with 30% HP.', action: { kind: 'revive', hpPct: 30 } },
  { id: 'cleansing-salts', name: 'Cleansing Salts', category: 'consumable', kind: 'cleanse', usableIn: 'combat', level: 1, value: 35, stack: 99, description: 'Removes Poison, Burn, Bleed and Curse.', action: { kind: 'effects', effects: [{ kind: 'removeStatus', status: 'poison', target: 'self' }, { kind: 'removeStatus', status: 'burn', target: 'self' }, { kind: 'removeStatus', status: 'bleed', target: 'self' }, { kind: 'removeStatus', status: 'curse', target: 'self' }] } },
  { id: 'tome-of-insight', name: 'Tome of Insight', category: 'consumable', kind: 'tome', usableIn: 'field', level: 1, value: 2000, stack: 99, description: 'Grants 1 skill point to your primary class.', action: { kind: 'skillPoint' } },
  // Forbidden goods: the Black Market sells these only to heretics of the tier they name.
  { id: 'void-draught', name: 'Void Draught', category: 'consumable', kind: 'elixir', usableIn: 'field', level: 40, value: 900, stack: 99, forbidden: 0, description: '+25% void damage and +8% damage, but 10% less max HP, for 8 battles.', action: { kind: 'timedBuff', buffId: 'void-draught', name: 'Void Draught', modifiers: [{ stat: 'voidDamage', type: 'flat', value: 25 }, { stat: 'damageBonus', type: 'flat', value: 8 }, { stat: 'maxHp', type: 'percent', value: -10 }], battles: 8 } },
  { id: 'unwritten-salve', name: 'Unwritten Salve', category: 'consumable', kind: 'potion', usableIn: 'combat', level: 40, value: 700, stack: 99, forbidden: 1, description: 'Heals 50% of max HP at once, but leaves you Vulnerable for 2 turns.', action: { kind: 'effects', effects: [{ kind: 'heal', percentMaxHp: 50, target: 'self' }, { kind: 'applyStatus', status: 'vulnerable', duration: 2, target: 'self' }] } },
  { id: 'tear-of-a-dead-god', name: 'Tear of a Dead God', category: 'consumable', kind: 'throwable', usableIn: 'combat', level: 40, value: 2500, stack: 20, forbidden: 2, description: 'Unmakes the air: heavy void damage to every enemy, Corrupting them.', action: { kind: 'effects', effects: [{ kind: 'damage', element: 'void', base: 300, scaling: { stat: 'magicAttack', ratio: 1.5 }, target: 'allEnemies' }, { kind: 'applyStatus', status: 'corruption', duration: 3, target: 'allEnemies' }] } },
  { id: 'travelers-pack', name: "Traveler's Pack", category: 'consumable', kind: 'bag', usableIn: 'field', level: 1, value: 500, stack: 10, description: 'Permanently adds 8 inventory slots (up to 96).', action: { kind: 'expandInventory', slots: 8 } },
];

export const CONSUMABLES: ConsumableDef[] = [...potions, ...buffs, ...misc];
