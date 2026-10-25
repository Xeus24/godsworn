import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { COMBAT, ENEMY_GROWTH } from '../src/data/combat';
import { chooseAction } from '../src/engine/combat/ai';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero, scaleCombatStats } from '../src/engine/combat/combatants';
import { computeDamage, defenseMultiplier, hitChance, resistMultiplier } from '../src/engine/combat/damage';
import { affixPool, applyAffixes } from '../src/engine/combat/affixes';
import { startSong, summon } from '../src/engine/combat/effects';
import { applyDamage, dealDamage } from '../src/engine/combat/hits';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { useSkill, validTargets, basicAttackSkill } from '../src/engine/combat/skills';
import { applyStatus, tickStatusesAtTurnEnd, tickStatusesAtTurnStart } from '../src/engine/combat/statuses';
import { advance, fleeChance, perform, startBattle, timeline } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { Rng } from '../src/engine/core/rng';
import { calculateStats } from '../src/engine/stats/calculate';
import { makeHero } from './helpers';

function battleWith(classId: string, enemyIds: string[], level = 10, seed = 1, rows?: ('front' | 'back')[]): Battle {
  const hero = createHero(benchmarkHero(classId, level));
  const enemies = enemyIds.map((id, i) => createEnemy(content.enemies.get(id), `e${i}`, level, rows?.[i]));
  return new Battle({ party: [hero], enemies, rng: new Rng(seed), encounterId: 'test', canFlee: true });
}

const heroOf = (b: Battle): Combatant => b.combatants.find((x) => x.kind === 'hero') as Combatant;
const enemy = (b: Battle, i = 0): Combatant => b.get(`e${i}`) as Combatant;

describe('damage formula', () => {
  it('defense uses 100 / (100 + defense)', () => {
    expect(defenseMultiplier(0)).toBe(1);
    expect(defenseMultiplier(100)).toBe(0.5);
    expect(defenseMultiplier(-50)).toBe(1);
  });

  it('resistance scales damage and can absorb', () => {
    expect(resistMultiplier(0)).toBe(1);
    expect(resistMultiplier(50)).toBe(0.5);
    expect(resistMultiplier(-100)).toBe(2);
    expect(resistMultiplier(150)).toBe(-0.5);
  });

  it('applies crit damage and stays within variance', () => {
    const base = calculateStats({ level: 1, base: { str: 10, dex: 10, int: 10, vit: 10, wis: 10, luk: 10, fai: 10 }, modifiers: [] });
    const target = { ...base, defense: 0, physicalResist: 0, damageTaken: 100 };
    const rng = new Rng(4);
    for (let i = 0; i < 200; i++) {
      const normal = computeDamage({ power: 100, element: 'physical', attacker: base, target, crit: false }, rng);
      const crit = computeDamage({ power: 100, element: 'physical', attacker: base, target, crit: true }, rng);
      expect(normal).toBeGreaterThanOrEqual(90);
      expect(normal).toBeLessThanOrEqual(110);
      expect(crit).toBeGreaterThanOrEqual(135);
      expect(crit).toBeLessThanOrEqual(165);
    }
  });

  it('returns negative damage for absorbed elements', () => {
    const s = calculateStats({ level: 1, base: { str: 10, dex: 10, int: 10, vit: 10, wis: 10, luk: 10, fai: 10 }, modifiers: [] });
    expect(computeDamage({ power: 100, element: 'fire', attacker: s, target: { ...s, fireResist: 150 }, crit: false }, new Rng(1))).toBeLessThan(0);
  });

  it('clamps hit chance', () => {
    const s = calculateStats({ level: 1, base: { str: 0, dex: 0, int: 0, vit: 0, wis: 0, luk: 0, fai: 0 }, modifiers: [] });
    expect(hitChance({ ...s, accuracy: 10 }, { ...s, dodge: 90 })).toBe(COMBAT.hitChance.min);
    expect(hitChance({ ...s, accuracy: 100 }, { ...s, dodge: 0 })).toBe(100);
  });
});

