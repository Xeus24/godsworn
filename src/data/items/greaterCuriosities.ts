import type { CuriosityDef } from '../../engine/items/types';
import type { QuestDef } from '../../engine/quests/types';
import { deliver, kill, stage } from '../story/helpers';

type Row = [id: string, name: string, level: number, value: number, lovedBy: string[], description: string];

/** Twelve more curiosities. The last four start secret quests when you carry them. */
const ROWS: Row[] = [
  ['moon-pillow', 'Moon-Stuffed Pillow', 1, 14, ['lyssara'], 'It sighs when you set it down.'],
  ['cornerstone-chip', 'Chip of a Cornerstone', 1, 12, ['ordrun'], 'It has not moved since you picked it up. It is not going to.'],
  ['wind-bell', 'Little Wind-Bell', 1, 10, ['seraphel'], 'It rings in a room with no draft.'],
  ['dated-ledger-page', 'Dated Ledger Page', 5, 28, ['mirrin', 'grimvald'], 'Next Thursday’s date is already on it, in your handwriting.'],
  ['dead-mans-pocketwatch', 'Dead Man’s Pocketwatch', 10, 45, ['morrath', 'mirrin'], 'Ticking. Its owner is not.'],
  ['saints-fingerbone-charm', 'Saint’s Fingerbone Charm', 5, 30, ['solenne', 'hesha'], 'Some saint, somewhere, is missing a finger on purpose.'],
  ['pressed-thornberry', 'Pressed Thornberry', 1, 6, ['ysolde'], 'Between two pages, still bright red.'],
  ['tin-soldier', 'Lopsided Tin Soldier', 1, 9, ['kael'], 'He has the bravest stance and the worst paint.'],
  ['torn-treasure-chart', 'Torn Treasure Chart', 8, 60, ['vex', 'grimvald'], 'The X is on the missing half. Someone has drawn a cheerful skull on the other.'],
  ['crowned-key', 'Crowned Key', 20, 150, ['solenne', 'ordrun'], 'It opens nothing. It is very sure it opens something.'],
  ['moth-eaten-playbill', 'Moth-Eaten Playbill', 15, 90, ['vex', 'lyssara'], 'THE LAST ACT, one night only. The date has been scratched out by something with many tiny feet.'],
  ['glass-feather', 'Glass Feather', 25, 220, ['seraphel', 'aurelis'], 'It is cold, and weighs nothing, and has never been dropped.'],
];

export const GREATER_CURIOSITIES: CuriosityDef[] = ROWS.map(([id, name, level, value, lovedBy, description]) => ({ id, name, category: 'curiosity', level, value, stack: 99, lovedBy, description }));

export const CURIOSITY_QUESTS: QuestDef[] = [
  { id: 'curio-torn-chart', name: 'The Other Half', kind: 'side', level: 12, auto: true, requires: { kind: 'item', itemId: 'torn-treasure-chart' }, summary: 'The Torn Treasure Chart has a cheerful skull where its X should be. Someone in the world holds the other half.',
    stages: [stage('hunt', 'Find the chart’s other half: cut down pirates and smugglers until one carries it.', [kill('k', 'Defeat bandits and smugglers', 8, { enemyType: 'humanoid' })])], rewards: { xp: 0.4, gold: 40, gear: { rarity: 'rare' } } },
  { id: 'curio-crowned-key', name: 'What the Key Opens', kind: 'side', level: 22, auto: true, requires: { kind: 'item', itemId: 'crowned-key' }, summary: 'The Crowned Key is certain it opens something. A key that sure should be followed.',
    stages: [stage('seek', 'Test the key where locks are stubborn: win battles in dungeons.', [kill('k', 'Defeat dungeon foes', 10, { tiers: ['elite', 'champion', 'miniboss', 'boss'] })])], rewards: { xp: 0.5, gold: 60, gear: { rarity: 'epic' } } },
  { id: 'curio-playbill', name: 'The Last Act, Rescheduled', kind: 'side', level: 16, auto: true, requires: { kind: 'item', itemId: 'moth-eaten-playbill' }, summary: 'The playbill promises a final performance and a date that something has chewed out. A theatre somewhere wants its audience.',
    stages: [stage('audience', 'Draw a crowd: defeat undead and constructs near the stage.', [kill('k', 'Defeat undead', 8, { enemyType: 'undead' })])], rewards: { xp: 0.4, gold: 40, gear: { rarity: 'rare' } } },
  { id: 'curio-glass-feather', name: 'The Weight of Nothing', kind: 'side', level: 26, auto: true, requires: { kind: 'item', itemId: 'glass-feather' }, summary: 'The Glass Feather weighs nothing and has never fallen. Some things do not want to be kept; they want to be delivered.',
    stages: [stage('deliver', 'Bring the feather to a priest of the wind.', [deliver('d', 'Bring the Glass Feather to a temple', 'glass-feather', 1, 'wanderer-pip')])], rewards: { xp: 0.6, gold: 80, gear: { rarity: 'epic' }, favor: { seraphel: 120 } } },
];
