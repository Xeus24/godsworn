import type { DungeonDef, EncounterGroup } from '../engine/world/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import type { AreaDef, AreaTheme } from './world/areas';
import { foes, type FoeRow } from './regions/foes';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const g = (weight: number, ...ids: string[]): EncounterGroup => ({ weight, enemies: ids.map((raw) => (raw.startsWith('^') ? { enemyId: raw.slice(1), row: 'back' as const } : { enemyId: raw })) });

// ------------------------------------------------------------------ Section I-8a: two realms off the road (items 224, 225)

/** [id, name, host zone, theme, biome, description, lore] */
type Row = [id: string, name: string, zone: string, theme: AreaTheme, biome: AreaDef['biome'], description: string, lore: string];
// prettier-ignore
const COURT_ROWS: Row[] = [
  ['gloaming-ring', 'The Mushroom Ring', 'gloamwood', 'grove', 'forest', 'A ring of pale caps that opens only at night. Step in politely.', 'The ring is a door, and a courtesy. It lets in anyone who knocks after dark, and has opinions about the knocking.'],
  ['thistle-market', 'The Thistle Market', 'gloamwood', 'camp', 'forest', 'Stalls of glamour, small favors and sealed jars. Everything is priced in something you did not know you had.', 'The stall-keepers never say “no”. They say “not at that price”, which is worse.'],
  ['moonlit-orchard', 'The Moonlit Orchard', 'gloamwood', 'grove', 'forest', 'Silver apples on trees that bear every season at once. Do not eat the second one.', 'The first apple is a gift. The second is a contract. The orchard is very consistent about this.'],
  ['court-of-whispers', 'The Court of Whispers', 'gloamwood', 'ruin', 'forest', 'A court of long tables and quiet voices, where every sentence is a clause.', 'Nobody here lies. They simply arrange the truth until it fits the shape they need.'],
  ['weavers-pool', 'The Weaver’s Pool', 'gloamwood', 'shore', 'forest', 'A still pool where the Court’s true names are kept, one thread each.', 'Pull a thread and a name comes loose. Whose, the pool will not say.'],
  ['hollow-hill-gate', 'The Hollow Hill', 'gloamwood', 'peak', 'forest', 'A green hill with a door where no door should be, and a doorman who has been waiting for you specifically.', 'The hill is hollow because the Queen is not. She fills it by being displeased.'],
];
// prettier-ignore
const THRESHOLD_ROWS: Row[] = [
  ['ember-gate', 'The Ember Gate', 'volcanic-rift', 'ruin', 'volcanic', 'An arch of black glass with a fire standing in it, patient as a doorman.', 'The Gate has been open since the first spark. It remembers every hand that warmed itself there.'],
  ['cinder-causeway', 'The Cinder Causeway', 'volcanic-rift', 'peak', 'volcanic', 'A road of coals that does not burn those who walk it as if they meant to.', 'The causeway hums. It is a long, low note, and it is the sound of a very large thing banked down.'],
  ['burning-court', 'The Burning Court', 'volcanic-rift', 'camp', 'volcanic', 'A hall of flame where the Warden of Ember holds an audience with itself.', 'The Warden takes visitors one at a time. It is not a kindness.'],
  ['tide-gate', 'The Tidegate', 'stormcoast', 'shore', 'coast', 'A door of standing water, still as glass, with a tide on the wrong side.', 'It opens on the turn of the tide. Which tide, the sea has not said.'],
  ['drowned-orrery', 'The Drowned Orrery', 'stormcoast', 'ruin', 'coast', 'Rings of brass under green water, turning to a moon that is not above you.', 'The moon it follows is another moon. The orrery is accurate. That is the problem.'],
  ['tide-heart', 'The Heart of Tides', 'stormcoast', 'cave', 'coast', 'A grotto where the sea breathes in and out, and the Warden of Tide listens.', 'It has listened for so long that it knows what you will say. It waits anyway.'],
  ['gale-gate', 'The Gale Gate', 'frostspire', 'peak', 'snow', 'Two pillars of ice and a wind that goes between them in both directions.', 'The wind in the Gate argues with itself. You will not win the argument either.'],
  ['whistling-stair', 'The Whistling Stair', 'frostspire', 'peak', 'snow', 'A stair of frozen air, every step a different note.', 'Climb it in tune and it holds. Climb it flat and it reminds you.'],
  ['eye-of-gale', 'The Eye of the Gale', 'frostspire', 'grove', 'snow', 'A calm in the middle of everything, and in the calm, the Warden of Gale, quite still.', 'It is quiet here because the Warden is holding its breath.'],
  ['stone-gate', 'The Stone Gate', 'khazrum', 'cave', 'cave', 'A door that is a wall that has agreed to be a door, for now.', 'The Gate is the oldest promise in the mountain: that there is something under it.'],
  ['geode-hall', 'The Geode Hall', 'khazrum', 'cave', 'cave', 'A cavern lined with crystal teeth, each one humming a different depth.', 'The dwarves mapped it twice. The maps disagree, and the hall is amused.'],
  ['heart-of-stone', 'The Heart of Stone', 'khazrum', 'ruin', 'cave', 'A chamber with no walls, only weight, and the Warden of Stone sitting at the center of it.', 'It has not moved since the world cooled. It would like to keep it that way.'],
];

