import type { DialogueDef, NpcDef } from '../../engine/quests/types';
import { VEX_PRANK_ENDING } from '../pilgrimage';
import { choice, dialogue, say, leave } from './helpers';

/** Vex's prank ending (Innovation Pack, item 34): a peddler in Brightwater with a chest to sell for one coin. */
export const FATES_NPCS: NpcDef[] = [
  { id: 'peddler-vex', name: 'A Hooded Peddler', title: 'Seller of Chests', town: 'brightwater', place: 'people', race: 'human', portrait: 7, color: '#b04ab8', greeting: '“Psst. You. Do you want to buy a chest? Ancient. Glowing. Absolutely not cursed. One coin.”',
    topics: [{ id: 'the-chest', text: 'About that chest…', dialogue: 'd-vex-chest' }] },
];

export const FATES_DIALOGUES: DialogueDef[] = [
  dialogue('d-vex-chest', {
    start: say('peddler-vex', '“One coin. It is the best deal in Vael. Do not look at my face, look at the chest.”', {
      choices: [
        choice('Buy the chest.', undefined, [{ kind: 'gold', amount: -1 }, { kind: 'ending', ending: 'vex-prank' }]),
        leave('Walk away.'),
      ],
    }),
  }),
];

export const FATES_ENDINGS = [VEX_PRANK_ENDING];
