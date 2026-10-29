import type { RecipeDef } from '../../engine/economy/types';
import type { ConsumableDef, MaterialDef, MaterialKind } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

// ---------------------------------------------------------------- materials (30 more)

type MatRow = [id: string, name: string, kind: MaterialKind, tier: number, value: number, description: string];

const MAT_ROWS: MatRow[] = [
  ['coal', 'Coal', 'ore', 1, 2, 'Black, dense and hot when asked.'],
  ['silver-ore', 'Silver Ore', 'ore', 2, 10, 'Dull until worked, bright afterward.'],
  ['steel-ingot', 'Steel Ingot', 'ore', 2, 14, 'Iron, smelted properly.'],
  ['mithril-ingot', 'Mithril Ingot', 'ore', 3, 55, 'Light as a thought and nearly as quick.'],
  ['adamant-ingot', 'Adamant Ingot', 'ore', 4, 120, 'The weight of a small grudge.'],
  ['starmetal-ingot', 'Starmetal Ingot', 'ore', 5, 260, 'It keeps a faint glow, as if remembering.'],
  ['yew-plank', 'Yew Plank', 'wood', 2, 12, 'Springy and patient.'],
  ['ironwood-plank', 'Ironwood Plank', 'wood', 3, 32, 'Heavier than it looks, and it looks heavy.'],
  ['wolf-pelt', 'Wolf Pelt', 'leather', 1, 6, 'Thick, grey and faintly protective.'],
  ['boar-hide', 'Boar Hide', 'leather', 2, 12, 'Bristly and tough.'],
  ['bear-hide', 'Bear Hide', 'leather', 3, 26, 'Heavy enough to wear as a blanket.'],
  ['serpent-skin', 'Serpent Skin', 'leather', 4, 48, 'Cool, patterned and a little too interested in you.'],
  ['wyvern-leather', 'Wyvern Leather', 'leather', 5, 110, 'Cured drake-hide that still sparks in the cold.'],
  ['wool-bolt', 'Wool Bolt', 'cloth', 1, 6, 'Warm, itchy and honest.'],
  ['spider-silk', 'Spider Silk', 'cloth', 2, 16, 'Strong enough to catch a falling knight. Probably.'],
  ['thread-of-dawn', 'Thread of Dawn', 'cloth', 4, 70, 'Spun from sunrise, or something very like it.'],
  ['wild-garlic', 'Wild Garlic', 'herb', 1, 4, 'Wards off vampires and conversation.'],
  ['thornberry', 'Thornberry', 'herb', 2, 8, 'Tart, red and not worth the scratches. Usually.'],
  ['moonpetal', 'Moonpetal', 'herb', 3, 24, 'Opens only at night, and then loudly.'],
  ['nightshade', 'Nightshade', 'herb', 3, 22, 'Sweet, glossy and deadly.'],
  ['ghostcap', 'Ghostcap', 'herb', 4, 50, 'A pale mushroom that glows faintly near the dead.'],
  ['salt-cod', 'Salt Cod', 'fish', 2, 9, 'Stiff as a board and twice as useful.'],
  ['pike', 'Pike', 'fish', 2, 10, 'Long, mean and delicious.'],
  ['glass-eel', 'Glass Eel', 'fish', 4, 40, 'Transparent. You can see what it ate.'],
  ['venison', 'Venison', 'monster', 1, 7, 'Lean, dark meat from the deep woods.'],
  ['boar-meat', 'Boar Meat', 'monster', 1, 6, 'Rich and gamey.'],
  ['honeycomb', 'Honeycomb', 'monster', 2, 14, 'Golden, sticky and defended by an army.'],
  ['sea-salt', 'Sea Salt', 'herb', 1, 3, 'Makes everything taste more like itself.'],
  ['black-pepper', 'Black Pepper', 'herb', 3, 20, 'Worth its weight in something.'],
  ['saffron', 'Saffron', 'herb', 4, 65, 'Three threads per flower, and a lot of flowers.'],
];

export const GREATER_MATERIALS: MaterialDef[] = MAT_ROWS.map(([id, name, kind, tier, value, description]) => ({ id, name, category: 'material', kind, tier, level: 1, value, stack: 999, description }));

/** Where the new raw materials turn up in the wild (merged into each zone's gathering tables). */
export const GREATER_GATHER: Record<string, { mining?: string[]; herbalism?: string[]; fishing?: string[] }> = {
  meadowlands: { mining: ['coal'], herbalism: ['wild-garlic', 'sea-salt'], fishing: ['pike'] },
  whisperwood: { mining: ['coal', 'silver-ore'], herbalism: ['thornberry', 'wild-garlic'], fishing: ['pike'] },
  'sunken-caves': { mining: ['silver-ore'], herbalism: ['nightshade'], fishing: ['salt-cod', 'glass-eel'] },
  'ashen-desert': { mining: ['silver-ore'], herbalism: ['black-pepper'], fishing: ['salt-cod'] },
  frostspire: { mining: ['silver-ore'], herbalism: ['moonpetal'], fishing: ['pike'] },
  stormcoast: { herbalism: ['sea-salt', 'moonpetal'], fishing: ['salt-cod', 'glass-eel'] },
  'volcanic-rift': { mining: ['coal'], herbalism: ['saffron'], fishing: ['glass-eel'] },
  'dark-citadel': { herbalism: ['ghostcap', 'nightshade'] },
};

