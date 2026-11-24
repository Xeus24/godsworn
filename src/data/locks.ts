import type { LockDef } from '../engine/locks/types';
import { CLASSES } from './classes';
import { MULTICLASS } from './progression';
import { RACES } from './races';
import { ISLAND_REVEAL } from './world/ship';
import { DUNGEONS } from './world/places';
import { AREAS } from './world/areas';
import type { Cond } from '../engine/quests/types';
import { CARAVAN, WEATHER_MAGIC } from './road';
import { DIVING, HUNTS, ISLANDS, TOURNAMENT } from './trials';
import { DEFENSE } from './defense';
import { RIFTS } from './rifts';
import { ATLAS } from './atlas';
import { TRIALS } from './pilgrimage';
import { WAR } from './twilight';
import { BOSS_RUSH_MIN_LEVEL, DIVINE_TRIAL_MIN_LEVEL, LEAGUE, SPIRE, WEEKLY } from './endgameModes';
import { ERAS } from './wonders';
import { SYSTEM_LOCKS } from './systems';

/**
 * Every gate in one place. A lock is a quest condition plus how it shows while shut
 * and what it says when it opens. Add gates here; nothing in the engine changes.
 */

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

/** In-world words for a later playthrough: tier 1 is the hero's second walk of the Road. */
export function roadWalk(tier: number): string {
  return `the ${ORDINALS[tier] ?? `${tier + 1}th`} walk of the Road`;
}

/** Endgame time: past a first playthrough, or standing at the level cap. */
export const ENDGAME_COND: Cond = {
  kind: 'any',
  conds: [{ kind: 'ngPlus', min: 1 }, { kind: 'endingsSeen', min: 1 }, { kind: 'ending' }, { kind: 'atLevelCap' }],
};

/** Screens and town services that a new hero does not need yet: [level, what it is]. */
export const REVEAL_LEVELS = {
  'tab:skills': [2, 'the skill trees'],
  'tab:pantheon': [6, 'the Pantheon'],
  'tab:party': [8, 'your fellowship'],
  'tab:general': [5, 'the general skills'],
  'codex:maps': [6, 'the maps'],
  'codex:compendium': [5, 'the compendium'],
  'codex:cards': [5, 'the card collection'],
  'codex:families': [8, 'the creature families'],
  'codex:items': [8, 'the item codex'],
  'codex:backgrounds': [6, 'the backgrounds'],
  'codex:realm': [10, 'the realm'],
  'codex:heart': [10, 'the heart'],
  'codex:completion': [10, 'the completion ledger'],
  'codex:ship': [12, 'the ship'],
  'town:guild': [3, "the Adventurers' Guild"],
  'town:pastimes': [4, 'the pastimes'],
  'town:renown': [4, 'the town renown'],
  'town:tales': [5, 'Tales & Tankards'],
  'town:arena': [5, 'the arena'],
  'town:library': [6, 'the library'],
  'town:investments': [8, 'town investments'],
  'town:fortunes': [10, 'the fortune-tellers'],
  'town:housing': [10, 'a home of your own'],
} as const satisfies Record<string, readonly [number, string]>;

export type RevealKey = keyof typeof REVEAL_LEVELS;

/**
 * Other ways a reveal opens before its level: the story beat that brings the system to the hero.
 * The level stays as a fallback so a hero who wanders off the story is never left without it.
 */
const REVEAL_SOONER: Partial<Record<RevealKey, { cond: Cond; hint: string }>> = {
  'tab:pantheon': { cond: { kind: 'quest', quest: 'main-1', state: 'complete' }, hint: 'The gods are listening. Answer the call of the Silent Shrine.' },
  'tab:party': { cond: { kind: 'companions', min: 1 }, hint: 'Find someone willing to walk the Road beside you.' },
  'codex:realm': { cond: { kind: 'any', conds: [{ kind: 'unlocked', lock: 'system:grudge' }, { kind: 'unlocked', lock: 'road:caravan' }] }, hint: 'The realm stirs around you. Something that beats you will not forget you, and caravans will want escorts soon.' },
  'codex:heart': { cond: { kind: 'unlocked', lock: 'system:convictions' }, hint: 'What you choose on the Road will shape what you believe.' },
};

