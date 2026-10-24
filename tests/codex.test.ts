import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BESTIARY } from '../src/data/bestiary/bestiary';
import { knowledgeLevel, killsByType, recordBattle, slayerModifiers, slayerRank } from '../src/engine/bestiary/bestiary';
import { characterModifiers } from '../src/engine/character/stats';
import { createEncounterBattle, runAutoBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(7, makeHero());

describe('bestiary', () => {
  it('learns more of an entry with every kill threshold', () => {
    const hero = makeHero();
    const wolf = content.enemies.get('dire-wolf');
    expect(knowledgeLevel(hero, wolf)).toBe(-1);
    recordBattle(hero, ['dire-wolf'], []);
    expect(knowledgeLevel(hero, wolf)).toBe(0);
    recordBattle(hero, [], ['dire-wolf']);
    expect(knowledgeLevel(hero, wolf)).toBe(1);
    hero.bestiary['dire-wolf'] = BESTIARY.knowledge[3] as number;
    expect(knowledgeLevel(hero, wolf)).toBe(4);
  });

  it('bosses teach faster', () => {
    const hero = makeHero();
    hero.bestiary['goblin-king'] = 1;
    expect(knowledgeLevel(hero, content.enemies.get('goblin-king'))).toBe(2);
  });

  it('Slayer ranks add damage against the creature type', () => {
    const hero = makeHero();
    hero.bestiary['dire-wolf'] = BESTIARY.slayerRanks[1] as number;
    expect(killsByType(hero).beast).toBe(BESTIARY.slayerRanks[1]);
    expect(slayerRank(killsByType(hero).beast ?? 0)).toBe(2);
    const mod = slayerModifiers(hero).find((m) => m.source === 'slayer:beast');
    expect(mod).toMatchObject({ stat: 'damageBonus', value: 2 * BESTIARY.slayerDamagePerRank, condition: { kind: 'targetType', enemyType: 'beast' } });
    expect(characterModifiers(hero).some((m) => m.source === 'slayer:beast')).toBe(true);
  });

  it('announces new knowledge and ranks', () => {
    const hero = makeHero();
    hero.bestiary['dire-wolf'] = (BESTIARY.slayerRanks[0] as number) - 1;
    const news = recordBattle(hero, ['dire-wolf'], ['dire-wolf']);
    expect(news.some((n) => n.startsWith('Slayer of Beasts, rank 1'))).toBe(true);
  });

  it('records every battle', () => {
    const s = newSession();
    const b = createEncounterBattle(benchmarkHero('warrior', 10), content.encounters.get('slime-puddle'), { rng: s.rng });
    runAutoBattle(b);
    settleBattle(s, b);
    const ids = b.combatants.flatMap((x) => (x.enemyId ? [x.enemyId] : []));
    for (const id of ids) expect(s.player.bestiary[id]).toBeGreaterThanOrEqual(b.outcome === 'victory' ? 1 : 0);
  });
});

describe('achievements', () => {
  it('are earned when their condition holds, once, with titles and gold', () => {
    const s = newSession();
    expect(s.achievements.earned('first-blood')).toBe(false);
    s.state.stats.battlesWon = 1;
    const got = s.achievements.check().map((a) => a.id);
    expect(got).toContain('first-blood');
    expect(s.achievements.earned('first-blood')).toBe(true);
    expect(s.achievements.check().map((a) => a.id)).not.toContain('first-blood');
    s.state.stats.battlesWon = 500;
    s.achievements.check();
    expect(s.player.devotion.titles).toContain('the Veteran');
    const gold = s.state.gold;
    for (const boss of ['bramblehorn', 'gnarlroot', 'abyssal-crab', 'sandworm', 'frost-wyrm', 'storm-roc', 'ember-matriarch', 'unwritten-herald']) s.player.bestiary[boss] = 1;
    s.achievements.check();
    expect(s.achievements.earned('world-boss-all')).toBe(true);
    expect(s.state.gold).toBeGreaterThan(gold);
  });

  it('are checked as the game changes', () => {
    const s = newSession();
    s.grantXp(1_000_000, true);
    expect(s.achievements.earned('level-10')).toBe(true);
  });

  it('can count each other', () => {
    const s = newSession();
    for (const a of content.achievements.all().slice(0, 25)) s.state.achievements[a.id] = 1;
    s.achievements.check();
    expect(s.achievements.earned('achievements-25')).toBe(true);
    expect(s.achievements.points()).toBeGreaterThan(0);
  });

  it('track lifetime stats from battles and gold', () => {
    const s = newSession();
    s.addGold(500, 'test');
    s.spendGold(200, 'test');
    expect(s.state.stats.goldEarned).toBeGreaterThanOrEqual(500);
    expect(s.state.stats.goldSpent).toBe(200);
    const b = createEncounterBattle(benchmarkHero('warrior', 30), content.encounters.get('q-mott'), { rng: s.rng, level: 6 });
    runAutoBattle(b);
    settleBattle(s, b);
    if (b.outcome === 'victory') expect(s.state.stats.bossesKilled).toBe(1);
  });
});

describe('titles', () => {
  it('show only earned titles', () => {
    const s = newSession();
    expect(s.achievements.setTitle('the Veteran').ok).toBe(false);
    s.player.devotion.titles.push('the Veteran');
    expect(s.achievements.setTitle('the Veteran').ok).toBe(true);
    expect(s.player.title).toBe('the Veteran');
    s.achievements.setTitle(undefined);
    expect(s.player.title).toBeUndefined();
  });
});
