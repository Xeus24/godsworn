import type { EffectSpec } from '../../engine/effects/types';
import type { UniqueItemDef } from '../../engine/items/types';
import { LIB, mods, type M } from './greaterLegendaries';

type Lib = (id: string) => ReturnType<(typeof LIB)['hit']> extends (id: string) => infer T ? T : never;
type Trig = ReturnType<Lib>;

const { hit, smite, kill, killShield, start, crit, low, turn } = LIB;

/** [id, name, base, level, mods, lines, lore, triggers, flags] */
type Rare = [string, string, string, number, M[], string[], string, ((id: string) => Trig)[], string[]];

const MYTHIC_ROWS: Rare[] = [
  ['dawns-last-stand', 'Dawn’s Last Stand', 'greatsword-t5', 42, [['holyDamage', 35], ['physicalAttack', 22, 'p']], ['Deal 25% more damage to bosses', '15% chance on hit for holy fire'], 'It fell at dawn, and so did everyone it was swung at.', [smite('holy', 0.8, 'physicalAttack', 15)], ['bonusVsBosses']],
  ['nights-open-hand', 'Night’s Open Hand', 'dagger-t5', 42, [['shadowDamage', 35], ['critChance', 8]], ['Begin every battle in stealth', 'Attacks against enemies below 20% HP always crit'], 'The kindest knife in the world.', [], ['stealthOnCombatStart', 'executioner']],
  ['tempest-heart', 'The Tempest’s Heart', 'staff-t5', 42, [['lightningDamage', 40], ['magicAttack', 25, 'p']], ['20% chance for spells to cast a second time', '15% chance on hit to Stun'], 'Weather gave it away.', [hit('stun', 15, 1)], ['spellEcho']],
  ['everburning-crown', 'The Everburning Crown', 'plate-head-t5', 42, [['fireDamage', 35], ['fireResist', 30]], ['Burning enemies spread Burn on death', '20% chance on hit to Burn'], 'It was never meant to be cold.', [hit('burn', 20, 3)], ['burnSpreadsOnDeath']],
  ['winters-throne-shard', 'Shard of Winter’s Throne', 'orb-t5', 42, [['iceDamage', 40], ['magicAttack', 22, 'p']], ['Ice damage against Burning enemies always Shatters', '20% chance on hit to Freeze'], 'Still the coldest seat in the world.', [hit('freeze', 20, 1)], ['shatterAlways']],
  ['gravewalkers-tome', 'Gravewalker’s Tome', 'tome-t5', 42, [['shadowDamage', 30], ['maxMp', 20, 'p']], ['Summoning skills raise one extra minion', 'Kills heal you for 6% of max HP'], 'Chapter Eleven is how you begin again.', [kill(6)], ['extraSummon']],
  ['unbroken-bastion', 'The Unbroken Bastion', 'shield-t5', 42, [['defense', 25, 'p'], ['maxHp', 15, 'p']], ['Once per battle, survive a killing blow', 'Start every battle with a 15% shield'], 'It has been holding one door for four hundred years.', [start('shield', 15)], ['reviveOnce']],
  ['the-long-patience', 'The Long Patience', 'longbow-t5', 42, [['critDamage', 50], ['accuracy', 25]], ['Damage over time can critically strike', 'Crits heal you for 5% of max HP'], 'It waits. It is very good at waiting.', [crit(5)], ['dotsCanCrit']],
  ['voidglass-lens', 'Voidglass Lens', 'orb-t6', 54, [['voidDamage', 40], ['cooldownReduction', 8]], ['20% chance for spells to cast a second time', '15% chance on hit to Silence'], 'Through it, everything is slightly further away.', [hit('silence', 15)], ['spellEcho']],
  ['harbingers-bell', 'The Harbinger’s Bell', 'mace-t5', 42, [['holyDamage', 30], ['healingPower', 20]], ['Half of all overhealing becomes a shield', 'Kills restore 6% of max HP'], 'It rings before the good news, too.', [kill(6)], ['overhealShield']],
  ['hollow-kings-edge', 'Hollow King’s Edge', 'sword-t6', 54, [['voidDamage', 35], ['physicalAttack', 25, 'p']], ['Deal 25% more damage to bosses', 'Critical hits ignore half of the target’s defense'], 'A crown is optional.', [], ['bonusVsBosses', 'critsIgnoreDefense']],
  ['sunlit-hauberk', 'Sunlit Hauberk', 'mail-chest-t5', 42, [['maxHp', 20, 'p'], ['holyResist', 30]], ['Deal 20% more damage during the day', 'Regenerate 2% of max HP every turn'], 'Wear it at noon, and not a soul will argue.', [turn(2)], ['strongerByDay']],
  ['moonlit-mantle', 'Moonlit Mantle', 'cloth-cloak-t5', 42, [['dodge', 12], ['iceResist', 30]], ['Deal 20% more damage at night', 'Start every battle with Haste for 1 turn'], 'The moon likes the cut of it.', [start('haste', 1)], ['strongerAtNight']],
  ['windrunners-boots', 'Windrunner’s Boots', 'leather-boots-t5', 42, [['speed', 7], ['dodge', 10]], ['Always act first in the opening round', 'Start every battle with Haste for 1 turn'], 'They arrive first. Always.', [start('haste', 1)], ['firstStrike']],
  ['drakes-gauntlets', 'Drakescale Gauntlets', 'plate-gloves-t5', 42, [['fireDamage', 30], ['physicalAttack', 20, 'p']], ['Melee attacks can strike the back row', '20% chance on hit to Burn'], 'It reaches over the front line without apology.', [hit('burn', 20, 3)], ['reach']],
  ['reliquary-pauldrons', 'Reliquary Pauldrons', 'plate-shoulders-t5', 42, [['maxHp', 15, 'p'], ['blessingPower', 20]], ['Once per battle, survive a killing blow', 'The first time you fall low, shield yourself for 25%'], 'Someone else’s faith, worn proudly.', [low(25)], ['reviveOnce']],
  ['trickster-bandolier', 'Trickster’s Bandolier', 'leather-chest-t5', 42, [['luk', 15], ['critChance', 8]], ['Begin every battle in stealth', 'Crits heal you for 4% of max HP'], 'Every pocket has a pocket.', [crit(4)], ['stealthOnCombatStart']],
  ['archivists-eye', 'The Archivist’s Eye', 'amulet-t5', 42, [['xpGain', 15], ['magicAttack', 18, 'p']], ['20% chance for spells to cast a second time', 'Regenerate 2% of max HP every turn'], 'It has seen everything, and it has notes.', [turn(2)], ['spellEcho']],
  ['wardens-oath-ring', 'The Warden’s Oath', 'ring-t5', 42, [['defense', 15, 'p'], ['statusResist', 25]], ['Start every battle with a 15% shield', 'Kills shield you for 5% of max HP'], 'Sworn to a forest that remembers.', [start('shield', 15), killShield(5)], []],
  ['bardmasters-baton', 'Bardmaster’s Baton', 'wand-t5', 42, [['resourceGain', 25], ['cha', 10]], ['Two songs can play at once', '15% chance on hit to Charm'], 'The hall quiets before it is raised.', [hit('charm', 15, 1)], ['twinSongs']],
];

