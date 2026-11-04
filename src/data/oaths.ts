import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 61: Caerith the Unremembered

/** What can be known of Caerith, the god of Oaths whom the others erased. Each fragment opens when its source has been found. */
export interface Fragment { id: string; title: string; text: string; /** The source that opens it. */ source: 'pages' | 'cipher' | 'observatory' | 'sundered' | 'echoes' | 'chronicle'; need: number }
// prettier-ignore
export const CAERITH: Fragment[] = [
  { id: 'f1', title: 'A Name Scraped Off a Wall', text: 'Every temple in Vael has one stone where an inscription was removed. The gap is the same width in all of them.', source: 'echoes', need: 6 },
  { id: 'f2', title: 'The God Who Kept Count', text: 'Before the Wheel there was a god of keeping: of promises, and of the weight a promise has when it is kept. The gods did not like how much was being owed to someone else.', source: 'pages', need: 3 },
  { id: 'f3', title: 'Why Oaths Hold', text: 'A Godsworn vow is binding because it was once Caerith’s to bind. Nobody remembers who it is binding to.', source: 'pages', need: 6 },
  { id: 'f4', title: 'The Last Apostle', text: 'There was one apostle who took the last of Caerith’s oaths. He kept it for a very long time.', source: 'pages', need: 10 },
  { id: 'f5', title: 'What the Observatory Knew', text: 'The Orrery has a gap in its gears, a place for a body that is not drawn. Set right, the gap hums.', source: 'observatory', need: 1 },
  { id: 'f6', title: 'An Hour That Was Cut', text: 'In the oldest hour of the Sundered Hours, a god is on the road, and no one in the market can see her.', source: 'sundered', need: 6 },
  { id: 'f7', title: 'The Chronicle Skips a Page', text: 'The Chronicle of Ages has, between two entries, a blank that is exactly as long as an oath.', source: 'chronicle', need: 10 },
  { id: 'f8', title: 'The Cipher’s First Symbols', text: 'The first twenty symbols are a word. The word is a promise, and the promise is “I will be remembered.”', source: 'cipher', need: 25 },
  { id: 'f9', title: 'The Erasure', text: 'They did not kill her. They did something worse: they agreed, all together, not to say her name. It took less than a day.', source: 'cipher', need: 50 },
  { id: 'f10', title: 'The Broken Oath', text: 'The Unsworn King did not break an oath. He was released from one, by the only god who could, and it was the cruellest thing she ever did.', source: 'pages', need: 14 },
  { id: 'f11', title: 'What the Wheel Costs', text: 'Fourteen gods turn the year. A fifteenth would have turned it the other way.', source: 'cipher', need: 75 },
  { id: 'f12', title: 'Where She Rests', text: 'The cipher ends at a door in the Hollow Barrows that has no handle. She is behind it, and she is, as far as anyone can tell, waiting for someone to knock.', source: 'cipher', need: 100 },
];

// ------------------------------------------------------------------ 62: The Unsworn Lineage