describe('enemy stats', () => {
  it('land exactly on their scaled targets', () => {
    const def = content.enemies.get('meadow-wolf');
    const e = createEnemy(def, 'w', 9);
    const want = scaleCombatStats(def.stats, 9);
    const b = new Battle({ party: [], enemies: [e], rng: new Rng(1), encounterId: 't', canFlee: true });
    const s = b.stats(e);
    expect(s.maxHp).toBe(want.hp);
    expect(s.physicalAttack).toBe(want.attack);
    expect(s.defense).toBe(want.defense);
    expect(s.speed).toBe(want.speed);
  });

  it('elite tier multiplies HP and XP', () => {
    const def = content.enemies.get('goblin-warchief');
    expect(scaleCombatStats(def.stats, 7, 'elite').hp).toBe(Math.round(def.stats.hp * (1 + ENEMY_GROWTH.hp * 6) * 2.5));
    expect(createEnemy(def, 'g', 7).xp).toBe(def.xp * 3);
  });
});

describe('turn order', () => {
  it('faster combatants act more often', () => {
    const b = battleWith('rogue', ['treant-sapling'], 10);
    startBattle(b);
    const order = timeline(b, 20);
    const heroTurns = order.filter((x) => x.kind === 'hero').length;
    expect(heroTurns).toBeGreaterThan(order.length - heroTurns);
  });

  it('firstStrike acts first', () => {
    const b = battleWith('warrior', ['will-o-wisp'], 10);
    heroOf(b).flags.push('firstStrike');
    startBattle(b);
    advance(b);
    expect(b.current?.kind).toBe('hero');
  });
});

describe('rows and targeting', () => {
  it('melee must hit the front row while it stands; ranged and reach do not', () => {
    const b = battleWith('warrior', ['skeleton-soldier', 'restless-ghost'], 10, 1, ['front', 'back']);
    const hero = heroOf(b);
    expect(validTargets(b, hero, basicAttackSkill(b, hero)).map((x) => x.id)).toEqual(['e0']);
    hero.flags.push('reach');
    expect(validTargets(b, hero, basicAttackSkill(b, hero))).toHaveLength(2);
    const ranger = battleWith('ranger', ['skeleton-soldier', 'restless-ghost'], 10, 1, ['front', 'back']);
    expect(validTargets(ranger, heroOf(ranger), basicAttackSkill(ranger, heroOf(ranger)))).toHaveLength(2);
  });

  it('back-row units take less physical damage', () => {
    const front = battleWith('warrior', ['bandit-thug'], 10, 7, ['front']);
    const back = battleWith('warrior', ['bandit-thug'], 10, 7, ['back']);
    const hitFront = dealDamage(front, heroOf(front), enemy(front), { element: 'physical', power: 200 });
    const hitBack = dealDamage(back, heroOf(back), enemy(back), { element: 'physical', power: 200 });
    expect(hitBack.amount / hitFront.amount).toBeCloseTo(COMBAT.backRowPhysical, 1);
  });

  it('stealthed heroes cannot be singled out, and stealth guarantees a crit', () => {
    const b = battleWith('rogue', ['goblin-cutthroat'], 10);
    const hero = heroOf(b);
    applyStatus(b, hero, hero, 'stealth', { duration: 2, unresistable: true });
    // The only target is stealthed, so enemies may still hit it.
    expect(validTargets(b, enemy(b), basicAttackSkill(b, enemy(b)))).toHaveLength(1);
    b.drain();
    useSkill(b, hero, 'backstab', 1, 'e0');
    const hit = b.drain().find((e) => e.type === 'damage');
    expect(hit && hit.type === 'damage' && hit.crit).toBe(true);
    expect(b.hasStatus(hero, 'stealth')).toBe(false);
  });
});

