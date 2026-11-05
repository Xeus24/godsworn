import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BOOKS, CANALS, CLANS, GALLERY, HOURGLASS, MASQUE, POCKET_AREAS, POCKET_DUNGEONS, WILDS, WILDS_HOLLOW } from '../src/data/pockets';
import { covenantGain } from '../src/engine/combat/covenant';
import { characterModifiers } from '../src/engine/character/stats';
import { heartOf } from '../src/engine/heart/heart';
import { GameSession } from '../src/engine/state/gameState';
import { generateArea, generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(111, makeHero());
  s.player.level = 40;
  s.state.gold = 10000000;
  return s;
};
const at = (s: GameSession, map: string) => {
  s.state.world.position = { map, x: 1, y: 1 };
  s.pockets.onMap(map);
};
const hours = (s: GameSession, n: number) => {
  s.advanceTime(n * 60);
};

describe('content: pocket regions, the Godless Wilds and the new dungeons', () => {
  it('six pocket regions (Cinderhollow has two faces), six Wilds maps and eight dungeons, all with maps and entrances', () => {
    expect(POCKET_AREAS.filter((a) => !a.id.startsWith('godless'))).toHaveLength(7);
    expect(WILDS).toHaveLength(6);
    expect(POCKET_DUNGEONS).toHaveLength(8);
    for (const a of POCKET_AREAS) {
      expect(generateArea(a).entities.some((e) => e.kind === 'exit')).toBe(true);
      if (!a.hidden) expect(mapFor(a.zone).entities.some((e) => e.kind === 'area' && e.ref === a.id), a.id).toBe(true);
    }
    for (const d of POCKET_DUNGEONS) {
      expect(generateDungeon(d).entities.length).toBeGreaterThan(0);
      expect(mapFor(d.zone).entities.some((e) => e.kind === 'dungeon' && e.ref === d.id), d.id).toBe(true);
    }
    expect(content.enemies.get('severance-engine')).toBeTruthy();
  });
});

describe('The Godless Wilds (item 99)', () => {
  it('silences blessings, Sigils and Covenant Chains, and the cold bites unless you are prepared', () => {
    const s = session();
    at(s, WILDS[0]!);
    expect(s.player.world.godless).toBe(true);
    expect(characterModifiers(s.player).some((m) => /^(blessing|sigil):/.test(m.source ?? ''))).toBe(false);
    const cov = { gauge: 0, ready: false, locked: true } as any;
    covenantGain({ covenant: cov, log: () => {} } as any, 50);
    expect(cov.gauge).toBe(0);
    expect(s.pockets.step(WILDS[0]!).harm).toBeGreaterThan(0);
    const h = heartOf(s.player);
    for (const k of ['a', 'b', 'c', 'd', 'e', 'f']) h.adopted[k] = 1;
    expect(s.pockets.step(WILDS[0]!).harm ?? 0).toBe(0);
    for (const w of WILDS) at(s, w);
    expect(s.player.devotion.titles).toContain('Walked Godless');
    at(s, 'meadowlands');
    expect(s.player.world.godless).toBeUndefined();
    at(s, WILDS_HOLLOW);
    expect(s.player.world.godless).toBe(true);
  });
});

describe('Lanternmarch (item 100)', () => {
  it('your lamp burns by the hour, the Wick-Eaters come when it dies, and oil sends them away', () => {
    const s = session();
    at(s, 'lanternmarch');
    expect(s.pockets.p.oil).toBe(6);
    hours(s, 3);
    expect(s.pockets.p.oil).toBe(3);
    for (let i = 0; i < 40 && !s.pockets.p.hunted; i++) hours(s, 8);
    expect(s.pockets.p.oil).toBe(0);
    expect(s.pockets.p.hunted).toBe(true);
    expect(s.pockets.buyOil(4).ok).toBe(true);
    expect(s.pockets.p.hunted).toBe(false);
    s.pockets.p.hunted = true;
    expect(s.pockets.faceWicks().ok).toBe(true);
    s.specials['pocket']!((s.endgame as any).e.active, true);
    expect(s.player.devotion.titles).toContain('Keeper of the Last Light');
    at(s, 'meadowlands');
    expect(s.pockets.buyOil(1).ok).toBe(false);
  });
});

