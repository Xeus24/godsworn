import type { DungeonDef, EncounterGroup } from '../engine/world/types';
import type { EndingDef } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' | 'percent' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);
const g = (weight: number, ...ids: string[]): EncounterGroup => ({ weight, enemies: ids.map((raw) => (raw.startsWith('^') ? { enemyId: raw.slice(1), row: 'back' as const } : { enemyId: raw })) });

// ------------------------------------------------------------------ 157-158: Twilight Scars and the Twilight of the Wheel

export const FADE = { daysPerPoint: 2, dying: 70, festivalGoneAt: 60, bondFrozenAt: 50, townLossPerDay: 0.25, stages: [[25, 'The rivers run thin.'], [50, 'The towns begin to empty.'], [75, 'The sky over the region dims.'], [100, 'The god is gone. The region does not notice, and is wrong.']] as [number, string][] } as const;
/** The region where each god’s fading shows. */
export const GOD_ZONES: Record<string, string> = {
  solenne: 'aurelane', morrath: 'hollow-barrows', kael: 'ashen-desert', ysolde: 'whisperwood', vex: 'shattered-isles', thalor: 'khazrum', nymira: 'stormcoast',
  aurelis: 'frostspire', hesha: 'meadowlands', grimvald: 'clockwork-foundry', lyssara: 'moonfen', ordrun: 'thornreach', seraphel: 'skyreach', mirrin: 'ashfold',
};
// prettier-ignore
export const TWILIGHT_DUNGEONS: DungeonDef[] = [
  ['twilight-reliquary', 'The Leaking Reliquary', 'celestial-realm', 80, 'court-chamberlain'], ['twilight-well', 'The Dry Well of Prayer', 'the-abyss', 82, 'the-unmade-moment'],
  ['twilight-hour', 'The Last Chapel Hour', 'shattered-timeline', 84, 'the-drowned-hour'], ['twilight-grotto', 'The Quiet Grotto', 'drowned-kingdom', 80, 'drowned-queen'],
  ['twilight-gear', 'The Unwound Cathedral', 'clockwork-city', 84, 'master-assembler'], ['twilight-forge', 'The Cold Altar-Forge', 'the-godforge', 86, 'forgewright-ember'],
].map(([id, name, zone, level, boss]) => ({ id: id as string, name: name as string, zone: zone as string, level: level as number, biome: 'dungeon' as const, rooms: 6, puzzle: false, late: true, boss: boss as string, description: 'Where divine power leaks out of a dying god, and the Hollowed still come to pray.', encounters: [g(3, 'hollowed-pilgrim', 'hollowed-pilgrim', '^hollowed-penitent'), g(2, 'hollowed-prior', 'hollowed-pilgrim', '^hollowed-penitent')] }));

// ------------------------------------------------------------------ 159: The Last Rites

export type Rite = 'saved' | 'inherited' | 'released';
/** What inheriting a god gives you: their domain, as a boon. */
export const DOMAINS: Record<string, [string, ModifierSpec]> = {
  solenne: ['Light and Law', m('healingPower', 10)], morrath: ['Death and Memory', m('shadowDamage', 10)], kael: ['War and Honor', m('physicalAttack', 8, 'percent')], ysolde: ['The Hunt and the Wild', m('natureDamage', 10)],
  vex: ['Luck and Mischief', m('luk', 6)], thalor: ['Forge and Craft', m('defense', 8, 'percent')], nymira: ['Sea and Storm', m('iceDamage', 10)], aurelis: ['Knowledge', m('magicAttack', 8, 'percent')],
  hesha: ['Mercy and Hearth', m('healingReceived', 8)], grimvald: ['Trade and Debt', m('goldFind', 12, 'more')], lyssara: ['Dreams', m('statusResist', 10)], ordrun: ['Oaths and Law', m('maxHp', 8, 'percent')],
  seraphel: ['Wind and Freedom', m('speed', 4)], mirrin: ['Time and Memory', m('cooldownReduction', 8)],
};
export const RITES = { reviveFavor: 40, releaseProsperity: 25, aspectGoldPerLevel: 90, savedFade: 0 } as const;
/** Three epilogue slides for each way a god can end (R11: epilogue slides, not endings). */
export const EPILOGUE: Record<Rite, (god: string) => string[]> = {
  saved: (god) => [`${god} is kept. The sky over their region brightens by a shade.`, 'The festivals return to the Wheel. The people do not know why they are happy; they are simply happy.', `Years on, a child asks who ${god} is. Someone answers, and is surprised to know.`],
  inherited: (god) => [`${god}’s work goes into your hands, and it is heavier than it looked.`, 'Their old enemies find you. They are not unreasonable; they were only waiting for someone to be angry at.', `You carry ${god}’s name in your own, and it does not feel like theft.`],
  released: (god) => [`${god} lets go, gently. There is no thunder; the light just goes a little further out.`, 'The Wheel turns without them. The gap in the calendar is kept as a day of quiet.', `Nothing of ${god} is left but what people did in their name, and that, it turns out, is a great deal.`],
};

// ------------------------------------------------------------------ 160: The Unsworn Ending

export const UNSWORN_ENDING: EndingDef = { id: 'unsworn-ending', name: 'The Unsworn Ending', title: 'Unsworn', text: 'You refused every god, and the Unsworn King’s path ended, as the last of his pages said it would, in a doorway with no door. You walked through. Behind you, the gods kept their counts; ahead there was only the road, and nobody to swear it to. It is the freest ending, and the loneliest, and you are, as far as anyone can tell, content.' };
export const UNSWORN = { needsPages: 16, steps: [
  'The first page: “I take this oath before her who keeps the count.” You do not take it.',
  'The Unsworn King’s throne is empty. He left it for someone who would refuse it. You stand beside it and do not sit.',
  'Each god comes to ask you to swear. You say no to all of them, one at a time. It takes a while.',
] } as const;

