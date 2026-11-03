import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { evaluate } from '../src/engine/quests/conditions';
import { GameSession } from '../src/engine/state/gameState';
import { addRenown } from '../src/engine/world/renown';
import { layoutOf, promptsFor } from '../src/ui/gamepad/padPrompts';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { Rng } from '../src/engine/core/rng';
import { companionExtras, createCompanion } from '../src/engine/party/party';
import { groupEncounter } from '../src/engine/world/world';
import { HYBRID_TRIAL_THREAT } from '../src/data/multiclass';
import { makeHero } from './helpers';

describe('renown-gated quests', () => {
  const quests = content.quests.all().filter((q) => q.id.startsWith('renown-'));

  it('has one for each of the 15 towns, each gated by that town', () => {
    expect(quests.length).toBe(15);
    expect(new Set(quests.map((q) => q.id.slice(7))).size).toBe(content.towns.ids().length);
  });

  it('opens only once the town is Honored', () => {
    const s = GameSession.newGame(5, makeHero());
    const q = content.quests.get('renown-brightwater');
    s.player.level = 90;
    expect(evaluate(s.state, q.requires as never)).toBe(false);
    addRenown(s.player, 'brightwater', 130);
    expect(evaluate(s.state, q.requires as never)).toBe(true);
  });
});

describe('controller prompts', () => {
  it('uses Sony symbols for a DualSense and Xbox letters otherwise', () => {
    expect(layoutOf('054c-0ce6-Wireless Controller')).toBe('playstation');
    expect(layoutOf('Xbox 360 Controller (STANDARD GAMEPAD)')).toBe('xbox');
    expect(promptsFor('battle', 'playstation')[0]).toEqual({ button: '✕', label: 'Choose' });
  });

  it('names every button the pad scheme uses on a screen', () => {
    const labels = promptsFor('screen').map((p) => p.button);
    expect(labels).toEqual(['A', 'B', 'X', 'Y', 'LB', 'RB']);
  });
});

describe('party-size scaling', () => {
  it('makes enemies tougher faster than one companion at a time', () => {
    const hpWith = (n: number): number => {
      let uid = 0;
      const companions = content.companions.all().slice(0, n).map((def) => {
        const state = createCompanion(def, 20, () => `p${++uid}`);
        return { char: state.character, extras: companionExtras(def, state) };
      });
      const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: content.enemies.ids()[0] as string }] }, 'size', 'Size', 20);
      const b = createEncounterBattle(benchmarkHero('warrior', 20), enc, { rng: new Rng(1), level: 20, companions });
      return (b.combatants.find((x) => x.side === 'enemy') as { maxHp: number }).maxHp;
    };
    const base = hpWith(0);
    const one = hpWith(1) / base - 1;
    const three = hpWith(3) / base - 1;
    expect(three).toBeGreaterThan(3 * one * 1.1);
  });
});

describe('hybrid trial tuning', () => {
  it('has a tuned threat for every two-class hybrid and its trial carries it', () => {
    for (const h of content.hybrids.all().filter((x) => x.classes.length === 2)) {
      expect(HYBRID_TRIAL_THREAT[h.id], h.id).toBeDefined();
      expect(content.encounters.get(h.trial).threat ?? 0).toBe(HYBRID_TRIAL_THREAT[h.id]);
    }
  });
});
