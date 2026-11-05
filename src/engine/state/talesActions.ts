import { content } from '../../data';
import { TALES, TALE_MODS, type Fx, type Opt, type Req, type Step, type Tale, type Where } from '../../data/tales';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { heartOf, heldConvictions } from '../heart/heart';
import { createFellowship, createTales, type TalesState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type TResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): TResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

export const TEMPT = { minLevel: 30, resist: 9, waver: 5, convictionPoint: 1, oathPenalty: 2, fellLoss: 20, waverLoss: 5, resistGain: 8, winBackDc: 14, fellDc: 16, wonGain: 20, giftPerLevel: 40, giftBonus: 4 } as const;
export const QUILL = { weekDays: 7, yearDays: 112, goldPerLevel: 25, perfect: 5, title: 'Known to Themselves' } as const;
export interface QuizQ { q: string; options: string[]; right: number }

/**
 * Story beats and strangers (H-5): the branching tales in `data/tales.ts`, the Temptation (127) and Brother Quill's quiz (138).
 * State: `realm.marvels.tales`.
 */
export class TalesActions {
  constructor(private readonly s: GameSession) {}

  get t(): TalesState {
    const m = this.s.state.realm.marvels;
    return (m.tales ??= createTales());
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  mods(): ModifierSpec[] {
    return this.t.mods.map((k) => TALE_MODS[k]).filter((m): m is ModifierSpec => Boolean(m));
  }

  private roll(seed: string, stat: string): number {
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    return new Rng(hash(seed)).int(1, 20) + Math.floor((stats[stat] ?? 10) / 2) - 3;
  }

  // ------------------------------------------------------------------ the tales

  tale(id: string): Tale | undefined {
    return TALES.find((x) => x.id === id);
  }

  here(w: Where): boolean {
    if (w.town && this.s.world.inTown() !== w.town) return false;
    if (w.zone && this.s.world.zone.id !== w.zone) return false;
    return true;
  }

  progress(id: string) {
    return this.t.at[id];
  }

  /** The step a tale is on (the first, if it has not begun). */
  step(id: string): Step | undefined {
    const tale = this.tale(id);
    const st = this.t.at[id];
    return tale?.steps[st?.step ?? tale.first];
  }

  variant(tale: Tale): number {
    const st = this.t.at[tale.id];
    if (st && st.v !== undefined) return st.v;
    return tale.variants ? hash(`${tale.id}:${this.s.player.name}`) % tale.variants.length : 0;
  }

  /** Where this step must be played: its own place, or the tale’s starting place. */
  where(id: string): Where {
    const tale = this.tale(id);
    const st = this.t.at[id];
    return !st ? (tale?.where ?? {}) : (tale?.steps[st.step]?.at ?? {});
  }

  fill(tale: Tale, text: string): string {
    const st = this.t.at[tale.id];
    const v = tale.variants?.[this.variant(tale)];
    return text.replace('{statue}', st?.statue ?? 'the road').replace('{reveal}', v?.name ?? 'someone');
  }

  private reqOk(id: string, req?: Req): boolean {
    if (!req) return true;
    const flags = this.t.at[id]?.flags ?? [];
    if (req.flag && !flags.includes(req.flag)) return false;
    if (req.not && flags.includes(req.not)) return false;
    if (req.lvl !== undefined && this.s.player.level < req.lvl) return false;
    if (req.ev !== undefined) {
      const n = flags.filter((f) => f.startsWith('ev:')).length;
      if (req.ev > 0 ? n < req.ev : n >= 2) return false;
    }
    return true;
  }

  cost(opt: Opt): number {
    return (opt.cost ?? 0) * this.s.player.level;
  }

  /** The options of the current step that are open to the hero. */
  options(id: string): { opt: Opt; index: number }[] {
    const step = this.step(id);
    const st = this.t.at[id];
    if (!step || st?.done !== undefined) return [];
    return step.opts.map((opt, index) => ({ opt, index })).filter(({ opt }) => this.reqOk(id, opt.req) && !(opt.once && st?.flags.includes(`used:${opt.l}`)));
  }

  startable(id: string): TResult {
    const tale = this.tale(id);
    if (!tale) return fail('No such tale.');
    if (this.t.at[id]?.done !== undefined) return fail('That tale is finished.');
    if (this.s.player.level < tale.lvl) return fail(`Come back at level ${tale.lvl}.`);
    if (!this.here(this.where(id))) return fail(this.whereText(this.where(id)));
    return { ok: true, text: '' };
  }

  whereText(w: Where): string {
    const bits = [w.town ? `in ${content.towns.get(w.town).name}` : '', w.zone ? `in ${content.zones.get(w.zone).name}` : ''].filter(Boolean);
    return `This part is played ${bits.join(', ') || 'anywhere'}.`;
  }

  choose(id: string, index: number): TResult {
    const tale = this.tale(id);
    const ready = this.startable(id);
    if (!tale || !ready.ok) return ready;
    const step = this.step(id) as Step;
    const opt = step.opts[index];
    if (!opt || !this.options(id).some((x) => x.index === index)) return fail('That is not open to you.');
    const st = (this.t.at[id] ??= { step: tale.first, flags: [], log: [] });
    if (tale.variants && st.v === undefined) st.v = this.variant(tale);
    const cost = this.cost(opt);
    if (cost && !this.s.spendGold(cost, 'tale')) return fail(`It costs ${cost} gold.`);
    let win = true;
    if (opt.chk) win = this.roll(`${id}:${st.step}:${index}:${this.s.state.clock.day}:${st.log.length}`, opt.chk[0]) >= opt.chk[1];
    if (win && opt.culprit !== undefined) win = opt.culprit === st.v;
    if (opt.once) st.flags.push(`used:${opt.l}`);
    const text = win ? opt.t : (opt.ft ?? 'It does not go as hoped.');
    const fx = win ? (opt.fx ?? []) : (opt.ff ?? []);
    const next = win ? opt.n : (opt.fn ?? (opt.ff || opt.ft ? opt.n : undefined));
    const extra = fx.map((f) => this.apply(tale, st, f)).filter(Boolean);
    const told = this.fill(tale, text) + (extra.length ? ` ${extra.join(' ')}` : '');
    st.log.unshift(told);
    if (next) st.step = next;
    else if (win || opt.fn === undefined) {
      st.done = this.s.state.clock.day;
      this.note(`${tale.name}: finished.`, 'quest');
    }
    this.changed('tale');
    return { ok: true, text: told };
  }

  private apply(tale: Tale, st: NonNullable<TalesState['at'][string]>, f: Fx): string {
    const p = this.s.player;
    switch (f[0]) {
      case 'gold': this.s.addGold(f[1], 'tale'); return `(+${f[1]} gold)`;
      case 'goldL': { const g = f[1] * p.level; this.s.addGold(g, 'tale'); return `(+${g} gold)`; }
      case 'xp': this.s.grantXp(f[1] * p.level, true); return `(+${f[1] * p.level} XP)`;
      case 'favor': this.s.devotion.apply({ [f[1]]: f[2] }, 'tale'); return '';
      case 'rep': this.s.world.addRep({ [f[1]]: f[2] }); return '';
      case 'flag': if (!st.flags.includes(f[1])) st.flags.push(f[1]); return '';
      case 'gflag': this.s.setFlag(f[1], true); return '';
      case 'title': if (!p.devotion.titles.includes(f[1])) p.devotion.titles.push(f[1]); return `(title: ${f[1]})`;
      case 'days': this.s.advanceTime(f[1] * 1440); return `(${f[1]} day${f[1] === 1 ? '' : 's'} pass)`;
      case 'mod': if (!this.t.mods.includes(f[1])) this.t.mods.push(f[1]); return '(a lasting boon)';
      case 'clue': return tale.variants?.[this.variant(tale)]?.clues[f[1]] ?? '';
      case 'reveal': return '';
      case 'favorV': { const id = tale.variants?.[this.variant(tale)]?.id; if (id && content.gods.find(id)) this.s.devotion.apply({ [id]: f[1] }, 'tale'); return ''; }
      case 'loseJournal': {
        const fel = (this.s.state.realm.marvels.fellowship ??= createFellowship());
        if (fel.journal.length) {
          const i = new Rng(hash(`mag:${this.s.state.clock.day}`)).int(0, fel.journal.length - 1);
          fel.journal.splice(i, 1);
          return '(a page of your journal is blank)';
        }
        return '(you had nothing written to lose)';
      }
      case 'hurt': { const max = characterStats(p).maxHp; p.hp = Math.max(1, p.hp - Math.round((max * f[1]) / 100)); return ''; }
      case 'statue': { const held = heldConvictions(heartOf(p)); st.statue = held[0]?.name ?? 'the road itself'; return ''; }
      case 'approval': for (const c of this.companions()) this.s.party.adjust(c.id, f[1]); return '';
    }
  }

  companions() {
    return this.s.party.recruited();
  }

  // ------------------------------------------------------------------ 127: The Temptation

  canTempt(): TResult {
    if (this.s.player.level < TEMPT.minLevel) return fail(`The Unsworn King does not bother with anyone below level ${TEMPT.minLevel}.`);
    if (!this.companions().length) return fail('You travel alone; there is no one to tempt.');
    if (this.t.tempt) return fail('He has already spoken to them.');
    return { ok: true, text: '' };
  }

  /** How firmly a companion holds: their approval, less their oath troubles, plus what you hold dear. */
  resolve(id: string): number {
    const comp = this.s.party.get(id);
    const oath = this.s.state.realm.marvels.fellowship?.oaths[id]?.stage ?? 0;
    return Math.floor((comp?.approval ?? 0) / 10) - oath * TEMPT.oathPenalty + heldConvictions(heartOf(this.s.player)).length * TEMPT.convictionPoint;
  }

  tempt(): TResult {
    const ok = this.canTempt();
    if (!ok.ok) return ok;
    const out: NonNullable<TalesState['tempt']> = {};
    const lines: string[] = [];
    for (const c of this.companions()) {
      const r = this.resolve(c.id);
      const state = r >= TEMPT.resist ? 'resisted' : r >= TEMPT.waver ? 'wavering' : 'fell';
      out[c.id] = state;
      this.s.party.adjust(c.id, state === 'resisted' ? TEMPT.resistGain : state === 'wavering' ? -TEMPT.waverLoss : -TEMPT.fellLoss, true);
      lines.push(`${content.companions.get(c.id).name}: ${state === 'resisted' ? 'refused him' : state === 'wavering' ? 'listened too long' : 'gave in'}.`);
    }
    this.t.tempt = out;
    this.changed('tempt');
    return { ok: true, text: `The Unsworn King offers each of them freedom from their god. ${lines.join(' ')}` };
  }

  winBack(id: string, gift = false): TResult {
    const st = this.t.tempt?.[id];
    if (!st || (st !== 'fell' && st !== 'wavering')) return fail('There is nothing to win back.');
    const day = this.s.state.clock.day;
    if (this.t.temptTry[id] === day) return fail('Give them a day.');
    if (gift) {
      const cost = TEMPT.giftPerLevel * this.s.player.level;
      if (!this.s.spendGold(cost, 'tempt')) return fail(`A fitting gift costs ${cost} gold.`);
    }
    this.t.temptTry[id] = day;
    const dc = st === 'fell' ? TEMPT.fellDc : TEMPT.winBackDc;
    const win = this.roll(`winback:${id}:${day}`, 'cha') + (gift ? TEMPT.giftBonus : 0) >= dc;
    const name = content.companions.get(id).name;
    if (!win) {
      this.s.party.adjust(id, -3, true);
      return { ok: true, text: `${name} is not ready to hear it.` };
    }
    this.t.tempt![id] = 'won';
    this.s.party.adjust(id, TEMPT.wonGain, true);
    if (Object.values(this.t.tempt!).every((v) => v === 'won' || v === 'resisted') && !this.s.player.devotion.titles.includes('Held the Line')) this.s.player.devotion.titles.push('Held the Line');
    this.changed('tempt');
    return { ok: true, text: `${name} comes back to you.` };
  }

  // ------------------------------------------------------------------ 138: Brother Quill

  quillTown(): string {
    const towns = content.towns.all();
    return towns[Math.floor(this.s.state.clock.day / QUILL.weekDays) % towns.length]!.id;
  }

  /** Five questions about the hero’s own story, in an order and with distractors fixed by the day. */
  quiz(): QuizQ[] {
    const p = this.s.player;
    const rng = new Rng(hash(`quill:${p.name}:${Math.floor(this.s.state.clock.day / QUILL.weekDays)}`));
    const make = (q: string, right: string, others: string[]): QuizQ => {
      const opts = [right, ...others.filter((x) => x !== right).slice(0, 2)];
      const shuffled = rng.shuffle(opts);
      return { q, options: shuffled, right: shuffled.indexOf(right) };
    };
    const pick = (names: string[]) => rng.shuffle(names).slice(0, 3);
    const bosses = this.s.state.stats.bossesKilled;
    const primary = p.classes.find((c) => c.slot === 'primary') ?? p.classes[0];
    return [
      make('What race are you?', content.races.get(p.raceId).name, pick(content.races.all().map((r) => r.name))),
      make('Which class did you begin as?', primary ? content.classes.get(primary.classId).name : 'none', pick(content.classes.all().filter((c) => !c.hidden).map((c) => c.name))),
      make('Under which birth sign were you born?', content.birthSigns.get(p.birthSignId).name, pick(content.birthSigns.all().map((b) => b.name))),
      make('How many bosses have you slain?', String(bosses), [String(bosses + 7), String(Math.max(0, bosses - 5)), String(bosses + 3)]),
      make('What level are you?', String(p.level), [String(p.level + 4), String(Math.max(1, p.level - 3)), String(p.level + 1)]),
    ];
  }

  quillHere(): boolean {
    return this.s.world.inTown() === this.quillTown();
  }

  answerQuiz(answers: number[]): TResult {
    if (!this.quillHere()) return fail(`Brother Quill is in ${content.towns.get(this.quillTown()).name} this week.`);
    const q = this.t.quill;
    const day = this.s.state.clock.day;
    if (day - q.last < QUILL.yearDays) return fail('He has already quizzed you this year. He is a patient man, and a busy one.');
    const quiz = this.quiz();
    const right = quiz.filter((x, i) => answers[i] === x.right).length;
    q.last = day;
    q.asked++;
    q.correct += right;
    q.best = Math.max(q.best, right);
    const gold = right * QUILL.goldPerLevel * this.s.player.level;
    if (gold) this.s.addGold(gold, 'quill');
    this.s.grantXp(right * 10 * this.s.player.level, true);
    let text = `${right} of ${quiz.length} right. “${right === quiz.length ? 'You remember yourself well.' : right >= 3 ? 'A fair account of yourself.' : 'You have forgotten rather a lot. It is quite common.'}” (+${gold} gold)`;
    if (right === QUILL.perfect) {
      if (!this.s.player.devotion.titles.includes(QUILL.title)) this.s.player.devotion.titles.push(QUILL.title);
      if (!this.t.mods.includes('wit')) this.t.mods.push('wit');
      text += ' He writes it in the Final Testament in his own hand.';
    }
    this.changed('quill');
    return { ok: true, text };
  }
}
