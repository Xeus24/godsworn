import { BATCH1_ZONES } from '../regions/batch1';
import { BATCH2_ZONES } from '../regions/batch2';
import { BATCH3_ZONES } from '../regions/batch3';
import { GREATER_GATHER } from '../items/greaterEconomy';
import { MECHANICS } from './mechanics';
import type { EnemyTier } from '../../engine/combat/types';
import type { EncounterGroup, ZoneDef } from '../../engine/world/types';

/** An encounter group: `weight` then enemy ids (prefix `elite:` / `champion:` to raise a tier, `^` for the back row). */
function grp(weight: number, ids: string[], opts: Pick<EncounterGroup, 'time' | 'weather'> = {}): EncounterGroup {
  return {
    weight,
    ...opts,
    enemies: ids.map((raw) => {
      const back = raw.startsWith('^');
      const id = back ? raw.slice(1) : raw;
      const [tier, enemyId] = id.includes(':') ? (id.split(':') as [EnemyTier, string]) : [undefined, id];
      return { enemyId, ...(tier ? { tier } : {}), ...(back ? { row: 'back' as const } : {}) };
    }),
  };
}
const elite = (id: string): string => `elite:${id}`;
const champions = (id: string, n = 2): string[] => Array.from({ length: n }, () => `champion:${id}`);

