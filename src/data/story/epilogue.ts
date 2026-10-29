import type { Cond, EpilogueSlide } from '../../engine/quests/types';
import { GODS } from '../gods';
import { all, any, flag, not, questDone } from './helpers';

/**
 * The epilogue slideshow: what became of the people and places of the story, told after the ending.
 * Each slide has a condition on the flags and quests of this playthrough; the ones that hold are shown in order.
 */

const path = (p: string): Cond => flag('path', p);
const summit = (s: string): Cond => flag('summit', s);
const BELL: Cond = flag('world-darkened');

const S = (id: string, title: string, text: string, cond?: Cond): EpilogueSlide => ({ id, title, text, ...(cond ? { cond } : {}) });

export const EPILOGUE_SLIDES: EpilogueSlide[] = [
  S('brightwater', 'Brightwater', 'The long tables are laid on the green, and the feast goes on until the lamps burn low. Captain Reyna conducts her eight people and a drum.'),
  S('ashfold', 'Ashfold', 'The village rebuilds the inn on its old foundations. The cellar is bricked up with a plaque for the nine. The wheel at the mill is left to turn, because Dessa says it likes to.', questDone('pro-3')),
  S('mott-spared', 'Deacon Mott', 'Mott stays in Brightwater and teaches the children their letters, as he once taught Aldric. He prays now only in the mornings, and is not asked to say what for.', flag('mott-surrendered')),
  S('mott-fallen', 'Deacon Mott', 'Mott’s grave on the hill has fresh flowers every week. Nobody admits to bringing them.', not(flag('mott-surrendered'))),
  S('varn-spared', 'Varn the Hollow', 'Varn walks the Whisperwood alone, mending what he drained. The Heartwood still says he is standing on its foot.', flag('varn-spared')),
  S('idris-spared', 'Idris Kaur', 'Captain Idris Kaur disbands the last of her company and takes a post on the Sandhaven walls. She holds it for the rest of her life, and no one has ever seen her sit.', flag('idris-spared')),
  S('shard-destroyed', 'The Severance Shard', 'The shard is ground to dust in the Drowned Grotto. For a long time afterward, travelers report that the dark between the stars is a little less lonely.', flag('shard-destroyed')),
  S('shard-kept', 'The Severance Shard', 'The shard is kept in a lead box in a vault no one has ever found. It hums on cold nights, and the vault’s keeper has learned not to answer.', flag('shard-kept')),
  S('hobbes-spared', 'Archivist Hobbes', 'Hobbes writes the history of the Unsworn in a hundred and twelve footnotes. It is a very bad book. It is the only one, and it is used in schools.', flag('hobbes-spared')),
  S('hobbes-fallen', 'The Royal Archive', 'The Royal Archive is rehoused in a new building, with no Archivist. The files are catalogued by a committee. It takes eleven years.', all(flag('hobbes-exposed'), not(flag('hobbes-spared')))),
  S('framed', 'Aurelane', 'In Aurelane, the Watch posts a notice clearing your name. It is nailed to a door in the Underbelly, and no one has dared take it down.', flag('cleared-name')),
  S('smiths', 'The Fallen Smiths', 'The Fallen Smiths are named in a bronze plaque at the mouth of the Rift. Each year, on the longest night, someone lights the anvil.', flag('smiths-remembered')),
  S('bell-world', 'The World After the Bell', 'The sky stays a shade darker for a year and a day. Then, quietly, the colors come back. Nobody mentions it. Everyone notices.', BELL),
  S('ferry-oar', 'The Black Ferry', 'The ferry runs again, and the dead cross at a measured pace. The Ferryman sleeps at last, and does not dream.', flag('ferry-oar', 'refused')),
  S('ferry-oar-taken', 'The Oar', 'In the Hollow Barrows, a figure with an oar rows the dead across the black river. Visitors say she is patient, and that she remembers every name.', flag('ferry-oar', 'taken')),
  S('seryth-sympathy', 'What You Saw', 'You never speak of the day you saw through Seryth’s eyes. But when a shrine goes dark, you are the first to light a candle.', { kind: 'counter', flag: 'seryth-sympathy', min: 2 }),
  S('summit-reconcile', 'The Summit', 'The gods meet again, a hundred years on, and a thousand after that. They are more careful with each other, and with the people who love them.', summit('reconcile')),
  S('summit-sever', 'The Quiet Sky', 'The oaths loosen. The first generation after is strange: freer, lonelier, kinder. The shrines still stand. The gods still listen, if you ask.', summit('sever')),
  S('summit-obey', 'The Held Line', 'The gods keep their charge, and mortals keep theirs. The bargain is old and flawed, but it holds.', summit('obey')),
  S('summit-judge', 'The Judgement', 'Your god spoke at the Summit, and the rest listened. What was said is not written down.', summit('judge')),
  S('temptation', 'The Campfire', 'Your companions tell the story of the night at the fire. It improves with every telling, and every telling ends the same way: with someone passing the bread.', flag('temptation-faced')),
  S('companions', 'Your Companions', 'The companions you gathered keep in touch, in the way of people who have shared a very bad week. Birthdays are remembered. Debts are not.', { kind: 'companions', min: 3 }),
  S('moonfen', 'Moonfen', 'The moon lifts a handspan higher over the marsh. The lanterns are lit by hand now, as they always should have been.', questDone('region-moonfen')),
  S('khazrum', 'Khazrum', 'The Seventh Hall is open. The ancestors’ names are carved anew, and the clans meet there to argue, which is the most peaceful thing they do.', questDone('region-khazrum')),
  S('merrowdeep', 'Merrowdeep', 'The choir of the drowned city sings its last evening service. The fish in the Forum listen, and then, one by one, leave.', questDone('region-merrowdeep')),
  S('foundry', 'The Clockwork Foundry', 'The First Engine stops. The Foundry is silent for the first time in a thousand years. Then, very softly, someone begins to polish a wheel.', questDone('region-clockwork-foundry')),
  S('skyreach', 'Skyreach', 'The Sovereign’s court dissolves into the wind. The floating ruins drift slowly, gracefully, toward the sea.', questDone('region-skyreach')),
  S('seryth-redeemed', 'Seryth', 'Seryth walks the roads alone, lighting the shrines he broke. He is slow. The shrines are many. He seems not to mind.', path('redeemed')),
  S('seryth-unsworn', 'The Severance', 'The Severance sits in your palm like a seed. You do not plant it. You do not put it down.', path('unsworn')),
  S('seryth-fell', 'The Citadel', 'The Dark Citadel is razed by the weather, stone by stone. The Black Throne is the last to go. It makes a sound like a held breath.', any(path('godsworn'), path('oathbreaker'))),
  ...GODS.filter((g) => !g.hidden).map((g) => S(`apostle-${g.id}`, `${g.name}`, `As ${g.name}’s Apostle, you are remembered in the temple of every town you passed. The priests argue about your birth sign. Some of them are right.`, { kind: 'apostle', god: g.id })),
  S('legacy', 'The Road Goes On', 'The road you walked is a road now, with inns on it. Somewhere past the last milestone, there is a village whose name you will remember, and a story that is not yet finished.'),
];
