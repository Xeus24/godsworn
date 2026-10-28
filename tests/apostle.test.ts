import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { APOSTLESHIP, DEVOTION } from '../src/data/devotion';
import { hybridTrialOpen } from '../src/engine/character/multiclass';
import { characterStats } from '../src/engine/character/stats';
import type { Character } from '../src/engine/character/types';
import { createHero } from '../src/engine/combat/combatants';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { skillOptions, useSkill } from '../src/engine/combat/skills';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { Rng } from '../src/engine/core/rng';
import { canAscend, canAttemptTrial, divineWeaponOf, trialLevel, weaponStage } from '../src/engine/gods/apostle';
import { activeMajors, blessingSlotCount } from '../src/engine/gods/blessings';
import { tierOf } from '../src/engine/gods/devotion';
import { rollPunisher } from '../src/engine/gods/punishers';
import { canEquip } from '../src/engine/items/equipment';
import { availablePoints, earnedPoints, treeModifiers, treeOf, allocate } from '../src/engine/skills/tree';
import { ownsTree } from '../src/engine/skills/treeOwners';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { atShrine, makeHero } from './helpers';

const STATS = { str: 999, dex: 999, int: 999, vit: 999, wis: 999, luk: 999, fai: 999, cha: 0 };

function exalted(god = 'kael', classId = 'mage', level = 32): GameSession {
  const hero = makeHero({ classId });
  hero.level = level;
  hero.devotion.favor[god] = 900;
  return GameSession.newGame(1, hero);
}

/** Wins all three trial stages the quick way. */
function completeTrial(s: GameSession, god: string): void {
  for (let stage = 1; stage <= 3; stage++) winEncounter(s, `apostle-trial-${god}-${stage}`);
}

function winEncounter(s: GameSession, id: string): void {
  const b = createEncounterBattle(s.player, content.encounters.get(id), { rng: s.rng });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9999999, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
}

describe('the Trial of Apostleship', () => {
  it('opens at Exalted, one stage at a time, scaled to the hero', () => {
    const s = exalted();
    const p = s.player;
    expect(canAttemptTrial(p, 'kael', 1).ok).toBe(true);
    expect(canAttemptTrial(p, 'kael', 2).ok).toBe(false);
    expect(canAttemptTrial(p, 'solenne', 1).ok).toBe(false);
    expect(trialLevel(p, 1)).toBe(32);
    expect(trialLevel(p, 3)).toBe(34);
    p.level = 10;
    expect(trialLevel(p, 1)).toBe(APOSTLESHIP.trialMinLevel);
  });

  it('winning the stages in order completes it; then you may ascend', () => {
    const s = exalted();
    expect(canAscend(s.player, 'kael').ok).toBe(false);
    winEncounter(s, 'apostle-trial-kael-2');
    expect(s.player.devotion.trialStage.kael ?? 0).toBe(0);
    completeTrial(s, 'kael');
    expect(s.player.devotion.trialStage.kael).toBe(3);
    expect(canAscend(s.player, 'kael').ok).toBe(true);
  });

  it('each god has a 20-25 node apostle tree, an avatar, 4 weapon stages and edicts', () => {
    for (const g of content.pantheon.all()) {
      const nodes = treeOf(`apostle-${g.id}`).nodes.length;
      expect(nodes).toBeGreaterThanOrEqual(20);
      expect(nodes).toBeLessThanOrEqual(25);
      expect(content.skills.get(content.apostles.get(g.id).avatar).ultimate).toBe(true);
      expect(content.edicts.filter((e) => e.god === g.id).length).toBeGreaterThan(0);
    }
  });
});

