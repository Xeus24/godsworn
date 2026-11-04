import type { Cond, EndingDef } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 29: Divine Seasons

export interface DivineSeason {
  god: string;
  name: string;
  text: string;
  /** What the party gains while this god is ascendant. */
  party: ModifierSpec[];
  /** What every enemy gains (the price of the god's attention). */
  enemy: ModifierSpec[];
}

// prettier-ignore
export const DIVINE_SEASONS: DivineSeason[] = [
  { god: 'solenne', name: 'The Open Eye', text: 'Light spills everywhere. Nothing hides, least of all you.', party: [m('accuracy', 10), m('healingPower', 8)], enemy: [m('accuracy', 8)] },
  { god: 'aurelis', name: 'The Long Footnote', text: 'The scribe-goddess catalogues all. Lore finds you, and so does your debt.', party: [m('xpGain', 12)], enemy: [m('critChance', 3)] },
  { god: 'hesha', name: 'The Banked Fire', text: 'Hearths burn high. Rest is sweeter, and so is every blaze.', party: [m('hpRegen', 3), m('maxHp', 5, 'more')], enemy: [m('damageBonus', 5)] },
  { god: 'kael', name: 'The Long Brawl', text: 'The war-god wants a show. Everyone hits harder.', party: [m('physicalAttack', 8, 'more')], enemy: [m('damageBonus', 10)] },
  { god: 'ysolde', name: 'The Green Hour', text: 'The wild presses close. Roads are kinder, and so are the beasts.', party: [m('dodge', 4), m('hpRegen', 2)], enemy: [m('speed', 5)] },
  { god: 'lyssara', name: 'The Slow Dream', text: 'Sleep is near. Fights are drowsy for both sides.', party: [m('statusResist', 15)], enemy: [m('statusChance', 12)] },
  { god: 'nymira', name: 'The Rising Tide', text: 'The sea remembers. Fortune comes in on the water.', party: [m('goldFind', 15), m('magicFind', 8)], enemy: [m('maxHp', 8, 'more')] },
  { god: 'vex', name: 'The Third Card', text: 'Fortune is a prank. Crits fly both ways.', party: [m('critChance', 5), m('luk', 3)], enemy: [m('critChance', 5)] },
  { god: 'seraphel', name: 'The Gale Season', text: 'Winds make everything quick.', party: [m('speed', 8)], enemy: [m('speed', 6)] },
  { god: 'thalor', name: 'The Anvil Days', text: 'Gear rings true. The foes are harder to crack.', party: [m('defense', 8, 'more')], enemy: [m('defense', 8, 'more')] },
  { god: 'grimvald', name: 'The Reckoning', text: 'Coin is king. Every kill pays, and every kill is priced.', party: [m('goldFind', 25)], enemy: [m('maxHp', 10, 'more')] },
  { god: 'ordrun', name: 'The Unmoved', text: 'Stone stands. Fights are slow and steady.', party: [m('maxHp', 10, 'more'), m('damageTaken', -5)], enemy: [m('maxHp', 12, 'more')] },
  { god: 'morrath', name: 'The Long Quiet', text: 'The Pale Warden gathers gently. The dying are brave, and the living are careful.', party: [m('lifesteal', 4)], enemy: [m('lifesteal', 3)] },
  { god: 'mirrin', name: 'The Moment Between', text: 'Time stutters. Skills come back sooner, for you and for them.', party: [m('cooldownReduction', 12)], enemy: [m('cooldownReduction', 8)] },
];

export const SEASONS = {
  /** In-game days a god stays ascendant (14 gods x 8 days = the 112-day year). */
  days: 8,
  /** The pilgrimage checklist: counted from the day the season begins. */
  tasks: [
    { id: 'battles', text: 'Win battles', count: 8 },
    { id: 'champions', text: 'Fell champions, bosses or their kin', count: 2 },
    { id: 'favor', text: 'Earn favor with the ascendant god', count: 60 },
    { id: 'zones', text: 'Set foot in different regions', count: 3 },
  ],
  /** The season’s reward when every task is done: gold per level, and favor. */
  goldPerLevel: 40,
  favor: 100,
  title: 'Pilgrim of the Wheel',
} as const;

// ------------------------------------------------------------------ 31: Omens (fun rules; see R3)

export type OmenRule = 'bloodMoon' | 'mimicChests' | 'bigHeads' | 'busyRoads' | 'quietRoads' | 'noRest';