/** Skinning: hides and meat from beasts, by the beast's level. */
export const SKINNING_LOOT: { maxLevel: number; items: string[] }[] = [
  { maxLevel: 12, items: ['wolf-pelt', 'boar-hide', 'venison', 'boar-meat'] },
  { maxLevel: 30, items: ['boar-hide', 'bear-hide', 'venison', 'honeycomb'] },
  { maxLevel: 45, items: ['bear-hide', 'serpent-skin', 'honeycomb', 'boar-meat'] },
  { maxLevel: 99, items: ['serpent-skin', 'wyvern-leather', 'venison'] },
];

// ---------------------------------------------------------------- consumables

type M = [StatId, number, 'p'?];
const mods = (m: M[]): ModifierSpec[] => m.map(([stat, value, p]) => ({ stat, type: p ? 'percent' : 'flat', value }));
const LABEL: Partial<Record<StatId, string>> = {
  maxHp: 'max HP', maxMp: 'max MP', hpRegen: 'HP regen', mpRegen: 'MP regen', physicalAttack: 'physical attack', magicAttack: 'magic attack', critChance: 'crit chance', critDamage: 'crit damage',
  magicFind: 'magic find', goldFind: 'gold find', xpGain: 'XP', damageBonus: 'damage', cooldownReduction: 'cooldown reduction', statusResist: 'status resist', healingPower: 'healing power', divinePower: 'divine power',
};
const label = (s: string): string => LABEL[s as StatId] ?? s.replace(/([A-Z])/g, ' $1').toLowerCase();
const describe = (m: M[], battles: number): string => `${m.map(([s, v, p]) => `${v < 0 ? '' : '+'}${v}${p || /Resist|Damage|Chance|Find|Gain|Bonus|Reduction|Power/.test(s) ? '%' : ''} ${label(s)}`).join(', ')} for ${battles} battles.`;

type Input = [string, number];
/** [id, name, level, value, mods, battles, recipe inputs] */
type BuffRow = [string, string, number, number, M[], number, Input[]];

