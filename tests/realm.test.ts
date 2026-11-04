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
import { evaluate } from '../src/engine/quests/conditions';
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

import { MARROW, MARROW_DEEDS, MARROW_FACTS, MARROW_VILLAGERS } from '../src/data/realm/marrow';
import { deedsAt, presentAt } from '../src/engine/realm/marrow';

describe('the Three Days of Marrow', () => {
  it('has twelve people with twelve-slot schedules, and every fact and deed is reachable', () => {
    expect(MARROW_VILLAGERS).toHaveLength(12);
    for (const v of MARROW_VILLAGERS) {
      expect(v.where, v.id).toHaveLength(12);
      for (const t of v.topics) {
        expect(MARROW_FACTS[t.fact], t.fact).toBeDefined();
        if (t.needs) expect(MARROW_FACTS[t.needs], t.needs).toBeDefined();
      }
    }
    const sources = new Set(MARROW_VILLAGERS.flatMap((v) => v.topics.map((t) => t.fact)));
    for (const d of MARROW_DEEDS) {
      for (const f of d.needsFacts) expect(sources.has(f), `${d.id} needs ${f}`).toBe(true);
      expect(d.slots.length).toBeGreaterThan(0);
    }
  });

  it('a first loop teaches, the weir gives way, and a second run breaks the loop and pays', () => {
    const s = session();
    const m = s.state.realm.marrow;
    const at = (slot: number, place: Parameters<typeof presentAt>[1], who?: string) => {
      expect(m.slot).toBe(slot);
      if (who) expect(presentAt(slot, place).some((v) => v.id === who), `${who} at ${place} in slot ${slot}`).toBe(true);
    };
    // Loop one: learn.
    const plan: [number, Parameters<typeof presentAt>[1], string][] = [[0, 'square', 'wren'], [1, 'bakery', 'bess'], [2, 'graves', 'osk'], [4, 'forge', 'torvik'], [5, 'graves', 'anselm'], [6, 'square', 'hobb'], [8, 'tower', 'edda'], [9, 'tower', 'edda']];
    for (let slot = 0; slot < 12; slot++) {
      const step = plan.find((p) => p[0] === slot);
      if (step) {
        at(slot, step[1], step[2]);
        expect(s.realm.marrowTalk(step[2], step[1]).ok).toBe(true);
      } else expect(s.realm.marrowWait().ok).toBe(true);
    }
    expect(m.loops).toBe(1);
    expect(m.slot).toBe(0);
    for (const f of ['loop', 'torvik-key', 'weir-cracked', 'sluice', 'flood-marks', 'mayor-afraid', 'edda-grief', 'edda-door']) expect(m.facts, f).toContain(f);
    // Deeds need their hour, their place and each other.
    expect(s.realm.marrowDeed('sluice', 'weir').ok).toBe(false);
    const gold = s.state.gold;
    const run: [number, string, Parameters<typeof presentAt>[1]][] = [[0, 'key', 'forge'], [4, 'sluice', 'weir'], [8, 'proof', 'chapel'], [10, 'evacuate', 'square'], [11, 'release', 'tower']];
    for (let slot = 0; slot < 12; slot++) {
      const d = run.find((r) => r[0] === slot);
      if (d) {
        expect(deedsAt(m, d[2]).some((x) => x.deed.id === d[1] && x.ready), d[1]).toBe(true);
        const r = s.realm.marrowDeed(d[1], d[2]);
        expect(r.ok).toBe(true);
      } else expect(s.realm.marrowWait().ok).toBe(true);
    }
    expect(m.saved).toBe('mended');
    expect(s.state.gold).toBeGreaterThanOrEqual(gold + MARROW.mended.gold);
    expect(s.state.flags['marrow-mended']).toBe(true);
    expect(s.realm.marrowWait().ok).toBe(false);
  });

  it('skipping the sluice still ends the loop, but only empties the town', () => {
    const s = session();
    const m = s.state.realm.marrow;
    m.facts.push(...Object.keys(MARROW_FACTS));
    m.slot = 8;
    expect(s.realm.marrowDeed('proof', 'chapel').ok).toBe(true);
    m.slot = 10;
    expect(s.realm.marrowDeed('evacuate', 'square').ok).toBe(true);
    m.slot = 11;
    expect(s.realm.marrowDeed('release', 'tower').ok).toBe(true);
    expect(m.saved).toBe('emptied');
  });

  it('a save keeps what you learned', () => {
    const s = session();
    s.state.realm.marrow.facts.push('loop');
    const back = deserialize(serialize(s));
    expect(back.ok && back.state.realm.marrow.facts).toEqual(['loop']);
  });
});

