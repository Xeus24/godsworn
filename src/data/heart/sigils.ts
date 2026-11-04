import type { Cond } from '../../engine/quests/types';
import type { ModifierSpec } from '../../engine/stats/modifiers';

/**
 * Sigils of the Old Faith (Innovation Pack, item 13). Forty marks from before the gods took their names. Each is found by doing the
 * thing it commemorates, and slotted into one of a few Sigil Slots for a boon. Overcharged, it gives two and a half times as much,
 * and asks something back. Reconciliation R8: "sigil" belongs to these; the Inkweaver's marks on the field are Glyphs.
 */
export interface SigilDef {
  id: string;
  name: string;
  text: string;
  /** What finds it. */
  found: Cond;
  /** The boon, and the same overcharged with the price. */
  mods: ModifierSpec[];
  over: ModifierSpec[];
  cost: string;
}

/** Slots at the start, and the levels at which more open. */
export const SIGIL_SLOTS = { base: 3, extraAt: [30, 60] } as const;
export const OVERCHARGE = 2.5;

type StatTuple = [stat: string, value: number, type?: 'flat' | 'more'];
const mod = ([stat, value, type = 'flat']: StatTuple): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const S = (id: string, name: string, text: string, found: Cond, boon: StatTuple, price: StatTuple, cost: string): SigilDef => ({
  id, name, text, found,
  mods: [mod(boon)],
  over: [mod([boon[0], Math.round(boon[1] * OVERCHARGE * 10) / 10, boon[2]]), mod(price)],
  cost,
});
const favor = (god: string): Cond => ({ kind: 'favor', god, tier: 'acknowledged' });
const life = (stat: 'kills' | 'bossesKilled' | 'goldEarned', min: number): Cond => ({ kind: 'lifetime', stat, min });

