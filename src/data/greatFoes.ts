import type { BossPhaseDef, BossScriptDef, BossTelegraphDef, EnemyDef } from '../engine/combat/types';
import type { EffectSpec } from '../engine/effects/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import { foe } from './story/helpers';

// ------------------------------------------------------------------ helpers (same shapes as the other boss scripts)

const tel = (skillId: string, every: number, warning: string): BossTelegraphDef => ({ skillId, every, warning });
const phase = (hpPct: number, name: string, text: string, rest: Omit<BossPhaseDef, 'hpPct' | 'name' | 'text'> = {}): BossPhaseDef => ({ hpPct, name, text, ...rest });
const dmg = (value: number): ModifierSpec => ({ stat: 'damageBonus', type: 'flat', value });
const speed = (value: number): ModifierSpec => ({ stat: 'speed', type: 'more', value });
const armor = (value: number): ModifierSpec => ({ stat: 'defense', type: 'percent', value });
const heal = (percentMaxHp: number): EffectSpec => ({ kind: 'heal', percentMaxHp, target: 'self' });
const shield = (percentMaxHp: number): EffectSpec => ({ kind: 'shield', percentMaxHp, target: 'self' });
const st = (hp: number, attack: number, magic: number, defense: number, magicResist: number, speed2: number, extra: Record<string, number> = {}) => ({ hp, attack, magic, defense, magicResist, speed: speed2, ...extra });
const sk = (...ids: string[]) => ids.map((id, i) => (i === 0 ? { id, weight: 2 } : { id }));
const pal = (main: string, accent: string) => ({ main, accent });
const phys = (name: string) => ({ element: 'physical' as const, ranged: false, name });

// ------------------------------------------------------------------ 113-120: the great foes

export const GODS9 = ['solenne', 'morrath', 'kael', 'ysolde', 'vex', 'thalor', 'nymira', 'aurelis', 'hesha'] as const;
/** What each of Mother Ninefold’s nine heads has to say with: a different god’s curse. */
const HEAD_CURSES: Record<(typeof GODS9)[number], [string, string]> = {
  solenne: ['shadow-bolt', 'The Blinding Head'], morrath: ['curse-of-ages', 'The Grave Head'], kael: ['dark-cleave', 'The Wrathful Head'], ysolde: ['goblin-hex', 'The Thorned Head'],
  vex: ['dirty-stab', 'The Laughing Head'], thalor: ['shield-bash', 'The Hammered Head'], nymira: ['grave-chill', 'The Drowning Head'], aurelis: ['chain-lightning-e', 'The Reading Head'], hesha: ['wail', 'The Weeping Head'],
};

