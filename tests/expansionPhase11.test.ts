import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOSS_LINES } from '../src/data/bestiary/bossDialogue';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { featureTick, useFeature } from '../src/engine/combat/features';
import { skillOptions, teamSkillsFor, weaponArtsFor } from '../src/engine/combat/skills';
import { talk, talkOptions } from '../src/engine/combat/talk';
import { perform, startBattle } from '../src/engine/combat/turns';
import { applyDamage } from '../src/engine/combat/hits';
import { Rng } from '../src/engine/core/rng';
import { ELEMENTS } from '../src/engine/stats/types';
import { makeHero } from './helpers';

function fight(enemyId: string, opts: { level?: number; classId?: string; hp?: number; partner?: string; features?: ('barrel' | 'chandelier' | 'holy' | 'lava')[]; opening?: 'ambush' | 'preemptive'; purse?: number; seed?: number; cha?: number } = {}) {
  const char = makeHero({ classId: opts.classId ?? 'warrior' });
  char.level = opts.level ?? 15;
  if (opts.cha) char.allocated.cha = opts.cha;
  const hero = createHero(char, 'hero');
  const party = [hero];
  if (opts.partner) {
    const mate = createHero(makeHero({ classId: opts.partner }), 'companion:ilyra');
    mate.kind = 'companion';
    party.push(mate);
  }
  const foe = createEnemy(content.enemies.get(enemyId), 'foe', opts.level ?? 15);
  if (opts.hp !== undefined) foe.hp = Math.max(1, Math.round(foe.maxHp * opts.hp));
  const b = new Battle({ party, enemies: [foe], rng: new Rng(opts.seed ?? 5), encounterId: 't', canFlee: true, features: opts.features, purse: opts.purse, opening: opts.opening });
  const start = startBattle(b);
  hero.weaponTypes = ['sword'];
  return { b, hero, foe, char, start };
}

describe('Earth and statuses', () => {
  it('is the tenth element, with its own damage and resist', () => {
    expect(ELEMENTS).toHaveLength(10);
    expect(content.stats.has('earthDamage')).toBe(true);
    expect(content.stats.has('earthResist')).toBe(true);
    expect(content.enemies.get('bone-golem' in {} ? 'x' : content.enemies.all().find((e) => e.family === 'golem')!.id).resists?.earth).toBe(40);
  });

  it('adds nine statuses with real effects', () => {
    for (const id of ['sleep', 'confuse', 'petrify', 'doom', 'entangle', 'mired', 'marked', 'inspired', 'earthbound']) expect(content.statuses.has(id), id).toBe(true);
    expect(content.statuses.get('sleep').breakOnDamage).toBe(true);
    expect(content.statuses.get('petrify').skipTurn).toBe(true);
  });
});

describe('Weapon Arts', () => {
  it('has two for every weapon type', () => {
    for (const t of content.weaponTypes.all()) expect(content.skills.filter((s) => s.weaponArt === t.id), t.id).toHaveLength(2);
  });

  it('are offered to a wielder and can be used', () => {
    const { b, hero, foe } = fight('goblin-cutthroat');
    const arts = weaponArtsFor(b, hero);
    expect(arts.length).toBeGreaterThanOrEqual(2);
    hero.mp = 999;
    b.current = hero;
    const art = arts.find((s) => s.targeting === 'enemy') ?? arts[0]!;
    const before = foe.hp;
    const r = perform(b, { kind: 'skill', actorId: 'hero', skillId: art.id, targetId: foe.id });
    expect(r.ok).toBe(true);
    expect(foe.hp).toBeLessThan(before);
    expect(skillOptions(b, hero).some((o) => o.skill.weaponArt)).toBe(true);
  });

  it('team attacks can really be performed', () => {
    const { b, hero, foe } = fight('goblin-cutthroat', { partner: 'mage' });
    expect(teamSkillsFor(b, hero).length).toBeGreaterThan(0);
    b.current = hero;
    const team = teamSkillsFor(b, hero)[0]!;
    expect(perform(b, { kind: 'skill', actorId: 'hero', skillId: team.id, targetId: team.targeting === 'enemy' ? foe.id : undefined }).ok).toBe(true);
  });
});