import { FORTUNES } from '../src/data/realm/fortunes';
import { questTown } from '../src/engine/world/renown';
import { tierOf, fortuneOf } from '../src/engine/realm/fortunes';

describe('Fortunes of the Realm', () => {
  it('towns start at their own prosperity and a finished quest lifts the town it was for', () => {
    const s = session();
    expect(s.realm.fortune('aurelane').prosperity).toBe(66);
    expect(s.realm.fortune('ashfold').prosperity).toBe(22);
    expect(s.realm.fortune('brightwater').prosperity).toBe(FORTUNES.baseline);
    const before = s.realm.fortune('brightwater').prosperity;
    s.realm.lift('brightwater', 10);
    expect(s.realm.fortune('brightwater').prosperity).toBe(before + 10);
    expect(s.realm.fortune('brightwater').tier.id).toBe('stable');
    s.realm.lift('brightwater', 20);
    expect(s.realm.fortune('brightwater').tier.id).toBe('thriving');
  });

  it('prices follow the tier, and a fallen town shuts its shops and inn until it is rebuilt', () => {
    const s = session();
    const town = 'brightwater';
    s.realm.lift(town, -30);
    expect(s.realm.fortune(town).tier.id).toBe('struggling');
    expect(s.realm.priceMult(town)).toBeGreaterThan(1);
    s.realm.lift(town, -25);
    expect(s.realm.isFallen(town)).toBe(true);
    expect(s.realm.innMult(town)).toBe(1);
    // Gold repairs it.
    s.state.gold = 100000;
    for (let i = 0; i < 4; i++) expect(s.realm.fund(town).ok).toBe(true);
    expect(s.realm.isFallen(town)).toBe(false);
    expect(s.realm.fortune(town).prosperity).toBeGreaterThanOrEqual(FORTUNES.rise);
  });

  it('a scarred Grudgebound at the top raids the town in its region, and investments and time restore it', () => {
    const s = session();
    const zone = 'meadowlands';
    const g = s.realm.forge(zone, firstEnemy(zone))!;
    g.scars = 8;
    const start = s.realm.fortune('brightwater').prosperity;
    let raided = false;
    for (let day = 1; day <= 400 && !raided; day++) {
      s.advanceTime(1440);
      raided = s.realm.fortune('brightwater').raids > 0;
    }
    expect(raided).toBe(true);
    expect(s.state.realm.fortunes.log.some((l) => l.zone === 'brightwater')).toBe(true);
    // Time pulls it back toward where it began once the raider is put down.
    g.slain = s.state.clock.day;
    s.state.realm.fortunes.towns['brightwater']!.prosperity = 20;
    for (let i = 0; i < 100; i++) s.advanceTime(1440);
    expect(fortuneOf(s.state.realm.fortunes, 'brightwater').prosperity).toBeGreaterThan(30);
    expect(start).toBeGreaterThan(0);
    expect(tierOf(fortuneOf(s.state.realm.fortunes, 'brightwater')).id).not.toBe('fallen');
  });

  it('finishing a quest for a town raises its prosperity', () => {
    const s = session();
    const q = content.quests.all().find((x) => questTown(x) === 'brightwater' && x.kind === 'side');
    expect(q).toBeDefined();
    const before = s.realm.fortune('brightwater').prosperity;
    (s.quests as unknown as { finish(q: unknown): void }).finish(q);
    expect(s.realm.fortune('brightwater').prosperity).toBeGreaterThan(before);
  });
});