/** The eight zones along the road from the Meadowlands to the Dark Citadel. */
const BASE_ZONES: ZoneDef[] = [
  {
    id: 'meadowlands', gather: { mining: ['iron-ore'], herbalism: ['healroot', 'manabloom'], fishing: ['river-trout'] }, name: 'The Meadowlands', order: 1, levels: [1, 8], biome: 'meadow', town: 'brightwater',
    description: 'Rolling farmland where the road begins. Goblins raid the outlying farms.',
    encounterRate: 0.06, dungeons: ['goblin-warren'], worldBoss: 'bramblehorn', shrines: ['solenne', 'hesha', 'mirrin'],
    weather: [{ id: 'clear', weight: 5 }, { id: 'rain', weight: 2 }, { id: 'fog', weight: 1 }],
    encounters: [
      grp(4, ['green-slime', 'green-slime']), grp(3, ['giant-rat', 'giant-rat', 'giant-rat']), grp(3, ['meadow-wolf', 'meadow-wolf']),
      grp(3, ['goblin-cutthroat', 'goblin-cutthroat', '^goblin-shaman']), grp(2, ['scarecrow', 'scarecrow'], { time: 'night' }),
      grp(2, ['bandit-thug', '^bandit-archer']),
    ],
    roaming: [grp(1, [elite('goblin-warchief'), 'goblin-cutthroat']), grp(1, champions('meadow-wolf', 3))],
    lore: ['lore-first-oath', 'lore-brightwater'],
  },
  {
    id: 'whisperwood', gather: { mining: ['iron-ore'], herbalism: ['healroot', 'manabloom', 'fireweed'], fishing: ['river-trout'] }, name: 'The Whisperwood', order: 2, levels: [8, 16], biome: 'forest', town: 'thornwick',
    description: 'An old forest that talks in its sleep. The dead walk on the old battlefield.',
    encounterRate: 0.07, dungeons: ['spider-hollow', 'old-crypt'], worldBoss: 'gnarlroot', shrines: ['ysolde', 'morrath', 'lyssara'],
    weather: [{ id: 'clear', weight: 3 }, { id: 'rain', weight: 2 }, { id: 'fog', weight: 2 }],
    encounters: [
      grp(4, ['dire-wolf', 'dire-wolf']), grp(3, ['dire-wolf', '^forest-spider', '^forest-spider']), grp(3, ['treant-sapling', '^will-o-wisp']),
      grp(3, ['skeleton-soldier', 'skeleton-soldier', '^restless-ghost'], { time: 'night' }), grp(2, ['skeleton-soldier', '^dark-cultist']),
      grp(2, ['wyld-boar', 'wyld-boar']), grp(2, ['^will-o-wisp', '^will-o-wisp', '^will-o-wisp'], { weather: ['fog'] }),
    ],
    roaming: [grp(1, [elite('alpha-wolf'), 'dire-wolf']), grp(1, champions('skeleton-soldier', 3))],
    lore: ['lore-whisper', 'lore-old-battle'],
  },
  {
    id: 'sunken-caves', gather: { mining: ['mithril-ore', 'iron-ore'], herbalism: ['fireweed', 'manabloom'], fishing: ['river-trout', 'silverfin'] }, threat: 110, name: 'The Sunken Caves', order: 3, levels: [16, 24], biome: 'cave',
    description: 'Flooded caverns under the hills, glittering with crystal and full of things that like the dark.',
    encounterRate: 0.08, dungeons: ['drowned-grotto'], worldBoss: 'abyssal-crab', shrines: ['nymira', 'ordrun'],
    weather: [{ id: 'clear', weight: 3 }, { id: 'fog', weight: 1 }],
    encounters: [
      grp(4, ['^cave-bat', '^cave-bat', '^cave-bat']), grp(3, ['crystal-golem', '^cave-bat']), grp(3, ['drowned-sailor', 'drowned-sailor']),
      grp(3, ['cave-serpent', '^myconid']), grp(2, ['myconid', 'myconid', '^myconid']),
    ],
    roaming: [grp(1, [elite('crystal-golem'), 'crystal-golem']), grp(1, champions('drowned-sailor'))],
    lore: ['lore-sunken', 'lore-crystal'],
  },
  {
    id: 'ashen-desert', gather: { mining: ['mithril-ore'], herbalism: ['fireweed', 'frostleaf'], fishing: ['silverfin'] }, threat: 70, name: 'The Ashen Desert', order: 4, levels: [24, 32], biome: 'desert', town: 'sandhaven',
    description: 'Grey dunes over a buried empire. The sun is merciless, and so are the raiders.',
    encounterRate: 0.07, dungeons: ['sun-king-tomb'], worldBoss: 'sandworm', shrines: ['kael', 'solenne', 'seraphel'],
    weather: [{ id: 'clear', weight: 3 }, { id: 'heatwave', weight: 3 }, { id: 'sandstorm', weight: 2 }],
    encounters: [
      grp(4, ['sand-scorpion', 'sand-scorpion']), grp(3, ['desert-raider', 'desert-raider', '^desert-raider']), grp(3, ['mummy', 'mummy'], { time: 'night' }),
      grp(2, ['sand-drake']), grp(3, ['desert-raider', '^dust-elemental']), grp(3, ['^dust-elemental', '^dust-elemental'], { weather: ['sandstorm'] }),
    ],
    roaming: [grp(1, [elite('sand-drake'), 'sand-scorpion']), grp(1, champions('desert-raider'))],
    lore: ['lore-sun-king', 'lore-sandhaven'],
  },
  {
    id: 'frostspire', gather: { mining: ['adamant-ore', 'mithril-ore'], herbalism: ['frostleaf', 'sunpetal'], fishing: ['silverfin'] }, threat: 60, name: 'Frostspire', order: 5, levels: [32, 40], biome: 'snow', town: 'frosthold',
    description: 'The mountains where the giants built a spire of ice. It never stops snowing.',
    encounterRate: 0.07, dungeons: ['ice-palace'], worldBoss: 'frost-wyrm', shrines: ['aurelis', 'thalor', 'lyssara'],
    weather: [{ id: 'snow', weight: 4 }, { id: 'clear', weight: 2 }, { id: 'fog', weight: 1 }],
    encounters: [
      grp(4, ['frost-wolf', 'frost-wolf', 'frost-wolf']), grp(3, ['yeti', '^ice-elemental']), grp(3, ['frost-giant']),
      grp(2, ['frost-wolf', '^ice-witch']), grp(2, ['^ice-elemental', '^ice-elemental'], { weather: ['snow'] }),
    ],
    roaming: [grp(1, [elite('frost-giant'), 'yeti']), grp(1, champions('frost-wolf'))],
    lore: ['lore-giants', 'lore-spire'],
  },
  {
    id: 'stormcoast', gather: { mining: ['adamant-ore'], herbalism: ['sunpetal', 'frostleaf'], fishing: ['silverfin', 'ember-eel'] }, threat: 45, name: 'The Stormcoast', order: 6, levels: [40, 48], biome: 'coast', town: 'saltmere',
    description: 'Cliffs, wrecks and pirate coves under a sky that is always about to break.',
    encounterRate: 0.07, dungeons: ['leviathan-wreck', 'smugglers-den'], worldBoss: 'storm-roc', shrines: ['nymira', 'grimvald', 'seraphel'],
    weather: [{ id: 'storm', weight: 3 }, { id: 'rain', weight: 3 }, { id: 'clear', weight: 2 }],
    encounters: [
      grp(4, ['corsair', 'corsair', '^corsair']), grp(3, ['sea-serpent']), grp(3, ['^harpy', '^harpy']), grp(2, ['corsair', '^siren']),
      grp(3, ['^storm-elemental', '^storm-elemental'], { weather: ['storm'] }), grp(2, ['^siren', '^siren'], { time: 'night' }),
    ],
    roaming: [grp(1, [elite('sea-serpent'), '^siren']), grp(1, champions('corsair'))],
    lore: ['lore-saltmere', 'lore-leviathan'],
  },
  {
    id: 'volcanic-rift', gather: { mining: ['starmetal-ore', 'adamant-ore'], herbalism: ['sunpetal', 'dreamleaf'], fishing: ['ember-eel'] }, threat: 5, name: 'The Volcanic Rift', order: 7, levels: [48, 55], biome: 'volcanic',
    description: 'The world split open here. The fire underneath is still awake.',
    encounterRate: 0.08, dungeons: ['fallen-forge'], worldBoss: 'ember-matriarch', shrines: ['thalor', 'kael', 'ordrun'],
    weather: [{ id: 'ashfall', weight: 4 }, { id: 'heatwave', weight: 2 }, { id: 'clear', weight: 1 }],
    encounters: [
      grp(4, ['lava-hound', 'lava-hound']), grp(3, ['magma-elemental', '^fire-imp']), grp(3, ['obsidian-golem']),
      grp(3, ['^fire-imp', '^fire-imp', '^fire-imp']), grp(2, ['lava-hound', '^ash-cultist'], { time: 'night' }),
    ],
    roaming: [grp(1, [elite('obsidian-golem'), 'magma-elemental']), grp(1, champions('lava-hound'))],
    lore: ['lore-rift', 'lore-forge-gods'],
  },
  {
    id: 'dark-citadel', gather: { mining: ['starmetal-ore'], herbalism: ['dreamleaf'], fishing: ['ember-eel'] }, name: 'The Dark Citadel', order: 8, levels: [55, 60], biome: 'citadel',
    description: 'A fortress of black stone where the sky has the wrong color. Something unwritten waits inside.',
    encounterRate: 0.09, dungeons: ['black-throne'], worldBoss: 'unwritten-herald', shrines: ['morrath', 'vex', 'mirrin'],
    weather: [{ id: 'blood-moon', weight: 2 }, { id: 'fog', weight: 2 }, { id: 'clear', weight: 1 }],
    encounters: [
      grp(4, ['void-knight', 'void-knight']), grp(3, ['fallen-paladin', '^shadow-fiend']), grp(2, ['bone-dragon']),
      grp(3, ['^void-wraith', '^void-wraith']), grp(3, ['^shadow-fiend', '^shadow-fiend', '^shadow-fiend'], { time: 'night' }),
    ],
    roaming: [grp(1, [elite('bone-dragon'), 'void-knight']), grp(1, champions('void-knight'))],
    lore: ['lore-citadel', 'lore-unwritten'],
  },
];

export const ZONES: ZoneDef[] = [...BASE_ZONES, ...BATCH1_ZONES, ...BATCH2_ZONES, ...BATCH3_ZONES];

// Phase 10: the newer raw materials join each zone's gathering tables.
for (const z of ZONES) {
  z.mechanic = MECHANICS.find((m) => m.zone === z.id)?.id;
  const more = GREATER_GATHER[z.id];
  if (!more) continue;
  for (const k of ['mining', 'herbalism', 'fishing'] as const) z.gather[k] = [...new Set([...z.gather[k], ...(more[k] ?? [])])];
}
