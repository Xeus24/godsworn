import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { validateContent } from '../src/data';
import { dungeonShut, evaluateLock, isUnlocked, lockControl, visibleLocks } from '../src/engine/locks/locks';
import { classSlotCount } from '../src/engine/character/multiclass';
import { raceUnlocked } from '../src/engine/character/races';
import { migrate } from '../src/engine/state/save';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(1, makeHero({ classId: 'warrior' }));

describe('locks', () => {
  it('content validates with locks', () => expect(() => validateContent()).not.toThrow());

  it('a fresh hero has the level locks shut, with what is missing and how far along', () => {
    const s = newSession();
    const st = evaluateLock(s.state, 'reveal:tab:general');
    expect(st.unlocked).toBe(false);
    expect(st.missing.join(' ')).toContain('Reach level 5');
    expect(st.progress.find((p) => p.label === 'Level 5')).toEqual({ label: 'Level 5', have: s.player.level, need: 5 });
  });

  it('opens at the level, toasts once, and records the day', () => {
    const s = newSession();
    const toasts: string[] = [];
    s.bus.on('toast', (t) => toasts.push(t.text));
    s.player.level = 5;
    s.bus.emit('stateChanged', { reason: 'test' });
    expect(s.state.unlocks.opened['reveal:tab:general']).toBeDefined();
    expect(toasts.filter((t) => t.includes('general skills'))).toHaveLength(1);
    s.bus.emit('stateChanged', { reason: 'test' });
    expect(toasts.filter((t) => t.includes('general skills'))).toHaveLength(1);
  });

  it('stays open once opened', () => {
    const s = newSession();
    s.player.level = 5;
    s.locks.sync();
    s.player.level = 1;
    expect(isUnlocked(s.state, 'reveal:tab:general')).toBe(true);
  });

  it('any: endgame opens by NG+, an ending, or the level cap', () => {
    const s = newSession();
    expect(isUnlocked(s.state, 'endgame')).toBe(false);
    expect(evaluateLock(s.state, 'endgame').missing).toHaveLength(1);
    s.player.level = s.state.levelCap;
    expect(isUnlocked(s.state, 'endgame')).toBe(true);
  });

  it('the developer switch opens every lock without recording it', () => {
    const s = newSession();
    lockControl.ignore = true;
    try {
      expect(isUnlocked(s.state, 'endgame')).toBe(true);
      expect(Object.keys(s.state.unlocks.opened)).toHaveLength(0);
    } finally {
      lockControl.ignore = false;
    }
  });

  it('unlockAll and reset', () => {
    const s = newSession();
    s.locks.unlockAll();
    expect(Object.keys(s.state.unlocks.opened)).toHaveLength(content.locks.all().length);
    s.locks.reset();
    expect(s.state.unlocks.opened['endgame']).toBeUndefined();
  });

  it('teased locks show while shut; the list shrinks as they open', () => {
    const s = newSession();
    const before = visibleLocks(s.state).length;
    s.player.level = 10;
    expect(visibleLocks(s.state).length).toBeLessThan(before);
  });

  it('a pre-lock save is migrated and grandfathered silently', () => {
    const s = newSession();
    s.player.level = 12;
    const raw = JSON.parse(JSON.stringify(s.state)) as Record<string, unknown>;
    delete raw.unlocks;
    const migrated = migrate(raw) as unknown as typeof s.state;
    expect(migrated.unlocks.grandfathered).toBe(false);
    const loaded = new GameSession(migrated);
    const toasts: string[] = [];
    loaded.bus.on('toast', (t) => toasts.push(t.text));
    expect(loaded.state.unlocks.grandfathered).toBe(true);
    expect(loaded.state.unlocks.opened['reveal:codex:ship']).toBeDefined();
    expect(toasts).toHaveLength(0);
  });

  it('class slots: the second opens at 15, the third by the errand at 45 or by NG+2 at 40', () => {
    const s = newSession();
    expect(isUnlocked(s.state, 'class:second')).toBe(false);
    s.player.level = 15;
    expect(isUnlocked(s.state, 'class:second')).toBe(true);
    s.player.level = 45;
    expect(isUnlocked(s.state, 'class:third')).toBe(false);
    expect(evaluateLock(s.state, 'class:third').missing.join(' ')).toContain('Amara');
    s.player.thirdSlot = true;
    expect(isUnlocked(s.state, 'class:third')).toBe(true);
  });

  it('third slot by New Game+2 at level 40, and the lock agrees with classSlotCount', () => {
    const s = newSession();
    s.player.level = 40;
    s.state.ngPlus = 2;
    expect(isUnlocked(s.state, 'class:third')).toBe(true);
    expect(classSlotCount(s.player, s.state.ngPlus)).toBe(3);
  });

  it('secret classes are hidden locks that open with their questline', () => {
    const s = newSession();
    const secret = content.classes.all().find((k) => k.hidden);
    expect(secret).toBeDefined();
    const id = `class:secret:${secret?.id}`;
    expect(content.locks.get(id).visibility).toBe('hidden');
    expect(visibleLocks(s.state).some((l) => l.id === id)).toBe(false);
    s.player.unlockedClasses.push(secret?.id ?? '');
    expect(isUnlocked(s.state, id)).toBe(true);
  });

  it('race locks follow the profile: New Game+ tiers and finishing the story', () => {
    const gnome = content.races.all().find((r) => r.unlock && 'ngPlus' in r.unlock);
    const clear = content.races.all().find((r) => r.unlock && 'clear' in r.unlock);
    expect(gnome && raceUnlocked(gnome, 0)).toBe(false);
    expect(gnome && raceUnlocked(gnome, 10)).toBe(true);
    expect(clear && raceUnlocked(clear, 0, false)).toBe(false);
    expect(clear && raceUnlocked(clear, 0, true)).toBe(true);
    expect(clear && raceUnlocked(clear, 1, false)).toBe(true);
  });

  it('every NG+ class and every unlock-gated race has a lock with a hint', () => {
    for (const k of content.classes.all()) if (k.ngPlus) expect(content.locks.get(`class:ngplus:${k.id}`).hint.length).toBeGreaterThan(10);
    for (const r of content.races.all()) if (r.unlock) expect(content.locks.get(`race:${r.id}`).hint.length).toBeGreaterThan(10);
  });
});