/** The sixteen pages of the Unsworn King’s broken oath, one in each of sixteen regions (found by solving the region’s second puzzle chest). */
export const LINEAGE_ZONES = ['meadowlands', 'whisperwood', 'sunken-caves', 'ashen-desert', 'frostspire', 'stormcoast', 'volcanic-rift', 'dark-citadel', 'aurelane', 'moonfen', 'thornreach', 'khazrum', 'gloamwood', 'saltglass', 'merrowdeep', 'clockwork-foundry'] as const;
// prettier-ignore
export const LINEAGE_PAGES: string[] = [
  'I take this oath before her who keeps the count.',
  'I will hold the line when the line is not mine to hold.',
  'I will name the dead, and I will not let their names be tidied.',
  'I will keep faith where faith is inconvenient.',
  'I swear this to the gods, but I swear it first to her.',
  'It is hard, being the last. The others have stopped coming.',
  'The gods say she is a rumor. I have her oath in my pocket.',
  'I have asked three times what they did with her name. They look at their hands.',
  'I will not be released. I would sooner be broken.',
  'I was released. It was done kindly, which is how I knew.',
  'There is nothing to keep, and nobody to keep it for.',
  'I do not hate the gods. I hate that they were gentle.',
  'If an oath can be removed, it was never an oath. Then what was I?',
  'I take a crown because it is the heaviest thing I can find.',
  'I will make a kingdom where nothing is promised, and nothing can be broken.',
  'Whoever reads this: she was real. She counted.',
];
/** Eight things the Unsworn King says once enough of the pages are known. */
export const KING_LINES: { pages: number; text: string }[] = [
  { pages: 2, text: '“You have been reading. Good. Someone ought to.”' },
  { pages: 4, text: '“I did not break it. Do not say I broke it.”' },
  { pages: 6, text: '“They were kind to me. Think about what that costs.”' },
  { pages: 8, text: '“You keep looking at me as if I might be sorry. I am. It is not the thing you want it to be.”' },
  { pages: 10, text: '“She never asked me to stay. That was the worst of it.”' },
  { pages: 12, text: '“A world with no oaths is a world with no betrayal. Tell me that is not a mercy.”' },
  { pages: 14, text: '“If you find her, tell her I kept the count. All of it. I have not lost a single name.”' },
  { pages: 16, text: '“You have read all of it. Then you know. The crown is not a throne. It is a lid.”' },
];

// ------------------------------------------------------------------ 63: The Unsworn Cipher

export const CIPHER = { symbols: 120, title: 'Cipher-Reader' } as const;

// ------------------------------------------------------------------ 64: Oathcraft

export interface VowCondition { id: string; text: string; title: string; /** Broken when this lifetime counter rises. */ stat?: string; /** Or broken by a check. */ check?: 'zone' | 'favorLoss' | 'poor' | 'alone' | 'level' | 'pet' | 'mount' | 'night' | 'day' }
const vc = (id: string, text: string, title: string, rest: Partial<VowCondition>): VowCondition => ({ id, text, title, ...rest });
// prettier-ignore
export const VOW_CONDITIONS: VowCondition[] = [
  vc('never-kill', 'I will take no life.', 'the Gentle', { stat: 'kills' }),
  vc('never-flee', 'I will not run.', 'the Steadfast', { stat: 'battlesFled' }),
  vc('never-fall', 'I will not fall.', 'the Unfallen', { stat: 'battlesLost' }),
  vc('spend-nothing', 'I will spend nothing.', 'the Frugal', { stat: 'goldSpent' }),
  vc('no-consumables', 'I will use no potion or scroll.', 'the Abstemious', { stat: 'consumablesUsed' }),
  vc('loot-nothing', 'I will take nothing from the dead.', 'the Unlooting', { stat: 'itemsLooted' }),
  vc('spare-elites', 'I will not kill an elite.', 'the Merciful', { stat: 'elitesKilled' }),
  vc('spare-bosses', 'I will not kill a boss.', 'the Sparing', { stat: 'bossesKilled' }),
  vc('spare-giants', 'I will not kill what the roads are named for.', 'the Roadwarden', { stat: 'worldBossesKilled' }),
  vc('never-crit', 'I will strike plainly, never with luck.', 'the Plain', { stat: 'crits' }),
  vc('no-interventions', 'I will not call on a god in battle.', 'the Self-Reliant', { stat: 'interventions' }),
  vc('stay-put', 'I will not leave this region.', 'the Rooted', { check: 'zone' }),
  vc('no-anger', 'I will not anger a god.', 'the Careful', { check: 'favorLoss' }),
  vc('poor', 'I will not hold more than 300 gold.', 'the Poor', { check: 'poor' }),
  vc('alone', 'I will go without companions.', 'the Lone', { check: 'alone' }),
  vc('low-level', 'I will not grow past two more levels.', 'the Unripe', { check: 'level' }),
  vc('no-pet', 'I will walk with no pet.', 'the Unaccompanied', { check: 'pet' }),
  vc('no-mount', 'I will ride nothing.', 'the Walker', { check: 'mount' }),
  vc('night-only', 'I will fight only by night.', 'the Moonlit', { check: 'night' }),
  vc('day-only', 'I will fight only by day.', 'the Sunlit', { check: 'day' }),
];
export interface VowReward { id: string; text: string; mods: ModifierSpec[] }
export const VOW_REWARDS: VowReward[] = [
  { id: 'xp', text: '+20% experience', mods: [m('xpGain', 20)] },
  { id: 'drops', text: '+25% magic find', mods: [m('magicFind', 25)] },
  { id: 'gold', text: '+25% gold find', mods: [m('goldFind', 25)] },
  { id: 'favor', text: '+25% favor gained', mods: [m('favorGain', 25)] },
  { id: 'power', text: '+10% damage', mods: [m('damageBonus', 10)] },
  { id: 'vigor', text: '+10% max HP', mods: [m('maxHp', 10, 'more')] },
];
export const OATHCRAFT = { max: 3, mainPerStretch: 9, keptFavor: 10 } as const;

