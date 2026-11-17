import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ContentTable } from '../src/engine/content/registry';
import { leafText } from '../src/engine/locks/locks';
import type { Cond } from '../src/engine/quests/types';
import { deserialize, serialize } from '../src/engine/state/save';
import { GameSession, SAVE_VERSION } from '../src/engine/state/gameState';
import { lockReachability } from '../scripts/lockgraph';
import { makeHero } from './helpers';

const newSession = (): GameSession => GameSession.newGame(1, makeHero({ classId: 'warrior' }));

/** Saves and loads, as the game does. */
function reload(s: GameSession): GameSession {
  const r = deserialize(serialize(s));
  if (!r.ok) throw new Error(r.reason);
  return new GameSession(r.state);
}

describe('systems and their guides', () => {
  it('every system has exactly one lock that exists, and one guide of 2 to 5 steps', () => {
    const owners = new Map<string, string>();
    for (const sys of content.systems.all()) {
      expect(content.locks.find(sys.lock), sys.id).toBeDefined();
      expect(owners.has(sys.lock), `${sys.id} shares ${sys.lock}`).toBe(false);
      owners.set(sys.lock, sys.id);
      expect(sys.steps.length).toBeGreaterThanOrEqual(2);
      expect(sys.steps.length).toBeLessThanOrEqual(5);
    }
  });
});

describe('lock graph', () => {
  it('every lock can be opened from a new game, with no circular needs', () => {
    const g = lockReachability();
    expect(g.cycles).toEqual([]);
    expect(g.unreachable).toEqual([]);
  });

  it('catches a cycle and a lock that can never open', () => {
    const base = content.locks.all();
    const extra = [
      { ...base[0]!, id: 'test:a', requirement: { kind: 'unlocked', lock: 'test:b' } as Cond },
      { ...base[0]!, id: 'test:b', requirement: { kind: 'unlocked', lock: 'test:a' } as Cond },
      { ...base[0]!, id: 'test:c', requirement: { kind: 'level', min: 999 } as Cond },
    ];
    const g = lockReachability({ ...content, locks: new ContentTable('lock', [...base, ...extra]) });
    expect(g.cycles.length).toBeGreaterThan(0);
    expect(g.unreachable).toEqual(['test:a', 'test:b', 'test:c']);
  });
});

describe('the mentor’s guides', () => {
  it('a new hero is offered the battle guide at once', () => {
    const s = newSession();
    expect(s.guide.current()?.def.id).toBe('combat');
  });

  it('a step the hero acts out finishes itself; the last step marks the guide seen', () => {
    const s = newSession();
    s.bus.emit('combatStarted', { encounterId: 'x' });
    expect(s.guide.current()?.index).toBe(1);
    s.bus.emit('combatEnded', { encounterId: 'x', result: 'victory' });
    expect(s.guide.current()?.index).toBe(2);
    s.guide.next();
    expect(s.guide.isSeen('combat')).toBe(true);
    expect(s.guide.current()).toBeUndefined();
  });

  it('opens with the lock: reaching level 2 offers Body and Mind (queued behind the guide on screen)', () => {
    const s = newSession();
    s.player.level = 2;
    s.bus.emit('stateChanged', { reason: 'test' });
    expect(s.guide.current()?.def.id).toBe('combat');
    s.guide.skip();
    expect(s.guide.isSeen('combat')).toBe(true);
    expect(['attributes', 'skills']).toContain(s.guide.current()?.def.id);
  });

  it('a guide that starts on a view waits for the hero to open it', () => {
    const s = newSession();
    s.guide.skip();
    expect(s.guide.current()).toBeUndefined();
    s.guide.viewed('nav:inventory');
    expect(s.guide.current()?.def.id).toBe('gear');
  });

  it('skipping leaves a valid game: nothing is blocked, and the Primer can replay it', () => {
    const s = newSession();
    s.guide.skip();
    expect(s.guide.isSeen('combat')).toBe(true);
    s.guide.replay('combat');
    expect(s.guide.current()?.def.id).toBe('combat');
    expect(s.guide.current()?.index).toBe(0);
    s.guide.next();
    s.guide.next();
    s.guide.next();
    expect(s.guide.current()).toBeUndefined();
    expect(s.guide.known().map((x) => x.id)).toContain('combat');
  });

  it('reloading mid-guide offers it again from the start; finished guides stay finished', () => {
    const s = newSession();
    s.bus.emit('combatStarted', { encounterId: 'x' });
    expect(s.guide.current()?.index).toBe(1);
    const back = reload(s);
    expect(back.guide.current()?.def.id).toBe('combat');
    expect(back.guide.current()?.index).toBe(0);
    back.guide.skip();
    const again = reload(back);
    expect(again.guide.isSeen('combat')).toBe(true);
    expect(again.guide.current()).toBeUndefined();
  });
});

