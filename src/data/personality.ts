import type { ModifierSpec } from '../engine/stats/modifiers';

/** Ideals, Bonds and Flaws (item 188): chosen at creation, a small passive each, and a line that colours the Godsworn Journal. */
export interface TraitDef {
  id: string;
  name: string;
  /** One line: what it means. */
  text: string;
  modifiers: ModifierSpec[];
  /** Added to a journal entry now and then. */
  note: string;
}
const f = (stat: string, value: number): ModifierSpec => ({ stat, type: 'flat', value } as ModifierSpec);
const p = (stat: string, value: number): ModifierSpec => ({ stat, type: 'percent', value } as ModifierSpec);
type Row = [id: string, name: string, text: string, mods: ModifierSpec[], note: string];
const make = (rows: Row[]): TraitDef[] => rows.map(([id, name, text, modifiers, note]) => ({ id, name, text, modifiers, note }));

// prettier-ignore
export const IDEALS: TraitDef[] = make([
  ['mercy', 'Mercy', 'Spare what can be spared. +4% healing power.', [f('healingPower', 4)], 'I tried to leave something standing.'],
  ['glory', 'Glory', 'A deed worth doing is worth being seen. +3% damage.', [f('damageBonus', 3)], 'Someone will tell this, I hope.'],
  ['order', 'Order', 'A rule kept is a wall built. +4% defense.', [p('defense', 4)], 'It was done properly, at least.'],
  ['freedom', 'Freedom', 'No chain, no master. +3% dodge.', [f('dodge', 3)], 'Nobody told me to. That mattered.'],
  ['knowledge', 'Knowledge', 'To know is to be armed. +4% XP gain.', [f('xpGain', 4)], 'I wrote down what I learned.'],
  ['tradition', 'Tradition', 'The old ways were old for a reason. +4% max HP.', [p('maxHp', 4)], 'The elders would have nodded.'],
  ['charity', 'Charity', 'What you have is for sharing. +4% gold found.', [f('goldFind', 4)], 'I gave a little away, as I ought.'],
  ['ambition', 'Ambition', 'There is always a higher step. +3% crit chance.', [f('critChance', 3)], 'One step up. There are more.'],
  ['honor', 'Honor', 'Your word is your edge. +4% status resist.', [f('statusResist', 4)], 'I kept my word. It was inconvenient.'],
  ['craft', 'Craft', 'Do the work well, or not at all. +4% magic find.', [f('magicFind', 4)], 'It was good work. I checked.'],
  ['change', 'Change', 'Nothing stays; nor should it. +3% speed.', [p('speed', 3)], 'Different from yesterday. Good.'],
  ['faith', 'Faith', 'There is a hand behind the hand. +4% blessing power.', [f('blessingPower', 4)], 'Something helped. I will say so.'],
]);
// prettier-ignore
export const BONDS: TraitDef[] = make([
  ['family', 'My Family', 'Someone is waiting. +4% max HP.', [p('maxHp', 4)], 'I wrote to them, in my head.'],
  ['order-sworn', 'My Order', 'A banner, an oath, a bunk. +3% damage.', [f('damageBonus', 3)], 'The order would have approved.'],
  ['teacher', 'My Teacher', 'Everything you know is borrowed. +4% XP gain.', [f('xpGain', 4)], 'My teacher would have said it differently.'],
  ['lost-home', 'A Lost Home', 'You are still walking back. +3% speed.', [p('speed', 3)], 'Further from home. Or closer.'],
  ['rival', 'A Rival', 'Someone is keeping score. +3% crit chance.', [f('critChance', 3)], 'My rival will hear of this.'],
  ['debt', 'A Debt', 'You owe, and are owed. +4% gold found.', [f('goldFind', 4)], 'It goes toward the debt.'],
  ['dead-promise', 'A Promise to the Dead', 'You said you would. +4% status resist.', [f('statusResist', 4)], 'I said I would. I am.'],
  ['craft-bond', 'My Craft', 'Your hands are the oath. +4% magic find.', [f('magicFind', 4)], 'My hands knew what to do.'],
  ['town', 'A Town That Knew Me', 'It is smaller than you remember. +4% defense.', [p('defense', 4)], 'I thought of the town.'],
  ['prisoner', 'A Friend in Prison', 'You are the only one who remembers. +3% dodge.', [f('dodge', 3)], 'A friend is waiting on me.'],
  ['heirloom', 'A Stolen Heirloom', 'Someone has it, and does not know. +4% healing power.', [f('healingPower', 4)], 'The heirloom is still out there.'],
  ['favor', 'A God’s Favor', 'One god asked for something once. +4% blessing power.', [f('blessingPower', 4)], 'I have not forgotten the favor.'],
]);
// prettier-ignore
export const FLAWS: TraitDef[] = make([
  ['greed', 'Greed', 'More is never enough. +6% gold found, -3% status resist.', [f('goldFind', 6), f('statusResist', -3)], 'I counted it twice. Again.'],
  ['pride', 'Pride', 'You will not be seen to bend. +3% damage, -4% defense.', [f('damageBonus', 3), p('defense', -4)], 'I would not have asked for help.'],
  ['wrath', 'Wrath', 'The temper is quick. +4% damage, -3% dodge.', [f('damageBonus', 4), f('dodge', -3)], 'I was angrier than I should have been.'],
  ['cowardice', 'Cowardice', 'You run, sometimes wisely. +4% dodge, -4% max HP.', [f('dodge', 4), p('maxHp', -4)], 'I thought about running. Briefly.'],
  ['gluttony', 'Hunger', 'Always the next meal. +4% max HP, -3% speed.', [p('maxHp', 4), p('speed', -3)], 'I ate, afterward. A great deal.'],
  ['vanity', 'Vanity', 'You like how it looks. +3% crit chance, -3% max HP.', [f('critChance', 3), p('maxHp', -3)], 'It looked good, I think.'],
  ['curiosity', 'Curiosity', 'You open the box. +4% magic find, -3% defense.', [f('magicFind', 4), p('defense', -3)], 'I should not have touched it. I did.'],
  ['secrecy', 'Secrecy', 'No one gets the whole story. +3% dodge, -4% healing received.', [f('dodge', 3), f('healingReceived', -4)], 'I told them only half of it.'],
  ['recklessness', 'Recklessness', 'You jump first. +4% speed, -4% defense.', [p('speed', 4), p('defense', -4)], 'No plan. It mostly worked.'],
  ['stubborn', 'Stubbornness', 'You will not be moved. +4% status resist, -3% speed.', [f('statusResist', 4), p('speed', -3)], 'I did it my way, as ever.'],
  ['sloth', 'Idleness', 'Why walk, if you can wait. +4% HP regen, -3% damage.', [f('hpRegen', 4), f('damageBonus', -3)], 'I could have rested more.'],
  ['grudge', 'Grudges', 'You remember every slight. +4% crit chance, -4% status resist.', [f('critChance', 4), f('statusResist', -4)], 'Another name on the list.'],
]);
export const TRAIT_KINDS = { ideal: IDEALS, bond: BONDS, flaw: FLAWS } as const;
export type TraitKind = keyof typeof TRAIT_KINDS;
export const ALL_TRAITS: TraitDef[] = [...IDEALS, ...BONDS, ...FLAWS];