export const GREATER_MYTHICS: UniqueItemDef[] = MYTHIC_ROWS.map(([id, name, baseId, level, m, text, lore, trig, flags]) => ({
  id, name, rarity: 'mythic', baseId, level, modifiers: mods(m), triggers: trig.map((t) => t(id)), ...(flags.length ? { flags } : {}), effectText: text, lore,
}));

const PRIMORDIAL_ROWS: Rare[] = [
  ['first-fire', 'The First Fire', 'sword-t7', 70, [['fireDamage', 60], ['physicalAttack', 35, 'p']], ['Deal 25% more damage to bosses', 'Burning enemies spread Burn on death', '25% chance on hit to Burn'], 'Older than the word for warmth.', [hit('burn', 25, 3)], ['bonusVsBosses', 'burnSpreadsOnDeath']],
  ['last-frost', 'The Last Frost', 'staff-t7', 70, [['iceDamage', 60], ['magicAttack', 35, 'p']], ['Ice damage against Burning enemies always Shatters', '20% chance for spells to cast a second time', '20% chance on hit to Freeze'], 'It will be here when nothing else is.', [hit('freeze', 20, 1)], ['shatterAlways', 'spellEcho']],
  ['unsung-requiem', 'The Unsung Requiem', 'instrument-t7', 70, [['shadowDamage', 50], ['resourceGain', 40]], ['Two songs can play at once', 'Kills heal you for 8% of max HP', 'Damage over time can critically strike'], 'The song the world was too shy to finish.', [kill(8)], ['twinSongs', 'dotsCanCrit']],
  ['sundered-aegis', 'The Sundered Aegis', 'shield-t7', 70, [['defense', 40, 'p'], ['damageTaken', -10]], ['Once per battle, survive a killing blow', 'Start every battle with a 20% shield', 'Take 10% less damage'], 'Cracked down the middle, which is the strongest way.', [start('shield', 20)], ['reviveOnce']],
  ['wyrmfang', 'Wyrmfang', 'dagger-t7', 70, [['physicalAttack', 35, 'p'], ['critDamage', 70]], ['Critical hits ignore half of the target’s defense', 'Attacks against enemies below 20% HP always crit', 'Crits heal you for 5% of max HP'], 'It was a tooth, once. It remembers.', [crit(5)], ['critsIgnoreDefense', 'executioner']],
  ['hearts-bloom', 'Heart’s Bloom', 'cloth-chest-t7', 70, [['maxHp', 30, 'p'], ['healingPower', 40]], ['Half of all overhealing becomes a shield', 'Regenerate 3% of max HP every turn', 'Kills restore 6% of max HP'], 'Warm and green and a little rude about it.', [turn(3), kill(6)], ['overhealShield']],
  ['stormlords-crown', 'The Stormlord’s Crown', 'plate-head-t7', 70, [['lightningDamage', 55], ['speed', 10]], ['Always act first in the opening round', 'Start every battle with Haste for 2 turns', '15% chance on hit for a lightning bolt'], 'It argues with the clouds and wins.', [start('haste', 2), smite('lightning', 1, 'magicAttack', 15)], ['firstStrike']],
  ['nameless-hours', 'The Nameless Hours', 'amulet-t6', 70, [['cooldownReduction', 18], ['voidDamage', 45]], ['20% chance for spells to cast a second time', 'Start every battle with Haste for 2 turns', '+18% cooldown reduction'], 'Fifty of them, in a row, with nobody to count.', [start('haste', 2)], ['spellEcho']],
  ['unwritten-ledger', 'The Unwritten Ledger', 'tome-t7', 70, [['xpGain', 25], ['arcaneDamage', 55]], ['Summoning skills raise one extra minion', '20% chance for spells to cast a second time', 'Regenerate 2% of max HP every turn'], 'Every page is a promise that has not yet been made.', [turn(2)], ['extraSummon', 'spellEcho']],
  ['shroud-of-endings', 'Shroud of All Endings', 'leather-cloak-t7', 70, [['shadowDamage', 40], ['dodge', 20]], ['Begin every battle in stealth', 'Deal 20% more damage at night', 'Kills shield you for 8% of max HP'], 'It does not hide you. It simply agrees that you are not there.', [killShield(8)], ['stealthOnCombatStart', 'strongerAtNight']],
];

