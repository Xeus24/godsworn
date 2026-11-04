import type { ModifierSpec } from '../../engine/stats/modifiers';

/**
 * Convictions (Innovation Pack, item 15). Sixty beliefs the hero comes to hold by what they do. Deeds feed a lean toward a belief;
 * when the lean is strong enough the belief begins to settle, and a few days later it is yours: a boon, a way of speaking to people,
 * and the approval or anger of the gods who care. Twenty pairs oppose each other: a hero holds one or the other.
 */
export type LeanEvent =
  | 'kill' | 'crit' | 'heal' | 'summon' | 'goldLooted' | 'goldStolen' | 'bookRead' | 'salvage' | 'socket' | 'identify'
  | 'rest' | 'itemBroken' | 'craft' | 'gamble' | 'questDone' | 'mercy' | 'battleWon' | 'battleFled' | 'battleLost'
  /** Synthetic: gold spent and earned (in hundreds), festivals attended, dungeons cleared, people spoken to, prayers said, echoes and ruins found. */
  | 'spend' | 'earn' | 'festival' | 'dungeon' | 'talk' | 'pray' | 'tale';

export interface ConvictionDef {
  id: string;
  name: string;
  /** What it feels like to believe it. */
  thought: string;
  event: LeanEvent;
  need: number;
  /** Count only kills of this enemy type or tier. */
  enemyType?: string;
  tier?: string;
  /** Held instead of this one: the two cannot both settle. */
  opposes?: string;
  mods: ModifierSpec[];
  /** Favor with gods who approve (positive) or take offence (negative), once, when it settles. */
  gods?: Record<string, number>;
}

/** Days from first leaning past the threshold to being held. */
export const SETTLE_DAYS = 3;

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const C = (id: string, name: string, thought: string, event: LeanEvent, need: number, mods: ModifierSpec[], extra: Partial<ConvictionDef> = {}): ConvictionDef => ({ id, name, thought, event, need, mods, ...extra });