export interface OmenDef {
  id: string;
  name: string;
  text: string;
  /** A fair omen only makes the game harder or stranger: achievements still count. Others switch achievements off. */
  fair: boolean;
  party?: ModifierSpec[];
  enemy?: ModifierSpec[];
  rule?: OmenRule;
}

const o = (id: string, name: string, text: string, fair: boolean, extra: Partial<OmenDef> = {}): OmenDef => ({ id: `omen-${id}`, name, text, fair, ...extra });

// prettier-ignore
export const OMENS: OmenDef[] = [
  // Rules of the world
  o('blood-moon', 'Endless Blood Moon', 'It is always a Blood Moon at night.', true, { rule: 'bloodMoon' }),
  o('mimics', 'Every Chest a Mimic', 'Every chest bites first.', true, { rule: 'mimicChests' }),
  o('giant-heads', 'Giant Heads', 'Everyone has a very large head.', true, { rule: 'bigHeads' }),
  o('busy-roads', 'Busy Roads', 'Twice as many encounters on the road.', true, { rule: 'busyRoads' }),
  o('quiet-roads', 'Quiet Roads', 'Half as many encounters on the road.', false, { rule: 'quietRoads' }),
  // Harder
  o('iron-sky', 'Iron Sky', 'Enemies have 15% more HP.', true, { enemy: [m('maxHp', 15, 'more')] }),
  o('sharp-teeth', 'Sharp Teeth', 'Enemies deal 15% more damage.', true, { enemy: [m('damageBonus', 15)] }),
  o('quick-feet', 'Quick Feet', 'Enemies are faster.', true, { enemy: [m('speed', 10)] }),
  o('thick-hides', 'Thick Hides', 'Enemies have 15% more defense.', true, { enemy: [m('defense', 15, 'more')] }),
  o('keen-eyes', 'Keen Eyes', 'Enemies are likelier to crit.', true, { enemy: [m('critChance', 8)] }),
  o('slippery', 'Slippery Things', 'Enemies are harder to hit.', true, { enemy: [m('dodge', 8)] }),
  o('venomous', 'Venomous Air', 'Enemies inflict statuses more often.', true, { enemy: [m('statusChance', 15)] }),
  o('thirsty', 'Thirsty Blades', 'Enemies steal a little of the HP they deal.', true, { enemy: [m('lifesteal', 5)] }),
  o('mending', 'Mending Hands', 'Enemies recover HP every turn.', true, { enemy: [m('hpRegen', 3)] }),
  o('thin-blood', 'Thin Blood', 'You have 15% less max HP.', true, { party: [m('maxHp', -15, 'more')] }),
  o('dull-edge', 'Dull Edge', 'You deal 10% less damage.', true, { party: [m('damageBonus', -10)] }),
  o('heavy-feet', 'Heavy Feet', 'You are slower.', true, { party: [m('speed', -8)] }),
  o('poor-purse', 'Poor Purse', 'You find 30% less gold.', true, { party: [m('goldFind', -30)] }),
  o('closed-hands', 'Closed Hands', 'You find 30% less loot.', true, { party: [m('magicFind', -30)] }),
  o('fragile', 'Fragile Soul', 'You take 15% more damage.', true, { party: [m('damageTaken', 15)] }),
  o('no-grace', 'No Grace', 'Healing gives you 25% less.', true, { party: [m('healingReceived', -25)] }),
  o('rusted', 'Rusted Armor', 'You have 15% less defense.', true, { party: [m('defense', -15, 'more')] }),
  o('cold-hearth', 'Cold Hearth', 'You gain 25% less XP.', true, { party: [m('xpGain', -25)] }),
  // Easier or stranger (achievements off)
  o('glass-gods', 'Glass Gods', 'You deal 25% more damage.', false, { party: [m('damageBonus', 25)] }),
  o('stout', 'Stout Hearts', 'You have 25% more max HP.', false, { party: [m('maxHp', 25, 'more')] }),
  o('swift-ghosts', 'Swift Ghosts', 'You are much faster.', false, { party: [m('speed', 15)] }),
  o('golden-touch', 'Golden Touch', 'You find double gold.', false, { party: [m('goldFind', 100)] }),
  o('lucky-star', 'Lucky Star', 'You find far more loot.', false, { party: [m('magicFind', 100)] }),
  o('quick-study', 'Quick Study', 'You gain double XP.', false, { party: [m('xpGain', 100)] }),
  o('feather-armor', 'Feather Armor', 'You take 25% less damage.', false, { party: [m('damageTaken', -25)] }),
  o('ever-crit', 'Ever Crit', 'You crit far more often.', false, { party: [m('critChance', 25)] }),
  o('blessed-road', 'Blessed Road', 'You gain far more favor.', false, { party: [m('favorGain', 100)] }),
  o('second-wind', 'Second Wind', 'You recover HP every turn.', false, { party: [m('hpRegen', 5)] }),
  o('spell-storm', 'Spell Storm', 'Your skills come back much sooner.', false, { party: [m('cooldownReduction', 30)] }),
  o('soft-enemies', 'Soft Enemies', 'Enemies have 25% less HP.', false, { enemy: [m('maxHp', -25, 'more')] }),
  o('gentle-foes', 'Gentle Foes', 'Enemies deal 25% less damage.', false, { enemy: [m('damageBonus', -25)] }),
  o('slow-foes', 'Slow Foes', 'Enemies are slower.', false, { enemy: [m('speed', -12)] }),
  o('clumsy-foes', 'Clumsy Foes', 'Enemies miss you more often.', false, { enemy: [m('accuracy', -15)] }),
  // Silly pairs: both sides
  o('glass-cannons', 'Glass Cannons', 'Everyone deals 40% more damage and has 30% less HP.', false, { party: [m('damageBonus', 40), m('maxHp', -30, 'more')], enemy: [m('damageBonus', 40), m('maxHp', -30, 'more')] }),
  o('stone-skin', 'Stone Skin', 'Everyone has 30% more defense and deals 20% less damage.', false, { party: [m('defense', 30, 'more'), m('damageBonus', -20)], enemy: [m('defense', 30, 'more'), m('damageBonus', -20)] }),
  o('crit-parade', 'Crit Parade', 'Everyone crits far more often.', false, { party: [m('critChance', 20)], enemy: [m('critChance', 20)] }),
  o('mirror-speed', 'Mirror Speed', 'Everyone is very fast.', false, { party: [m('speed', 20)], enemy: [m('speed', 20)] }),
  o('dodge-dance', 'Dodge Dance', 'Everyone dodges far more.', false, { party: [m('dodge', 20)], enemy: [m('dodge', 20)] }),
  o('bleeding-world', 'Bleeding World', 'Everyone steals HP on hit.', false, { party: [m('lifesteal', 8)], enemy: [m('lifesteal', 8)] }),
  o('status-fair', 'Status Fair', 'Statuses land almost every time, for everyone.', false, { party: [m('statusChance', 30)], enemy: [m('statusChance', 30)] }),
  o('slow-motion', 'Slow Motion', 'Everyone is slow, and has more HP to show for it.', false, { party: [m('speed', -10), m('maxHp', 30, 'more')], enemy: [m('speed', -10), m('maxHp', 30, 'more')] }),
  o('open-wounds', 'Raw Wounds', 'Everyone takes 20% more damage.', true, { party: [m('damageTaken', 20)], enemy: [m('damageTaken', 20)] }),
  o('long-fights', 'Long Fights', 'Everyone recovers HP every turn.', false, { party: [m('hpRegen', 4)], enemy: [m('hpRegen', 4)] }),
  o('hollow-victory', 'Hollow Victory', 'Enemies recover a little HP and you find 20% less gold.', true, { enemy: [m('hpRegen', 2)], party: [m('goldFind', -20)] }),
  o('stormy-luck', 'Stormy Luck', 'You are lucky and the foes are too.', false, { party: [m('luk', 8)], enemy: [m('critChance', 8), m('dodge', 8)] }),
];