const FOODS: BuffRow[] = [
  ['porridge', 'Hot Porridge', 1, 12, [['maxHp', 5, 'p'], ['hpRegen', 2]], 4, [['wool-bolt', 0], ['honeycomb', 1]]],
  ['rabbit-skewers', 'Rabbit Skewers', 1, 14, [['physicalAttack', 5, 'p']], 4, [['venison', 1], ['sea-salt', 1]]],
  ['garlic-bread', 'Garlic Bread', 2, 14, [['statusResist', 8], ['hpRegen', 2]], 4, [['wild-garlic', 2], ['sea-salt', 1]]],
  ['boar-roast', 'Roast Boar', 4, 28, [['maxHp', 8, 'p'], ['physicalAttack', 5, 'p']], 5, [['boar-meat', 2], ['sea-salt', 1]]],
  ['venison-pie', 'Venison Pie', 6, 34, [['maxHp', 10, 'p'], ['defense', 5, 'p']], 5, [['venison', 2], ['wild-garlic', 1]]],
  ['honey-cakes', 'Honey Cakes', 6, 30, [['mpRegen', 3], ['maxMp', 6, 'p']], 5, [['honeycomb', 1], ['manabloom', 1]]],
  ['pike-chowder', 'Pike Chowder', 8, 40, [['hpRegen', 4], ['statusResist', 8]], 5, [['pike', 2], ['wild-garlic', 1]]],
  ['thornberry-jam', 'Thornberry Jam', 8, 36, [['magicFind', 8], ['luk', 2]], 5, [['thornberry', 3], ['honeycomb', 1]]],
  ['salt-cod-fritters', 'Salt-Cod Fritters', 10, 42, [['speed', 2], ['dodge', 2]], 5, [['salt-cod', 2], ['sea-salt', 1]]],
  ['pepper-steak', 'Pepper Steak', 14, 62, [['physicalAttack', 10, 'p'], ['critChance', 2]], 6, [['venison', 2], ['black-pepper', 1]]],
  ['bear-stew', 'Bear Stew', 16, 70, [['maxHp', 14, 'p'], ['hpRegen', 4]], 6, [['bear-hide', 0], ['boar-meat', 2], ['wild-garlic', 2]]],
  ['moonpetal-tea', 'Moonpetal Tea', 16, 60, [['maxMp', 10, 'p'], ['mpRegen', 3]], 6, [['moonpetal', 2], ['honeycomb', 1]]],
  ['smoked-pike', 'Smoked Pike', 18, 66, [['critDamage', 14], ['accuracy', 5]], 6, [['pike', 2], ['coal', 1]]],
  ['nightshade-wine', 'Nightshade Wine', 20, 90, [['shadowDamage', 12], ['statusChance', 6]], 6, [['nightshade', 2], ['thornberry', 2]]],
  ['saffron-rice', 'Saffron Rice', 22, 110, [['xpGain', 10], ['maxHp', 8, 'p']], 7, [['saffron', 1], ['sea-salt', 1], ['wool-bolt', 0]]],
  ['glass-eel-sushi', 'Glass-Eel Rolls', 24, 120, [['accuracy', 8], ['critChance', 3]], 6, [['glass-eel', 2], ['sea-salt', 1]]],
  ['serpent-skewers', 'Serpent Skewers', 26, 125, [['natureDamage', 15], ['statusChance', 8]], 6, [['serpent-skin', 0], ['venison', 2], ['black-pepper', 1]]],
  ['honey-glazed-ham', 'Honey-Glazed Ham', 26, 130, [['maxHp', 12, 'p'], ['healingPower', 8]], 7, [['boar-meat', 3], ['honeycomb', 2]]],
  ['ghostcap-soup', 'Ghostcap Soup', 28, 140, [['shadowResist', 15], ['dodge', 3]], 7, [['ghostcap', 2], ['pike', 1]]],
  ['saffron-lamb', 'Saffron Lamb', 30, 150, [['physicalAttack', 12, 'p'], ['magicAttack', 12, 'p']], 7, [['venison', 2], ['saffron', 1]]],
  ['pepper-and-ember', 'Pepper-and-Ember Stew', 30, 150, [['fireDamage', 18], ['fireResist', 15]], 7, [['ember-eel', 1], ['black-pepper', 2], ['coal', 1]]],
  ['frostleaf-salad', 'Frostleaf Salad', 12, 50, [['iceResist', 15], ['maxMp', 8, 'p']], 6, [['frostleaf', 2], ['sea-salt', 1]]],
  ['sunpetal-tart', 'Sunpetal Tart', 28, 135, [['holyDamage', 15], ['healingPower', 10]], 7, [['sunpetal', 2], ['honeycomb', 1]]],
  ['dreamleaf-pudding', 'Dreamleaf Pudding', 34, 190, [['cooldownReduction', 6], ['mpRegen', 3]], 7, [['dreamleaf', 1], ['honeycomb', 2]]],
  ['wyvern-wings', 'Wyvern Wings', 36, 210, [['lightningDamage', 20], ['speed', 3]], 7, [['wyvern-leather', 0], ['venison', 3], ['black-pepper', 2]]],
  ['ember-eel-curry', 'Ember-Eel Curry', 38, 220, [['fireDamage', 22], ['damageBonus', 6]], 8, [['ember-eel', 2], ['saffron', 1], ['black-pepper', 1]]],
  ['harvest-feast', 'Harvest Feast', 40, 260, [['maxHp', 15, 'p'], ['xpGain', 10], ['goldFind', 10]], 8, [['boar-meat', 3], ['honeycomb', 2], ['thornberry', 3]]],
  ['hunters-platter', "Hunter's Platter", 40, 250, [['critChance', 4], ['accuracy', 10], ['dodge', 3]], 8, [['venison', 3], ['wild-garlic', 2], ['black-pepper', 1]]],
  ['mariners-bowl', "Mariner's Bowl", 42, 240, [['lightningResist', 18], ['iceResist', 18]], 8, [['glass-eel', 2], ['salt-cod', 2], ['sea-salt', 2]]],
  ['moonlit-roast', 'Moonlit Roast', 44, 270, [['dodge', 5], ['shadowDamage', 15]], 8, [['moonpetal', 2], ['venison', 3]]],
  ['saints-bread', "Saint's Bread", 20, 85, [['blessingPower', 10], ['favorGain', 8]], 6, [['honeycomb', 1], ['sunpetal', 1], ['wool-bolt', 0]]],
  ['scholars-supper', "Scholar's Supper", 24, 100, [['xpGain', 12], ['int', 4]], 6, [['pike', 2], ['thornberry', 2], ['sea-salt', 1]]],
  ['mercenarys-meal', "Mercenary's Meal", 24, 95, [['str', 4], ['maxHp', 10, 'p']], 6, [['boar-meat', 3], ['black-pepper', 1]]],
  ['travelers-hardtack', "Traveler's Hardtack", 1, 8, [['speed', 1], ['hpRegen', 1]], 8, [['wool-bolt', 0], ['sea-salt', 1], ['wild-garlic', 1]]],
  ['festival-pudding', 'Festival Pudding', 32, 170, [['luk', 5], ['magicFind', 10], ['goldFind', 10]], 7, [['honeycomb', 2], ['thornberry', 2], ['saffron', 1]]],
  ['dragon-scale-jerky', 'Dragon-Scale Jerky', 46, 300, [['damageTaken', -4], ['fireResist', 20]], 8, [['wyvern-leather', 0], ['venison', 3], ['coal', 1]]],
  ['banquet-of-the-pantheon', 'Banquet of the Pantheon', 50, 420, [['maxHp', 15, 'p'], ['damageBonus', 8], ['xpGain', 10], ['blessingPower', 12]], 10, [['saffron', 2], ['glass-eel', 2], ['honeycomb', 2], ['venison', 2]]],
  ['nameless-broth', 'Nameless Broth', 54, 480, [['voidDamage', 20], ['damageBonus', 8]], 8, [['ghostcap', 2], ['nightshade', 2], ['moonpetal', 2]]],
  ['hearthmothers-pie', "Hearth-Mother's Pie", 38, 200, [['hpRegen', 6], ['healingPower', 12]], 8, [['honeycomb', 2], ['thornberry', 3], ['boar-meat', 1]]],
  ['golden-trout', 'Golden Trout', 14, 58, [['goldFind', 15], ['luk', 2]], 6, [['river-trout', 2], ['honeycomb', 1]]],
];