describe('world locks: dungeons and the sea', () => {
  it('every hard dungeon with ordinary neighbours is a capstone lock', () => {
    const hard = content.dungeons.all().filter((d) => d.hard && content.dungeons.all().some((x) => x.zone === d.zone && !x.hard && !x.late));
    expect(hard.length).toBeGreaterThan(5);
    for (const d of hard) expect(content.locks.find(`dungeon:${d.id}`)).toBeDefined();
  });

  it('a hard dungeon opens after its zone\'s ordinary dungeons are cleared, and its door says why', () => {
    const s = newSession();
    const d = content.dungeons.get('gilded-vault');
    const before = content.dungeons.all().filter((x) => x.zone === d.zone && !x.hard && !x.late);
    expect(dungeonShut(s.state, d.id)).toContain('Clear');
    for (const x of before) s.state.world.dungeonsCleared.push(x.id);
    expect(dungeonShut(s.state, d.id)).toBeUndefined();
  });

  it('ports: ship level and voyages are locks, shown in the same words', () => {
    const s = newSession();
    expect(isUnlocked(s.state, 'sea:gull-rock')).toBe(false);
    s.player.world.ship = { level: 1, airship: false, voyages: 0 };
    expect(isUnlocked(s.state, 'sea:gull-rock')).toBe(true);
    expect(isUnlocked(s.state, 'sea:kelp-hollow:chart')).toBe(false);
    s.player.world.ship.voyages = 1;
    expect(isUnlocked(s.state, 'sea:kelp-hollow:chart')).toBe(true);
    s.player.world.ship.voyages = 0;
    expect(isUnlocked(s.state, 'sea:pirates-rest:chart')).toBe(false);
    expect(evaluateLock(s.state, 'sea:pirates-rest:chart').progress[0]).toEqual({ label: 'Voyages', have: 0, need: 2 });
    expect(isUnlocked(s.state, 'sea:cloud-orchard')).toBe(false);
    s.player.world.ship.airship = true;
    expect(isUnlocked(s.state, 'sea:cloud-orchard')).toBe(true);
  });
});

describe('crafting and gear locks', () => {
  it('cooking, blacksmithing and alchemy have no bench lock; the rest are teased until you have been there', () => {
    expect(content.locks.find('craft:profession:blacksmithing')).toBeUndefined();
    const s = newSession();
    expect(isUnlocked(s.state, 'craft:profession:enchanting')).toBe(false);
    s.state.world.fog['ashen-desert'] = '0';
    s.player.level = 9;
    expect(isUnlocked(s.state, 'craft:profession:enchanting')).toBe(false);
    s.player.level = 10;
    expect(isUnlocked(s.state, 'craft:profession:enchanting')).toBe(true);
  });

  it('learning a shut profession is refused with the hint; one you already practise stays open', () => {
    const s = newSession();
    Object.defineProperty(s.world, 'inTown', { value: () => 'brightwater' });
    const r = s.economy.learnProfession('jewelcrafting');
    expect(r.ok).toBe(false);
    s.player.crafting.professions.jewelcrafting = { level: 1, xp: 0 };
    expect(isUnlocked(s.state, 'craft:profession:jewelcrafting')).toBe(true);
  });

  it('upgrading past +5 needs a craft at 10, past +10 needs 25; gear already past it grandfathers the hero', () => {
    const s = newSession();
    expect(isUnlocked(s.state, 'craft:upgrade:6')).toBe(false);
    s.player.crafting.professions.blacksmithing = { level: 10, xp: 0 };
    expect(isUnlocked(s.state, 'craft:upgrade:6')).toBe(true);
    expect(isUnlocked(s.state, 'craft:upgrade:11')).toBe(false);
    const sword = s.player.equipment.mainHand;
    expect(sword).toBeDefined();
    if (sword) sword.upgrade = 11;
    expect(isUnlocked(s.state, 'craft:upgrade:11')).toBe(true);
  });

  it('the upgrade service refuses +6 without the skill and says why', () => {
    const s = newSession();
    const sword = s.player.equipment.mainHand;
    if (!sword) throw new Error('no weapon');
    sword.upgrade = 5;
    s.state.gold = 1e6;
    const r = s.economy.upgrade({ where: 'equipment', slot: 'mainHand' });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).toContain('level 10');
  });
});
