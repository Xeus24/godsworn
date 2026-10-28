import type { BlessingDef } from '../engine/gods/types';
import type { UniqueItemDef } from '../engine/items/types';
import type { QuestDef } from '../engine/quests/types';
import type { LoreDef } from '../engine/world/types';
import { flat, pct } from './trees/builder';
import { all, flag, kill, stage, state } from './story/helpers';

/**
 * Eight minor saints. Each keeps a hidden shrine in one zone that only shows once their story has been
 * found in a lore page; praying there grants one of five minor blessings (a different one each day) that,
 * unlike a god's, stacks with the blessings of other saints. Finding all eight earns the Reliquary of the Eight.
 */
export interface SaintDef {
  id: string;
  name: string;
  title: string;
  patron: string;
  zone: string;
  lore: string;
  loreTitle: string;
  loreText: string;
  blessings: [string, string, Omit<BlessingDef, 'id' | 'god' | 'kind' | 'rarity' | 'name' | 'description' | 'saint'>, string][];
  deed: [text: string, enemyZone: string, count: number];
}

const b = (modifiers: BlessingDef['modifiers']) => ({ modifiers });

export const SAINTS: SaintDef[] = [
  { id: 'wenlock', name: 'Saint Wenlock the Tireless', title: 'Who Carried the Sick Across the River', patron: 'hesha', zone: 'meadowlands', lore: 'lore-saint-wenlock', loreTitle: 'The Ferryman’s Ledger', loreText: 'Wenlock rowed the plague-sick across the Brightwater for forty nights and was never once paid. His boat is gone; the mooring-stone remains, upriver, under the willows.',
    blessings: [['Steady Oars', '+8% max HP.', b([pct('maxHp', 8)]), 'Steady Oars'], ['Cool Hands', '+3 HP regeneration.', b([flat('hpRegen', 3)]), ''], ['Patient Tide', '+10% healing power.', b([flat('healingPower', 10)]), ''], ['Dry Bandage', '+10% status resist.', b([flat('statusResist', 10)]), ''], ['Long Night', '+6 VIT.', b([flat('vit', 6)]), '']],
    deed: ['Cull the creatures of the meadow', 'meadowlands', 8] },
  { id: 'orrel', name: 'Saint Orrel of the Roots', title: 'Who Taught the Forest to Forgive', patron: 'ysolde', zone: 'whisperwood', lore: 'lore-saint-orrel', loreTitle: 'The Root-Reader’s Notes', loreText: 'Orrel lay beneath the great oak for a year to learn what it was angry about. The oak told him. He spent the rest of his life making it right, one sapling at a time.',
    blessings: [['Mossfoot', '+8 dodge.', b([flat('dodge', 8)]), ''], ['Barkskin', '+10% defense.', b([pct('defense', 10)]), ''], ['Seed-Luck', '+12% nature damage.', b([flat('natureDamage', 12)]), ''], ['Green Quiet', '+10% status resist.', b([flat('statusResist', 10)]), ''], ['Hunter’s Rest', '+6 DEX.', b([flat('dex', 6)]), '']],
    deed: ['Cull the creatures of the Whisperwood', 'whisperwood', 8] },
  { id: 'brenna', name: 'Saint Brenna Candlewright', title: 'Who Lit the Drowned Dark', patron: 'solenne', zone: 'sunken-caves', lore: 'lore-saint-brenna', loreTitle: 'A Candle-Stub, Wrapped in a Prayer', loreText: 'Brenna made candles for miners and told them each was a small sun. The caves flooded; her last candle burned underwater for a week. The shrine is where it went out.',
    blessings: [['Small Sun', '+12% holy damage.', b([flat('holyDamage', 12)]), ''], ['Wick and Wax', '+10% max MP.', b([pct('maxMp', 10)]), ''], ['Steady Flame', '+10% fire resist and ice resist.', b([flat('fireResist', 10), flat('iceResist', 10)]), ''], ['Lantern-Bearer', '+8 accuracy.', b([flat('accuracy', 8)]), ''], ['Held Breath', '+8% status resist.', b([flat('statusResist', 8)]), '']],
    deed: ['Clear the Sunken Caves', 'sunken-caves', 8] },
  { id: 'qadir', name: 'Saint Qadir Dustwalker', title: 'Who Crossed the Ash Sea Barefoot', patron: 'kael', zone: 'ashen-desert', lore: 'lore-saint-qadir', loreTitle: 'Footprints in Glass', loreText: 'Qadir walked the dune sea to prove a god was right about something. The sand fused beneath each step. Follow the glass footprints and you will find where he finally sat down.',
    blessings: [['Hot Sand', '+10% fire damage.', b([flat('fireDamage', 10)]), ''], ['Blistered Feet', '+8% max HP.', b([pct('maxHp', 8)]), ''], ['Long Horizon', '+6 speed.', b([pct('speed', 6)]), ''], ['Banner of Dust', '+8% damage.', b([flat('damageBonus', 8)]), ''], ['Thirst', '+6 STR.', b([flat('str', 6)]), '']],
    deed: ['Cull the creatures of the Ashen Desert', 'ashen-desert', 8] },
  { id: 'ysmay', name: 'Saint Ysmay of the Long Night', title: 'Who Dreamed the Winter Awake', patron: 'lyssara', zone: 'frostspire', lore: 'lore-saint-ysmay', loreTitle: 'The Sleepwalker’s Diary', loreText: 'Ysmay slept through the first winter and woke up having cured the village of its fear of it. The shrine is where she lay down; the snow will not stay on it.',
    blessings: [['Cold Moon', '+12% ice damage.', b([flat('iceDamage', 12)]), ''], ['Soft Footfall', '+8 dodge.', b([flat('dodge', 8)]), ''], ['Slow Heartbeat', '+4 HP regeneration.', b([flat('hpRegen', 4)]), ''], ['Pillow of Frost', '+12% status resist.', b([flat('statusResist', 12)]), ''], ['Lucid Hour', '+8 WIS.', b([flat('wis', 8)]), '']],
    deed: ['Cull the creatures of the Frostspire', 'frostspire', 8] },
  { id: 'corvane', name: 'Saint Corvane the Drowned', title: 'Who Held the Door Against the Tide', patron: 'nymira', zone: 'stormcoast', lore: 'lore-saint-corvane', loreTitle: 'A Sailor’s Last Letter', loreText: 'Corvane stood in a doorway for a night while the sea tried to come through it. She kept it out. The sea came back every night after for a century, and she was there every night after that.',
    blessings: [['Salt in the Hair', '+12% lightning damage.', b([flat('lightningDamage', 12)]), ''], ['Held Door', '+10% defense.', b([pct('defense', 10)]), ''], ['Tideproof', '+10% ice resist and lightning resist.', b([flat('iceResist', 10), flat('lightningResist', 10)]), ''], ['Wet Wood', '+8% max HP.', b([pct('maxHp', 8)]), ''], ['Lighthouse Eyes', '+10 accuracy.', b([flat('accuracy', 10)]), '']],
    deed: ['Cull the creatures of the Stormcoast', 'stormcoast', 8] },
  { id: 'hruldar', name: 'Saint Hruldar Ashhand', title: 'Who Quenched the Forge in His Own Blood', patron: 'thalor', zone: 'volcanic-rift', lore: 'lore-saint-hruldar', loreTitle: 'An Anvil with a Handprint', loreText: 'Hruldar was the last smith to refuse the Severance. He put his hand on the anvil to stop it. The anvil stopped. The handprint did not wash out, and the shrine is built around it.',
    blessings: [['Hot Iron', '+12% fire damage.', b([flat('fireDamage', 12)]), ''], ['Quenched', '+10% defense.', b([pct('defense', 10)]), ''], ['Hammer Hand', '+8% physical attack.', b([pct('physicalAttack', 8)]), ''], ['Slag-Proof', '+12% status resist.', b([flat('statusResist', 12)]), ''], ['Tongs', '+6 VIT.', b([flat('vit', 6)]), '']],
    deed: ['Cull the creatures of the Volcanic Rift', 'volcanic-rift', 8] },
  { id: 'nul', name: 'Saint Nul, Who Was Forgotten', title: 'Whose Name the Citadel Ate', patron: 'mirrin', zone: 'dark-citadel', lore: 'lore-saint-nul', loreTitle: 'A Page with a Missing Heading', loreText: 'Nul is remembered only by this shrine, and by the odd fact that nobody who prays here ever forgets anything again. Mirrin says the saint is happy with that arrangement. Mirrin does not say why.',
    blessings: [['Clear Recall', '+10 accuracy.', b([flat('accuracy', 10)]), ''], ['Index', '+12% arcane damage.', b([flat('arcaneDamage', 12)]), ''], ['Unlost', '+10% cooldown reduction.', b([flat('cooldownReduction', 10)]), ''], ['Blank Page', '+10% magic resist.', b([pct('magicResist', 10)]), ''], ['Remembered', '+10% XP.', b([flat('xpGain', 10)]), '']],
    deed: ['Cull the creatures of the Dark Citadel', 'dark-citadel', 8] },
];

