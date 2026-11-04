import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { DEFENSE, TOWERS, waveOf } from '../src/data/defense';
import { Rng } from '../src/engine/core/rng';
import { START, apply, godMove, legalMoves, winner } from '../src/engine/minigames/godsGambit';
import { testamentText, writeTestament } from '../src/engine/realm/testament';
import { mapFor } from '../src/engine/world/mapgen';
import { rearrange } from '../src/engine/world/living';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(66, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 40;
  s.state.gold = 100000;
  return s;
};

describe('Shrine Defense (item 41)', () => {
  it('waves grow, towers kill what walks past, an undefended shrine falls', () => {
    expect(waveOf(1).length).toBeLessThan(waveOf(8).length);
    expect(waveOf(DEFENSE.waves)).toContain('master');
    const s = session();
    expect(s.games.startDefense().ok).toBe(true);
    const bare = s.games.sendWave();
    expect(bare.ok).toBe(true);
    expect(s.games.run!.shrine).toBeLessThan(DEFENSE.shrine);
    expect(s.games.build(0, 'candle').ok).toBe(true);
    expect(s.games.build(0, 'bell').ok).toBe(false);
    expect(s.games.clearSlot(0).ok).toBe(true);
    expect(TOWERS.length).toBe(4);
    s.games.abandonDefense();
    expect(s.games.run).toBeUndefined();
  });
  it('a full line of towers holds the early waves', () => {
    const s = session();
    s.player.level = 80;
    s.games.startDefense();
    s.games.run!.faith = 10000;
    ['candle', 'bell', 'candle', 'hearth', 'bell', 'ward'].forEach((t, i) => s.games.build(i, t));
    for (let i = 0; i < 3; i++) s.games.sendWave();
    expect(s.games.run!.shrine).toBeGreaterThan(0);
  });
});

describe('Pantheon Chess (item 59)', () => {
  it('has legal opening moves, captures the Oath-keeper and a god answers', () => {
    expect(START).toHaveLength(36);
    expect(legalMoves(START, 'you').length).toBeGreaterThan(3);
    expect(winner(START)).toBeUndefined();
    expect(winner(apply('.'.repeat(30) + 'BTO...', { from: 30, to: 31 }).replace('O', '.'))).toBe('god');
    const m = godMove(START, 2, new Rng(1), 0);
    expect(m).toBeTruthy();
  });
  it('plays a game against a god to some end', () => {
    const s = session();
    expect(s.games.startChess('vex').ok).toBe(true);
    for (let i = 0; i < 90 && s.games.game; i++) {
      const moves = legalMoves(s.games.game.board, 'you');
      if (!moves.length) break;
      const m = moves[(i * 7) % moves.length]!;
      s.games.chessMove(m.from, m.to);
    }
    expect(s.games.game).toBeUndefined();
    expect(s.games.record().wins['vex'] ?? 0 + s.games.record().losses + s.games.record().draws).toBeGreaterThanOrEqual(0);
  });
});

describe('Living Dungeons (item 51)', () => {
  it('each visit puts monsters and chests elsewhere, deterministically, on floor, away from the entrance', () => {
    const d = content.dungeons.all()[0]!;
    const map = mapFor(d.id);
    const where = (v: number) => {
      rearrange(map, v);
      return map.entities.filter((e) => e.id.startsWith('pack-') || e.id.startsWith('chest-')).map((e) => `${e.id}@${e.x},${e.y}`).join('|');
    };
    const base = where(0);
    const a = where(1);
    const b = where(2);
    expect(a).not.toBe(base);
    expect(a).not.toBe(b);
    expect(where(1)).toBe(a);
    for (const e of map.entities.filter((x) => x.id.startsWith('pack-') || x.id.startsWith('chest-'))) {
      rearrange(map, 3);
      expect(map.tiles[e.y * map.w + e.x]).toBe('_');
    }
    expect(where(0)).toBe(base);
  });
});

describe('The Final Testament (item 60)', () => {
  it('is written from what happened', () => {
    const s = session();
    s.state.stats.kills = 1234;
    const t = writeTestament(s);
    expect(t.byline).toContain('Brother Quill');
    expect(t.chapters.length).toBeGreaterThanOrEqual(6);
    const text = testamentText(s);
    expect(text).toContain(s.player.name);
    expect(text).toContain('1,234');
    expect(testamentText(s)).toBe(text);
  });
});