const toArea = ([id, name, zone, theme, biome, description, lore]: Row): AreaDef => ({ id, name, zone, theme, biome, description, lore, late: true });
export const COURT_AREAS: AreaDef[] = COURT_ROWS.map(toArea);
export const THRESHOLD_AREAS: AreaDef[] = THRESHOLD_ROWS.map(toArea);
export const REALM_AREAS: AreaDef[] = [...COURT_AREAS, ...THRESHOLD_AREAS];

// ------------------------------------------------------------------ enemies

// prettier-ignore
const NORMAL: FoeRow[] = [
  ['thistle-knight', 'Thistle Knight', 'humanoid', ['fey', 'humanoid'], 27, 'tank', 'nature', ['shield-bash', 'harden'], 'Briar Lance', 'A knight of the Court, very courteous, very prickly.', '#6a8a5a', '#d8c8f0'],
  ['wisp-courtier', 'Wisp Courtier', 'wisp', ['fey', 'spirit'], 26, 'caster', 'arcane', ['dazzle', 'curse-of-ages'], 'Pretty Curse', 'A courtier made of lamplight and gossip.', '#c8d8f8', '#ffffff'],
  ['glamour-hound', 'Glamour Hound', 'beast', ['fey', 'beast'], 27, 'skirm', 'shadow', ['savage-bite', 'pack-howl'], 'Borrowed Bite', 'It looks like whatever you were hoping to see.', '#4a4a6a', '#c8a8f0'],
  ['changeling-twin', 'Changeling Twin', 'humanoid', ['fey', 'humanoid'], 28, 'skirm', 'shadow', ['dirty-stab', 'doom-mark'], 'Your Own Knife', 'It has your face on, and it is wearing it badly.', '#8a7a9a', '#f0e0f8'],
  ['mushroom-matron', 'Mushroom Matron', 'plant', ['fey', 'plant'], 28, 'caster', 'nature', ['root-lash', 'mend-ally'], 'Spore Kiss', 'She keeps the ring. She would like you to stay for tea.', '#a87a6a', '#f0d8b8'],
  ['briar-bailiff', 'Briar Bailiff', 'plant', ['fey', 'plant'], 29, 'brute', 'nature', ['constrict', 'cleave'], 'Writ of Thorns', 'He serves papers, which are knives.', '#4a6a3a', '#a8d888'],
  // The Four Thresholds
  ['cinder-imp', 'Cinder Imp', 'wisp', ['elemental', 'fire'], 53, 'caster', 'fire', ['magma-burst', 'dazzle'], 'Spark Prank', 'A small flame with a large sense of humor.', '#e8702a', '#ffe08a'],
  ['ember-hound', 'Ember Hound', 'beast', ['elemental', 'beast'], 54, 'skirm', 'fire', ['savage-bite', 'flame-breath'], 'Coal Bite', 'It leaves pawprints in the floor.', '#b8401a', '#ffb860'],
  ['tide-wraith', 'Tide Wraith', 'wisp', ['elemental', 'spirit'], 48, 'caster', 'ice', ['frost-breath', 'drown'], 'Undertow Touch', 'A drowned sailor’s idea of the sea.', '#6a9aba', '#e0f0ff'],
  ['brine-golem', 'Brine Golem', 'golem', ['elemental', 'construct'], 49, 'tank', 'ice', ['harden', 'crushing-blow'], 'Salt Fist', 'Made of the sea’s patience and its salt.', '#4a7a9a', '#c8e0f0'],
  ['gale-sprite', 'Gale Sprite', 'wisp', ['elemental', 'spirit'], 42, 'caster', 'lightning', ['chain-lightning-e', 'dazzle'], 'Static Prank', 'It is mostly weather and entirely mischief.', '#c8d8f0', '#ffffff'],
  ['storm-hawk', 'Storm Hawk', 'beast', ['elemental', 'beast'], 43, 'skirm', 'lightning', ['dive-bomb', 'screech'], 'Thunderstoop', 'It hunts on the updraft of its own noise.', '#8aa8c8', '#f0f8ff'],
  ['quarry-golem', 'Quarry Golem', 'golem', ['elemental', 'construct'], 45, 'brute', 'earth', ['crushing-blow', 'tremor'], 'Slab Swing', 'A block of the mountain that stood up to complain.', '#8a7a6a', '#d8c8a8'],
  ['geode-beetle', 'Geode Beetle', 'beast', ['elemental', 'beast'], 46, 'tank', 'earth', ['harden', 'crushing-blow'], 'Crystal Mandible', 'Its shell is full of small, furious jewels.', '#7a6a8a', '#d8b8f0'],
];