// ------------------------------------------------------------------ 32: Chronicler's Tools

export interface SplitDef {
  id: string;
  name: string;
  cond: Cond;
}

// prettier-ignore
export const SPLITS: SplitDef[] = [
  { id: 'lv5', name: 'Level 5', cond: { kind: 'level', min: 5 } },
  { id: 'lv10', name: 'Level 10', cond: { kind: 'level', min: 10 } },
  { id: 'lv20', name: 'Level 20', cond: { kind: 'level', min: 20 } },
  { id: 'lv30', name: 'Level 30', cond: { kind: 'level', min: 30 } },
  { id: 'lv45', name: 'Level 45', cond: { kind: 'level', min: 45 } },
  { id: 'lv60', name: 'Level 60', cond: { kind: 'level', min: 60 } },
  { id: 'end', name: 'The story ends', cond: { kind: 'flag', flag: 'storyComplete' } },
];

export interface VexCode {
  code: string;
  text: string;
  /** What it does: gold, xp, favor, heal, item, cards, day, omen. */
  kind: 'gold' | 'xp' | 'favor' | 'heal' | 'item' | 'cards' | 'day' | 'omen';
  amount?: number;
  item?: string;
  omen?: string;
}

// prettier-ignore
export const VEX_CODES: VexCode[] = [
  { code: 'VEXWASHERE', text: 'A purse of 5,000 gold, with a note: “you’re welcome.”', kind: 'gold', amount: 5000 },
  { code: 'THIRDCARD', text: 'Ten random cards for your collection.', kind: 'cards', amount: 10 },
  { code: 'LUCKYDAY', text: 'A few levels worth of experience.', kind: 'xp', amount: 20000 },
  { code: 'GODSPEAK', text: 'Fifty favor with every god.', kind: 'favor', amount: 50 },
  { code: 'FULLPOT', text: 'Everyone in your party is healed.', kind: 'heal' },
  { code: 'SKIPAHEAD', text: 'Eight days pass.', kind: 'day', amount: 8 },
  { code: 'RIFTMAKER', text: 'Five Rift Maps.', kind: 'item', item: 'rift-map', amount: 5 },
  { code: 'SOULSEALS', text: 'Ten Soul Seals.', kind: 'item', item: 'soul-seal', amount: 10 },
  { code: 'BIGHEADS', text: 'The Giant Heads omen is switched on.', kind: 'omen', omen: 'omen-giant-heads' },
  { code: 'REDMOON', text: 'The Endless Blood Moon omen is switched on.', kind: 'omen', omen: 'omen-blood-moon' },
  { code: 'MIMICMAS', text: 'The Every Chest a Mimic omen is switched on.', kind: 'omen', omen: 'omen-mimics' },
  { code: 'COINSHOWER', text: 'A purse of 50,000 gold. Vex adds: “do not tell Grimvald.”', kind: 'gold', amount: 50000 },
];

