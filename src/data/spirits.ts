import type { Feat } from '../engine/skills/feats';
import type { SummonDef } from '../engine/combat/types';
import type { Element } from '../engine/stats/types';

/**
 * The twenty-five spirits a Summoner can contract. Each is a summon plus a "Call" skill; the skill
 * appears (and goes on the hotbar) once the spirit's feat is met: kill what it haunts, fell the boss
 * it serves, or grow into it. The Ember Sprite is the first friend and needs nothing.
 */
export type SpiritRole = 'striker' | 'caster' | 'tank' | 'healer';

export interface SpiritDef {
  id: string;
  name: string;
  element: Element;
  role: SpiritRole;
  /** Base HP; other stats follow from the role. */
  hp: number;
  /** Bond Call costs. */
  bond: number;
  feat?: Feat;
  /** One line shown on the skill and in the Codex. */
  lore: string;
  /** Name of the basic attack. */
  attack: string;
}

const k = (enemy: string, count: number): Feat => ({ kind: 'kills', enemy, count });
const lv = (level: number): Feat => ({ kind: 'classLevel', level });

export const SPIRITS: SpiritDef[] = [
  { id: 'ember-sprite', name: 'Ember Sprite', element: 'fire', role: 'caster', hp: 26, bond: 15, lore: 'A coal that learned to follow someone.', attack: 'Cinder Flick' },
  { id: 'mossback', name: 'Mossback', element: 'nature', role: 'tank', hp: 80, bond: 20, feat: k('treant-sapling', 6), lore: 'A boulder with a garden on its back and no interest in leaving.', attack: 'Root Shove' },
  { id: 'dust-devil', name: 'Dust Devil', element: 'physical', role: 'striker', hp: 40, bond: 20, feat: k('dust-elemental', 5), lore: 'A small tantrum of the desert wind.', attack: 'Sand Lash' },
  { id: 'rime-wraith', name: 'Rime Wraith', element: 'ice', role: 'caster', hp: 34, bond: 25, feat: k('ice-elemental', 4), lore: 'The last thing a frozen traveler thought about, still thinking it.', attack: 'Hoarfrost' },
  { id: 'storm-finch', name: 'Storm Finch', element: 'lightning', role: 'striker', hp: 32, bond: 20, feat: k('storm-elemental', 4), lore: 'Small, bright and entirely made of the part of lightning that hurts.', attack: 'Spark Peck' },
  { id: 'gravel-hound', name: 'Gravel Hound', element: 'physical', role: 'tank', hp: 90, bond: 25, feat: k('crystal-golem', 3), lore: 'A guardian dog assembled from what the mine left behind.', attack: 'Granite Bite' },
  { id: 'brineling', name: 'Brineling', element: 'ice', role: 'healer', hp: 38, bond: 25, feat: k('drowned-sailor', 8), lore: 'A mouthful of sea that remembers being kind.', attack: 'Tide Touch' },
  { id: 'emberhound', name: 'Emberhound', element: 'fire', role: 'striker', hp: 46, bond: 25, feat: k('lava-hound', 4), lore: 'Loyal, loud, and never once warm to anyone but you.', attack: 'Scorch Bite' },
  { id: 'hollow-lantern', name: 'Hollow Lantern', element: 'shadow', role: 'caster', hp: 30, bond: 25, feat: k('restless-ghost', 8), lore: 'A lantern whose light is the other way round.', attack: 'Dim Beam' },
  { id: 'thornmother', name: 'Thornmother', element: 'nature', role: 'healer', hp: 44, bond: 30, feat: k('wyld-boar', 6), lore: 'She knits wounds with bramble and scolds while she does it.', attack: 'Bramble Slap' },
  { id: 'gutterkings-shade', name: 'Gutterking’s Shade', element: 'physical', role: 'striker', hp: 52, bond: 30, feat: k('goblin-king', 1), lore: 'The Goblin King, minus the throne and the dignity. Mostly the dignity.', attack: 'Rusty Crown' },
  { id: 'silkweaver', name: 'Silkweaver', element: 'nature', role: 'caster', hp: 40, bond: 30, feat: k('broodmother', 1), lore: 'One of the Broodmother’s ten thousand daughters, who decided to be polite.', attack: 'Silk Spit' },
  { id: 'gravewarden', name: 'Gravewarden', element: 'shadow', role: 'tank', hp: 110, bond: 35, feat: k('bone-lord', 1), lore: 'A crypt’s patient keeper, bound to you instead of the crypt.', attack: 'Grave Fist' },
  { id: 'tidemother', name: 'Tidemother', element: 'ice', role: 'healer', hp: 52, bond: 35, feat: k('tide-hag', 1), lore: 'The hag’s better half, who always wanted to be a nurse.', attack: 'Brine Wash' },
  { id: 'sunwisp', name: 'Sunwisp', element: 'holy', role: 'caster', hp: 44, bond: 35, feat: k('sun-king', 1), lore: 'A flicker of the Sun King’s promise, minus the tomb.', attack: 'Gilded Ray' },
  { id: 'frostfang', name: 'Frostfang', element: 'ice', role: 'striker', hp: 62, bond: 35, feat: k('frost-queen', 1), lore: 'The Frost Queen’s favorite hunting dog, finally off the leash.', attack: 'Rime Bite' },
  { id: 'salt-reaver', name: 'Salt Reaver', element: 'physical', role: 'striker', hp: 66, bond: 40, feat: k('pirate-captain', 1), lore: 'A cutlass-swinging ghost who owes you one.', attack: 'Brine Cutlass' },
  { id: 'deepcoil', name: 'Deepcoil', element: 'ice', role: 'tank', hp: 130, bond: 40, feat: k('leviathan-spawn', 1), lore: 'The Leviathan’s least-fierce child: still enormous.', attack: 'Coil Crush' },
  { id: 'magma-heart', name: 'Magma Heart', element: 'fire', role: 'tank', hp: 140, bond: 45, feat: k('magma-titan', 1), lore: 'A slow, slow fist of the Rift.', attack: 'Molten Slam' },
  { id: 'void-moth', name: 'Void Moth', element: 'void', role: 'caster', hp: 50, bond: 45, feat: k('void-commander', 1), lore: 'It eats light and apologizes after.', attack: 'Hollow Dust' },
  { id: 'oathwisp', name: 'Oathwisp', element: 'holy', role: 'healer', hp: 58, bond: 30, feat: lv(10), lore: 'A promise you made once, now sitting on your shoulder.', attack: 'Warm Glow' },
  { id: 'wildmane', name: 'Wildmane', element: 'nature', role: 'striker', hp: 70, bond: 35, feat: lv(20), lore: 'A lion of leaves, seen in no forest.', attack: 'Leaf Rake' },
  { id: 'stormcaller-spirit', name: 'Stormcaller Spirit', element: 'lightning', role: 'caster', hp: 60, bond: 40, feat: lv(30), lore: 'The weather, who has decided to be on your side.', attack: 'Thunder Word' },
  { id: 'ashen-sage', name: 'Ashen Sage', element: 'arcane', role: 'caster', hp: 70, bond: 45, feat: lv(40), lore: 'A scholar-ghost who finally has a student.', attack: 'Burnt Footnote' },
  { id: 'ancestor-king', name: 'Ancestor King', element: 'physical', role: 'tank', hp: 170, bond: 50, feat: lv(50), lore: 'Every summoner’s grandmother’s grandmother, in a crown.', attack: 'Royal Decree' },
];