// prettier-ignore
const BOSSES: FoeRow[] = [
  ['the-thistle-regent', 'The Thistle Regent', 'humanoid', ['fey', 'humanoid'], 30, 'tank', 'nature', ['shield-bash', 'root-lash', 'boss-enrage'], 'Regent’s Thorn', 'Steward of the Court while the Queen is displeased. He has never been wrong, only early.', '#5a7a4a', '#e8d8f8'],
  ['the-hollow-queen', 'The Hollow Queen', 'humanoid', ['fey', 'humanoid'], 33, 'caster', 'shadow', ['curse-of-ages', 'doom-mark', 'boss-enrage'], 'Queen’s Due', 'Sovereign of the Gloaming Court. She is owed something by everyone, and she is patient about it.', '#3a2a5a', '#e0c8f8'],
  ['warden-of-ember', 'The Warden of Ember', 'elemental', ['elemental', 'fire'], 56, 'tank', 'fire', ['flame-breath', 'magma-burst', 'boss-enrage'], 'Ember’s Weight', 'The keeper of the Ember Threshold. It tests whether you can stand to be warm.', '#d8501a', '#ffe08a'],
  ['warden-of-tide', 'The Warden of Tide', 'elemental', ['elemental', 'water'], 51, 'caster', 'ice', ['frost-breath', 'drown', 'boss-enrage'], 'Tide’s Question', 'The keeper of the Tide Threshold. It asks the same question every time the sea comes in.', '#4a7aaa', '#e0f0ff'],
  ['warden-of-gale', 'The Warden of Gale', 'elemental', ['elemental', 'spirit'], 45, 'caster', 'lightning', ['chain-lightning-e', 'screech', 'boss-enrage'], 'Gale’s Verdict', 'The keeper of the Gale Threshold. It judges by how you stand in a wind.', '#a8c8e8', '#ffffff'],
  ['warden-of-stone', 'The Warden of Stone', 'golem', ['elemental', 'construct'], 48, 'tank', 'earth', ['earthshatter', 'crushing-blow', 'boss-enrage'], 'Stone’s Patience', 'The keeper of the Stone Threshold. It has not moved since the world cooled.', '#7a6a5a', '#d8c8a8'],
];

export const REALM_ENEMIES = [...foes(NORMAL), ...foes(BOSSES, 'boss', 'boss')];

// ------------------------------------------------------------------ dungeons

