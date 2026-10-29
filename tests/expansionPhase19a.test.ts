import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { WORLD_AFFIXES } from '../src/data/ngAffixes';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { remixFor, worldAffixModifiers } from '../src/engine/ngplus/remix';
import { startNgPlus, worldLevel } from '../src/engine/ngplus/ngplus';
import { evaluate } from '../src/engine/quests/conditions';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

function ngSession(tier = 1): GameSession {
  const s = GameSession.newGame(31, makeHero());
  s.grantXp(9_000_000, true);
  for (let t = 1; t <= tier; t++) {
    s.quests.reachEnding('freeblade');
    startNgPlus(s);
  }
  return s;
}

describe('the level cap and the world’s levels', () => {
  it('rises to 90, and the top of the world’s levels climbs with each tier', () => {
    const s = ngSession();
    expect(s.state.levelCap).toBe(90);
    expect(worldLevel(60, 1)).toBe(60 + 0);
    expect(worldLevel(1, 1)).toBe(60);
    const top = (n: number) => worldLevel(59, n);
    expect(top(1)).toBeLessThanOrEqual(80);
    expect(top(10)).toBeGreaterThanOrEqual(89);
    for (let n = 2; n <= 10; n++) expect(top(n)).toBeGreaterThanOrEqual(top(n - 1));
  });
});

describe('world affixes', () => {
  it('has 40+, each twisting enemies or the party', () => {
    expect(WORLD_AFFIXES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WORLD_AFFIXES.map((a) => a.id)).size).toBe(WORLD_AFFIXES.length);
    for (const a of WORLD_AFFIXES) expect((a.enemy?.length ?? 0) + (a.party?.length ?? 0), a.id).toBeGreaterThan(0);
  });

  it('two join each tier, and none repeat', () => {
    const s = ngSession(3);
    expect(s.state.ngAffixes).toHaveLength(6);
    expect(new Set(s.state.ngAffixes).size).toBe(6);
    expect(s.state.flags['ng-tier']).toBe(3);
  });

  it('change the fights: enemy modifiers reach the enemies', () => {
    const hero = makeHero();
    const enc = content.encounters.find('q-zealots') ?? content.encounters.all()[0]!;
    const plain = createEncounterBattle(hero, enc, { rng: GameSession.newGame(1, makeHero()).rng, ngPlus: 1 });
    const twisted = createEncounterBattle(hero, enc, { rng: GameSession.newGame(1, makeHero()).rng, ngPlus: 1, ngAffixes: ['fat-of-the-land'] });
    expect(worldAffixModifiers(['fat-of-the-land']).enemy).toHaveLength(1);
    expect(twisted.combatants.find((c) => c.kind === 'enemy')!.maxHp).toBeGreaterThan(plain.combatants.find((c) => c.kind === 'enemy')!.maxHp);
  });
});

describe('boss remixes', () => {
  it('none at NG+1, one twist from NG+2, two from NG+5, three from NG+8; stable for a boss', () => {
    expect(remixFor('seryth', 1)).toHaveLength(0);
    expect(remixFor('seryth', 2)).toHaveLength(1);
    expect(remixFor('seryth', 5)).toHaveLength(2);
    expect(remixFor('seryth', 9)).toHaveLength(3);
    expect(remixFor('seryth', 4)).toEqual(remixFor('seryth', 3));
    for (const id of remixFor('seryth', 9)) expect(content.eliteAffixes.has(id), id).toBe(true);
  });
});

describe('Twilight of the Gods in eight chapters', () => {
  const chapters = ['twilight-1', 'twilight-2', 'twilight-3', 'twilight-4', 'twilight-5a', 'twilight-5b-godslayer', 'twilight-5c', 'twilight-5'];

  it('has the three new chapters, a chapter for each path, and the finale after them', () => {
    for (const id of chapters) expect(content.quests.has(id), id).toBe(true);
    for (const p of ['godslayer', 'ascension', 'defender']) expect(content.quests.has(`twilight-5b-${p}`), p).toBe(true);
    expect(JSON.stringify(content.quests.get('twilight-5').requires)).toContain('twilight-5c');
    expect(content.quests.get('twilight-5b-godslayer').stages.filter((s) => s.id.startsWith('slay-'))).toHaveLength(6);
  });

  it('the Defender door needs a second god', () => {
    const s = ngSession();
    expect(evaluate(s.state, { kind: 'defender' })).toBe(false);
    s.player.devotion.defender = 'mirrin';
    expect(evaluate(s.state, { kind: 'defender' })).toBe(true);
  });

  it('each path has its ending, and the true ending waits for all three', () => {
    const end = content.dialogues.get('d-tw5-end').nodes.start!;
    const offered = (s: GameSession) => (end.choices ?? []).filter((c) => !c.cond || evaluate(s.state, c.cond)).flatMap((c) => c.actions ?? []).filter((a) => a.kind === 'ending').map((a) => (a as { ending: string }).ending);
    for (const [p, ending] of [['godslayer', 'twilight-godslayer'], ['ascension', 'twilight-ascension'], ['defender', 'twilight-defender']] as const) {
      const s = ngSession();
      s.state.flags['tw-path'] = p;
      expect(offered(s)).toContain(ending);
      expect(offered(s)).not.toContain('twilight-true');
    }
    const heretic = ngSession();
    heretic.state.flags['tw-path'] = 'ascension';
    heretic.state.flags['twilight-heretic'] = true;
    expect(offered(heretic)).toContain('twilight-bargain');
    expect(offered(heretic)).not.toContain('twilight-ascension');
    const all3 = ngSession();
    all3.state.flags['legacy:path-godslayer'] = true;
    all3.state.flags['legacy:path-ascension'] = true;
    all3.state.flags['tw-path'] = 'defender';
    expect(offered(all3)).toContain('twilight-true');
    const none = ngSession();
    expect(offered(none)).toContain('twilight-dawn');
    for (const id of ['twilight-godslayer', 'twilight-ascension', 'twilight-defender', 'twilight-bargain', 'twilight-true']) expect(content.endings.has(id), id).toBe(true);
  });

  it('every tier of New Game+ has an echo of its own', () => {
    for (let t = 1; t <= 10; t++) expect(content.quests.has(`ng-echo-${t}`), String(t)).toBe(true);
    const s = ngSession(2);
    expect(s.state.quests.active['ng-echo-2']).toBeDefined();
    expect(s.state.quests.active['ng-echo-1']).toBeUndefined();
  });
});
