import { content, type Content } from '../../data';
import { DEVOTION } from '../../data/devotion';
import type { Character } from '../character/types';
import type { Combatant } from '../combat/types';
import { atLeast, favorOf } from './devotion';

/** The god most able to intervene: the patron if Devoted+, else the Devoted+ god with the most favor. */
export function interveningGod(char: Character, c: Content = content): string | undefined {
  const devoted = c.pantheon.filter((g) => atLeast(char, g.id, 'devoted'));
  if (devoted.length === 0) return undefined;
  const patron = char.devotion.patron;
  if (patron && devoted.some((g) => g.id === patron)) return patron;
  return devoted.sort((a, b) => favorOf(char, b.id) - favorOf(char, a.id))[0]?.id;
}

/**
 * Divine Intervention chance in percent: 10, plus 1 per 20 favor above
 * Devoted, plus 0.2 per FAI, capped at 50.
 */
export function interventionChance(char: Character, god: string, fai: number): number {
  const iv = DEVOTION.intervention;
  const above = Math.max(0, favorOf(char, god) - DEVOTION.tierFloors.devoted);
  return Math.min(iv.cap, Math.round(iv.base + above / iv.favorPerPoint + fai * iv.faiRatio));
}

/** Sets the hero's patron, prayer (uses = favor / cost, max 3), intervention and Divine Avatar for a battle. */
export function applyDivineCombat(x: Combatant, char: Character, fai: number, c: Content = content): void {
  const apostle = char.devotion.apostle;
  if (apostle) x.avatarSkill = c.apostles.get(apostle.god).avatar;
  if (char.devotion.defender && apostle) x.avatarSkill2 = c.apostles.get(char.devotion.defender).avatar;
  const patron = char.devotion.patron;
  if (patron) {
    x.patron = patron;
    const def = c.pantheon.find(patron);
    if (def && atLeast(char, patron, DEVOTION.prayerTier)) {
      const uses = Math.min(3, Math.floor(favorOf(char, patron) / def.prayer.cost));
      if (uses > 0) x.prayer = { god: patron, ...def.prayer, uses };
    }
  }
  const god = char.devotion.interventionReady ? interveningGod(char, c) : undefined;
  if (god) {
    const def = c.pantheon.get(god).intervention;
    x.intervention = { god, ...def, chance: interventionChance(char, god, fai), used: false };
  }
}
