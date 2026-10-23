import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { chooseAction } from './ai';
import { Battle, type BattleHooks } from './battle';
import { createEnemy, createHero } from './combatants';
import { advance, perform, startBattle } from './turns';
import type { BattleEvent, EncounterDef } from './types';

export interface EncounterOptions {
  rng: Rng;
  hooks?: BattleHooks;
  timeOfDay?: 'day' | 'night';
  /** Overrides every enemy's level (e.g. scaling an encounter to the player). */
  level?: number;
  c?: Content;
}

/** Builds a battle between the hero (plus companions later) and an encounter's enemies. */
export function createEncounterBattle(hero: Character, encounter: EncounterDef, opts: EncounterOptions): Battle {
  const c = opts.c ?? content;
  const party = [createHero(hero, 'hero', c)];
  const enemies = encounter.enemies.map((e, i) => {
    const def = c.enemies.get(e.enemyId);
    return createEnemy(def, `enemy-${i + 1}`, opts.level ?? e.level ?? encounter.level, e.row ?? def.row, c);
  });
  // Number duplicate names: "Green Slime A", "Green Slime B".
  const counts = new Map<string, number>();
  for (const e of enemies) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const e of enemies) {
    if ((counts.get(e.name) ?? 0) < 2) continue;
    const n = seen.get(e.name) ?? 0;
    seen.set(e.name, n + 1);
    e.name = `${e.name} ${String.fromCharCode(65 + n)}`;
  }
  return new Battle({
    party,
    enemies,
    rng: opts.rng,
    encounterId: encounter.id,
    canFlee: encounter.canFlee,
    isBoss: encounter.isBoss,
    timeOfDay: opts.timeOfDay,
    hooks: opts.hooks,
    c,
  });
}

/** Plays a whole battle with AI on both sides (simulations, tests, auto-battle). */
export function runAutoBattle(b: Battle): BattleEvent[] {
  const events = [...startBattle(b)];
  while (b.outcome === 'ongoing') {
    events.push(...advance(b));
    const x = b.current;
    if (!x) break;
    const result = perform(b, chooseAction(b, x));
    if (result.ok) events.push(...result.events);
    else {
      // An AI choice that turned out invalid: fall back to defending.
      const fallback = perform(b, { kind: 'defend', actorId: x.id });
      if (fallback.ok) events.push(...fallback.events);
    }
  }
  return events;
}