// ------------------------------------------------------------------ 65: The Forsworn Path

export interface Scar { id: string; name: string; text: string; debuff: ModifierSpec[]; rite: { name: string; text: string; mods: ModifierSpec[] } }
const sc = (id: string, name: string, text: string, debuff: ModifierSpec[], rite: string, rtext: string, mods: ModifierSpec[]): Scar => ({ id: `scar-${id}`, name, text, debuff, rite: { name: rite, text: rtext, mods } });
// prettier-ignore
export const SCARS: Scar[] = [
  sc('mark', 'The Mark on the Palm', 'A white seam where the vow was sealed.', [m('luk', -1)], 'Closed Fist', 'Your next fight: +20% damage.', [m('damageBonus', 20)]),
  sc('tongue', 'The Dry Tongue', 'Your promises taste of ash.', [m('cha', -1)], 'Hard Word', 'Your next fight: enemies are 20% likelier to be Feared.', [m('statusChance', 20)]),
  sc('knee', 'The Stiff Knee', 'It aches on stairs.', [m('speed', -2)], 'Bad Knee, Good Aim', 'Your next fight: +15% accuracy and crit chance.', [m('accuracy', 15), m('critChance', 8)]),
  sc('eye', 'The Clouded Eye', 'You flinch at your reflection.', [m('accuracy', -3)], 'Narrowed Eye', 'Your next fight: +25% crit damage.', [m('critDamage', 25)]),
  sc('ear', 'The Listening Ear', 'You hear your own name in empty rooms.', [m('statusResist', -4)], 'Hear the Debt', 'Your next fight: +15% speed.', [m('speed', 15)]),
  sc('breath', 'The Short Breath', 'The air is thin when you promise anything.', [m('maxMp', -4, 'more')], 'Held Breath', 'Your next fight: skills recover 20% sooner.', [m('cooldownReduction', 20)]),
  sc('heart', 'The Hollow Beat', 'Your heart skips when someone trusts you.', [m('maxHp', -3, 'more')], 'Hollow Courage', 'Your next fight: +20% max HP.', [m('maxHp', 20, 'more')]),
  sc('sleep', 'The Light Sleep', 'You wake at the hour you swore.', [m('hpRegen', -1)], 'Sleepless', 'Your next fight: regain 4 HP each turn.', [m('hpRegen', 4)]),
  sc('shadow', 'The Doubled Shadow', 'It lingers a moment after you stop.', [m('dodge', -2)], 'Shadow’s Step', 'Your next fight: +20% dodge.', [m('dodge', 20)]),
  sc('name', 'The Forgotten Name', 'People pause before they say it.', [m('favorGain', -8)], 'Nameless', 'Your next fight: enemies miss you more (+15% dodge, −10% damage taken).', [m('dodge', 15), m('damageTaken', -10)]),
  sc('grip', 'The Weak Grip', 'Things slip.', [m('physicalAttack', -3, 'more')], 'Iron Grip', 'Your next fight: +25% physical attack.', [m('physicalAttack', 25, 'more')]),
  sc('voice', 'The Cracked Voice', 'Your prayers crack in the middle.', [m('blessingPower', -6)], 'Raised Voice', 'Your next fight: +25% blessing power.', [m('blessingPower', 25)]),
  sc('hand', 'The Unsteady Hand', 'The pen shakes.', [m('magicAttack', -3, 'more')], 'Steady Now', 'Your next fight: +25% magic attack.', [m('magicAttack', 25, 'more')]),
  sc('tooth', 'The Chipped Tooth', 'It whistles in the cold.', [m('goldFind', -6)], 'Bite Down', 'Your next fight: +20% lifesteal.', [m('lifesteal', 20)]),
  sc('skin', 'The Thin Skin', 'It bruises at a word.', [m('defense', -3, 'more')], 'Thick Skin', 'Your next fight: +25% defense.', [m('defense', 25, 'more')]),
  sc('coin', 'The Missing Coin', 'A coin you cannot find, and cannot stop looking for.', [m('magicFind', -6)], 'Lucky Loss', 'Your next fight: +30% magic find.', [m('magicFind', 30)]),
  sc('bell', 'The Silent Bell', 'You can no longer hear the temple bells.', [m('healingReceived', -6)], 'Ring Out', 'Your next fight: +25% healing power.', [m('healingPower', 25)]),
  sc('shackle', 'The Unseen Shackle', 'A weight at one ankle.', [m('speed', -3)], 'Unshackled', 'Your next fight: you act first (+30% speed).', [m('speed', 30)]),
  sc('flame', 'The Dim Candle', 'Your hearth takes longer to catch.', [m('fireDamage', -5)], 'Last Spark', 'Your next fight: +25% fire damage.', [m('fireDamage', 25)]),
  sc('salt', 'The Salt in the Wound', 'It will not heal quite clean.', [m('healingReceived', -4)], 'Salted Earth', 'Your next fight: +25% damage to the wounded (+10% damage, +10% crit).', [m('damageBonus', 10), m('critChance', 10)]),
  sc('scale', 'The Tilted Scale', 'Nothing weighs what it should.', [m('barter', -3)], 'Weighed in Full', 'Your next fight: +20% damage and 10% less taken.', [m('damageBonus', 20), m('damageTaken', -10)]),
  sc('chain', 'The Chain of Ink', 'A thin black line from wrist to elbow.', [m('resourceGain', -6)], 'Break the Line', 'Your next fight: +25% resource gain.', [m('resourceGain', 25)]),
  sc('crown', 'The Phantom Crown', 'A weight on the head that is not there.', [m('xpGain', -8)], 'Wear It', 'Your next fight: +15% to everything (damage, defense).', [m('damageBonus', 15), m('defense', 15, 'more')]),
  sc('mouth', 'The Sewn Mouth', 'You cannot quite say it. Whatever it is.', [m('statusChance', -6)], 'Say It Anyway', 'Your next fight: +30% status chance.', [m('statusChance', 30)]),
];
export const FORSWORN = { scars: 5, title: 'Forsworn', /** Light-domain gods who refuse you. */ refuse: ['solenne', 'aurelis', 'hesha', 'seraphel'] as readonly string[] } as const;

// ------------------------------------------------------------------ 67: Battle Oaths

export interface BattleOathKind { id: 'stagger' | 'status' | 'crit'; text: string; how: string }
export const BATTLE_OATHS: BattleOathKind[] = [
  { id: 'stagger', text: '“I will not fall while my banner stands.”', how: 'Break its stagger to break the oath.' },
  { id: 'status', text: '“I will not yield. I have sworn it on my blade.”', how: 'Afflict it with any harmful status to break the oath.' },
  { id: 'crit', text: '“Nothing that strikes me will strike true.”', how: 'Land a critical hit on it to break the oath.' },
];
export const OATH_BREAKING = { hpBelow: 0.6, defense: -40, magicResist: -40, damage: 25, speed: 15 } as const;