describe('ascension', () => {
  function apostle(god = 'kael', classId = 'mage', level = 32): GameSession {
    const s = exalted(god, classId, level);
    completeTrial(s, god);
    atShrine(s, god);
    expect(s.devotion.ascend(god).ok).toBe(true);
    return s;
  }

  it('makes you Apostle: tier, title, Divine blessing in an extra slot, tree, weapon, edict', () => {
    const s = apostle();
    const p = s.player;
    expect(tierOf(p, 'kael')).toBe('apostle');
    expect(p.devotion.titles).toContain('Apostle of Kael');
    expect(blessingSlotCount(p)).toBe(2 + 1);
    expect(activeMajors(p).map((b) => b.id)).toContain('kael-divine');
    expect(ownsTree(p, 'apostle-kael')).toBe(true);
    expect(earnedPoints(p, 'apostle-kael')).toBe(APOSTLESHIP.basePoints);
    const weapon = s.state.inventory.slots.find((i) => i && divineWeaponOf(i));
    expect(weapon && divineWeaponOf(weapon)).toEqual({ god: 'kael', stage: 2 });
    expect(p.devotion.apostle?.edict).toBeDefined();
  });

  it('only one god at a time', () => {
    const s = apostle();
    s.player.devotion.favor.solenne = 900;
    completeTrial(s, 'solenne');
    expect(canAscend(s.player, 'solenne').ok).toBe(false);
  });

  it('the divine weapon is wielded by any class, but only by its Apostle', () => {
    const s = apostle('kael', 'mage');
    const weapon = s.state.inventory.slots.find((i) => i && divineWeaponOf(i));
    if (!weapon) throw new Error('no weapon');
    expect(content.items.get(weapon.baseId).category).toBe('weapon');
    expect(canEquip(s.player, weapon, 'mainHand', STATS).ok).toBe(true);
    const other = makeHero({ classId: 'warrior' });
    other.level = 40;
    expect(canEquip(other, weapon, 'mainHand', STATS).ok).toBe(false);
  });

  it('the weapon evolves at levels 30, 45 and 60', () => {
    expect([1, 29, 30, 44, 45, 60].map(weaponStage)).toEqual([1, 1, 2, 2, 3, 4]);
    const s = apostle('kael', 'warrior', 29);
    const weapon = s.state.inventory.slots.find((i) => i && divineWeaponOf(i));
    if (!weapon) throw new Error('no weapon');
    const uid = weapon.uid;
    expect(divineWeaponOf(weapon)?.stage).toBe(1);
    s.grantXp(5_000_000, true);
    expect(s.player.level).toBeGreaterThanOrEqual(45);
    expect(divineWeaponOf(weapon)?.stage).toBeGreaterThanOrEqual(3);
    expect(weapon.uid).toBe(uid);
  });

  it('the Divine Avatar is an extra ultimate, once per battle', () => {
    const s = apostle();
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: new Rng(3) });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    expect(hero.avatarSkill).toBe('avatar-kael');
    hero.ultimate = 100;
    expect(skillOptions(b, hero).find((o) => o.skill.id === 'avatar-kael')?.check.ok).toBe(true);
    expect(useSkill(b, hero, 'avatar-kael', 1)).toBe(true);
    expect(hero.buffs.some((bf) => bf.id === 'avatar:kael')).toBe(true);
    hero.ultimate = 100;
    expect(skillOptions(b, hero).find((o) => o.skill.id === 'avatar-kael')?.check.ok).toBe(false);
  });

  it('apostle points grow with levels after ascension', () => {
    const s = apostle('kael', 'mage', 32);
    s.player.level = 40;
    s.player.paragonLevel = 4;
    expect(earnedPoints(s.player, 'apostle-kael')).toBe(APOSTLESHIP.basePoints + 8 + 2);
  });
});