describe('The Ossuary Coast and the Weeping Steppe (items 101, 102)', () => {
  it('whale marrow is mined and worked into charms', () => {
    const s = session();
    (s.player.allocated as any).str = 80;
    at(s, 'ossuary-coast');
    for (let i = 0; i < 30; i++) s.pockets.mineMarrow();
    expect(s.pockets.p.marrow).toBeGreaterThan(8);
    const hp = characterModifiers(s.player).length;
    expect(s.pockets.wright().ok).toBe(true);
    expect(s.pockets.p.wrights).toBe(1);
    expect(s.pockets.mods().length).toBe(1);
    expect(hp).toBeGreaterThan(0);
    const left = s.pockets.p.marrow;
    expect(s.pockets.sellMarrow().ok).toBe(left > 0);
  });

  it('clans camp somewhere new every three days; guest-gifts earn boons; the steppe is mounted', () => {
    const s = session();
    at(s, 'weeping-steppe');
    s.state.clock.day = 3;
    const c0 = s.pockets.camp(0);
    s.state.clock.day = 6;
    expect(s.pockets.camp(0)).not.toBe(c0);
    const clan = CLANS[0]!.id;
    for (let i = 0; i < 3; i++) {
      s.state.clock.day = 3 * (i + 10);
      expect(s.pockets.host(clan).ok).toBe(true);
      expect(s.pockets.host(clan).ok).toBe(false);
    }
    expect(s.pockets.mods().length).toBeGreaterThanOrEqual(3);
    at(s, 'meadowlands');
    expect(s.pockets.mods().length).toBe(1);
    expect(s.pockets.host(clan).ok).toBe(false);
  });
});

describe('The Verdigris Canals (item 103)', () => {
  it('forty bridges; lowering them joins the gate to the Exchange, which pays once a tide', () => {
    const s = session();
    at(s, 'verdigris-canals');
    expect(s.pockets.bridges()).toHaveLength(CANALS.bridges);
    for (let i = 0; i < CANALS.bridges; i++) if (s.pockets.bridges()[i]) s.pockets.toggleBridge(i);
    expect(s.pockets.connected()).toBe(true);
    const g = s.state.gold;
    expect(s.pockets.crossToExchange().ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.pockets.crossToExchange().ok).toBe(false);
    s.state.clock.day += CANALS.tideDays;
    s.advanceTime(60);
    expect(s.pockets.bridges().filter(Boolean).length).toBeGreaterThanOrEqual(CANALS.autoRaise - 1);
  });
});

describe('Cinderhollow and the Inverted Library (items 104, 105)', () => {
  it('burns by day and regrows by night, with different harvests', () => {
    const s = session();
    s.state.clock.minute = 8 * 60;
    expect(s.pockets.redirect('cinderhollow-day')).toBe('cinderhollow-day');
    at(s, 'cinderhollow-day');
    const hp = s.player.hp;
    expect(s.pockets.gatherAsh().ok).toBe(true);
    expect(s.player.hp).toBeLessThan(hp);
    expect(s.pockets.gatherBloom().ok).toBe(false);
    s.advanceTime(14 * 60);
    expect(s.pockets.layout()).toBe('grown');
    expect(s.pockets.here()).toBe('cinderhollow-night');
    expect(s.pockets.redirect('cinderhollow-day')).toBe('cinderhollow-night');
    expect(s.pockets.gatherBloom().ok).toBe(true);
  });

  it('twelve books, half on the ceiling: flip gravity to read them all', () => {
    const s = session();
    at(s, 'inverted-library');
    expect(BOOKS).toHaveLength(12);
    for (const b of BOOKS) {
      if (!s.pockets.canRead(b.id)) s.pockets.flipGravity();
      expect(s.pockets.readBook(b.id).ok, b.id).toBe(true);
    }
    expect(s.player.devotion.titles).toContain('Reader Who Fell Upward');
    expect(s.pockets.mods().length).toBe(1);
  });
});

