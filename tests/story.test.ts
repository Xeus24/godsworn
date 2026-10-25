import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { SaveSlots, type SaveStore } from '../src/engine/state/save';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { groupEncounter } from '../src/engine/world/world';
import { makeHero } from './helpers';
import { playStory } from './playthrough';

function memoryStore(): SaveStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), keys: () => [...m.keys()] };
}

/** A fight won at once (the story is under test here, not the balance). */
function instantWin(s: GameSession, id: string): boolean {
  const enc = content.encounters.find(id) ?? groupEncounter({ weight: 1, enemies: [{ enemyId: id }] }, `boss:${id}`, id, s.player.level, { isBoss: true });
  const b = createEncounterBattle(s.player, enc, { rng: s.rng, companions: s.party.battleMembers(), guests: s.quests.guests() });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
  return b.outcome === 'victory';
}

describe('the whole story', () => {
  it('plays from the first chapter to an ending, saving and reloading after every step', () => {
    const slots = new SaveSlots(memoryStore());
    let reloads = 0;
    const r = playStory(GameSession.newGame(5, makeHero({ classId: 'mage' })), {
      fight: instantWin,
      between: (s) => {
        // Keep the hero at the chapter's level, as a player would be.
        const q = content.quests.all().find((x) => x.kind === 'main' && s.state.quests.active[x.id]);
        if (q && s.player.level < q.level) s.grantXp(1e9, true);
        slots.save('auto', s);
        const loaded = slots.load('auto');
        if (!loaded.ok) throw new Error(loaded.reason);
        reloads++;
        return loaded.session;
      },
    });
    expect(r.stuck).toBeUndefined();
    expect(r.ending).toBeDefined();
    for (let i = 1; i <= 8; i++) expect(r.session.state.quests.completed[`main-${i}`]).toBe(1);
    expect(r.session.state.legacy.endings).toContain(r.ending);
    expect(reloads).toBe(r.steps);
    expect(r.session.state.party.companions.aldric).toBeDefined();
  });

  it('takes other paths through the dialogue to other endings', () => {
    const endings = new Set<string>();
    for (const pickLast of [false, true]) {
      const r = playStory(GameSession.newGame(9, makeHero()), {
        fight: instantWin,
        between: (s) => {
          if (s.player.level < 60) s.grantXp(1e9, true);
          return s;
        },
        // Counting from the front or from the back of the choices.
        choose: (labels, attempt) => labels[pickLast ? labels.length - 1 - (attempt % labels.length) : attempt % labels.length],
      });
      expect(r.stuck).toBeUndefined();
      if (r.ending) endings.add(r.ending);
    }
    expect(endings.size).toBe(2);
  });
});
