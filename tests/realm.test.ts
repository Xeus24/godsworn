import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { Rng } from '../src/engine/core/rng';
import { fullName, hierarchy } from '../src/engine/realm/grudge';
import { deserialize, serialize } from '../src/engine/state/save';
import { GameSession } from '../src/engine/state/gameState';
import { groupEncounter } from '../src/engine/world/world';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(11, makeHero());
const wild = (zone: string, enemyId: string, level = 5) => groupEncounter({ weight: 1, enemies: [{ enemyId }] }, `wild:${zone}`, zone, level);
const firstEnemy = (zone: string): string => (content.zones.get(zone).encounters[0] as { enemies: { enemyId: string }[] }).enemies[0]!.enemyId;

describe('the Grudgebound', () => {
  it('names the foe that beat you, and the same foe grows another scar next time', () => {
    const s = session();
    const id = firstEnemy('meadowlands');
    const b = createEncounterBattle(s.player, wild('meadowlands', id), { rng: new Rng(1) });
    b.outcome = 'defeat';
    s.realm.afterBattle(b);
    const [g] = s.realm.grudgebound('meadowlands');
    expect(g).toBeDefined();
    expect(g!.cause).toBe('beat');
    expect(g!.scars).toBe(1);
    expect(g!.rank).toBe(1);
    expect(fullName(g!).length).toBeGreaterThan(5);
    // Fight it again (it leads a fight) and lose again.
    const lead = s.realm.decorate(wild('meadowlands', id), 'meadowlands');
    const again = lead.enemies[0]?.grudge ? lead : { ...wild('meadowlands', id), enemies: [{ enemyId: id, grudge: { id: g!.id, name: fullName(g!), threat: 30, levelBonus: 0, traits: [], line: 'x', rank: 1 } }] };
    const b2 = createEncounterBattle(s.player, again, { rng: new Rng(2) });
    expect(b2.combatants.find((x) => x.grudgeId === g!.id)?.name).toBe(fullName(g!));
    b2.outcome = 'defeat';
    s.realm.afterBattle(b2);
    expect(s.realm.grudgebound('meadowlands')).toHaveLength(1);
    expect(g!.scars).toBe(2);
  });

  it('a Grudgebound is tougher than a plain foe and pays a bounty when it dies', () => {
    const s = session();
    const id = firstEnemy('meadowlands');
    const g = s.realm.forge('meadowlands', id)!;
    const lead = { enemyId: id, grudge: { id: g.id, name: fullName(g), threat: 80, levelBonus: 1, traits: [], line: '“Hello.”', rank: 1 } };
    const plain = createEncounterBattle(s.player, wild('meadowlands', id), { rng: new Rng(3) });
    const hard = createEncounterBattle(s.player, { ...wild('meadowlands', id), enemies: [lead] }, { rng: new Rng(3) });
    expect(hard.combatants.find((x) => x.side === 'enemy')!.maxHp).toBeGreaterThan(plain.combatants.find((x) => x.side === 'enemy')!.maxHp);
    const foe = hard.combatants.find((x) => x.grudgeId)!;
    foe.hp = 0;
    foe.alive = false;
    hard.outcome = 'victory';
    const gold = s.state.gold;
    s.realm.afterBattle(hard);
    expect(g.slain).toBeDefined();
    expect(s.state.realm.grudge.slain).toBe(1);
    expect(s.state.gold).toBeGreaterThan(gold);
  });

  it('runs a ledger of scheming while the hero is away and keeps the order 1..n', () => {
    const s = session();
    const id = firstEnemy('meadowlands');
    for (let i = 0; i < 6; i++) s.realm.forge('meadowlands', id, i % 2 ? 'fled' : 'beat');
    for (let day = 1; day <= 120; day++) s.advanceTime(1440);
    const live = hierarchy(s.state.realm.grudge, 'meadowlands');
    expect(live.map((g) => g.rank)).toEqual(live.map((_, i) => i + 1));
    expect(s.state.realm.grudge.log.length).toBeGreaterThan(3);
    expect(live.length).toBeLessThanOrEqual(10);
  });

  it('never marks a boss and never makes two Grudgebound with one name', () => {
    const s = session();
    const id = firstEnemy('meadowlands');
    for (let i = 0; i < 10; i++) s.realm.forge('meadowlands', id);
    expect(s.realm.forge('meadowlands', id)).toBeNull();
    const names = new Set(Object.values(s.state.realm.grudge.entries).map(fullName));
    expect(names.size).toBe(10);
  });

  it('survives a save and an old save loads with an empty ledger', () => {
    const s = session();
    s.realm.forge('meadowlands', firstEnemy('meadowlands'));
    const copy = deserialize(serialize(s));
    expect(copy.ok).toBe(true);
    const old = JSON.parse(serialize(s)) as { state: Record<string, unknown> };
    delete old.state.realm;
    (old.state.meta as { version: number }).version = 22;
    const back = deserialize(JSON.stringify(old));
    expect(back.ok && Object.keys(back.state.realm.grudge.entries)).toEqual([]);
  });
});

