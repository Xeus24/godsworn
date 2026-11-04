import type { ModifierSpec } from '../engine/stats/modifiers';

const m = (stat: string, value: number, type: 'flat' | 'more' = 'flat'): ModifierSpec => ({ stat, type, value } as ModifierSpec);

// ------------------------------------------------------------------ 43: Duel Tournaments

export const TOURNAMENT = {
  /** Held on this festival’s day (see the Wheel); one entry per calendar year. */
  festival: 'hundred-duels',
  minLevel: 15,
  /** Rounds in the bracket: quarter-final, semi-final, final. */
  rounds: 3,
  goldPerLevelPerRound: 30,
  champion: { goldPerLevel: 150, title: 'Champion of the Hundred Duels' },
  rivalLevelBonus: 1,
} as const;

/** Rival heroes: the names of the people you meet in the bracket (the class rivals of item 81 will join them). */
export const RIVALS = ['Brannoch the Ironbound', 'Isolde Vane', 'Quill-Hand Marek', 'Sister Cassia of the Flail', 'Tobias Underhill', 'Old Greyfist', 'Valka Moonreach', 'The Gilded Dahlia', 'Ser Penwarden', 'Ashe the Quiet', 'Hob of the Hundred Cuts', 'Mirelle Duskwhisper'];

// ------------------------------------------------------------------ 55: Dreamscape Dungeons

export interface Fear { companion: string; fear: string; text: string; types: string[]; reward: string }
// prettier-ignore
export const FEARS: Fear[] = [
  { companion: 'aldric', fear: 'The Empty Banner', text: 'A shield wall with no one behind it. The banner is blank, and it is yours.', types: ['undead', 'humanoid'], reward: 'Aldric stops counting those he could not save.' },
  { companion: 'fenn', fear: 'The Long Net', text: 'Every road ends in a net, and the net has a hundred hands.', types: ['humanoid', 'bandit'], reward: 'Fenn laughs, and means it, for the first time in months.' },
  { companion: 'korga', fear: 'The Quiet Hall', text: 'A hall of her ancestors, and none of them will speak her name.', types: ['spirit', 'giant'], reward: 'Korga is, for a moment, speechless; then she roars.' },
  { companion: 'ilyra', fear: 'The Unwritten Page', text: 'A library where every book is blank, and she is the ink.', types: ['arcane', 'construct'], reward: 'Ilyra writes one line of her own and does not cross it out.' },
  { companion: 'sable', fear: 'The Lit Room', text: 'A room with no shadows. There is nowhere to be nobody.', types: ['divine', 'celestial'], reward: 'Sable steps into the light and is not made smaller by it.' },
  { companion: 'marisol', fear: 'The Burning Ward', text: 'A hospital with the fires lit. She knows every name on the beds.', types: ['elemental', 'cultist'], reward: 'Marisol sleeps through the whole night.' },
  { companion: 'edrin', fear: 'The Hollow Choir', text: 'Singing, from a thousand mouths, in a key he almost recognises.', types: ['spirit', 'nightmare'], reward: 'Edrin hums a tune of his own. It is not the choir’s.' },
  { companion: 'thistle', fear: 'The Wilting Garden', text: 'Everything she planted, grown wrong.', types: ['plant', 'beast'], reward: 'Thistle plants something and is not afraid to watch it grow.' },
  { companion: 'thorne', fear: 'The Open Cell', text: 'A cell door, standing open. He has never once walked through.', types: ['construct', 'golem'], reward: 'Thorne closes the door behind him, from the outside.' },
  { companion: 'hrafna', fear: 'The Silent Sea', text: 'The tide goes out and does not return.', types: ['water', 'reptile'], reward: 'Hrafna hears waves again.' },
  { companion: 'bexley', fear: 'The Counting House', text: 'A ledger that adds up. It adds up to nothing.', types: ['void', 'unsworn'], reward: 'Bexley, astonishingly, forgives a debt.' },
  { companion: 'zeph', fear: 'The Grounded Sky', text: 'A sky of lead. His wings are very heavy.', types: ['celestial', 'dragon'], reward: 'Zeph takes off, badly, joyously.' },
  { companion: 'kessa', fear: 'The Mirror Court', text: 'A hundred mirrors and each one answers for her.', types: ['fae', 'cultist'], reward: 'Kessa breaks a mirror and likes the sound.' },
  { companion: 'tick', fear: 'The Wound-Down Clock', text: 'Silence in the gears. No one is coming to wind him.', types: ['construct', 'puppet'], reward: 'Tick winds himself, and keeps time.' },
];
export const DREAMS = { fights: 4, approval: 8, mod: m('statusResist', 2), title: 'Dream-Walker of Friends' } as const;

// ------------------------------------------------------------------ 56: Moon-Blood Hunts