export const CHRONICLER = {
  /** The tracker and codes need a story finished at least once. */
  codesNeedClear: true,
} as const;

// ------------------------------------------------------------------ 30: Trials of the Day and Week

export const TRIALS = {
  dailyMinLevel: 20,
  dailyFights: 4,
  dailyAffixes: 2,
  /** Gold per level for a first clear each day, plus a bonus per day of streak (capped). */
  dailyGoldPerLevel: 12,
  dailyStreakBonus: 0.1,
  dailyStreakCap: 10,
  dailyRiftMaps: 1,
  respitePct: 20,
} as const;

// ------------------------------------------------------------------ 34: Fates

export const VEX_PRANK_ENDING: EndingDef = {
  id: 'vex-prank',
  name: 'The Prank',
  title: 'Punchline',
  text: 'You pay a gold coin for the chest, the ancient, glowing, unmistakably cursed chest, and the stranger beaming at you takes her hood down. It is Vex. She is laughing too hard to speak. The chest is full of confetti, and a note: “THE END (for now).” The gods hear about it by evening. Kael declares it the finest opening he has ever seen. Morrath says it was the quickest death he has ever had to not-collect. The world, in the end, has nothing to say about it, and carries on. So, you suspect, will you.',
  godText: { vex: 'Vex frames the coin, and the look on your face, and hangs them in her own shrine.' },
};

/** Short hints for the Fates board: what leads to each ending. */
export const FATE_HINTS: Record<string, string> = {
  godsworn: 'Finish the story as the sworn servant of the gods.',
  redeemed: 'Finish the story with mercy for the Unsworn King.',
  unsworn: 'Break the last oath.',
  freeblade: 'Finish the story by no god’s hand.',
  concord: 'Make peace between the gods.',
  'quiet-sky': 'Silence the pantheon.',
  ferrykeeper: 'Take Morrath’s ferry.',
  'long-table': 'Gather everyone at a table.',
  'twilight-dawn': 'In New Game+, speak the Nameless One’s name.',
  'twilight-unwritten': 'In New Game+, leave the Nameless One unwritten.',
  'twilight-godslayer': 'Walk the Godslayer path to its end.',
  'twilight-ascension': 'Walk the path of Ascension to its end.',
  'twilight-defender': 'Walk the Defender’s path to its end.',
  'twilight-bargain': 'Accept the Nameless One’s bargain.',
  'twilight-true': 'Walk all three paths, and speak the whole name.',
  'vex-prank': 'Be a little too trusting in the first ten minutes.',
};
