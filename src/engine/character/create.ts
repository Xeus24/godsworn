import { content, type Content } from '../../data';
import { createDevotion } from '../gods/devotion';
import { emptyPrimaryStats } from '../stats/types';
import { addToHotbar, treeState } from '../skills/tree';
import { restoreFull } from './stats';
import type { Character } from './types';

export const NAME_MAX_LENGTH = 20;

export interface NewCharacterOptions {
  name: string;
  portrait: number;
  raceId: string;
  classId: string;
  birthSignId: string;
  hardcore?: boolean;
  id?: string;
}

/** Returns an error message, or undefined if the name is acceptable. */
export function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Enter a name.';
  if (trimmed.length > NAME_MAX_LENGTH) return `Names can be at most ${NAME_MAX_LENGTH} characters.`;
  if (!/^[\p{L}\p{M}' -]+$/u.test(trimmed)) return 'Use letters, spaces, apostrophes and hyphens only.';
  return undefined;
}

export function createCharacter(opts: NewCharacterOptions, c: Content = content): Character {
  const nameError = validateName(opts.name);
  if (nameError) throw new Error(nameError);
  // Throw early on unknown ids.
  c.races.get(opts.raceId);
  c.classes.get(opts.classId);
  c.birthSigns.get(opts.birthSignId);

  const char: Character = {
    id: opts.id ?? 'hero',
    name: opts.name.trim(),
    portrait: Math.max(0, Math.floor(opts.portrait)),
    raceId: opts.raceId,
    birthSignId: opts.birthSignId,
    hardcore: opts.hardcore ?? false,
    level: 1,
    xp: 0,
    classes: [{ classId: opts.classId, slot: 'primary', level: 1, xp: 0, skillPoints: 0 }],
    xpSplit: [100],
    xpMode: 'split',
    hybrids: [],
    trialsWon: [],
    devotion: createDevotion(),
    world: { reputation: {}, trophies: {} },
    crafting: { professions: {}, gathering: {}, recipes: [] },
    bestiary: {},
    allocated: emptyPrimaryStats(),
    attributePoints: 0,
    paragonLevel: 0,
    paragonXp: 0,
    paragonPoints: 0,
    paragon: {},
    equipment: {},
    timedBuffs: [],
    skills: Object.fromEntries(startingSkillIds(opts.raceId, opts.classId, c).map((id) => [id, 1])),
    trees: {},
    mastery: {},
    generalSkills: {},
    generalSlots: [],
    bonusGeneralSlots: 0,
    hp: 0,
    mp: 0,
  };
  treeState(char, opts.classId);
  for (const id of Object.keys(char.skills)) addToHotbar(char, id, c);
  restoreFull(char, c);
  return char;
}

/** Skill ids a new character of this race and class knows. */
export function startingSkillIds(raceId: string, classId: string, c: Content = content): string[] {
  return [...c.classes.get(classId).startingSkills, c.races.get(raceId).activeSkill];
}