import { ECHOES } from '../src/data/realm/echoes';
import { mapFor } from '../src/engine/world/mapgen';
import { startNgPlus } from '../src/engine/ngplus/ngplus';

describe('Echoes of the Fallen', () => {
  it('has 20+ echoes in the real regions, four of them in the Hollow Barrows that can be spoken to, each on its map', () => {
    expect(ECHOES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ECHOES.map((e) => e.zone)).size).toBeGreaterThanOrEqual(18);
    const barrows = ECHOES.filter((e) => e.zone === 'hollow-barrows');
    expect(barrows).toHaveLength(4);
    expect(barrows.every((e) => e.talk)).toBe(true);
    for (const e of ECHOES) {
      expect(content.zones.find(e.zone), e.id).toBeDefined();
      expect(content.lore.find(e.id), e.id).toBeDefined();
      expect(mapFor(e.zone).entities.some((x) => x.kind === 'lore' && x.ref === e.id), `${e.id} on the ${e.zone} map`).toBe(true);
      expect(e.beats).toHaveLength(3);
    }
  });

  it('finding one records it and replaying it pays once', () => {
    const s = session();
    const echo = ECHOES[0]!;
    expect(s.realm.replay(echo.id, 'a').ok).toBe(false);
    s.realm.onLore(echo.id);
    expect(s.state.realm.echoes.found[echo.id]).toBeDefined();
    const xp = s.player.xp;
    const first = s.realm.replay(echo.id, 'a');
    expect(first.ok && first.xp).toBeGreaterThan(0);
    expect(s.player.xp).toBeGreaterThanOrEqual(xp);
    expect(s.realm.replay(echo.id, 'b').xp).toBeUndefined();
    expect(s.realm.replay(echo.id, 'talk').ok).toBe(false);
    const barrows = ECHOES.find((e) => e.talk)!;
    s.realm.onLore(barrows.id);
    expect(s.realm.replay(barrows.id, 'talk').ok).toBe(true);
  });

  it('your own defeats are kept across New Game+ and heard in the region where they happened', () => {
    const s = session();
    const id = firstEnemy('meadowlands');
    const b = createEncounterBattle(s.player, wild('meadowlands', id), { rng: new Rng(4) });
    b.outcome = 'defeat';
    s.realm.afterBattle(b);
    expect(s.state.realm.echoes.deaths).toHaveLength(1);
    s.realm.onLore(ECHOES[0]!.id);
    s.realm.newCycle();
    expect(s.state.legacy.echoes).toHaveLength(1);
    expect(s.state.realm.echoes.deaths).toHaveLength(0);
    expect(s.state.realm.echoes.found[ECHOES[0]!.id]).toBeDefined();
    expect(Object.keys(s.state.realm.grudge.entries)).toHaveLength(0);
    s.state.ngPlus = 1;
    const toasts: string[] = [];
    s.bus.on('toast', ({ text }) => toasts.push(text));
    s.state.realm.echoes.lastZone = undefined;
    s.realm.onArrive('meadowlands');
    expect(toasts.some((t) => t.includes('your own voice'))).toBe(true);
    toasts.length = 0;
    s.state.realm.echoes.lastZone = undefined;
    s.realm.onArrive('meadowlands');
    expect(toasts.some((t) => t.includes('your own voice'))).toBe(false);
    void startNgPlus;
  });
});

import { canonNames, canonProblems, eventsIn, generateChronicle } from '../src/engine/realm/chronicle';
import { RESERVED_WORDS } from '../src/data/realm/chronicle';