export interface Quarry { id: string; name: string; types: string[]; text: string; level: number }
// prettier-ignore
export const QUARRIES: Quarry[] = [
  { id: 'q-wolf', name: 'The Red-Eyed Wolf', types: ['beast'], text: 'It has been seen only under a red moon.', level: 0 },
  { id: 'q-hound', name: 'The Pale Hound', types: ['beast', 'spirit'], text: 'It follows the road a mile behind you.', level: 2 },
  { id: 'q-stag', name: 'The Bleeding Stag', types: ['beast'], text: 'Its antlers drip.', level: 4 },
  { id: 'q-widow', name: 'The Moon-Widow', types: ['undead'], text: 'She walks the fields in mourning white.', level: 6 },
  { id: 'q-moth', name: 'The Great Moth', types: ['insect', 'beast'], text: 'Its wings hum a note you can feel in your teeth.', level: 8 },
  { id: 'q-priest', name: 'The Hollow Priest', types: ['cultist', 'humanoid'], text: 'He reads aloud, to no one.', level: 10 },
  { id: 'q-drake', name: 'The Ember Drake', types: ['drake', 'dragon'], text: 'The red moon is the only one it trusts.', level: 12 },
  { id: 'q-twins', name: 'The Weeping Twins', types: ['spirit', 'undead'], text: 'One cries; the other makes the sound.', level: 14 },
  { id: 'q-giant', name: 'The Red Giant', types: ['giant'], text: 'A shape against the moon, with a moon of its own.', level: 16 },
  { id: 'q-eel', name: 'The Blood-Eel', types: ['water', 'reptile'], text: 'Lakes go red where it passes.', level: 18 },
  { id: 'q-angel', name: 'The Fallen Choir-Master', types: ['celestial', 'divine'], text: 'It keeps time with a broken wing.', level: 20 },
  { id: 'q-void', name: 'The Eclipse Itself', types: ['void'], text: 'Nobody has seen it up close and described it twice the same way.', level: 24 },
];
export const HUNTS = { minLevel: 20, goldPerLevel: 60, riftMaps: 1, title: 'Moon-Hunter' } as const;

// ------------------------------------------------------------------ 57: Shipwreck Diving

export interface Wreck { id: string; name: string; zone: string; text: string; depth: number }
// prettier-ignore
export const WRECKS: Wreck[] = [
  { id: 'wr-gull', name: 'The Gull’s Folly', zone: 'stormcoast', text: 'A merchant sloop, hull-down in the shallows.', depth: 1 },
  { id: 'wr-pearl', name: 'The Pearl of Saltmere', zone: 'saltglass', text: 'A salt-barge, glittering with crust.', depth: 1 },
  { id: 'wr-tide', name: 'The Tide-Mother’s Gift', zone: 'merrowdeep', text: 'A temple-ship in the dark.', depth: 3 },
  { id: 'wr-bell', name: 'The Drowned Bell', zone: 'merrowdeep', text: 'A church that sank with its congregation.', depth: 3 },
  { id: 'wr-reaver', name: 'The Reaver Queen', zone: 'shattered-isles', text: 'A corsair, still flying a flag nobody remembers.', depth: 2 },
  { id: 'wr-cog', name: 'The Clockwork Barge', zone: 'clockwork-foundry', text: 'A ferry that ticks, faintly, under the slag.', depth: 2 },
  { id: 'wr-ferry', name: 'The Black Ferry', zone: 'hollow-barrows', text: 'Morrath’s own ferry, run aground.', depth: 3 },
  { id: 'wr-moat', name: 'The Citadel Barge', zone: 'dark-citadel', text: 'A pleasure-boat, for a king who did not enjoy pleasure.', depth: 2 },
  { id: 'wr-fen', name: 'The Fen-Lantern', zone: 'moonfen', text: 'A fishing skiff with its lantern still lit.', depth: 1 },
  { id: 'wr-cloud', name: 'The Sunken Cloud-Skiff', zone: 'skyreach', text: 'A skiff that fell the wrong way.', depth: 2 },
];
export const DIVING = { air: 10, minLevel: 10, goldPerDepth: 40, shardChance: 0.15, title: 'Salvager' } as const;

// ------------------------------------------------------------------ 54: Sky Islands

export type Tilt = 'up' | 'down' | 'left' | 'right';
export const TILTS: Tilt[] = ['up', 'down', 'left', 'right'];
export interface SkyIsland { id: string; name: string; text: string; minLevel: number; goldPerLevel: number; reward: ModifierSpec[] }
// prettier-ignore
export const ISLANDS: SkyIsland[] = [
  { id: 'si-lintel', name: 'Lintel Rock', text: 'A slab of stone hung by one corner. The wind blows up from every direction at once.', minLevel: 30, goldPerLevel: 60, reward: [m('dodge', 2)] },
  { id: 'si-cradle', name: 'The Cradle', text: 'A bowl of earth with a lake that will not stay put.', minLevel: 34, goldPerLevel: 70, reward: [m('hpRegen', 1)] },
  { id: 'si-spindle', name: 'Spindle Spire', text: 'A needle of stone rotating very slowly.', minLevel: 38, goldPerLevel: 80, reward: [m('speed', 2)] },
  { id: 'si-orchard', name: 'The Upside-Down Orchard', text: 'Apple trees growing downward, fruit falling up.', minLevel: 42, goldPerLevel: 90, reward: [m('healingPower', 4)] },
  { id: 'si-chapel', name: 'The Weathervane Chapel', text: 'A chapel that faces whichever way the wind is not.', minLevel: 46, goldPerLevel: 100, reward: [m('blessingPower', 3)] },
  { id: 'si-crown', name: 'The Crown of Clouds', text: 'The highest island, where the sky is the floor.', minLevel: 52, goldPerLevel: 120, reward: [m('luk', 2), m('critChance', 2)] },
];
export const SKY = { steps: 3, title: 'Sky-Walker' } as const;