// prettier-ignore
export const REALM_DUNGEONS: DungeonDef[] = [
  { id: 'briar-court', name: 'The Briar Court', zone: 'gloamwood', level: 29, biome: 'dungeon', rooms: 6, puzzle: false, boss: 'the-thistle-regent', gimmick: 'dark', late: true, description: 'A hedge-maze of hallways where every thorn is a clause in a contract you did not read.', hint: 'Bring light. The Court is not fond of looking at you.', encounters: [g(3, 'thistle-knight', 'thistle-knight', '^wisp-courtier'), g(2, 'glamour-hound', 'glamour-hound'), g(2, 'briar-bailiff', '^mushroom-matron')] },
  { id: 'sunless-ballroom', name: 'The Sunless Ballroom', zone: 'gloamwood', level: 32, biome: 'dungeon', rooms: 7, puzzle: true, boss: 'the-hollow-queen', gimmick: 'cycle', late: true, description: 'A ballroom where the dance never ends and the partners are not all alive.', hint: 'The doors open and shut on the music. Wait for the downbeat.', encounters: [g(3, 'changeling-twin', 'changeling-twin', '^wisp-courtier'), g(2, 'thistle-knight', 'briar-bailiff'), g(2, 'glamour-hound', '^mushroom-matron')] },
];

// ------------------------------------------------------------------ 224: the fey bargains

export interface Bargain {
  id: string;
  name: string;
  /** What the fey say you get, in plain sight. */
  offer: string;
  gain: ModifierSpec[];
  /** What it costs: hidden until it comes due. */
  cost: ModifierSpec[];
  costText: string;
}
// prettier-ignore
export const BARGAINS: Bargain[] = [
  { id: 'borrowed-luck', name: 'Borrowed Luck', offer: 'More gold in every purse you open.', gain: [m('goldFind', 12, 'more')], cost: [m('statusResist', -10)], costText: 'Your luck was borrowed; bad luck is how it is repaid. You resist ailments worse.' },
  { id: 'hawks-eyes', name: 'A Hawk’s Eyes', offer: 'You will not miss what you aim at.', gain: [m('accuracy', 8)], cost: [m('dodge', -6)], costText: 'You see too far to see what is close. You dodge less.' },
  { id: 'quick-feet', name: 'Quick Feet, Slow Years', offer: 'Fleet as a hare.', gain: [m('speed', 4)], cost: [m('maxHp', -6, 'more')], costText: 'The years you ran past were yours. You have less life in you.' },
  { id: 'silver-tongue', name: 'The Silver Tongue', offer: 'Every merchant likes you better.', gain: [m('barter', 10)], cost: [m('xpGain', -5, 'more')], costText: 'You spent words you will owe later. You learn a little slower.' },
  { id: 'long-breath', name: 'The Long Breath', offer: 'A deeper well of mana.', gain: [m('maxMp', 15, 'more')], cost: [m('healingReceived', -8, 'more')], costText: 'The breath was borrowed from your wounds. You mend more slowly.' },
  { id: 'thorn-skin', name: 'Thorn Skin', offer: 'A harder hide.', gain: [m('defense', 6)], cost: [m('speed', -2)], costText: 'The thorns are heavy. You are a little slower.' },
  { id: 'honeyed-memory', name: 'Honeyed Memory', offer: 'You remember everything you read.', gain: [m('xpGain', 6, 'more')], cost: [m('magicResist', -5)], costText: 'A mind full of honey draws wasps. You resist magic worse.' },
  { id: 'moonlit-aim', name: 'Moonlit Aim', offer: 'Your best blows land cleanly.', gain: [m('critChance', 5)], cost: [m('critDamage', -10)], costText: 'The moon takes its share. Your critical hits are weaker.' },
  { id: 'hearthfire-gift', name: 'The Hearthfire Gift', offer: 'Your mending is warmer.', gain: [m('healingPower', 10, 'more')], cost: [m('damageBonus', -4, 'more')], costText: 'A hearth must be fed. You hit a little softer.' },
  { id: 'name-unshared', name: 'A Name Unshared', offer: 'Ailments slide off you.', gain: [m('statusResist', 15)], cost: [m('favorGain', -10, 'more')], costText: 'You gave nothing, and the gods noticed. Your favor comes slower.' },
  { id: 'fey-fortune', name: 'Fey Fortune', offer: 'Finer things turn up in your loot.', gain: [m('magicFind', 15, 'more')], cost: [m('goldFind', -8, 'more')], costText: 'The fey take their fee in coin. You find less gold.' },
  { id: 'winter-crown', name: 'The Winter Crown', offer: 'A sturdier body.', gain: [m('maxHp', 8, 'more')], cost: [m('maxMp', -10, 'more')], costText: 'A crown is cold. Your mana is thinner.' },
];
export const BARGAIN = { maxActive: 3, revealDays: 3, buybackPerLevel: 120, duskfaeCostScale: 0.5, ringHours: 'night', title: 'Left the Court Whole' } as const;