describe('the seven dungeons (items 106-112)', () => {
  it('Bellhouse: bells show paths; too much noise wakes the Wardens; hushing calms them', () => {
    const s = session();
    at(s, 'bellhouse');
    for (let i = 0; i < 4; i++) s.pockets.ring();
    expect(s.pockets.p.bells.paths).toBe(4);
    s.pockets.hush();
    expect(s.pockets.p.bells.noise).toBe(50);
    const g = s.state.gold;
    s.pockets.ring();
    expect(s.pockets.p.bells.done).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    s.pockets.ring();
    s.pockets.ring();
    expect((s.endgame as any).e.active?.special?.ref).toBe('wardens');
  });

  it('Saltmother’s Throat: wade only on the ebb', () => {
    const s = session();
    at(s, 'saltmothers-throat');
    s.state.world.dsteps = 0;
    for (let i = 0; i < 6; i++) expect(s.pockets.wade().ok).toBe(true);
    expect(s.pockets.p.throat.done).toBe(true);
    s.state.world.dsteps = 4;
    expect(s.pockets.breath()).toBe('flow');
    const hp = s.player.hp;
    s.pockets.wade();
    expect(s.player.hp).toBeLessThan(hp);
  });

  it('Paper Labyrinth: burning is temporary, an Inkweaver’s lines stay', () => {
    const s = session();
    at(s, 'paper-labyrinth');
    for (let i = 0; i < 3; i++) s.pockets.burnWall();
    s.state.world.dsteps = 20;
    expect(s.pockets.step('paper-labyrinth')).toEqual({});
    expect(s.pockets.p.paper.prog).toBe(2);
    expect(s.pockets.drawShortcut().ok).toBe(false);
    s.player.classes[0]!.classId = 'inkweaver';
    s.pockets.drawShortcut();
    s.pockets.drawShortcut();
    expect(s.pockets.p.paper.shortcuts).toBe(2);
    expect(s.pockets.burnWall().ok).toBe(true);
    expect(s.pockets.paperOpen()).toBe(true);
    expect(s.pockets.p.paper.done).toBe(true);
  });

  it('Hourglass Vault: turning a room turns its neighbour, and the doors open when every glass runs one way', () => {
    const s = session();
    at(s, 'hourglass-vault');
    expect(s.pockets.hourglass()).toHaveLength(HOURGLASS.rooms);
    expect(s.pockets.hourglass().every(Boolean)).toBe(false);
    for (let pass = 0; pass < 6 && !s.pockets.p.hourglass.done; pass++) for (let i = 0; i < HOURGLASS.rooms; i++) if (!s.pockets.hourglass()[i] && !s.pockets.p.hourglass.done) s.pockets.flipRoom(i);
    expect(s.pockets.hourglass().every(Boolean)).toBe(true);
    expect(s.pockets.p.hourglass.done).toBe(true);
  });

  it('Masque Catacombs: the right mask hides you from each ghost, the wrong one costs HP', () => {
    const s = session();
    at(s, 'masque-catacombs');
    s.pockets.wearMask((s.pockets.hidingMask(0) + 1) % 4);
    const hp = s.player.hp;
    s.pockets.passGhost();
    expect(s.player.hp).toBeLessThan(hp);
    for (let r = 0; r < MASQUE.rooms; r++) {
      s.pockets.wearMask(s.pockets.hidingMask(r));
      expect(s.pockets.passGhost().ok).toBe(true);
    }
    expect(s.pockets.p.masque.done).toBe(true);
  });

  it('Gallery of Stolen Faces: choose the painting that does not blink; a wrong guess brings out a foe', () => {
    const s = session();
    at(s, 'gallery-of-stolen-faces');
    const wrong = (s.pockets.realFrame(0) + 1) % GALLERY.frames;
    s.pockets.chooseFrame(wrong);
    expect((s.endgame as any).e.active?.special?.ref).toBe('gallery');
    (s.endgame as any).e.active = undefined;
    expect(s.pockets.inspect().includes(s.pockets.realFrame(0))).toBe(true);
    for (let r = 0; r < GALLERY.rooms; r++) s.pockets.chooseFrame(s.pockets.realFrame(r));
    expect(s.pockets.p.gallery.done).toBe(true);
  });

  it('Old Wick’s Chapel: the candle is the clock, and the boss is the candle', () => {
    const s = session();
    at(s, 'old-wicks-chapel');
    expect(s.pockets.p.wick.wax).toBe(6);
    hours(s, 2);
    expect(s.pockets.p.wick.wax).toBe(4);
    hours(s, 10);
    expect(s.pockets.p.wick.wax).toBe(0);
    expect(s.pockets.step('old-wicks-chapel').harm).toBeGreaterThan(0);
    expect(s.pockets.relight().ok).toBe(true);
    expect(s.pockets.p.wick.wax).toBe(6);
    expect(s.pockets.faceCandle().ok).toBe(true);
    const g = s.state.gold;
    s.specials['pocket']!((s.endgame as any).e.active, true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.pockets.p.wick.done).toBe(true);
  });
});
