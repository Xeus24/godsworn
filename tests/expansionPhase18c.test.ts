// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { content } from '../src/data';
import { CARDS, CARD_OPPONENTS, SPHERES, beats } from '../src/data/minigames/cards';
import { FISH, ZONE_WATERS } from '../src/data/minigames/fish';
import { Rng } from '../src/engine/core/rng';
import { bestHand, cardById, duelOutcome, playCard, playRound, startDuel } from '../src/engine/minigames/cardGame';
import { bite, reel } from '../src/engine/minigames/fishing';
import { cargo, forgePay, forgeScore, forgeTier, newDig, newHand, probe, raceOdds, rollHand, runRace } from '../src/engine/minigames/pastimes';
import { createMinigameState } from '../src/engine/minigames/state';
import { ARENA_RUNGS } from '../src/engine/state/minigameActions';
import { GameSession } from '../src/engine/state/gameState';
import { migrate } from '../src/engine/state/save';
import { MinigameScreen } from '../src/ui/world/minigameScreen';
import type { Nav } from '../src/ui/components/navBar';
import { makeHero } from './helpers';

vi.mock('../src/ui/art/portraits', () => ({ drawPortrait: () => document.createElement('canvas') }));
vi.mock('../src/ui/art/heroSprite', () => ({ heroSprite: () => document.createElement('canvas') }));
vi.mock('../src/ui/art/itemIcons', () => ({ itemIconUrl: () => '' }));

const session = () => GameSession.newGame(9, makeHero());

describe('fishing', () => {
  it('has 60+ fish in 15 waters, each region has water, and legends are rare and hard', () => {
    expect(FISH.length).toBeGreaterThanOrEqual(60);
    expect(new Set(FISH.map((f) => f.id)).size).toBe(FISH.length);
    expect(new Set(FISH.map((f) => f.water)).size).toBe(15);
    for (const z of content.zones.all()) expect(ZONE_WATERS[z.id]?.length, z.id).toBeGreaterThan(0);
    const rng = new Rng(5);
    let legends = 0;
    for (let i = 0; i < 2000; i++) if (bite(rng, 'river', true)?.rarity === 5) legends++;
    expect(legends).toBeGreaterThan(0);
    expect(legends).toBeLessThan(60);
    const legend = FISH.find((f) => f.rarity === 5)!;
    const carp = FISH.find((f) => f.rarity === 1)!;
    expect(reel(new Rng(1), carp, 0.5)).toBe(true);
    expect(reel(new Rng(1), legend, 0.5)).toBe(false);
    expect(reel(new Rng(1), legend, 0.98)).toBe(true);
  });

  it('only the fish that feed at that hour bite', () => {
    const rng = new Rng(2);
    for (let i = 0; i < 400; i++) {
      const f = bite(rng, 'pond', false);
      if (f) expect(f.time).not.toBe('night');
    }
  });

  it('catching logs the fish, a record, and sells spares', () => {
    const s = session();
    const before = s.state.gold;
    let caught = 0;
    for (let i = 0; i < 80; i++) if (s.minigames.fish('river', false, 1).caught) caught++;
    expect(caught).toBeGreaterThan(30);
    expect(Object.keys(s.state.minigames.fish).length).toBeGreaterThan(2);
    expect(s.minigames.sellFish()).toBeGreaterThan(0);
    expect(s.state.gold).toBeGreaterThan(before);
  });
});