export const GREATER_PRIMORDIALS: UniqueItemDef[] = PRIMORDIAL_ROWS.map(([id, name, baseId, level, m, text, lore, trig, flags]) => ({
  id, name, rarity: 'primordial', baseId, level, modifiers: mods(m), triggers: trig.map((t) => t(id)), ...(flags.length ? { flags } : {}), effectText: text, lore,
}));

// ---------------------------------------------------------------- relics

type Event = 'enemyKilled' | 'bossKilled' | 'combatWon' | 'critLanded' | 'healed' | 'prayed';
const heal = (n: number): EffectSpec => ({ kind: 'heal', percentMaxHp: n, target: 'allAllies' });
const shield = (n: number): EffectSpec => ({ kind: 'shield', percentMaxHp: n, target: 'allAllies' });
const status = (s: string, d: number, target: 'allEnemies' | 'target' | 'self' | 'allAllies' = 'allEnemies'): EffectSpec => ({ kind: 'applyStatus', status: s, duration: d, target });
const bolt = (el: 'fire' | 'ice' | 'lightning' | 'shadow' | 'holy' | 'nature' | 'arcane', ratio: number, stat: 'magicAttack' | 'physicalAttack' | 'divinePower' = 'magicAttack'): EffectSpec => ({ kind: 'damage', element: el, scaling: { stat, ratio }, target: 'allEnemies' });
const buff = (id: string, stat: 'damageBonus' | 'defense' | 'speed' | 'critChance', v: number, type: 'flat' | 'percent' = 'flat'): EffectSpec => ({ kind: 'buff', id, duration: 3, modifiers: [{ stat, type, value: v }], target: 'allAllies' });

/** [id, name, level, mods, ability name, ability text, ability effects, cooldown, awakening text, event, count, awakening mods, lore] */
type RelicRow = [string, string, number, M[], string, string, EffectSpec[], number, string, Event, number, M[], string];

