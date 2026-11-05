import type { GreaterClass } from '../greaterClass';
import { deed } from '../story/helpers';
import { act, buff, gain, healPct, shieldPct, spec, status, trg, ult } from './kit';
import { emblem, kitOf, liteSpecs, liteTree, mentorOf, traitOf } from './tabletop';

const B = ['Spell', 'Song', 'Holy'] as const;
/** Bells and tones: sound-based magic that counters the Choir. */
export const BELLWARDEN_SKILLS = [
  act('toll-the-bell', 'Toll the Bell', 'A single toll: 160% MAG holy damage. Gain 12 Toll.', { el: 'holy', to: 'enemy', tags: [...B, 'Builder'], dmg: ['m', 1.6, 0.12], gen: ['toll', 12] }),
  act('clanging-alarm', 'Clanging Alarm', 'Spend 15 Toll: every enemy is Silenced and Slowed for 2 turns.', { el: 'physical', to: 'allEnemies', tags: ['Debuff', 'Song', 'AoE'], cd: 4, res: ['toll', 15], fx: [status('silence', 2, { target: 'allEnemies' }), status('slow', 2, { target: 'allEnemies' })] }),
  act('low-tone', 'Low Tone', 'Spend 15 Toll: a deep tone: the party gains +15% defense and heals 8% for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Song', 'Team', 'Heal'], cd: 3, res: ['toll', 15], fx: [healPct(8, 'allAllies'), buff('low-tone', 3, [{ stat: 'defense', type: 'percent', value: 15 }], 'allAllies')] }),
  act('high-tone', 'High Tone', 'Spend 15 Toll: a thin, bright tone: +15% speed and +10% crit for the party for 3 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Song', 'Team'], cd: 3, res: ['toll', 15], fx: [buff('high-tone', 3, [{ stat: 'speed', type: 'percent', value: 15 }, { stat: 'critChance', type: 'flat', value: 10 }], 'allAllies')] }),
  act('cracked-chime', 'Cracked Chime', '150% MAG; the foe is Confused for a turn. Gain 10 Toll.', { el: 'holy', to: 'enemy', tags: [...B, 'Builder'], cd: 2, dmg: ['m', 1.5, 0.11], gen: ['toll', 10], fx: [status('confuse', 1)] }),
  act('resonance', 'Resonance', 'Spend 20 Toll: 190% MAG to every enemy; they take 10% more damage for 3 turns.', { el: 'holy', to: 'allEnemies', tags: [...B, 'AoE'], cd: 3, res: ['toll', 20], dmg: ['m', 1.9, 0.14], fx: [status('vulnerable', 3, { target: 'allEnemies' })] }),
  act('muffled-bell', 'Muffled Bell', 'Spend 10 Toll: a shield of 20% max HP and +15% magic resist for 3 turns.', { el: 'holy', to: 'self', tags: ['Buff', 'Defensive', 'Song'], cd: 3, res: ['toll', 10], fx: [shieldPct(20), buff('muffled', 3, [{ stat: 'magicResist', type: 'percent', value: 15 }])] }),
  act('tolling-for-the-dead', 'Tolling for the Dead', 'Spend 20 Toll: 220% MAG holy damage; the foe is Feared.', { el: 'holy', to: 'enemy', tags: [...B], cd: 3, res: ['toll', 20], dmg: ['m', 2.2, 0.16], fx: [status('fear', 2)] }),
  act('quiet-after', 'The Quiet After', 'Spend 15 Toll: heal 15% of max HP and +5 HP regen for 3 turns.', { el: 'holy', to: 'self', tags: ['Heal', 'Song'], cd: 3, res: ['toll', 15], fx: [healPct(15), buff('quiet-after', 3, [{ stat: 'hpRegen', type: 'flat', value: 5 }])] }),
  act('bell-ward', 'Bell Ward', 'Spend 20 Toll: the party is shielded for 12% max HP and takes 10% less damage for 2 turns.', { el: 'holy', to: 'allAllies', tags: ['Buff', 'Song', 'Team', 'Defensive'], cd: 4, res: ['toll', 20], fx: [shieldPct(12, 'allAllies'), buff('bell-ward', 2, [{ stat: 'damageTaken', type: 'more', value: -10 }], 'allAllies')] }),
  spec('great-bell', 'The Great Bell', 'Spend 30 Toll: 280% MAG to every enemy, all Stunned for a turn.', { el: 'holy', to: 'allEnemies', tags: [...B, 'AoE'], cd: 4, res: ['toll', 30], dmg: ['m', 2.8, 0.2], fx: [status('stun', 1, { target: 'allEnemies' })] }),
  spec('counter-chime', 'Counter-Chime', 'Spend 25 Toll: 300% MAG; the foe is Silenced and Weakened.', { el: 'holy', to: 'enemy', tags: [...B], cd: 3, res: ['toll', 25], dmg: ['m', 3.0, 0.2], fx: [status('silence', 2), status('weaken', 2)] }),
  spec('hallowed-peal', 'Hallowed Peal', 'Spend 25 Toll: the party heals 18%, cleansing poison, and gains +10% damage.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Song', 'Team'], cd: 4, res: ['toll', 25], fx: [healPct(18, 'allAllies'), buff('peal', 3, [{ stat: 'damageBonus', type: 'flat', value: 10 }], 'allAllies'), { kind: 'removeStatus', status: 'poison', target: 'allAllies' }] }),
  ult('the-bell-that-ends-it', 'The Bell That Ends It', 'One toll, heard everywhere: 340% MAG to every enemy, all Stunned and Silenced.', { el: 'holy', to: 'allEnemies', tags: [...B, 'AoE'], dmg: ['m', 3.4, 0], fx: [status('stun', 1, { target: 'allEnemies' }), status('silence', 2, { target: 'allEnemies' })] }),
  ult('silencing-the-choir', 'Silencing the Choir', '320% MAG; every enemy is Silenced for 3 turns and the party shielded for 12%.', { el: 'holy', to: 'allEnemies', tags: [...B, 'AoE'], dmg: ['m', 3.2, 0], fx: [status('silence', 3, { target: 'allEnemies' }), shieldPct(12, 'allAllies')] }),
  ult('the-sunrise-bells', 'The Sunrise Bells', 'Every bell in the valley: the party heals 30%, gains +20% damage and Regen; Toll fills.', { el: 'holy', to: 'allAllies', tags: ['Heal', 'Song', 'Team'], fx: [healPct(30, 'allAllies'), buff('sunrise', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), status('regen', 3, { target: 'allAllies' }), gain('toll', 100)] }),
  ult('bellwardens-peal', 'The Bellwarden’s Peal', 'The great peal: 320% MAG to every enemy, the party heals 15% and gains +20% damage.', { el: 'holy', to: 'allEnemies', tags: [...B, 'AoE', 'Team'], dmg: ['m', 3.2, 0], fx: [healPct(15, 'allAllies'), buff('peal-final', 3, [{ stat: 'damageBonus', type: 'flat', value: 20 }], 'allAllies'), gain('toll', 100)] }),
];
const SK = BELLWARDEN_SKILLS;
export const BELLWARDEN_TREE = liteTree('bellwarden', SK, [
  { id: 'toll', name: 'The Toll', color: '#e8c868', desc: 'One note, struck cleanly. Everything else is commentary.', a: 'toll-the-bell', b: 'tolling-for-the-dead', stats: ['holyDamage', 'magicAttack', 'critChance', 'fai'], names: ['Bronze Clapper', 'Clear Strike', 'Long Ring', 'Steady Rope', 'Bright Toll', 'Dark Toll', 'Rope Burn', 'Deep Resonance', 'Toll Without End', 'Warden of the Toll'] },
  { id: 'tones', name: 'The Tones', color: '#a8c8e8', desc: 'High for the quick. Low for the strong.', a: 'low-tone', b: 'high-tone', stats: ['healingPower', 'speed', 'resourceGain', 'wis'], names: ['Low Note', 'High Note', 'Held Tone', 'Harmonic', 'Deep Tone', 'Bright Tone', 'Overtone', 'Clean Pitch', 'Perfect Pitch', 'Tonemaster'] },
  { id: 'alarm', name: 'The Alarm', color: '#d86a4a', desc: 'The bell that warns, and the bell that stops a song in its tracks.', a: 'clanging-alarm', b: 'cracked-chime', stats: ['statusChance', 'accuracy', 'speed', 'dex'], names: ['Loud Strike', 'Rough Edge', 'Warning Peal', 'Early Bell', 'Sour Note', 'Flat Chime', 'Alarm Bell', 'Fire Bell', 'The Town Wakes', 'Master of Alarms'], keyFlags: { flags: ['choirbreaker'], text: 'Your tones Silence singing enemies it hits: the Choir cannot sing over a bell.' } },
  { id: 'ward', name: 'The Bell Ward', color: '#7a9ac8', desc: 'The sound is a shield. It always was.', a: 'muffled-bell', b: 'bell-ward', stats: ['magicResist', 'maxHp', 'defense', 'vit'], names: ['Felt Wrap', 'Thick Tower', 'Stone Belfry', 'Quiet Vigil', 'Warded Tone', 'Held Sound', 'Safe Hour', 'Roof Over', 'Sound Within Walls', 'Warden of the Bell'] },
  { id: 'peal', name: 'The Peal', color: '#e8e8c8', desc: 'When the bells start, nobody asks why.', a: 'resonance', b: 'quiet-after', stats: ['magicAttack', 'hpRegen', 'cooldownReduction', 'int'], names: ['Rising Wave', 'Rippling Tone', 'Shaken Air', 'Still Afterward', 'Full Peal', 'Ringing Silence', 'Long Echo', 'Fading Note', 'The Last Echo', 'Master of the Peal'] },
]);
export const BELLWARDEN_SPECS = liteSpecs(SK, [
  { id: 'greatbell', name: 'Greatbell Ringer', color: '#e8c868', desc: 'One big one, and everyone remembers where they were.', skill: 'great-bell', ult: 'the-bell-that-ends-it', stats: ['holyDamage', 'magicAttack', 'maxHp'], names: ['Heavy Rope', 'Big Clapper', 'Bronze Voice', 'Tower Top', 'Wind Shake', 'Stone Hum', 'Bell Mouth', 'Greatbell Ringer Ascendant'] },
  { id: 'counter', name: 'Counter-Choir', color: '#d86a4a', desc: 'The Choir cannot sing over a bell.', skill: 'counter-chime', ult: 'silencing-the-choir', stats: ['statusChance', 'accuracy', 'magicAttack'], names: ['Dissonance', 'Flat Note', 'Cracked Voice', 'Silenced Hymn', 'Drowned Out', 'Counter Tone', 'Choir Breaker', 'Counter-Choir Ascendant'] },
  { id: 'peals', name: 'Dawn-Ringer', color: '#e8e8c8', desc: 'The bells for the morning, rung for those who got there.', skill: 'hallowed-peal', ult: 'the-sunrise-bells', stats: ['healingPower', 'resourceGain', 'hpRegen'], names: ['Sunrise Tone', 'Warm Peal', 'Early Rope', 'Gentle Ring', 'Morning Bell', 'Soft Toll', 'Long Dawn', 'Dawn-Ringer Ascendant'] },
]);