const RARITY = ['common', 'common', 'uncommon', 'uncommon', 'rare'] as const;

/** Five per saint: minor, ten battles, free, and tied to the saint rather than the patron (so they stack). */
export const SAINT_BLESSINGS: BlessingDef[] = SAINTS.flatMap((s) =>
  s.blessings.map(([name, description, rest], i): BlessingDef => ({ id: `${s.id}-${i + 1}`, god: s.patron, name, kind: 'minor', rarity: RARITY[i] as BlessingDef['rarity'], description, battles: 10, favorCost: 0, saint: s.id, ...rest })),
);

export const SAINT_LORE: LoreDef[] = SAINTS.map((s) => ({ id: s.lore, zone: s.zone, title: s.loreTitle, text: s.loreText }));

/** Two short quests each: the shrine, then the saint’s small errand. */
export const SAINT_QUESTS: QuestDef[] = SAINTS.flatMap((s): QuestDef[] => [
  {
    id: `saint-${s.id}-1`, name: s.name, kind: 'side', level: 8, zone: s.zone, auto: true, requires: { kind: 'lorePages', ids: [s.lore] },
    summary: `You have read of ${s.name}, ${s.title.toLowerCase()}. Somewhere in the ${s.zone.replace('-', ' ')} there is a shrine that nobody marks.`,
    stages: [stage('find', `Find the shrine of ${s.name}.`, [state('s', `Pray at the shrine of ${s.name}`, flag(`saint:${s.id}`))])],
    rewards: { xp: 0.3, gold: 10, favor: { [s.patron]: 30 } },
  },
  {
    id: `saint-${s.id}-2`, name: `${s.name.replace('Saint ', '')}’s Errand`, kind: 'side', level: 12, zone: s.zone, auto: true, requires: all(flag(`saint:${s.id}`)),
    summary: `The shrine asks for very little. ${s.deed[0]}, and the saint is satisfied.`,
    stages: [stage('deed', s.deed[0], [kill('k', s.deed[0], s.deed[2], { zone: s.deed[1] })])],
    rewards: { xp: 0.4, gold: 14, favor: { [s.patron]: 40 } },
  },
]);

/** Found all eight shrines. */
export const SAINT_RELIC: UniqueItemDef = {
  id: 'reliquary-of-the-eight', name: 'Reliquary of the Eight', rarity: 'relic', baseId: 'ancient-relic', level: 30,
  modifiers: [{ stat: 'maxHp', type: 'percent', value: 8 }, { stat: 'statusResist', type: 'flat', value: 10 }],
  activeAbility: { name: 'Eight Voices', description: 'Heal the party for 20% of max HP and give +15% damage for 3 turns.', effects: [{ kind: 'heal', percentMaxHp: 20, target: 'allAllies' }, { kind: 'buff', id: 'eight-voices', duration: 3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], target: 'allAllies' }], cooldown: 5 },
  awakening: { description: 'Win 100 battles while wearing it.', event: 'combatWon', count: 100, modifiers: [{ stat: 'maxHp', type: 'percent', value: 8 }, { stat: 'healingPower', type: 'flat', value: 15 }], effectText: '+8% max HP, +15% healing power' },
  effectText: ['Eight small bones in eight small boxes, and each one hums a different note'],
  lore: 'Nobody collected them on purpose. That is how saints work.',
};
