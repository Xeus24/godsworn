import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { createItem } from '../src/engine/items/generate';
import { startNgPlus } from '../src/engine/ngplus/ngplus';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession, SAVE_VERSION } from '../src/engine/state/gameState';
import { AUTOSAVE_SLOT, deserialize, SaveSlots, serialize, type SaveStore } from '../src/engine/state/save';
import { makeHero } from './helpers';

class MemoryStore implements SaveStore {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
  keys(): string[] {
    return [...this.data.keys()];
  }
}

/** A session with a bit of everything in it. */
function busySession(): GameSession {
  const s = GameSession.newGame(77, makeHero({ challenges: ['nightmare'] }));
  s.grantXp(5_000_000, true);
  s.party.recruit('korga');
  s.items.give(createItem('rift-map', 2, () => s.newUid()));
  const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
  runAutoBattle(b);
  settleBattle(s, b);
  s.devotion.addHeresy(12, 'test');
  s.quests.reachEnding('freeblade');
  startNgPlus(s);
  s.endgame.openRift(1);
  return s;
}

describe('saving and loading', () => {
  it('round-trips the whole game state', () => {
    const s = busySession();
    const result = deserialize(serialize(s));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(JSON.parse(JSON.stringify(s.snapshot())));
  });

  it('a loaded game carries on exactly as the original would', () => {
    const s = busySession();
    const slots = new SaveSlots(new MemoryStore());
    slots.save('1', s);
    const loaded = slots.load('1');
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const t = loaded.session;
    for (const x of [s, t]) {
      const b = createEncounterBattle(x.player, content.encounters.get('slime-puddle'), { rng: x.rng });
      runAutoBattle(b);
      settleBattle(x, b);
    }
    expect(JSON.stringify(t.snapshot().player)).toBe(JSON.stringify(s.snapshot().player));
    expect(t.endgame.active?.tier).toBe(1);
    expect(t.state.ngPlus).toBe(1);
  });

  it('lists slots with summaries, newest first, and removes them', () => {
    const slots = new SaveSlots(new MemoryStore());
    const a = GameSession.newGame(1, makeHero({ name: 'Alpha' }));
    const b = GameSession.newGame(2, makeHero({ name: 'Beta' }));
    slots.save('1', a, 1000);
    slots.save(AUTOSAVE_SLOT, b, 2000);
    expect(slots.list().map((x) => x.name)).toEqual(['Beta', 'Alpha']);
    expect(slots.latest()?.slot).toBe(AUTOSAVE_SLOT);
    slots.remove(AUTOSAVE_SLOT);
    expect(slots.list()).toHaveLength(1);
  });

  it('migrates saves from before Phase 13', () => {
    const s = GameSession.newGame(3, makeHero());
    const old = JSON.parse(serialize(s)) as { state: Record<string, unknown> & { player: Record<string, unknown>; meta: { version: number } } };
    old.state.meta.version = 11;
    for (const k of ['achievements', 'rarityFound', 'legacy', 'endgame']) delete old.state[k];
    for (const k of ['bestiary', 'challenges', 'stable']) delete old.state.player[k];
    const result = deserialize(JSON.stringify(old));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.meta.version).toBe(SAVE_VERSION);
    expect(result.state.player.bestiary).toEqual({});
    expect(result.state.endgame.riftTier).toBe(0);
    expect(() => new GameSession(result.state)).not.toThrow();
  });

  it('refuses damaged, foreign and future saves', () => {
    expect(deserialize('not json').ok).toBe(false);
    expect(deserialize(JSON.stringify({ state: { meta: { game: 'Other' } } })).ok).toBe(false);
    const s = GameSession.newGame(4, makeHero());
    const future = JSON.parse(serialize(s)) as { state: { meta: { version: number } } };
    future.state.meta.version = SAVE_VERSION + 1;
    expect(deserialize(JSON.stringify(future)).ok).toBe(false);
    const broken = JSON.parse(serialize(s)) as { state: { player: { raceId: string } } };
    broken.state.player.raceId = 'dragonkin';
    expect(deserialize(JSON.stringify(broken)).ok).toBe(false);
  });

  it('exports and imports a save', () => {
    const slots = new SaveSlots(new MemoryStore());
    slots.save('1', GameSession.newGame(5, makeHero({ name: 'Exported' })));
    const text = slots.exportSlot('1') as string;
    expect(slots.importInto('2', text).ok).toBe(true);
    expect(slots.importInto('3', '{}').ok).toBe(false);
    expect(slots.list().filter((x) => x.name === 'Exported')).toHaveLength(2);
  });

  it('a fallen Hardcore hero cannot be loaded, and their saves can be cleared', () => {
    const slots = new SaveSlots(new MemoryStore());
    const s = GameSession.newGame(6, makeHero({ hardcore: true }));
    slots.save('1', s);
    slots.save(AUTOSAVE_SLOT, s);
    s.state.gameOver = true;
    slots.save('2', s);
    expect(slots.load('2').ok).toBe(false);
    slots.removeCharacter(s.player.id);
    expect(slots.list()).toHaveLength(0);
  });
});
