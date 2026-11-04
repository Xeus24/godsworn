import { describe, expect, it } from 'vitest';
import { emoteFor } from '../src/ui/components/emote';
import { GameSession } from '../src/engine/state/gameState';
import { heartModifiers } from '../src/engine/heart/heart';
import { makeHero } from './helpers';

describe('Polish (item 35)', () => {
  it('NPC emotes are deterministic, change with the day and are sometimes absent', () => {
    expect(emoteFor('marta', 3, false)).toEqual(emoteFor('marta', 3, false));
    const seen = new Set<string>();
    let none = 0;
    for (let d = 0; d < 60; d++) {
      const e = emoteFor('marta', d, d % 2 === 0);
      if (e) seen.add(e.glyph);
      else none++;
    }
    expect(seen.size).toBeGreaterThan(2);
    expect(none).toBeGreaterThan(0);
  });

  it('petting the pet counts once a day and brings luck every 25 pats', () => {
    const s = GameSession.newGame(4, makeHero());
    expect(s.wonders.petThePet().ok).toBe(false);
    s.player.stable.pets.push('lucky-ferret');
    s.player.stable.pet = 'lucky-ferret';
    for (let d = 0; d < 26; d++) {
      s.wonders.petThePet();
      s.wonders.petThePet(); // the second pat the same day does not count
      s.state.clock.day++;
    }
    expect(s.state.realm.wonders.pet?.pats).toBe(26);
    expect(heartModifiers(s.player).some((m) => m.stat === 'luk' && m.source === 'wonders')).toBe(true);
  });
});