describe('statuses', () => {
  it('stack, tick damage at turn start and expire at turn end', () => {
    const b = battleWith('mage', ['treant-sapling'], 10);
    const t = enemy(b);
    applyStatus(b, heroOf(b), t, 'burn', { duration: 2, unresistable: true });
    applyStatus(b, heroOf(b), t, 'burn', { duration: 2, unresistable: true });
    expect(t.statuses[0]?.stacks).toBe(2);
    const hp = t.hp;
    tickStatusesAtTurnStart(b, t);
    expect(t.hp).toBeLessThan(hp);
    tickStatusesAtTurnEnd(b, t);
    tickStatusesAtTurnEnd(b, t);
    expect(b.hasStatus(t, 'burn')).toBe(false);
  });

  it('respects immunities', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    heroOf(b).flags.push('immune:stun');
    expect(applyStatus(b, enemy(b), heroOf(b), 'stun', { duration: 1 })).toBe(false);
  });

  it('stun skips the turn', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    startBattle(b);
    for (const x of b.combatants) x.nextAt = x.kind === 'hero' ? 0 : 1;
    applyStatus(b, enemy(b), heroOf(b), 'stun', { duration: 1, unresistable: true });
    const events = advance(b);
    expect(events.some((e) => e.type === 'skip' && e.actorId === heroOf(b).id)).toBe(true);
    expect(b.current?.id).toBe('e0');
  });

  it('modifiers from statuses change stats', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    const before = b.stats(enemy(b)).speed;
    applyStatus(b, heroOf(b), enemy(b), 'slow', { duration: 2, unresistable: true });
    expect(b.stats(enemy(b)).speed).toBeLessThan(before);
  });
});

describe('hits and defenses', () => {
  it('shields absorb damage first', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    const hero = heroOf(b);
    hero.shield = 50;
    const hp = hero.hp;
    applyDamage(b, enemy(b), hero, 30, { element: 'physical', crit: false });
    expect(hero.shield).toBe(20);
    expect(hero.hp).toBe(hp);
  });

  it('reviveOnce saves from a killing blow once', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    const hero = heroOf(b);
    hero.flags.push('reviveOnce');
    applyDamage(b, enemy(b), hero, 99999, { element: 'physical', crit: false });
    expect(hero.alive).toBe(true);
    expect(hero.hp).toBe(1);
    applyDamage(b, enemy(b), hero, 99999, { element: 'physical', crit: false });
    expect(hero.alive).toBe(false);
  });

  it('filling the stagger bar breaks the enemy: stunned and taking more damage', () => {
    const b = battleWith('warrior', ['treant-sapling'], 10);
    startBattle(b);
    const t = enemy(b);
    const st = t.stagger as NonNullable<Combatant['stagger']>;
    applyDamage(b, heroOf(b), t, Math.ceil(st.max) + 1, { element: 'physical', crit: false });
    expect(st.brokenTurns).toBe(COMBAT.brokenTurns);
    expect(b.hasStatus(t, 'stun')).toBe(true);
  });

  it('kills leave corpses and count in the tally', () => {
    const b = battleWith('necromancer', ['goblin-cutthroat'], 10);
    applyDamage(b, heroOf(b), enemy(b), 99999, { element: 'shadow', crit: false });
    expect(enemy(b).corpse).toBe(true);
    expect(b.tally.kills).toHaveLength(1);
    expect(b.checkOutcome()).toBe('victory');
  });
});

