import type { QuestDef } from '../../engine/quests/types';
import { all, clear, kill, level, stage } from '../story/helpers';

/** One short regional questline per new region: meet the local power, clear a dungeon, bring down the world boss. */
export const LINE = (id: string, name: string, zone: string, lvl: number, giver: string, giverLine: string, dungeon: string, dungeonName: string, boss: string, bossName: string): QuestDef => ({
  id: `region-${id}`, name, kind: 'side', level: lvl, zone, giver, requires: level(lvl - 2),
  summary: giverLine,
  stages: [
    stage('clear', `Clear ${dungeonName}.`, [clear('d', `Clear ${dungeonName}`, dungeon)]),
    stage('boss', `Bring down ${bossName}.`, [kill('k', `Defeat ${bossName}`, 1, { enemyId: boss, zone })], { turnIn: giver, turnInText: `“It is done. ${zone === 'aurelane' ? 'The city' : 'The land'} will remember it, which is not always a blessing.”` }),
  ],
  rewards: { xp: 0.8, gold: 30, gear: { rarity: 'epic' }, title: `Friend of ${name.split(':')[0]}` },
});

export const BATCH1_QUESTS: QuestDef[] = [
  LINE('aurelane', 'Aurelane: Under the Throne', 'aurelane', 26, 'chancellor-ilreth', '“The city has a rot below it, and a magistrate above it who does not mind. Clear the Gilded Vault of what the guilds locked in, then end the Hollow Magistrate’s sitting.”', 'gilded-vault', 'the Gilded Vault', 'hollow-magistrate', 'the Hollow Magistrate'),
  LINE('moonfen', 'Moonfen: The Moon in the Water', 'moonfen', 20, 'warden-lissel', '“The moon is too low. The fen is too happy. Go to the Bell Ruin and quiet what rings there, then see to the Drowned Moon.”', 'bell-ruin', 'the Bell Ruin', 'drowned-moon', 'the Drowned Moon'),
  LINE('thornreach', 'Thornreach: The Toll Road', 'thornreach', 31, 'warchief-ulrik', '“My own raiders have gone wild. Burn them out of the Warren, and then cut back the Thornmother before she takes the whole hold.”', 'raiders-warren', 'the Raiders’ Warren', 'thornmother', 'the Thornmother'),
  LINE('khazrum', 'Khazrum: The Seventh Hall', 'khazrum', 41, 'thane-borgrim', '“Seven clans, and the seventh hall is silent. Go down to the Deepforge and see what Grud has done, then the Stone Warden must be told it may rest.”', 'deepforge', 'the Deepforge', 'stone-warden', 'the Stone Warden'),
];

export const BATCH2_QUESTS: QuestDef[] = [
  LINE('gloamwood', 'Gloamwood: The Hour Between', 'gloamwood', 27, 'elder-wick', '“The lamps along the path are going out one by one. Go to the Lampless Chapel and see what snuffs them, then ask the Eventide Stag to lift its antlers.”', 'lampless-chapel', 'the Lampless Chapel', 'eventide-stag', 'the Eventide Stag'),
  LINE('saltglass', 'Saltglass: The Original Sky', 'saltglass', 39, 'lensmaster-quill', '“Someone is making the mirages, and she is not stopping. Clear the Glass Cathedral, then find the Glasswright and make her show you the true horizon.”', 'glass-cathedral', 'the Glass Cathedral', 'glasswright', 'the Glasswright'),
  LINE('merrowdeep', 'Merrowdeep: The Evening Service', 'merrowdeep', 47, 'harbor-queen-maris', '“The city is grieving, and the grief has teeth. Go down to the Coral Palace and quiet its court, and then the Tide-Mother must be allowed to rest.”', 'coral-palace', 'the Coral Palace', 'tide-mother', 'the Tide-Mother'),
  LINE('clockwork-foundry', 'The Foundry: The Word for Stop', 'clockwork-foundry', 52, 'engineer-lorne', '“The Engine must be told to stop, and no one remembers how. Clear the Gear Cathedral, find the Archwinder’s last count, and then speak to the First Engine.”', 'gear-cathedral', 'the Gear Cathedral', 'first-engine', 'the First Engine'),
];

