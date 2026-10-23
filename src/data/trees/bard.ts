import type { SkillDef } from '../../engine/skills/types';
import { buildTree, flat, more, pct, tag, targetHasAny } from './builder';

export const BARD_SKILLS: SkillDef[] = [
  {
    id: 'battle-hymn', name: 'Battle Hymn', description: 'A stirring verse: 130% MAG arcane damage and +10% party damage for 2 turns. Builds Verse.',
    source: 'class', tags: ['Spell', 'Song', 'Arcane'], element: 'arcane', targeting: 'enemy', maxRank: 5,
    cost: { mp: 8 }, cooldown: 2,
    damage: { stat: 'magicAttack', multiplier: 1.3, perRank: 0.1 },
    effects: [{ kind: 'buff', id: 'battle-hymn', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 10 }], target: 'allAllies' }],
    generates: { resource: 'verse', amount: 15 },
  },
  {
    id: 'heroic-ballad', name: 'Heroic Ballad', description: 'The party deals +25% damage for 2 turns.',
    source: 'class', tags: ['Song', 'Buff', 'AoE'], element: 'arcane', targeting: 'allAllies', maxRank: 5,
    cost: { mp: 12 }, cooldown: 4,
    effects: [{ kind: 'buff', id: 'heroic-ballad', duration: 2, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 25 }] }],
    generates: { resource: 'verse', amount: 15 },
  },
  {
    id: 'ballad-of-warding', name: 'Ballad of Warding', description: 'Begin the Ballad of Warding: allies gain defense and magic resist.',
    source: 'class', tags: ['Song', 'Buff', 'AoE'], element: 'arcane', targeting: 'allAllies', maxRank: 1,
    cost: { mp: 8 }, cooldown: 0,
    effects: [{ kind: 'startSong', song: 'ward' }],
  },
  {
    id: 'soothing-melody', name: 'Soothing Melody', description: 'Heal every ally for 75% MAG.',
    source: 'class', tags: ['Spell', 'Song', 'Heal', 'AoE'], element: 'arcane', targeting: 'allAllies', maxRank: 5,
    cost: { mp: 14 }, cooldown: 2,
    heal: { stat: 'magicAttack', multiplier: 0.75, perRank: 0.07 },
    generates: { resource: 'verse', amount: 10 },
  },
  {
    id: 'cacophony', name: 'Cacophony', description: 'A wall of noise: 85% MAG to every enemy, Weaken, and a chance to Silence.',
    source: 'class', tags: ['Spell', 'Song', 'Arcane', 'AoE', 'Debuff'], element: 'arcane', targeting: 'allEnemies', maxRank: 5,
    cost: { mp: 16 }, cooldown: 3,
    damage: { stat: 'magicAttack', multiplier: 0.85, perRank: 0.08 },
    effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2 }, { kind: 'applyStatus', status: 'silence', duration: 1, chance: 30 }],
  },
  {
    id: 'jig-of-swiftness', name: 'Jig of Swiftness', description: 'Begin the Jig of Swiftness: allies gain 10% speed.',
    source: 'class', tags: ['Song', 'Buff', 'AoE'], element: 'arcane', targeting: 'allAllies', maxRank: 1,
    cost: { mp: 8 }, cooldown: 0,
    effects: [{ kind: 'startSong', song: 'swiftness' }],
  },
  {
    id: 'dazzling-display', name: 'Dazzling Display', description: 'A blinding show: three bursts of 75% MAG at random enemies, each may Blind.',
    source: 'class', tags: ['Spell', 'Arcane', 'AoE'], element: 'arcane', targeting: 'randomEnemies', maxRank: 5,
    cost: { mp: 12 }, cooldown: 2,
    damage: { stat: 'magicAttack', multiplier: 0.75, perRank: 0.07, hits: 3 },
    effects: [{ kind: 'applyStatus', status: 'blind', duration: 2, chance: 30 }],
  },
];