const revealLocks: LockDef[] = (Object.entries(REVEAL_LEVELS) as [RevealKey, readonly [number, string]][]).map(([key, [level, what]]) => ({
  id: `reveal:${key}`,
  requirement: { kind: 'any', conds: [...(REVEAL_SOONER[key] ? [REVEAL_SOONER[key].cond] : []), { kind: 'level', min: level }, ENDGAME_COND] },
  visibility: 'teased',
  hint: REVEAL_SOONER[key]?.hint ?? `${what.charAt(0).toUpperCase()}${what.slice(1)} will come to you as you walk the Road and grow in strength.`,
  unlockMessage: `A new door is open to you: ${what}.`,
  category: 'reveal',
}));

const raceLocks: LockDef[] = RACES.filter((r) => r.unlock).map((r) => {
  const u = r.unlock as { ngPlus: number } | { clear: true };
  const clear = 'clear' in u;
  return {
    id: `race:${r.id}`,
    requirement: clear ? { kind: 'any', conds: [{ kind: 'endingsSeen', min: 1 }, { kind: 'ngPlus', min: 1 }] } : { kind: 'ngPlus', min: u.ngPlus },
    visibility: 'teased',
    hint: clear ? 'Finish the story once with any hero, and this people will answer your next hero.' : `Reach ${roadWalk(u.ngPlus)}, and this people will answer your next hero.`,
    unlockMessage: `A new people may take up the Road: ${r.name}.`,
    category: 'class',
  } satisfies LockDef;
});

const classLocks: LockDef[] = CLASSES.flatMap((k): LockDef[] => {
  if (k.hidden) {
    return [{ id: `class:secret:${k.id}`, requirement: { kind: 'classUnlocked', classId: k.id }, visibility: 'hidden', hint: 'A secret calling. Follow rumours and strange omens.', unlockMessage: `A secret calling answers you: ${k.name}.`, category: 'class' }];
  }
  if (k.ngPlus) {
    return [{ id: `class:ngplus:${k.id}`, requirement: { kind: 'ngPlus', min: k.ngPlus }, visibility: 'teased', hint: `Only heroes who have reached ${roadWalk(k.ngPlus)} may take this calling.`, unlockMessage: `A new calling is open to new heroes: ${k.name}.`, category: 'class' }];
  }
  return [];
});

/**
 * Entry rites: the chapter of the tale that opens the way into a zone. Each is the quest that
 * the zone's first main-story errand follows, so the story itself always leads the hero there.
 * A hero who has already set foot in the zone, or who walks a New Game+, is never turned back.
 */
export const ZONE_RITES: Record<string, string> = {
  whisperwood: 'a1-1',
  moonfen: 'a1-3',
  'sunken-caves': 'a1-4',
  aurelane: 'main-3',
  'ashen-desert': 'a2-4',
  gloamwood: 'main-4',
  thornreach: 'a2-5',
  saltglass: 'a2-6',
  frostspire: 'a2-7',
  'hollow-barrows': 'a3-1',
  khazrum: 'a3-5',
  stormcoast: 'a3-6',
  merrowdeep: 'main-6',
  'clockwork-foundry': 'a3-7',
  skyreach: 'a4-2',
  'volcanic-rift': 'a4-5',
  'dark-citadel': 'a5-1',
};

const zoneLocks: LockDef[] = Object.entries(ZONE_RITES).map(([zone, quest]) => ({
  id: `zone:${zone}`,
  requirement: { kind: 'any', conds: [{ kind: 'zoneVisited', zone }, { kind: 'ngPlus', min: 1 }, { kind: 'quest', quest, state: 'complete' }] },
  visibility: 'teased',
  hint: 'The way there is not yet open. Press on with the main tale; its next chapter leads you there.',
  unlockMessage: 'A new way is open to you on the Road.',
  category: 'world',
}));

