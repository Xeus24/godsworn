import type { HouseRoomDef } from '../../engine/world/types';
import { flat, pct } from '../trees/builder';

/** Price of a house (bought in a town that sells them). */
export const HOUSE_PRICE = 2000;

/**
 * Rooms you can add to your house. Each gives its bonus everywhere while
 * you own it; some also produce something each day you visit.
 */
export const HOUSE_ROOMS: HouseRoomDef[] = [
  { id: 'bedroom', name: 'Bedroom', description: 'Rest at home for free and wake Well Rested (+5% damage, 3 battles).', costs: [500] },
  { id: 'forge', name: 'Forge', description: 'Repairs all your gear for free when you visit; +5% defense per level.', costs: [1500, 4000, 10000], modifiers: [[pct('defense', 5)], [pct('defense', 10)], [pct('defense', 15)]] },
  { id: 'alchemy-lab', name: 'Alchemy Lab', description: 'Brews potions each day (1/2/3 per level); +5 healing power per level.', costs: [1200, 3500, 9000], modifiers: [[flat('healingPower', 5)], [flat('healingPower', 10)], [flat('healingPower', 15)]] },
  { id: 'shrine-room', name: 'Shrine Room', description: 'Pray to your patron at home (counts as a shrine); +5% favor gain per level.', costs: [2000, 5000, 12000], modifiers: [[flat('favorGain', 5)], [flat('favorGain', 10)], [flat('favorGain', 15)]] },
  { id: 'trophy-room', name: 'Trophy Room', description: 'Displays world boss trophies: +2% damage per different world boss slain.', costs: [3000] },
  { id: 'vault', name: 'Vault', description: 'An extra stash tab, and +5% gold find per level.', costs: [2500, 7000], modifiers: [[flat('goldFind', 5)], [flat('goldFind', 10)]] },
];