describe('save version 26', () => {
  it('an old save gains the guide record, keeps every bit of progress, and is not flooded with guides', () => {
    const s = newSession();
    s.player.level = 12;
    s.state.gold = 4321;
    s.state.unlocks.opened = {};
    s.bus.emit('stateChanged', { reason: 'test' });
    const raw = JSON.parse(serialize(s)) as { state: Record<string, unknown> };
    delete raw.state.guide;
    delete raw.state.unlocks;
    (raw.state.meta as { version: number }).version = 25;
    const r = deserialize(JSON.stringify(raw));
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.meta.version).toBe(SAVE_VERSION);
    const back = new GameSession(r.state);
    expect(back.player.level).toBe(12);
    expect(back.state.gold).toBe(4321);
    expect(back.locks.isOpen('reveal:tab:skills')).toBe(true);
    expect(back.state.unlocks.opened['system:attributes']).toBeDefined();
    // Everything the hero already had is settled as seen: no wall of guides on loading an old hero.
    expect(back.guide.current()).toBeUndefined();
    expect(back.guide.isSeen('attributes')).toBe(true);
    expect(back.guide.known().length).toBeGreaterThan(3);
  });

  it('a new save round-trips its locks and guides', () => {
    const s = newSession();
    s.guide.skip();
    s.player.level = 2;
    s.bus.emit('stateChanged', { reason: 'test' });
    const back = reload(s);
    expect(back.state.unlocks.opened).toEqual(s.state.unlocks.opened);
    expect(back.state.guide.seen).toEqual(s.state.guide.seen);
  });
});

/** Player-facing words that break the world: meta terms and the names of other games. */
const BANNED = [
  /\btutorials?\b/i, /\bunlock(s|ed|ing)?\b/i, /\blocked\b/i, /\blevel gate/i, /\bXP\b/, /\bexperience points\b/i,
  /\bNG\+/, /New Game\+/i, /\bfeatures?\b/i, /\bclick/i, /\bbutton\b/i, /\bmenu\b/i,
  /idleon/i, /perfect tower/i, /diablo/i, /path of exile/i, /final fantasy/i, /dark souls/i, /elden ring/i, /skyrim/i,
  /warcraft/i, /zelda/i, /pok[eé]mon/i, /baldur/i, /dungeons (and|&) dragons/i, /\bD&D\b/, /runescape/i, /minecraft/i,
  /hollow knight/i, /dragon quest/i, /fire emblem/i, /monster hunter/i, /stardew/i,
];

function leaves(c: Cond, out: Cond[] = []): Cond[] {
  if (c.kind === 'all' || c.kind === 'any') c.conds.forEach((x) => leaves(x, out));
  else if (c.kind === 'not') leaves(c.cond, out);
  else out.push(c);
  return out;
}

describe('wording', () => {
  it('no lock or guide text uses meta terms or names another game', () => {
    const strings: [string, string][] = [];
    for (const l of content.locks.all()) {
      strings.push([`${l.id} hint`, l.hint], [`${l.id} message`, l.unlockMessage]);
      for (const leaf of leaves(l.requirement)) strings.push([`${l.id} needs`, leafText(leaf)]);
    }
    for (const sys of content.systems.all()) {
      strings.push([`${sys.id} name`, sys.name], [`${sys.id} mentor`, sys.mentor], [`${sys.id} summary`, sys.summary]);
      sys.steps.forEach((st, i) => strings.push([`${sys.id} step ${i + 1}`, st.text]));
    }
    const bad = strings.filter(([, text]) => BANNED.some((re) => re.test(text))).map(([where, text]) => `${where}: ${text}`);
    expect(bad).toEqual([]);
  });
});