export const BARD_TREE = buildTree('bard', [
  {
    id: 'valor', name: 'Valor', color: '#e8572e', description: 'Songs of courage that turn allies into heroes.',
    a: { skill: 'battle-hymn' },
    aMods: [
      { name: 'War Song', patch: { description: 'Battle Hymn deals 30% more damage.', powerMult: 1.3 } },
      { name: 'Anthem of Blades', patch: { description: 'Battle Hymn hits every enemy for 60% of its damage.', targeting: 'allEnemies', powerMult: 0.6, addTags: ['AoE'] } },
    ],
    b: { skill: 'heroic-ballad' },
    bMods: [
      { name: 'Epic Tale', patch: { description: 'Heroic Ballad has 1 less cooldown.', cooldownDelta: -1 } },
      { name: 'Legend', patch: { description: 'Heroic Ballad also grants +15% crit chance.', addEffects: [{ kind: 'buff', id: 'legend', duration: 2, modifiers: [{ stat: 'critChance', type: 'flat', value: 15 }] }] } },
    ],
    minors: [
      { name: 'Rousing', mods: [flat('damageBonus', 2)] },
      { name: 'Powerful Voice', mods: [pct('magicAttack', 3)] },
      { name: 'Lyricist', mods: [flat('int', 2)] },
      { name: 'Perfect Pitch', mods: [flat('critChance', 1)] },
    ],
    notables: [
      { name: 'Inspiring Presence', mods: [flat('damageBonus', 10)] },
      { name: 'Crescendo Master', text: 'Song skills grant 10 Verse.', triggers: [{ id: 'bard-crescendo-master', trigger: 'onSkillCast', condition: tag('Song'), effects: [{ kind: 'gainResource', resource: 'verse', amount: 10 }] }] },
    ],
    choice: [
      { name: 'Encore', flags: ['twinSongs'] },
      { name: 'Virtuoso', mods: [flat('resourceGain', 25)] },
    ],
    keystone: { name: 'Showstopper', text: 'Keystone: +30% damage, but -20% max MP.', mods: [flat('damageBonus', 30), pct('maxMp', -20)] },
    capstone: { name: 'Legendary Performer', text: 'The Song of Valor starts playing at the start of every battle.', mods: [flat('damageBonus', 10)], triggers: [{ id: 'bard-legendary-performer', trigger: 'onCombatStart', effects: [{ kind: 'startSong', song: 'valor' }] }] },
  },
  {
    id: 'ward', name: 'Ward', color: '#9fd8ff', description: 'Protective songs and soothing melodies.',
    a: { skill: 'ballad-of-warding' },
    aMods: [
      { name: 'Resonant Ward', patch: { description: 'Starting the Ballad also shields every ally for 10% of max HP.', addEffects: [{ kind: 'shield', percentMaxHp: 10, target: 'allAllies' }] } },
      { name: 'Stalwart Chorus', patch: { description: 'Starting the Ballad also grants +20% status resist for 3 turns.', addEffects: [{ kind: 'buff', id: 'stalwart-chorus', duration: 3, modifiers: [{ stat: 'statusResist', type: 'flat', value: 20 }], target: 'allAllies' }] } },
    ],
    b: { skill: 'soothing-melody' },
    bMods: [
      { name: 'Lullaby of Rest', patch: { description: 'Soothing Melody also grants Regen.', addEffects: [{ kind: 'applyStatus', status: 'regen', duration: 3 }] } },
      { name: 'Cleansing Chord', patch: { description: 'Soothing Melody removes Poison and Bleed.', addEffects: [{ kind: 'removeStatus', status: 'poison' }, { kind: 'removeStatus', status: 'bleed' }] } },
    ],
    minors: [
      { name: 'Steady Rhythm', mods: [pct('defense', 4)] },
      { name: 'Clear Tone', mods: [pct('magicResist', 4)] },
      { name: 'Healing Notes', mods: [flat('healingPower', 5)] },
      { name: 'Stamina', mods: [flat('vit', 2)] },
    ],
    notables: [
      { name: 'Warding Chords', text: 'Every ally begins battle shielded for 12% of max HP.', triggers: [{ id: 'bard-warding-chords', trigger: 'onCombatStart', effects: [{ kind: 'shield', percentMaxHp: 12, target: 'allAllies' }] }] },
      { name: 'Second Verse', text: 'The first time you fall below 30% HP each battle, heal 30%.', triggers: [{ id: 'bard-second-verse', trigger: 'onLowHp', limitPerCombat: 1, effects: [{ kind: 'heal', percentMaxHp: 30, target: 'self' }] }] },
    ],
    choice: [
      { name: 'Hearthsong', mods: [flat('healingPower', 20)] },
      { name: 'Bulwark Rhythm', mods: [more('damageTaken', -10)] },
    ],
    keystone: { name: 'Pacifist’s Song', text: 'Keystone: +40% healing power, but -25% damage.', mods: [flat('healingPower', 40), flat('damageBonus', -25)] },
    capstone: { name: 'Song of Sanctuary', text: 'At the start of your turn, 50% chance to shield every ally for 5% of max HP.', triggers: [{ id: 'bard-sanctuary', trigger: 'onTurnStart', chance: 50, effects: [{ kind: 'shield', percentMaxHp: 5, target: 'allAllies' }] }] },
  },
  {
    id: 'discord', name: 'Discord', color: '#c45bb0', description: 'Music as a weapon: dissonance, fear and madness.',
    a: { skill: 'discordant-note', starting: true },
    aMods: [
      { name: 'Shattering Note', patch: { description: 'Discordant Note makes the target Vulnerable.', addEffects: [{ kind: 'applyStatus', status: 'vulnerable', duration: 2 }] } },
      { name: 'Dissonance', patch: { description: 'Discordant Note may Fear.', addEffects: [{ kind: 'applyStatus', status: 'fear', duration: 1, chance: 30 }] } },
    ],
    b: { skill: 'cacophony' },
    bMods: [
      { name: 'Deafening', patch: { description: 'Cacophony deals 30% more damage.', powerMult: 1.3 } },
      { name: 'Mind Shatter', patch: { description: 'Cacophony may Charm enemies into attacking each other.', addEffects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 20 }] } },
    ],
    minors: [
      { name: 'Harsh Notes', mods: [flat('arcaneDamage', 4)] },
      { name: 'Unnerving', mods: [flat('statusChance', 3)] },
      { name: 'Clever', mods: [flat('int', 2)] },
      { name: 'Projection', mods: [pct('magicAttack', 3)] },
    ],
    notables: [
      { name: 'Jarring Rhythm', mods: [flat('damageBonus', 20, targetHasAny('silence', 'fear', 'charm'))], text: '+20% damage against Silenced, Feared or Charmed enemies.' },
      { name: 'Feedback', text: '25% chance to blast attackers for 40% MAG.', triggers: [{ id: 'bard-feedback', trigger: 'onDamageTaken', chance: 25, effects: [{ kind: 'damage', element: 'arcane', scaling: { stat: 'magicAttack', ratio: 0.4 }, target: 'target' }] }] },
    ],
    choice: [
      { name: 'Hex Song', text: '15% chance on hit to Curse.', triggers: [{ id: 'bard-hex-song', trigger: 'onHit', chance: 15, effects: [{ kind: 'applyStatus', status: 'curse', duration: 2 }] }] },
      { name: 'Nerve Pinch', text: '15% chance on hit to Slow.', triggers: [{ id: 'bard-nerve-pinch', trigger: 'onHit', chance: 15, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2 }] }] },
    ],
    keystone: { name: 'Atonal', text: 'Keystone: +30% status chance, but -15 accuracy.', mods: [flat('statusChance', 30), flat('accuracy', -15)] },
    capstone: { name: 'Maestro of Madness', text: 'Skills have a 15% chance to Charm the target.', triggers: [{ id: 'bard-maestro', trigger: 'onSkillCast', chance: 15, effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, target: 'target' }] }] },
  },
  {
    id: 'showmanship', name: 'Showmanship', color: '#ffd84a', description: 'Luck, flair and a show they will never forget.',
    a: { skill: 'jig-of-swiftness' },
    aMods: [
      { name: 'Quickstep', patch: { description: 'Starting the Jig also Hastes you.', addEffects: [{ kind: 'applyStatus', status: 'haste', duration: 2, target: 'self' }] } },
      { name: 'Hearthside Lullaby', patch: { description: 'Plays the Hearthside Lullaby (healing) instead.', replaceEffects: [{ kind: 'startSong', song: 'lullaby' }] } },
    ],
    b: { skill: 'dazzling-display' },
    bMods: [
      { name: 'Grand Display', patch: { description: 'Dazzling Display fires 2 more bursts at 80% each.', hitsAdd: 2, powerMult: 0.8 } },
      { name: 'Blinding Light', patch: { description: 'Dazzling Display always Blinds.', replaceEffects: [{ kind: 'applyStatus', status: 'blind', duration: 2 }] } },
    ],
    minors: [
      { name: 'Lucky', mods: [flat('luk', 2)] },
      { name: 'Tips', mods: [flat('goldFind', 5)] },
      { name: 'Light Feet', mods: [flat('speed', 1)] },
      { name: 'Flourish', mods: [flat('critDamage', 5)] },
    ],
    notables: [
      { name: 'Crowd Pleaser', mods: [flat('goldFind', 25), flat('magicFind', 10)] },
      { name: 'Standing Ovation', text: 'Kills grant 25 Verse.', triggers: [{ id: 'bard-ovation', trigger: 'onKill', effects: [{ kind: 'gainResource', resource: 'verse', amount: 25 }] }] },
    ],
    choice: [
      { name: 'Lucky Break', mods: [flat('critChance', 6)] },
      { name: 'Showboat', mods: [flat('critDamage', 25)] },
    ],
    keystone: { name: 'Fortune’s Fool', text: 'Keystone: +25 LUK, but -20% defense.', mods: [flat('luk', 25), pct('defense', -20)] },
    capstone: { name: 'Star of the Show', flags: ['stealthOnCombatStart', 'firstStrike'] },
  },
]);
