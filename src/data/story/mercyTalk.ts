import type { DialogueDef, NpcDef } from '../../engine/quests/types';
import { choice, dialogue, favor, gold, say, setFlag } from './helpers';

/** People who have heard what you do with a beaten foe (Hesha's Mercy). Each shows up as an extra topic once you have shown enough mercy. */
const mercy = (min: number) => ({ kind: 'counter' as const, flag: 'mercy', min });

export const MERCY_TOPICS: Record<string, NonNullable<NpcDef['topics']>> = {
  'captain-reyna': [{ id: 'mercy-reyna', text: 'About the road: they say I spare things.', dialogue: 'd-mercy-reyna', cond: mercy(3), once: true }],
  marta: [{ id: 'mercy-marta', text: 'Ask if the rumors about you reached the Goose.', dialogue: 'd-mercy-marta', cond: mercy(5), once: true }],
  'warden-ysra': [{ id: 'mercy-ysra', text: 'Ask the Warden about the wood’s opinion of you.', dialogue: 'd-mercy-ysra', cond: mercy(8), once: true }],
  'marshal-dara': [{ id: 'mercy-dara', text: 'Tell her about the raider you let go.', dialogue: 'd-mercy-dara', cond: mercy(10), once: true }],
  'harbormaster-quill': [{ id: 'mercy-quill', text: 'Ask what the sailors are saying.', dialogue: 'd-mercy-quill', cond: mercy(12), once: true }],
};

export const MERCY_DIALOGUES: DialogueDef[] = [
  dialogue('d-mercy-reyna', {
    start: say('captain-reyna', '“Three of my watch have told me they saw you drop a sword when you could have used it. I asked them to stop telling me. They did not.”', {
      choices: [choice('“It is not much of a policy. It is a habit.”', 'habit'), choice('“Does it bother you?”', 'bother')],
    }),
    habit: say('captain-reyna', '“A habit, then. A good one. Here. For the watch’s respect, and Hesha’s, since I hear she approves.”', { actions: [gold(60), favor('hesha', 10), setFlag('reyna-mercy')] }),
    bother: say('captain-reyna', '“Only that I would not have the nerve. Keep doing it. Someone should.”', { actions: [favor('hesha', 8), setFlag('reyna-mercy')] }),
  }),
  dialogue('d-mercy-marta', {
    start: say('marta', '“Oh, love, it did. A tinker came through who said you stood over a wolf that was shaking and went and fetched it water. I said that sounded like Tobin’s goat. He said no. He said it was the wolf.”', {
      choices: [choice('“It was a very thirsty wolf.”', 'wolf'), choice('“I do not remember doing that.”', 'forget')],
    }),
    wolf: say('marta', '“Of course it was. Sit down, a bowl on the house. Do not tell the others I am a soft touch.”', { actions: [favor('hesha', 8), gold(40)] }),
    forget: say('marta', '“Then you do it so often it stopped being worth remembering. That is the best kind. Have a bowl.”', { actions: [favor('hesha', 8)] }),
  }),
  dialogue('d-mercy-ysra', {
    start: say('warden-ysra', '“The wood has a name for you. It is not a word. It is a smell. Rain on a beaten path, a little after it has stopped. The beasts here lie down when you pass.”', {
      choices: [choice('“I am glad they are not afraid.”', 'glad'), choice('“I only did what was fair.”', 'fair')],
    }),
    glad: say('warden-ysra', '“Afraid is the wrong word. They are… attended. Come back at dusk. I will show you something the wood does not show to most.”', { actions: [favor('ysolde', 12), favor('hesha', 8)] }),
    fair: say('warden-ysra', '“Fair is rarer than kind, and kind is rare enough. The wood agrees. Go well.”', { actions: [favor('ysolde', 12)] }),
  }),
  dialogue('d-mercy-dara', {
    start: say('marshal-dara', '“A raider you let go. Yes, I heard. He came back, you know. Not to fight. He wanted to know the name of the fool who let him live.”', {
      choices: [choice('“What did you tell him?”', 'told'), choice('“I hope he finds a better trade.”', 'trade')],
    }),
    told: say('marshal-dara', '“I told him it was a Godsworn whose arm was sore that day. He nodded, and went into the army. I made sure it was the right army.”', { actions: [favor('kael', 10), favor('hesha', 8), gold(80)] }),
    trade: say('marshal-dara', '“He has. He sells salt to the same dunes he used to ambush. Do not ask which of those is the honester. The salt is.”', { actions: [favor('hesha', 10), gold(50)] }),
  }),
  dialogue('d-mercy-quill', {
    start: say('harbormaster-quill', '“The sailors have a song about you. It is not a good song. It rhymes mercy with Saltmere and then loses its nerve. They sing it with feeling.”', {
      choices: [choice('“Sing it for me.”', 'sing'), choice('“Let it fade. I do not need a song.”', 'fade')],
    }),
    sing: say('harbormaster-quill', '“I will not. But I will pay a tab at the Anchor in your name, which is nearly as good. And is cheaper.”', { actions: [gold(120), favor('nymira', 10), favor('hesha', 8)] }),
    fade: say('harbormaster-quill', '“Then it fades. But I will keep the verse about the wolf. It is the best.”', { actions: [favor('hesha', 12)] }),
  }),
];