describe('class mechanics', () => {
  it('Rage builds from dealing and taking damage', () => {
    const b = battleWith('warrior', ['goblin-cutthroat', 'goblin-cutthroat'], 10);
    const hero = heroOf(b);
    dealDamage(b, hero, enemy(b), { element: 'physical', power: 50 });
    expect(hero.resources.rage).toBeGreaterThan(0);
    const after = hero.resources.rage ?? 0;
    applyDamage(b, enemy(b, 1), hero, Math.round(hero.maxHp * 0.1), { element: 'physical', crit: false });
    expect(hero.resources.rage).toBeGreaterThan(after);
  });

  it('finishers spend every Combo Point for more damage', () => {
    const b = battleWith('rogue', ['treant-sapling'], 10, 3);
    const hero = heroOf(b);
    hero.resources.combo = 5;
    useSkill(b, hero, 'eviscerate', 1, 'e0');
    expect(hero.resources.combo).toBe(0);
  });

  it('Mage ice on a Burning target always Shatters', () => {
    const b = battleWith('mage', ['treant-sapling'], 10);
    const hero = heroOf(b);
    applyStatus(b, hero, enemy(b), 'burn', { duration: 3, unresistable: true });
    b.drain();
    dealDamage(b, hero, enemy(b), { element: 'ice', power: 50 });
    expect(b.drain().some((e) => e.type === 'combo' && e.name === 'Shatter')).toBe(true);
    expect(b.hasStatus(enemy(b), 'burn')).toBe(false);
  });

  it('Focus is lost on a heavy hit', () => {
    const b = battleWith('ranger', ['bandit-thug'], 10);
    const hero = heroOf(b);
    hero.resources.focus = 3;
    applyDamage(b, enemy(b), hero, Math.round(hero.maxHp * 0.2), { element: 'physical', crit: false });
    expect(hero.resources.focus).toBe(0);
  });

  it('Rangers start with their pet', () => {
    const b = battleWith('ranger', ['bandit-thug'], 10);
    startBattle(b);
    expect(b.alive('party').some((x) => x.summonId === 'wolf-companion')).toBe(true);
  });

  it('Raise Skeleton needs a corpse', () => {
    const b = battleWith('necromancer', ['goblin-cutthroat', 'goblin-cutthroat'], 10);
    const hero = heroOf(b);
    expect(summon(b, hero, 'skeleton-warrior', true)).toBeUndefined();
    applyDamage(b, hero, enemy(b), 99999, { element: 'shadow', crit: false });
    expect(summon(b, hero, 'skeleton-warrior', true)?.summonId).toBe('skeleton-warrior');
    expect(enemy(b).corpse).toBe(false);
  });

  it('switching songs with enough Verse plays a Crescendo', () => {
    const b = battleWith('bard', ['goblin-cutthroat'], 10);
    const hero = heroOf(b);
    startSong(b, hero, 'valor');
    hero.resources.verse = 60;
    const hp = enemy(b).hp;
    startSong(b, hero, 'ward');
    expect(hero.songs).toEqual(['ward']);
    expect(hero.resources.verse).toBe(10);
    expect(enemy(b).hp).toBeLessThan(hp);
  });

  it('Monk stances change basic attacks', () => {
    const b = battleWith('monk', ['treant-sapling'], 10, 5);
    const hero = heroOf(b);
    const plain = basicAttackSkill(b, hero).damage?.multiplier;
    useSkill(b, hero, 'stance-of-the-tiger', 1);
    expect(hero.stance).toBe('tiger');
    expect(basicAttackSkill(b, hero).damage?.multiplier).toBeGreaterThan(plain ?? 0);
  });

  it('the party chain grows on consecutive hits on one target', () => {
    const b = battleWith('warrior', ['treant-sapling'], 10);
    const hero = heroOf(b);
    b.drain();
    useSkill(b, hero, 'basic-attack', 1, 'e0');
    useSkill(b, hero, 'basic-attack', 1, 'e0');
    expect(b.chain.count).toBe(1);
    expect(b.drain().some((e) => e.type === 'chain')).toBe(true);
  });
});

describe('actions', () => {
  it('perform rejects actions out of turn', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    startBattle(b);
    advance(b);
    const other = b.combatants.find((x) => x !== b.current) as Combatant;
    expect(perform(b, { kind: 'defend', actorId: other.id }).ok).toBe(false);
  });

  it('items in battle are consumed through the hook', () => {
    let potions = 1;
    const hero = createHero(benchmarkHero('warrior', 10));
    hero.hp = 10;
    const b = new Battle({
      party: [hero],
      enemies: [createEnemy(content.enemies.get('goblin-cutthroat'), 'e0', 10)],
      rng: new Rng(2),
      encounterId: 't',
      canFlee: true,
      hooks: { consumeItem: () => (potions-- > 0) },
    });
    startBattle(b);
    for (const x of b.combatants) x.nextAt = x.kind === 'hero' ? 0 : 99;
    advance(b);
    expect(perform(b, { kind: 'item', actorId: hero.id, itemId: 'health-potion-minor' }).ok).toBe(true);
    expect(hero.hp).toBeGreaterThan(10);
    for (const x of b.combatants) x.nextAt = x.kind === 'hero' ? b.time : 999;
    advance(b);
    expect(perform(b, { kind: 'item', actorId: hero.id, itemId: 'health-potion-minor' }).ok).toBe(false);
  });

  it('cannot flee boss fights; flee chance is clamped', () => {
    const b = battleWith('warrior', ['goblin-cutthroat'], 10);
    const chance = fleeChance(b);
    expect(chance).toBeGreaterThanOrEqual(COMBAT.flee.min);
    expect(chance).toBeLessThanOrEqual(COMBAT.flee.max);
    const boss = new Battle({ party: [createHero(benchmarkHero('warrior', 5))], enemies: [], rng: new Rng(1), encounterId: 'b', canFlee: true, isBoss: true });
    boss.current = boss.combatants[0];
    expect(perform(boss, { kind: 'flee', actorId: 'hero' }).ok).toBe(false);
  });
});