const ROLE_STATS: Record<SpiritRole, { atk: number; mag: number; def: number; res: number; speed: number; ai: SummonDef['ai']; ranged: boolean; magic: boolean }> = {
  striker: { atk: 9, mag: 0, def: 5, res: 4, speed: 12, ai: 'aggressive', ranged: false, magic: false },
  caster: { atk: 2, mag: 10, def: 3, res: 7, speed: 10, ai: 'caster', ranged: true, magic: true },
  tank: { atk: 7, mag: 0, def: 12, res: 8, speed: 7, ai: 'defensive', ranged: false, magic: false },
  healer: { atk: 2, mag: 8, def: 4, res: 8, speed: 10, ai: 'healer', ranged: true, magic: true },
};

const PALETTE: Record<string, [string, string]> = {
  fire: ['#e8602a', '#ffd070'], ice: ['#8ac8f0', '#e8f8ff'], nature: ['#5ab04a', '#c8e898'], lightning: ['#f0e060', '#fffaa0'],
  shadow: ['#4a3a6a', '#b090e8'], holy: ['#f0e8b0', '#ffffff'], physical: ['#a89880', '#e8d8b8'], arcane: ['#9a6ae8', '#e0c8ff'], void: ['#2a1a4a', '#a060f0'], poison: ['#6a9a3a', '#c0e070'],
};

/** The summon a spirit becomes in battle. */
export function spiritSummon(s: SpiritDef): SummonDef {
  const r = ROLE_STATS[s.role];
  const [main, accent] = PALETTE[s.element] ?? PALETTE.physical!;
  return {
    id: `spirit-${s.id}`, name: s.name, family: 'spirit', types: ['spirit', 'summon'],
    stats: { hp: s.hp, attack: r.atk, magic: r.mag, defense: r.def, magicResist: r.res, speed: r.speed },
    ownerPowerShare: s.role === 'tank' ? 0.8 : 1,
    skills: s.role === 'healer' ? [{ id: 'mend-ally' }] : s.role === 'tank' ? [{ id: 'shield-bash' }] : [],
    basicAttack: { element: s.element, ranged: r.ranged, ...(r.magic ? { magic: true } : {}), name: s.attack },
    ai: r.ai, duration: 7, palette: { main, accent },
  };
}
