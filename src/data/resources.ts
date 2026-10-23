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
}

export const RESOURCES: ResourceDef[] = [
  {
    id: 'rage',
    name: 'Rage',
    max: 100,
    start: 0,
    decayPerTurn: 5,
    color: '#d9433b',
    description: 'Builds when you deal or take damage. Fades slowly when idle.',
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
    description: 'Each stack adds ranged damage. Lost when you take a heavy hit.',
  },
  {
    id: 'soulShards',
    name: 'Soul Shards',
    max: 5,
    start: 1,
    decayPerTurn: 0,
    color: '#9b7fd1',
    description: 'Harvested from the dying. Spent on the strongest dark magic.',
  },
  {
    id: 'chi',
    name: 'Chi',
    max: 5,
    start: 1,
    decayPerTurn: 0,
    color: '#5fd1c4',
    description: 'Built by strikes, spent on techniques. Stances shape your basic attacks.',
  },
  {
    id: 'verse',
    name: 'Verse',
    max: 100,
    start: 0,
    decayPerTurn: 0,
    color: '#e98ad6',
    description: 'Builds while a song plays. Switching songs at 50+ Verse triggers a Crescendo.',
  },
];
