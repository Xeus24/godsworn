import { content } from '../../data';
import { DISGUISE, EXAM, GIFTS, GOD_GIFT, PROPHECIES, PROPHECY, SPARKS, WAGERS, WAGER_ODDS, hybridMods, hybridName, type Gift } from '../../data/faith';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
import { Rng } from '../core/rng';
import { favorOf } from '../gods/devotion';
import { createFaith, type FaithState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type FResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): FResult => ({ ok: false, reason });
const BIG = new Set(['elite', 'champion', 'boss', 'miniboss', 'worldBoss', 'punisher']);
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

export interface ExamQuestion {
  text: string;
  options: string[];
  answer: number;
}

/**
 * Divine Wagers (36), Godspark Crafting (39), Prophecy Scrolls (42), Divine Exams (48) and Gods in Disguise (52).
 * State: `realm.marvels.faith`; what it gives the hero's stats flows through `mods()` into `heart.wonderMods`.
 */
export class FaithActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('combatEnded', (e) => {
      if (e.result === 'victory') this.tally('battles', 1);
      this.settleWager(e.result === 'victory');
    });
    bus.on('enemyKilled', (e) => {
      if (BIG.has(e.tier)) this.tally('champions', 1);
    });
    bus.on('zoneEntered', () => this.tally('zones', 1));
    bus.on('goldChanged', (e) => {
      if (e.amount > 0) this.tally('gold', e.amount);
    });
    bus.on('levelUp', (e) => {
      if (e.characterId === this.s.player.id) this.tally('levels', 1);
    });
    bus.on('favorChanged', (e) => {
      const crossed = Math.floor(e.current / SPARKS.every) - Math.floor(e.previous / SPARKS.every);
      if (crossed > 0 && e.current > e.previous) {
        this.f.sparks[e.god] = (this.f.sparks[e.god] ?? 0) + crossed;
        this.s.bus.emit('toast', { kind: 'blessing', text: `A godspark flares from ${content.gods.find(e.god)?.name ?? e.god}.` });
      }
    });
    bus.on('timeChanged', () => this.resolveProphecies());
  }

  get f(): FaithState {
    const m = this.s.state.realm.marvels;
    return (m.faith ??= createFaith());
  }

  private note(text: string, kind: 'level' | 'info' | 'quest' | 'warning' | 'favor' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private tally(k: string, by: number): void {
    this.f.tally[k] = (this.f.tally[k] ?? 0) + by;
    this.resolveProphecies();
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** What these systems add to the hero. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const key of this.f.hybrids) {
      const [a, b] = key.split('+') as [string, string];
      out.push(...hybridMods(a, b));
    }
    const boon = this.f.boon;
    if (boon && boon.until >= this.s.state.clock.day) out.push(...(DIVINE_SEASONS.find((d) => d.god === boon.god)?.party ?? []));
    return out;
  }

  // ------------------------------------------------------------------ 36: Divine Wagers

  wagerGods(): string[] {
    return Object.keys(WAGER_ODDS).filter((g) => content.gods.find(g));
  }

  placeWager(god: string, stake: number): FResult {
    if (this.f.wager) return fail('A wager already stands.');
    if (!(WAGERS.stakes as readonly number[]).includes(stake) || !WAGER_ODDS[god]) return fail('Not a wager a god would take.');
    if (favorOf(this.s.player, god) < stake) return fail('You do not have that much favor to stake.');
    this.f.wager = { god, stake };
    this.s.bus.emit('stateChanged', { reason: 'wager' });
    return { ok: true, text: `${content.gods.get(god).name} takes your stake of ${stake} favor on your next fight.` };
  }

  private settleWager(won: boolean): void {
    const w = this.f.wager;
    if (!w) return;
    delete this.f.wager;
    const name = content.gods.get(w.god).name;
    if (won) {
      const gain = Math.round(w.stake * (WAGER_ODDS[w.god] ?? 1));
      this.s.devotion.apply({ [w.god]: gain }, 'wager', true);
      this.f.wins++;
      this.note(`${name} pays out: +${gain} favor.`, 'favor');
      if (this.f.wins >= WAGERS.titleAt && !this.s.player.devotion.titles.includes(WAGERS.title)) this.s.player.devotion.titles.push(WAGERS.title);
    } else {
      this.s.devotion.apply({ [w.god]: -w.stake }, 'wager', true);
      this.f.losses++;
      this.note(`${name} keeps your stake: -${w.stake} favor.`, 'warning');
    }
    this.s.bus.emit('stateChanged', { reason: 'wager' });
  }

  // ------------------------------------------------------------------ 39: Godspark Crafting

  fuse(a: string, b: string): FResult {
    if (a === b) return fail('Two different gods.');
    if (!SPARKS_OK(a) || !SPARKS_OK(b)) return fail('Those are not gods of the Wheel.');
    if ((this.f.sparks[a] ?? 0) < 1 || (this.f.sparks[b] ?? 0) < 1) return fail('You need a spark from each.');
    const key = [a, b].sort().join('+');
    if (this.f.hybrids.includes(key)) return fail('You have already forged that one.');
    if (this.f.hybrids.length >= SPARKS.max) return fail(`Only ${SPARKS.max} hybrid blessings can burn at once. Quench one first.`);
    this.f.sparks[a]!--;
    this.f.sparks[b]!--;
    this.f.hybrids.push(key);
    this.changed('godspark');
    return { ok: true, text: `${hybridName(a, b)} burns.` };
  }

  quench(key: string): FResult {
    this.f.hybrids = this.f.hybrids.filter((h) => h !== key);
    this.changed('godspark');
    return { ok: true };
  }

  // ------------------------------------------------------------------ 42: Prophecy Scrolls

  /** The scrolls the seer has today (three, a different handful each day). */
  offered(): typeof PROPHECIES {
    const rng = new Rng(this.s.state.clock.day * 7717 + 3);
    const taken = new Set(this.f.prophecies.filter((p) => p.state === 'open').map((p) => p.id));
    return rng.sample(PROPHECIES.filter((p) => !taken.has(p.id)), PROPHECY.offered);
  }

  take(id: string): FResult {
    const def = PROPHECIES.find((p) => p.id === id);
    if (!def) return fail('No such scroll.');
    if (!this.s.world.inTown()) return fail('The seers sit in towns.');
    if (this.f.prophecies.filter((p) => p.state === 'open').length >= PROPHECY.open) return fail('Three scrolls are open already.');
    if (this.f.prophecies.some((p) => p.id === id && p.state === 'open')) return fail('That one is already open.');
    if (this.s.state.gold < def.cost) return fail(`The scroll costs ${def.cost} gold.`);
    this.s.spendGold(def.cost, 'prophecy');
    this.f.prophecies.push({ id, from: { ...this.f.tally }, deadline: this.s.state.clock.day + def.days, state: 'open' });
    this.s.bus.emit('stateChanged', { reason: 'prophecy' });
    return { ok: true, text: def.text };
  }

  progress(p: FaithState['prophecies'][number]): { have: number; need: number } {
    const def = PROPHECIES.find((x) => x.id === p.id)!;
    return { have: Math.min(def.count, (this.f.tally[def.counter] ?? 0) - (p.from[def.counter] ?? 0)), need: def.count };
  }

  private resolveProphecies(): void {
    let any = false;
    for (const p of this.f.prophecies) {
      if (p.state !== 'open') continue;
      const def = PROPHECIES.find((x) => x.id === p.id)!;
      const { have, need } = this.progress(p);
      if (have >= need) {
        p.state = 'true';
        this.s.addGold(def.reward, 'prophecy');
        this.note(`It came true: “${def.text}” +${def.reward} gold.`, 'level');
        any = true;
      } else if (this.s.state.clock.day > p.deadline) {
        p.state = 'false';
        this.note(`The prophecy failed: “${def.text}”`, 'warning');
        any = true;
      }
    }
    if (any) this.s.bus.emit('stateChanged', { reason: 'prophecy' });
  }

  // ------------------------------------------------------------------ 48: Divine Exams

  /** Five questions on a god, generated from the Pantheon’s own data; the options are shuffled by attempt. */
  questions(god: string, attempt = 0): ExamQuestion[] {
    const d = content.gods.get(god);
    const others = content.gods.all().filter((g) => g.id !== god && g.id !== 'nameless');
    const rng = new Rng(hash(`${god}:${attempt}`));
    const build = (text: string, right: string, wrong: string[]): ExamQuestion => {
      const opts = rng.sample([...new Set(wrong.filter((w) => w !== right))], 2);
      const options = [right, ...opts];
      for (let i = options.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [options[i], options[j]] = [options[j] as string, options[i] as string];
      }
      return { text, options, answer: options.indexOf(right) };
    };
    const elements = [...new Set(content.gods.all().map((g) => g.element as string))];
    const stats = ['str', 'dex', 'int', 'vit', 'wis', 'luk', 'fai', 'cha'];
    return [
      build(`What is ${d.name}'s epithet?`, d.epithet, others.map((g) => g.epithet)),
      build(`Which domain is ${d.name}'s?`, d.domain, others.map((g) => g.domain)),
      build(`Which element does ${d.name} favor?`, d.element, elements),
      build(`Which stat does ${d.name} favor first?`, d.favoredStats[0] as string, stats),
      build(`Whose symbol is “${d.symbol}”?`, d.name, others.map((g) => g.name)),
    ];
  }

  sit(god: string, answers: number[], attempt = 0): FResult & { score?: number } {
    const qs = this.questions(god, attempt);
    const score = qs.filter((q, i) => answers[i] === q.answer).length;
    const best = this.f.exams[god] ?? 0;
    this.f.exams[god] = Math.max(best, score);
    let text = `${score} of ${qs.length}.`;
    if (score >= EXAM.pass && best < EXAM.pass) {
      const gold = EXAM.goldPerLevel * this.s.player.level;
      this.s.devotion.apply({ [god]: EXAM.favor }, 'exam', true);
      this.s.addGold(gold, 'exam');
      text += ` Passed: +${EXAM.favor} favor and ${gold} gold.`;
      if (Object.keys(this.f.exams).filter((g) => (this.f.exams[g] ?? 0) >= EXAM.pass).length >= DIVINE_SEASONS.length && !this.s.player.devotion.titles.includes(EXAM.title)) this.s.player.devotion.titles.push(EXAM.title);
    } else if (score >= EXAM.pass) text += ' Passed again.';
    else text += ' Not yet.';
    this.s.bus.emit('stateChanged', { reason: 'exam' });
    return { ok: true, text, score };
  }

  // ------------------------------------------------------------------ 52: Gods in Disguise

  /** The god abroad in a town today, if any. */
  visitor(town: string, day = this.s.state.clock.day): { god: string; guise: string; key: string } | undefined {
    const h = hash(`${town}:${day}:disguise`);
    if ((h % 1000) / 1000 >= DISGUISE.chance) return undefined;
    const god = DIVINE_SEASONS[(h >>> 10) % DIVINE_SEASONS.length]!.god;
    return { god, guise: DISGUISE.guises[(h >>> 16) % DISGUISE.guises.length] as string, key: `${day}:${town}` };
  }

  /** Offer a gift to the stranger: the right one is a blessing, any other a little favor. */
  offerGift(gift: Gift): FResult {
    const town = this.s.world.inTown();
    if (!town) return fail('Strangers like this are met in towns.');
    const v = this.visitor(town);
    if (!v) return fail('No stranger is about today.');
    if (this.f.met.includes(v.key)) return fail('You have already met them today.');
    if (!GIFTS.includes(gift)) return fail('Not a gift.');
    this.f.met.push(v.key);
    const name = content.gods.get(v.god).name;
    const right = GOD_GIFT[v.god] === gift;
    this.s.devotion.apply({ [v.god]: right ? DISGUISE.rightFavor : DISGUISE.wrongFavor }, 'disguise', true);
    let text: string;
    if (right) {
      this.f.boon = { god: v.god, until: this.s.state.clock.day + DISGUISE.boonDays };
      text = `The stranger smiles and is, for a moment, ${name}. A boon of ${DIVINE_SEASONS.find((d) => d.god === v.god)?.name} stays with you for ${DISGUISE.boonDays} days.`;
    } else text = `${v.guise[0]?.toUpperCase()}${v.guise.slice(1)} thanks you politely and walks on. (It was ${name}. It wanted something else.)`;
    this.changed('disguise');
    return { ok: true, text };
  }
}

const SPARKS_OK = (g: string): boolean => DIVINE_SEASONS.some((d) => d.god === g);