// ------------------------------------------------------------------ 225: the Four Thresholds

export interface Plane {
  id: 'ember' | 'tide' | 'gale' | 'stone';
  name: string;
  element: 'fire' | 'ice' | 'lightning' | 'earth';
  areas: [string, string, string];
  /** The class questline (the mentor fight) that opens this plane for free. */
  mentor: 'mentor-geomancer' | 'mentor-summoner';
  warden: string;
  foes: [string, string];
  level: number;
  boon: ModifierSpec[];
  title: string;
}
// prettier-ignore
export const PLANES: Plane[] = [
  { id: 'ember', name: 'The Ember Threshold', element: 'fire', areas: ['ember-gate', 'cinder-causeway', 'burning-court'], mentor: 'mentor-geomancer', warden: 'warden-of-ember', foes: ['cinder-imp', 'ember-hound'], level: 56, boon: [m('fireResist', 10), m('fireDamage', 8)], title: 'Warmed by Ember' },
  { id: 'tide', name: 'The Tide Threshold', element: 'ice', areas: ['tide-gate', 'drowned-orrery', 'tide-heart'], mentor: 'mentor-summoner', warden: 'warden-of-tide', foes: ['tide-wraith', 'brine-golem'], level: 51, boon: [m('iceResist', 10), m('iceDamage', 8)], title: 'Carried by Tide' },
  { id: 'gale', name: 'The Gale Threshold', element: 'lightning', areas: ['gale-gate', 'whistling-stair', 'eye-of-gale'], mentor: 'mentor-summoner', warden: 'warden-of-gale', foes: ['gale-sprite', 'storm-hawk'], level: 45, boon: [m('lightningResist', 10), m('lightningDamage', 8)], title: 'Kept by Gale' },
  { id: 'stone', name: 'The Stone Threshold', element: 'earth', areas: ['stone-gate', 'geode-hall', 'heart-of-stone'], mentor: 'mentor-geomancer', warden: 'warden-of-stone', foes: ['quarry-golem', 'geode-beetle'], level: 48, boon: [m('earthResist', 10), m('earthDamage', 8)], title: 'Held by Stone' },
];
export const THRESHOLD = { tollPerLevel: 300, harm: 0.006, perResist: 0.0006, wardenGoldPerLevel: 110, allFour: 'Walked the Four Thresholds' } as const;
export const REALM_IDS = [...COURT_AREAS, ...THRESHOLD_AREAS].map((a) => a.id);

// ------------------------------------------------------------------ boss lines [before, during, after]

export const REALM_BOSS_LINES: Record<string, [string, string, string]> = {
  'the-thistle-regent': ['“You are expected. I mislaid the exact date, but the hedge is always right.”', '“THE CLAUSE IS BINDING!”', '“…Void. That is the word for a contract that ends. I had not met it.”'],
  'the-hollow-queen': ['“Sit. Eat nothing. Say nothing you cannot afford. We begin.”', '“YOU OWE ME A NAME!”', '“Keep it. I find I have never needed it. It was only that no one offered.”'],
  'warden-of-ember': ['The fire in the arch leans toward you, as one leans toward a question.', 'The Warden flares white. The floor remembers being lava.', 'The embers settle, bright and calm. A warmth stays in your hands.'],
  'warden-of-tide': ['The water stands up in the shape of a listener.', 'The Warden draws the sea in after it, and lets go.', 'The tide turns, quietly, the right way. It was always going to.'],
  'warden-of-gale': ['The wind drops. Something in the middle of the quiet looks at you.', 'The Warden exhales, and the sky rearranges.', 'The gale lies down at your feet like a dog that has made up its mind.'],
  'warden-of-stone': ['The mountain shifts its weight, and the chamber with it.', 'The Warden stands, and the ceiling remembers it was a ceiling.', 'The stone nods. It is the most you will get, and it is a great deal.'],
};
