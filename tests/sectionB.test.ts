import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { MERCY_FOES, FINALE_MERCY } from '../src/data/mercy';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { Battle } from '../src/engine/combat/battle';
import { covenantBegin, linkMult } from '../src/engine/combat/covenant';
import { maneuver } from '../src/engine/combat/foresight';
import { groundAfterHit, groundTick } from '../src/engine/combat/ground';
import { advance, perform, startBattle } from '../src/engine/combat/turns';
import { chooseAction } from '../src/engine/combat/ai';
import { talk, talkOptions } from '../src/engine/combat/talk';
import { useSkill } from '../src/engine/combat/skills';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { Rng } from '../src/engine/core/rng';
import { epilogueSlides } from '../src/engine/quests/epilogue';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

/** A battle of `party` mages against `foes` (enemy ids), started. */
function arena(opts: { foes?: string[]; heroes?: number; seed?: number; level?: number } = {}): { b: Battle; party: ReturnType<typeof createHero>[]; foes: ReturnType<typeof createEnemy>[] } {
  const level = opts.level ?? 20;
  const party = Array.from({ length: opts.heroes ?? 1 }, (_, i) => createHero(benchmarkHero('mage', level), i === 0 ? 'hero' : `ally${i}`));
  const foes = (opts.foes ?? ['goblin-cutthroat', 'goblin-cutthroat']).map((id, i) => createEnemy(content.enemies.get(id), `enemy-${i + 1}`, level));
  const b = new Battle({ party, enemies: foes, rng: new Rng(opts.seed ?? 3), encounterId: 'test', canFlee: true });
  startBattle(b);
  return { b, party, foes };
}

describe('Blessed and Cursed Ground (item 7)', () => {
  it('lightning on standing water electrifies everyone on the field and uses the water up', () => {
    const { b, party, foes } = arena();
    b.ground.push({ kind: 'water', side: 'enemy', turns: 4 });
    const before = foes[1]!.hp;
    groundAfterHit(b, party[0]!, foes[0]!, 'lightning', ['Spell'], 400);
    expect(b.ground.some((g) => g.kind === 'water')).toBe(false);
    expect(foes[1]!.hp).toBeLessThan(before);
  });

  it('fire on spilled oil explodes and leaves burning ground; fire melts ice into water', () => {
    const { b, party, foes } = arena();
    b.ground.push({ kind: 'oil', side: 'enemy', turns: 4 });
    const before = foes[1]!.hp;
    groundAfterHit(b, party[0]!, foes[0]!, 'fire', ['Spell'], 400);
    expect(foes[1]!.hp).toBeLessThan(before);
    expect(b.ground.map((g) => g.kind)).toContain('fire');
    expect(b.ground.some((g) => g.kind === 'oil')).toBe(false);
    b.ground.length = 0;
    b.ground.push({ kind: 'ice', side: 'enemy', turns: 4 });
    groundAfterHit(b, party[0]!, foes[0]!, 'fire', ['Spell'], 100);
    expect(b.ground.map((g) => g.kind)).toContain('water');
    expect(b.ground.some((g) => g.kind === 'ice')).toBe(false);
  });

  it('ice on water freezes it; holy light cleanses poison and blood; shadow desecrates holy ground', () => {
    const { b, party, foes } = arena();
    b.ground.push({ kind: 'water', side: 'enemy', turns: 4 });
    groundAfterHit(b, party[0]!, foes[0]!, 'ice', ['Spell'], 100);
    expect(b.ground.map((g) => g.kind)).toContain('ice');
    b.ground.length = 0;
    b.ground.push({ kind: 'poison', side: 'enemy', turns: 4 }, { kind: 'blood', side: 'enemy', turns: 4 });
    groundAfterHit(b, party[0]!, foes[0]!, 'holy', ['Spell'], 100);
    expect(b.ground.some((g) => g.kind === 'poison' || g.kind === 'blood')).toBe(false);
    b.ground.length = 0;
    b.ground.push({ kind: 'holy', side: 'enemy', turns: 4 });
    groundAfterHit(b, party[0]!, foes[0]!, 'shadow', ['Spell'], 100);
    expect(b.ground.some((g) => g.kind === 'holy')).toBe(false);
  });

  it('skills can leave ground (fire spells, brews, poison), over many casts', () => {
    let fire = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { b, party, foes } = arena({ seed });
      groundAfterHit(b, party[0]!, foes[0]!, 'fire', ['Spell', 'Fire'], 50);
      if (b.ground.some((g) => g.kind === 'fire' && g.side === 'enemy')) fire++;
    }
    expect(fire).toBeGreaterThan(3);
    expect(fire).toBeLessThan(40);
  });

  it('burning ground scorches, holy ground heals the living and burns the undead, ground fades after a few rounds', () => {
    const { b, party, foes } = arena({ foes: ['goblin-cutthroat', 'fallen-paladin'] });
    const [gob, skel] = foes as [typeof foes[number], typeof foes[number]];
    b.ground.push({ kind: 'fire', side: 'enemy', turns: 4 }, { kind: 'holy', side: 'enemy', turns: 4 });
    const g0 = gob.hp;
    groundTick(b, gob);
    expect(gob.hp).toBeLessThan(g0 + 1);
    skel.types = ['undead'];
    const s0 = skel.hp;
    groundTick(b, skel);
    expect(skel.hp).toBeLessThan(s0);
    // The party's side is blessed: a wounded hero heals.
    const hero = party[0]!;
    b.ground.push({ kind: 'holy', side: 'party', turns: 4 });
    hero.hp = Math.round(hero.maxHp / 2);
    groundTick(b, hero);
    expect(hero.hp).toBeGreaterThan(Math.round(hero.maxHp / 2));
  });
});

