import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { describe as describeCond, evaluate } from '../src/engine/quests/conditions';
import { isAvailable } from '../src/engine/quests/quests';
import { GameSession } from '../src/engine/state/gameState';
import { addRenown } from '../src/engine/world/renown';
import { makeHero } from './helpers';

describe('renown-gated quests', () => {
  const gated = content.quests.all().filter((q) => q.requires?.kind === 'renown');

  it('a few town quests ask for a renown rank, and say which', () => {
    expect(gated.length).toBeGreaterThanOrEqual(4);
    for (const q of gated) expect(describeCond(q.requires as never)).toMatch(/ in /);
  });

  it('opens when the town has come to know the hero well enough', () => {
    const s = GameSession.newGame(4, makeHero());
    const q = gated.find((x) => x.id === 'side-ardath') ?? (gated[0] as (typeof gated)[number]);
    const cond = q.requires as { kind: 'renown'; town: string; tier: string };
    expect(evaluate(s.state, cond)).toBe(false);
    s.state.player.level = Math.max(s.state.player.level, q.level);
    expect(isAvailable(s.state, q)).toBe(false);
    addRenown(s.player, cond.town, 25);
    expect(evaluate(s.state, cond)).toBe(true);
  });
});
