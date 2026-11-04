import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 77: Blood Prejudice

export const ATTITUDES = ['Hostile', 'Wary', 'Neutral', 'Friendly', 'Welcoming'] as const;
/** Price change (percent) by attitude, Hostile to Welcoming. */
export const ATTITUDE_PRICE = [20, 8, 0, -4, -8] as const;
export const PREJUDICE: Record<string, { welcome: string[]; hostile: string[] }> = {
  brightwater: { welcome: ['human', 'hearthfolk', 'elf'], hostile: ['orc', 'revenant', 'shadekin'] },
  thornwick: { welcome: ['wood-elf', 'beastkin', 'human'], hostile: ['ashborn', 'forged', 'dragon'] },
  sandhaven: { welcome: ['ashborn', 'scaleborn', 'orc'], hostile: ['tidekin', 'fae', 'elf'] },
  frosthold: { welcome: ['dwarf', 'giant', 'human'], hostile: ['ashborn', 'fae', 'scaleborn'] },
  saltmere: { welcome: ['tidekin', 'human', 'gnome'], hostile: ['ashborn', 'orc', 'revenant'] },
  aurelane: { welcome: ['elf', 'nephilim', 'human'], hostile: ['orc', 'revenant', 'beastkin'] },
  mirewick: { welcome: ['scaleborn', 'tidekin', 'revenant'], hostile: ['nephilim', 'elf', 'human'] },
  briarhold: { welcome: ['wood-elf', 'fae', 'beastkin'], hostile: ['forged', 'dwarf', 'giant'] },
  khazrum: { welcome: ['dwarf', 'forged', 'gnome'], hostile: ['fae', 'wood-elf', 'tidekin'] },
  lampfall: { welcome: ['gnome', 'hearthfolk', 'human'], hostile: ['revenant', 'shadekin', 'dragon'] },
  lensfall: { welcome: ['forged', 'gnome', 'elf'], hostile: ['beastkin', 'orc', 'ashborn'] },
  pearlgate: { welcome: ['tidekin', 'elf', 'dragon'], hostile: ['dwarf', 'ashborn', 'orc'] },
  ratchet: { welcome: ['forged', 'dwarf', 'gnome'], hostile: ['fae', 'wood-elf', 'primordial'] },
  ashfold: { welcome: ['ashborn', 'revenant', 'orc'], hostile: ['nephilim', 'human', 'elf'] },
  wrecksend: { welcome: ['orc', 'beastkin', 'shadekin'], hostile: ['nephilim', 'dragon', 'forged'] },
};

// ------------------------------------------------------------------ 81: Class Rivals

export interface ClassRival { cls: string; name: string; title: string; line: string }
const cr = (cls: string, name: string, title: string, line: string): ClassRival => ({ cls, name, title, line });
// prettier-ignore
export const CLASS_RIVALS: ClassRival[] = [
  cr('warrior', 'Brannoc Ironvow', 'the Other Sword', '“You fight like someone who has read about it.”'), cr('mage', 'Vellis Thorn', 'of the Lesser Library', '“I read your last paper. The footnotes were my favorite part.”'),
  cr('rogue', 'Ressa Quickfingers', 'the Second-Best Thief', '“Your purse is lighter than you think. Do not check.”'), cr('cleric', 'Brother Aldous Pyne', 'of the Louder Prayer', '“We pray at different volumes, you and I.”'),
  cr('ranger', 'Taliesin Grey', 'the Quiet Archer', '“I was in this tree before you arrived.”'), cr('necromancer', 'Morwen Ash', 'the Politer Grave-Keeper', '“We have the same clients. Mine are more cooperative.”'),
  cr('monk', 'Ji-Ren', 'of the Opposite Mountain', '“Your stillness is very loud.”'), cr('bard', 'Dandy Lark', 'the Better-Rhymed', '“I wrote a verse about you. It does not scan, and neither do you.”'),
  cr('knight', 'Ser Aubrey Vale', 'of the Paler Banner', '“We serve the same cause. Only one of us has a horse.”'), cr('druid', 'Hollin Moss', 'of the Greener Grove', '“The forest has been telling me about you.”'),
  cr('warlock', 'Cassimir Veil', 'Who Owes Less', '“Nobody owns me. Well. Almost nobody.”'), cr('summoner', 'Pip of the Many', 'Who Brought More', '“Meet my friends. All forty of them.”'),
  cr('alchemist', 'Dr. Oyelaran Kess', 'of the Cleaner Flask', '“Your formula has a typo. It will explode. Only slightly.”'), cr('shaman', 'Kuna Redhand', 'the Elder Voice', '“The spirits mentioned you. They were not impressed.”'),
  cr('chronomancer', 'Hesper Late', 'Who Was Already Here', '“We have had this conversation. You lost. We are about to have it again.”'), cr('artificer', 'Odo Tinkersworth', 'of the Better Gears', '“I would offer to fix that, but I have seen your work.”'),
  cr('dancer', 'Sylvie Twice', 'the Last Step', '“You are a half-beat late. I counted.”'), cr('inkweaver', 'Calla Blot', 'of the Bolder Line', '“Your lines are tidy. That is the problem.”'),
  cr('witchhunter', 'Magistrate Holloway', 'the Righter Hand', '“I do not hate casters. I hate being right so often.”'), cr('geomancer', 'Terrance Bedrock', 'the Deeper Root', '“The ground liked me first.”'),
];
export const CLASS_RIVAL = { milestones: [10, 25, 40, 60], goldPerLevel: 50, title: 'Rival-Settler' } as const;

