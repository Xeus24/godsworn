import type { QuestDef } from '../../engine/quests/types';
import { clear, kill, level, stage } from '../story/helpers';

/** One short regional questline per new region: meet the local power, clear a dungeon, bring down the world boss. */
const LINE = (id: string, name: string, zone: string, lvl: number, giver: string, giverLine: string, dungeon: string, dungeonName: string, boss: string, bossName: string): QuestDef => ({
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
