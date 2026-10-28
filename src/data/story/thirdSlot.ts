import type { DialogueDef, QuestDef } from '../../engine/quests/types';
import { all, check, choice, dialogue, level, questDone, say, stage, stat, talk } from './helpers';

/** The base game's way to a third class: High Lector Amara's late-story errand (NG+2 still opens it too). */
export const THIRD_SLOT_QUESTS: QuestDef[] = [
  {
    id: 'side-third-road', name: 'The Third Road', kind: 'side', level: 45, zone: 'meadowlands', giver: 'lector-amara',
    summary: '“You have walked two roads to their ends, and the Black Tide has not drowned you. Come and see me. There is a third, and it is not for everyone.”',
    requires: all(level(45), questDone('main-6')),
    stages: [stage('a', 'Ask High Lector Amara about the third road.', [talk('t', 'Speak with High Lector Amara', 'lector-amara', 'd-third-road')])],
    rewards: { xp: 0.5, gold: 40 },
  },
];

export const THIRD_SLOT_DIALOGUES: DialogueDef[] = [
  dialogue('d-third-road', {
    start: say('lector-amara', '“A hero may carry two callings. A very few carry three, and are not torn in half by it. Tell me why you believe you are one of them.”', {
      choices: [
        check(stat('wis', 30), '[WIS 30] “Because I know which of them to put down, and when.”', 'wise', []),
        check(stat('cha', 30), '[CHA 30] “Because they all answer when I call.”', 'bold', []),
        choice('“Because I have already survived the tide with both.”', 'plain'),
      ],
    }),
    wise: say('lector-amara', '“Then you will not be torn. I can see it. Take the road.”', { next: 'grant' }),
    bold: say('lector-amara', '“Hm. Confidence is a kind of discipline. Take the road, and take care.”', { next: 'grant' }),
    plain: say('lector-amara', '“That is enough. It is, in fact, what the first wearers said. Take the road.”', { next: 'grant' }),
    grant: say('lector-amara', '“A third calling is yours to take up, from any arena. Choose it as carefully as the others.”', { actions: [{ kind: 'unlockClassSlot' }, { kind: 'title', title: 'Three Roads' }] }),
  }),
];
