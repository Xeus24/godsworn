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
