import { content, type Content } from '../../data';
import { MECHANICS, moonPhase, tideIsHigh, type MechanicDef } from '../../data/world/mechanics';
import type { Rng } from '../core/rng';
import type { Character } from '../character/types';
import { characterStats } from '../character/stats';
import { utilityRank } from '../skills/general';
import type { ZoneDef } from './types';

export const mechanicOf = (zone: ZoneDef): MechanicDef | undefined => MECHANICS.find((m) => m.zone === zone.id);

/** Meter is kept per character; it empties when you enter a zone with a different mechanic. */
export function currentMeter(char: Character, zone: ZoneDef): { def: MechanicDef; value: number } | undefined {
  const def = mechanicOf(zone);
  if (!def?.meter) return undefined;
  if (char.world.meter?.id !== def.id) char.world.meter = { id: def.id, value: 0 };
  return { def, value: char.world.meter.value };
}

/** A town, a waypoint, an inn or a camp clears the meter. */
export function resetMeter(char: Character): void {
  if (char.world.meter) char.world.meter.value = 0;
}

/** Lowers the meter (a consumable). Returns false if the item does not fit this region. */
export function reduceMeter(char: Character, meter: string, amount: number): boolean {
  if (!char.world.meter || char.world.meter.id !== meter) return false;
  char.world.meter.value = Math.max(0, char.world.meter.value - amount);
  return true;
}

export interface MechanicResult {
  message?: string;
  /** Fraction of max HP lost this step. */
  harm?: number;
  /** Turned around: move to a random open spot nearby. */
  lost?: boolean;
}

/** The Darkness of a dark dungeon: it rises with every step, and torches push it back. */
export function dungeonStep(char: Character, gimmick: string | undefined): MechanicResult {
  if (gimmick !== 'dark') return {};
  if (char.world.meter?.id !== 'darkness') char.world.meter = { id: 'darkness', value: 0 };
  char.world.meter.value = Math.min(100, char.world.meter.value + 1.1);
  return char.world.meter.value >= 100 && Math.floor(char.world.meter.value * 10) % 7 === 0 ? { message: 'The dark presses close.' } : {};
}

/** One step in the zone. `onPath` is true on roads (they slow the Bearings meter). */
export function mechanicStep(char: Character, zone: ZoneDef, night: boolean, onPath: boolean, rng: Rng, c: Content = content): MechanicResult {
  void c;
  const def = mechanicOf(zone);
  if (!def) return {};
  const stats = characterStats(char);
  if (def.vent) {
    if (def.offPath && onPath) return {};
    if (!rng.chance(def.vent.chance)) return {};
    const resist = Math.min(1, ((stats[def.relief as 'fireResist'] ?? 0) as number) / 60);
    if (resist >= 1) return { message: 'A vent erupts beside you. Your fireproofing holds.' };
    return { harm: def.vent.damage * (1 - resist), message: def.id === 'thorns' ? 'The thorns snag and tear.' : 'A vent erupts under your feet!' };
  }
  const meter = currentMeter(char, zone);
  if (!meter || !def.rise) return {};
  let rise = night ? def.rise.night : def.rise.day;
  if (def.id === 'bearings') {
    if (onPath) rise *= 0.25;
    rise *= 1 - Math.min(0.8, 0.08 * Math.max(utilityRank(char, 'animalSpeech'), utilityRank(char, 'detectTraps')));
  } else if (def.relief) {
    rise *= 1 - Math.min(0.8, ((stats[def.relief] ?? 0) as number) / 100);
  }
  const m = char.world.meter as { id: string; value: number };
  m.value = Math.min(100, m.value + rise);
  if (m.value < 100) return {};
  if (def.full === 'lost') {
    m.value = 40;
    return { lost: true, message: 'The paths shift. You are turned around.' };
  }
  if (def.full === 'harm') return { harm: def.harm ?? 0.03, message: `${def.meter} wears you down.` };
  return {};
}

/** Sight radius: the dark shortens it. */
export function sightRadius(char: Character, zone: ZoneDef, base: number, inDarkDungeon = false, day = 1): number {
  if (!inDarkDungeon && zone.mechanic === 'moon' && moonPhase(day) === 0) return 3;
  if (inDarkDungeon) return (char.world.meter?.id === 'darkness' ? char.world.meter.value : 0) >= 100 ? 2 : base;
  const def = mechanicOf(zone);
  if (def?.full === 'dark' && (char.world.meter?.id === def.id ? char.world.meter.value : 0) >= 100) return 2;
  return base;
}

/** The encounter multiplier from the region (a full darkness meter, a high tide). */
export function mechanicEncounterMult(char: Character, zone: ZoneDef, highTide: boolean, night = false, day = 1): number {
  const def = mechanicOf(zone);
  if (!def) return 1;
  if (def.id === 'curfew') return night ? 2 : 0.4;
  if (def.id === 'moon') return moonPhase(day) === 4 ? 1.3 : 1;
  if (def.full === 'dark' && char.world.meter?.id === def.id && char.world.meter.value >= 100) return 1.5;
  if (def.id === 'tides' && highTide) return 1.25;
  return 1;
}

export { moonPhase, tideIsHigh };
