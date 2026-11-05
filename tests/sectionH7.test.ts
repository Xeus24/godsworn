import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { DOMAINS, GOD_ZONES, PRAYERS, TWILIGHT_DUNGEONS, UNSWORN_ENDING } from '../src/data/twilight';
import { FESTIVALS } from '../src/data/realm/wheel';
import { festivalOn } from '../src/engine/realm/wheel';
import { fortuneOf } from '../src/engine/realm/fortunes';
import { GameSession } from '../src/engine/state/gameState';
import { generateDungeon, mapFor } from '../src/engine/world/mapgen';
import { makeHero } from './helpers';

const session = (ng = 1, town: string | false = 'brightwater') => {
  const s = GameSession.newGame(51, makeHero());
  s.state.ngPlus = ng;
  (s.world as any).inTown = () => town;
  Object.defineProperty(s.world, 'zone', { get: () => ({ id: 'meadowlands' }), configurable: true });
  s.player.level = 60;
  s.state.gold = 10000000;
  return s;
};
const tick = (s: GameSession, day: number) => {
  s.state.clock.day = day;
  s.bus.emit('timeChanged', { day, hour: 0 } as any);
};
const fadeTo = (s: GameSession, fade: number) => {
  tick(s, 10);
  tick(s, 10 + fade * 2);
};

describe('Twilight Scars and the Twilight of the Wheel (157, 158)', () => {
  it('in New Game+ the gods fade by the day; only then', () => {
    const plain = session(0);
    tick(plain, 10);
    tick(plain, 500);
    expect(plain.twilight.fade('solenne')).toBe(0);
    const s = session();
    tick(s, 10);
    expect(s.twilight.t.start).toBe(10);
    expect(s.twilight.fade('solenne')).toBe(0);
    tick(s, 70);
    expect(s.twilight.fade('solenne')).toBe(30);
    expect(s.twilight.scar('solenne')).toMatch(/rivers/);
    expect(Object.keys(GOD_ZONES)).toHaveLength(14);
  });

  it('festivals of dying gods leave the Wheel, bonds freeze, and their towns decline', () => {
    const s = session();
    const hs = FESTIVALS.find((f) => f.id === 'highsun')!;
    let day = 1;
    while (festivalOn(day)?.id !== 'highsun' && day < 400) day++;
    expect(festivalOn(day)?.id).toBe('highsun');
    const town = s.twilight.townsOf(hs.god)[0]!;
    const before = fortuneOf(s.state.realm.fortunes, town).prosperity;
    fadeTo(s, 65);
    expect(s.twilight.frozen(hs.god)).toBe(true);
    expect(festivalOn(day)).toBeUndefined();
    expect(fortuneOf(s.state.realm.fortunes, town).prosperity).toBeLessThan(before);
    expect(fortuneOf(s.state.realm.fortunes, town).prosperity).toBeGreaterThan(14);
  });

  it('six new dungeons open in the late regions', () => {
    expect(TWILIGHT_DUNGEONS).toHaveLength(6);
    for (const d of TWILIGHT_DUNGEONS) {
      expect(generateDungeon(d).entities.length).toBeGreaterThan(0);
      expect(mapFor(d.zone).entities.some((e) => e.kind === 'dungeon' && e.ref === d.id), d.id).toBe(true);
    }
  });
});

describe('The Last Rites (159)', () => {
  it('a dying god may be saved, inherited or released, each with its own epilogue', () => {
    const s = session();
    expect(s.twilight.rite('solenne', 'saved').ok).toBe(false);
    fadeTo(s, 75);
    expect(s.twilight.dying('solenne')).toBe(true);
    expect(s.twilight.rite('solenne', 'saved').ok).toBe(true);
    expect(s.twilight.fade('solenne')).toBe(0);
    expect(s.twilight.t.slides['solenne']).toHaveLength(3);
    expect(s.twilight.rite('solenne', 'released').ok).toBe(false);
    const before = s.twilight.mods().length;
    expect(s.twilight.rite('thalor', 'inherited').ok).toBe(true);
    expect(s.twilight.mods()).toHaveLength(before + 1);
    expect(DOMAINS['thalor']![0]).toMatch(/Forge/);
    expect(s.twilight.domainTrial('thalor').ok).toBe(true);
    const g = s.state.gold;
    s.specials['twilight']!((s.endgame as any).e.active, true);
    expect(s.state.gold).toBeGreaterThan(g);
    const town = s.twilight.townsOf('hesha')[0]!;
    const p = fortuneOf(s.state.realm.fortunes, town).prosperity;
    expect(s.twilight.rite('hesha', 'released').ok).toBe(true);
    expect(fortuneOf(s.state.realm.fortunes, town).prosperity).toBeGreaterThanOrEqual(p);
    for (const g of s.twilight.gods()) if (!s.twilight.t.rites[g]) s.twilight.rite(g, 'released');
    expect(s.player.devotion.titles).toContain('Keeper of the Last Rites');
  });
});

describe('The Unsworn Ending (160)', () => {
  it('needs Forsworn status, every Lineage page and the whole Cipher; ends the story', () => {
    const s = session();
    expect(s.twilight.canUnsworn().ok).toBe(false);
    s.state.flags['forsworn'] = true;
    s.oaths.o.pages = Array.from({ length: 16 }, (_, i) => `p${i}`) as any;
    (s.oaths as any).cipherDone = () => true;
    expect(s.twilight.canUnsworn().ok).toBe(true);
    for (let i = 0; i < 3; i++) expect(s.twilight.walkUnsworn().ok).toBe(true);
    expect(s.twilight.walkUnsworn().ok).toBe(true);
    s.specials['twilight']!((s.endgame as any).e.active, true);
    expect(s.state.legacy.endings).toContain('unsworn-ending');
    expect(s.state.flags['storyComplete']).toBe(true);
    expect(s.player.devotion.titles).toContain(UNSWORN_ENDING.title);
    expect(s.twilight.canUnsworn().ok).toBe(false);
  });
});

