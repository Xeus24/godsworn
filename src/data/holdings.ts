import type { QuestDef } from '../engine/quests/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import { kill, stage } from './story/helpers';

/**
 * Holdings (Section I-7c, item 221): every class has a building in Emberfall, raised in three levels. Level 1 costs gold and stores;
 * levels 2 and 3 each also need a small quest done first (`holding-<class>-2`, `-3`). Each level gives passive perks.
 */
type Perk = [stat: string, type: 'flat' | 'percent', base: number];
const P: Record<string, Perk> = {
  hp: ['maxHp', 'percent', 3], def: ['defense', 'percent', 3], mag: ['magicAttack', 'percent', 3], phys: ['physicalAttack', 'percent', 3], crit: ['critChance', 'flat', 1.5],
  dodge: ['dodge', 'flat', 1.5], heal: ['healingPower', 'flat', 3], res: ['resourceGain', 'flat', 3], status: ['statusChance', 'flat', 2], mr: ['magicResist', 'percent', 3],
  speed: ['speed', 'percent', 2], xp: ['xpGain', 'flat', 2], gold: ['goldFind', 'flat', 3], regen: ['hpRegen', 'flat', 0.5], mp: ['maxMp', 'percent', 3], sr: ['statusResist', 'flat', 2],
};

// [class id, building, blurb, perk A, perk B]
// prettier-ignore
const ROWS: [string, string, string, keyof typeof P, keyof typeof P][] = [
  ['warrior', 'The Drill Yard', 'Posts, sandbags and a very tired sergeant.', 'phys', 'hp'], ['mage', 'The Orrery Tower', 'A tall room full of brass that turns on its own.', 'mag', 'mp'],
  ['rogue', 'The Back Room', 'Behind the tavern, behind a door that is behind another door.', 'crit', 'dodge'], ['cleric', 'The Little Chapel', 'Six pews, one candle and a roof that is nearly done.', 'heal', 'mr'],
  ['ranger', 'The Long Range', 'A row of butts, a quiver rack and a view of the whole valley.', 'phys', 'dodge'], ['necromancer', 'The Charnel Annex', 'Quiet, cold and very well ventilated.', 'mag', 'sr'],
  ['monk', 'The Still Garden', 'Raked gravel, three stones and a bell nobody rings.', 'dodge', 'speed'], ['bard', 'The Songhouse', 'A hall that sounds better than it looks.', 'res', 'xp'],
  ['knight', 'The Armoury', 'Racks of shields, all with the same crest and different dents.', 'def', 'hp'], ['druid', 'The Grove Ring', 'A circle of living trees that arrived without being asked.', 'regen', 'heal'],
  ['warlock', 'The Pact Room', 'A table, two chairs and a contract that keeps getting longer.', 'mag', 'status'], ['summoner', 'The Calling Floor', 'Chalk lines, a drain and a polite sign.', 'res', 'mag'],
  ['alchemist', 'The Still House', 'Copper, glass and a smell no one will name.', 'mp', 'xp'], ['shaman', 'The Spirit Lodge', 'A low house of hides and drums.', 'heal', 'hp'],
  ['chronomancer', 'The Slow Room', 'A clockwork that is never quite the right time.', 'speed', 'mag'], ['artificer', 'The Workshop', 'Gears in neat trays, and a bench that has seen things.', 'phys', 'gold'],
  ['dancer', 'The Dance Floor', 'Sprung boards under a high skylight.', 'dodge', 'res'], ['inkweaver', 'The Scriptorium', 'Slanted desks and a pot of something that moves.', 'mag', 'xp'],
  ['witchhunter', 'The Watch-Lodge', 'Silver nails on the door, on principle.', 'status', 'mr'], ['geomancer', 'The Stone Garden', 'Boulders arranged by someone who talks to boulders.', 'def', 'hp'],
  ['hemomancer', 'The Red Cellar', 'Cool, dark and not as empty as it seems.', 'mag', 'regen'], ['hollowhand', 'The Empty Room', 'A room with nothing in it. It took a long time to build.', 'crit', 'sr'],
  ['dreamwalker', 'The Sleeping Hall', 'Forty beds and no one in them, quite.', 'status', 'mp'], ['dragonsoul', 'The Ember Hearth', 'A hearth far too large for the house around it.', 'phys', 'mr'],
  ['puppeteer', 'The Little Theatre', 'A stage the size of a table.', 'status', 'crit'], ['hollowking', 'The Hollow Throne', 'A chair in an empty hall, politely waiting.', 'hp', 'phys'],
  ['oathbreaker', 'The Broken Oath Hall', 'Every beam is cut and rejoined.', 'phys', 'speed'], ['godslayer', 'The Pale Shrine', 'A shrine to nothing, kept very clean.', 'phys', 'crit'],
  ['voidwalker', 'The Doorless Room', 'A house with no door. You use it anyway.', 'dodge', 'mag'], ['celestial', 'The Star Roof', 'Glass overhead, and the night all through it.', 'heal', 'mag'],
  ['vowknight', 'The Oath Stone', 'A single standing stone with names cut into it.', 'def', 'sr'], ['wrathsworn', 'The Mead Hall', 'Long tables, loud walls and one very sturdy bench.', 'phys', 'hp'],
  ['stillhand', 'The Quiet Dojo', 'A floor you can hear yourself on.', 'dodge', 'speed'], ['wayfinder', 'The Waymark Post', 'A signpost with many arms and no names.', 'speed', 'xp'],
  ['godblooded', 'The Bloodline Hall', 'Portraits of relatives, several of whom are glowing.', 'mag', 'hp'], ['ichorbound', 'The Bleeding Forge', 'A forge that runs on something thicker than coal.', 'phys', 'regen'],
  ['fatedealer', 'The Card Parlour', 'A green baize table under a single low lamp.', 'crit', 'gold'], ['mindwright', 'The Quiet Study', 'A chair, a desk and a great deal of thinking.', 'mag', 'sr'],
  ['marshal', 'The War Room', 'A map with pins in it and a stool no one sits on.', 'xp', 'def'], ['corsair', 'The Dock', 'A pier into the millpond, with a very large flag.', 'gold', 'phys'],
  ['brawler', 'The Fight Pit', 'A sunken ring behind the tavern. The tavern approves.', 'phys', 'hp'], ['whisperknight', 'The Hushed Hall', 'Thick walls and a single, whispering lamp.', 'dodge', 'sr'],
  ['hearthmaster', 'The Great Kitchen', 'Four fires, six pots and one opinion.', 'hp', 'regen'], ['truthseeker', 'The Record Room', 'Shelves of statements, all slightly different.', 'xp', 'status'],
  ['hedgewitch', 'The Hedge Cottage', 'A low roof, a high hedge and a kettle that is always on.', 'heal', 'regen'], ['soulblade', 'The Sword Shrine', 'A blade on a stand that is not quite quiet.', 'phys', 'crit'],
  ['facewright', 'The Mask Shop', 'Faces on pegs, and one peg empty.', 'status', 'dodge'], ['bellwarden', 'The Bell Tower', 'A tower with one very large bell and a very small door.', 'mr', 'def'],
];

