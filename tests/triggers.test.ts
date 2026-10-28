import { describe, expect, it } from 'vitest';
import { Rng } from '../src/engine/core/rng';
import { dispatchProcs, type EffectHandlers } from '../src/engine/effects/dispatch';
import { MAX_TRIGGER_DEPTH, TriggerSystem } from '../src/engine/effects/triggers';
import type { TriggeredEffect } from '../src/engine/effects/types';

const burnOnCrit: TriggeredEffect = {
  id: 'burn-on-crit',
  trigger: 'onCrit',
  effects: [{ kind: 'applyStatus', status: 'burn', duration: 3 }],
};

describe('TriggerSystem', () => {
  it('fires only effects for the matching trigger and owner', () => {
    const t = new TriggerSystem(new Rng(1));
    t.register('hero', burnOnCrit, 'item:ember-blade');
    expect(t.fire('hero', 'onHit')).toHaveLength(0);
    expect(t.fire('goblin', 'onCrit')).toHaveLength(0);
    const procs = t.fire('hero', 'onCrit');
    expect(procs).toHaveLength(1);
    expect(procs[0]?.source).toBe('item:ember-blade');
  });

  it('respects proc chance statistically', () => {
    const t = new TriggerSystem(new Rng(2));
    t.register('hero', { ...burnOnCrit, chance: 25 }, 'x');
    let procs = 0;
    for (let i = 0; i < 20_000; i++) procs += t.fire('hero', 'onCrit').length;
    expect(procs / 20_000).toBeGreaterThan(0.23);
    expect(procs / 20_000).toBeLessThan(0.27);
  });

  it('checks conditions against the context', () => {
    const t = new TriggerSystem(new Rng(3));
    t.register(
      'hero',
      {
        id: 'last-stand',
        trigger: 'onLowHp',
        condition: { kind: 'inCombat' },
        effects: [{ kind: 'shield', percentMaxHp: 20 }],
      },
      'passive',
    );
    expect(t.fire('hero', 'onLowHp', {})).toHaveLength(0);
    expect(t.fire('hero', 'onLowHp', { inCombat: true })).toHaveLength(1);
  });

  it('enforces cooldowns, ticking down at end of turn', () => {
    const t = new TriggerSystem(new Rng(4));
    t.register('hero', { ...burnOnCrit, cooldown: 2 }, 'x');
    expect(t.fire('hero', 'onCrit')).toHaveLength(1);
    expect(t.fire('hero', 'onCrit')).toHaveLength(0);
    t.tickCooldowns('hero');
    expect(t.fire('hero', 'onCrit')).toHaveLength(0);
    t.tickCooldowns('hero');
    expect(t.fire('hero', 'onCrit')).toHaveLength(1);
  });

  it('enforces per-combat limits until reset', () => {
    const t = new TriggerSystem(new Rng(5));
    t.register('hero', { ...burnOnCrit, limitPerCombat: 1 }, 'x');
    expect(t.fire('hero', 'onCrit')).toHaveLength(1);
    expect(t.fire('hero', 'onCrit')).toHaveLength(0);
    t.resetCombat();
    expect(t.fire('hero', 'onCrit')).toHaveLength(1);
  });

  it('unregisters everything from one source', () => {
    const t = new TriggerSystem(new Rng(6));
    t.register('hero', burnOnCrit, 'item:a');
    t.register('hero', { ...burnOnCrit, id: 'b' }, 'item:b');
    t.unregisterSource('hero', 'item:a');
    expect(t.count('hero')).toBe(1);
    expect(t.fire('hero', 'onCrit')[0]?.source).toBe('item:b');
  });

  it('stops recursive chains past the max depth', () => {
    const t = new TriggerSystem(new Rng(7));
    t.register('hero', burnOnCrit, 'x');
    expect(t.fire('hero', 'onCrit', {}, MAX_TRIGGER_DEPTH)).toHaveLength(1);
    expect(t.fire('hero', 'onCrit', {}, MAX_TRIGGER_DEPTH + 1)).toHaveLength(0);
  });
});

describe('dispatchProcs', () => {
  it('routes each effect to its handler', () => {
    const log: string[] = [];
    const handlers: EffectHandlers<{ who: string }> = {
      damage: (s, c) => log.push(`${c.who} damage ${s.element}`),
      heal: (_s, c) => log.push(`${c.who} heal`),
      restoreMp: (s) => log.push(`mp ${s.amount}`),
      gainResource: (s) => log.push(`${s.resource} +${s.amount}`),
      applyStatus: (s) => log.push(`status ${s.status}`),
      removeStatus: (s) => log.push(`cleanse ${s.status}`),
      shield: () => log.push('shield'),
      buff: (s) => log.push(`buff ${s.id}`),
      favor: (s) => log.push(`favor ${s.god}`),
      reduceCooldowns: (s) => log.push(`cdr ${s.turns}`),
      castSkill: (s) => log.push(`cast ${s.skillId}`),
      gold: (s) => log.push(`gold ${s.amount}`),
      setStance: (s) => log.push(`stance ${s.stance}`),
      startSong: (s) => log.push(`song ${s.song}`),
      summon: (s) => log.push(`summon ${s.summonId}`),
      guard: (s) => log.push(`guard ${s.share}`),
      timeShift: (s) => log.push(`shift ${s.turns}`),
      rewind: () => log.push('rewind'),
      echo: () => log.push('echo'),
      sigil: (s) => log.push(`sigil ${s.name}`),
      terrain: (s) => log.push(`terrain ${s.terrain}`),
    };
    const t = new TriggerSystem(new Rng(8));
    t.register(
      'hero',
      {
        id: 'zealot',
        trigger: 'onKill',
        effects: [
          { kind: 'heal', percentMaxHp: 5 },
          { kind: 'gainResource', resource: 'rage', amount: 10 },
          { kind: 'favor', god: 'kael', amount: 1 },
        ],
      },
      'blessing',
    );
    dispatchProcs(t.fire('hero', 'onKill'), handlers, { who: 'hero' });
    expect(log).toEqual(['hero heal', 'rage +10', 'favor kael']);
  });
});
