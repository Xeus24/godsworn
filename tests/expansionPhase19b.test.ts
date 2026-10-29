import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOSS_LINES } from '../src/data/bestiary/bossDialogue';
import { GameSession } from '../src/engine/state/gameState';
import { Rng } from '../src/engine/core/rng';
import { mechanicStep } from '../src/engine/world/mechanics';
import { generateArea, generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { startNgPlus } from '../src/engine/ngplus/ngplus';
import { makeHero } from './helpers';

const NEW = ['celestial-realm', 'the-abyss', 'shattered-timeline', 'drowned-kingdom', 'clockwork-city', 'the-godforge'];

describe('the six New Game+ regions', () => {
  it('are off the road, each with two dungeons, a world boss, four side maps, three rares and a rule of its own', () => {
    for (const id of NEW) {
      const z = content.zones.get(id);
      expect(z.off, id).toBe(true);
      expect(z.ngPlus, id).toBeGreaterThanOrEqual(1);
      expect(z.dungeons, id).toHaveLength(2);
      expect(content.enemies.get(z.worldBoss).tier, id).toBe('worldBoss');
      expect(z.mechanic, id).toBeDefined();
      expect(content.areas.filter((a) => a.zone === id), id).toHaveLength(4);
      expect(z.roaming.filter((g) => g.enemies.length === 1 && g.enemies[0]?.tier === 'elite'), id).toHaveLength(3);
      expect(content.quests.has(`region-${id}`), id).toBe(true);
      expect(mapFor(id).entities.some((e) => e.kind === 'exit' && e.arrive === 'pass'), id).toBe(true);
      for (const a of content.areas.filter((x) => x.zone === id)) expect(generateArea(a).entities.length, a.id).toBeGreaterThan(0);
      for (const d of z.dungeons) expect(generateDungeon(content.dungeons.get(d)).entities.some((e) => e.id === 'checkpoint'), d).toBe(true);
    }
    expect(content.zones.size).toBe(26);
  });

  it('open at NG+1 (two), NG+2 (two) and NG+3 (two)', () => {
    const tiers = NEW.map((id) => content.zones.get(id).ngPlus);
    expect(tiers).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('every boss has lines, and the enemies are real', () => {
    for (const e of content.enemies.all().filter((x) => x.tier === 'boss' || x.tier === 'worldBoss')) expect(BOSS_LINES[e.id], e.id).toBeDefined();
    expect(content.enemies.size).toBeGreaterThan(400);
  });

  it('the passes in are shut before their tier and open after', () => {
    const s = GameSession.newGame(33, makeHero());
    s.grantXp(9_000_000, true);
    const pass = mapFor('skyreach').entities.find((e) => e.kind === 'exit' && e.ref === 'celestial-realm')!;
    expect(pass).toBeDefined();
    s.state.world.position = { map: 'skyreach', x: pass.x, y: pass.y };
    const shut = s.world.interact(pass) as { message?: string };
    expect(shut.message).toContain('shut');
    expect(s.state.world.position.map).toBe('skyreach');
    s.quests.reachEnding('freeblade');
    startNgPlus(s);
    s.state.world.position = { map: 'skyreach', x: pass.x, y: pass.y };
    s.world.interact(pass);
    expect(s.state.world.position.map).toBe('celestial-realm');
  });

  it('each region’s rule bites', () => {
    const s = GameSession.newGame(34, makeHero());
    const rng = new Rng(3);
    for (const [id, expectHarm] of [['celestial-realm', true], ['the-godforge', true], ['the-abyss', true]] as const) {
      s.player.world.meter = undefined;
      let harm = 0;
      for (let i = 0; i < 500; i++) harm += mechanicStep(s.player, content.zones.get(id), false, false, rng).harm ?? 0;
      expect(harm > 0, id).toBe(expectHarm);
    }
    s.player.world.meter = undefined;
    let lost = false;
    for (let i = 0; i < 500 && !lost; i++) lost = !!mechanicStep(s.player, content.zones.get('drowned-kingdom'), false, false, rng).lost;
    expect(lost).toBe(true);
    for (const id of ['shattered-timeline', 'clockwork-city']) {
      let n = 0;
      for (let i = 0; i < 500; i++) if (mechanicStep(s.player, content.zones.get(id), false, true, rng).message) n++;
      expect(n, id).toBeGreaterThan(0);
    }
    for (const item of ['veil-lens', 'dread-ward', 'undertow-charm', 'quench-oil']) expect(content.items.has(item), item).toBe(true);
  });
});