export interface HoldingDef {
  classId: string;
  name: string;
  text: string;
  /** Cost of level 1, 2 and 3 (gold, timber, stone). */
  costs: [number, number, number][];
  mods: [ModifierSpec[], ModifierSpec[], ModifierSpec[]];
  perk: string;
}
const spec = (p: Perk, k: number): ModifierSpec => ({ stat: p[0], type: p[1], value: Math.round(p[2] * k * 100) / 100 }) as ModifierSpec;
export const HOLDINGS: HoldingDef[] = ROWS.map(([classId, name, text, a, b]) => {
  const pa = P[a] as Perk;
  const pb = P[b] as Perk;
  return {
    classId, name, text,
    costs: [[400, 15, 10], [1500, 40, 30], [4500, 90, 70]],
    mods: [[spec(pa, 1)], [spec(pa, 1.5), spec(pb, 1)], [spec(pa, 2.5), spec(pb, 1.5)]],
    perk: `${pa[0]} and ${pb[0]}`,
  };
});

/** What each upgrade quest hunts (the level-2 and level-3 trials rotate through these). */
const HUNTS: [type: string, task: string][] = [
  ['humanoid', 'Drive off the raiders who eye the building'], ['beast', 'Cull the beasts that have taken to the yard'], ['undead', 'Lay the restless dead of the old ground'], ['construct', 'Break the stone things in the quarry road'],
  ['spirit', 'Quiet the spirits that keep the builders awake'], ['bandit', 'Clear the bandits off the timber road'], ['void', 'Close the gaps the void is leaving near the site'], ['dragon', 'Drive the wyrmlings from the roof beams'],
];
export const HOLDING_QUESTS: QuestDef[] = HOLDINGS.flatMap((h, i) =>
  [2, 3].map((lvl): QuestDef => {
    const hunt = HUNTS[(i + lvl) % HUNTS.length] as [string, string];
    return {
      id: `holding-${h.classId}-${lvl}`, name: `${h.name}: ${lvl === 2 ? 'Raising the Roof' : 'The Finishing Touch'}`, kind: 'holding', level: 10 + lvl * 8, auto: true,
      requires: { kind: 'flag', flag: `holding-open:${h.classId}:${lvl}` },
      summary: `${h.name} cannot be raised further until the ground is safe. ${hunt[1]}.`,
      stages: [stage('s', `${hunt[1]}.`, [kill('k', hunt[1], 6 + lvl * 3, { enemyType: hunt[0] })], { onComplete: [{ kind: 'setFlag', flag: `holding-done:${h.classId}:${lvl}` }] })],
      rewards: { xp: 0.3, gold: 40 * lvl },
    };
  }),
);
