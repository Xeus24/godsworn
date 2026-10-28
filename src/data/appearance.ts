/** Dyes, and portrait frames earned from achievements. Adding an entry here adds it to the game. */
export interface DyeDef {
  id: string;
  name: string;
  color: string;
  /** Gold to learn the dye at the Wardrobe; 0 means everyone starts with it. */
  cost: number;
}

export interface FrameDef {
  id: string;
  name: string;
  /** Border colors, outer then inner. */
  colors: [string, string];
  /** Achievement that grants it; undefined means free. */
  achievement?: string;
  description: string;
}

export const DYES: readonly DyeDef[] = [
  { id: 'ash', name: 'Ash Grey', color: '#8a8f98', cost: 0 },
  { id: 'ink', name: 'Ink Black', color: '#2b2a36', cost: 0 },
  { id: 'bone', name: 'Bone White', color: '#e8e2d0', cost: 0 },
  { id: 'rust', name: 'Rust Red', color: '#a8452c', cost: 0 },
  { id: 'moss', name: 'Moss Green', color: '#5a7a3a', cost: 0 },
  { id: 'tide', name: 'Tide Blue', color: '#3b6ea8', cost: 0 },
  { id: 'ochre', name: 'Ochre', color: '#c89a2c', cost: 0 },
  { id: 'heather', name: 'Heather', color: '#7a5a96', cost: 0 },
  { id: 'crimson', name: 'Crimson', color: '#c0213a', cost: 400 },
  { id: 'emerald', name: 'Emerald', color: '#1fa860', cost: 400 },
  { id: 'sapphire', name: 'Sapphire', color: '#2358d6', cost: 400 },
  { id: 'amethyst', name: 'Amethyst', color: '#9b3fd0', cost: 600 },
  { id: 'saffron', name: 'Saffron', color: '#f2a516', cost: 600 },
  { id: 'rose', name: 'Rose Gold', color: '#e0917a', cost: 900 },
  { id: 'verdigris', name: 'Verdigris', color: '#3fb5a0', cost: 900 },
  { id: 'void', name: 'Voidglass', color: '#150a2b', cost: 1500 },
];

export const FRAMES: readonly FrameDef[] = [
  { id: 'plain', name: 'Plain', colors: ['#3a3248', '#241d30'], description: 'No frame to speak of.' },
  { id: 'oath', name: 'Oathbound', colors: ['#c9a24a', '#6e5624'], achievement: 'chapter-1', description: 'Begin the oath.' },
  { id: 'slayer', name: 'Slayer', colors: ['#b8352c', '#5e1814'], achievement: 'kills-1000', description: 'Slay a thousand foes.' },
  { id: 'delver', name: 'Delver', colors: ['#6a7480', '#2c333b'], achievement: 'dungeon-all', description: 'Clear every dungeon.' },
  { id: 'titan', name: 'Titan-Slayer', colors: ['#e0b030', '#8a5a10'], achievement: 'world-boss-all', description: 'Fell every world boss.' },
  { id: 'devoted', name: 'Devoted', colors: ['#f3e6a8', '#a88a2e'], achievement: 'devoted', description: 'Become Devoted to a god.' },
  { id: 'chosen', name: 'Chosen', colors: ['#fff2b8', '#d0a020'], achievement: 'apostle', description: 'Become an Apostle.' },
  { id: 'lore', name: 'Lorekeeper', colors: ['#5a8ad0', '#243a66'], achievement: 'lore-all', description: 'Find every lore page.' },
  { id: 'rift', name: 'Riftborn', colors: ['#9b4de0', '#3a1466'], achievement: 'rift-10', description: 'Reach Rift tier 10.' },
  { id: 'wheel', name: 'Wheel-Turner', colors: ['#7fd0c0', '#2a6a5e'], achievement: 'ng-1', description: 'Begin New Game+.' },
  { id: 'unwritten', name: 'Unwritten', colors: ['#2b1b3d', '#b05cff'], achievement: 'twilight-unwritten', description: 'Take the Unwritten Crown.' },
  { id: 'complete', name: 'Completionist', colors: ['#ffffff', '#c0c0ff'], achievement: 'achievements-60', description: 'Earn 60 achievements.' },
];
