/** The ship: built at Saltmere's harbor, upgraded in four steps, then joined by an airship. */
export interface ShipLevelDef {
  level: number;
  name: string;
  gold: number;
  materials: { itemId: string; qty: number }[];
  /** Broadside at the start of a naval battle: share of each enemy's max HP. */
  volley: number;
  description: string;
}

export const SHIP_LEVELS: ShipLevelDef[] = [
  { level: 1, name: 'Cutter', gold: 3000, materials: [{ itemId: 'ironwood-plank', qty: 4 }, { itemId: 'wool-bolt', qty: 6 }], volley: 15, description: 'A small, quick boat with one swivel gun. It will get you to the near islands.' },
  { level: 2, name: 'Sloop', gold: 6500, materials: [{ itemId: 'ironwood-plank', qty: 6 }, { itemId: 'spider-silk', qty: 4 }, { itemId: 'steel-ingot', qty: 4 }], volley: 25, description: 'Two masts and four guns. Opens the reefs.' },
  { level: 3, name: 'Brigantine', gold: 13000, materials: [{ itemId: 'adamant-ingot', qty: 4 }, { itemId: 'silk-bolt', qty: 6 }, { itemId: 'elderwood-plank', qty: 4 }], volley: 35, description: 'A real warship. Opens the far shoals and the haunted isle.' },
  { level: 4, name: 'Galleon', gold: 26000, materials: [{ itemId: 'starmetal-ingot', qty: 4 }, { itemId: 'thread-of-dawn', qty: 4 }, { itemId: 'elderwood-plank', qty: 6 }], volley: 50, description: 'Eighty guns and a figurehead that scowls. Nothing at sea frightens it.' },
];

export const AIRSHIP = {
  name: 'The Skylark',
  gold: 40000,
  materials: [{ itemId: 'wyvern-leather', qty: 6 }, { itemId: 'thread-of-dawn', qty: 6 }, { itemId: 'starmetal-ingot', qty: 6 }],
  /** Ship level needed, and the story you must have reached. */
  needsShip: 3,
  needsQuest: 'main-5',
  description: 'A hull hung beneath a bag of wyvern leather and sunrise. It flies where nothing walks.',
};

/** Voyages needed before each ship-only area shows up on the charts. */
export const ISLAND_REVEAL: Record<string, number> = {
  'gull-rock': 0,
  'kelp-hollow': 1,
  'pirates-rest': 2,
  'sirens-reef': 3,
  'isle-of-echoes': 5,
  'drowned-lighthouse': 7,
};

/** Chance of a naval battle on a voyage, before the ship's level lowers it. */
export const NAVAL_CHANCE = 0.45;
export const NAVAL_CHANCE_PER_LEVEL = 0.07;