describe('Pantheon Cards', () => {
  it('has 120+ cards, a ring of spheres where each beats two, and valid opponents', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(120);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const a of SPHERES) {
      expect(SPHERES.filter((b) => beats(a, b))).toHaveLength(2);
      for (const b of SPHERES) expect(beats(a, b) && beats(b, a)).toBe(false);
    }
    for (const o of CARD_OPPONENTS) {
      expect(o.deck, o.id).toHaveLength(5);
      for (const id of [...o.deck, o.prize]) expect(content.cards.has(id), `${o.id}:${id}`).toBe(true);
      expect(o.deck).toContain(o.prize);
    }
    for (const g of content.gods.all().filter((x) => !x.hidden)) expect(CARDS.filter((c) => c.god === g.id).length, g.id).toBe(8);
  });

  it('a sphere that beats another adds 3 to a round', () => {
    const light = CARDS.find((c) => c.sphere === 'light' && c.power === 5)!;
    const shadow = CARDS.find((c) => c.sphere === 'shadow' && c.power === 5)!;
    const flame = CARDS.find((c) => c.sphere === 'flame' && c.power === 5)!;
    expect(playRound(light, flame)).toBe('win');
    expect(playRound(flame, light)).toBe('lose');
    expect(playRound(light, light)).toBe('draw');
    expect(['win', 'lose', 'draw']).toContain(playRound(light, shadow));
  });

  it('a duel runs five rounds; a win takes the staked card and some gold', () => {
    const s = session();
    const opp = CARD_OPPONENTS[0]!;
    // Give the hero a hand that beats the first opponent with ease.
    for (const id of ['the-hundred-year-oak', 'hammer-of-the-mountain', 'nobody-s-champion', 'solenne-who-rises', 'thalor-who-strikes-true']) s.state.minigames.cards[id] = 1;
    const hand = ['the-hundred-year-oak', 'hammer-of-the-mountain', 'nobody-s-champion', 'ysolde-who-listens', 'solenne-who-rises'].map((id) => (content.cards.has(id) ? id : 'dawn-candle'));
    s.state.minigames.cards['ysolde-who-listens'] = 1;
    const started = s.minigames.duel(opp.id, [...new Set(hand)].concat(['kindling', 'acorn', 'pebble']).slice(0, 5));
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const d = started.duel;
    expect(d.mine).toHaveLength(5);
    expect(s.minigames.duel(opp.id, ['nonsense', 'a', 'b', 'c', 'd']).ok).toBe(false);
    while (d.rounds.length < 5) playCard(s.rng, d, d.mine[0] as string);
    expect(duelOutcome(d)).toBeDefined();
    const res = s.minigames.finishDuel(d);
    if (res.outcome === 'win') {
      expect(s.state.minigames.cards[opp.prize]).toBe(1);
      expect(res.gold).toBeGreaterThan(0);
    }
    expect(cardById(opp.prize).name.length).toBeGreaterThan(2);
    expect(bestHand(s.state.minigames)).toHaveLength(5);
    expect(startDuel(opp, bestHand(s.state.minigames)).rounds).toHaveLength(0);
  });
});