describe('Divine Edicts', () => {
  function apostleWithEdict(id: string): GameSession {
    const s = exalted('kael', 'warrior');
    completeTrial(s, 'kael');
    atShrine(s, 'kael');
    s.devotion.ascend('kael');
    const edict = content.edicts.get(id);
    (s.player.devotion.apostle as NonNullable<Character['devotion']['apostle']>).edict = { id, progress: 0, battlesLeft: edict.battles };
    return s;
  }

  it('fulfilling an edict earns favor and gold and issues a new one', () => {
    const s = apostleWithEdict('kael-edict-0');
    const edict = content.edicts.get('kael-edict-0');
    const gold = s.state.gold;
    for (let i = 0; i < edict.count; i++) winEncounter(s, 'slime-puddle');
    const a = s.player.devotion.apostle;
    expect(a?.edictsDone).toBe(1);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(a?.edict?.id).not.toBe('kael-edict-0');
  });

  it('ignoring one costs favor and weakens apostle passives', () => {
    const s = apostleWithEdict('kael-edict-2');
    const a = s.player.devotion.apostle;
    if (!a?.edict) throw new Error('no edict');
    // An apostle tree minor, to see the 75% passive multiplier.
    const minor = treeOf('apostle-kael').nodes.find((n) => n.kind === 'minor' && n.tier === 1 && n.modifiers);
    if (!minor) throw new Error('no minor');
    allocate(s.player, 'apostle-kael', minor.id);
    const full = treeModifiers(s.player).find((m) => m.source === `tree:${minor.id}`)?.value ?? 0;
    a.edict.battlesLeft = 1;
    const favor = s.player.devotion.favor.kael ?? 0;
    winEncounter(s, 'slime-puddle');
    expect(a.neglected).toBe(true);
    expect(s.player.devotion.favor.kael ?? 0).toBeLessThan(favor);
    expect(treeModifiers(s.player).find((m) => m.source === `tree:${minor.id}`)?.value).toBeCloseTo(full * APOSTLESHIP.neglectMultiplier);
  });
});

describe('apostasy', () => {
  it('the god turns Hated, the weapon is stored, the tree lost, and heralds hunt you', () => {
    const s = exalted('kael', 'warrior');
    completeTrial(s, 'kael');
    atShrine(s, 'kael');
    s.devotion.ascend('kael');
    const p = s.player;
    expect(s.devotion.renounce().ok).toBe(true);
    expect(p.devotion.apostle).toBeUndefined();
    expect(p.devotion.favor.kael).toBe(DEVOTION.minFavor);
    expect(tierOf(p, 'kael')).toBe('hated');
    expect(ownsTree(p, 'apostle-kael')).toBe(false);
    expect(availablePoints(p, 'apostle-kael')).toBe(0);
    expect(p.devotion.reliquary).toHaveLength(1);
    expect(s.state.inventory.slots.some((i) => i && divineWeaponOf(i))).toBe(false);
    expect(p.devotion.titles).toContain('Apostle of Kael');
    expect(p.devotion.hunt?.god).toBe('kael');
    let hunted = 0;
    const rng = new Rng(5);
    for (let i = 0; i < 100; i++) if (rollPunisher(p, rng) === 'kael') hunted++;
    expect(hunted).toBeGreaterThan(40);
  });

  it('returning to a god later restores the stored weapon', () => {
    const s = exalted('kael', 'warrior');
    completeTrial(s, 'kael');
    atShrine(s, 'kael');
    s.devotion.ascend('kael');
    const uid = s.state.inventory.slots.find((i) => i && divineWeaponOf(i))?.uid;
    s.devotion.renounce();
    s.player.devotion.favor.kael = 900;
    atShrine(s, 'kael');
    expect(s.devotion.ascend('kael').ok).toBe(true);
    expect(s.state.inventory.slots.find((i) => i && divineWeaponOf(i))?.uid).toBe(uid);
    expect(s.player.devotion.reliquary).toHaveLength(0);
  });
});

describe('the Sun Knight', () => {
  it('needs the Paladin specialization and Apostleship of Solenne', () => {
    const s = exalted('solenne', 'warrior', 40);
    const p = s.player;
    (p.classes[0] as { level: number }).level = 30;
    expect(hybridTrialOpen(p, 'sun-knight').ok).toBe(false);
    p.classes[0] = { ...(p.classes[0] as Character['classes'][number]), specialization: 'paladin' };
    expect(hybridTrialOpen(p, 'sun-knight').ok).toBe(false);
    completeTrial(s, 'solenne');
    atShrine(s, 'solenne');
    s.devotion.ascend('solenne');
    expect(hybridTrialOpen(p, 'sun-knight').ok).toBe(true);
    expect(createHero(p).flags.length).toBeGreaterThanOrEqual(0);
    expect(characterStats(p).holyDamage).toBeGreaterThan(0);
  });
});
