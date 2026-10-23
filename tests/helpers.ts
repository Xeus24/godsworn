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
