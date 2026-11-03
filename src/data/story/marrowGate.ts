import type { DialogueDef, NpcDef } from '../../engine/quests/types';
import { choice, dialogue, flag, not, say, setFlag } from './helpers';
import { MARROW } from '../realm/marrow';

/** The way into Marrow: a ferrywoman in Mirewick, and one conversation with her. */
export const MARROW_NPCS: NpcDef[] = [
  {
    id: 'ferry-nell', name: 'Ferrywoman Nell', title: 'Keeper of the Fog Ferry', town: 'mirewick', place: 'people', race: 'human', portrait: 6, color: '#7a9a9a', schedule: [5, 22],
    greeting: '“Fog’s in. The ferry goes out when the fog goes thin, and the fog does not go thin. Are you here for the crossing, or the quiet?”',
    topics: [{ id: 'marrow', text: 'Ask about the ferry across the fog.', dialogue: 'd-marrow-ferry', cond: not(flag(MARROW.flag)) }],
  },
];

export const MARROW_DIALOGUES: DialogueDef[] = [
  dialogue('d-marrow-ferry', {
    start: say('ferry-nell', '“There is a town across the fog, called Marrow. It is not on the maps, and it is not on the tide tables. I have taken the ferry there four hundred times. Each time the passengers get off, and each time I see them again on the next crossing, not yet having left.”', {
      choices: [choice('“What happens to the town?”', 'what'), choice('“Take me across.”', 'cross')],
    }),
    what: say('ferry-nell', '“I think it drowns. I think it drowns every third night, and starts over. My mother ferried it before me. She said the clock in the tower had been stopped by someone who could not bear to stop it. Not a curse, she said. A mercy gone sour.”', {
      choices: [choice('“Take me across.”', 'cross'), choice('“Not today.”', undefined, undefined, { leave: true })],
    }),
    cross: say('ferry-nell', '“Then the ferry is yours whenever you are in Mirewick. Take a notebook. Nothing you carry over will keep, except what you have learned. I have always thought that was the cruellest part, and the only kind one.”', {
      actions: [setFlag(MARROW.flag), { kind: 'toast', text: 'The fog ferry at Mirewick now runs to Marrow.' }],
    }),
  }),
];