const RELICS: RelicRow[] = [
  ['bell-of-brightwater', 'Bell of Brightwater', 8, [['healingPower', 10]], 'Morning Toll', 'Heal the party for 20% of max HP.', [heal(20)], 6, 'Win 60 battles while wearing it.', 'combatWon', 60, [['healingPower', 20], ['hpRegen', 4]], 'It has rung at every sunrise since the founding, even the ones nobody attended.'],
  ['thornwicks-acorn', 'Thornwick’s Acorn', 12, [['natureDamage', 12]], 'Sprout', 'Shield the party for 12% of max HP.', [shield(12)], 5, 'Defeat 80 enemies while wearing it.', 'enemyKilled', 80, [['natureDamage', 22], ['maxHp', 8]], 'It has never sprouted. It is waiting for permission.'],
  ['saltmere-compass', 'The Saltmere Compass', 18, [['magicFind', 10], ['speed', 1]], 'True North', 'The party gains +10% speed for 3 turns.', [buff('true-north', 'speed', 10, 'percent')], 5, 'Win 80 battles while wearing it.', 'combatWon', 80, [['magicFind', 20], ['speed', 2]], 'It points to whatever you’re looking for, and is never ashamed of it.'],
  ['sandhaven-signet', 'Sandhaven Signet', 22, [['goldFind', 12], ['physicalAttack', 6, 'p']], 'Mercenary’s Rate', 'The party deals +15% damage for 3 turns.', [buff('mercenarys-rate', 'damageBonus', 15)], 5, 'Defeat 120 enemies while wearing it.', 'enemyKilled', 120, [['goldFind', 25], ['damageBonus', 6]], 'Every contract it has signed has been honored. One was by accident.'],
  ['frosthold-lens', 'Frosthold Lens', 28, [['iceDamage', 15], ['accuracy', 8]], 'Rime Sight', 'Freeze-chill every enemy (Slow for 2 turns).', [status('slow', 2)], 5, 'Slay 4 bosses while wearing it.', 'bossKilled', 4, [['iceDamage', 25], ['critChance', 3]], 'The glass remembers a winter it was never in.'],
  ['hourglass-of-sands', 'Hourglass of Many Sands', 30, [['cooldownReduction', 6]], 'Turn It Over', 'Heal the party for 15% and Haste yourself for 2 turns.', [heal(15), status('haste', 2, 'self')], 6, 'Win 100 battles while wearing it.', 'combatWon', 100, [['cooldownReduction', 12], ['speed', 2]], 'Every grain was somewhere else a moment ago.'],
  ['kaels-whetstone', 'Kael’s Whetstone', 20, [['physicalAttack', 8, 'p']], 'Edge of Glory', 'The party gains +20% crit chance for 3 turns.', [buff('edge-of-glory', 'critChance', 20)], 5, 'Land 100 critical hits while wearing it.', 'critLanded', 100, [['critDamage', 25], ['physicalAttack', 8, 'p']], 'It improves nothing it touches, except resolve.'],
  ['vexs-lucky-die', 'Vex’s Lucky Die', 15, [['luk', 6], ['critChance', 2]], 'Roll Again', 'Haste yourself for 2 turns and gain Stealth.', [status('haste', 2, 'self'), status('stealth', 2, 'self')], 6, 'Land 80 critical hits while wearing it.', 'critLanded', 80, [['luk', 12], ['critChance', 4]], 'It always comes up the number you needed, which is deeply suspicious.'],
  ['morraths-candle', 'Morrath’s Funeral Candle', 25, [['shadowDamage', 15]], 'Last Light', 'Curse every enemy for 2 turns.', [status('curse', 2)], 5, 'Slay 5 bosses while wearing it.', 'bossKilled', 5, [['shadowDamage', 25], ['lifesteal', 2]], 'It burns only for those who are already leaving.'],
  ['aurelis-quill', 'Aurelis’s Quill', 25, [['xpGain', 8], ['magicAttack', 8, 'p']], 'Corrected Draft', 'Every enemy is Weakened for 2 turns.', [status('weaken', 2)], 5, 'Win 120 battles while wearing it.', 'combatWon', 120, [['xpGain', 15], ['cooldownReduction', 6]], 'It has never written a lie. It has edited some.'],
  ['grimvalds-scale', 'Grimvald’s Scale', 30, [['goldFind', 15], ['barter', 3]], 'Fair Weight', 'The party gains +10% defense for 3 turns and you gain a 10% shield.', [buff('fair-weight', 'defense', 10, 'percent'), { kind: 'shield', percentMaxHp: 10, target: 'self' }], 6, 'Defeat 150 enemies while wearing it.', 'enemyKilled', 150, [['goldFind', 30], ['barter', 5]], 'It weighs people honestly, which is unkind of it.'],
  ['lyssaras-moonstone', 'Lyssara’s Moonstone', 24, [['iceDamage', 12], ['dodge', 3]], 'Lull', 'Enemies may fall asleep (50%) for 2 turns.', [{ kind: 'applyStatus', status: 'dream-sleep', duration: 2, chance: 50, target: 'allEnemies' }], 6, 'Win 90 battles while wearing it.', 'combatWon', 90, [['iceDamage', 20], ['hpRegen', 4]], 'It glows only when no one is looking directly at it.'],
  ['ordruns-keystone', 'Ordrun’s Keystone', 28, [['defense', 10, 'p'], ['maxHp', 6, 'p']], 'Hold', 'The party takes 15% less damage for 3 turns.', [{ kind: 'buff', id: 'hold', duration: 3, modifiers: [{ stat: 'damageTaken', type: 'more', value: -15 }], target: 'allAllies' }], 6, 'Slay 4 bosses while wearing it.', 'bossKilled', 4, [['defense', 15, 'p'], ['maxHp', 10, 'p']], 'It holds the arch up. The arch is no longer there. It holds anyway.'],
  ['seraphels-feather', 'Seraphel’s Feather', 28, [['speed', 3], ['dodge', 6]], 'Updraft', 'Haste the party for 2 turns.', [status('haste', 2, 'allAllies')], 6, 'Win 100 battles while wearing it.', 'combatWon', 100, [['speed', 5], ['dodge', 8]], 'It has never once fallen.'],
  ['mirrins-page', 'Mirrin’s Folded Page', 32, [['cooldownReduction', 8], ['accuracy', 8]], 'Recall', 'Heal the party for 18% of max HP and take an extra turn.', [heal(18), { kind: 'timeShift', turns: -1, target: 'self' }], 7, 'Pray 40 times while wearing it.', 'prayed', 40, [['cooldownReduction', 15], ['xpGain', 10]], 'On it is a sentence you haven’t read yet.'],
  ['tooth-of-the-wolf-king', 'Tooth of the Wolf King', 20, [['physicalAttack', 8, 'p'], ['speed', 2]], 'Howl', 'The party deals +15% damage for 3 turns.', [buff('howl', 'damageBonus', 15)], 5, 'Defeat 100 enemies while wearing it.', 'enemyKilled', 100, [['physicalAttack', 14, 'p'], ['critChance', 3]], 'Still sharp enough to cut moonlight.'],
  ['stormglass-orb', 'Stormglass Orb', 35, [['lightningDamage', 18], ['cooldownReduction', 4]], 'Eye of the Gale', 'Strike every enemy with lightning for 90% MAG.', [bolt('lightning', 0.9)], 6, 'Slay 6 bosses while wearing it.', 'bossKilled', 6, [['lightningDamage', 30], ['speed', 3]], 'Inside, a very small storm is losing an argument.'],
  ['crown-of-the-mountain-king', 'Crown of the Mountain King', 40, [['maxHp', 10, 'p'], ['physicalAttack', 8, 'p']], 'Stone Decree', 'The party takes 12% less damage and deals +12% damage for 3 turns.', [{ kind: 'buff', id: 'stone-decree', duration: 3, modifiers: [{ stat: 'damageTaken', type: 'more', value: -12 }, { stat: 'damageBonus', type: 'flat', value: 12 }], target: 'allAllies' }], 6, 'Slay 6 bosses while wearing it.', 'bossKilled', 6, [['maxHp', 15, 'p'], ['physicalAttack', 12, 'p']], 'It was handed down, and it never once asked for a head.'],
  ['ashen-rosary', 'Ashen Rosary', 38, [['holyDamage', 18], ['statusResist', 10]], 'Litany', 'Heal the party for 20% and cleanse Curse and Fear.', [heal(20), { kind: 'removeStatus', status: 'curse', target: 'allAllies' }, { kind: 'removeStatus', status: 'fear', target: 'allAllies' }], 6, 'Pray 30 times while wearing it.', 'prayed', 30, [['holyDamage', 28], ['healingPower', 15]], 'Each bead is a name. None of them is yours, yet.'],
];

export const GREATER_RELICS: UniqueItemDef[] = RELICS.map(([id, name, level, m, abName, abText, effects, cooldown, awText, event, count, awMods, lore]) => ({
  id, name, rarity: 'relic', baseId: 'ancient-relic', level, modifiers: mods(m),
  activeAbility: { name: abName, description: abText, effects, cooldown },
  awakening: { description: awText, event, count, modifiers: mods(awMods), effectText: awMods.map(([s, v, p]) => `+${v}${p ? '%' : ''} ${s}`).join(', ') },
  effectText: [lore],
}));
