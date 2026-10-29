import type { TriggeredEffect } from '../../engine/effects/types';
import type { UniqueItemDef } from '../../engine/items/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import type { StatId } from '../../engine/stats/types';

export type M = [StatId, number, 'p'?];
export const mods = (m: M[]): ModifierSpec[] => m.map(([stat, value, p]) => ({ stat, type: p ? 'percent' : 'flat', value }));

/** Reusable trigger shapes; each item gets its own id from them. */
type Lib = (id: string) => TriggeredEffect;
const hit = (status: string, chance: number, duration = 2): Lib => (id) => ({ id: `${id}-${status}`, trigger: 'onHit', chance, effects: [{ kind: 'applyStatus', status, duration }] });
const smite = (element: 'fire' | 'ice' | 'lightning' | 'shadow' | 'holy' | 'nature' | 'arcane' | 'physical', ratio: number, stat: 'physicalAttack' | 'magicAttack' | 'divinePower', chance: number): Lib => (id) => ({ id: `${id}-smite`, trigger: 'onHit', chance, effects: [{ kind: 'damage', element, scaling: { stat, ratio } }] });
const kill = (percent: number): Lib => (id) => ({ id: `${id}-feast`, trigger: 'onKill', effects: [{ kind: 'heal', percentMaxHp: percent, target: 'self' }] });
const killShield = (percent: number): Lib => (id) => ({ id: `${id}-ward`, trigger: 'onKill', effects: [{ kind: 'shield', percentMaxHp: percent, target: 'self' }] });
const start = (effect: 'shield' | 'haste', value: number): Lib => (id) => ({ id: `${id}-start`, trigger: 'onCombatStart', effects: [effect === 'shield' ? { kind: 'shield', percentMaxHp: value, target: 'self' } : { kind: 'applyStatus', status: 'haste', duration: value, target: 'self' }] });
const crit = (percent: number): Lib => (id) => ({ id: `${id}-crit`, trigger: 'onCrit', effects: [{ kind: 'heal', percentMaxHp: percent, target: 'self' }] });
const low = (percent: number): Lib => (id) => ({ id: `${id}-low`, trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'shield', percentMaxHp: percent, target: 'self' }] });
const turn = (percent: number): Lib => (id) => ({ id: `${id}-turn`, trigger: 'onTurnStart', effects: [{ kind: 'heal', percentMaxHp: percent, target: 'self' }] });
const hurt = (status: string, chance: number): Lib => (id) => ({ id: `${id}-thorn`, trigger: 'onDamageTaken', chance, cooldown: 2, effects: [{ kind: 'applyStatus', status, duration: 2, target: 'target' }] });

export const LIB = { hit, smite, kill, killShield, start, crit, low, turn, hurt };

/** [id, name, base, level, modifiers, effect text, lore, trigger, flags] */
export type Row = [string, string, string, number, M[], string, string, Lib?, string[]?];