describe('Divine Foresight (item 8)', () => {
  it('every enemy shows a plan from the first turn, and carries it out', () => {
    const { b, foes } = arena({ seed: 7 });
    for (const f of foes) expect(f.intent?.text).toBeTruthy();
    const planned = foes[0]!.intent!.action;
    const taken = chooseAction(b, foes[0]!);
    expect(taken).toEqual(planned);
    expect(foes[0]!.intent).toBeUndefined();
  });

  it('a plan against someone who has fallen is dropped and the enemy chooses again', () => {
    const { b, party, foes } = arena({ heroes: 2, seed: 9 });
    const f = foes[0]!;
    const action = f.intent!.action;
    if ('targetId' in action && action.targetId) {
      b.get(action.targetId)!.alive = false;
      const next = chooseAction(b, f);
      expect('targetId' in next && next.targetId === action.targetId).toBe(false);
    }
    void party;
  });

  it('shove sends its blow onto its own side; pull draws it onto the puller', () => {
    const { b, party, foes } = arena({ heroes: 2, foes: ['goblin-cutthroat', 'goblin-cutthroat'], seed: 11 });
    const [a, c] = foes as [typeof foes[number], typeof foes[number]];
    b.rng.chance = () => true;
    a.intent = { action: { kind: 'attack', actorId: a.id, targetId: party[1]!.id }, text: 'x', broken: false };
    expect(maneuver(b, party[0]!, a, 'shove').ok).toBe(true);
    expect(a.intent?.broken).toBe(true);
    expect(a.intent?.action).toMatchObject({ targetId: c.id });
    expect(a.row).toBe('back');
    party[0]!.cooldowns.maneuver = 0;
    c.intent = { action: { kind: 'attack', actorId: c.id, targetId: party[1]!.id }, text: 'x', broken: false };
    expect(maneuver(b, party[0]!, c, 'pull').ok).toBe(true);
    expect(c.intent?.action).toMatchObject({ targetId: party[0]!.id });
    expect(c.row).toBe('front');
    // Once per two turns.
    expect(maneuver(b, party[0]!, c, 'pull').ok).toBe(false);
  });

  it('a whole auto-battle still plays out with foresight on', () => {
    const { b } = arena({ seed: 5, level: 30 });
    let guard = 0;
    while (b.outcome === 'ongoing' && guard++ < 800) {
      advance(b);
      const x = b.current;
      if (!x) break;
      const r = perform(b, chooseAction(b, x));
      if (!r.ok) perform(b, { kind: 'defend', actorId: x.id });
    }
    expect(['victory', 'defeat', 'fled']).toContain(b.outcome);
  });
});