const ELIXIRS: BuffRow[] = [
  ['elixir-of-the-hawk', 'Elixir of the Hawk', 6, 70, [['accuracy', 12], ['critChance', 3]], 12, [['fireweed', 1], ['harpy-feather', 1]]],
  ['elixir-of-the-bear', 'Elixir of the Bear', 8, 80, [['maxHp', 15, 'p'], ['str', 3]], 12, [['healroot', 2], ['bear-hide', 0], ['boar-hide', 1]]],
  ['elixir-of-the-fox', 'Elixir of the Fox', 8, 80, [['dodge', 5], ['speed', 2]], 12, [['manabloom', 1], ['wolf-pelt', 1]]],
  ['elixir-of-quickness', 'Elixir of Quickness', 12, 100, [['speed', 3], ['cooldownReduction', 4]], 12, [['frostleaf', 1], ['spider-silk', 1]]],
  ['elixir-of-the-wall', 'Elixir of the Wall', 14, 110, [['defense', 20, 'p'], ['statusResist', 10]], 12, [['iron-ore', 2], ['frostleaf', 1]]],
  ['elixir-of-flame', 'Elixir of Flame', 14, 110, [['fireDamage', 20], ['fireResist', 12]], 12, [['fireweed', 2], ['coal', 1]]],
  ['elixir-of-frost', 'Elixir of Frost', 14, 110, [['iceDamage', 20], ['iceResist', 12]], 12, [['frostleaf', 2], ['silver-ore', 1]]],
  ['elixir-of-the-storm', 'Elixir of the Storm', 18, 130, [['lightningDamage', 20], ['speed', 2]], 12, [['harpy-feather', 2], ['silver-ore', 1]]],
  ['elixir-of-the-grove', 'Elixir of the Grove', 18, 130, [['natureDamage', 20], ['hpRegen', 3]], 12, [['thornberry', 2], ['healroot', 2]]],
  ['elixir-of-the-dawn', 'Elixir of the Dawn', 22, 160, [['holyDamage', 20], ['healingPower', 10]], 12, [['sunpetal', 1], ['holy-water', 1]]],
  ['elixir-of-the-dusk', 'Elixir of the Dusk', 22, 160, [['shadowDamage', 20], ['lifesteal', 1]], 12, [['nightshade', 1], ['bone-dust', 2]]],
  ['elixir-of-the-sage', 'Elixir of the Sage', 24, 170, [['magicAttack', 18, 'p'], ['mpRegen', 3]], 12, [['moonpetal', 1], ['lesser-essence', 1]]],
  ['elixir-of-the-champion', 'Elixir of the Champion', 28, 200, [['physicalAttack', 20, 'p'], ['critDamage', 15]], 12, [['sunpetal', 1], ['greater-essence', 1]]],
  ['elixir-of-the-giant', 'Elixir of the Giant', 30, 220, [['maxHp', 20, 'p'], ['damageTaken', -4]], 12, [['bear-hide', 1], ['greater-essence', 1]]],
  ['elixir-of-the-ghost', 'Elixir of the Ghost', 32, 230, [['dodge', 8], ['shadowResist', 20]], 12, [['ghostcap', 1], ['dreamleaf', 1]]],
  ['elixir-of-the-scholar', 'Elixir of the Scholar', 20, 150, [['xpGain', 25], ['wis', 3]], 15, [['dreamleaf', 1], ['thornberry', 2]]],
  ['elixir-of-the-miser', 'Elixir of the Miser', 20, 150, [['goldFind', 30], ['barter', 3]], 15, [['silver-ore', 2], ['honeycomb', 1]]],
  ['elixir-of-the-treasure-hunter', 'Elixir of the Treasure-Hunter', 26, 190, [['magicFind', 30], ['luk', 4]], 15, [['sunpetal', 1], ['silver-ore', 2]]],
  ['elixir-of-the-pilgrim', 'Elixir of the Pilgrim', 24, 180, [['favorGain', 25], ['blessingPower', 12]], 15, [['moonpetal', 1], ['holy-water', 1]]],
  ['elixir-of-clear-mind', 'Elixir of Clear Mind', 16, 120, [['statusResist', 20], ['mpRegen', 2]], 12, [['frostleaf', 1], ['thornberry', 1]]],
  ['elixir-of-the-wyrm', 'Elixir of the Wyrm', 38, 300, [['damageBonus', 12], ['critChance', 5]], 12, [['wyvern-leather', 1], ['radiant-essence', 1]]],
  ['elixir-of-the-void', 'Elixir of Thin Space', 44, 340, [['voidDamage', 25], ['cooldownReduction', 6]], 12, [['void-fragment', 1], ['ghostcap', 1]]],
  ['elixir-of-the-ironhide', 'Elixir of the Ironhide', 36, 280, [['defense', 25, 'p'], ['maxHp', 10, 'p']], 12, [['adamant-ingot', 1], ['serpent-skin', 1]]],
  ['elixir-of-the-sunlit', 'Elixir of the Sunlit Path', 40, 320, [['speed', 4], ['xpGain', 15], ['holyResist', 20]], 15, [['saffron', 1], ['sunpetal', 2]]],
];