// ------------------------------------------------------------------ 78: Forged Modules

export interface ForgedModule { id: string; name: string; text: string; mods: ModifierSpec[]; cost: number }
const fm = (id: string, name: string, text: string, mods: ModifierSpec[], cost = 300): ForgedModule => ({ id: `mod-${id}`, name, text, mods, cost });
// prettier-ignore
export const MODULES: ForgedModule[] = [
  fm('servo', 'Servo Arm', 'A second joint at the elbow.', [m('physicalAttack', 6, 'more')]), fm('lens', 'Targeting Lens', 'A circle of glass in the left eye.', [m('accuracy', 10)]),
  fm('plate', 'Plating', 'Riveted over the old plating.', [m('defense', 6, 'more')]), fm('core', 'Heat Core', 'A little furnace under the ribs.', [m('fireDamage', 10), m('maxHp', 3, 'more')]),
  fm('coil', 'Spark Coil', 'It hums when you are angry.', [m('lightningDamage', 10)]), fm('gyro', 'Gyroscope', 'Keeps you upright. Mostly.', [m('dodge', 5)]),
  fm('pump', 'Coolant Pump', 'A steady drip behind the neck.', [m('hpRegen', 2)]), fm('vent', 'Pressure Vent', 'It whistles at the right moment.', [m('speed', 6)]),
  fm('speaker', 'Voice Box', 'A better one, borrowed from a bell.', [m('cha', 2)]), fm('ears', 'Listening Plate', 'Tuned to the quiet.', [m('critChance', 4)]),
  fm('hand', 'Fine Hand', 'Tiny tools folded in the fingers.', [m('magicFind', 8)]), fm('purse', 'Hidden Cache', 'A compartment where a heart ought to be.', [m('goldFind', 10)]),
  fm('shield', 'Ward Plate', 'Runed on the inside.', [m('magicResist', 8, 'more')]), fm('mind', 'Logic Engine', 'It argues with you in your sleep.', [m('magicAttack', 6, 'more')]),
  fm('lung', 'Bellows', 'You do not need to breathe, and breathe anyway.', [m('maxMp', 8, 'more')]), fm('spine', 'Reinforced Spine', 'Straighter than before.', [m('maxHp', 6, 'more')]),
  fm('chrono', 'Chronometer', 'It keeps time against your will.', [m('cooldownReduction', 6)]), fm('shock', 'Shock Absorbers', 'In the knees and the elbows.', [m('damageTaken', -4)]),
  fm('amp', 'Resonance Amp', 'It makes every blessing a little louder.', [m('blessingPower', 8)]), fm('seal', 'Sealed Joints', 'Poison does not get in.', [m('statusResist', 10)]),
  fm('blade', 'Wrist Blade', 'It slides out with a small, polite sound.', [m('damageBonus', 6)]), fm('scan', 'Scanner', 'A lens that sees what is worth seeing.', [m('xpGain', 8)]),
  fm('vamp', 'Siphon', 'It feeds on what it hits.', [m('lifesteal', 3)]), fm('relay', 'Prayer Relay', 'Sends your thanks upward, in bulk.', [m('favorGain', 10)]),
];
export const FORGED = { race: 'forged', slots: 4, maxLevel: 3, upgradeMult: 0.6 } as const;

// ------------------------------------------------------------------ 76: Origin Rivals