describe('Talk', () => {
  it('offers persuasion and bribes to the talkable and nothing to the dead', () => {
    const { b, hero, foe } = fight('goblin-cutthroat');
    expect(talkOptions(b, hero, foe).map((o) => o.approach)).toContain('persuade');
    const dead = fight('skeleton-soldier');
    expect(talkOptions(dead.b, dead.hero, dead.foe)).toHaveLength(0);
  });

  it('a bribe costs gold and sends the foe away without a kill', () => {
    const { b, hero, foe } = fight('goblin-cutthroat', { purse: 1000, seed: 3 });
    b.current = hero;
    const cost = talkOptions(b, hero, foe).find((o) => o.approach === 'bribe')!.cost!;
    const poor = fight('goblin-cutthroat', { purse: 0 });
    expect(talk(poor.b, poor.hero, poor.foe, 'bribe').ok).toBe(false);
    let done = false;
    for (let seed = 1; seed < 20 && !done; seed++) {
      const f = fight('goblin-cutthroat', { purse: 1000, seed });
      talk(f.b, f.hero, f.foe, 'bribe');
      if (f.foe.departed) {
        expect(f.b.tally.spent).toBe(cost);
        expect(f.b.tally.kills).toHaveLength(0);
        expect(f.b.outcome).toBe('victory');
        done = true;
      }
    }
    expect(done).toBe(true);
  });

  it('a beast can be recruited and fights on your side', () => {
    let won = false;
    for (let seed = 1; seed < 80 && !won; seed++) {
      const f = fight('dire-wolf', { seed, hp: 0.3, cha: 60 });
      if (talkOptions(f.b, f.hero, f.foe).some((o) => o.approach === 'recruit')) {
        talk(f.b, f.hero, f.foe, 'recruit');
        if (f.foe.recruited) {
          expect(f.foe.side).toBe('party');
          won = true;
        }
      }
    }
    expect(won).toBe(true);
  });

  it('a nearly beaten boss can be spared, but not a story boss', () => {
    const goblinKing = fight('goblin-king', { hp: 0.2 });
    expect(talkOptions(goblinKing.b, goblinKing.hero, goblinKing.foe).map((o) => o.approach)).toEqual(['spare']);
    talk(goblinKing.b, goblinKing.hero, goblinKing.foe, 'spare');
    expect(goblinKing.b.tally.spared).toContain('goblin-king');
    expect(goblinKing.b.outcome).toBe('victory');
    const healthy = fight('goblin-king', { hp: 0.9 });
    expect(talkOptions(healthy.b, healthy.hero, healthy.foe)).toHaveLength(0);
    const nameless = fight('the-nameless-one', { hp: 0.1, level: 60 });
    expect(talkOptions(nameless.b, nameless.hero, nameless.foe)).toHaveLength(0);
  });
});

describe('room features and openings', () => {
  it('a barrel burns every enemy once', () => {
    const { b, hero, foe } = fight('goblin-cutthroat', { features: ['barrel'] });
    const before = foe.hp;
    expect(useFeature(b, hero, 'feature-1').ok).toBe(true);
    expect(foe.hp).toBeLessThan(before);
    expect(useFeature(b, hero, 'feature-1').ok).toBe(false);
  });

  it('holy ground heals the party and lava scorches the front rank', () => {
    const holy = fight('goblin-cutthroat', { features: ['holy'] });
    holy.hero.hp = Math.round(holy.hero.maxHp / 2);
    const hp = holy.hero.hp;
    featureTick(holy.b, holy.hero);
    expect(holy.hero.hp).toBeGreaterThan(hp);
    const lava = fight('goblin-cutthroat', { features: ['lava'] });
    lava.foe.row = 'front';
    const foeHp = lava.foe.hp;
    featureTick(lava.b, lava.foe);
    expect(lava.foe.hp).toBeLessThan(foeHp);
  });

  it('an ambush delays the party and a preemptive strike delays the enemy', () => {
    const calm = fight('goblin-cutthroat', { seed: 9 });
    const ambush = fight('goblin-cutthroat', { seed: 9, opening: 'ambush' });
    const strike = fight('goblin-cutthroat', { seed: 9, opening: 'preemptive' });
    expect(ambush.hero.nextAt).toBeGreaterThan(calm.hero.nextAt);
    expect(strike.foe.nextAt).toBeGreaterThan(calm.foe.nextAt);
  });
});

describe('boss dialogue', () => {
  it('has lines before, during and after every boss fight', () => {
    const bosses = content.enemies.all().filter((e) => e.tier === 'boss' || e.tier === 'worldBoss');
    for (const e of bosses) expect(BOSS_LINES[e.id], e.id).toHaveLength(3);
    for (const d of content.dungeons.all()) expect(BOSS_LINES[d.boss], d.boss).toBeDefined();
  });

  it('speaks them in the log', () => {
    const { b, foe, start } = fight('bone-lord', { level: 20 });
    expect(start.some((e) => e.type === 'log' && e.text.includes('Another living thing'))).toBe(true);
    b.current = undefined;
    applyDamage(b, b.alive('party')[0]!, foe, foe.maxHp, { element: 'physical', crit: false });
  });
});