// prettier-ignore
export const SIGILS: SigilDef[] = [
  // ---- the gods (fourteen): found at an Acknowledged favor ----
  S('sig-solenne', 'Sigil of the Noon', 'A circle with a line through it: the sun at its height, judging.', favor('solenne'), ['divinePower', 4, 'more'], ['dodge', -5], 'The sun sees you plainly: -5 dodge.'),
  S('sig-morrath', 'Sigil of the Last Door', 'A door, drawn from the outside.', favor('morrath'), ['magicResist', 5, 'more'], ['healingPower', -12], 'The door does not open for healing: -12 healing power.'),
  S('sig-kael', 'Sigil of the Banner', 'A staff with a rag on it.', favor('kael'), ['damageBonus', 4], ['defense', -6, 'more'], 'You fight bare: -6% defense.'),
  S('sig-ysolde', 'Sigil of the Tracks', 'Three prints, one slightly fainter.', favor('ysolde'), ['accuracy', 5], ['maxHp', -6, 'more'], 'You move light: -6% max HP.'),
  S('sig-vex', 'Sigil of the Coin Turned', 'A coin, mid-flip.', favor('vex'), ['magicFind', 8], ['statusResist', -8], 'Luck has no loyalty: -8 status resist.'),
  S('sig-thalor', 'Sigil of the Hammer-Mark', 'The mark a smith leaves to say: mine.', favor('thalor'), ['physicalAttack', 4, 'more'], ['speed', -5], 'Slow and sure: -5 speed.'),
  S('sig-nymira', 'Sigil of the Tide-Line', 'A wavering line, high water.', favor('nymira'), ['lightningResist', 8], ['defense', -5, 'more'], 'The tide takes what it pleases: -5% defense.'),
  S('sig-aurelis', 'Sigil of the Open Book', 'A book that has been read, and wants to be again.', favor('aurelis'), ['magicAttack', 4, 'more'], ['maxHp', -6, 'more'], 'Knowledge costs: -6% max HP.'),
  S('sig-hesha', 'Sigil of the Hearth-Stone', 'A circle of stones, one warm.', favor('hesha'), ['healingPower', 8], ['critChance', -3], 'You soften: -3 critical chance.'),
  S('sig-grimvald', 'Sigil of the Balance', 'A scale, deliberately uneven.', favor('grimvald'), ['goldFind', 10], ['xpGain', -6], 'Everything has a price: -6 XP gain.'),
  S('sig-lyssara', 'Sigil of the Pale Eye', 'A waning crescent, watching.', favor('lyssara'), ['dodge', 4], ['accuracy', -6], 'You see too little by day: -6 accuracy.'),
  S('sig-ordrun', 'Sigil of the Keystone', 'The stone every arch rests on.', favor('ordrun'), ['defense', 4, 'more'], ['speed', -6], 'Heavy as a mountain: -6 speed.'),
  S('sig-seraphel', 'Sigil of the Open Hand', 'A palm, held up to the wind.', favor('seraphel'), ['speed', 5], ['defense', -5, 'more'], 'Nothing holds: -5% defense.'),
  S('sig-mirrin', 'Sigil of the Hourglass', 'Two bowls, and a narrowing between.', favor('mirrin'), ['cooldownReduction', 5], ['maxHp', -6, 'more'], 'Time is borrowed: -6% max HP.'),
  // ---- roads and deeps ----
  S('sig-road-1', 'Sigil of the First Road', 'A line that has not yet decided where to go.', { kind: 'zones', min: 3 }, ['speed', 3], ['defense', -3, 'more'], 'Light-footed, and unguarded: -3% defense.'),
  S('sig-road-2', 'Sigil of the Long Road', 'A line that has made up its mind.', { kind: 'zones', min: 8 }, ['dodge', 3], ['statusResist', -5], 'The road wears on you: -5 status resist.'),
  S('sig-road-3', 'Sigil of the Far Road', 'A line that goes off the edge.', { kind: 'zones', min: 14 }, ['xpGain', 5], ['maxHp', -6, 'more'], 'Further than is wise: -6% max HP.'),
  S('sig-deep-1', 'Sigil of Deep Places', 'A circle with a smaller circle below it.', { kind: 'dungeons', min: 5 }, ['accuracy', 4], ['speed', -3], 'Slow in the open: -3 speed.'),
  S('sig-deep-2', 'Sigil of Delvers', 'A ladder, going down.', { kind: 'dungeons', min: 20 }, ['defense', 3, 'more'], ['dodge', -4], 'Used to narrow places: -4 dodge.'),
  S('sig-deep-3', 'Sigil of the Underkings', 'A crown, upside down.', { kind: 'dungeons', min: 40 }, ['damageBonus', 4], ['magicResist', -5, 'more'], 'The dark knows you: -5% magic resist.'),
  S('sig-waymarks', 'Sigil of the Waymarks', 'A cairn, drawn from above.', { kind: 'waypoints', min: 10 }, ['speed', 3], ['maxMp', -6, 'more'], 'Light-packed: -6% max MP.'),
  // ---- deeds ----
  S('sig-fangs', 'Sigil of Fangs', 'Two curves, meeting.', life('kills', 100), ['critChance', 2], ['defense', -4, 'more'], 'You lead with the teeth: -4% defense.'),
  S('sig-culling', 'Sigil of Culling', 'A tally, five bars, struck.', life('kills', 600), ['damageBonus', 3], ['healingPower', -8], 'A cull does not heal: -8 healing power.'),
  S('sig-reaper', 'Sigil of the Reaper', 'A curve, and what it is for.', life('kills', 3000), ['critDamage', 8], ['maxHp', -8, 'more'], 'Reaping costs: -8% max HP.'),
  S('sig-crownbreaker', 'Sigil of the Crown-Breaker', 'A crown, cracked.', life('bossesKilled', 5), ['damageBonus', 4], ['dodge', -4], 'Heavy-handed: -4 dodge.'),
  S('sig-tyrantslayer', 'Sigil of the Tyrant-Slayer', 'A throne, with nothing on it.', life('bossesKilled', 25), ['critChance', 3], ['statusResist', -6], 'The room remembers you: -6 status resist.'),
  S('sig-coin', 'Sigil of Coin', 'A disc with a notch.', life('goldEarned', 5000), ['goldFind', 6], ['xpGain', -4], 'Eyes on the purse: -4 XP gain.'),
  S('sig-plenty', 'Sigil of Plenty', 'A bowl, overfull.', life('goldEarned', 60000), ['magicFind', 6], ['speed', -4], 'Heavy pockets: -4 speed.'),
  S('sig-hands', 'Sigil of the Many Hands', 'Three hands joined, one slightly higher.', { kind: 'companions', min: 3 }, ['healingPower', 6], ['critChance', -2], 'Always looking over a shoulder: -2 critical chance.'),
  S('sig-fellowship', 'Sigil of the Fellowship', 'A ring of figures, an empty place left.', { kind: 'companions', min: 6 }, ['xpGain', 5], ['dodge', -3], 'Crowded: -3 dodge.'),
  S('sig-learning', 'Sigil of Learning', 'A page, with a margin.', { kind: 'achievements', min: 25 }, ['xpGain', 4], ['accuracy', -4], 'Reading too much: -4 accuracy.'),
  S('sig-renown', 'Sigil of Renown', 'A name, written large.', { kind: 'achievements', min: 100 }, ['goldFind', 6], ['dodge', -4], 'Everyone knows you: -4 dodge.'),
  S('sig-bestiary', 'Sigil of the Bestiary', 'An eye, and an animal inside it.', { kind: 'bestiary', seen: 50 }, ['accuracy', 5], ['maxMp', -6, 'more'], 'Too much to remember: -6% max MP.'),
  S('sig-mastery', 'Sigil of Mastery', 'A single stroke, perfectly made.', { kind: 'mastered', min: 1 }, ['critDamage', 6], ['speed', -3], 'Patience is slow: -3 speed.'),
  S('sig-grandmaster', 'Sigil of the Grandmaster', 'A single stroke, and the space around it.', { kind: 'mastered', min: 6 }, ['damageBonus', 4], ['maxHp', -6, 'more'], 'Thin on the margins: -6% max HP.'),
  S('sig-two-roads', 'Sigil of Two Roads', 'A fork, and a decision.', { kind: 'classes', min: 2 }, ['cooldownReduction', 4], ['defense', -4, 'more'], 'Divided: -4% defense.'),
  S('sig-the-blend', 'Sigil of the Blend', 'Two colours, one stroke.', { kind: 'hybrids', min: 1 }, ['magicAttack', 3, 'more'], ['physicalAttack', -3, 'more'], 'You cannot be both at once: -3% physical attack.'),
  S('sig-helping', 'Sigil of Helping Hands', 'A hand, offered.', { kind: 'questsDone', min: 25 }, ['healingPower', 5], ['critChance', -2], 'Distracted by others: -2 critical chance.'),
  S('sig-legend', 'Sigil of the Legend', 'A name that has outgrown its owner.', { kind: 'questsDone', min: 100 }, ['xpGain', 6], ['maxHp', -6, 'more'], 'Expected to be more: -6% max HP.'),
  S('sig-gentle', 'Sigil of the Gentle Blade', 'A sword, laid flat.', { kind: 'counter', flag: 'mercy', min: 6 }, ['statusResist', 8], ['critDamage', -8], 'A sword laid flat: -8 critical damage.'),
];
