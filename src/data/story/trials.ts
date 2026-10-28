import type { ObjectiveDef, QuestDef } from '../../engine/quests/types';
import { CLASS_TRIALS, HYBRID_TRIAL_LEVEL, HYBRIDS } from '../multiclass';
import { MULTICLASS } from '../progression';
import { CLASSES } from '../classes';
import { GREATER_CLASSES } from '../classesGreater';
import { all, any, deed, kill, level, lines, not, stage, state, talk } from './helpers';
import { GOD_PRIESTS } from './gods';

/**
 * The class trainers' trial quests (a short errand in the class's spirit,
 * then the trial fight in the arena) and the hybrid quests (seek the
 * counsel of each mentor, then the hybrid trial). The arena only offers a
 * trial fight while its quest is at the trial stage, or once it is won.
 */

/** What each mentor asks first. Anyone can do these, whatever their class. */
const ERRANDS: Record<string, ObjectiveDef> = {
  ...Object.fromEntries(GREATER_CLASSES.flatMap((g) => (g.errand ? [[g.def.id, g.errand.objective]] : []))),
  warrior: deed('e', 'Win 5 battles', 5, { event: 'battleWon' }),
  mage: deed('e', 'Read a skillbook', 1, { event: 'bookRead' }),
  rogue: deed('e', 'Land 12 critical hits', 12, { event: 'crit' }),
  cleric: state('e', 'Earn the acknowledgement of Solenne or Hesha', any({ kind: 'favor', god: 'solenne', tier: 'acknowledged' }, { kind: 'favor', god: 'hesha', tier: 'acknowledged' })),
  ranger: kill('e', 'Hunt 10 beasts', 10, { enemyType: 'beast' }),
  necromancer: kill('e', 'Study death: destroy 8 undead', 8, { enemyType: 'undead' }),
  monk: deed('e', 'Rest twice (at camp, an inn or home)', 2, { event: 'rest' }),
  bard: state('e', 'Collect 2 lore pages', { kind: 'lore', count: 2 }),
};

const ERRAND_LINES: Record<string, string> = {
  ...Object.fromEntries(GREATER_CLASSES.flatMap((g) => (g.errand ? [[g.def.id, g.errand.line]] : []))),
  warrior: 'Win five fights, and come back standing.',
  mage: 'Read a skillbook. Any skillbook. You would be amazed how many people skip the reading.',
  rogue: 'Land a dozen critical hits. Clean ones. I will know.',
  cleric: 'Earn the notice of Solenne or Hesha. Faith first, then fists.',
  ranger: 'Hunt ten beasts. Respectfully.',
  necromancer: 'Put eight of the restless dead back down. You must understand death before you borrow it.',
  monk: 'Rest. Twice. Properly. That is the lesson.',
  bard: 'Find me two lore pages. A bard without stories is just loud.',
};

const className = (id: string): string => CLASSES.find((c) => c.id === id)?.name ?? id;

export const CLASS_QUESTS: QuestDef[] = CLASS_TRIALS.map((t): QuestDef => {
  const mentor = `mentor-${t.classId}`;
  return {
    id: `class-${t.classId}`,
    name: `Trial of the ${className(t.classId)}`,
    kind: 'class',
    level: MULTICLASS.secondaryLevel,
    giver: mentor,
    requires: all(level(MULTICLASS.secondaryLevel), not({ kind: 'class', classId: t.classId }), not({ kind: 'trialWon', encounter: t.encounter })),
    summary: `“${t.quote}” But first: ${ERRAND_LINES[t.classId] ?? 'prove yourself.'} Then come back, and face me in the arena.`,
    stages: [
      stage('errand', 'Do what your mentor asked, then report back at any arena.', [ERRANDS[t.classId] as ObjectiveDef], { turnIn: mentor, turnInText: '“Good. Now the real lesson. Meet me in the ring.”' }),
      stage('trial', `Win the trial against your mentor in any town’s arena.`, [state('t', 'Win the trial', { kind: 'trialWon', encounter: t.encounter })]),
    ],
    rewards: { xp: 0.3, gold: 5 },
    epilogue: `You may take up the ${className(t.classId)} class at any arena.`,
  };
});

export const HYBRID_QUESTS: QuestDef[] = HYBRIDS.map((h): QuestDef => {
  const mentors = h.classes.map((c) => `mentor-${c}`);
  const counsel = [...mentors.slice(1), ...(h.requires?.apostleOf ? [GOD_PRIESTS[h.requires.apostleOf] as string] : [])];
  return {
    id: `hybrid-${h.id}`,
    name: `The Way of the ${h.name}`,
    kind: 'hybrid',
    level: HYBRID_TRIAL_LEVEL,
    giver: mentors[0] as string,
    requires: all({ kind: 'hybridOpen', hybrid: h.id }, not({ kind: 'trialWon', encounter: h.trial })),
    summary: `“${h.description} You have walked both roads far enough. Seek the counsel of ${counsel.length > 1 ? 'the others who taught you' : 'your other teacher'}, and then we will test you together.”`,
    stages: [
      ...(counsel.length > 0 ? [stage('counsel', 'Seek the counsel of your other teachers.', counsel.map((npc, i) => talk(`c${i}`, `Speak with ${npc.startsWith('mentor-') ? 'your other mentor' : 'the priest'}`, npc, `d-hybrid-counsel`)))] : []),
      stage('trial', `Win the ${h.name} trial in any town’s arena.`, [state('t', `Win the Trial of the ${h.name}`, { kind: 'trialWon', encounter: h.trial })]),
    ],
    rewards: { xp: 0.3, gold: 8 },
    epilogue: `The ${h.name} tree opens to you at the arena’s trainers.`,
  };
});

export const TRIAL_DIALOGUES = [
  lines('d-hybrid-counsel', [
    '“Both roads at once. Most people can barely walk one.”',
    '“I will not tell you it is wise. I will tell you that I will be in the ring when you face the trial, and that I will not go easy on you. That is the best counsel I have.”',
  ]),
];