export interface OriginFigure { bg: string; id: string; name: string; title: string }
// prettier-ignore
export const ORIGIN_FIGURES: OriginFigure[] = [
  { bg: 'soldier', id: 'varn-hollis', name: 'Sergeant Varn Hollis', title: 'your old sergeant' }, { bg: 'acolyte', id: 'prior-edwin', name: 'Prior Edwin', title: 'who taught you the words' },
  { bg: 'street-urchin', id: 'mother-slate', name: 'Mother Slate', title: 'the gang boss' }, { bg: 'noble-scion', id: 'lady-cordelia', name: 'Lady Cordelia Vance', title: 'your cousin' },
  { bg: 'scholar', id: 'magister-yoren', name: 'Magister Yoren', title: 'your old advisor' }, { bg: 'hunter', id: 'old-harl', name: 'Old Harl', title: 'who taught you the trails' },
  { bg: 'sailor', id: 'captain-roake', name: 'Captain Bess Roake', title: 'your old captain' }, { bg: 'smith-apprentice', id: 'master-brannig', name: 'Master Brannig', title: 'your master' },
  { bg: 'gravedigger', id: 'sexton-pell', name: 'Sexton Pell', title: 'the other digger' }, { bg: 'merchant', id: 'guildman-corvin', name: 'Guildman Corvin', title: 'your rival in trade' },
  { bg: 'exile', id: 'lord-ansgar', name: 'Lord Ansgar', title: 'who sent you away' }, { bg: 'circus-performer', id: 'madame-zephyrine', name: 'Madame Zephyrine', title: 'the ringmaster' },
];
export const ORIGIN_SCENES = [
  '{name}, {title}, turns up on the road, older and no kinder: “I thought it might be you.”',
  '{name} sends word through a stranger: a message that is half apology and half bill.',
  '{name} is in the next town, and somebody has told them exactly where you will be.',
  '{name} arrives at an awkward moment with an offer that is certainly a trap.',
  '{name} waits at a crossroads, alone, which is more worrying than a crowd.',
  '{name} finds you at last, tired. “I have been following your name for years.”',
];
export const ORIGIN_CULPRIT = '{name} is the one who set you up. They say so themselves, almost kindly.';
export const ORIGIN = { confrontGoldPerLevel: 40, forgiveFavor: 10, forgiveGod: 'hesha', culpritStretch: 3, title: 'Settled With Your Past' } as const;

// ------------------------------------------------------------------ 70: Rival Apostles

export const RIVAL_APOSTLES: Record<string, { name: string; relic: string }> = {
  solenne: { name: 'Ser Lucan Brightmantle', relic: 'the Sunstone of Noon' }, aurelis: { name: 'Brother Tobias Inkwell', relic: 'the Unburnt Folio' },
  hesha: { name: 'Matron Dorrit', relic: 'the Everwarm Kettle' }, kael: { name: 'Gorm Skullsplitter', relic: 'the Champion’s Gauntlet' },
  ysolde: { name: 'Wren Greenhand', relic: 'the Heartwood Seed' }, lyssara: { name: 'Sister Ophelie Drowse', relic: 'the Pillow of Slow Hours' },
  nymira: { name: 'Captain Thalassa Brine', relic: 'the Tide-Bell' }, vex: { name: 'Jinx Dallowmere', relic: 'the Third Card' },
  seraphel: { name: 'Zephyrine Gale', relic: 'the Weathervane of Nowhere' }, thalor: { name: 'Master Orrin Hammerfall', relic: 'the First Rivet' },
  grimvald: { name: 'Lord Treasurer Fenwick', relic: 'the Gilded Ledger' }, ordrun: { name: 'Hold-Keeper Brann', relic: 'the Cornerstone' },
  morrath: { name: 'Pale Sister Lenore', relic: 'the Last Candle' }, mirrin: { name: 'The Man Who Was Early', relic: 'the Cracked Hourglass' },
};
export const APOSTLES = { allyAt: 3, enemyAt: -3, helpGoldPerLevel: 50, relicGoldPerLevel: 80, loseGoldPerLevel: 10, title: 'Friend of Rivals' } as const;

// ------------------------------------------------------------------ 71: The Ninth Saint

export const SAINT = { goldPerLevel: 400, max: 3, needBuilding: 'chapel', pairs: [['maxHp', 'hpRegen'], ['physicalAttack', 'critChance'], ['magicAttack', 'cooldownReduction'], ['defense', 'dodge'], ['healingPower', 'blessingPower'], ['luk', 'magicFind'], ['speed', 'accuracy'], ['xpGain', 'goldFind']] as readonly (readonly [string, string])[], title: 'Maker of Saints' } as const;

// ------------------------------------------------------------------ 80: Conjunctions

export const CONJUNCTION = { power: [m('damageBonus', 15), m('xpGain', 10), m('luk', 3)], vigilMinutes: 180, maxVigils: 4, rewardFraction: 0.5, goldPerLevel: 30 } as const;