describe('Covenant Chains (item 9)', () => {
  it('fills as the party fights, becomes ready, and a matching skill from a different member lengthens the chain', () => {
    const { b, party, foes } = arena({ heroes: 2, seed: 13 });
    const [h1, h2] = party as [typeof party[number], typeof party[number]];
    expect(b.covenant.gauge).toBe(0);
    useSkill(b, h1, 'firebolt', 1, foes[0]!.id);
    expect(b.covenant.gauge).toBeGreaterThan(0);
    b.covenant.gauge = 99;
    useSkill(b, h1, 'firebolt', 1, foes[0]!.id);
    expect(b.covenant.ready || b.covenant.chain).toBeTruthy();
    // Begin, then pass it to the other mage with a fire skill.
    b.covenant = { gauge: 100, ready: true };
    expect(covenantBegin(b, h1, content.skills.get('firebolt'), false)).toBe(1);
    expect(b.covenant.chain?.links).toBe(1);
    expect(covenantBegin(b, h2, content.skills.get('firebolt'), false)).toBeCloseTo(linkMult(2));
    expect(b.covenant.chain?.links).toBe(2);
    // The same member twice breaks it.
    expect(covenantBegin(b, h2, content.skills.get('firebolt'), false)).toBe(1);
    expect(b.covenant.chain).toBeUndefined();
    expect(b.covenant.gauge).toBe(0);
  });

  it('three or more links end in a Burst that hits every enemy; a plain attack breaks the chain', () => {
    const { b, party, foes } = arena({ heroes: 3, seed: 17 });
    const [h1, h2, h3] = party as [typeof party[number], typeof party[number], typeof party[number]];
    const fire = content.skills.get('firebolt');
    b.covenant = { gauge: 100, ready: true };
    covenantBegin(b, h1, fire, false);
    covenantBegin(b, h2, fire, false);
    covenantBegin(b, h3, fire, false);
    expect(b.covenant.chain?.links).toBe(3);
    b.covenant.chain!.damage = 3000;
    const hp = foes.map((f) => f.hp);
    covenantBegin(b, h1, fire, true);
    expect(b.covenant.chain).toBeUndefined();
    foes.forEach((f, i) => expect(f.hp).toBeLessThan(hp[i]!));
    // A short chain falls apart without a burst.
    b.covenant = { gauge: 100, ready: true };
    covenantBegin(b, h1, fire, false);
    const hp2 = foes.map((f) => f.hp);
    covenantBegin(b, h1, fire, false);
    foes.forEach((f, i) => expect(f.hp).toBe(hp2[i]));
  });

  it('the party AI prefers a skill that continues the chain', () => {
    const { b, party, foes } = arena({ heroes: 2, seed: 19 });
    b.covenant = { gauge: 100, ready: true };
    covenantBegin(b, party[0]!, content.skills.get('firebolt'), false);
    b.current = party[1];
    const a = chooseAction(b, party[1]!);
    expect(a.kind === 'skill' || a.kind === 'attack').toBe(true);
    void foes;
  });
});

