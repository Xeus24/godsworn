import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { RAGE_TACTICS } from '../src/data/general/techniques';
import { Rng } from '../src/engine/core/rng';
import { canUseSkill, rageDiceCost } from '../src/engine/combat/skills';
import { gainResource } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';

const enc = () => content.encounters.all().find((e) => !e.isBoss && e.level >= 10 && e.level <= 14)!;
const battleFor = (tactics: boolean) => {
  const hero = benchmarkHero('warrior', 12);
  if (tactics) hero.rageAsTactics = true;
  const b = createEncounterBattle(hero, enc(), { rng: new Rng(3) });
  startBattle(b);
  return { b, x: b.alive('party')[0]! };
};
const rageSkill = () => content.skills.all().find((s) => s.cost.resource?.id === 'rage' && !s.finisher && s.id.length > 0)!;

describe("the Warrior's optional Tactics mode", () => {
  it('is off by default: Rage works as before and builds no dice', () => {
    const { b, x } = battleFor(false);
    expect(x.rageDice).toBeUndefined();
    const dice = x.tactic;
    gainResource(b, x, 'rage', 40);
    expect(x.resources.rage).toBeGreaterThan(0);
    expect(x.tactic).toBe(dice);
  });

  it('on: Rage is built as Tactic Dice, and Rage skills are paid in dice', () => {
    const { b, x } = battleFor(true);
    expect(x.rageDice).toBe(true);
    x.tactic = 0;
    gainResource(b, x, 'rage', RAGE_TACTICS.perDie * 2);
    expect(x.tactic).toBe(Math.min(2, x.tacticMax ?? 0));
    expect(x.resources.rage).toBe(0);
    const skill = rageSkill();
    const need = rageDiceCost(skill.cost.resource!.amount);
    x.tactic = need - 1;
    const short = canUseSkill(b, x, skill);
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toMatch(/Tactic Di/);
    x.tactic = need;
    x.cooldowns[skill.id] = 0;
    expect(canUseSkill(b, x, skill).ok).toBe(true);
  });

  it('dice stop at the pool size and the leftover Rage is not hoarded', () => {
    const { b, x } = battleFor(true);
    x.tactic = x.tacticMax;
    gainResource(b, x, 'rage', 500);
    expect(x.tactic).toBe(x.tacticMax);
    expect(x.rageBank).toBeLessThan(RAGE_TACTICS.perDie);
  });
});
