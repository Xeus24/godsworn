import type { StatId } from '../../engine/stats/types';

/**
 * Each of the eight regions has a rule of its own. Five fill a meter as you walk (Bearings, Darkness,
 * Heat, Cold, Corruption); a full meter hurts, darkens the world or turns you around. Relief comes from
 * a resistance, a consumable, or a waypoint or town. The Meadowlands are gentle, the Stormcoast has tides,
 * and the Volcanic Rift has vents.
 */
export interface MechanicDef {
  id: string;
  zone: string;
  name: string;
  description: string;
  /** The meter's name, if it has one. */
  meter?: string;
  /** Meter gained per step by day and by night. */
  rise?: { day: number; night: number };
  /** A resistance that slows the rise: 1% per point (to 80%). */
  relief?: StatId;
  /** What a full meter does. */
  full?: 'harm' | 'dark' | 'lost';
  /** Share of max HP lost per step at full (for harm). */
  harm?: number;
  /** Chance per step of a vent erupting (vents), and its damage share. */
  vent?: { chance: number; damage: number };
  /** Vents that only strike off the road (thorns). */
  offPath?: boolean;
  /** Consumables that bring the meter down, and by how much. */
  reliefItems?: Record<string, number>;
}

export const MECHANICS: MechanicDef[] = [
  { id: 'harvest', zone: 'meadowlands', name: 'Fair Weather', description: 'A gentle land: herb patches give an extra herb, and there is nothing to wear you down.' },
  { id: 'bearings', zone: 'whisperwood', name: 'Shifting Paths', description: 'The wood rearranges itself. Off the road you slowly lose your bearings; when they go you are turned around. Animal Speech, a Compass Charm or a waypoint help.', meter: 'Bearings lost', rise: { day: 0.7, night: 1.0 }, full: 'lost', reliefItems: { 'compass-charm': 70 } },
  { id: 'darkness', zone: 'sunken-caves', name: 'Light Meter', description: 'The dark closes in as you walk. At full, you see only a few steps and the things in it see you. Torches push it back.', meter: 'Darkness', rise: { day: 0.6, night: 0.6 }, full: 'dark', reliefItems: { torch: 60 } },
  { id: 'heat', zone: 'ashen-desert', name: 'Heat', description: 'The sun beats down. At full heat you lose health with every step. Fire resistance, a Canteen and shade (a town or waypoint) help.', meter: 'Heat', rise: { day: 0.8, night: 0.25 }, relief: 'fireResist', full: 'harm', harm: 0.03, reliefItems: { canteen: 70 } },
  { id: 'cold', zone: 'frostspire', name: 'Cold', description: 'The cold sinks in. At full, you lose health with every step. Ice resistance, Hot Cider and a fire (a town or waypoint) help.', meter: 'Cold', rise: { day: 0.6, night: 1.0 }, relief: 'iceResist', full: 'harm', harm: 0.03, reliefItems: { 'hot-cider': 70 } },
  { id: 'tides', zone: 'stormcoast', name: 'Tides', description: 'The tide turns every six hours. At high tide the sea creatures are bolder; at low tide, tidepool caches are uncovered along the shore.' },
  { id: 'vents', zone: 'volcanic-rift', name: 'Vents', description: 'The ground vents without warning. Fire resistance blunts the burn; at 60% you are untouched.', vent: { chance: 0.02, damage: 0.05 }, relief: 'fireResist' },
  { id: 'corruption', zone: 'dark-citadel', name: 'Corruption', description: 'The Unwritten seeps into you. At full corruption you lose health with every step. Void and shadow resistance, Ward Salt and a waypoint help.', meter: 'Corruption', rise: { day: 0.9, night: 0.9 }, relief: 'voidResist', full: 'harm', harm: 0.025, reliefItems: { 'ward-salt': 60 } },
  // Phase 13
  { id: 'curfew', zone: 'aurelane', name: 'Curfew', description: 'By day the capital is nearly safe; after dark the Watch patrols, and so do those who avoid it.' },
  { id: 'moon', zone: 'moonfen', name: 'Moon Phases', description: 'The moon waxes and wanes over eight days. At the new moon you see little; at the full moon things hunt bolder and moonlit caches open in the reeds.' },
  { id: 'thorns', zone: 'thornreach', name: 'Wild Thorns', description: 'Off the road the thorns snag and cut. Nature resistance blunts it; at 60% you are untouched.', vent: { chance: 0.06, damage: 0.03 }, offPath: true, relief: 'natureResist' },
  { id: 'badair', zone: 'khazrum', name: 'Bad Air', description: 'The deep tunnels breathe foul. At full you lose health with every step. Nature resistance and a Safety Lamp help.', meter: 'Bad air', rise: { day: 0.8, night: 0.8 }, relief: 'natureResist', full: 'harm', harm: 0.03, reliefItems: { 'safety-lamp': 70 } },

  // Phase 14
  { id: 'gloom', zone: 'gloamwood', name: 'Gloaming', description: 'The wood sits at dusk. Gloom gathers as you walk, faster at night; at full you see only a few steps. Lanterns push it back.', meter: 'Gloom', rise: { day: 0.5, night: 1.0 }, full: 'dark', reliefItems: { 'glow-lantern': 60 } },
  { id: 'mirage', zone: 'saltglass', name: 'Mirage', description: 'The Flats lie. Off the road the mirage thickens by day; at full you are turned around. A Glass Lens or a waypoint clears it.', meter: 'Mirage', rise: { day: 0.9, night: 0.2 }, full: 'lost', reliefItems: { 'glass-lens': 70 } },
  { id: 'pressure', zone: 'merrowdeep', name: 'Pressure', description: 'The deep presses in. At full you lose health with every step. Earth resistance and an Air Pearl help.', meter: 'Pressure', rise: { day: 0.8, night: 0.8 }, relief: 'earthResist', full: 'harm', harm: 0.03, reliefItems: { 'air-pearl': 70 } },
  { id: 'steam', zone: 'clockwork-foundry', name: 'Steam Jets', description: 'Valves burst without warning. Fire resistance blunts the scald; at 60% you are untouched.', vent: { chance: 0.05, damage: 0.04 }, relief: 'fireResist' },
];

/** The moon runs eight days: phase 0 is new, 4 is full. */
export const MOON_PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
export const moonPhase = (day: number): number => ((day % 8) + 8) % 8;

/** The tide is high for six hours, low for six. */
export const tideIsHigh = (minuteOfDay: number): boolean => Math.floor(minuteOfDay / 360) % 2 === 1;