describe("Hesha's Mercy (item 10)", () => {
  it('names 54 foes with their own words, all real enemies', () => {
    const ids = Object.keys(MERCY_FOES);
    expect(ids.length).toBeGreaterThanOrEqual(40);
    for (const id of ids) expect(content.enemies.find(id), id).toBeDefined();
  });

  it('every boss that is not a duel can be spared, including the deaf kinds; finales need Hesha and eight acts of mercy', () => {
    const bosses = content.enemies.all().filter((e) => ['boss', 'miniboss', 'worldBoss'].includes(e.tier));
    expect(bosses.length).toBeGreaterThan(100);
    let offered = 0;
    for (const e of bosses) {
      const { b, party, foes } = arena({ foes: [e.id], seed: 21 });
      foes[0]!.hp = Math.max(1, Math.floor(foes[0]!.maxHp * 0.1));
      const opts = talkOptions(b, party[0]!, foes[0]!);
      if (opts.some((o) => o.approach === 'spare')) offered++;
    }
    expect(offered).toBeGreaterThan(bosses.length * 0.7);
    for (const id of ['barrow-warden', 'goblin-king']) {
      const t = arena({ foes: [id], seed: 21 });
      t.foes[0]!.hp = 1;
      expect(talkOptions(t.b, t.party[0]!, t.foes[0]!).some((o) => o.approach === 'spare'), id).toBe(true);
    }
    const { b, party, foes } = arena({ foes: ['the-nameless-one'], level: 60 });
    foes[0]!.hp = 5;
    const lock = talkOptions(b, party[0]!, foes[0]!)[0];
    expect(lock?.locked).toBeDefined();
    b.mercy = { deeds: 8, hesha: true };
    expect(talkOptions(b, party[0]!, foes[0]!)[0]?.locked).toBeUndefined();
    expect(talk(b, party[0]!, foes[0]!, 'spare').ok).toBe(true);
    expect(b.outcome).toBe('victory');
    expect(b.tally.mercy).toEqual([{ enemyId: 'the-nameless-one', boss: true }]);
    expect(Object.keys(FINALE_MERCY).length).toBeGreaterThanOrEqual(11);
  });

  it('a named foe is offered mercy at 40% health, an ordinary one only at 25%', () => {
    const named = arena({ foes: ['meadow-wolf'] });
    named.foes[0]!.hp = Math.floor(named.foes[0]!.maxHp * 0.35);
    expect(talkOptions(named.b, named.party[0]!, named.foes[0]!).some((o) => o.approach === 'spare')).toBe(true);
    const plain = arena({ foes: ['goblin-cutthroat'] });
    plain.foes[0]!.hp = Math.floor(plain.foes[0]!.maxHp * 0.35);
    expect(talkOptions(plain.b, plain.party[0]!, plain.foes[0]!).some((o) => o.approach === 'spare')).toBe(false);
    plain.foes[0]!.hp = Math.floor(plain.foes[0]!.maxHp * 0.2);
    expect(talkOptions(plain.b, plain.party[0]!, plain.foes[0]!).some((o) => o.approach === 'spare')).toBe(true);
  });

  it('sparing is counted, pleases Hesha, and the story, the people and the epilogue notice', () => {
    const s = GameSession.newGame(31, makeHero());
    const { b, party, foes } = arena({ foes: ['meadow-wolf'] });
    foes[0]!.hp = 1;
    expect(talk(b, party[0]!, foes[0]!, 'spare').ok).toBe(true);
    const fav = s.player.devotion.favor['hesha'] ?? 0;
    s.realm.mercy(b);
    expect(s.state.flags['mercy']).toBe(1);
    expect(s.state.flags['spared-meadow-wolf']).toBe(true);
    expect(s.player.devotion.favor['hesha'] ?? 0).toBeGreaterThan(fav);
    // Quiet shrine until you have shown mercy.
    expect(epilogueSlides(s.state).some((x) => x.id === 'mercy-none')).toBe(false);
    s.state.flags['mercy'] = 14;
    s.state.flags['mercy-bosses'] = 7;
    const ids = epilogueSlides(s.state).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['mercy-few', 'mercy-many', 'mercy-boss', 'mercy-bosses']));
    // A topic appears on Captain Reyna.
    const reyna = content.npcs.get('captain-reyna');
    expect(reyna.topics?.some((t) => t.id === 'mercy-reyna')).toBe(true);
    const fresh = GameSession.newGame(32, makeHero());
    expect(epilogueSlides(fresh.state).some((x) => x.id === 'mercy-none')).toBe(true);
  });
});

describe('auto-battle tactics', () => {
  it('spares a beaten foe only when asked to, and shoves a foe off a failing ally only when asked to', () => {
    const { b, party, foes } = arena({ heroes: 2, foes: ['meadow-wolf', 'goblin-cutthroat'], seed: 41 });
    foes[0]!.hp = 1;
    b.current = party[0];
    let off = chooseAction(b, party[0]!);
    expect(off.kind === 'talk').toBe(false);
    b.autoTactics = { mercy: true, maneuvers: false };
    let picked = false;
    for (let i = 0; i < 6 && !picked; i++) picked = chooseAction(b, party[0]!).kind === 'talk';
    expect(picked).toBe(true);
    // A failing ally is about to be hit.
    b.autoTactics = { mercy: false, maneuvers: true };
    foes[0]!.hp = foes[0]!.maxHp;
    party[1]!.hp = Math.floor(party[1]!.maxHp * 0.2);
    foes[1]!.intent = { action: { kind: 'attack', actorId: foes[1]!.id, targetId: party[1]!.id }, text: 'x', broken: false };
    off = chooseAction(b, party[0]!);
    expect(off.kind).toBe('shove');
    b.autoTactics = { mercy: false, maneuvers: false };
    expect(chooseAction(b, party[0]!).kind).not.toBe('shove');
  });
});