// prettier-ignore
export const CONVICTIONS: ConvictionDef[] = [
  // ---- twenty pairs ----
  C('mercy', 'Mercy', 'A beaten foe is not a debt. It is a person who has had a bad day.', 'mercy', 5, [m('healingPower', 10), m('statusResist', 8)], { opposes: 'ruthlessness', gods: { hesha: 12, morrath: -4 } }),
  C('ruthlessness', 'Ruthlessness', 'Anything left alive will come back. Finish it.', 'kill', 60, [m('critDamage', 12), m('damageBonus', 5)], { enemyType: 'humanoid', opposes: 'mercy', gods: { hesha: -12, kael: 6 } }),
  C('courage', 'Courage', 'Fear is information. It is not instructions.', 'kill', 3, [m('maxHp', 8, 'more'), m('statusResist', 10)], { tier: 'boss', opposes: 'caution', gods: { kael: 10 } }),
  C('caution', 'Caution', 'A live coward outlasts a dead hero by about sixty years.', 'battleFled', 6, [m('dodge', 4), m('speed', 6)], { opposes: 'courage', gods: { kael: -6, vex: 4 } }),
  C('frugality', 'Frugality', 'Nobody ever got rich spending it.', 'rest', 10, [m('goldFind', 12), m('maxMp', 6, 'more')], { opposes: 'indulgence', gods: { grimvald: 8 } }),
  C('indulgence', 'Indulgence', 'You will not be buried with it. Buy the good wine.', 'spend', 40, [m('xpGain', 6), m('maxHp', 4, 'more')], { opposes: 'frugality', gods: { grimvald: -4, vex: 6 } }),
  C('compassion', 'Compassion', 'Heal first. Ask after.', 'heal', 40, [m('healingPower', 14), m('maxHp', 4, 'more')], { opposes: 'severity', gods: { hesha: 8, solenne: 4 } }),
  C('severity', 'Severity', 'The strong strike once, and properly.', 'crit', 40, [m('critChance', 4), m('critDamage', 10)], { opposes: 'compassion', gods: { kael: 6, hesha: -6 } }),
  C('honesty', 'Honesty', 'A plain word costs less than any lie, in the end.', 'questDone', 8, [m('xpGain', 5), m('statusResist', 6)], { opposes: 'guile', gods: { solenne: 10, vex: -6 } }),
  C('guile', 'Guile', 'The truth is a tool. So is the other thing.', 'goldStolen', 4, [m('accuracy', 6), m('dodge', 3)], { opposes: 'honesty', gods: { vex: 10, solenne: -8 } }),
  C('piety', 'Piety', 'Somebody is listening. It is only polite to speak.', 'pray', 5, [m('divinePower', 6, 'more'), m('statusResist', 6)], { opposes: 'doubt', gods: { solenne: 6, hesha: 6, aurelis: 4 } }),
  C('doubt', 'Doubt', 'If the gods are listening, they have a strange way of answering.', 'battleLost', 6, [m('magicFind', 8), m('accuracy', 4)], { opposes: 'piety', gods: { solenne: -6, nameless: 4 } }),
  C('curiosity', 'Curiosity', 'Every closed door is an insult to the mind.', 'bookRead', 6, [m('xpGain', 8), m('magicAttack', 4, 'more')], { opposes: 'contentment', gods: { aurelis: 10 } }),
  C('contentment', 'Contentment', 'There is a great deal to be said for a warm fire and no questions.', 'rest', 18, [m('hpRegen', 2), m('maxHp', 6, 'more')], { opposes: 'curiosity', gods: { hesha: 8, aurelis: -4 } }),
  C('craftsmanship', 'Craftsmanship', 'A thing made well is a prayer that does not need words.', 'craft', 20, [m('defense', 6, 'more'), m('physicalAttack', 4, 'more')], { opposes: 'plunder', gods: { thalor: 12 } }),
  C('plunder', 'Plunder', 'It was lying there. Somebody was going to take it.', 'goldLooted', 500, [m('goldFind', 15), m('magicFind', 6)], { opposes: 'craftsmanship', gods: { thalor: -6, grimvald: 6 } }),
  C('stewardship', 'Stewardship', 'The wild is not a pantry. It is a neighbour.', 'kill', 20, [m('natureResist', 12), m('defense', 4, 'more')], { enemyType: 'beast', opposes: 'dominion', gods: { ysolde: 8 } }),
  C('dominion', 'Dominion', 'Everything under the sun answers to someone. Be the someone.', 'summon', 12, [m('damageBonus', 6), m('maxMp', 6, 'more')], { opposes: 'stewardship', gods: { ysolde: -8, morrath: 4 } }),
  C('remembrance', 'Remembrance', 'The dead are owed their names.', 'tale', 6, [m('magicResist', 6, 'more'), m('xpGain', 4)], { opposes: 'oblivion', gods: { mirrin: 10, morrath: 6 } }),
  C('oblivion', 'Oblivion', 'The past is a weight. Put it down.', 'salvage', 20, [m('speed', 5), m('goldFind', 6)], { opposes: 'remembrance', gods: { mirrin: -8 } }),
  C('community', 'Community', 'No road is long with company.', 'festival', 3, [m('xpGain', 6), m('healingPower', 6)], { opposes: 'solitude', gods: { hesha: 8, ordrun: 4 } }),
  C('solitude', 'Solitude', 'Quiet is its own kind of company.', 'rest', 12, [m('dodge', 4), m('critChance', 3)], { opposes: 'community', gods: { seraphel: 6 } }),
  C('order', 'Order', 'A road with milestones gets finished.', 'questDone', 14, [m('defense', 6, 'more'), m('cooldownReduction', 4)], { opposes: 'freedom', gods: { solenne: 8, seraphel: -6 } }),
  C('freedom', 'Freedom', 'No oath, no wall, no map. Walk.', 'battleFled', 12, [m('speed', 8), m('dodge', 4)], { opposes: 'order', gods: { seraphel: 12, solenne: -6 } }),
  C('vigilance', 'Vigilance', 'Sleep lightly. Wake early.', 'battleWon', 60, [m('accuracy', 8), m('speed', 4)], { opposes: 'trust', gods: { kael: 6 } }),
  C('trust', 'Trust', 'People are as good as they are trusted to be.', 'talk', 25, [m('xpGain', 5), m('statusResist', 6)], { opposes: 'vigilance', gods: { hesha: 6 } }),
  C('ambition', 'Ambition', 'Nobody remembers who sat in the middle of the road.', 'earn', 60, [m('xpGain', 8), m('goldFind', 6)], { opposes: 'humility', gods: { grimvald: 6, kael: 4 } }),
  C('humility', 'Humility', 'The road was here before you. It will be after.', 'mercy', 12, [m('statusResist', 10), m('defense', 4, 'more')], { opposes: 'ambition', gods: { hesha: 8, ordrun: 6 } }),
  C('wrath', 'Wrath', 'A fire that is not fed goes out. Feed it.', 'crit', 120, [m('damageBonus', 8), m('critChance', 3)], { opposes: 'patience', gods: { kael: 8, hesha: -6 } }),
  C('patience', 'Patience', 'Most things, left alone, resolve themselves.', 'rest', 25, [m('cooldownReduction', 6), m('hpRegen', 2)], { opposes: 'wrath', gods: { ordrun: 8, hesha: 4 } }),
  // ---- twenty independent ----
  C('beast-slayer', 'Hunter’s Pride', 'The wild respects only those who have beaten it.', 'kill', 80, [m('damageBonus', 6)], { enemyType: 'beast', gods: { ysolde: 4 } }),
  C('grave-warden', 'Grave-Warden', 'The dead should stay put. Gently, if possible.', 'kill', 40, [m('divinePower', 6, 'more')], { enemyType: 'undead', gods: { morrath: 6, solenne: 4 } }),
  C('giant-killer', 'Giant-Killer', 'Bigger is only more to hit.', 'kill', 6, [m('critDamage', 12)], { tier: 'champion', gods: { kael: 6 } }),
  C('elite-hunter', 'Elite Hunter', 'The best of them make the best stories.', 'kill', 40, [m('accuracy', 6), m('magicFind', 6)], { tier: 'elite', gods: { kael: 4 } }),
  C('spellbreaker', 'Spellbreaker', 'Magic is only argument with better lighting.', 'kill', 25, [m('magicResist', 8, 'more')], { enemyType: 'caster', gods: { aurelis: -4 } }),
  C('tidewalker', 'Tidewalker', 'Water remembers everything. So does a good sailor.', 'dungeon', 6, [m('lightningResist', 10), m('speed', 3)], { gods: { nymira: 8 } }),
  C('earthbound-soul', 'Earthbound', 'Stand on something and it is yours.', 'dungeon', 10, [m('defense', 6, 'more'), m('earthResist', 10)], { gods: { ordrun: 8 } }),
  C('windcaller', 'Windward', 'Always lean into the weather.', 'battleFled', 4, [m('dodge', 4), m('speed', 4)], { gods: { seraphel: 6 } }),
  C('gambler', 'Gambler’s Faith', 'The dice remember every kindness.', 'gamble', 6, [m('magicFind', 12), m('critChance', 2)], { gods: { vex: 10, solenne: -4 } }),
  C('scholar', 'Scholar’s Habit', 'Write it down. Write down what you wrote.', 'identify', 15, [m('xpGain', 6), m('magicAttack', 3, 'more')], { gods: { aurelis: 8 } }),
  C('breaker', 'Breaker', 'It was already broken. You only noticed.', 'itemBroken', 6, [m('damageBonus', 4), m('defense', 3, 'more')], { gods: { thalor: -4 } }),
  C('tinkerer', 'Tinkerer', 'A socket is a question. A gem is the answer.', 'socket', 8, [m('critChance', 3), m('magicFind', 5)], { gods: { thalor: 6 } }),
  C('survivor', 'Survivor', 'You have lost before. You are, by evidence, still here.', 'battleLost', 3, [m('maxHp', 8, 'more'), m('statusResist', 8)], { gods: { morrath: 4 } }),
  C('victor', 'Victor', 'A habit, not a gift.', 'battleWon', 150, [m('damageBonus', 5), m('xpGain', 4)], { gods: { kael: 8 } }),
  C('healer-hands', 'Healer’s Hands', 'Everyone you could have lost, you did not.', 'heal', 150, [m('healingPower', 12), m('hpRegen', 1)], { gods: { hesha: 6 } }),
  C('traveller', 'Wayfarer’s Soul', 'The road is the point.', 'tale', 14, [m('speed', 5), m('goldFind', 5)], { gods: { seraphel: 6, mirrin: 4 } }),
  C('feaster', 'Feaster', 'The tables are laid. Sit.', 'festival', 8, [m('maxHp', 5, 'more'), m('hpRegen', 1)], { gods: { hesha: 6 } }),
  C('salvager', 'Salvager', 'Nothing is rubbish. It is only early.', 'salvage', 60, [m('goldFind', 10), m('magicFind', 5)], { gods: { grimvald: 4 } }),
  C('companion-soul', 'Friend of the Fire', 'You were never alone. Not for a night.', 'talk', 80, [m('healingPower', 6), m('xpGain', 5)], { gods: { hesha: 6 } }),
  C('lantern-bearer', 'Lantern-Bearer', 'Somebody has to go first with the light.', 'questDone', 25, [m('xpGain', 6), m('statusResist', 6)], { gods: { solenne: 6 } }),
  C('iron-will', 'Iron Will', 'It can hurt. That is not the same as winning.', 'battleLost', 12, [m('statusResist', 14), m('maxHp', 4, 'more')], { gods: { ordrun: 6 } }),
  C('peacemaker', 'Peacemaker', 'There is always a third thing to say.', 'mercy', 20, [m('healingPower', 8), m('defense', 4, 'more')], { gods: { hesha: 10 } }),
  C('marksman-calm', 'Marksman’s Calm', 'Breathe. Then the hit is a formality.', 'crit', 220, [m('critChance', 4), m('accuracy', 6)], { gods: { ysolde: 4, kael: 4 } }),
  C('prayerful', 'Prayerful', 'You have said more to the gods than to most people.', 'pray', 25, [m('divinePower', 8, 'more'), m('hpRegen', 1)], { gods: { solenne: 6, hesha: 4 } }),
  C('worldly', 'Worldly', 'Money is simply a way to keep score of favors.', 'earn', 150, [m('goldFind', 12), m('xpGain', 4)], { gods: { grimvald: 8 } }),
  C('merchant-heart', 'Merchant’s Heart', 'A fair price makes friends for life.', 'spend', 100, [m('goldFind', 8), m('magicFind', 6)], { gods: { grimvald: 6 } }),
  C('archivist', 'Archivist', 'Every ruin has a minute book. Find it.', 'tale', 24, [m('xpGain', 6), m('magicResist', 4, 'more')], { gods: { mirrin: 8, aurelis: 4 } }),
  C('bibliophile', 'Bibliophile', 'A book is the only door that opens both ways.', 'bookRead', 40, [m('magicAttack', 6, 'more'), m('xpGain', 4)], { gods: { aurelis: 8 } }),
  C('arena-born', 'Arena-Born', 'You were never afraid of the crowd. Only of the quiet.', 'battleWon', 300, [m('damageBonus', 6), m('critDamage', 8)], { gods: { kael: 8 } }),
  C('seeker', 'Seeker', 'The answer is always one chapter on.', 'bookRead', 20, [m('magicAttack', 5, 'more'), m('cooldownReduction', 4)], { gods: { aurelis: 6, mirrin: 4 } }),
];