describe('the Chronicle of Ages', () => {
  it('makes 40 events over 300 years, two in every core region, the same for the same seed and different for another', () => {
    const a = generateChronicle(5);
    const b = generateChronicle(5);
    const c = generateChronicle(6);
    expect(a.events).toHaveLength(40);
    expect(a).toEqual(b);
    expect(a.events.map((e) => e.title)).not.toEqual(c.events.map((e) => e.title));
    const core = content.zones.all().filter((z) => z.ngPlus === undefined);
    expect(core).toHaveLength(20);
    for (const z of core) expect(eventsIn(a, z.id), z.id).toHaveLength(2);
    expect(a.events.every((e) => e.year >= -300 && e.year < 0)).toBe(true);
    expect(a.events.map((e) => e.year)).toEqual([...a.events.map((e) => e.year)].sort((x, y) => x - y));
    expect(new Set(a.events.map((e) => e.place)).size).toBe(40);
  });

  it('never contradicts the fixed story (R18): 150 seeds, no canon words, no harmed gods, no canon names', () => {
    const reserved = canonNames();
    for (let seed = 1; seed <= 150; seed++) {
      for (const e of generateChronicle(seed).events) {
        const text = `${e.title} ${e.text}`;
        expect(canonProblems(text), `${seed}/${e.id}: ${text}`).toEqual([]);
        for (const f of e.figures) for (const w of f.split(' ')) expect(reserved.has(w.toLowerCase()), `${seed}: ${f}`).toBe(false);
        for (const w of RESERVED_WORDS) expect(text.toLowerCase()).not.toContain(w.toLowerCase());
      }
    }
  });

  it('the canon check really does catch contradictions', () => {
    expect(canonProblems('The Unsworn King died at the weir.')).not.toEqual([]);
    expect(canonProblems('Morrath was slain at dusk.')).not.toEqual([]);
    expect(canonProblems('The gods fell silent.')).not.toEqual([]);
    expect(canonProblems('Solenne blessed the harvest.')).toEqual([]);
  });

  it('a new game has a history; tales are heard on arrival, ruins read in full and commissions finish', () => {
    const s = session();
    const ch = s.realm.chronicle;
    expect(ch.events).toHaveLength(40);
    s.state.player.level = 20;
    const arrive = (zone: string) => {
      s.state.realm.echoes.lastZone = undefined;
      s.realm.onArrive(zone);
    };
    // The first event of a region is told as a rumor the first time you arrive.
    const zone = 'whisperwood';
    const evs = eventsIn(ch, zone);
    const first = evs[0]!;
    const second = evs[1]!;
    arrive(zone);
    expect(ch.known[first.id]).toBe(1);
    expect(ch.known[second.id]).toBeUndefined();
    arrive(zone);
    expect(ch.known[second.id]).toBe(1);
    // A ruin reads in full and pays once.
    const gold = s.state.gold;
    const text = s.realm.visitRuin(zone, 0);
    expect(text).toContain(first.text);
    expect(ch.known[first.id]).toBe(2);
    expect(s.state.gold).toBe(gold + 20 * 15);
    const again = s.state.gold;
    s.realm.visitRuin(zone, 0);
    expect(s.state.gold).toBe(again);
    expect(s.realm.visitRuin(zone, 5)).toContain('Bare stones');
    // A commission: take it, see the ruin, and put down the foes.
    const offer = s.realm.commissionsOffered()[0];
    expect(offer).toBeDefined();
    expect(s.realm.takeCommission(offer!.event.id).ok).toBe(true);
    expect(s.realm.takeCommission(offer!.event.id).ok).toBe(false);
    const c = ch.commissions[0]!;
    const before = s.state.gold;
    for (let i = 0; i < 3 && ch.commissions.length; i++) {
      const id = firstEnemy(offer!.event.zone);
      const b = createEncounterBattle(s.player, wild(offer!.event.zone, id), { rng: new Rng(9 + i) });
      for (let k = 0; k < c.need; k++) (b.tally.kills as unknown[]).push({ enemyId: id, tier: 'normal', level: 1, xp: 0, types: [] });
      b.outcome = 'victory';
      s.realm.visitRuin(offer!.event.zone, eventsIn(ch, offer!.event.zone).indexOf(offer!.event));
      s.realm.afterBattle(b);
    }
    expect(ch.commissions).toHaveLength(0);
    expect(ch.completed).toContain(offer!.event.id);
    expect(s.state.gold).toBeGreaterThan(before);
  });

  it('every region has two ruin entities on its map, and an old save is given a history', () => {
    for (const z of content.zones.all().filter((x) => x.ngPlus === undefined)) {
      expect(mapFor(z.id).entities.filter((e) => e.ref?.startsWith('chronicle:')), z.id).toHaveLength(2);
    }
    const s = session();
    const old = JSON.parse(serialize(s)) as { state: Record<string, unknown> };
    delete (old.state.realm as Record<string, unknown>).chronicle;
    (old.state.meta as { version: number }).version = 22;
    const back = deserialize(JSON.stringify(old));
    expect(back.ok).toBe(true);
    if (back.ok) expect(new GameSession(back.state).realm.chronicle.events).toHaveLength(40);
  });
});