const toBuff = (kind: 'food' | 'elixir') => ([id, name, level, value, m, battles]: BuffRow): ConsumableDef => ({
  id, name, category: 'consumable', kind, usableIn: 'field', level, value, stack: 99, description: describe(m, battles),
  action: { kind: 'timedBuff', buffId: id, name, modifiers: mods(m), battles },
});

// Gadgets and weapon oils (single-use battle items)
const dmgAll = (element: 'fire' | 'ice' | 'lightning' | 'physical' | 'nature' | 'arcane', ratio: number) => ({ kind: 'damage' as const, element, scaling: { stat: 'physicalAttack' as const, ratio }, target: 'allEnemies' as const });
const st = (status: string, duration: number, target: 'allEnemies' | 'target' = 'allEnemies', chance?: number) => ({ kind: 'applyStatus' as const, status, duration, target, ...(chance ? { chance } : {}) });

const GADGETS: [string, string, number, number, string, import('../../engine/effects/types').EffectSpec[], CraftSource][] = [
  ['smoke-bomb', 'Smoke Bomb', 4, 40, 'Blinds every enemy (70%) for 2 turns.', [st('blind', 2, 'allEnemies', 70)], 'blacksmithing'],
  ['caltrops', 'Caltrops', 6, 45, 'Scatters spikes: every enemy takes physical damage and is Slowed.', [dmgAll('physical', 0.4), st('slow', 2)], 'blacksmithing'],
  ['flash-powder', 'Flash Powder', 8, 55, 'A burst of light: Stuns one enemy (50%) and Blinds it.', [st('stun', 1, 'target', 50), st('blind', 2, 'target')], 'blacksmithing'],
  ['thunder-charge', 'Thunder Charge', 20, 120, 'Lightning damage to every enemy; Stuns (25%).', [dmgAll('lightning', 0.9), st('stun', 1, 'allEnemies', 25)], 'blacksmithing'],
  ['spring-trap', 'Spring Trap', 14, 90, 'Snaps one enemy: heavy damage and Slow.', [{ kind: 'damage', element: 'physical', scaling: { stat: 'physicalAttack', ratio: 1.4 }, target: 'target' }, st('slow', 2, 'target')], 'blacksmithing'],
  ['clockwork-wasp', 'Clockwork Wasp', 30, 180, 'Stings every enemy and may Poison them.', [dmgAll('nature', 0.7), st('poison', 3, 'allEnemies', 60)], 'blacksmithing'],
  ['weighted-net', 'Weighted Net', 6, 45, 'Entangles an enemy: Slowed and Weakened for 3 turns.', [st('slow', 3, 'target'), st('weaken', 3, 'target')], 'tailoring'],
  ['spider-silk-snare', 'Spider-Silk Snare', 14, 85, 'Binds every enemy: Slowed for 2 turns.', [st('slow', 2)], 'tailoring'],
  ['lullaby-cloth', 'Lullaby Cloth', 22, 130, 'Puts every enemy to sleep (50%) for 2 turns.', [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 50, target: 'allEnemies' }], 'tailoring'],
  ['mirror-cloak', 'Mirror Cloak', 26, 150, 'Shield yourself for 25% and gain +30 dodge for 2 turns.', [{ kind: 'shield', percentMaxHp: 25, target: 'self' }, { kind: 'buff', id: 'mirror-cloak', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 30 }], target: 'self' }], 'tailoring'],
  ['bandage-roll', 'Surgeon’s Bandage Roll', 4, 35, 'Heals an ally for 30% of max HP and stops Bleeding.', [{ kind: 'heal', percentMaxHp: 30, target: 'target' }, { kind: 'removeStatus', status: 'bleed', target: 'target' }], 'tailoring'],
  ['featherfall-charm', 'Featherfall Charm', 18, 100, 'Haste for 2 turns and +15 dodge.', [st('haste', 2, 'target'), { kind: 'buff', id: 'featherfall', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 15 }], target: 'self' }], 'tailoring'],
] as never;