import { FESTIVALS, SEASON_DAYS, YEAR_DAYS } from '../src/data/realm/wheel';
import { shopOpen, shopsIn, shopStock } from '../src/engine/economy/shops';
import { isAvailable } from '../src/engine/quests/quests';
import { chaosMult, dateOf, festivalOn, nextFestival, seasonGods } from '../src/engine/realm/wheel';

const dayOf = (id: string): number => {
  for (let d = 1; d <= YEAR_DAYS; d++) if (festivalOn(d)?.id === id) return d;
  throw new Error(id);
};

describe('the Turning Wheel', () => {
  it('has a 112-day year, 12 gods ruling the seasons and 14 festivals on 14 different days', () => {
    expect(YEAR_DAYS).toBe(112);
    expect(FESTIVALS).toHaveLength(14);
    expect(new Set(FESTIVALS.map((f) => f.god)).size).toBe(14);
    expect(FESTIVALS.filter((f) => f.between).map((f) => f.god).sort()).toEqual(['mirrin', 'vex']);
    for (let s = 0; s < 4; s++) expect(seasonGods(s)).toHaveLength(3);
    const days = new Set(FESTIVALS.map((f) => f.season * SEASON_DAYS + f.day));
    expect(days.size).toBe(14);
    expect(dateOf(1)).toMatchObject({ year: 1, season: 0, dayOfSeason: 1 });
    expect(dateOf(113)).toMatchObject({ year: 2, season: 0, dayOfSeason: 1 });
    expect(festivalOn(dayOf('greenwake'))?.id).toBe('greenwake');
    expect(nextFestival(1).festival.id).toBe('greenwake');
    expect(nextFestival(dayOf('greenwake')).inDays).toBe(0);
  });

  it('every festival has a host in its town, a stall and a quest that only opens on the day', () => {
    for (const f of FESTIVALS) {
      expect(content.npcs.get(f.host.id).town).toBe(f.town);
      expect(content.shops.get(`festival-${f.id}`).festival).toBe(f.id);
      const q = content.quests.get(`festival-${f.id}`);
      expect(q.giver).toBe(f.host.id);
      expect(q.repeatable).toBe(true);
    }
    const s = session();
    s.state.player.level = 60;
    const day = dayOf('greenwake');
    s.state.clock = { day: day - 1, minute: 600 };
    expect(isAvailable(s.state, content.quests.get('festival-greenwake'))).toBe(false);
    s.state.clock = { day, minute: 600 };
    expect(isAvailable(s.state, content.quests.get('festival-greenwake'))).toBe(true);
  });

  it('the stall is open in the host town only on the day, and the host is only in town then', () => {
    const s = session();
    const stall = content.shops.get('festival-anvilday');
    const day = dayOf('anvilday');
    expect(shopsIn('khazrum').some((x) => x.id === stall.id)).toBe(true);
    expect(shopsIn('brightwater').some((x) => x.id === stall.id)).toBe(false);
    expect(shopOpen(stall, 'khazrum', s.player, false, content, day).ok).toBe(true);
    expect(shopOpen(stall, 'khazrum', s.player, false, content, day + 1).ok).toBe(false);
    s.state.clock = { day, minute: 600 };
    expect(s.quests.townNpcs('khazrum').some((n) => n.id === 'anvilday-hammerwarden')).toBe(true);
    s.state.clock = { day: day + 1, minute: 600 };
    expect(s.quests.townNpcs('khazrum').some((n) => n.id === 'anvilday-hammerwarden')).toBe(false);
  });

  it('festival effects change XP, minigame gold, encounters and prices', () => {
    const xpAt = (day: number): number => {
      const x = session();
      let got = 0;
      x.bus.on('xpGained', ({ amount }) => (got = amount));
      x.state.clock = { day, minute: 600 };
      x.grantXp(1000, true);
      const y = session();
      y.bus.on('xpGained', ({ amount }) => (got = amount));
      y.state.clock = { day, minute: 600 };
      y.grantXp(1000, false);
      return got;
    };
    expect(xpAt(dayOf('open-lectures'))).toBeGreaterThanOrEqual(1400);
    expect(xpAt(dayOf('open-lectures') + 3)).toBeLessThan(1400);
    // A festival game pays double.
    const racing = session();
    racing.state.clock = { day: dayOf('kitefall'), minute: 600 };
    const gold = racing.state.gold;
    racing.addGold(100, 'racing');
    expect(racing.state.gold - gold).toBe(200);
    racing.addGold(100, 'dice');
    expect(racing.state.gold - gold).toBe(300);
    // Upside Day swings prices; other days do not.
    const up = dayOf('upside-day');
    const mults = content.shops.all().slice(0, 12).map((x) => chaosMult(up, x.id));
    expect(Math.min(...mults)).toBeGreaterThanOrEqual(0.6);
    expect(Math.max(...mults)).toBeLessThanOrEqual(1.4);
    expect(new Set(mults).size).toBeGreaterThan(3);
    expect(chaosMult(up + 1, 'general')).toBe(1);
    // A discount festival is cheaper than an ordinary day.
    const price = (day: number) => shopStock(content.shops.get('general'), 'brightwater', day, session().player, 0)[0]?.price ?? 0;
    expect(price(dayOf('tally-market'))).toBeLessThan(price(dayOf('tally-market') + 7) * 1.001);
  });
});
