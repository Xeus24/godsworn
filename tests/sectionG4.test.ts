import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { festivalOn } from '../src/engine/realm/wheel';
import { DIVING, FEARS, ISLANDS, QUARRIES, TOURNAMENT, WRECKS } from '../src/data/trials';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(55, makeHero());
  (s.world as any).inTown = () => 'sandhaven';
  s.player.level = 60;
  s.state.gold = 1000000;
  return s;
};
const finish = (s: GameSession, won: boolean) => {
  const a = s.state.endgame.active!;
  if (won) a.wave = a.fights.length;
  (s.endgame as any).end(a, won);
};

describe('Duel Tournaments (item 43)', () => {
  it('opens only on the festival day, once a year, and a win crowns you', () => {
    const s = session();
    expect(s.trials.tournamentOpen().ok).toBe(false);
    let day = 1;
    while (festivalOn(day)?.id !== TOURNAMENT.festival && day < 400) day++;
    s.state.clock.day = day;
    expect(s.trials.enterTournament().ok).toBe(true);
    expect(s.state.endgame.active!.fights).toHaveLength(TOURNAMENT.rounds);
    finish(s, true);
    expect(s.trials.t.tournament.champion).toHaveLength(1);
    expect(s.player.devotion.titles).toContain(TOURNAMENT.champion.title);
    expect(s.trials.tournamentOpen().ok).toBe(false);
  });
});

describe('Dreamscape Dungeons (item 55)', () => {
  it('every companion has a fear with enough enemies; clearing a dream raises approval and resolve', () => {
    for (const f of FEARS) expect(content.companions.find(f.companion), f.companion).toBeTruthy();
    const s = session();
    expect(s.trials.enterDream('aldric').ok).toBe(false);
    s.party.recruit('aldric');
    expect(s.trials.enterDream('aldric').ok).toBe(true);
    expect(s.state.endgame.active!.fights).toHaveLength(4);
    finish(s, true);
    expect(s.trials.t.dreams['aldric']).toBe(1);
    expect(heartModifiers(s.player).some((m) => m.source === 'wonders' && m.stat === 'statusResist')).toBe(true);
    for (const f of FEARS) {
      s.party.recruit(f.companion);
      if (!s.state.endgame.active) expect(s.trials.enterDream(f.companion).ok, f.companion).toBe(true);
      if (s.state.endgame.active) (s.endgame as any).end(s.state.endgame.active, false);
    }
  });
});

describe('Moon-Blood Hunts (item 56)', () => {
  it('12 quarries, hunted only on a blood moon', () => {
    expect(QUARRIES).toHaveLength(12);
    const s = session();
    expect(s.trials.startHunt('q-wolf').ok).toBe(false);
    (s.trials as any).bloodMoon = () => true;
    for (const q of QUARRIES) {
      expect(s.trials.startHunt(q.id).ok, q.id).toBe(true);
      (s.endgame as any).end(s.state.endgame.active!, false);
    }
    s.trials.startHunt('q-wolf');
    const gold = s.state.gold;
    finish(s, true);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.trials.t.hunts['q-wolf']).toBe(1);
  });
});

describe('Shipwreck Diving (item 57)', () => {
  it('dive, search, surface with a haul; running out of air costs half', () => {
    expect(WRECKS).toHaveLength(10);
    const s = session();
    const w = WRECKS.find((x) => x.zone === s.world.zone.id) ?? WRECKS[0]!;
    Object.defineProperty(s.world, 'zone', { value: { ...s.world.zone, id: w.zone }, configurable: true });
    expect(s.trials.startDive(w.id).ok).toBe(true);
    expect(s.trials.startDive(w.id).ok).toBe(false);
    for (let i = 0; i < 4 && s.trials.t.dives.active; i++) s.trials.diveStep('shallow');
    const gold = s.state.gold;
    if (s.trials.t.dives.active) s.trials.diveStep('surface');
    expect(s.trials.t.dives.active).toBeUndefined();
    expect(s.state.gold).toBeGreaterThanOrEqual(gold);
    s.trials.startDive(w.id);
    for (let i = 0; i < DIVING.air && s.trials.t.dives.active; i++) s.trials.diveStep('deep');
    expect(s.trials.t.dives.active).toBeUndefined();
  });
});

describe('Sky Islands (item 54)', () => {
  it('need an airship; failures reveal the pattern and the right sequence wins', () => {
    const s = session();
    const isl = ISLANDS[0]!;
    expect(s.trials.tryIsland(isl.id, ['up', 'up', 'up']).ok).toBe(false);
    s.player.world.ship = { level: 3, airship: true, voyages: 0 } as never;
    let seq: ('up' | 'down' | 'left' | 'right')[] = ['up', 'up', 'up'];
    for (let i = 0; i < 4; i++) {
      const hints = s.trials.hint(isl.id);
      seq = hints.map((h) => (/leans (\w+)/.exec(h)?.[1] ?? 'up') as 'up') as typeof seq;
      if (i === 3) break;
      s.trials.tryIsland(isl.id, ['down', 'down', 'down']);
    }
    expect(s.trials.tryIsland(isl.id, seq).ok).toBe(true);
    expect(s.trials.t.islands[isl.id]!.solved).toBe(true);
    expect(s.trials.tryIsland(isl.id, seq).ok).toBe(false);
  });
});
