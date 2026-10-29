import type { UniqueItemDef } from '../../engine/items/types';
import { mods, type M } from './greaterLegendaries';

/** [id, name, base, level, base mods, lore, stages: [xp, mods, text][]] */
type Row = [string, string, string, number, M[], string, [number, M[], string][]];

const ROWS: Row[] = [
  ['seedling-blade', 'Seedling Blade', 'sword-t3', 20, [['natureDamage', 10]], 'It was an acorn when you found it. It insists it is still an acorn.', [[15, [['natureDamage', 10], ['physicalAttack', 6, 'p']], 'it puts out leaves'], [50, [['natureDamage', 15], ['hpRegen', 3]], 'it flowers'], [120, [['natureDamage', 20], ['physicalAttack', 8, 'p'], ['lifesteal', 2]], 'it bears fruit']]],
  ['ember-egg-staff', 'Staff of the Ember Egg', 'staff-t3', 20, [['fireDamage', 12]], 'An egg sits in the top. It is warm. It is thinking.', [[15, [['fireDamage', 12], ['magicAttack', 6, 'p']], 'the egg cracks'], [50, [['fireDamage', 18], ['maxMp', 8, 'p']], 'the hatchling stirs'], [120, [['fireDamage', 25], ['magicAttack', 10, 'p'], ['cooldownReduction', 4]], 'the drake wakes']]],
  ['tidebound-mail', 'Tidebound Mail', 'mail-chest-t3', 20, [['maxHp', 6, 'p']], 'It shrinks at low tide and swells at high. It does not apologize.', [[15, [['iceResist', 12], ['maxHp', 4, 'p']], 'it learns the tide'], [50, [['lightningResist', 15], ['hpRegen', 3]], 'it rides the surf'], [120, [['maxHp', 8, 'p'], ['damageTaken', -4], ['dodge', 4]], 'it becomes the sea']]],
  ['storybook', 'The Storybook', 'tome-t3', 20, [['xpGain', 5]], 'Each time you win, it adds a sentence.', [[15, [['xpGain', 5], ['magicAttack', 6, 'p']], 'the first chapter'], [50, [['xpGain', 8], ['cooldownReduction', 4]], 'the plot thickens'], [120, [['xpGain', 10], ['magicAttack', 10, 'p'], ['luk', 6]], 'the final page']]],
  ['wolf-pack-cloak', 'Wolf-Pack Cloak', 'leather-cloak-t3', 20, [['dodge', 4]], 'There was one wolf in it. By dawn there were two.', [[15, [['dodge', 4], ['speed', 1]], 'a second pelt grows in'], [50, [['critChance', 4], ['speed', 2]], 'a third howl'], [120, [['dodge', 6], ['physicalAttack', 8, 'p'], ['critDamage', 15]], 'the whole pack answers']]],
  ['hearth-ring', 'Hearth Ring', 'ring-t3', 20, [['hpRegen', 2]], 'It stays warm. It grows warmer the longer you are kind.', [[15, [['hpRegen', 2], ['healingPower', 6]], 'the glow steadies'], [50, [['maxHp', 6, 'p'], ['healingPower', 8]], 'the glow spreads'], [120, [['hpRegen', 4], ['healingPower', 12], ['statusResist', 12]], 'home is wherever it is']]],
  ['silent-bow', 'The Silent Bow', 'longbow-t3', 20, [['accuracy', 8]], 'It has not yet learned how to be heard. You are teaching it.', [[15, [['accuracy', 8], ['critChance', 3]], 'it stops creaking'], [50, [['critDamage', 20], ['physicalAttack', 8, 'p']], 'it stops twanging'], [120, [['critChance', 5], ['critDamage', 30], ['shieldPierce', 10]], 'it stops being noticed']]],
  ['oathshard', 'Oathshard', 'amulet-t3', 20, [['statusResist', 6]], 'A sliver of someone’s promise. Keep it, and it grows.', [[15, [['statusResist', 6], ['maxHp', 4, 'p']], 'the promise firms'], [50, [['defense', 8, 'p'], ['blessingPower', 8]], 'the vow is witnessed'], [120, [['damageTaken', -5], ['maxHp', 8, 'p'], ['favorGain', 12]], 'the oath is kept']]],
];

export const LIVING_ITEMS: UniqueItemDef[] = ROWS.map(([id, name, baseId, level, m, lore, stages]) => ({
  id, name, rarity: 'legendary', baseId, level, modifiers: mods(m),
  living: { stages: stages.map(([xp, sm, text]) => ({ xp, modifiers: mods(sm), text })) },
  effectText: stages.map(([xp, , text]) => `Living: at ${xp} experience, ${text}`),
  lore,
}));
