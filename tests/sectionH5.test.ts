import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { GREATER_CLASSES } from '../src/data/classesGreater';
import { TALES } from '../src/data/tales';
import { TEMPT } from '../src/engine/state/talesActions';
import { GameSession } from '../src/engine/state/gameState';
import { makeHero } from './helpers';

const session = (town = 'brightwater', zone = 'meadowlands') => {
  const s = GameSession.newGame(21, makeHero());
  const where = { town, zone };
  (s.world as any).inTown = () => where.town;
  Object.defineProperty(s.world, 'zone', { get: () => ({ id: where.zone }), configurable: true });
  s.player.level = 40;
  s.state.gold = 1000000;
  for (const k of ['str', 'dex', 'int', 'wis', 'cha'] as const) (s.player.allocated as any)[k] = 60;
  return Object.assign(s, { go: (t: string, z: string) => { where.town = t; where.zone = z; } });
};
const pick = (s: ReturnType<typeof session>, id: string, label: string) => {
  const i = s.tales.options(id).find((x) => x.opt.l === label)?.index;
  expect(i, `${id}: ${label}`).toBeDefined();
  return s.tales.choose(id, i as number);
};

describe('the tales are well formed', () => {
  it('thirteen tales, every step reachable, every place and god real', () => {
    expect(TALES.map((t) => t.no).sort()).toEqual([128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 139, 141, 150]);
    for (const t of TALES) {
      expect(t.steps[t.first], t.id).toBeTruthy();
      const where = [t.where, ...Object.values(t.steps).map((x) => x.at ?? {})];
      for (const w of where) {
        if (w.town) expect(content.towns.find(w.town), `${t.id} ${w.town}`).toBeTruthy();
        if (w.zone) expect(content.zones.find(w.zone), `${t.id} ${w.zone}`).toBeTruthy();
      }
      for (const step of Object.values(t.steps)) {
        expect(step.opts.length, t.id).toBeGreaterThan(0);
        for (const o of step.opts) {
          for (const n of [o.n, o.fn]) if (n) expect(t.steps[n], `${t.id} -> ${n}`).toBeTruthy();
          for (const f of [...(o.fx ?? []), ...(o.ff ?? [])]) {
            if (f[0] === 'favor') expect(content.gods.find(f[1]), `${t.id} ${f[1]}`).toBeTruthy();
            if (f[0] === 'rep') expect(content.factions.find(f[1]), `${t.id} ${f[1]}`).toBeTruthy();
          }
        }
      }
    }
  });
});