type CraftSource = 'blacksmithing' | 'tailoring';

const OILS: BuffRow[] = [
  ['oil-of-sharpness', 'Oil of Sharpness', 4, 50, [['weaponDamage', 4]], 8, [['coal', 1], ['wild-garlic', 1]]],
  ['oil-of-venom', 'Oil of Venom', 8, 70, [['natureDamage', 12], ['statusChance', 8]], 8, [['nightshade', 1], ['sea-salt', 1]]],
  ['oil-of-embers', 'Oil of Embers', 10, 75, [['fireDamage', 14]], 8, [['fireweed', 2], ['coal', 1]]],
  ['oil-of-rime', 'Oil of Rime', 10, 75, [['iceDamage', 14]], 8, [['frostleaf', 2], ['sea-salt', 1]]],
  ['oil-of-sparks', 'Oil of Sparks', 12, 80, [['lightningDamage', 14]], 8, [['harpy-feather', 1], ['silver-ore', 1]]],
  ['oil-of-light', 'Oil of Light', 16, 100, [['holyDamage', 14], ['accuracy', 5]], 8, [['sunpetal', 1], ['holy-water', 1]]],
  ['oil-of-shadow', 'Oil of Shadow', 16, 100, [['shadowDamage', 14], ['critChance', 2]], 8, [['nightshade', 1], ['bone-dust', 1]]],
  ['oil-of-cruelty', 'Oil of Cruelty', 20, 120, [['critDamage', 18], ['critChance', 2]], 8, [['serpent-skin', 1], ['coal', 1]]],
  ['oil-of-the-hunt', 'Oil of the Hunt', 24, 140, [['accuracy', 10], ['damageBonus', 5]], 8, [['moonpetal', 1], ['wolf-pelt', 1]]],
  ['oil-of-ruin', 'Oil of Ruin', 30, 180, [['shieldPierce', 12], ['physicalAttack', 8, 'p']], 8, [['ghostcap', 1], ['adamant-ingot', 1]]],
  ['oil-of-the-stormlord', 'Oil of the Stormlord', 36, 220, [['lightningDamage', 25], ['speed', 2]], 8, [['wyvern-leather', 1], ['silver-ore', 2]]],
  ['oil-of-the-world-eater', 'Oil of the World-Eater', 46, 300, [['damageBonus', 10], ['voidDamage', 20]], 8, [['void-fragment', 1], ['starmetal-ingot', 1]]],
];

const gadgetDefs: ConsumableDef[] = GADGETS.map(([id, name, level, value, description, effects]) => ({
  id, name, category: 'consumable', kind: 'throwable', usableIn: 'combat', level, value, stack: 99, description, action: { kind: 'effects', effects },
}));

export const GREATER_CONSUMABLES: ConsumableDef[] = [...FOODS.map(toBuff('food')), ...ELIXIRS.map(toBuff('elixir')), ...OILS.map(toBuff('elixir')), ...gadgetDefs];

// ---------------------------------------------------------------- recipes

const inputs = (list: Input[]) => list.filter(([, n]) => n > 0).map(([itemId, qty]) => ({ itemId, qty }));
const rec = (id: string, name: string, profession: RecipeDef['profession'], level: number, ins: Input[], output: RecipeDef['output'], xp: number, extra: Partial<RecipeDef> = {}): RecipeDef => ({ id, name, profession, level, inputs: inputs(ins), output, xp, ...extra });