const ROWS: Row[] = [
  // ---- Katana, whip, longbow, pistol, rifle, chakram ----
  ['kasumi', 'Kasumi', 'katana-t3', 20, [['critChance', 6], ['physicalAttack', 12, 'p']], '25% chance on hit to Bleed', 'It was drawn once, in a village that does not mention it.', hit('bleed', 25, 3)],
  ['ninth-moon', 'The Ninth Moon', 'katana-t4', 30, [['critDamage', 30], ['dodge', 5]], '20% chance on hit to Slow', 'Eight moons failed the test. The ninth was a blade.', hit('slow', 20)],
  ['tsubame', 'Tsubame-Gaeshi', 'katana-t5', 42, [['speed', 4], ['physicalAttack', 18, 'p']], 'Start every battle with Haste for 1 turn', 'Two cuts, one motion, no argument.', start('haste', 1)],
  ['viper-lash', 'Viper’s Lash', 'whip-t3', 20, [['statusChance', 10], ['natureDamage', 15]], '30% chance on hit to Poison', 'It was taken from a snake-charmer who did not need it.', hit('poison', 30, 3)],
  ['ringmasters-crack', 'The Ringmaster’s Crack', 'whip-t4', 30, [['speed', 3], ['cha', 6]], '20% chance on hit to Charm', 'Every show ends when it says so.', hit('charm', 20, 1)],
  ['thornwhip-of-ysmay', 'Thornwhip', 'whip-t5', 42, [['physicalAttack', 15, 'p'], ['natureDamage', 25]], '25% chance on hit to Bleed', 'Grown, not forged. It still blooms in spring.', hit('bleed', 25, 3)],
  ['skysplitter', 'Skysplitter', 'longbow-t3', 20, [['accuracy', 12], ['critDamage', 25]], '15% chance on hit for a bolt of lightning', 'Its string is a thunderhead in a tight coil.', smite('lightning', 0.6, 'physicalAttack', 15)],
  ['elms-farewell', 'Elm’s Farewell', 'longbow-t4', 30, [['physicalAttack', 14, 'p'], ['critChance', 5]], 'Kills heal you for 5% of max HP', 'The last arrow that Elm ever loosed went a very long way.', kill(5)],
  ['hundred-paces', 'A Hundred Paces', 'longbow-t5', 42, [['damageBonus', 14], ['accuracy', 18]], 'Start every battle with a 10% shield', 'He said he would hit it from a hundred paces. He also said he would not miss.', start('shield', 10)],
  ['widows-whisper', 'Widow’s Whisper', 'pistol-t3', 20, [['critChance', 5], ['shieldPierce', 10]], '20% chance on hit to Weaken', 'There is no sound, only a very final silence.', hit('weaken', 20)],
  ['saints-answer', 'The Saint’s Answer', 'pistol-t4', 30, [['holyDamage', 25], ['physicalAttack', 12, 'p']], '15% chance on hit for holy fire', 'It is blessed, which helps nothing, and feels like it does.', smite('holy', 0.6, 'physicalAttack', 15)],
  ['dust-and-ash', 'Dust and Ash', 'pistol-t5', 42, [['critDamage', 35], ['speed', 3]], 'Crits heal you for 4% of max HP', 'Two shots in the dust. One of them was his own.', crit(4)],
  ['gutterking', 'The Gutter King', 'rifle-t3', 20, [['physicalDamage', 20], ['accuracy', 10]], '15% chance on hit to Blind', 'The street chose its ruler by whoever could hit the lamp.', hit('blind', 15)],
  ['long-silence', 'The Long Silence', 'rifle-t4', 30, [['critDamage', 40], ['shieldPierce', 15]], '15% chance on hit to Silence', 'It is not a loud rifle. It is a thorough one.', hit('silence', 15)],
  ['last-word-rifle', 'Last Word', 'rifle-t5', 42, [['physicalAttack', 20, 'p'], ['damageBonus', 12]], 'Kills restore 6% of max HP', 'The argument is over when it says it is.', kill(6)],
  ['wheel-of-fortune', 'Wheel of Fortune', 'chakram-t3', 20, [['luk', 8], ['critChance', 4]], '20% chance on hit to Stun', 'It always comes back. Sometimes with a coin.', hit('stun', 20, 1)],
  ['sunwheel', 'Sunwheel', 'chakram-t4', 30, [['fireDamage', 25], ['speed', 3]], '25% chance on hit to Burn', 'Spin it fast enough and the noon comes with it.', hit('burn', 25, 3)],
  ['moons-orbit', 'Moon’s Orbit', 'chakram-t5', 42, [['iceDamage', 30], ['dodge', 5]], '20% chance on hit to Freeze', 'It circles, it returns, it is never in the same place twice.', hit('freeze', 20, 1)],
  // ---- Older weapon types ----
  ['dawnbreaker-edge', 'Edge of the Morning', 'sword-t4', 30, [['holyDamage', 25], ['accuracy', 10]], '15% chance on hit to Blind', 'Struck against the first light at the first dawn.', hit('blind', 15)],
  ['oathkeeper', 'Oathkeeper', 'greatsword-t4', 30, [['physicalAttack', 18, 'p'], ['maxHp', 8, 'p']], 'Start every battle with a 12% shield', 'A promise with a handle.', start('shield', 12)],
  ['hewer', 'The Hewer', 'axe-t3', 20, [['physicalDamage', 18], ['critDamage', 20]], '20% chance on hit to Bleed', 'It has cut more wood than it has people. Barely.', hit('bleed', 20, 3)],
  ['wallbreaker', 'Wallbreaker', 'warhammer-t5', 42, [['physicalAttack', 20, 'p'], ['shieldPierce', 15]], '15% chance on hit to Stun', 'Every castle has a weakest stone. It finds it.', hit('stun', 15, 1)],
  ['miseries-comfort', 'Misery’s Comfort', 'mace-t3', 20, [['holyDamage', 18], ['healingPower', 10]], 'Crits heal you for 4% of max HP', 'A cruel mace, kindly used.', crit(4)],
  ['stiletto-of-whispers', 'Stiletto of Whispers', 'dagger-t4', 30, [['critChance', 7], ['speed', 3]], '20% chance on hit to Weaken', 'You will never know what it said to them.', hit('weaken', 20)],
  ['heron-spear', 'Heron’s Reach', 'spear-t4', 30, [['physicalAttack', 14, 'p'], ['accuracy', 12]], '20% chance on hit to Slow', 'Patient, still, and then not.', hit('slow', 20)],
  ['harvest-moon-scythe', 'Harvest Moon', 'scythe-t4', 30, [['lifesteal', 3], ['shadowDamage', 22]], 'Kills heal you for 6% of max HP', 'It reaps what the night has sown.', kill(6)],
  ['rowan-staff', 'Rowan Staff of the Hedge', 'staff-t3', 20, [['magicAttack', 14, 'p'], ['natureDamage', 18]], '20% chance on hit to Poison', 'It still has bark on it. It still has opinions.', hit('poison', 20, 3)],
  ['spark-wand', 'Spark of the Apprentice', 'wand-t3', 20, [['magicAttack', 12, 'p'], ['critChance', 4]], '15% chance on hit for a lightning bolt', 'Lit with the first spell its owner ever got right.', smite('lightning', 0.5, 'magicAttack', 15)],
  ['wayfarers-bow', 'The Wayfarer’s Bow', 'bow-t4', 30, [['speed', 3], ['physicalAttack', 14, 'p']], 'Start every battle with Haste for 1 turn', 'It has no home, only a direction.', start('haste', 1)],
  ['bolt-of-mercy', 'Bolt of Mercy', 'crossbow-t4', 30, [['critDamage', 35], ['accuracy', 10]], 'Crits heal you for 4% of max HP', 'The quickest way out of a bad situation.', crit(4)],
  ['tigers-grip', 'Tiger’s Grip', 'fist-t4', 30, [['physicalAttack', 14, 'p'], ['dodge', 5]], '25% chance on hit to Bleed', 'Four claws, one decision.', hit('bleed', 25, 3)],
  ['bardic-lament', 'The Bard’s Lament', 'instrument-t4', 30, [['magicAttack', 14, 'p'], ['resourceGain', 15]], '20% chance on hit to Charm', 'Played once, at a funeral. Unplayed since.', hit('charm', 20, 1)],
  // ---- Armor: heads, shoulders, chests ----
  ['helm-of-the-watch', 'Helm of the Long Watch', 'plate-head-t4', 30, [['defense', 12, 'p'], ['statusResist', 12]], 'Start every battle with a 10% shield', 'It has never been taken off a sleeping head.', start('shield', 10)],
  ['crown-of-quills', 'Crown of Quills', 'cloth-head-t4', 30, [['magicAttack', 10, 'p'], ['xpGain', 8]], '', 'Every quill was plucked from an honest raven.', undefined],
  ['hunters-cowl', 'Hunter’s Cowl of the Patient Hour', 'leather-head-t4', 30, [['critChance', 5], ['accuracy', 12]], '15% chance on hit to Slow', 'It remembers where you were hiding.', hit('slow', 15)],
  ['mantle-of-the-saint', 'Mantle of the Wandering Saint', 'cloth-shoulders-t4', 30, [['healingPower', 12], ['hpRegen', 3]], 'Regenerate 2% of max HP every turn', 'It does not shed the dust of the road.', turn(2)],
  ['pauldrons-of-ruin', 'Pauldrons of Quiet Ruin', 'plate-shoulders-t5', 42, [['physicalAttack', 14, 'p'], ['damageTaken', -4]], 'The first time you fall low, shield yourself for 20%', 'Whoever wore them first has not returned them.', low(20)],
  ['gale-spaulders', 'Gale Spaulders', 'leather-shoulders-t4', 30, [['speed', 3], ['dodge', 5]], 'Start every battle with Haste for 1 turn', 'Hung on a washing line for three storms.', start('haste', 1)],
  ['breastplate-of-hearth', 'Hearthguard Breastplate', 'plate-chest-t4', 30, [['maxHp', 12, 'p'], ['hpRegen', 3]], 'Regenerate 2% of max HP every turn', 'Warm to the touch, always.', turn(2)],
  ['weavers-vest', 'The Weaver’s Vest', 'cloth-chest-t4', 30, [['maxMp', 12, 'p'], ['cooldownReduction', 4]], 'The first time you fall low, shield yourself for 15%', 'Every thread is a small spell.', low(15)],
  ['jerkin-of-the-fox', 'Jerkin of the Last Fox', 'leather-chest-t4', 30, [['dodge', 7], ['critChance', 4]], '15% chance when hit to Blind the attacker', 'It was the last fox in the valley, and very clever.', hurt('blind', 15)],
  ['mail-of-a-hundred-rings', 'Mail of a Hundred Rings', 'mail-chest-t4', 30, [['defense', 14, 'p'], ['statusResist', 10]], '10% chance when hit to Slow the attacker', 'Each ring is a different promise.', hurt('slow', 10)],
  // ---- Armor: gloves, legs, boots ----
  ['gauntlets-of-the-judge', 'Gauntlets of the Last Judge', 'plate-gloves-t4', 30, [['physicalAttack', 12, 'p'], ['critDamage', 15]], '15% chance on hit to Weaken', 'They closed on a gavel once. They are still closed.', hit('weaken', 15)],
  ['gloves-of-the-pickpocket', 'Gloves of Light Fingers', 'leather-gloves-t4', 30, [['goldFind', 15], ['critChance', 3]], 'Crits heal you for 3% of max HP', 'They are not yours. They never have been.', crit(3)],
  ['mitts-of-the-mender', 'Mitts of the Mender', 'cloth-gloves-t4', 30, [['healingPower', 14], ['mpRegen', 2]], 'Kills restore 5% of max HP', 'Slightly stained, always warm.', kill(5)],
  ['greaves-of-the-march', 'Greaves of the Long March', 'plate-legs-t4', 30, [['defense', 12, 'p'], ['hpRegen', 3]], 'Start every battle with a 8% shield', 'Never once stopped for a rest.', start('shield', 8)],
  ['leggings-of-the-stalker', 'Leggings of the Stalker', 'leather-legs-t4', 30, [['dodge', 6], ['speed', 2]], 'Start every battle with Haste for 1 turn', 'Silent on every kind of floor.', start('haste', 1)],
  ['trousers-of-the-trickster', 'Trousers of the Trickster', 'cloth-legs-t4', 30, [['luk', 8], ['dodge', 4]], '15% chance when hit to Charm the attacker', 'Pockets in places you wouldn’t expect.', hurt('charm', 15)],
  ['boots-of-seven-roads', 'Boots of Seven Roads', 'leather-boots-t4', 30, [['speed', 4], ['magicFind', 8]], 'Start every battle with Haste for 1 turn', 'They know seven roads and they dislike the eighth.', start('haste', 1)],
  ['sabatons-of-the-stone', 'Sabatons of the Standing Stone', 'plate-boots-t4', 30, [['defense', 10, 'p'], ['statusResist', 14]], 'The first time you fall low, shield yourself for 20%', 'Planted, not worn.', low(20)],
  ['slippers-of-the-dream', 'Slippers of the Lucid Dream', 'cloth-boots-t4', 30, [['dodge', 6], ['mpRegen', 2]], 'Regenerate 1% of max HP every turn', 'You can’t be sure you’re wearing them. That’s the point.', turn(1)],
  // ---- Armor: cloaks and belts ----
  ['cloak-of-moths', 'Cloak of a Thousand Moths', 'cloth-cloak-t4', 30, [['dodge', 7], ['magicResist', 8, 'p']], '10% chance when hit to Blind the attacker', 'They flutter when you lie.', hurt('blind', 10)],
  ['mantle-of-embers', 'Mantle of Embers', 'leather-cloak-t4', 30, [['fireResist', 18], ['fireDamage', 20]], '15% chance when hit to Burn the attacker', 'It smoulders, politely.', hurt('burn', 15)],
  ['shroud-of-the-quiet', 'Shroud of the Quiet Death', 'cloth-cloak-t5', 42, [['shadowDamage', 25], ['damageTaken', -5]], 'Kills shield you for 6% of max HP', 'Whoever wore it first was exceedingly polite about dying.', killShield(6)],
  ['cloak-of-the-roads', 'Cloak of the Open Road', 'leather-cloak-t5', 42, [['speed', 4], ['lightningResist', 20]], 'Start every battle with Haste for 1 turn', 'It has never been dry, and doesn’t mind.', start('haste', 1)],
  ['belt-of-giants', 'Belt of the Hill-Giants', 'leather-belt-t4', 30, [['maxHp', 14, 'p'], ['str', 8], ['damageTaken', -3]], 'Take 3% less damage', 'Cut from a hill-giant’s own girdle.', undefined],
  ['sash-of-the-scholar', 'The Scholar’s Sash', 'cloth-belt-t4', 30, [['mpRegen', 3], ['xpGain', 8]], 'Regenerate 1% of max HP every turn', 'Knotted in the pattern of a forgotten alphabet.', turn(1)],
  ['girdle-of-the-forge', 'Girdle of the Forge', 'plate-belt-t4', 30, [['defense', 10, 'p'], ['fireResist', 15]], '10% chance when hit to Burn the attacker', 'Still warm from the last pour.', hurt('burn', 10)],
  // ---- Armor: mail and a few more ----
  ['hauberk-of-saints', 'Hauberk of the Seven Saints', 'mail-chest-t5', 42, [['maxHp', 14, 'p'], ['statusResist', 14]], 'Start every battle with a 12% shield', 'Seven names, one fit.', start('shield', 12)],
  ['coif-of-the-drowned', 'Coif of the Drowned', 'mail-head-t4', 30, [['iceResist', 18], ['maxMp', 10, 'p']], '10% chance when hit to Slow the attacker', 'It drips, always, without cause.', hurt('slow', 10)],
  ['gauntlets-of-iron-oath', 'Gauntlets of the Iron Oath', 'mail-gloves-t4', 30, [['physicalAttack', 12, 'p'], ['defense', 8, 'p']], '15% chance on hit to Stun', 'A handshake that changes the subject.', hit('stun', 15, 1)],
  ['greaves-of-thunder', 'Greaves of Rolling Thunder', 'mail-legs-t4', 30, [['lightningDamage', 20], ['speed', 2]], '15% chance on hit for a lightning bolt', 'The ground shakes politely before you.', smite('lightning', 0.5, 'physicalAttack', 15)],
  ['boots-of-the-ferryman', 'Boots of the Ferryman', 'mail-boots-t4', 30, [['shadowResist', 18], ['dodge', 4]], 'Kills heal you for 4% of max HP', 'They’ve crossed more rivers than they’ve admitted.', kill(4)],
  ['pauldrons-of-the-gale', 'Pauldrons of the Standing Gale', 'mail-shoulders-t4', 30, [['lightningResist', 15], ['speed', 3]], 'Start every battle with Haste for 1 turn', 'There is always a breeze, regardless.', start('haste', 1)],
  // ---- Accessories ----
  ['ring-of-the-lantern', 'Ring of the Lantern-Bearer', 'ring-t3', 20, [['holyDamage', 14], ['accuracy', 8]], '15% chance on hit to Blind', 'It lights the next three steps, no more.', hit('blind', 15)],
  ['ring-of-ledgers', 'Ring of Open Ledgers', 'ring-t3', 20, [['goldFind', 15], ['barter', 3]], 'Kills shield you for 4% of max HP', 'It counts.', killShield(4)],
  ['ring-of-ash', 'Ring of Warm Ash', 'ring-t4', 30, [['fireDamage', 20], ['fireResist', 15]], '15% chance on hit to Burn', 'It stopped being hot years ago, and still isn’t cold.', hit('burn', 15, 3)],
  ['ring-of-the-rook', 'The Rook’s Ring', 'ring-t4', 30, [['defense', 8, 'p'], ['critChance', 4]], 'The first time you fall low, shield yourself for 18%', 'A castle, in the shape of a finger.', low(18)],
  ['ring-of-whispers', 'Ring of Quiet Whispers', 'ring-t4', 30, [['statusChance', 12], ['shadowDamage', 15]], '15% chance on hit to Silence', 'It never says anything you can quote.', hit('silence', 15)],
  ['amulet-of-the-tide', 'Amulet of the Slow Tide', 'amulet-t4', 30, [['maxHp', 10, 'p'], ['hpRegen', 3]], 'Regenerate 2% of max HP every turn', 'It rises. It falls. It returns.', turn(2)],
  ['amulet-of-the-hearth', 'Hearthstone Amulet', 'amulet-t3', 20, [['healingPower', 12], ['statusResist', 10]], 'Kills restore 4% of max HP', 'Warm in the hand, like a small, stubborn fire.', kill(4)],
  ['amulet-of-hours', 'Amulet of Borrowed Hours', 'amulet-t5', 42, [['cooldownReduction', 6], ['speed', 3]], 'Start every battle with Haste for 1 turn', 'A few minutes, lent, never repaid.', start('haste', 1)],
  ['amulet-of-the-raven', 'Amulet of the Raven Queen', 'amulet-t4', 30, [['shadowDamage', 22], ['lifesteal', 2]], 'Kills heal you for 5% of max HP', 'Pay the toll, and the toll is paid.', kill(5)],
  ['earring-of-the-gambler', 'Earring of the Last Chip', 'earring-t3', 20, [['luk', 8], ['magicFind', 10]], 'Crits heal you for 3% of max HP', 'Everything on red.', crit(3)],
  ['earring-of-the-listener', 'Earring of the Listener', 'earring-t4', 30, [['accuracy', 14], ['wis', 8]], '15% chance on hit to Weaken', 'It repeats nothing, which is its charm.', hit('weaken', 15)],
  ['earring-of-sunrise', 'Earring of the False Sunrise', 'earring-t4', 30, [['holyDamage', 18], ['hpRegen', 2]], 'Start every battle with a 10% shield', 'Wear it at night and it shines anyway.', start('shield', 10)],
  ['earring-of-storms', 'Earring of Distant Storms', 'earring-t5', 42, [['lightningDamage', 25], ['cooldownReduction', 4]], '15% chance on hit for a lightning bolt', 'The weather you hear in it is not yours.', smite('lightning', 0.5, 'magicAttack', 15)],
  ['earring-of-the-pilgrim', 'Pilgrim’s Earring', 'earring-t3', 20, [['favorGain', 15], ['maxHp', 6, 'p']], 'Regenerate 1% of max HP every turn', 'A bell the size of a pea.', turn(1)],
  // ---- Offhands ----
  ['shield-of-the-stag', 'Shield of the Stag King', 'shield-t4', 30, [['defense', 14, 'p'], ['damageTaken', -4]], '10% chance when hit to Stun the attacker', 'Antlers up, always.', hurt('stun', 10)],
  ['aegis-of-the-rampart', 'Aegis of the Last Rampart', 'shield-t5', 42, [['maxHp', 12, 'p'], ['statusResist', 18]], 'The first time you fall low, shield yourself for 25%', 'It remembers every wall that fell behind it.', low(25)],
  ['bulwark-of-saint-brenna', 'Candlewright’s Bulwark', 'shield-t3', 20, [['holyResist', 20], ['fireResist', 12]], 'Start every battle with a 10% shield', 'A small flame, held steady.', start('shield', 10)],
  ['tome-of-quiet-hours', 'Tome of Quiet Hours', 'tome-t4', 30, [['cooldownReduction', 5], ['magicAttack', 12, 'p']], '15% chance on hit to Slow', 'Every page is a pause.', hit('slow', 15)],
  ['grimoire-of-embers', 'Grimoire of Embers', 'tome-t4', 30, [['fireDamage', 25], ['maxMp', 10, 'p']], '15% chance on hit to Burn', 'It cannot be closed all the way.', hit('burn', 15, 3)],
  ['codex-of-saints', 'Codex of the Lesser Saints', 'tome-t5', 42, [['blessingPower', 18], ['healingPower', 14]], 'Regenerate 2% of max HP every turn', 'The lesser saints did the greater work.', turn(2)],
  ['orb-of-still-water', 'Orb of Still Water', 'orb-t3', 20, [['iceDamage', 18], ['statusChance', 8]], '15% chance on hit to Freeze', 'It reflects a room that is not here.', hit('freeze', 15, 1)],
  ['orb-of-the-hollow', 'Orb of the Hollow Star', 'orb-t4', 30, [['voidDamage', 22], ['critDamage', 20]], '15% chance on hit to Weaken', 'It holds nothing, very tightly.', hit('weaken', 15)],
  ['orb-of-green-fire', 'Orb of Green Fire', 'orb-t4', 30, [['natureDamage', 22], ['mpRegen', 2]], '20% chance on hit to Poison', 'A cold flame in a warm hand.', hit('poison', 20, 3)],
  ['orb-of-days', 'Orb of Counted Days', 'orb-t5', 42, [['arcaneDamage', 28], ['cooldownReduction', 5]], 'Start every battle with Haste for 1 turn', 'You can watch the days leave it.', start('haste', 1)],
  ['lute-of-lost-songs', 'Lute of Lost Songs', 'instrument-t3', 20, [['resourceGain', 15], ['magicAttack', 10, 'p']], '15% chance on hit to Charm', 'It only knows songs that have never been written.', hit('charm', 15, 1)],
  ['wand-of-small-mercies', 'Wand of Small Mercies', 'wand-t4', 30, [['healingPower', 16], ['magicAttack', 10, 'p']], 'Kills heal you for 4% of max HP', 'It’s very small. It’s very kind.', kill(4)],
  ['staff-of-the-eclipse', 'Staff of the Slow Eclipse', 'staff-t5', 42, [['shadowDamage', 25], ['holyDamage', 15]], '15% chance on hit to Blind', 'Half dark, half bright, entirely patient.', hit('blind', 15)],
  ['bow-of-the-first-frost', 'Bow of the First Frost', 'bow-t5', 42, [['iceDamage', 28], ['critChance', 5]], '20% chance on hit to Freeze', 'The arrows are never fletched. They just form.', hit('freeze', 20, 1)],
];

export const GREATER_LEGENDARIES: UniqueItemDef[] = ROWS.map(([id, name, baseId, level, m, text, lore, trigger, flags]) => ({
  id, name, rarity: 'legendary', baseId, level, modifiers: mods(m),
  ...(trigger ? { triggers: [trigger(id)] } : {}),
  ...(flags ? { flags } : {}),
  effectText: text ? [text] : [],
  lore,
}));
