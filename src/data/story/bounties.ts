import type { QuestDef } from '../../engine/quests/types';
import { ENEMIES } from '../enemies';
import { DEEP_ENEMIES } from '../bestiary/enemies';
import { TOWNS } from '../world/places';
import { ZONES } from '../world/zones';
import { kill, stage } from './helpers';

const ALL_ENEMIES = [...ENEMIES, ...DEEP_ENEMIES];

/**
 * Bounties on every town's quest board: two per town, against the commonest
 * creatures of its zone. They can be taken again each in-game day.
 */
export const BOUNTIES: QuestDef[] = TOWNS.flatMap((town): QuestDef[] => {
  const zone = ZONES.find((z) => z.id === town.zone);
  if (!zone) return [];
  const ids = [...new Set(zone.encounters.flatMap((g) => g.enemies.filter((e) => !e.tier).map((e) => e.enemyId)))].slice(0, 2);
  return ids.map((enemyId, i): QuestDef => {
    const enemy = ALL_ENEMIES.find((e) => e.id === enemyId);
    const name = enemy?.name ?? enemyId;
    const count = 6 + i * 2;
    return {
      id: `bounty-${town.id}-${enemyId}`,
      name: `Bounty: ${name}`,
      kind: 'bounty',
      level: Math.round((zone.levels[0] + zone.levels[1]) / 2),
      zone: zone.id,
      board: town.id,
      repeatable: true,
      summary: `Posted by the town: “${count} ${name.toLowerCase()}${name.endsWith('s') ? '' : 's'} too many in ${zone.name}. Payment on proof.” Bounties return each day.`,
      stages: [stage('hunt', `Hunt ${name.toLowerCase()} in ${zone.name}.`, [kill('k', `Slay ${name}`, count, { enemyId, zone: zone.id })])],
      rewards: { xp: 0.2, gold: 6 },
    };
  });
});