const cookingRecipes = FOODS.map(([id, name, level, , , , ins], i): RecipeDef => rec(`cook-${id}`, name, 'cooking', Math.max(1, Math.round(level * 0.9)), ins, { kind: 'item', itemId: id, qty: 2 }, 4 + Math.round(level / 3), i < 4 ? { starter: true } : {}));
const alchemyRecipes = ELIXIRS.map(([id, name, level, , , , ins], i): RecipeDef => rec(`brew-${id}`, name, 'alchemy', Math.max(1, Math.round(level * 0.9)), ins, { kind: 'item', itemId: id, qty: 1 }, 5 + Math.round(level / 3), i < 2 ? { starter: true } : {}));
const oilRecipes = OILS.map(([id, name, level, , , , ins]): RecipeDef => rec(`oil-${id}`, name, 'enchanting', Math.max(1, Math.round(level * 0.9)), ins, { kind: 'item', itemId: id, qty: 1 }, 5 + Math.round(level / 3)));
const gadgetRecipes = GADGETS.map(([id, name, level, , , , source], i): RecipeDef => rec(`make-${id}`, name, source, Math.max(1, Math.round(level * 0.9)), [[source === 'tailoring' ? 'spider-silk' : 'steel-ingot', 1 + Math.floor(level / 14)], [source === 'tailoring' ? 'wool-bolt' : 'coal', 1]], { kind: 'item', itemId: id, qty: 2 }, 5 + Math.round(level / 3), i % 6 === 0 ? { starter: true } : {}));

const SMELT: [string, string, Input[], string, number][] = [
  ['steel-ingot', 'Smelt Steel', [['iron-ore', 2], ['coal', 1]], 'steel-ingot', 1],
  ['mithril-ingot', 'Smelt Mithril', [['mithril-ore', 2], ['coal', 2]], 'mithril-ingot', 14],
  ['adamant-ingot', 'Smelt Adamant', [['adamant-ore', 2], ['coal', 3]], 'adamant-ingot', 24],
  ['starmetal-ingot', 'Smelt Starmetal', [['starmetal-ore', 2], ['coal', 4]], 'starmetal-ingot', 34],
];
const smeltRecipes = SMELT.map(([id, name, ins, out, level], i) => rec(`smelt-${id}`, name, 'blacksmithing', level, ins, { kind: 'item', itemId: out, qty: 1 }, 6 + i * 4, i === 0 ? { starter: true } : {}));

// Tailoring: cloth and leather gear, plus the thread and hide that feed it.
const TAIL_TIERS: [number, number, Input[]][] = [
  [1, 1, [['wool-bolt', 4], ['linen-scrap', 2]]],
  [2, 8, [['wool-bolt', 4], ['spider-silk', 2]]],
  [3, 16, [['spider-silk', 4], ['silk-bolt', 2], ['boar-hide', 2]]],
  [4, 26, [['silk-bolt', 4], ['bear-hide', 2], ['thread-of-dawn', 1]]],
  [5, 36, [['moonsilk', 3], ['serpent-skin', 2], ['thread-of-dawn', 2]]],
  [6, 46, [['moonsilk', 4], ['wyvern-leather', 2], ['thread-of-dawn', 3]]],
];
const tailorGear = TAIL_TIERS.flatMap(([tier, level, ins]) => [
  rec(`tailor-cloth-${tier}`, `Tailor Cloth Armor (tier ${tier})`, 'tailoring', level, ins, { kind: 'gear', category: 'armor', tier }, 8 + tier * 4, { gold: tier * 40, ...(tier === 1 ? { starter: true } : {}) }),
  rec(`tailor-leather-${tier}`, `Cure Leather Armor (tier ${tier})`, 'tailoring', level, [...ins.slice(0, 1), ['wolf-pelt', 2 + tier], ['boar-hide', 1 + tier]], { kind: 'gear', category: 'armor', tier }, 8 + tier * 4, { gold: tier * 40 }),
  rec(`tailor-bag-${tier}`, `Stitch a Satchel (tier ${tier})`, 'tailoring', level, [['wool-bolt', 2 + tier], ['boar-hide', 1]], { kind: 'item', itemId: 'travelers-pack', qty: 1 }, 10 + tier * 3, { gold: 120 * tier }),
]);

const GRANDMASTER: RecipeDef[] = [
  rec('grandmaster-cooking', 'Banquet of the Pantheon', 'cooking', 50, [['saffron', 2], ['glass-eel', 2], ['honeycomb', 2], ['venison', 2]], { kind: 'item', itemId: 'banquet-of-the-pantheon', qty: 1 }, 80),
  rec('grandmaster-alchemy', 'Elixir of the Sunlit Path', 'alchemy', 50, [['saffron', 1], ['sunpetal', 2]], { kind: 'item', itemId: 'elixir-of-the-sunlit', qty: 1 }, 80),
  rec('grandmaster-enchanting', 'Oil of the World-Eater', 'enchanting', 50, [['void-fragment', 1], ['starmetal-ingot', 1]], { kind: 'item', itemId: 'oil-of-the-world-eater', qty: 1 }, 80),
  rec('grandmaster-blacksmithing', 'Forge a Grandmaster’s Weapon', 'blacksmithing', 50, [['starmetal-ingot', 3], ['ironwood-plank', 2], ['radiant-essence', 2]], { kind: 'gear', category: 'weapon', tier: 6 }, 90, { gold: 3000 }),
  rec('grandmaster-jewelcrafting', 'Cut a Grandmaster’s Jewel', 'jewelcrafting', 50, [['starmetal-ingot', 2], ['radiant-essence', 2], ['diamond-4', 1]], { kind: 'gear', category: 'accessory', tier: 6 }, 90, { gold: 3000 }),
  rec('grandmaster-tailoring', 'Weave a Grandmaster’s Vestment', 'tailoring', 50, [['moonsilk', 4], ['thread-of-dawn', 4], ['wyvern-leather', 3]], { kind: 'gear', category: 'armor', tier: 6 }, 90, { gold: 3000 }),
];

