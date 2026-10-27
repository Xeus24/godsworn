import { content } from '../../data';
import type { GameSession } from '../../engine/state/gameState';
import { isDungeon } from '../../engine/world/world';
import { audio } from './audio';
import { moodForMap } from './musicFiles';

/**
 * Sets the music and ambience for where the party stands: the biome in the
 * open, how deep into a dungeon (the boss's lair is the last room), and the
 * weather. Cheap to call after every step: nothing restarts unless the mood
 * or the weather changed.
 */
export function syncAreaAudio(session: GameSession): void {
  const world = session.world;
  const { map, x } = session.state.world.position;
  const dungeon = isDungeon(map) ? content.dungeons.get(map) : undefined;
  audio().setTrack(moodForMap(world.map.biome, dungeon && { level: dungeon.level, rooms: dungeon.rooms, width: world.map.w, x }));
  audio().setWeather(dungeon ? undefined : world.weatherNow());
}