describe('Your Flock (161)', () => {
  it('prayers arrive, answering earns followers, neglect loses them', () => {
    expect(PRAYERS.length).toBeGreaterThanOrEqual(30);
    const s = session();
    for (let d = 1; d <= 30; d++) tick(s, d);
    const fl = s.twilight.t.flock;
    expect(fl.on).toBe(true);
    expect(fl.prayers.length + fl.lost).toBeGreaterThan(0);
    const gold = fl.prayers.find((p) => s.twilight.prayer(p.id)!.kind !== 'check');
    if (gold) expect(s.twilight.answer(gold.id).ok).toBe(true);
    const lost = fl.lost;
    for (let d = 31; d <= 60; d++) tick(s, d);
    expect(fl.lost).toBeGreaterThan(lost);
    expect(s.state.realm.village.coffers).toBeGreaterThan(0);
  });
});

describe('The Conclave and the War of the Wheel (163, 164)', () => {
  it('Grudgebound from five regions march on towns; the town may hold without you', () => {
    const s = session(0);
    const wolf = content.enemies.all().find((e) => e.tier === 'normal')!.id;
    const zones = ['meadowlands', 'whisperwood', 'sunken-caves', 'ashen-desert', 'frostspire'];
    zones.forEach((zone, i) => { s.state.realm.grudge.entries[`g${i}`] = { id: `g${i}`, name: `G${i}`, epithet: 'x', zone, enemyId: wolf, rank: 1, scars: 3, beat: 0, fled: 0, traits: [], cause: 'beat', born: 1 }; });
    expect(s.twilight.conclaveOn()).toBe(true);
    tick(s, 7);
    const a = s.twilight.t.conclave.active!;
    expect(a).toBeTruthy();
    expect(a.strength).toBeGreaterThan(10);
    (s.world as any).inTown = () => (a.town === 'ashfold' ? 'saltmere' : 'ashfold');
    expect(s.twilight.defend().ok).toBe(false);
    expect(s.twilight.delegate().ok).toBe(true);
    expect(s.twilight.t.conclave.active).toBeUndefined();
    tick(s, 14);
    (s.world as any).inTown = () => s.twilight.t.conclave.active!.town;
    expect(s.twilight.defend().ok).toBe(true);
  });

  it('three fronts, one led each turn', () => {
    const s = session(0);
    expect(s.twilight.warStart().ok).toBe(true);
    expect(s.twilight.warStart().ok).toBe(false);
    let last = '';
    for (let i = 0; i < 12 && s.twilight.t.war.active; i++) {
      const r = s.twilight.warLead(i % 3);
      last = r.ok ? r.text : '';
    }
    expect(s.twilight.t.war.active).toBeUndefined();
    expect(last).toMatch(/war is (won|lost)/);
    s.player.level = 10;
    expect(s.twilight.warStart().ok).toBe(false);
  });
});

describe('the Nameless Chapter and the Mirror Pilgrimage (162, 165)', () => {
  it('open after the story ends; the mirror speaks of your own rival', () => {
    const s = session(0, false);
    expect(s.tales.startable('nameless-chapter').ok).toBe(false);
    expect(s.tales.startable('mirror-pilgrimage').ok).toBe(false);
    s.state.flags['storyComplete'] = true;
    for (const id of ['nameless-chapter', 'mirror-pilgrimage']) {
      const tale = s.tales.tale(id)!;
      for (let i = 0; i < 12 && s.tales.progress(id)?.done === undefined; i++) {
        const opts = s.tales.options(id);
        expect(opts.length, id).toBeGreaterThan(0);
        expect(s.tales.choose(id, opts[0]!.index).ok).toBe(true);
      }
      expect(s.tales.progress(id)!.done, tale.name).toBeDefined();
      expect(s.tales.progress(id)!.log.join(' ')).not.toMatch(/\{rival\}/);
    }
    expect(s.player.devotion.titles).toContain('Reader of the Nameless Chapter');
  });
});

describe('Archivist’s Trials (166)', () => {
  it('ten questions about your own run, rewards by accuracy, once a year', () => {
    const s = session(0, false);
    (s.world as any).inTown = () => s.tales.quillTown();
    const q = s.tales.archive();
    expect(q).toHaveLength(10);
    const g = s.state.gold;
    const r = s.tales.answerArchive(q.map((x) => x.right));
    expect(r.ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.player.devotion.titles).toContain('Keeper of Your Own Record');
    expect(s.tales.answerArchive(q.map((x) => x.right)).ok).toBe(false);
  });
});

describe('Sea and Sky Finale (167)', () => {
  it('needs both raiders at the height of their grudge, then they sail together', () => {
    const s = session(0, 'saltmere');
    expect(s.civic.finale().ok).toBe(false);
    s.civic.raider('harrow').scars = 8;
    expect(s.civic.finaleReady()).toBe(false);
    s.civic.raider('vessa').scars = 8;
    expect(s.civic.finaleReady()).toBe(true);
    expect(s.civic.finale().ok).toBe(true);
    s.specials['seasky']!((s.endgame as any).e.active, true);
    expect(s.civic.raider('harrow').slain).toBeDefined();
    expect(s.civic.raider('vessa').slain).toBeDefined();
    expect(s.player.devotion.titles).toContain('Master of Sea and Sky');
    expect(s.civic.finaleReady()).toBe(false);
  });
});