export const BATCH3_QUESTS: QuestDef[] = [
  LINE('ashfold', 'Ashfold: The Cellar Below', 'ashfold', 3, 'reeve-halwin', '“Something lives under the inn’s ruin, and something worse eats our grain. Go down the cellar, and then clear the granary of what feeds there.”', 'ashfold-cellar', 'the Ashfold Cellar', 'giant-rat-king', 'the Granary Terror'),
  LINE('hollow-barrows', 'The Barrows: The Door Too Neat', 'hollow-barrows', 33, 'priest-ansel', '“The old barrows are open, and the dead are walking out. Go to the King’s Barrow, and ask the Hollow King Below to lie down.”', 'kings-barrow', 'the King’s Barrow', 'hollow-king-below', 'the Hollow King Below'),
  LINE('shattered-isles', 'The Isles: The Turning', 'shattered-isles', 41, 'harbormaster-fenn', '“Something huge stirs under the Isles, and the wreckers are lighting lamps again. Clear the Wrecked Armada, then face the Storm Leviathan.”', 'wrecked-armada', 'the Wrecked Armada', 'storm-leviathan', 'the Storm Leviathan'),
  LINE('skyreach', 'Skyreach: The Last Court', 'skyreach', 55, 'storm-chaser-vanya', '“The sky-realm still has a court, and the court still has a king. Take the Storm Bastion, and then meet the Sovereign of Skyreach.”', 'storm-bastion', 'the Storm Bastion', 'skyreach-sovereign', 'the Sovereign of Skyreach'),
];

/** The questline of a New Game+ region: shut until its tier, then the same shape as the others. */
const NG_LINE = (id: string, name: string, zone: string, lvl: number, tier: number, giver: string, giverLine: string, dungeon: string, dungeonName: string, boss: string, bossName: string): QuestDef => ({
  ...LINE(id, name, zone, lvl, giver, giverLine, dungeon, dungeonName, boss, bossName),
  requires: all(level(lvl - 2), { kind: 'ngPlus', min: tier }),
});

export const BATCH4_QUESTS: QuestDef[] = [
  NG_LINE('celestial-realm', 'The Realm: Relieved at Last', 'celestial-realm', 82, 1, 'archmage-oriel', '“There is a place above the sky where angels have stood guard since before the Citadel. They have not been relieved. Go and do it, and then see to Aurial.”', 'halls-of-the-seraphim', 'the Halls of the Seraphim', 'arch-seraph-aurial', 'Arch-Seraph Aurial'),
  NG_LINE('the-abyss', 'The Abyss: What It Heard', 'the-abyss', 84, 1, 'harbor-queen-maris', '“Something at the bottom of the sea has begun to listen, and the drowned will not stop whispering. Go down to the Listening Deep, and then the Mother.”', 'listening-deep', 'the Listening Deep', 'the-abyssal-mother', 'the Abyssal Mother'),
  NG_LINE('shattered-timeline', 'The Timeline: A Second Too Late', 'shattered-timeline', 86, 2, 'loremaster-thrain', '“The days are splitting and the Hall of Hours is the knot. Cut it, and then end the Last Tick before it runs out for everyone.”', 'hall-of-hours', 'the Hall of Hours', 'the-last-tick', 'the Last Tick'),
  NG_LINE('drowned-kingdom', 'The Kingdom: Long Live the Queen', 'drowned-kingdom', 80, 2, 'harbormaster-quill', '“A kingdom sits under the sea and will not be told it has ended. The Throne of Tides first, then the Throne itself.”', 'throne-of-tides', 'the Throne of Tides', 'the-drowned-throne', 'the Drowned Throne'),
  NG_LINE('clockwork-city', 'The City: Off the Clock', 'clockwork-city', 88, 3, 'engineer-lorne', '“There is a city that runs to a schedule no one wrote. I would like it to take a day off. Break the Great Works, and then the Great Gear.”', 'the-great-works', 'the Great Works', 'the-great-gear', 'the Great Gear'),
  NG_LINE('the-godforge', 'The Forge: One More Hammer-Stroke', 'the-godforge', 88, 3, 'forge-matron-hilda', '“The forge where gods were made is still burning, and it is still making something. Go down to the Quenching Hall and see what, and then ask the Heart.”', 'the-quenching-hall', 'the Quenching Hall', 'the-godforge-heart', 'the Heart of the Godforge'),
];