describe('the tales play', () => {
  it('The Honest Thief: paying his debt is remembered', () => {
    const s = session('khazrum', 'khazrum');
    const g = s.state.gold;
    expect(pick(s, 'honest-thief', 'Pay the debt').ok).toBe(true);
    expect(s.state.gold).toBeLessThan(g);
    expect(s.player.devotion.titles).toContain('The Orphans’ Bread');
    expect(s.tales.progress('honest-thief')!.done).toBeDefined();
    expect(s.tales.mods()).toHaveLength(1);
    expect(s.tales.choose('honest-thief', 0).ok).toBe(false);
  });

  it('places matter: a tale starts only where it lives', () => {
    const s = session('brightwater', 'meadowlands');
    expect(s.tales.startable('honest-thief').ok).toBe(false);
    s.player.level = 5;
    (s as any).go('khazrum', 'khazrum');
    expect(s.tales.startable('honest-thief').ok).toBe(false);
  });

  it('The Debt of Hours: paying in time moves the calendar a year', () => {
    const s = session('aurelane', 'aurelane');
    const day = s.state.clock.day;
    pick(s, 'debt-of-hours', 'Pay in time');
    expect(s.state.clock.day).toBeGreaterThanOrEqual(day + 112);
    expect(s.player.devotion.titles).toContain('Paid in Hours');
  });

  it('Letters to No One: three places, one letter for yourself', () => {
    const s = session('brightwater', 'meadowlands');
    pick(s, 'letters-no-one', 'Take the satchel');
    expect(s.tales.choose('letters-no-one', 0).ok).toBe(false);
    (s as any).go('', 'hollow-barrows');
    pick(s, 'letters-no-one', 'Deliver them unread');
    pick(s, 'letters-no-one', 'Open it');
    expect(s.player.devotion.titles).toContain('Postman to the Dead');
  });

  it('Witness: evidence decides the verdict, and it is written down', () => {
    const win = session('aurelane', 'aurelane');
    pick(win, 'witness', 'Look into it');
    for (let i = 0; i < 12; i++) {
      for (const l of ['Examine the shop', 'Question the neighbours']) if (win.tales.options('witness').some((x) => x.opt.l === l)) pick(win, 'witness', l);
    }
    pick(win, 'witness', 'To court');
    pick(win, 'witness', 'Rest your case');
    pick(win, 'witness', 'Hear the verdict');
    expect(win.state.flags['witness:innocent']).toBe(true);
    const lose = session('aurelane', 'aurelane');
    pick(lose, 'witness', 'Look into it');
    pick(lose, 'witness', 'To court');
    pick(lose, 'witness', 'Rest your case');
    pick(lose, 'witness', 'Hear the verdict');
    expect(lose.state.flags['witness:guilty']).toBe(true);
  });

  it('The Saltglass Murders: the right accusation pays, the wrong one costs standing', () => {
    const run = (right: boolean) => {
      const s = session('', 'saltglass');
      const v = s.tales.variant(TALES.find((t) => t.id === 'saltglass-murders')!);
      pick(s, 'saltglass-murders', 'Examine the body');
      for (const [zone, label] of [['saltglass', 'Ask your questions'], ['merrowdeep', 'Press the brother'], ['stormcoast', 'Read the ledger']] as const) {
        (s as any).go('', zone);
        for (let i = 0; i < 20 && s.tales.options('saltglass-murders').some((x) => x.opt.l === label); i++) pick(s, 'saltglass-murders', label);
      }
      (s as any).go('', 'saltglass');
      const names = ['Accuse Maro the Glassblower', 'Accuse Harbormaster Teld', 'Accuse Widow Pauline', 'Accuse Lenn the Apprentice'];
      const target = right ? v : (v + 1) % 4;
      const g = s.state.gold;
      pick(s, 'saltglass-murders', names[target]!);
      return { s, g };
    };
    const good = run(true);
    expect(good.s.player.devotion.titles).toContain('The Saltglass Detective');
    expect(good.s.state.gold).toBeGreaterThan(good.g);
    const bad = run(false);
    expect(bad.s.player.devotion.titles).not.toContain('The Saltglass Detective');
  });

  it('Pim: three errands and the god is named', () => {
    const s = session('brightwater', 'meadowlands');
    pick(s, 'pim', 'Agree to help');
    (s as any).go('', 'stormcoast');
    pick(s, 'pim', 'Buy him a fish');
    (s as any).go('', 'whisperwood');
    pick(s, 'pim', 'Ask who');
    const r = pick(s, 'pim', 'Read it');
    expect(r.ok && /\{/.test(r.text)).toBe(false);
    expect(s.player.devotion.titles).toContain('Friend of Pim');
  });

  it('Old Mag takes a page of the journal', () => {
    const s = session('', 'hollow-barrows');
    const fel = (s.state.realm.marvels.fellowship ??= (s as any).fellowship.f ?? { journal: [] }) as { journal: unknown[] };
    fel.journal = [{ day: 1, event: 'boss', text: 'a' }, { day: 2, event: 'boss', text: 'b' }];
    pick(s, 'old-mag', 'Pay with a memory');
    expect(fel.journal).toHaveLength(1);
  });

  it('The Very Important Door takes four forms and a day', () => {
    const s = session('ratchet', 'clockwork-foundry');
    s.player.level = 15;
    pick(s, 'very-important-door', 'Begin the paperwork');
    pick(s, 'very-important-door', 'Bribe the secretary');
    pick(s, 'very-important-door', 'Find the certified witness');
    pick(s, 'very-important-door', 'File and wait');
    expect(s.player.devotion.titles).toContain('Holder of Form 38-C');
  });

  it('The Unfinished Saint honors what you hold dear', () => {
    const s = session('lensfall', 'saltglass');
    pick(s, 'unfinished-saint', 'Sit for the statue');
    expect(s.tales.progress('unfinished-saint')!.statue).toBeTruthy();
    expect(s.tales.progress('unfinished-saint')!.log[0]).not.toMatch(/\{statue\}/);
  });
});

describe('The Temptation (127)', () => {
  it('approval and oaths decide who gives in, and the fallen can be won back', () => {
    const s = session();
    s.party.recruit('sable');
    s.party.recruit('korga');
    expect(s.tales.canTempt().ok).toBe(true);
    s.party.get('sable')!.approval = 95;
    s.party.get('korga')!.approval = 10;
    const r = s.tales.tempt();
    expect(r.ok).toBe(true);
    expect(s.tales.t.tempt!['sable']).toBe('resisted');
    expect(s.tales.t.tempt!['korga']).toBe('fell');
    expect(s.tales.canTempt().ok).toBe(false);
    let won = false;
    for (let d = 1; d < 20 && !won; d++) {
      s.state.clock.day = d;
      s.tales.winBack('korga', true);
      won = s.tales.t.tempt!['korga'] === 'won';
    }
    expect(won).toBe(true);
    expect(s.tales.winBack('sable').ok).toBe(false);
    expect(TEMPT.resist).toBeGreaterThan(TEMPT.waver);
  });
});

describe('Brother Quill (138)', () => {
  it('quizzes you on your own story and pays by accuracy, once a year', () => {
    const s = session();
    const town = s.tales.quillTown();
    (s as any).go(town, 'meadowlands');
    const quiz = s.tales.quiz();
    expect(quiz).toHaveLength(5);
    const g = s.state.gold;
    const r = s.tales.answerQuiz(quiz.map((q) => q.right));
    expect(r.ok).toBe(true);
    expect(s.state.gold).toBeGreaterThan(g);
    expect(s.player.devotion.titles).toContain('Known to Themselves');
    expect(s.tales.answerQuiz(quiz.map((q) => q.right)).ok).toBe(false);
    const other = session();
    (other as any).go(other.tales.quillTown() === 'brightwater' ? 'thornwick' : 'brightwater', 'meadowlands');
    expect(other.tales.answerQuiz([0, 0, 0, 0, 0]).ok).toBe(false);
  });
});

describe('The Oathbreaker (66) and the Pale Auditor (140)', () => {
  it('a seventh hidden class with a five-quest line that begins when you are Forsworn', () => {
    const cls = GREATER_CLASSES.find((g) => g.def.id === 'oathbreaker')!;
    expect(cls.def.hidden).toBe(true);
    expect(content.quests.filter((q) => q.id.startsWith('cl-oathbreaker-'))).toHaveLength(5);
    expect(content.quests.get('cl-oathbreaker-1').requires).toEqual({ kind: 'flag', flag: 'forsworn' });
    expect(content.npcs.get('the-pale-auditor').name).toBe('The Pale Auditor');
    expect(content.enemies.get('pale-auditor').tier).toBe('boss');
  });
});
