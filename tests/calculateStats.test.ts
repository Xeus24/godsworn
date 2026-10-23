import { describe, expect, it } from 'vitest';
import { calculateStats, calculateStatsDetailed } from '../src/engine/stats/calculate';
import type { Modifier } from '../src/engine/stats/modifiers';
import { ALL_STATS, type PrimaryStats } from '../src/engine/stats/types';

const base = (v = 10): PrimaryStats => ({ str: v, dex: v, int: v, vit: v, wis: v, luk: v, fai: v });
const m = (stat: Modifier['stat'], type: Modifier['type'], value: number, extra: Partial<Modifier> = {}): Modifier => ({
  stat,
  type,
  value,
  source: 'test',
  ...extra,
});

describe('derived stat formulas', () => {
  const s = calculateStats({ level: 10, base: base(10), modifiers: [] });

  it('Max HP = 50 + VIT x 10 + level x 5', () => expect(s.maxHp).toBe(50 + 100 + 50));
  it('Max MP = 20 + INT x 4 + WIS x 3 + level x 2', () => expect(s.maxMp).toBe(20 + 40 + 30 + 20));
  it('Physical Attack = STR x 2 + weapon damage', () => expect(s.physicalAttack).toBe(20));
  it('Magic Attack = INT x 2 + weapon magic', () => expect(s.magicAttack).toBe(20));
  it('Divine Power = FAI x 2 + relic power', () => expect(s.divinePower).toBe(20));
  it('Defense = VIT + armor', () => expect(s.defense).toBe(10));
  it('Magic Resist = WIS + armor resist', () => expect(s.magicResist).toBe(10));
  it('Crit Chance = 5% + LUK x 0.5%', () => expect(s.critChance).toBe(10));
  it('Crit Damage starts at 150%', () => expect(s.critDamage).toBe(150));
  it('Dodge = DEX x 0.4%', () => expect(s.dodge).toBe(4));

  it('computes every stat', () => {
    for (const stat of ALL_STATS) expect(Number.isFinite(s[stat])).toBe(true);
  });
});

describe('gear feeds derived stats', () => {
  it('weapon damage, armor and relic power flow into attack/defense/divine', () => {
    const s = calculateStats({
      level: 1,
      base: base(10),
      modifiers: [m('weaponDamage', 'flat', 15), m('armor', 'flat', 30), m('relicPower', 'flat', 8), m('armorResist', 'flat', 4)],
    });
    expect(s.physicalAttack).toBe(35);
    expect(s.defense).toBe(40);
    expect(s.divinePower).toBe(28);
    expect(s.magicResist).toBe(14);
  });

  it('primary modifiers resolve before derived formulas use them', () => {
    // STR 10 +10 flat, +50% -> 30. Attack = 60, then +100% -> 120.
    const s = calculateStats({
      level: 1,
      base: base(10),
      modifiers: [m('str', 'flat', 10), m('str', 'percent', 50), m('physicalAttack', 'percent', 100)],
    });
    expect(s.str).toBe(30);
    expect(s.physicalAttack).toBe(120);
  });
});

describe('caps', () => {
  it('caps crit chance at 60%', () => {
    expect(calculateStats({ level: 1, base: { ...base(10), luk: 500 }, modifiers: [] }).critChance).toBe(60);
  });

  it('caps dodge at 35%', () => {
    expect(calculateStats({ level: 1, base: { ...base(10), dex: 500 }, modifiers: [] }).dodge).toBe(35);
  });

  it('caps cooldown reduction at 40%', () => {
    const s = calculateStats({ level: 1, base: base(), modifiers: [m('cooldownReduction', 'flat', 75)] });
    expect(s.cooldownReduction).toBe(40);
  });

  it('clamps resistances to [-100, 200]', () => {
    const s = calculateStats({
      level: 1,
      base: base(),
      modifiers: [m('fireResist', 'flat', 500), m('shadowResist', 'flat', -400)],
    });
    expect(s.fireResist).toBe(200);
    expect(s.shadowResist).toBe(-100);
  });

  it('override ignores caps', () => {
    const s = calculateStats({ level: 1, base: base(), modifiers: [m('critChance', 'override', 100)] });
    expect(s.critChance).toBe(100);
  });
});

describe('conditional modifiers', () => {
  const mods = [m('fireDamage', 'percent', 0), m('damageBonus', 'flat', 25, { condition: { kind: 'skillTag', tag: 'Fire' } })];

  it('apply only when the context matches', () => {
    expect(calculateStats({ level: 1, base: base(), modifiers: mods }).damageBonus).toBe(0);
    expect(calculateStats({ level: 1, base: base(), modifiers: mods }, { skillTags: ['Fire', 'Projectile'] }).damageBonus).toBe(25);
  });
});

describe('rounding', () => {
  it('floors integer stats and keeps two decimals on percentages', () => {
    const s = calculateStats({ level: 1, base: { ...base(10), luk: 3 }, modifiers: [m('maxHp', 'percent', 3.3)] });
    expect(Number.isInteger(s.maxHp)).toBe(true);
    expect(s.critChance).toBe(6.5);
  });
});

describe('breakdown', () => {
  it('exposes per-stat details for tooltips', () => {
    const { breakdown } = calculateStatsDetailed({ level: 5, base: base(10), modifiers: [m('maxHp', 'flat', 10)] });
    expect(breakdown.maxHp.base).toBe(50 + 100 + 25);
    expect(breakdown.maxHp.flat).toBe(10);
    expect(breakdown.maxHp.final).toBe(185);
  });
});