describe('dice, racing, forging, digging', () => {
  it('Ship, Captain and Crew: the cargo counts only with all three aboard', () => {
    const rng = new Rng(11);
    let h = newHand();
    let sawCrew = false;
    for (let i = 0; i < 200; i++) {
      h = rollHand(rng, newHand());
      expect(h.captain ? h.ship : true).toBe(true);
      expect(h.crew ? h.captain : true).toBe(true);
      if (h.crew) {
        sawCrew = true;
        expect(cargo(h)).toBeGreaterThanOrEqual(2);
        expect(cargo(h)).toBeLessThanOrEqual(12);
      } else expect(cargo(h)).toBe(0);
    }
    expect(sawCrew).toBe(true);
  });

  it('a wager is taken, and paid double on a win', () => {
    const s = session();
    s.state.gold = 1000;
    let net = 0;
    for (let i = 0; i < 40; i++) {
      const before = s.state.gold;
      const hand = rollHand(s.rng, rollHand(s.rng, rollHand(s.rng, newHand())));
      const r = s.minigames.playDice(10, hand);
      expect(r.ok).toBe(true);
      net += s.state.gold - before;
    }
    expect(Math.abs(net)).toBeLessThan(500);
    expect(s.minigames.playDice(0, newHand()).ok).toBe(false);
    s.state.gold = 5;
    expect(s.minigames.playDice(10, newHand()).ok).toBe(false);
  });

  it('a faster racer wins more often, and longer odds pay more', () => {
    const rng = new Rng(4);
    const field = [{ id: 'a', name: 'A', speed: 9 }, { id: 'b', name: 'B', speed: 3 }, { id: 'c', name: 'C', speed: 5 }];
    let a = 0;
    for (let i = 0; i < 300; i++) if (runRace(rng, field)[0] === 'a') a++;
    expect(a).toBeGreaterThan(150);
    expect(raceOdds(field[1]!, field)).toBeGreaterThan(raceOdds(field[0]!, field));
    const s = session();
    s.state.gold = 100;
    const r = s.minigames.race('you', 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.order).toHaveLength(5);
  });

  it('forging scores strikes by how true they were', () => {
    expect(forgeScore([0, 0, 0, 0, 0])).toBe(100);
    expect(forgeScore([1, -1, 1, -1, 1])).toBe(0);
    expect(forgeTier(100)).toBe('Masterwork');
    expect(forgeTier(80)).toBe('Superb');
    expect(forgeTier(55)).toBe('Fine');
    expect(forgeTier(10)).toBe('Flawed');
    expect(forgePay(100, 20)).toBeGreaterThan(forgePay(10, 20));
    const s = session();
    const r = s.minigames.finishForge([0.1, 0, -0.1, 0, 0.05]);
    expect(r.tier).toBe('Masterwork');
    expect(s.state.minigames.forging.best).toBe(r.score);
  });

  it('digging gives hotter hints as you close in, and pays only when found', () => {
    const rng = new Rng(8);
    const g = newDig(rng);
    const [tx, ty] = g.target;
    expect(probe(g, tx, ty)).toBe('here');
    expect(g.found).toBe(true);
    const h = newDig(rng);
    expect(probe(h, (h.target[0] + 3) % 7, h.target[1])).not.toBe('here');
    const s = session();
    const gold = s.state.gold;
    expect(s.minigames.finishDig(g).gold).toBeGreaterThan(0);
    expect(s.state.gold).toBeGreaterThan(gold);
    expect(s.minigames.finishDig(h).gold).toBe(0);
  });
});

describe('the arena ladder and saves', () => {
  it('has twelve rungs, each a real fight, settled at once without costing health', () => {
    const s = session();
    for (let r = 1; r <= ARENA_RUNGS; r++) {
      const enc = s.minigames.rungEncounter(r);
      expect(enc.enemies.length, `rung ${r}`).toBeGreaterThan(0);
      for (const e of enc.enemies) expect(content.enemies.has(e.enemyId), e.enemyId).toBe(true);
    }
    const hp = s.player.hp;
    const r = s.minigames.fightRung();
    expect(r.ok).toBe(true);
    expect(s.player.hp).toBe(hp);
    expect(s.state.minigames.arena.fights).toBe(1);
  });

  it('migrates older saves: a starter set of cards and empty records', () => {
    const raw = JSON.parse(JSON.stringify(session().state)) as { minigames?: unknown; meta: { version: number } };
    delete raw.minigames;
    raw.meta.version = 19;
    const out = migrate(raw as never) as unknown as { minigames: { cards: Record<string, number>; arena: { rung: number } } };
    expect(Object.keys(out.minigames.cards)).toHaveLength(createMinigameState() && 10);
    expect(out.minigames.arena.rung).toBe(0);
  });
});

describe('the pastimes screen', () => {
  const nav = new Proxy({}, { get: () => () => undefined }) as Nav;

  it('opens on the town’s game and shows every tab', () => {
    const s = session();
    const root = document.createElement('div');
    const screen = new MinigameScreen(s, nav, 'mirewick', () => undefined);
    screen.mount(root);
    expect(root.textContent).toContain('Pastimes in Mirewick');
    expect(root.textContent).toContain('Cast a line');
    for (const label of ['Pantheon Cards', 'Tavern Dice', 'Mount Racing', 'The Forge', 'Treasure Digging', 'Arena Ladder']) {
      const tab = [...root.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement;
      expect(tab, label).toBeDefined();
      tab.click();
      expect(root.textContent?.length).toBeGreaterThan(80);
    }
    screen.unmount();
  });
});