/**
 * Optional hard dungeons (the "hard" side paths) are capstones: they open once every ordinary
 * dungeon of their zone has been cleared (or when the hero has cleared that one before).
 */
const dungeonLocks: LockDef[] = DUNGEONS.filter((d) => d.hard).flatMap((d): LockDef[] => {
  const before = DUNGEONS.filter((x) => x.zone === d.zone && !x.hard && !x.late);
  if (before.length === 0) return [];
  return [{
    id: `dungeon:${d.id}`,
    requirement: { kind: 'all', conds: before.map((x) => ({ kind: 'dungeonCleared', dungeon: x.id }) as Cond) },
    visibility: 'visible',
    hint: 'A harder road lies behind its door. Clear the ordinary dungeons of this land first.',
    unlockMessage: `A harder trial is open to you: ${d.name}.`,
    category: 'world',
  }];
});

/** Ports: a ship of enough level, and (for the far isles) enough voyages for the chart to show them. */
const seaLocks: LockDef[] = AREAS.filter((a) => a.access).flatMap((a): LockDef[] => {
  const acc = a.access as NonNullable<typeof a.access>;
  if (acc.by === 'airship') {
    return [{ id: `sea:${a.id}`, requirement: { kind: 'airship' }, visibility: 'teased', hint: 'Only a ship that flies can reach it.', unlockMessage: `The sky route to ${a.name} is open.`, category: 'world' }];
  }
  const reveal = ISLAND_REVEAL[a.id] ?? 0;
  return [
    { id: `sea:${a.id}`, requirement: { kind: 'shipLevel', min: acc.level }, visibility: 'visible', hint: `Needs a ship of level ${acc.level}: upgrade it at the Saltmere harbor.`, unlockMessage: `Your ship can now make the crossing to ${a.name}.`, category: 'world' },
    ...(reveal > 0 ? [{ id: `sea:${a.id}:chart`, requirement: { kind: 'voyages', min: ISLAND_REVEAL[a.id] ?? 0 }, visibility: 'teased', hint: 'Sail more, and the charts will show new shores.', unlockMessage: `A new shore appears on your charts: ${a.name}.`, category: 'world' } satisfies LockDef] : []),
  ];
});

/**
 * Crafting. The first three professions are open to every hero (the core loop). The others are taught by a
 * master who keeps a bench in a particular land: set foot there and be of an age to learn.
 */
const PROFESSION_BENCH: Record<string, { zone: string; level: number; place: string }> = {
  tailoring: { zone: 'whisperwood', level: 5, place: 'Thornwick' },
  jewelcrafting: { zone: 'sunken-caves', level: 8, place: 'the Sunken Caves' },
  enchanting: { zone: 'ashen-desert', level: 10, place: 'Sandhaven' },
};

const craftLocks: LockDef[] = [
  ...Object.entries(PROFESSION_BENCH).map(([id, b]): LockDef => ({
    id: `craft:profession:${id}`,
    requirement: { kind: 'any', conds: [{ kind: 'practises', profession: id }, { kind: 'all', conds: [{ kind: 'zoneVisited', zone: b.zone }, { kind: 'level', min: b.level }] }] },
    visibility: 'teased',
    hint: `A master of this craft keeps a bench in ${b.place}. Journey there once you are level ${b.level}.`,
    unlockMessage: `A master will now teach you ${id}.`,
    category: 'craft',
  })),
  {
    id: 'craft:upgrade:6',
    requirement: { kind: 'any', conds: [{ kind: 'gearUpgrade', min: 6 }, { kind: 'profession', level: 10 }] },
    visibility: 'visible',
    hint: 'Gear can be tempered past +5 only by a hand skilled in a craft. Raise a crafting profession to level 10.',
    unlockMessage: 'You have the skill to temper gear past +5.',
    category: 'craft',
  },
  {
    id: 'craft:upgrade:11',
    requirement: { kind: 'any', conds: [{ kind: 'gearUpgrade', min: 11 }, { kind: 'profession', level: 25 }] },
    visibility: 'visible',
    hint: 'Past +10 the work is perilous and needs a master hand. Raise a crafting profession to level 25.',
    unlockMessage: 'You have the mastery to temper gear past +10.',
    category: 'craft',
  },
];