export const GREAT_ENEMIES: EnemyDef[] = [
  foe({ id: 'tithe-collector', name: 'The Tithe-Collector', family: 'humanoid', types: ['humanoid', 'bandit', 'collector'], level: 32, tier: 'boss', flags: ['rule:tithe'], stats: st(74, 17, 8, 10, 9, 13, { critChance: 8 }), skills: sk('dirty-stab', 'goblin-hex', 'boss-enrage'), basicAttack: phys('Collection Cane'), description: 'He comes with a ledger, a polite smile and a very large sack. Every blow lightens your purse. Beat him and it comes back, with interest.', palette: pal('#c9a227', '#3a2a14') }),
  foe({ id: 'mother-ninefold', name: 'Mother Ninefold', family: 'drake', types: ['beast', 'hydra', 'god-cursed'], level: 42, tier: 'boss', flags: ['rule:mother'], stats: st(104, 20, 18, 12, 12, 10), resists: { shadow: 30, holy: -15 }, skills: sk('savage-bite', 'grave-chill', 'curse-of-ages', 'boss-enrage'), basicAttack: phys('Nine-Fold Bite'), description: 'Nine heads, nine gods’ curses. The order you sever them in decides the temper of her last stand.', palette: pal('#5b3a6b', '#cf9ae8') }),
  foe({ id: 'cartographer-wyrm', name: 'The Cartographer Wyrm', family: 'drake', types: ['dragon', 'wyrm', 'mapmaker'], level: 38, tier: 'boss', flags: ['rule:wyrm'], stats: st(92, 19, 16, 12, 11, 11), resists: { arcane: 30 }, skills: sk('savage-bite', 'tremor', 'frost-breath', 'boss-enrage'), basicAttack: phys('Compass Fang'), description: 'It draws the world as it would like it to be, and the world obliges. Every third turn the battlefield is redrawn under your feet.', palette: pal('#d8c58a', '#6a4a2a') }),
  foe({ id: 'the-understudy', name: 'The Understudy', family: 'humanoid', types: ['humanoid', 'mimic', 'actor'], level: 34, tier: 'boss', flags: ['rule:understudy'], stats: st(78, 16, 10, 9, 9, 14, { dodge: 8 }), skills: sk('dirty-stab', 'goblin-hex', 'shield-bash', 'boss-enrage'), basicAttack: phys('Borrowed Blade'), description: 'It has been watching you from the wings. Whatever flourish you make, it learns; whatever you do plainly, it cannot. Win by playing badly, on purpose.', palette: pal('#3b3b4f', '#e8e0ff') }),
  foe({ id: 'saint-gallowmere', name: 'Saint Gallowmere', family: 'undead', types: ['undead', 'saint', 'fallen'], level: 58, tier: 'boss', stats: st(118, 22, 22, 14, 14, 11), resists: { holy: 40, shadow: 60 }, skills: sk('dark-cleave', 'grave-chill', 'curse-of-ages', 'void-rend', 'boss-enrage'), basicAttack: phys('Gibbet Hook'), description: 'He was the ninth, and he took a different road. Each of the eight minor saints has a mirror in him, and he wears all eight.', palette: pal('#7a7a8a', '#2a1a3a') }),
  foe({ id: 'last-conductor', name: 'The Last Conductor', family: 'spirit', types: ['spirit', 'choir', 'caster'], level: 50, tier: 'boss', ai: 'caster', row: 'back', flags: ['rule:conductor'], stats: st(98, 10, 24, 11, 15, 13), resists: { shadow: 40, lightning: 20 }, skills: sk('wail', 'shadow-bolt', 'thunderstorm', 'boss-enrage'), basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Baton' }, description: 'It leads the Choir in the Unsworn King’s hymn. The fight keeps its time: four beats, then the downbeat. Dancers and bards can keep time against it.', palette: pal('#2a2a40', '#d8d8ff') }),
  foe({ id: 'grudgebound-emperor', name: 'The Grudgebound Emperor', family: 'humanoid', types: ['humanoid', 'grudgebound', 'emperor'], level: 70, tier: 'boss', flags: ['rule:emperor'], stats: st(150, 26, 24, 16, 15, 12), resists: { shadow: 30, holy: -10 }, skills: sk('dark-cleave', 'void-rend', 'corruption-wave', 'boss-enrage'), basicAttack: phys('Crown of Scars'), description: 'Every grudge you have made, crowned. It rules the three strongest that still live.', palette: pal('#8a1a2a', '#f0c040') }),
  foe({ id: 'sir-remnant', name: 'Sir Remnant', family: 'golem', types: ['construct', 'undead', 'knight', 'oathbound'], level: 30, tier: 'boss', stats: st(86, 18, 6, 15, 8, 8), resists: { physical: 20, lightning: -20 }, skills: sk('shield-bash', 'dark-cleave', 'boss-enrage'), basicAttack: phys('Hollow Sword'), description: 'An empty suit of armor still keeping an oath nobody remembers. It does not want to fight. It does not know what else to do.', palette: pal('#9aa0aa', '#3a3a4a') }),

  foe({ id: 'pale-auditor', name: 'The Pale Auditor', family: 'humanoid', types: ['humanoid', 'nameless', 'auditor'], level: 54, tier: 'boss', stats: st(110, 21, 22, 13, 15, 11), resists: { shadow: 40, holy: 10 }, skills: sk('curse-of-ages', 'void-rend', 'dark-cleave', 'boss-enrage'), basicAttack: phys('Quill of Account'), description: 'The Nameless One’s tax collector. He does not hate you. He is simply owed.', palette: pal('#d8d8e0', '#2a2a40') }),
  // Mother Ninefold’s nine heads (each a god’s curse; severing them in order sets her last phase).
  ...GODS9.map((g) =>
    foe({ id: `ninefold-head-${g}`, name: HEAD_CURSES[g][1], family: 'drake', types: ['beast', 'hydra', 'head'], level: 42, row: 'back', flags: ['rule:head'], stats: st(20, 12, 14, 6, 8, 12), skills: sk(HEAD_CURSES[g][0]), basicAttack: phys(`${g[0]!.toUpperCase()}${g.slice(1)}’s Curse`), description: `One of Mother Ninefold’s nine heads, speaking with the curse of ${g}.`, palette: pal('#5b3a6b', '#cf9ae8') }),
  ),
];

/** Mother Ninefold arrives with all nine heads. */
export const NINEFOLD_GROUP = ['mother-ninefold', ...GODS9.map((g) => `ninefold-head-${g}`)];

// ------------------------------------------------------------------ 121-126: enemy families

// prettier-ignore
export const FAMILY_ENEMIES: EnemyDef[] = [
  // The Oathless: the Unsworn King’s soldiers. Divine damage does nothing to them.
  foe({ id: 'oathless-soldier', name: 'Oathless Soldier', family: 'humanoid', types: ['humanoid', 'oathless', 'unsworn'], level: 44, flags: ['rule:oathless'], stats: st(80, 20, 6, 13, 12, 11), resists: { holy: 100, physical: 10 }, skills: sk('dark-cleave', 'shield-bash'), basicAttack: phys('Unsworn Blade'), description: 'No god has a hold on him, and so none can strike him. Holy light passes through like wind through a net.', palette: pal('#4a4a5a', '#c0c0d0') }),
  foe({ id: 'oathless-standard-bearer', name: 'Oathless Standard-Bearer', family: 'humanoid', types: ['humanoid', 'oathless', 'unsworn'], level: 46, row: 'back', ai: 'support', flags: ['rule:oathless'], stats: st(66, 12, 16, 10, 14, 11), resists: { holy: 100, shadow: 20 }, skills: sk('mend-ally', 'wail'), basicAttack: phys('Banner Pole'), description: 'The banner is blank. It is the one thing about him that offends the gods.', palette: pal('#5a5a6a', '#e0e0f0') }),
  foe({ id: 'oathless-captain', name: 'Oathless Captain', family: 'humanoid', types: ['humanoid', 'oathless', 'unsworn'], level: 50, tier: 'elite', flags: ['rule:oathless'], stats: st(104, 24, 8, 15, 13, 12), resists: { holy: 100, physical: 15 }, skills: sk('dark-cleave', 'void-rend', 'shield-bash'), basicAttack: phys('Unsworn Greatsword'), description: 'He swore no oath, and he has never once been tempted to.', palette: pal('#3a3a4a', '#d0d0e0') }),
  // Inkwraiths: spilled ink that copies glyphs.
  foe({ id: 'ink-blot', name: 'Ink Blot', family: 'spirit', types: ['spirit', 'inkwraith', 'ooze'], level: 34, flags: ['rule:ink'], stats: st(50, 12, 12, 5, 10, 12), resists: { physical: 30, arcane: -20 }, skills: sk('shadow-bolt'), basicAttack: phys('Splatter'), description: 'A stain that has decided to move. It copies whatever it sees written.', palette: pal('#14142a', '#6a6aff') }),
  foe({ id: 'inkwraith-scribe', name: 'Inkwraith Scribe', family: 'spirit', types: ['spirit', 'inkwraith', 'caster'], level: 36, ai: 'caster', row: 'back', flags: ['rule:ink'], stats: st(46, 6, 18, 6, 12, 12), resists: { shadow: 30 }, skills: sk('shadow-bolt', 'curse-of-ages'), basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Quill-Jab' }, description: 'Writes your name backwards, slowly, in the air.', palette: pal('#0a0a20', '#9a9aff') }),
  foe({ id: 'inkwraith-matriarch', name: 'Inkwraith Matriarch', family: 'spirit', types: ['spirit', 'inkwraith', 'caster'], level: 40, tier: 'elite', ai: 'caster', flags: ['rule:ink'], stats: st(90, 10, 22, 8, 14, 12), resists: { shadow: 40, physical: 25 }, skills: sk('shadow-bolt', 'grave-chill', 'curse-of-ages'), basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Flood of Ink' }, description: 'The first spill. She remembers every page she has ever ruined.', palette: pal('#08081a', '#7a7aff') }),
  // Clocktide Automatons: they tick on fixed patterns.
  foe({ id: 'clocktide-sentry', name: 'Clocktide Sentry', family: 'golem', types: ['construct', 'clocktide'], level: 46, flags: ['rule:clocktide'], stats: st(86, 20, 0, 16, 10, 9), resists: { physical: 20, lightning: -25 }, skills: sk('shield-bash'), basicAttack: phys('Escapement Fist'), description: 'Attack, attack, guard, strike. It has done it for centuries and it is not tired.', palette: pal('#b08a4a', '#4a3a1a') }),
  foe({ id: 'clocktide-gunner', name: 'Clocktide Gunner', family: 'golem', types: ['construct', 'clocktide'], level: 48, row: 'back', flags: ['rule:clocktide'], stats: st(66, 22, 0, 10, 8, 10), resists: { lightning: -25 }, skills: sk('piercing-volley'), basicAttack: { element: 'physical', ranged: true, name: 'Spring-Rifle' }, description: 'Attack, guard, attack, volley. The volley is a kindness: it always comes on the fourth tick.', palette: pal('#a07a3a', '#2a1a0a') }),
  foe({ id: 'clocktide-warden', name: 'Clocktide Warden', family: 'golem', types: ['construct', 'clocktide'], level: 52, tier: 'elite', flags: ['rule:clocktide'], stats: st(112, 24, 0, 18, 11, 9), resists: { physical: 25, lightning: -30 }, skills: sk('earthshatter'), basicAttack: phys('Hour-Hammer'), description: 'Three blows, a guard, and then the whole floor. Plan your turns around it.', palette: pal('#c09a4a', '#3a2a0a') }),
  // Saltghouls: drowned dead that swell when wet.
  foe({ id: 'saltghoul', name: 'Saltghoul', family: 'undead', types: ['undead', 'saltghoul', 'drowned'], level: 38, flags: ['rule:ghoul'], stats: st(68, 17, 4, 9, 7, 10), resists: { ice: 50, fire: -20, lightning: -20 }, skills: sk('savage-bite'), basicAttack: phys('Brine-Claw'), description: 'Drowned and salted. In the rain it swells and hits like a tide.', palette: pal('#7a9aa0', '#2a3a40') }),
  foe({ id: 'brine-ghoul', name: 'Brine Ghoul', family: 'undead', types: ['undead', 'saltghoul', 'drowned'], level: 40, flags: ['rule:ghoul'], stats: st(72, 18, 8, 9, 9, 10), resists: { ice: 50, fire: -20 }, skills: sk('tidal-wave', 'grave-chill'), basicAttack: phys('Salted Grip'), description: 'It brings the sea with it, in a small way, down its back.', palette: pal('#6a8a90', '#1a2a30') }),
  foe({ id: 'saltghoul-reaver', name: 'Saltghoul Reaver', family: 'undead', types: ['undead', 'saltghoul', 'drowned'], level: 44, tier: 'elite', flags: ['rule:ghoul'], stats: st(100, 22, 6, 12, 9, 11), resists: { ice: 60, fire: -25, lightning: -25 }, skills: sk('cutlass-flurry', 'savage-bite'), basicAttack: phys('Barnacled Cutlass'), description: 'It was a captain once. It still gives orders, to the tide.', palette: pal('#5a7a80', '#0a1a20') }),
  // Lantern Moths: swarms that eat your light.
  foe({ id: 'lantern-moth', name: 'Lantern Moth', family: 'insect', types: ['beast', 'insect', 'moth', 'lantern-moth'], level: 24, flags: ['rule:moth'], stats: st(30, 9, 4, 3, 6, 15, { dodge: 12 }), resists: { fire: -30 }, skills: sk('goblin-hex'), basicAttack: phys('Dust-Wing'), description: 'They drink light by the lumen. Your lamp is a dinner bell.', palette: pal('#e8d8a0', '#6a5a2a') }),
  foe({ id: 'moth-swarm', name: 'Moth Swarm', family: 'insect', types: ['beast', 'insect', 'moth', 'lantern-moth'], level: 26, flags: ['rule:moth'], stats: st(44, 11, 6, 4, 6, 14, { dodge: 10 }), resists: { fire: -35, physical: 20 }, skills: sk('goblin-hex', 'wail'), basicAttack: phys('Flutter'), description: 'A single dust-coloured cloud, with a hundred small hungers.', palette: pal('#d8c890', '#5a4a1a') }),
  foe({ id: 'lantern-moth-queen', name: 'Lantern-Moth Queen', family: 'insect', types: ['beast', 'insect', 'moth', 'lantern-moth'], level: 30, tier: 'elite', flags: ['rule:moth'], stats: st(78, 14, 12, 6, 9, 13, { dodge: 8 }), resists: { fire: -35 }, skills: sk('shadow-bolt', 'goblin-hex'), basicAttack: phys('Powdered Wing'), description: 'She glows, faintly. It is bait, and she knows it, and she does not mind.', palette: pal('#f0e0a0', '#7a6a2a') }),
  // Hollowed Pilgrims: worshippers of dead gods (they come in the Twilight arc).
  foe({ id: 'hollowed-pilgrim', name: 'Hollowed Pilgrim', family: 'humanoid', types: ['humanoid', 'hollowed', 'pilgrim'], level: 60, stats: st(96, 22, 14, 13, 14, 11), resists: { holy: -20, shadow: 20 }, skills: sk('dark-cleave', 'curse-of-ages'), basicAttack: phys('Pilgrim’s Staff'), description: 'Still walking to a shrine whose god has died. They have not yet been told.', palette: pal('#8a8a7a', '#3a3a2a') }),
  foe({ id: 'hollowed-penitent', name: 'Hollowed Penitent', family: 'humanoid', types: ['humanoid', 'hollowed', 'pilgrim'], level: 62, row: 'back', ai: 'caster', stats: st(78, 10, 22, 11, 16, 11), resists: { holy: -25, shadow: 25 }, skills: sk('wail', 'shadow-bolt', 'corruption-wave'), basicAttack: { element: 'shadow', ranged: true, magic: true, name: 'Penance' }, description: 'Prays to the empty place in the sky, with great feeling and no hope.', palette: pal('#7a7a6a', '#2a2a1a') }),
  foe({ id: 'hollowed-prior', name: 'Hollowed Prior', family: 'humanoid', types: ['humanoid', 'hollowed', 'pilgrim'], level: 66, tier: 'elite', stats: st(130, 26, 18, 15, 16, 11), resists: { holy: -25, shadow: 30 }, skills: sk('dark-cleave', 'void-rend', 'curse-of-ages'), basicAttack: phys('Reliquary Mace'), description: 'The last priest of a god who left no heir, and a flock of one.', palette: pal('#9a9a8a', '#3a3a2a') }),
];

// ------------------------------------------------------------------ boss scripts

// prettier-ignore
export const GREAT_SCRIPTS: BossScriptDef[] = [
  { id: 'tithe-collector', phases: [phase(50, 'Late Fees', '“Oh, dear. You are in arrears.” His rod comes down a good deal harder.', { modifiers: [dmg(20)] })], telegraphs: [tel('crushing-blow', 5, 'The Tithe-Collector opens his ledger and licks his pen…')] },
  { id: 'mother-ninefold', phases: [phase(60, 'The Heads Awake', 'Every head speaks at once, in different tongues.', { modifiers: [dmg(10)] })], telegraphs: [tel('grave-toll', 5, 'Nine mouths draw breath together…')] },
  { id: 'cartographer-wyrm', phases: [phase(50, 'New Edition', 'The Wyrm tears out a page and the room is redrawn.', { modifiers: [dmg(15)], effects: [shield(10)] })], telegraphs: [tel('glacial-tomb', 5, 'The Wyrm sketches a border of ice around you…')] },
  { id: 'the-understudy', phases: [phase(40, 'Improvisation', 'The Understudy drops the script.', { modifiers: [speed(15)] })], telegraphs: [tel('piercing-volley', 5, 'The Understudy strikes a pose it has learned from you…')] },
  { id: 'saint-gallowmere', phases: [
    phase(88, 'Unburdened Ferry', 'Saint Wenlock’s mirror: a ferry that carries no one.', { modifiers: [dmg(5)] }),
    phase(76, 'The Root Unforgiving', 'Saint Orrel’s mirror: the forest remembers every cut.', { modifiers: [armor(10)] }),
    phase(64, 'Candle Snuffer', 'Saint Brenna’s mirror: the dark is put back, carefully.', { effects: [shield(8)] }),
    phase(52, 'Dust That Drinks', 'Saint Qadir’s mirror: the sea of ash comes for the barefoot.', { modifiers: [speed(10)] }),
    phase(40, 'The Long Night Sleeps You', 'Saint Ysmay’s mirror: the winter lies down on top of you.', { modifiers: [dmg(10)] }),
    phase(28, 'The Door Opens Inward', 'Saint Corvane’s mirror: the tide is let in.', { effects: [heal(8)] }),
    phase(16, 'Blood Left on the Anvil', 'Saint Hruldar’s mirror: the forge is fed.', { modifiers: [dmg(15)] }),
    phase(8, 'The Name Eats the Citadel', 'Saint Nul’s mirror: he remembers you instead.', { modifiers: [dmg(20), speed(15)] }),
  ], telegraphs: [tel('doom-mark', 5, 'Saint Gallowmere raises the gibbet, and the rope has your name on it…')] },
  { id: 'last-conductor', phases: [phase(50, 'Crescendo', 'The whole Choir rises behind him, singing.', { modifiers: [dmg(15), speed(10)] })], telegraphs: [tel('unmaking', 4, 'The Conductor’s baton lifts on the downbeat…')] },
  { id: 'grudgebound-emperor', phases: [phase(60, 'The Court Assembles', 'Three scarred courtiers close ranks around the throne.', { modifiers: [dmg(15)] }), phase(30, 'Crown of Scars', 'The crown bleeds. The Emperor laughs.', { modifiers: [dmg(25)], effects: [heal(10)] })], telegraphs: [tel('final-judgment', 5, 'The Emperor lifts a hand, and every grudge you have made lifts with it…')] },
  { id: 'pale-auditor', phases: [phase(50, 'Final Reckoning', 'The ledger closes. The Auditor opens a second one.', { modifiers: [dmg(20)], effects: [shield(10)] })], telegraphs: [tel('doom-mark', 5, 'The Pale Auditor totals a column, and your name is at the foot of it…')] },
  { id: 'sir-remnant', phases: [phase(50, 'The Oath Remembered', '“I swore… I swore to hold this door.” The armor straightens.', { modifiers: [armor(10)] })], telegraphs: [tel('crushing-blow', 6, 'Sir Remnant lifts the sword with great, slow sorrow…')] },
];

// ------------------------------------------------------------------ where the great foes are found

export interface GreatFoe {
  id: string;
  enemy: string;
  /** The region you must stand in to seek them. */
  zone: string;
  /** Enemies fought first (the boss comes last). */
  waves: string[][];
  boss?: string;
  title: string;
  boon: ModifierSpec;
  boonText: string;
  hint: string;
  goldPerLevel: number;
}
const flat = (stat: string, value: number): ModifierSpec => ({ stat, type: 'flat', value } as ModifierSpec);
const more = (stat: string, value: number): ModifierSpec => ({ stat, type: 'more', value } as ModifierSpec);
// prettier-ignore
export const GREAT_FOES: GreatFoe[] = [
  { id: 'tithe-collector', enemy: 'tithe-collector', zone: 'aurelane', waves: [], boss: 'tithe-collector', title: 'Paid in Full', boon: more('goldFind', 8), boonText: '+8% gold found.', hint: 'He haunts the capital’s counting-houses.', goldPerLevel: 70 },
  { id: 'mother-ninefold', enemy: 'mother-ninefold', zone: 'moonfen', waves: [NINEFOLD_GROUP], title: 'Nine Silenced', boon: more('statusResist', 10), boonText: '+10% status resist.', hint: 'Nine heads in the deep fen. Mind the order.', goldPerLevel: 90 },
  { id: 'cartographer-wyrm', enemy: 'cartographer-wyrm', zone: 'frostspire', waves: [], boss: 'cartographer-wyrm', title: 'Off the Map', boon: flat('speed', 3), boonText: '+3 speed.', hint: 'It nests above the glacier’s edge, where the maps end.', goldPerLevel: 80 },
  { id: 'the-understudy', enemy: 'the-understudy', zone: 'ashen-desert', waves: [], boss: 'the-understudy', title: 'Played Badly, Won Well', boon: more('xpGain', 4), boonText: '+4% XP.', hint: 'Waiting in the wings of a desert theatre.', goldPerLevel: 70 },
  { id: 'saint-gallowmere', enemy: 'saint-gallowmere', zone: 'dark-citadel', waves: [], boss: 'saint-gallowmere', title: 'Ninth Saint’s Bane', boon: flat('damageBonus', 3), boonText: '+3 damage.', hint: 'In the Citadel’s forgotten chapel.', goldPerLevel: 110 },
  { id: 'last-conductor', enemy: 'last-conductor', zone: 'gloamwood', waves: [], boss: 'last-conductor', title: 'Kept Time', boon: more('favorGain', 8), boonText: '+8% favor gained.', hint: 'Where the Choir last sang, in the gloaming.', goldPerLevel: 95 },
  { id: 'grudgebound-emperor', enemy: 'grudgebound-emperor', zone: '', waves: [], boss: 'grudgebound-emperor', title: 'Emperor of Nothing', boon: flat('maxHp', 60), boonText: '+60 max HP.', hint: 'Needs three Grudgebound still alive. Seek him anywhere.', goldPerLevel: 140 },
  { id: 'sir-remnant', enemy: 'sir-remnant', zone: 'hollow-barrows', waves: [], boss: 'sir-remnant', title: 'Let Him Rest', boon: more('healingReceived', 6), boonText: '+6% healing received.', hint: 'Standing guard at a door in the Hollow Barrows. He can be talked into rest.', goldPerLevel: 60 },
];

// ------------------------------------------------------------------ 150: Choir Defectors

export const DEFECTOR_NAMES = ['Wren the Tenor', 'Pell the Alto', 'Orrin the Bass', 'Sive the Soprano', 'Dunmore the Cantor', 'Isa the Chorister', 'Hob the Precentor', 'Lark the Treble'];
// prettier-ignore
export const DEFECTORS: EnemyDef[] = DEFECTOR_NAMES.map((name, i) =>
  foe({ id: `choir-defector-${i + 1}`, name, family: 'humanoid', types: ['humanoid', 'choir', 'defector'], level: 26 + (i % 4), flags: ['rule:defector'], ai: i % 2 ? 'caster' : 'aggressive', row: i % 2 ? 'back' : 'front', stats: st(52 + i, 14, 12, 8, 9, 11), resists: { shadow: 20 }, skills: sk(i % 2 ? 'shadow-bolt' : 'dark-cleave', 'wail'), basicAttack: i % 2 ? { element: 'shadow', ranged: true, magic: true, name: 'Held Note' } : phys('Tuning Fork'), description: `${name} sings in the Unsworn King’s Choir, and is tired of the hymn. Talk to ${i % 2 ? 'her' : 'them'}, and they may walk out.`, palette: pal('#4a4a6a', '#c8c8e8') }),
);
export const DEFECTOR_GROUPS: string[][] = [[1, 2], [3, 4], [5, 6], [7, 8]].map(([a, b]) => [`choir-defector-${a}`, `choir-defector-${b}`]);
