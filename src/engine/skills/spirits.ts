import { content, type Content } from '../../data';
import { SPIRITS, type SpiritDef } from '../../data/spirits';
import type { Character } from '../character/types';
import { featMet } from './feats';
import { addToHotbar } from './tree';

export const spiritSkillId = (s: SpiritDef): string => `call-${s.id}`;

/** Spirits the character has contracted: the Summoner's "Call" skills they know. */
export function contractedSpirits(char: Character): SpiritDef[] {
  return SPIRITS.filter((s) => char.skills[spiritSkillId(s)] !== undefined);
}

/**
 * Contracts every spirit whose feat is met. Only a Summoner can: the others hear nothing. New spirits go
 * on the hotbar if there is room. Returns the spirits newly contracted.
 */
export function contractSpirits(char: Character, c: Content = content): SpiritDef[] {
  if (!char.classes.some((p) => p.classId === 'summoner')) return [];
  const fresh: SpiritDef[] = [];
  for (const s of SPIRITS) {
    const id = spiritSkillId(s);
    if (char.skills[id] !== undefined) continue;
    if (s.feat && !featMet(char, s.feat, 'summoner')) continue;
    char.skills[id] = 1;
    addToHotbar(char, id, c);
    fresh.push(s);
  }
  return fresh;
}
