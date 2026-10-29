import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOSS_LINES } from '../src/data/bestiary/bossDialogue';
import { GameSession } from '../src/engine/state/gameState';
import { mechanicStep, sightRadius } from '../src/engine/world/mechanics';
import { generateArea, generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { Rng } from '../src/engine/core/rng';
import { makeHero } from './helpers';

const NEW_ZONES = ['gloamwood', 'saltglass', 'merrowdeep', 'clockwork-foundry'];

describe('four more new regions', () => {
  it('are off the road, each with a town, three dungeons, a world boss and a mechanic of its own', () => {
    for (const id of NEW_ZONES) {
      const z = content.zones.get(id);
      expect(z.off, id).toBe(true);
      expect(content.towns.has(z.town as string), id).toBe(true);
      expect(z.dungeons, id).toHaveLength(3);
      expect(content.enemies.get(z.worldBoss).tier, id).toBe('worldBoss');
      expect(z.mechanic, id).toBeDefined();
      expect(content.areas.filter((a) => a.zone === id), id).toHaveLength(4);
      const map = mapFor(id);
      expect(map.entities.some((e) => e.kind === 'exit' && e.arrive === 'pass'), id).toBe(true);
      expect(map.entities.some((e) => e.kind === 'exit' && (e.arrive === 'west' || e.arrive === 'east')), id).toBe(false);
      for (const a of content.areas.filter((x) => x.zone === id)) expect(generateArea(a).entities.length, a.id).toBeGreaterThan(0);
    }
    expect(content.zones.filter((z) => !z.off)).toHaveLength(8);
    expect(content.zones.size).toBe(16);
  });

  it('adds 4 towns with 8 scheduled people each, 12 dungeons and 4 rares per region', () => {
    expect(content.towns.size).toBe(13);
    expect(content.dungeons.size).toBe(35);
    for (const id of NEW_ZONES) {
      const z = content.zones.get(id);
      const people = content.npcs.filter((n) => n.town === z.town && n.place === 'people');
      expect(people.length, id).toBeGreaterThanOrEqual(8);
      expect(people.every((n) => n.schedule), id).toBe(true);
      expect(content.towns.get(z.town as string).minigame, id).toBeDefined();
      expect(z.roaming.filter((g) => g.enemies.length === 1 && g.enemies[0]?.tier === 'elite'), id).toHaveLength(4);
      expect(content.quests.has(`region-${id}`), id).toBe(true);
    }
  });

  it('has a line for every boss and walkable dungeons with a checkpoint', () => {
    for (const e of content.enemies.all().filter((x) => x.tier === 'boss' || x.tier === 'worldBoss')) expect(BOSS_LINES[e.id], e.id).toBeDefined();
    for (const id of NEW_ZONES) for (const dId of content.zones.get(id).dungeons) {
      const d = content.dungeons.get(dId);
      expect(d.gimmick, dId).toBeDefined();
      expect(generateDungeon(d).entities.some((e) => e.id === 'checkpoint'), dId).toBe(true);
    }
  });
});

describe('the new regional rules', () => {
  it('Gloom darkens, the Mirage turns you around, Pressure hurts, steam bursts', () => {
    const s = GameSession.newGame(4, makeHero());
    const rng = new Rng(7);
    const gloam = content.zones.get('gloamwood');
    for (let i = 0; i < 400; i++) mechanicStep(s.player, gloam, true, false, rng);
    expect(s.player.world.meter?.id).toBe('gloom');
    expect(sightRadius(s.player, gloam, 6)).toBe(2);
    s.player.world.meter = undefined;
    const mirage = content.zones.get('saltglass');
    let lost = false;
    for (let i = 0; i < 400 && !lost; i++) lost = !!mechanicStep(s.player, mirage, false, false, rng).lost;
    expect(lost).toBe(true);
    s.player.world.meter = undefined;
    const deep = content.zones.get('merrowdeep');
    let harm = 0;
    for (let i = 0; i < 400; i++) harm += mechanicStep(s.player, deep, false, false, rng).harm ?? 0;
    expect(harm).toBeGreaterThan(0);
    const foundry = content.zones.get('clockwork-foundry');
    let bursts = 0;
    for (let i = 0; i < 400; i++) if (mechanicStep(s.player, foundry, false, true, rng).message) bursts++;
    expect(bursts).toBeGreaterThan(0);
    for (const item of ['glow-lantern', 'glass-lens', 'air-pearl']) expect(content.items.has(item), item).toBe(true);
  });
});