/** A feature that opens at a hero level (optionally together with other ways in). */
function levelGate(id: string, min: number, category: LockDef['category'], hint: string, unlockMessage: string, alsoOpen: Cond[] = []): LockDef {
  const need: Cond = { kind: 'level', min };
  return { id, requirement: alsoOpen.length ? { kind: 'any', conds: [need, ...alsoOpen] } : need, visibility: 'visible', hint, unlockMessage, category };
}

/** The step of the Unfinished Hammer that asks for a hero of this level (step index 3). */
export const HAMMER_STEP_LEVELS: Record<number, number> = { 3: 25 };

/** Town and road services that used to check the hero's level in the engine or the UI. */
const serviceLocks: LockDef[] = [
  levelGate('town:stables', 12, 'town', 'The stable-master takes on riders once you are level 12, or once the deeper works of the world are open.', 'The stables will now sell you mounts and pets.', [ENDGAME_COND]),
  levelGate('road:caravan', CARAVAN.minLevel, 'world', `Caravan masters want escorts of level ${CARAVAN.minLevel}.`, 'Caravan masters will now hire you as an escort.'),
  levelGate('road:weather', WEATHER_MAGIC.minLevel, 'world', `Weather-working needs level ${WEATHER_MAGIC.minLevel}.`, 'You have the craft to change the sky.'),
  ...Object.entries(HAMMER_STEP_LEVELS).map(([step, lv]) =>
    levelGate(`craft:hammer:${step}`, lv, 'craft', `The hammer will take no more until you are level ${lv}.`, `Step ${Number(step) + 1} of Thalor's hammer is within your reach.`),
  ),
];

/** Optional trials, games and rift eras that ask for a hero of some standing. */
const trialLocks: LockDef[] = [
  levelGate('trials:tournament', TOURNAMENT.minLevel, 'combat', `Entrants to the Hundred Duels must be level ${TOURNAMENT.minLevel}.`, 'You may now enter your name in the Hundred Duels.'),
  levelGate('trials:hunts', HUNTS.minLevel, 'combat', `Hunters must be level ${HUNTS.minLevel}. The quarries walk under a Blood Moon.`, 'The Blood Moon hunts are open to you.'),
  levelGate('trials:diving', DIVING.minLevel, 'world', `Divers must be level ${DIVING.minLevel}.`, 'You may now dive on wrecks off the coast.'),
  ...ISLANDS.map((i) => levelGate(`trials:island:${i.id}`, i.minLevel, 'world', `Level ${i.minLevel} to land on ${i.name}.`, `${i.name} will now bear your weight.`)),
  levelGate('games:defense', DEFENSE.minLevel, 'combat', `Defenders must be level ${DEFENSE.minLevel}.`, 'The Choir can now be met at the shrines of towns.'),
  ...ERAS.map((e) => levelGate(`wonders:era:${e.id}`, e.minLevel, 'endgame', `${e.name} opens to heroes of level ${e.minLevel}.`, `${e.name} is open to you.`)),
];