import { PATRON_DAILY_CAP, PATRON_GOLD } from '../src/engine/state/economyActions';
import { renownOf } from '../src/engine/world/renown';

describe('renown from shopping', () => {
  it('spending in a town earns its renown, with a daily limit and a remainder carried over', () => {
    const s = session();
    const eco = s.economy as unknown as { patronize(town: string, spent: number): void };
    const before = renownOf(s.player, 'brightwater');
    eco.patronize('brightwater', PATRON_GOLD - 1);
    expect(renownOf(s.player, 'brightwater')).toBe(before);
    eco.patronize('brightwater', 1);
    expect(renownOf(s.player, 'brightwater')).toBe(before + 1);
    eco.patronize('brightwater', PATRON_GOLD * 20);
    expect(renownOf(s.player, 'brightwater')).toBe(before + PATRON_DAILY_CAP);
    s.state.clock = { day: s.state.clock.day + 1, minute: 600 };
    eco.patronize('brightwater', PATRON_GOLD);
    expect(renownOf(s.player, 'brightwater')).toBeGreaterThan(before + PATRON_DAILY_CAP);
  });
});

describe('the map seller', () => {
  it('sells a chart of the town’s region until you hold them all', () => {
    const s = session();
    s.state.gold = 1_000_000;
    s.state.world.position = { ...s.state.world.position, map: 'brightwater' } as never;
    const spy = s.economy as unknown as { town(): string | undefined };
    spy.town = () => 'brightwater';
    const zone = content.towns.get('brightwater').zone;
    const total = content.treasures.filter((t) => t.zone === zone).length;
    for (let i = 0; i < total; i++) expect(s.economy.buyMap().ok).toBe(true);
    expect(s.economy.buyMap().ok).toBe(false);
    expect(s.state.world.treasureMaps.filter((id) => content.treasures.get(id).zone === zone)).toHaveLength(total);
  });
});

describe('per-difficulty achievements', () => {
  it('finishing the story records the difficulty, and its achievement is earned', () => {
    const s = session();
    s.state.player.difficulty = 'hard';
    expect(evaluate(s.state, { kind: 'cleared', difficulty: 'hard' })).toBe(false);
    s.quests.reachEnding('redeemed');
    expect(s.state.legacy.clears).toContain('hard');
    expect(evaluate(s.state, { kind: 'cleared', difficulty: 'hard' })).toBe(true);
    expect(evaluate(s.state, { kind: 'cleared', difficulty: 'easy' })).toBe(false);
    expect(evaluate(s.state, { kind: 'cleared', difficulty: 'hard', hardcore: true })).toBe(false);
    expect(content.achievements.find('clear-hard')).toBeDefined();
    expect(content.achievements.all().filter((a) => a.id.startsWith('clear-'))).toHaveLength(8);
  });
});
