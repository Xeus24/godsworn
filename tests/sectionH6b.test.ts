import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { DEFECTOR_GROUPS, DEFECTORS } from '../src/data/greatFoes';
import { FUN_GAMES } from '../src/data/fun';
import { encounter } from '../src/data/story/helpers';
import { applyDamage, dealDamage } from '../src/engine/combat/hits';
import { groundAfterHit, groundOn } from '../src/engine/combat/ground';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { GameSession } from '../src/engine/state/gameState';
import type { Combatant } from '../src/engine/combat/types';
import { makeHero } from './helpers';

const session = (town: string | false = 'brightwater', zone = 'gloamwood') => {
  const s = GameSession.newGame(41, makeHero());
  (s.world as any).inTown = () => town;
  Object.defineProperty(s.world, 'zone', { get: () => ({ id: zone }), configurable: true });
  s.player.level = 30;
  s.state.gold = 1000000;
  for (const k of ['str', 'dex', 'int', 'wis', 'cha', 'vit'] as const) (s.player.allocated as any)[k] = 40;
  return s;
};
const fight = (s: GameSession, enemies: string[], festival?: string) => {
  const b = createEncounterBattle(s.player, encounter('t', 'T', 20, enemies, true), { rng: s.rng, purse: 100, ...(festival ? { festival } : {}) });
  startBattle(b);
  return { b, hero: b.combatants.find((x) => x.kind === 'hero') as Combatant, foe: b.combatants.find((x) => x.side === 'enemy') as Combatant };
};

describe('Earth Combos (149)', () => {
  it('earth + water ground is mud (slow), earth + fire is magma, blessed ground takes root, cursed ground is buried', () => {
    const s = session();
    const { b, hero, foe } = fight(s, ['meadow-wolf', 'meadow-wolf']);
    b.ground.push({ kind: 'water', side: 'enemy', turns: 4 });
    groundAfterHit(b, hero, foe, 'earth', [], 10);
    expect(groundOn(b, 'enemy').some((g) => g.kind === 'water')).toBe(false);
    expect(foe.statuses.some((x) => x.id === 'slow')).toBe(true);
    b.ground.push({ kind: 'fire', side: 'enemy', turns: 4 });
    const hp = foe.hp;
    groundAfterHit(b, hero, foe, 'earth', [], 40);
    expect(groundOn(b, 'enemy').some((g) => g.kind === 'fire')).toBe(false);
    expect(b.combatants.filter((c) => c.side === 'enemy').some((c) => c.hp < c.maxHp || c.hp < hp)).toBe(true);
    b.ground.push({ kind: 'holy', side: 'enemy', turns: 2 });
    groundAfterHit(b, hero, foe, 'earth', [], 5);
    expect(groundOn(b, 'enemy').find((g) => g.kind === 'holy')!.turns).toBe(4);
    b.ground.push({ kind: 'poison', side: 'enemy', turns: 4 });
    groundAfterHit(b, hero, foe, 'earth', [], 5);
    expect(groundOn(b, 'enemy').some((g) => g.kind === 'poison')).toBe(false);
  });
});

describe('Choir Defectors (150)', () => {
  it('eight members; talking them out of the Choir frees them and opens the chain', () => {
    expect(DEFECTORS).toHaveLength(8);
    expect(DEFECTOR_GROUPS).toHaveLength(4);
    const s = session();
    const { b } = fight(s, ['choir-defector-1', 'choir-defector-2']);
    b.tally.talked.push('choir-defector-1', 'choir-defector-2');
    s.craft.afterBattle(b);
    expect(s.craft.k.defectors).toHaveLength(2);
    expect(s.craft.mods().some((m) => m.stat === 'xpGain')).toBe(true);
    expect(s.tales.options('choir-inside').map((o) => o.opt.l)).toEqual(['The first informant speaks']);
    expect(s.tales.choose('choir-inside', 0).ok).toBe(true);
    expect(s.tales.options('choir-inside')).toHaveLength(0);
    s.craft.k.defectors.push('choir-defector-3');
    expect(s.tales.options('choir-inside')).toHaveLength(1);
    expect(content.dungeons.get('bellhouse').encounters.some((g) => g.enemies.some((e) => e.enemyId === 'choir-defector-7'))).toBe(true);
  });
});

describe('festival rules (151)', () => {
  it('the Longest Quiet: nobody dies. Upside Day: foes apologize.', () => {
    const s = session();
    const quiet = fight(s, ['meadow-wolf'], 'longest-quiet');
    expect(quiet.hero.flags).toContain('cannotKill');
    applyDamage(quiet.b, quiet.hero, quiet.foe, 99999, { element: 'physical', crit: false });
    expect(quiet.b.tally.spared.length).toBe(1);
    const up = fight(s, ['meadow-wolf'], 'upside-day');
    expect(up.foe.statuses.some((x) => x.id === 'stun')).toBe(true);
    const plain = fight(s, ['meadow-wolf']);
    expect(plain.foe.statuses.some((x) => x.id === 'stun')).toBe(false);
    expect(plain.hero.flags).not.toContain('cannotKill');
  });
});

describe('the five games (152-156)', () => {
  const play = (s: GameSession, id: string, best: boolean) => {
    expect(s.fun.start(id).ok).toBe(true);
    for (let n = 0; n < 12 && s.fun.f.active; n++) {
      const a = s.fun.f.active!;
      const opts = a.rounds[a.at]!.opts;
      const pick = opts.reduce((bi, o, i) => (best ? o.v > opts[bi]!.v : o.v < opts[bi]!.v) ? i : bi, 0);
      const r = s.fun.pick(pick);
      if (!s.fun.f.active) return r;
    }
    throw new Error('did not finish');
  };

  it('five games, each with a hidden best answer: playing well pays more than playing badly', () => {
    expect(FUN_GAMES).toHaveLength(5);
    for (const g of FUN_GAMES) {
      const good = session();
      const bad = session();
      const g0 = good.state.gold;
      const b0 = bad.state.gold;
      play(good, g.id, true);
      play(bad, g.id, false);
      expect(good.state.gold - g0, g.id).toBeGreaterThan(bad.state.gold - b0);
    }
  });

  it('Bellringing trains Rhythm; Goatherding wounds Old Billy’s pride; the cook-off gives a ribbon once a year', () => {
    const s = session();
    play(s, 'bells', true);
    expect(s.fun.f.rhythm).toBeGreaterThan(0);
    expect(s.fun.mods().length).toBeGreaterThan(0);
    play(s, 'goats', false);
    expect(s.fun.f.billy).toBe(1);
    play(s, 'cookoff', true);
    expect(s.fun.f.ribbons).toContain('brightwater');
    expect(s.fun.start('cookoff').ok).toBe(false);
    s.state.clock.day += 120;
    expect(s.fun.start('cookoff').ok).toBe(true);
    s.fun.abandon();
    const out = session(false);
    expect(out.fun.start('bells').ok).toBe(false);
    expect(out.fun.start('kites').ok).toBe(true);
  });
});

void dealDamage;
