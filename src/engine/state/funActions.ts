import { content } from '../../data';
import { BEATS, FUN, FUN_GAMES, GOAT_EVENTS, GOAT_MOVES, JUDGES, STROKES, TASTES, WINDS, type FunGame } from '../../data/fun';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { createFun, type FunState } from '../realm/marvels';
import { festivalOn } from '../realm/wheel';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type FResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): FResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
type Round = NonNullable<FunState['active']>['rounds'][number];

/** Lantern Kites, Bellringing, Ink Duels, Goatherding and the Hearthfolk Cook-Off (152-156): short round games with a hidden best answer. */
export class FunActions {
  constructor(private readonly s: GameSession) {}

  get f(): FunState {
    const m = this.s.state.realm.marvels;
    return (m.fun ??= createFun());
  }

  mods(): ModifierSpec[] {
    return Array.from({ length: Math.min(FUN.rhythmMax, this.f.rhythm) }, () => FUN.rhythmMod as ModifierSpec);
  }

  game(id: string): FunGame | undefined {
    return FUN_GAMES.find((g) => g.id === id);
  }

  /** The rounds of a game, fixed by its seed. The best answer is hidden in the numbers. */
  private build(g: FunGame, seed: number, town?: string): Round[] {
    const rng = new Rng(seed);
    const rounds: Round[] = [];
    for (let i = 0; i < g.rounds; i++) {
      if (g.id === 'kites') {
        const w = rng.int(0, 3);
        rounds.push({ text: `The wind comes from the ${WINDS[w]}.`, opts: WINDS.map((d, n) => ({ l: `Steer ${d}`, v: n === w ? 10 : (n + 2) % 4 === w ? 0 : 5 })) });
      } else if (g.id === 'bells') {
        const b = rng.int(0, 2);
        rounds.push({ text: `Beat ${i + 1}: the rope ${b === 0 ? 'sways in the loft' : b === 1 ? 'hangs still' : 'is wrapped in cloth'}.`, opts: BEATS.map((d, n) => ({ l: cap(d), v: n === b ? 8 : n === (b + 1) % 3 ? 3 : 0 })) });
      } else if (g.id === 'ink') {
        const o = rng.int(0, 3);
        rounds.push({ text: `Your rival draws a ${STROKES[o]!.toLowerCase()} stroke.`, opts: STROKES.map((d, n) => ({ l: `${d} stroke`, v: n === (o + 1) % 4 ? 8 : n === o ? 4 : 1 })) });
      } else if (g.id === 'goats') {
        const e = rng.pick(GOAT_EVENTS);
        rounds.push({ text: e.text, opts: GOAT_MOVES.map((d, n) => ({ l: d, v: n === e.best ? 5 : n === (e.best + 1) % 4 ? 3 : 1 })) });
      } else {
        const t = rng.int(0, TASTES.length - 1);
        rounds.push({ text: `Judge ${i + 1} in ${town ? content.towns.get(town).name : 'town'}: ${JUDGES[TASTES[t]!]}.`, opts: TASTES.map((d, n) => ({ l: `Serve something ${d}`, v: n === t ? 10 : Math.abs(n - t) === 1 ? 5 : 2 })) });
      }
    }
    return rounds;
  }

  start(id: string): FResult {
    const g = this.game(id);
    if (!g) return fail('No such game.');
    if (this.f.active) return fail('Finish the game you are playing first.');
    const town = this.s.world.inTown();
    if (g.town && !town) return fail('This is played in a town.');
    if (id === 'cookoff') {
      const last = this.f.cooked[town as string];
      if (last !== undefined && this.s.state.clock.day - last < FUN.cookYear) return fail('You have entered this town’s contest this year.');
    }
    const seed = hash(`${id}:${this.s.player.name}:${this.s.state.clock.day}:${this.f.plays[id] ?? 0}:${town ?? ''}`);
    this.f.active = { id, seed, at: 0, score: 0, log: [], ...(town ? { town } : {}), rounds: this.build(g, seed, town || undefined) };
    return { ok: true, text: `${g.name} begins.` };
  }

  /** Choose an answer for the current round. The last round ends the game. */
  pick(i: number): FResult {
    const a = this.f.active;
    if (!a) return fail('No game is being played.');
    const g = this.game(a.id) as FunGame;
    const round = a.rounds[a.at] as Round;
    const opt = round.opts[i];
    if (!opt) return fail('No such choice.');
    const stat = (characterStats(this.s.player) as unknown as Record<string, number>)[g.stat] ?? 10;
    const gain = opt.v + (opt.v > 0 ? Math.floor(stat / FUN.statPerBonus) : 0);
    a.score += gain;
    a.log.push(`${opt.l}: +${gain}`);
    a.at++;
    if (a.at < a.rounds.length) return { ok: true, text: `+${gain}. Next: ${(a.rounds[a.at] as Round).text}` };
    return this.finish();
  }

  abandon(): void {
    delete this.f.active;
  }

  private finish(): FResult {
    const a = this.f.active as NonNullable<FunState['active']>;
    const g = this.game(a.id) as FunGame;
    const f = this.f;
    delete f.active;
    f.plays[g.id] = (f.plays[g.id] ?? 0) + 1;
    f.best[g.id] = Math.max(f.best[g.id] ?? 0, a.score);
    const tier = g.tiers.find(([min]) => a.score >= min) as FunGame['tiers'][number];
    const feast = festivalOn(this.s.state.clock.day) ? FUN.festivalMult : 1;
    const gold = tier[1] * this.s.player.level * (g.id === 'kites' ? feast : 1);
    this.s.addGold(gold, g.id);
    let text = `${g.name}: ${a.score} points. ${tier[2]}. (+${gold} gold)`;
    const titles = this.s.player.devotion.titles;
    if (g.id === 'bells') {
      f.rhythm = Math.min(FUN.rhythmMax, f.rhythm + Math.floor(a.score / FUN.rhythmPerPeal));
      text += ' Your sense of rhythm sharpens.';
    } else if (g.id === 'goats') {
      const saved = Math.min(30, a.score);
      text = `${g.name}: ${saved} of 30 goats across. ${tier[2]}. (+${gold} gold)`;
      if (saved < FUN.billyScarBelow) {
        f.billy++;
        text += ` Old Billy butts you off the pass and gains a scar (${f.billy}).`;
      } else if (saved === 30 && !titles.includes(FUN.goatTitle)) titles.push(FUN.goatTitle);
    } else if (g.id === 'cookoff' && a.town) {
      f.cooked[a.town] = this.s.state.clock.day;
      if (a.score >= (g.tiers[0] as FunGame['tiers'][number])[0] && !f.ribbons.includes(a.town)) {
        f.ribbons.push(a.town);
        text += ` The ribbon of ${content.towns.get(a.town).name} is yours.`;
        if (f.ribbons.length === content.towns.all().length && !titles.includes(FUN.cookTitle)) titles.push(FUN.cookTitle);
      }
    }
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason: 'fun' });
    return { ok: true, text };
  }
}
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