const JEWEL_EXTRA: RecipeDef[] = [1, 2, 3, 4, 5, 6].flatMap((tier) => [
  rec(`silver-setting-${tier}`, `Silver-Set Ring (tier ${tier})`, 'jewelcrafting', [1, 8, 16, 26, 36, 46][tier - 1] as number, [['silver-ore', 2 + tier], ['faint-essence', 1 + Math.floor(tier / 2)]], { kind: 'gear', category: 'accessory', tier }, 8 + tier * 4, { gold: tier * 50 }),
]);
const ENCHANT_EXTRA: RecipeDef[] = [
  rec('distil-essence-faint', 'Distil Faint Essence', 'enchanting', 1, [['moonpetal', 0], ['thornberry', 2]], { kind: 'item', itemId: 'faint-essence', qty: 2 }, 4, { starter: true }),
  rec('distil-essence-lesser', 'Distil Lesser Essence', 'enchanting', 12, [['moonpetal', 1], ['silver-ore', 1]], { kind: 'item', itemId: 'lesser-essence', qty: 1 }, 10),
  rec('distil-essence-greater', 'Distil Greater Essence', 'enchanting', 26, [['ghostcap', 1], ['mithril-ingot', 1]], { kind: 'item', itemId: 'greater-essence', qty: 1 }, 18),
];

const INGOT_FORGE = [
  { tier: 2, level: 8, ingot: 'steel-ingot', n: 3 },
  { tier: 3, level: 16, ingot: 'mithril-ingot', n: 3 },
  { tier: 4, level: 26, ingot: 'adamant-ingot', n: 3 },
  { tier: 5, level: 36, ingot: 'starmetal-ingot', n: 3 },
  { tier: 6, level: 46, ingot: 'starmetal-ingot', n: 5 },
  { tier: 1, level: 1, ingot: 'steel-ingot', n: 2 },
].flatMap((t): RecipeDef[] => [
  rec(`ingot-weapon-${t.tier}`, `Ingot-Forged Weapon (tier ${t.tier})`, 'blacksmithing', t.level, [[t.ingot, t.n], ['ashwood-plank', 1], ['yew-plank', t.tier > 1 ? 1 : 0]], { kind: 'gear', category: 'weapon', tier: t.tier }, 10 + t.tier * 4, { gold: 30 * t.tier }),
  rec(`ingot-armor-${t.tier}`, `Ingot-Forged Armor (tier ${t.tier})`, 'blacksmithing', t.level, [[t.ingot, t.n], ['boar-hide', 1 + t.tier], ['wool-bolt', 2]], { kind: 'gear', category: 'armor', tier: t.tier }, 10 + t.tier * 4, { gold: 30 * t.tier }),
]);
const TANNING: RecipeDef[] = [
  rec('tan-rough-hide', 'Tan Rough Hide', 'tailoring', 1, [['wolf-pelt', 2]], { kind: 'item', itemId: 'rough-hide', qty: 1 }, 4, { starter: true }),
  rec('tan-thick-hide', 'Tan Thick Hide', 'tailoring', 12, [['boar-hide', 2], ['bear-hide', 1]], { kind: 'item', itemId: 'thick-hide', qty: 1 }, 8),
  rec('spin-silk-bolt', 'Spin a Silk Bolt', 'tailoring', 14, [['spider-silk', 3]], { kind: 'item', itemId: 'silk-bolt', qty: 1 }, 8),
  rec('weave-moonsilk', 'Weave Moonsilk', 'tailoring', 30, [['silk-bolt', 2], ['moonpetal', 2], ['thread-of-dawn', 1]], { kind: 'item', itemId: 'moonsilk', qty: 1 }, 16),
];

export const GREATER_RECIPES: RecipeDef[] = [...INGOT_FORGE, ...TANNING, ...cookingRecipes, ...alchemyRecipes, ...oilRecipes, ...gadgetRecipes, ...smeltRecipes, ...tailorGear, ...GRANDMASTER, ...JEWEL_EXTRA, ...ENCHANT_EXTRA];