/** Endgame modes: each asks for a hero level (the Endgame screen itself is the `endgame` lock). */
const modeLocks: LockDef[] = [
  levelGate('endgame:rifts', RIFTS.minLevel, 'endgame', `Rifts open to heroes of level ${RIFTS.minLevel}.`, 'The Rift Gates will now open for you.'),
  levelGate('endgame:bossrush', BOSS_RUSH_MIN_LEVEL, 'endgame', `The Gauntlet of Tyrants opens to heroes of level ${BOSS_RUSH_MIN_LEVEL}.`, 'The arena will now host the Gauntlet of Tyrants for you.'),
  levelGate('endgame:spire', SPIRE.minLevel, 'endgame', `The Endless Spire opens to heroes of level ${SPIRE.minLevel}.`, 'The Endless Spire is open to you.'),
  levelGate('endgame:league', LEAGUE.minLevel, 'endgame', `The Champions league opens to heroes of level ${LEAGUE.minLevel}.`, 'The Champions league will take your name.'),
  levelGate('endgame:weekly', WEEKLY.minLevel, 'endgame', `The weekly run opens to heroes of level ${WEEKLY.minLevel}.`, 'The weekly run is open to you.'),
  levelGate('endgame:daily', TRIALS.dailyMinLevel, 'endgame', `The Trial of the Day opens to heroes of level ${TRIALS.dailyMinLevel}.`, 'The Trial of the Day is open to you.'),
  levelGate('endgame:atlas', ATLAS.minLevel, 'endgame', `The Celestial Atlas opens to heroes of level ${ATLAS.minLevel}.`, 'The Celestial Atlas is open to you.'),
  levelGate('endgame:divine', DIVINE_TRIAL_MIN_LEVEL, 'gods', `A Divine Trial opens to heroes of level ${DIVINE_TRIAL_MIN_LEVEL}.`, 'The gods will now test you in the Divine Trials.'),
  levelGate('endgame:war', WAR.minLevel, 'endgame', `The war is for heroes of level ${WAR.minLevel}.`, 'The Twilight war is open to you.'),
];

export const LOCKS: LockDef[] = [
  ...SYSTEM_LOCKS,
  ...serviceLocks,
  ...modeLocks,
  ...trialLocks,
  ...raceLocks,
  ...classLocks,
  ...zoneLocks,
  ...dungeonLocks,
  ...seaLocks,
  ...craftLocks,
  {
    id: 'class:second',
    requirement: { kind: 'level', min: MULTICLASS.secondaryLevel },
    visibility: 'visible',
    hint: `At level ${MULTICLASS.secondaryLevel} you may take a second class. Beat its trainer in a trial at the Proving Grounds first.`,
    unlockMessage: `Level ${MULTICLASS.secondaryLevel}: you may take a second class! Win a trial at the Proving Grounds.`,
    category: 'class',
  },
  {
    id: 'class:third',
    requirement: {
      kind: 'any',
      conds: [
        { kind: 'all', conds: [{ kind: 'level', min: MULTICLASS.thirdSlotLevel }, { kind: 'thirdSlot' }] },
        { kind: 'all', conds: [{ kind: 'level', min: MULTICLASS.tertiaryLevel }, { kind: 'ngPlus', min: MULTICLASS.tertiaryNgPlus }] },
      ],
    },
    visibility: 'visible',
    hint: `A third class opens at level ${MULTICLASS.thirdSlotLevel} after High Lector Amara's errand, or at level ${MULTICLASS.tertiaryLevel} on ${roadWalk(MULTICLASS.tertiaryNgPlus)}.`,
    unlockMessage: 'A third class slot is open to you.',
    category: 'class',
  },
  {
    id: 'class:hybrids',
    requirement: { kind: 'level', min: MULTICLASS.hybridLevel },
    visibility: 'visible',
    hint: `Take two classes to level ${MULTICLASS.hybridLevel} each, then face both mentors in the pair trial to earn a hybrid prestige class.`,
    unlockMessage: 'Hybrid prestige classes are now within reach: raise two classes and face their mentors.',
    category: 'class',
  },
  {
    // Codex > Realm and Heart pages that no system claims yet keep the old level rule.
    id: 'codex:pages',
    requirement: { kind: 'any', conds: [{ kind: 'level', min: 10 }, ENDGAME_COND] },
    visibility: 'hidden',
    hint: 'More of the realm will show itself as you grow in strength.',
    unlockMessage: 'More of the realm reveals itself to you.',
    category: 'reveal',
  },
  {
    id: 'endgame',
    requirement: ENDGAME_COND,
    visibility: 'teased',
    hint: 'The deeper works of the world wait for those who finish the story or reach the height of their power.',
    unlockMessage: 'The deeper works of the world are open to you: the Rift Gates, the Gauntlet of Tyrants, the stables, and a new walk of the Road.',
    category: 'endgame',
  },
  ...revealLocks,
];

/** Lock id for a race / New Game+ class / secret class, if it has one. */
export const raceLockId = (raceId: string): string => `race:${raceId}`;
