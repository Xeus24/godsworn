import type { RunewordDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

type M = [StatId, number, 'p'?];
const mods = (m: M[]): ModifierSpec[] => m.map(([stat, value, p]) => ({ stat, type: p ? 'percent' : 'flat', value }));
const r = (name: string) => `rune-${name}`;

type Row = [id: string, name: string, runes: string[], targets: RunewordDef['targets'], mods: M[], text: string, trigger?: RunewordDef['triggers']];

/** Phase 10: 24 more runewords, taking the list from 16 to 40. */
const ROWS: Row[] = [
  ['hearthfire', 'Hearthfire', ['ember', 'vigor'], ['armor'], [['fireResist', 15], ['hpRegen', 3]], 'Warm and steady: +15% fire resist, +3 HP a turn'],
  ['winters-grasp', 'Winter’s Grasp', ['frost', 'frost', 'ward'], ['weapon'], [['iceDamage', 18], ['statusChance', 8]], '15% chance on hit to Freeze', [{ id: 'rw-winters-grasp', trigger: 'onHit', chance: 15, effects: [{ kind: 'applyStatus', status: 'freeze', duration: 1 }] }]],
  ['thundercaller', 'Thundercaller', ['gale', 'gale', 'tide'], ['weapon'], [['lightningDamage', 18], ['speed', 2]], '12% chance on hit to Stun', [{ id: 'rw-stormcaller', trigger: 'onHit', chance: 12, effects: [{ kind: 'applyStatus', status: 'stun', duration: 1 }] }]],
  ['greenwarden', 'Greenwarden', ['thorn', 'thorn', 'vigor'], ['armor'], [['natureResist', 15], ['maxHp', 8, 'p']], '+8% max HP, +15% nature resist'],
  ['quarrymans-patience', 'Quarryman’s Patience', ['stone', 'stone', 'edge'], ['weapon'], [['accuracy', 15], ['critDamage', 20]], 'A patient blow: +15 accuracy, +20% crit damage'],
  ['tidewalker', 'Tidewalker', ['tide', 'gale'], ['armor'], [['speed', 2], ['dodge', 4]], 'Light on the wet: +2 speed, +4 dodge'],
  ['daybreak', 'Daybreak', ['dawn', 'ember'], ['weapon'], [['holyDamage', 15], ['fireDamage', 8]], '+15% holy damage and +8% fire damage'],
  ['long-night', 'The Long Night', ['dusk', 'frost'], ['weapon'], [['shadowDamage', 15], ['iceDamage', 8]], '+15% shadow damage and +8% ice damage'],
  ['bastion', 'Bastion', ['ward', 'stone', 'ward'], ['armor'], [['defense', 12, 'p'], ['damageTaken', -4]], 'Take 4% less damage, +12% defense'],
  ['keen-eye', 'Keen Eye', ['edge', 'dawn'], ['jewelry'], [['critChance', 4], ['accuracy', 10]], '+4% crit chance, +10 accuracy'],
  ['verdict', 'Verdict', ['oath', 'edge', 'oath'], ['weapon'], [['holyDamage', 20], ['critChance', 3]], 'Crits call down holy light', [{ id: 'rw-verdict', trigger: 'onCrit', effects: [{ kind: 'damage', element: 'holy', scaling: { stat: 'divinePower', ratio: 0.4 } }] }]],
  ['peacekeeper', 'Peacekeeper', ['oath', 'vigor'], ['armor'], [['maxHp', 10, 'p'], ['statusResist', 10]], '+10% max HP, +10 status resist'],
  ['wayfinder', 'Wayfinder', ['stone', 'gale', 'star'], ['jewelry'], [['magicFind', 12], ['speed', 2]], '+12% magic find and +2 speed'],
  ['grave-lantern', 'Grave Lantern', ['dusk', 'soul'], ['jewelry'], [['shadowDamage', 12], ['lifesteal', 2]], 'Heal 2% of damage dealt'],
  ['ember-crown', 'Ember Crown', ['ember', 'crown', 'ember'], ['armor'], [['fireDamage', 15], ['maxMp', 10, 'p']], '+15% fire damage, +10% max MP'],
  ['rift-walker', 'Rift-Walker', ['rift', 'edge'], ['weapon'], [['arcaneDamage', 18], ['cooldownReduction', 4]], '+18% arcane damage, +4% cooldown reduction'],
  ['laughing-fate', 'Laughing Fate', ['fury', 'star', 'fury'], ['jewelry'], [['luk', 8], ['critChance', 3]], '+8 LUK, +3% crit chance'],
  ['oathbreaker', 'Oathbreaker', ['oath', 'rift', 'fury'], ['weapon'], [['physicalDamage', 20], ['shieldPierce', 10]], 'Ignores 10% of enemy shields'],
  ['shepherds-rest', 'Shepherd’s Rest', ['vigor', 'dawn', 'vigor'], ['armor'], [['healingPower', 12], ['hpRegen', 4]], '+12% healing power, +4 HP a turn'],
  ['broken-sky', 'Broken Sky', ['gale', 'rift', 'star', 'gale'], ['weapon'], [['lightningDamage', 25], ['speed', 3]], 'A bolt from nowhere on 10% of hits', [{ id: 'rw-broken-sky', trigger: 'onHit', chance: 10, effects: [{ kind: 'damage', element: 'lightning', scaling: { stat: 'magicAttack', ratio: 0.6 } }] }]],
  ['lodestar', 'Lodestar', ['star', 'soul', 'star'], ['jewelry'], [['xpGain', 10], ['blessingPower', 10]], '+10% XP, +10% blessing power'],
  ['deep-roots', 'Deep Roots', ['thorn', 'stone', 'thorn', 'ward'], ['armor'], [['maxHp', 12, 'p'], ['defense', 10, 'p']], '+12% max HP, +10% defense'],
  ['dragonbane', 'Dragonbane', ['wyrm', 'edge', 'wyrm'], ['weapon'], [['damageBonus', 15], ['critDamage', 25]], '+15% damage, +25% crit damage', [{ id: 'rw-dragonbane', trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: 6, target: 'self' }] }]],
  ['hollow-throne', 'Hollow Throne', ['void', 'crown', 'soul', 'void'], ['armor'], [['voidDamage', 20], ['damageTaken', -8]], 'Take 8% less damage; +20% void damage'],
];

export const GREATER_RUNEWORDS: RunewordDef[] = ROWS.map(([id, name, runes, targets, m, text, triggers]) => ({
  id, name, runes: runes.map(r), targets, modifiers: mods(m), text, ...(triggers ? { triggers } : {}),
}));
