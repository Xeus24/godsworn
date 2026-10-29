import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { CHALLENGES } from '../src/data/challenges';
import { DIVINE_TRIALS, LEAGUE, SPIRE, WEEKLY } from '../src/data/endgameModes';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { createCharacter } from '../src/engine/character/create';
import { settleBattle } from '../src/engine/state/battleResults';
import { EndgameActions } from '../src/engine/state/endgameActions';
import { GameSession } from '../src/engine/state/gameState';
import { migrate } from '../src/engine/state/save';
import { makeHero } from './helpers';

function hero60(): GameSession {
  const s = GameSession.newGame(41, makeHero());
  s.grantXp(5_000_000, true);
  return s;
}
function fightNext(s: GameSession, win = true): void {
  const f = s.endgame.nextFight();
  if (!f) throw new Error('No fight');
  const b = createEncounterBattle(s.player, f.encounter, { rng: s.rng, level: f.level, enemyModifiers: f.enemyModifiers, partyModifiers: f.partyModifiers });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive(win ? 'enemy' : 'party')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
}

describe('the Endless Spire', () => {
  it('has no top: each floor won lays out the next, a guardian every fifth, a twist every fifth', () => {
    const s = hero60();
    expect(GameSession.newGame(1, makeHero()).endgame.canStartSpire().ok).toBe(false);
    expect(s.endgame.startSpire().ok).toBe(true);
    for (let floor = 1; floor <= 11; floor++) {
      const run = s.endgame.active!;
      expect(run.kind).toBe('spire');
      expect(run.floor).toBe(floor);
      expect(run.fights[run.wave]!.encounter.isBoss === true, `floor ${floor}`).toBe(floor % SPIRE.guardianEvery === 0);
      fightNext(s);
    }
    const run = s.endgame.active!;
    expect(run.floor).toBe(12);
    expect(run.affixes).toHaveLength(2);
    expect(s.state.endgame.spire.best).toBe(11);
    expect(s.endgame.leaveSpire().ok).toBe(true);
    expect(s.endgame.active).toBeUndefined();
  });

  it('ends when you fall, and remembers how deep you got', () => {
    const s = hero60();
    s.endgame.startSpire();
    fightNext(s);
    fightNext(s);
    fightNext(s, false);
    expect(s.endgame.active).toBeUndefined();
    expect(s.state.endgame.spire.best).toBe(2);
  });
});

describe('the Divine Trials', () => {
  it('has one for each of the fourteen gods, each against a real Aspect', () => {
    expect(DIVINE_TRIALS).toHaveLength(14);
    for (const t of DIVINE_TRIALS) {
      expect(content.enemies.has(`aspect-${t.god}`), t.god).toBe(true);
      expect(t.enemy.length + t.party.length, t.god).toBeGreaterThan(0);
    }
    expect(new Set(DIVINE_TRIALS.map((t) => t.god)).size).toBe(14);
  });

  it('need the god’s notice, and clearing all fourteen earns a title', () => {
    const s = hero60();
    expect(s.endgame.canStartDivine('solenne').ok).toBe(false);
    for (const t of DIVINE_TRIALS) s.devotion.apply({ [t.god]: 400 }, 'quest');
    for (const t of DIVINE_TRIALS) {
      expect(s.endgame.startDivine(t.god).ok, t.god).toBe(true);
      expect(s.endgame.nextFight()!.enemyModifiers.length + s.endgame.nextFight()!.partyModifiers.length).toBeGreaterThan(0);
      fightNext(s);
    }
    expect(s.player.devotion.titles).toContain('Trialsworn');
    expect(Object.keys(s.state.endgame.divine)).toHaveLength(14);
  });
});

