import { content } from '../src/data';
import { mapFor } from '../src/engine/world/mapgen';
import type { GameSession } from '../src/engine/state/gameState';
import { createCharacter, type NewCharacterOptions } from '../src/engine/character/create';
import type { Character } from '../src/engine/character/types';

export function makeHero(opts: Partial<NewCharacterOptions> = {}): Character {
  return createCharacter({
    name: 'Tester',
    portrait: 0,
    raceId: 'human',
    classId: 'warrior',
    birthSignId: 'the-forge',
    ...opts,
  });
}

/** Stands the hero on a shrine of the god (so worship actions are allowed). */
export function atShrine(s: GameSession, god: string): void {
  for (const zone of content.zones.all()) {
    const e = mapFor(zone.id).entities.find((x) => x.kind === 'shrine' && x.ref === god);
    if (e) {
      s.state.world.position = { map: zone.id, x: e.x, y: e.y };
      return;
    }
  }
  throw new Error(`No shrine of ${god}`);
}

/** The eight original classes: systems added in expansion phase 3 (secret nodes, evolutions, sets) cover these. */
export const BASE_CLASS_IDS = ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'necromancer', 'monk', 'bard'] as const;