describe('AI', () => {
  it('healers heal a badly hurt ally', () => {
    const b = battleWith('warrior', ['goblin-cutthroat', 'goblin-shaman'], 10, 3);
    const shaman = enemy(b, 1);
    enemy(b, 0).hp = Math.round(enemy(b, 0).maxHp * 0.2);
    let heals = 0;
    for (let i = 0; i < 20; i++) {
      const a = chooseAction(b, shaman);
      if (a.kind === 'skill' && a.skillId === 'mend-ally') heals++;
    }
    expect(heals).toBeGreaterThan(10);
  });
});

describe('full battles', () => {
  it('always end, and the same seed gives the same result', () => {
    const run = (seed: number): string => {
      const b = createEncounterBattle(benchmarkHero('mage', 6), content.encounters.get('goblin-raiders'), { rng: new Rng(seed), level: 6 });
      runAutoBattle(b);
      return `${b.outcome}:${b.turnCount}`;
    };
    for (let seed = 1; seed < 20; seed++) {
      expect(run(seed)).toBe(run(seed));
      expect(run(seed)).not.toMatch(/^ongoing/);
    }
  });

  it('every class can win its first fight', () => {
    for (const cls of content.classes.ids()) {
      const b = createEncounterBattle(makeHero({ classId: cls }), content.encounters.get('slime-puddle'), { rng: new Rng(11) });
      runAutoBattle(b);
      expect(b.outcome, cls).toBe('victory');
    }
  });
});

