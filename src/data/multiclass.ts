import { GREATER_CLASSES } from './classesGreater';
import type { ClassTrialDef, HybridDef } from '../engine/character/multiclassTypes';
import type { EncounterDef, EnemyDef } from '../engine/combat/types';
import type { SkillDef } from '../engine/skills/types';

const mentorSkill = (s: Omit<SkillDef, 'source' | 'maxRank'>): SkillDef => ({ maxRank: 5, ...s, source: 'enemy' });

/** One signature move per class mentor. */
export const MENTOR_SKILLS: SkillDef[] = [
  mentorSkill({ id: 'mentor-riposte', name: 'Master’s Riposte', description: 'A perfect counter-cut that Weakens.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 2, stagger: 1.5, damage: { stat: 'physicalAttack', multiplier: 1.3, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'weaken', duration: 2, chance: 50 }] }),
  mentorSkill({ id: 'mentor-meteor', name: 'Lesson in Fire', description: 'A falling star of flame on the whole party.', tags: ['Spell', 'Fire', 'AoE'], element: 'fire', targeting: 'allEnemies', cost: {}, cooldown: 3, damage: { stat: 'magicAttack', multiplier: 0.9, perRank: 0.1 }, effects: [{ kind: 'applyStatus', status: 'burn', duration: 2, chance: 40 }] }),
  mentorSkill({ id: 'mentor-vanish', name: 'Now You See Me', description: 'Vanishes and strikes from the shadows.', tags: ['Attack', 'Melee', 'Shadow'], element: 'shadow', targeting: 'enemy', cost: {}, cooldown: 3, alwaysCrit: true, damage: { stat: 'physicalAttack', multiplier: 1.1, perRank: 0.1 } }),
  mentorSkill({ id: 'mentor-judgement', name: 'Final Judgement', description: 'Holy light that heals its caster’s allies and burns their foes.', tags: ['Spell', 'Holy', 'Heal'], element: 'holy', targeting: 'enemy', cost: {}, cooldown: 2, damage: { stat: 'magicAttack', multiplier: 1.2, perRank: 0.1 }, effects: [{ kind: 'heal', percentMaxHp: 10, target: 'allAllies' }] }),
  mentorSkill({ id: 'mentor-hail', name: 'Hail of Arrows', description: 'Arrows rain on the whole party.', tags: ['Attack', 'Ranged', 'Projectile', 'AoE'], element: 'physical', targeting: 'allEnemies', cost: {}, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.8, perRank: 0.08 } }),
  mentorSkill({ id: 'mentor-grasp', name: 'Grasp of the Grave', description: 'Bony hands drag at the party, Slowing them.', tags: ['Spell', 'Shadow', 'AoE', 'Curse'], element: 'shadow', targeting: 'allEnemies', cost: {}, cooldown: 3, damage: { stat: 'magicAttack', multiplier: 0.8, perRank: 0.08 }, effects: [{ kind: 'applyStatus', status: 'slow', duration: 2, chance: 50 }] }),
  mentorSkill({ id: 'mentor-hundred-fists', name: 'Hundred Fists', description: 'Five blurring strikes.', tags: ['Attack', 'Melee', 'Physical'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 3, damage: { stat: 'physicalAttack', multiplier: 0.4, perRank: 0.04, hits: 5 } }),
  mentorSkill({ id: 'mentor-discord', name: 'Discordant Note', description: 'A note so wrong it Charms.', tags: ['Spell', 'Song', 'Arcane'], element: 'arcane', targeting: 'enemy', cost: {}, cooldown: 4, damage: { stat: 'magicAttack', multiplier: 0.9, perRank: 0.08 }, effects: [{ kind: 'applyStatus', status: 'charm', duration: 1, chance: 35 }] }),
];

const mentor = (e: Omit<EnemyDef, 'family' | 'types' | 'level' | 'tier' | 'ai' | 'xp' | 'lootTable'> & Partial<Pick<EnemyDef, 'ai'>>): EnemyDef => ({
  family: 'humanoid',
  types: ['humanoid', 'mentor'],
  level: 15,
  tier: 'miniboss',
  ai: 'aggressive',
  xp: 40,
  lootTable: 'elite-enemy',
  ...e,
});

/** The class trainers. Beat one in a trial to take up their class. */
const BASE_MENTORS: EnemyDef[] = [
  mentor({ id: 'mentor-warrior', name: 'Sword-Master Bram', row: 'front', stats: { hp: 90, attack: 20, magic: 0, defense: 11, magicResist: 6, speed: 12, critChance: 10 }, skills: [{ id: 'mentor-riposte', weight: 2 }, { id: 'shield-bash' }, { id: 'war-cry' }], basicAttack: { element: 'physical', ranged: false, name: 'Longsword' }, description: 'Forty years a soldier, still never late for drill.', palette: { main: '#8a96a8', accent: '#c0392b' } }),
  mentor({ id: 'mentor-mage', name: 'Archmage Velis', row: 'back', ai: 'caster', stats: { hp: 55, attack: 5, magic: 19, defense: 4, magicResist: 12, speed: 10 }, resists: { fire: 30, ice: 30 }, skills: [{ id: 'mentor-meteor', weight: 2 }, { id: 'dazzle' }, { id: 'goblin-hex' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Arcane Bolt' }, description: 'Tests students by setting them on fire. Gently.', palette: { main: '#3a5ab0', accent: '#ffd84a' } }),
  mentor({ id: 'mentor-rogue', name: 'Nell the Knife', row: 'front', stats: { hp: 60, attack: 16, magic: 0, defense: 5, magicResist: 5, speed: 16, dodge: 15, critChance: 15 }, skills: [{ id: 'mentor-vanish', weight: 2 }, { id: 'dirty-stab' }], basicAttack: { element: 'physical', ranged: false, name: 'Dagger' }, description: 'You will not see the lesson coming. That is the lesson.', palette: { main: '#2a2a34', accent: '#9a3ab0' } }),
  mentor({ id: 'mentor-cleric', name: 'Mother Aurelie', row: 'back', ai: 'healer', stats: { hp: 78, attack: 8, magic: 19, defense: 8, magicResist: 12, speed: 11 }, resists: { holy: 50, shadow: -20 }, skills: [{ id: 'mentor-judgement', weight: 2 }, { id: 'mend-ally' }], basicAttack: { element: 'holy', ranged: true, magic: true, name: 'Smite' }, description: 'Kind, patient, and absolutely merciless with a mace.', palette: { main: '#f0e8d0', accent: '#ffd54a' } }),
  mentor({ id: 'mentor-ranger', name: 'Warden Sylas', row: 'back', stats: { hp: 62, attack: 17, magic: 0, defense: 6, magicResist: 6, speed: 13, critChance: 12 }, skills: [{ id: 'mentor-hail', weight: 2 }, { id: 'pinning-shot' }], basicAttack: { element: 'physical', ranged: true, name: 'Longbow' }, description: 'Has tracked the Whisperwood wolves for twenty winters.', palette: { main: '#3a6a3a', accent: '#c8a050' } }),
  mentor({ id: 'mentor-necromancer', name: 'The Pale Tutor', row: 'back', ai: 'summoner', stats: { hp: 66, attack: 5, magic: 21, defense: 5, magicResist: 10, speed: 11 }, resists: { shadow: 40, holy: -25 }, skills: [{ id: 'mentor-grasp', weight: 2 }, { id: 'dark-pact' }, { id: 'grave-chill' }], basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Death Bolt' }, description: 'Nobody remembers their name. They prefer it that way.', palette: { main: '#4a3a5a', accent: '#7aff9a' } }),
  mentor({ id: 'mentor-monk', name: 'Master Ren', row: 'front', stats: { hp: 72, attack: 16, magic: 0, defense: 7, magicResist: 8, speed: 15, dodge: 12 }, skills: [{ id: 'mentor-hundred-fists', weight: 2 }, { id: 'mentor-riposte' }], basicAttack: { element: 'physical', ranged: false, name: 'Palm' }, description: 'Has not lost a sparring match in thirty years, or spoken in ten.', palette: { main: '#c86a2a', accent: '#f0e8d0' } }),
  mentor({ id: 'mentor-bard', name: 'Lyra Silvertongue', row: 'back', ai: 'caster', stats: { hp: 68, attack: 8, magic: 19, defense: 6, magicResist: 9, speed: 13 }, skills: [{ id: 'mentor-discord', weight: 2 }, { id: 'pack-howl' }], basicAttack: { element: 'arcane', ranged: true, magic: true, name: 'Lute Chord' }, description: 'Every insult she sings is technically a compliment.', palette: { main: '#b0306a', accent: '#ffd84a' } }),
];

/** Trials to earn a second (or third) class. */
const BASE_CLASS_TRIALS: ClassTrialDef[] = [
  { classId: 'warrior', encounter: 'trial-warrior', quote: 'Hold the line against me for one fight. Just one.' },
  { classId: 'mage', encounter: 'trial-mage', quote: 'Magic is not a gift. It is homework. Show me yours.' },
  { classId: 'rogue', encounter: 'trial-rogue', quote: 'Find me first. Then we talk.' },
  { classId: 'cleric', encounter: 'trial-cleric', quote: 'Faith is tested in pain. Let us test it.' },
  { classId: 'ranger', encounter: 'trial-ranger', quote: 'The wild does not wait for you to be ready.' },
  { classId: 'necromancer', encounter: 'trial-necromancer', quote: 'Death is a teacher. I am merely its assistant.' },
  { classId: 'monk', encounter: 'trial-monk', quote: '…' },
  { classId: 'bard', encounter: 'trial-bard', quote: 'Keep up with the rhythm, darling, or get left behind.' },
];

export const CLASS_TRIALS: ClassTrialDef[] = [...BASE_CLASS_TRIALS, ...GREATER_CLASSES.flatMap((g) => (g.trial ? [{ classId: g.def.id, encounter: `trial-${g.def.id}`, quote: g.trial.quote }] : []))];
export const MENTORS: EnemyDef[] = [...BASE_MENTORS, ...GREATER_CLASSES.flatMap((g) => (g.mentor ? [g.mentor] : []))];


/** Twelve hybrid prestige classes from class pairs, and the Sun Knight (Paladin + Apostle of Solenne). */
export const HYBRIDS: HybridDef[] = [
  { id: 'spellblade', name: 'Spellblade', classes: ['warrior', 'mage'], trial: 'trial-spellblade', description: 'Steel and sorcery in one edge.' },
  { id: 'warpriest', name: 'Warpriest', classes: ['warrior', 'cleric'], trial: 'trial-warpriest', description: 'Prayer on the lips, a mace in the fist.' },
  { id: 'deathknight', name: 'Deathknight', classes: ['warrior', 'necromancer'], trial: 'trial-deathknight', description: 'A fallen champion who commands the grave.' },
  { id: 'beastlord', name: 'Beastlord', classes: ['warrior', 'ranger'], trial: 'trial-beastlord', description: 'Leads a pack of spirit beasts into the fray.' },
  { id: 'templar-ascetic', name: 'Templar Ascetic', classes: ['cleric', 'monk'], trial: 'trial-templar-ascetic', description: 'The body a temple, the fist a prayer.' },
  { id: 'stormfist', name: 'Stormfist', classes: ['monk', 'mage'], trial: 'trial-stormfist', description: 'A monk who caught lightning and never let go.' },
  { id: 'shadow-reaper', name: 'Shadow Reaper', classes: ['rogue', 'necromancer'], trial: 'trial-shadow-reaper', description: 'An assassin who reaps souls for the grave.' },
  { id: 'spellthief', name: 'Spellthief', classes: ['rogue', 'mage'], trial: 'trial-spellthief', description: 'Steals mana, gold and the occasional spell.' },
  { id: 'blade-dancer', name: 'Blade Dancer', classes: ['rogue', 'bard'], trial: 'trial-blade-dancer', description: 'Every fight a performance, every step a cut.' },
  { id: 'wildsinger', name: 'Wildsinger', classes: ['ranger', 'bard'], trial: 'trial-wildsinger', description: 'Sings the forest awake and the pack to the hunt.' },
  { id: 'arcane-archer', name: 'Arcane Archer', classes: ['ranger', 'mage'], trial: 'trial-arcane-archer', description: 'Every arrow a spell.' },
  { id: 'plague-doctor', name: 'Plague Doctor', classes: ['cleric', 'necromancer'], trial: 'trial-plague-doctor', description: 'Cures and curses from the same bag.' },
  { id: 'sun-knight', name: 'Sun Knight', classes: ['warrior'], requires: { specialization: 'paladin', apostleOf: 'solenne' }, trial: 'trial-sun-knight', description: 'A Paladin sworn as Solenne’s Apostle: the sun with a sword.' },
];

const trialSupport: Record<string, EncounterDef['enemies']> = {
  warrior: [{ enemyId: 'bandit-thug' }],
  mage: [{ enemyId: 'will-o-wisp', row: 'back' }],
  rogue: [{ enemyId: 'goblin-cutthroat' }],
  cleric: [{ enemyId: 'skeleton-soldier' }],
  ranger: [{ enemyId: 'dire-wolf' }],
  necromancer: [{ enemyId: 'skeleton-soldier' }],
  monk: [],
  bard: [{ enemyId: 'bandit-thug' }],
  ...Object.fromEntries(GREATER_CLASSES.flatMap((g) => (g.trial ? [[g.def.id, g.trial.support]] : []))),
};

const mentorOf = (classId: string): string => `mentor-${classId}`;

/** Hybrid trials are fixed at level 36: a hero who reaches both classes at 25 around level 35 can try early or come back stronger. */
export const HYBRID_TRIAL_LEVEL = 36;

/** Extra HP and damage (percent) for the class trials' foes: heroes carry class traits since Phase 16, and a trial should still be a test. */
const CLASS_TRIAL_THREAT = 60;

/** Class trials (level 15: mentor plus a helper) and hybrid trials (both mentors and their helpers at level 36). */
export const TRIAL_ENCOUNTERS: EncounterDef[] = [
  ...CLASS_TRIALS.map((t): EncounterDef => {
    const name = MENTORS.find((m) => m.id === mentorOf(t.classId))?.name ?? t.classId;
    return { id: t.encounter, name: `Trial: ${name}`, description: t.quote, level: 15, canFlee: true, threat: CLASS_TRIAL_THREAT, enemies: [{ enemyId: mentorOf(t.classId) }, ...(trialSupport[t.classId] ?? []).map((e) => ({ ...e, level: 15 }))] };
  }),
  ...HYBRIDS.map((h): EncounterDef => ({
    id: h.trial,
    name: `Trial of the ${h.name}`,
    description: `${h.classes.length > 1 ? 'Both of your mentors at once' : 'Your mentor and the heralds of the sun'}. Prove you can be ${h.name === 'Arcane Archer' ? 'an' : 'a'} ${h.name}.`,
    level: HYBRID_TRIAL_LEVEL,
    canFlee: true,
    // The mentors, each with their class trial's helper; an apostle hybrid also faces its god's heralds.
    enemies: [
      ...h.classes.flatMap((c) => [{ enemyId: mentorOf(c) }, ...(trialSupport[c] ?? [])]),
      ...(h.requires?.apostleOf ? [{ enemyId: `punisher-${h.requires.apostleOf}` }, { enemyId: `punisher-${h.requires.apostleOf}` }] : []),
    ].map((e) => ({ ...e, level: HYBRID_TRIAL_LEVEL })),
  })),
];
