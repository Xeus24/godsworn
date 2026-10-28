import { GREATER_CLASSES } from './classesGreater';
/** How a resource fills up in combat, on top of skills that generate it. */
export interface ResourceGains {
  /** Per damaging hit dealt. */
  onHitDealt?: number;
  /** Per 1% of max HP lost to a hit, capped per hit at onDamageTakenMax. */
  onDamageTakenPct?: number;
  onDamageTakenMax?: number;
  /** Per basic attack. */
  onBasicAttack?: number;
  /** At the start of each turn while one of your songs plays. */
  perTurnWhileSinging?: number;
  /** Whenever any enemy dies. */
  onEnemyDeath?: number;
  /** Lose all of it when a single hit takes at least this % of max HP. */
  loseAllOnHitPct?: number;
}

/**
 * Class resources. Every character also has MP; these sit alongside it.
 * `start` is the value at the beginning of each combat, and `decayPerTurn`
 * is lost at the end of each of the owner's turns.
 */
export interface ResourceDef {
  id: string;
  name: string;
  max: number;
  start: number;
  decayPerTurn: number;
  color: string;
  description: string;
  gains?: ResourceGains;
  /** When the pool fills, these effects hit its owner and the pool drops to `reset` (the Artificer's overheat). */
  overflow?: { effects: import('../engine/effects/types').EffectSpec[]; reset: number; text: string };
}

const BASE_RESOURCES: ResourceDef[] = [
  {
    id: 'rage',
    name: 'Rage',
    max: 100,
    start: 0,
    decayPerTurn: 5,
    color: '#d9433b',
    description: 'Builds when you deal or take damage. Fades slowly when idle.',
    gains: { onHitDealt: 4, onDamageTakenPct: 0.6, onDamageTakenMax: 15 },
  },
  {
    id: 'combo',
    name: 'Combo Points',
    max: 5,
    start: 0,
    decayPerTurn: 0,
    color: '#f2d14b',
    description: 'Builders add points, finishers spend them all for more damage.',
  },
  {
    id: 'faith',
    name: 'Faith',
    max: 100,
    start: 20,
    decayPerTurn: 0,
    color: '#ffe08a',
    description: 'Earned by smiting and healing. Fuels miracles.',
  },
  {
    id: 'focus',
    name: 'Focus',
    max: 5,
    start: 0,
    decayPerTurn: 0,
    color: '#7fd17f',
    description: 'Each stack adds 8% ranged damage. Lost when a single hit takes 15% of your HP.',
    gains: { loseAllOnHitPct: 15 },
  },
  {
    id: 'soulShards',
    name: 'Soul Shards',
    max: 5,
    start: 1,
    decayPerTurn: 0,
    color: '#9b7fd1',
    description: 'Harvested from the dying (+1 whenever an enemy falls). Spent on the strongest dark magic.',
    gains: { onEnemyDeath: 1 },
  },
  {
    id: 'chi',
    name: 'Chi',
    max: 5,
    start: 1,
    decayPerTurn: 0,
    color: '#5fd1c4',
    description: 'Built by basic attacks and strikes, spent on techniques. Stances shape your basic attacks.',
    gains: { onBasicAttack: 1 },
  },
  {
    id: 'verse',
    name: 'Verse',
    max: 100,
    start: 0,
    decayPerTurn: 0,
    color: '#e98ad6',
    description: 'Builds while a song plays (+10 per turn). Switching songs at 50+ Verse triggers a Crescendo.',
    gains: { perTurnWhileSinging: 10 },
  },
];

export const RESOURCES: ResourceDef[] = [...BASE_RESOURCES, ...GREATER_CLASSES.map((g) => g.resource)];