// ------------------------------------------------------------------ 161: Your Flock

export interface Prayer { id: string; text: string; kind: 'gold' | 'check' | 'visit'; stat?: string; dc?: number; cost?: number }
const pr = (id: string, text: string, kind: Prayer['kind'], extra: Partial<Prayer> = {}): Prayer => ({ id, text, kind, ...extra });
// prettier-ignore
export const PRAYERS: Prayer[] = [
  pr('roof', 'A widow asks for a new roof before the rains.', 'gold', { cost: 6 }), pr('well', 'A village asks you to bless the well, which has gone sour.', 'check', { stat: 'wis', dc: 13 }), pr('lost-child', 'A boy has wandered off toward the fen.', 'check', { stat: 'dex', dc: 13 }),
  pr('quarrel', 'Two brothers have not spoken in a year; will you speak to them?', 'check', { stat: 'cha', dc: 13 }), pr('seed', 'A farmer asks for seed grain, on credit that will never be repaid.', 'gold', { cost: 5 }), pr('fever', 'A child has a fever the healers cannot name.', 'check', { stat: 'int', dc: 14 }),
  pr('thief', 'The offering-box has been robbed, and the thief is a hungry man.', 'check', { stat: 'wis', dc: 12 }), pr('wedding', 'A couple asks you to marry them, with very little ceremony and no money.', 'check', { stat: 'cha', dc: 11 }), pr('bell', 'The chapel bell has cracked.', 'gold', { cost: 8 }),
  pr('wolves', 'Wolves have been at the flock’s sheep.', 'check', { stat: 'str', dc: 13 }), pr('dream', 'A woman keeps dreaming of a door. She asks what it is.', 'check', { stat: 'wis', dc: 14 }), pr('debt', 'A baker owes more than he can pay, to a very patient lender.', 'gold', { cost: 7 }),
  pr('pilgrim', 'A pilgrim fell ill at the shrine and asks to be carried home.', 'visit'), pr('grave', 'An old man asks that someone say his wife’s name over her grave.', 'visit'), pr('orphans', 'The orphanage’s stove is out.', 'gold', { cost: 4 }),
  pr('flood', 'The river rises; will you help sandbag the street?', 'check', { stat: 'str', dc: 12 }), pr('letter', 'A letter needs reading, and nobody here can read.', 'visit'), pr('song', 'The choir wants a new hymn for the harvest.', 'check', { stat: 'cha', dc: 12 }),
  pr('curse', 'A farmer thinks his field is cursed; the soil is simply tired.', 'check', { stat: 'int', dc: 12 }), pr('tithe', 'Someone has come to give, not ask; will you accept a basket of eggs?', 'visit'), pr('plague-rat', 'Rats in the granary, and a hard winter coming.', 'gold', { cost: 5 }),
  pr('lamp', 'The shrine lamp has gone out, and no one remembers how to light it.', 'visit'), pr('feud', 'Two families dispute a boundary stone.', 'check', { stat: 'wis', dc: 13 }), pr('mercy', 'A thief has been caught; the village wants your word on what to do with him.', 'check', { stat: 'wis', dc: 12 }),
  pr('storm-mend', 'The storm took half the fishing boats.', 'gold', { cost: 9 }), pr('heretic', 'A preacher in the next village says you are no god’s friend. Are you?', 'check', { stat: 'cha', dc: 14 }), pr('bees', 'The hives have swarmed onto the chapel roof.', 'visit'),
  pr('old-oath', 'A man wants to be released from an old promise.', 'check', { stat: 'wis', dc: 15 }), pr('feast', 'A festival with no feast. Will you share what you have?', 'gold', { cost: 6 }), pr('dowry', 'A girl cannot marry without a dowry she will never have.', 'gold', { cost: 10 }),
  pr('night-watch', 'Something walks outside the walls at night.', 'check', { stat: 'dex', dc: 14 }), pr('teacher', 'The school has no teacher; will you come, for a day?', 'visit'),
];
export const FLOCK = { start: 8, startVillage: 'emberfall', maxPrayers: 5, prayerChance: 0.4, expireDays: 6, driftLoss: 1, growEvery: 2, tithePerFollower: 2, answerGoldPerLevel: 1, title: 'Shepherd of the Faithless', titleAt: 40 } as const;

// ------------------------------------------------------------------ 163-164: the Conclave and the War

export const CONCLAVE = { minRegions: 5, everyDays: 7, strengthPerScar: 4, base: 12, defendPerCompanion: 4, renownDiv: 12, prosperityDiv: 6, loss: 20, win: 8, goldPerLevel: 45, title: 'Breaker of the Conclave', repelledTitleAt: 8, autoAfterDays: 3 } as const;
export const WAR = { minLevel: 50, turns: 10, fronts: ['the Main Host (your party)', 'the Companions’ Wing', 'the Flock at the Walls'], enemy: 100, ours: 100, lead: 1.4, goldPerLevel: 120, title: 'Victor of the War of the Wheel' } as const;

// ------------------------------------------------------------------ 166: Archivist’s Trials

export const ARCHIVE = { questions: 10, yearDays: 112, goldPerLevel: 40, perfectTitle: 'Keeper of Your Own Record', mod: m('xpGain', 6, 'more') } as const;
