import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOSS_LINES } from '../src/data/bestiary/bossDialogue';
import { GameSession } from '../src/engine/state/gameState';
import { Rng } from '../src/engine/core/rng';
import { mechanicStep } from '../src/engine/world/mechanics';
import { generateArea, generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { makeHero } from './helpers';

const NEW_ZONES = ['ashfold', 'hollow-barrows', 'shattered-isles', 'skyreach'];

describe('the last four new regions', () => {
  it('make twelve new regions, fifteen towns and forty-five dungeons', () => {
    expect(content.zones.size).toBe(20);
    expect(content.zones.filter((z) => !z.off)).toHaveLength(8);
    expect(content.towns.size).toBe(15);
    expect(content.dungeons.size).toBe(45);
  });

  it('each has a world boss, four side maps, four rares, passes and a questline', () => {
    for (const id of NEW_ZONES) {
      const z = content.zones.get(id);
      expect(z.off, id).toBe(true);
      expect(z.dungeons.length, id).toBeGreaterThanOrEqual(2);
      expect(content.enemies.get(z.worldBoss).tier, id).toBe('worldBoss');
      expect(z.mechanic, id).toBeDefined();
      expect(content.areas.filter((a) => a.zone === id), id).toHaveLength(4);
      expect(z.roaming.filter((g) => g.enemies.length === 1 && g.enemies[0]?.tier === 'elite'), id).toHaveLength(4);
      expect(content.quests.has(`region-${id}`), id).toBe(true);
      const map = mapFor(id);
      expect(map.entities.some((e) => e.kind === 'exit' && e.arrive === 'pass'), id).toBe(true);
      for (const a of content.areas.filter((x) => x.zone === id)) expect(generateArea(a).entities.length, a.id).toBeGreaterThan(0);
      for (const d of z.dungeons) expect(generateDungeon(content.dungeons.get(d)).entities.some((e) => e.id === 'checkpoint'), d).toBe(true);
    }
  });

  it('the two new towns have eight scheduled people and a minigame', () => {
    for (const t of ['ashfold', 'wrecksend']) {
      const people = content.npcs.filter((n) => n.town === t && n.place === 'people');
      expect(people.length, t).toBeGreaterThanOrEqual(8);
      expect(people.every((n) => n.schedule), t).toBe(true);
      expect(content.towns.get(t).minigame, t).toBeDefined();
    }
  });

  it('every boss has lines', () => {
    for (const e of content.enemies.all().filter((x) => x.tier === 'boss' || x.tier === 'worldBoss')) expect(BOSS_LINES[e.id], e.id).toBeDefined();
  });

  it('the new rules bite: fading, squalls and thin air', () => {
    const s = GameSession.newGame(4, makeHero());
    const rng = new Rng(11);
    let harm = 0;
    for (let i = 0; i < 400; i++) harm += mechanicStep(s.player, content.zones.get('hollow-barrows'), false, false, rng).harm ?? 0;
    expect(harm).toBeGreaterThan(0);
    s.player.world.meter = undefined;
    harm = 0;
    for (let i = 0; i < 400; i++) harm += mechanicStep(s.player, content.zones.get('skyreach'), false, false, rng).harm ?? 0;
    expect(harm).toBeGreaterThan(0);
    let squalls = 0;
    for (let i = 0; i < 400; i++) if (mechanicStep(s.player, content.zones.get('shattered-isles'), false, true, rng).message) squalls++;
    expect(squalls).toBeGreaterThan(0);
    for (const item of ['grave-candle', 'breath-tonic']) expect(content.items.has(item), item).toBe(true);
  });
});
