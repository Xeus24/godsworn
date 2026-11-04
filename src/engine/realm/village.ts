import { BUILDINGS, EMBERFALL, VILLAGERS, type BuildingDef, type Cost } from '../../data/emberfall';
import type { ModifierSpec } from '../stats/modifiers';
import type { VillageState } from './types';

export const levelOf = (v: VillageState, id: string): number => v.buildings[id] ?? 0;
export const buildingOf = (id: string): BuildingDef | undefined => BUILDINGS.find((b) => b.id === id);

export const housing = (v: VillageState): number => EMBERFALL.baseHousing + ((BUILDINGS.find((b) => b.id === 'longhouse')?.housing?.[levelOf(v, 'longhouse') - 1]) ?? 0);
export const population = (v: VillageState): number => v.settled.length;

/** The cost of the next level of a building, or undefined if it is as high as it goes. */
export function nextCost(v: VillageState, id: string): Cost | undefined {
  const b = buildingOf(id);
  const lvl = levelOf(v, id);
  return b && lvl < 3 ? b.costs[lvl] : undefined;
}

export function canAfford(v: VillageState, cost: Cost, gold: number): string | undefined {
  if (gold < cost.gold) return `Needs ${cost.gold} gold.`;
  if ((cost.timber ?? 0) > v.timber) return `Needs ${cost.timber} timber (you have ${Math.floor(v.timber)}).`;
  if ((cost.stone ?? 0) > v.stone) return `Needs ${cost.stone} stone (you have ${Math.floor(v.stone)}).`;
  return undefined;
}

/** Villagers who would come and live here: their building is high enough and they have not yet settled. */
export const arriving = (v: VillageState) => VILLAGERS.filter((p) => levelOf(v, p.building) >= p.level && !v.settled.includes(p.id));

export function defense(v: VillageState, heroLevel: number): number {
  let d = Math.floor(heroLevel / EMBERFALL.heroDefenseDivisor);
  const tower = buildingOf('watchtower');
  d += tower?.defense?.[levelOf(v, 'watchtower') - 1] ?? 0;
  d += v.settled.filter((id) => VILLAGERS.find((p) => p.id === id)?.building === 'watchtower').length * EMBERFALL.guardDefense;
  return d;
}

/** One day of the village: what it makes, and eats. Returns what it made. */
export function produce(v: VillageState): { timber: number; stone: number; grain: number; gold: number; hungry: boolean } {
  const made = { timber: 0, stone: 0, grain: 0, gold: 0, hungry: false };
  const hungry = v.grain < population(v) * EMBERFALL.grainPerVillager;
  made.hungry = hungry;
  for (const b of BUILDINGS) {
    const lvl = levelOf(v, b.id);
    if (!lvl) continue;
    if (b.produce) {
      const hands = v.settled.filter((id) => VILLAGERS.find((p) => p.id === id)?.building === b.id).length;
      made[b.produce.res] += b.produce.per[lvl - 1]! + (hungry ? 0 : hands * EMBERFALL.villagerProduce);
    }
    made.gold += b.income?.[lvl - 1] ?? 0;
  }
  made.gold += population(v) * EMBERFALL.villagerCoin;
  v.timber += made.timber;
  v.stone += made.stone;
  v.grain = Math.max(0, v.grain + made.grain - population(v) * EMBERFALL.grainPerVillager);
  v.coffers += made.gold;
  return made;
}

/** What the buildings give the hero. */
export function perks(v: VillageState): ModifierSpec[] {
  return BUILDINGS.flatMap((b) => (b.perk && levelOf(v, b.id) ? b.perk.mods[levelOf(v, b.id) - 1] ?? [] : []));
}

/** Pens the ranch building has added. */
export const ranchPens = (v: VillageState): number => BUILDINGS.find((b) => b.id === 'ranch')?.pens?.[levelOf(v, 'ranch') - 1] ?? 0;

/** Strength of a raid: a base, and more if a scarred Grudgebound leads it. */
export const raidStrength = (scars: number): number => EMBERFALL.raidStrength + scars * EMBERFALL.raidPerScar;

export const raidChance = (v: VillageState): number => EMBERFALL.raidBase + Object.values(v.buildings).filter((l) => l > 0).length * EMBERFALL.raidPerBuilding;
