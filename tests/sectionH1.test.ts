import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { CAERITH, CIPHER, FORSWORN, KING_LINES, LINEAGE_PAGES, LINEAGE_ZONES, OATHCRAFT, SCARS, VOW_CONDITIONS, VOW_REWARDS } from '../src/data/oaths';
import { oathKindFor } from '../src/engine/combat/oaths';
import { favorOf } from '../src/engine/gods/devotion';
import { heartModifiers } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(81, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.state.gold = 100;
  return s;
};

describe('Caerith, the Lineage and the Cipher (items 61-63)', () => {
  it('16 pages in 16 real regions; each is found once, and unlocks his lines', () => {
    expect(LINEAGE_PAGES).toHaveLength(16);
    expect(LINEAGE_ZONES).toHaveLength(16);
    for (const z of LINEAGE_ZONES) expect(content.zones.find(z), z).toBeTruthy();
    expect(KING_LINES.length).toBeGreaterThanOrEqual(8);
    const s = session();
    s.oaths.foundPage('meadowlands');
    s.oaths.foundPage('meadowlands');
    s.oaths.foundPage('whisperwood');
    expect(s.oaths.o.pages).toHaveLength(2);
    expect(s.oaths.kingLines()).toHaveLength(1);
    s.oaths.foundPage('ashfold');
    expect(s.oaths.o.pages).toHaveLength(2);
    for (const z of LINEAGE_ZONES) s.oaths.foundPage(z);
    expect(s.state.flags['lineage-complete']).toBe(true);
    expect(s.oaths.kingLines()).toHaveLength(KING_LINES.length);
  });
  it('twelve fragments of Caerith open as their sources are found; the cipher is whole at 120 secrets', () => {
    expect(CAERITH).toHaveLength(12);
    const s = session();
    const before = s.oaths.fragments().filter((f) => f.open).length;
    for (const z of LINEAGE_ZONES) s.oaths.foundPage(z);
    expect(s.oaths.fragments().filter((f) => f.open).length).toBeGreaterThan(before);
    expect(s.oaths.cipherDone()).toBe(false);
    expect(CIPHER.symbols).toBe(120);
  });
});

describe('Oathcraft (item 64)', () => {
  it('20 conditions and 6 rewards; a vow gives its reward, breaks on its condition and leaves a Scar', () => {
    expect(VOW_CONDITIONS.length).toBeGreaterThanOrEqual(20);
    expect(VOW_REWARDS.length).toBe(6);
    const s = session();
    expect(s.oaths.swear('never-flee', 'xp').ok).toBe(true);
    expect(s.oaths.swear('never-flee', 'gold').ok).toBe(false);
    expect(heartModifiers(s.player).some((m) => m.stat === 'xpGain' && m.source === 'wonders')).toBe(true);
    s.state.stats.battlesFled++;
    s.bus.emit('timeChanged', { day: 2, hour: 1 });
    expect(s.oaths.o.vows[0]!.status).toBe('broken');
    expect(s.oaths.o.scars).toHaveLength(1);
    expect(heartModifiers(s.player).some((m) => m.stat === 'xpGain' && m.value === 20)).toBe(false);
  });
  it('a vow kept to the end of a stretch of the story is rewarded with an Oath Title', () => {
    const s = session();
    s.oaths.swear('spend-nothing', 'power');
    const mains = content.quests.filter((q) => q.kind === 'main');
    for (const q of mains.slice(0, OATHCRAFT.mainPerStretch)) s.state.quests.completed[q.id] = 1;
    s.bus.emit('questComplete', { questId: mains[0]!.id });
    expect(s.oaths.o.vows[0]!.status).toBe('kept');
    expect(s.player.devotion.titles.some((t) => t.startsWith('Oathkeeper'))).toBe(true);
  });
  it('holds at most three vows', () => {
    const s = session();
    expect(s.oaths.swear('never-kill', 'xp').ok).toBe(true);
    expect(s.oaths.swear('never-flee', 'xp').ok).toBe(true);
    expect(s.oaths.swear('never-fall', 'xp').ok).toBe(true);
    expect(s.oaths.swear('spend-nothing', 'xp').ok).toBe(false);
  });
});

describe('The Forsworn Path (item 65)', () => {
  it('24 scars, each with a rite; five make you Forsworn and the gods of light stop listening', () => {
    expect(SCARS).toHaveLength(24);
    for (const sc of SCARS) expect(sc.rite.mods.length).toBeGreaterThan(0);
    const s = session();
    for (let i = 0; i < FORSWORN.scars; i++) s.oaths.breakExternal('test');
    expect(s.oaths.forsworn()).toBe(true);
    expect(s.player.devotion.titles).toContain('Forsworn');
    const before = favorOf(s.player, 'solenne');
    s.devotion.apply({ solenne: 50 }, 't', true, true);
    expect(favorOf(s.player, 'solenne')).toBe(before);
    s.devotion.apply({ kael: 50 }, 't', true, true);
    expect(favorOf(s.player, 'kael')).toBeGreaterThan(0);
  });
  it('a readied rite is available once and cleared after the next fight', () => {
    const s = session();
    s.oaths.breakExternal('x');
    expect(s.oaths.ready(SCARS[0]!.id).ok).toBe(true);
    expect(s.oaths.riteMods().length).toBeGreaterThan(0);
    s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.oaths.riteMods()).toHaveLength(0);
    expect(s.oaths.ready(SCARS[5]!.id).ok).toBe(false);
  });
});

describe('Battle Oaths (item 67)', () => {
  it('about a third of the bosses swear one of three oaths', () => {
    const bosses = content.enemies.filter((e) => ['boss', 'worldBoss', 'miniboss'].includes(e.tier));
    const swearers = bosses.filter((b) => oathKindFor(b.id));
    expect(swearers.length).toBeGreaterThanOrEqual(20);
    expect(new Set(swearers.map((b) => oathKindFor(b.id)!.id)).size).toBe(3);
    expect(oathKindFor('not-a-boss')).toBeUndefined();
  });
});

describe('Battle Oaths in a fight', () => {
  it('a boss swears below 60% HP and is Forsworn when the oath is broken', async () => {
    const { createEncounterBattle } = await import('../src/engine/combat/setup');
    const { groupEncounter } = await import('../src/engine/world/world');
    const { Rng } = await import('../src/engine/core/rng');
    const boss = content.enemies.filter((e) => e.tier === 'boss').find((e) => oathKindFor(e.id)?.id === 'crit')!;
    expect(boss).toBeTruthy();
    const b = createEncounterBattle(makeHero(), groupEncounter({ weight: 1, enemies: [{ enemyId: boss.id }] }, 'oath-test', 'Oath test', boss.level, { canFlee: false, isBoss: true }), { rng: new Rng(3) });
    const foe = b.combatants.find((x) => x.kind === 'enemy')!;
    const hero = b.combatants.find((x) => x.kind === 'hero')!;
    foe.hp = Math.floor(foe.maxHp * 0.5);
    b.emit({ type: 'damage', sourceId: hero.id, targetId: foe.id, amount: 1, element: 'physical', crit: false, absorbed: 0 } as never);
    expect(foe.oath?.kind).toBe('crit');
    const defBefore = foe.statInput.modifiers.length;
    b.emit({ type: 'damage', sourceId: hero.id, targetId: foe.id, amount: 1, element: 'physical', crit: true, absorbed: 0 } as never);
    expect(foe.oath?.broken).toBe(true);
    expect(foe.statInput.modifiers.length).toBeGreaterThan(defBefore);
    expect(b.tally.oathsBroken).toBe(1);
  });
});