describe('scripted bosses', () => {
  const bossBattle = (id: string, level = 20): Battle => {
    const b = battleWith('warrior', [id], level);
    startBattle(b);
    return b;
  };

  it('enter phases at their HP thresholds, with adds and new stats', () => {
    const b = bossBattle('bone-lord');
    const boss = enemy(b);
    const hero = heroOf(b);
    const before = b.combatants.length;
    applyDamage(b, hero, boss, Math.ceil(boss.maxHp * 0.4), { element: 'physical', crit: false, dot: true });
    expect(boss.boss?.phase).toBe(1);
    expect(b.combatants.length).toBe(before + 2);
    const adds = b.combatants.slice(before);
    expect(adds.every((a) => a.side === 'enemy' && a.xp === 0 && a.lootTable === undefined)).toBe(true);
    const events = b.drain();
    expect(events.some((e) => e.type === 'boss' && e.moment === 'phase')).toBe(true);
    // Both remaining thresholds at once: phases are entered in order.
    applyDamage(b, hero, boss, Math.ceil(boss.maxHp * 0.3), { element: 'physical', crit: false, dot: true });
    expect(boss.boss?.phase).toBe(2);
    expect(boss.statInput.modifiers.some((m) => m.source === 'phase:Death’s Embrace')).toBe(true);
  });

  it('wind up telegraphed attacks, then must unleash them', () => {
    const b = bossBattle('goblin-king', 8);
    const boss = enemy(b);
    boss.turnsTaken = 3; // its 4th turn is a wind-up
    for (const x of b.combatants) x.nextAt = x === boss ? 0 : 1000;
    advance(b);
    expect(boss.boss?.charging).toBe('crushing-blow');
    expect(b.hasStatus(boss, 'charging')).toBe(true);
    const forced = chooseAction(b, boss);
    expect(forced).toMatchObject({ kind: 'skill', skillId: 'crushing-blow' });
  });

  it('never use telegraph skills unannounced', () => {
    const b = bossBattle('goblin-king', 8);
    const boss = enemy(b);
    for (let i = 0; i < 50; i++) {
      const a = chooseAction(b, boss);
      expect(a.kind === 'skill' && a.skillId === 'crushing-blow').toBe(false);
    }
  });

  it('are interrupted by a Break', () => {
    const b = bossBattle('goblin-king', 8);
    const boss = enemy(b);
    boss.turnsTaken = 3;
    for (const x of b.combatants) x.nextAt = x === boss ? 0 : 1000;
    advance(b);
    expect(boss.boss?.charging).toBeDefined();
    const st = boss.stagger as NonNullable<Combatant['stagger']>;
    applyDamage(b, heroOf(b), boss, Math.ceil(st.max * 1.5), { element: 'physical', crit: false });
    expect(boss.boss?.charging).toBeUndefined();
    expect(b.hasStatus(boss, 'charging')).toBe(false);
  });

  it('enrage when the fight drags on, and keep growing angrier', () => {
    const b = bossBattle('goblin-king', 8);
    const boss = enemy(b);
    boss.turnsTaken = 40;
    for (const x of b.combatants) x.nextAt = x === boss ? 0 : 1000;
    advance(b);
    expect(boss.boss?.enraged).toBe(true);
    expect(boss.statuses.find((s) => s.id === 'enraged')?.stacks).toBe(1);
  });

  it('leave ordinary enemies alone', () => {
    const b = battleWith('warrior', ['green-slime'], 5);
    startBattle(b);
    expect(enemy(b).boss).toBeUndefined();
  });
});

describe('elite affixes', () => {
  const roaming = (tier: 'elite' | 'champion', n: number) => ({ id: 'r', name: 'r', description: '', level: 10, canFlee: true, enemies: Array.from({ length: n }, () => ({ enemyId: 'dire-wolf', tier })) });

  it('elites roll one, champion packs share two', () => {
    const elite = createEncounterBattle(benchmarkHero('warrior', 10), roaming('elite', 1), { rng: new Rng(2) });
    const e = elite.combatants.find((x) => x.side === 'enemy') as Combatant;
    expect(e.affixes).toHaveLength(1);
    expect(e.name.endsWith('Dire Wolf')).toBe(true);
    expect(e.name).toContain(content.eliteAffixes.get(e.affixes?.[0] as string).name);
    const pack = createEncounterBattle(benchmarkHero('warrior', 10), roaming('champion', 3), { rng: new Rng(2) });
    const wolves = pack.combatants.filter((x) => x.side === 'enemy');
    expect(wolves.every((w) => w.affixes?.length === 2 && w.affixes.join() === wolves[0]?.affixes?.join())).toBe(true);
  });

  it('change the enemy through modifiers and triggers, and give more XP', () => {
    const b = battleWith('warrior', ['dire-wolf', 'dire-wolf'], 10);
    const [plain, hulk] = [enemy(b, 0), enemy(b, 1)];
    const xp = hulk.xp;
    applyAffixes(hulk, ['hulking', 'molten'], content);
    expect(hulk.maxHp).toBeGreaterThan(plain.maxHp * 1.5);
    expect(hulk.triggers.some((t) => t.source === 'affix:molten')).toBe(true);
    expect(hulk.xp).toBeGreaterThan(xp);
  });

  it('respect creature types', () => {
    expect(affixPool(['construct'], content)).not.toContain('venomous');
    expect(affixPool(['beast'], content)).toContain('venomous');
  });

  it('ordinary enemies and bosses have none', () => {
    const b = createEncounterBattle(benchmarkHero('warrior', 10), content.encounters.get('q-varn'), { rng: new Rng(1) });
    expect(b.combatants.some((x) => x.affixes?.length)).toBe(false);
  });
});