export const BELLWARDEN: GreaterClass = {
  def: {
    id: 'bellwarden', name: 'Bellwarden', tagline: 'Somebody has to tell the town what time it is.',
    description: 'A caster of bells and tones. Its sound magic shields the party, breaks the Choir’s songs, and rings through the Bellhouse.',
    playstyle: 'Tolling builds Toll. Spend it on tones for the party, alarms for the enemy and resonance for everyone. Greatbell Ringer stuns, Counter-Choir silences, Dawn-Ringer heals.',
    role: 'Caster / support', difficulty: 2, color: '#e8c868',
    mechanic: { name: 'Toll and Tones', description: 'Tolling builds Toll. Low and High Tones empower the party; alarms and chimes Silence and Confuse. Sound counters the Choir.' },
    trait: { ...traitOf('Ringing Ears', [['holyDamage', 10], ['damageBonus', 15]], '+10% holy damage, +15% damage and 40% more magic attack'), modifiers: [...traitOf('', [['holyDamage', 10], ['damageBonus', 15]], '').modifiers, { stat: 'magicAttack', type: 'more', value: 40 }] },
    resource: 'toll',
    baseStats: { str: 4, dex: 4, int: 5, vit: 6, wis: 6, luk: 3, fai: 6, cha: 5 },
    growth: { str: 0.5, dex: 0.5, int: 0.8, vit: 1.0, wis: 0.9, luk: 0.4, fai: 0.9, cha: 0.7 },
    weapons: ['mace', 'staff', 'instrument', 'warhammer'], armor: ['cloth', 'leather', 'mail'],
    startingSkills: ['toll-the-bell', 'low-tone'], ultimate: 'bellwardens-peal', defaultRow: 'back',
  },
  resource: { id: 'toll', name: 'Toll', max: 100, start: 10, decayPerTurn: 1, color: '#e8d878', description: 'Builds with strikes of the bell. Tones, alarms and peals spend it.', gains: { onHitDealt: 3 } },
  skills: SK, tree: BELLWARDEN_TREE, specs: BELLWARDEN_SPECS,
  mentor: mentorOf('mentor-bellwarden', 'Bell-Reeve Jonas Orrin', 'Rang the same bell every dawn for sixty years, and has opinions about the one in the next town.', 'Clapper Staff', ['#a88838', '#e8d8a8'], ['shield-bash', 'dirty-stab'], 'holy'),
  trial: { quote: 'Strike the bell. Now strike it so I do not notice. That is harder.', support: [{ enemyId: 'bandit-thug' }] },
  errand: { objective: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }), line: 'Win five battles on a rhythm: strike, rest, strike. A bell that never rests cracks.' },
  mentorNpc: { name: 'Bell-Reeve Jonas Orrin', race: 'human', portrait: 0, color: '#a88838', greeting: '“Hear that? Of course you do not. Stand still. There. That was the tower.”' },
  kit: kitOf('mace-t1', 'cloth-chest-t1', 'cloth-boots-t1'),
  art: emblem('diamond', '#7a5a1a', '#e8d878'),
  questline: ['solenne', 'old-crypt', ['bone-lord', 'restless-ghost'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['A Bell for the Morning', 'The Cracked Tower', 'The Crypt of Unrung Bells', 'The Choir at the Pass', 'The Last Toll'], ['“Solenne loves a morning bell. Go to her shrine and ring one.”', '“A tower’s bell has cracked. Find a new clapper, and a reason.”', '“A crypt holds bells that were never rung. Ring them, carefully.”', '“A Choir has taken the pass and will not stop singing. Settle it, with a bell.”', '“Every Bellwarden tolls once for themselves. Come, and see when.”'], '“For whom does it toll?”', '“For whoever hears it.”', '“For those who did not.”', '“For a long time, for me.”', 'Keeper of the Last Toll'],
  legendary: { id: 'the-unbroken-bell', name: 'The Unbroken Bell', rarity: 'legendary', baseId: 'mace-t4', level: 25, requirements: { classes: ['bellwarden'] }, modifiers: [{ stat: 'holyDamage', type: 'flat', value: 12 }, { stat: 'magicAttack', type: 'percent', value: 10 }], triggers: [trg('unbroken-bell', 'onHit', [gain('toll', 3)])], effectText: ['Gain 3 Toll on each hit.'], lore: 'It has been rung every morning for six hundred years and has not once been cracked.' },
};
