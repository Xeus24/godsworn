import { content, type Content } from '../../data';
import type { MountDef } from '../../data/pets';
import { withSource, type Modifier } from '../stats/modifiers';
import type { Character } from './types';

/** The bonus of the pet out with you. */
export function petModifiers(char: Character, c: Content = content): Modifier[] {
  const pet = char.stable.pet ? c.pets.find(char.stable.pet) : undefined;
  return pet ? withSource(pet.modifiers, `pet:${pet.id}`) : [];
}

export function mountOf(char: Character, c: Content = content): MountDef | undefined {
  return char.stable.mount ? c.mounts.find(char.stable.mount) : undefined;
}

/** Gives a pet (and sends it out if you had none). Returns false if you already had it. */
export function grantPet(char: Character, id: string): boolean {
  if (char.stable.pets.includes(id)) return false;
  char.stable.pets.push(id);
  char.stable.pet ??= id;
  return true;
}

/** Gives a mount (and saddles it if you had none). Returns false if you already had it. */
export function grantMount(char: Character, id: string): boolean {
  if (char.stable.mounts.includes(id)) return false;
  char.stable.mounts.push(id);
  char.stable.mount ??= id;
  return true;
}