describe('the Arena Champions league', () => {
  it('is a season of eight champions; winning it climbs a rank, losing holds it', () => {
    const s = hero60();
    expect(s.endgame.startLeague().ok).toBe(true);
    expect(s.endgame.active!.fights).toHaveLength(LEAGUE.fightsPerSeason);
    const names = s.endgame.active!.fights.map((f) => f.encounter.enemies[0]!.enemyId);
    expect(new Set(names).size).toBe(8);
    for (let i = 0; i < LEAGUE.fightsPerSeason; i++) fightNext(s);
    expect(s.state.endgame.league.rank).toBe(1);
    expect(s.state.endgame.league.seasons).toBe(1);
    s.endgame.startLeague();
    fightNext(s);
    fightNext(s, false);
    expect(s.state.endgame.league.rank).toBe(1);
  });
});

describe('the weekly seeded run', () => {
  it('has a seed per week, the same fights for the same seed, and a prize once', () => {
    expect(EndgameActions.weeklySeed(new Date(Date.UTC(2026, 0, 5)))).toBe(202602);
    expect(EndgameActions.weeklySeed(new Date(Date.UTC(2026, 0, 11)))).toBe(202602);
    expect(EndgameActions.weeklySeed(new Date(Date.UTC(2026, 0, 12)))).toBe(202603);
    const a = hero60();
    const b = hero60();
    a.endgame.startWeekly(202610);
    b.endgame.startWeekly(202610);
    const names = (s: GameSession) => s.endgame.active!.fights.map((f) => f.encounter.enemies.map((e) => e.enemyId).join('+'));
    expect(names(a)).toEqual(names(b));
    expect(a.endgame.active!.affixes).toEqual(b.endgame.active!.affixes);
    expect(a.endgame.active!.affixes).toHaveLength(WEEKLY.affixes);
    const c = hero60();
    c.endgame.startWeekly(202611);
    expect(names(c)).not.toEqual(names(a));
    for (let i = 0; i < WEEKLY.fights; i++) fightNext(a);
    expect(a.state.endgame.weekly).toMatchObject({ seed: 202610, best: WEEKLY.fights, claimed: true });
    a.endgame.startWeekly(202610);
    expect(a.state.endgame.weekly.claimed).toBe(true);
  });
});

describe('the Pacifist challenge', () => {
  it('is a challenge mode, and in it nothing dies by your hand: foes yield', () => {
    expect(CHALLENGES.some((c) => c.id === 'pacifist' && c.rules?.includes('pacifist'))).toBe(true);
    const hero = createCharacter({ id: 'p', name: 'P', portrait: 0, raceId: 'human', classId: 'warrior', birthSignId: 'the-dawn' });
    hero.challenges = ['pacifist'];
    const enc = content.encounters.find('q-zealots') ?? content.encounters.all()[0]!;
    const b = createEncounterBattle(hero, enc, { rng: GameSession.newGame(2, makeHero()).rng });
    expect(b.pacifist).toBe(true);
    startBattle(b);
    const me = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    for (const x of b.alive('enemy')) applyDamage(b, me, x, 9e9, { element: 'physical', crit: false });
    b.checkOutcome();
    expect(b.alive('enemy')).toHaveLength(0);
    expect(b.tally.kills).toHaveLength(0);
    expect(b.tally.spared.length).toBeGreaterThan(0);
    const normal = createEncounterBattle(createCharacter({ id: 'n', name: 'N', portrait: 0, raceId: 'human', classId: 'warrior', birthSignId: 'the-dawn' }), enc, { rng: GameSession.newGame(2, makeHero()).rng });
    expect(normal.pacifist).toBe(false);
  });
});

describe('saves', () => {
  it('migrates older saves: the new endgame records start empty', () => {
    const s = hero60();
    const raw = JSON.parse(JSON.stringify(s.state)) as { endgame: Record<string, unknown>; meta: { version: number } };
    for (const k of ['spire', 'divine', 'league', 'weekly']) delete raw.endgame[k];
    raw.meta.version = 21;
    const out = migrate(raw as never) as unknown as { endgame: { spire: { best: number }; divine: object; league: { rank: number }; weekly: { claimed: boolean } } };
    expect(out.endgame.spire.best).toBe(0);
    expect(out.endgame.league.rank).toBe(0);
    expect(out.endgame.weekly.claimed).toBe(false);
  });
});
