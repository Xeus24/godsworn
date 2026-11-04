import { content } from '../../data';
import { CHOIR, DEFENSE, TOWERS, waveOf } from '../../data/defense';
import { Rng } from '../core/rng';
import { runWave } from '../realm/defense';
import { apply, GOD_DEPTH, godMove, legalMoves, START, winner } from '../minigames/godsGambit';
import { createTrials, type ChessGame, type DefenseRun } from '../realm/marvels';
import type { GameSession } from './gameState';

export type GResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): GResult => ({ ok: false, reason });

/** Shrine Defense (41) and Pantheon Chess (59). State: `realm.marvels.trials.defense` and `.chess`. */
export class GamesActions {
  constructor(private readonly s: GameSession) {}

  private get d() {
    const t = this.s.state.realm.marvels.trials ?? (this.s.state.realm.marvels.trials = createTrials());
    return (t.defense ??= { best: 0, runs: 0, wins: 0 });
  }

  private get c() {
    const t = this.s.state.realm.marvels.trials ?? (this.s.state.realm.marvels.trials = createTrials());
    return (t.chess ??= { wins: {}, losses: 0, draws: 0 });
  }

  private note(text: string, kind: 'level' | 'info' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  // ------------------------------------------------------------------ 41: Shrine Defense

  get run(): DefenseRun | undefined {
    return this.d.run;
  }

  startDefense(): GResult {
    if (this.d.run) return fail('A defence is under way.');
    if (!this.s.world.inTown()) return fail('The Choir comes for the shrines of towns.');
    if (this.s.player.level < DEFENSE.minLevel) return fail(`Defenders must be level ${DEFENSE.minLevel}.`);
    this.d.run = { seed: this.s.rng.int(1, 1e9), wave: 1, shrine: DEFENSE.shrine, faith: DEFENSE.startFaith, towers: Array(DEFENSE.slots).fill(''), log: ['The Choir is singing on the far hill.'] };
    this.d.runs++;
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true };
  }

  build(slot: number, towerId: string): GResult {
    const run = this.d.run;
    const def = TOWERS.find((t) => t.id === towerId);
    if (!run || !def) return fail('Nothing to build.');
    if (slot < 0 || slot >= DEFENSE.slots) return fail('No such place.');
    if (run.towers[slot]) return fail('Something stands there already.');
    if (run.faith < def.cost) return fail(`${def.name} costs ${def.cost} faith.`);
    run.faith -= def.cost;
    run.towers[slot] = towerId;
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true };
  }

  /** Tear a tower down for half its cost back. */
  clearSlot(slot: number): GResult {
    const run = this.d.run;
    const def = TOWERS.find((t) => t.id === run?.towers[slot]);
    if (!run || !def) return fail('Nothing there.');
    run.faith += Math.floor(def.cost / 2);
    run.towers[slot] = '';
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true };
  }

  abandonDefense(): GResult {
    const run = this.d.run;
    if (!run) return fail('No defence.');
    this.d.best = Math.max(this.d.best, run.wave - 1);
    delete this.d.run;
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true, text: 'The shrine is left to its fate.' };
  }

  /** Sound the bell: the next wave comes down the path. */
  sendWave(): GResult & { lines?: string[] } {
    const run = this.d.run;
    if (!run) return fail('No defence.');
    const report = runWave(run, waveOf(run.wave), this.s.player.level);
    run.shrine -= report.shrineLost;
    run.log = [`Wave ${run.wave}: ${report.lines.join(' ')}`, ...run.log].slice(0, 8);
    if (run.shrine <= 0) return this.endDefense(false, report.lines);
    // The wards mend the shrine between waves.
    const heal = run.towers.reduce((sum, t) => sum + (TOWERS.find((x) => x.id === t)?.heal ?? 0), 0);
    run.shrine = Math.min(DEFENSE.shrine, run.shrine + heal);
    if (run.wave >= DEFENSE.waves) return this.endDefense(true, report.lines);
    run.wave++;
    run.faith += DEFENSE.faithPerWave + run.wave * DEFENSE.faithPerWaveStep;
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true, text: report.lines.join(' '), lines: report.lines };
  }

  private endDefense(won: boolean, lines: string[]): GResult & { lines?: string[] } {
    const run = this.d.run!;
    this.d.best = Math.max(this.d.best, won ? DEFENSE.waves : run.wave - 1);
    delete this.d.run;
    let text: string;
    if (won) {
      this.d.wins++;
      const gold = DEFENSE.goldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'shrine-defense');
      if (!this.s.player.devotion.titles.includes(DEFENSE.title)) this.s.player.devotion.titles.push(DEFENSE.title);
      text = `${CHOIR['master']!.name} falls silent. The shrine stands. +${gold} gold.`;
      this.note(text, 'level');
    } else {
      text = `The Choir reaches the shrine on wave ${run.wave}. The bells stop.`;
      this.note(text, 'warning');
    }
    this.s.bus.emit('stateChanged', { reason: 'defense' });
    return { ok: true, text, lines };
  }

  // ------------------------------------------------------------------ 59: Pantheon Chess (the Gods' Gambit)

  gods(): string[] {
    return Object.keys(GOD_DEPTH).filter((g) => content.gods.find(g));
  }

  get game(): ChessGame | undefined {
    return this.c.game;
  }

  record() {
    return this.c;
  }

  startChess(god: string): GResult {
    if (!GOD_DEPTH[god]) return fail('That god does not play.');
    if (this.c.game) return fail('A game is on the table.');
    if (!this.s.world.inTown()) return fail('The gods play at a town’s shrine.');
    this.c.game = { god, board: START, turn: 'you', moves: 0 };
    this.s.bus.emit('stateChanged', { reason: 'chess' });
    return { ok: true };
  }

  /** Your move; the god replies at once. */
  chessMove(from: number, to: number): GResult {
    const g = this.c.game;
    if (!g || g.turn !== 'you') return fail('Not your move.');
    if (!legalMoves(g.board, 'you').some((m) => m.from === from && m.to === to)) return fail('That is not a move.');
    g.board = apply(g.board, { from, to });
    g.moves++;
    let w = winner(g.board);
    if (!w && !legalMoves(g.board, 'god').length) w = 'you';
    if (!w) {
      const cfg = GOD_DEPTH[g.god]!;
      const rng = new Rng(g.moves * 7919 + g.board.length + this.s.state.clock.day);
      const reply = godMove(g.board, cfg.depth, rng, cfg.whim);
      if (!reply) w = 'you';
      else {
        g.board = apply(g.board, reply);
        g.moves++;
        g.last = `${reply.from}>${reply.to}`;
        w = winner(g.board);
        if (!w && !legalMoves(g.board, 'you').length) w = 'god';
      }
    }
    if (!w && g.moves >= 80) return this.endChess('draw');
    if (w) return this.endChess(w === 'you' ? 'win' : 'lose');
    this.s.bus.emit('stateChanged', { reason: 'chess' });
    return { ok: true };
  }

  resign(): GResult {
    return this.c.game ? this.endChess('lose') : fail('No game.');
  }

  private endChess(r: 'win' | 'lose' | 'draw'): GResult {
    const g = this.c.game!;
    const name = content.gods.get(g.god).name;
    delete this.c.game;
    let text: string;
    if (r === 'win') {
      const first = !(this.c.wins[g.god] ?? 0);
      this.c.wins[g.god] = (this.c.wins[g.god] ?? 0) + 1;
      const gold = 40 * this.s.player.level * (first ? 3 : 1);
      this.s.addGold(gold, 'gambit');
      this.s.devotion.apply({ [g.god]: first ? 25 : 8 }, 'gambit', true);
      text = `You take ${name}'s Oath-keeper. +${gold} gold${first ? ' and favor (a first win)' : ''}.`;
      if (this.gods().every((x) => (this.c.wins[x] ?? 0) > 0) && !this.s.player.devotion.titles.includes('Gambit-Master')) this.s.player.devotion.titles.push('Gambit-Master');
    } else if (r === 'lose') {
      this.c.losses++;
      text = `${name} takes your Oath-keeper, and is gracious about it.`;
    } else {
      this.c.draws++;
      text = `${name} calls it a draw, with a smile you do not like.`;
    }
    this.note(text, r === 'win' ? 'level' : 'info');
    this.s.bus.emit('stateChanged', { reason: 'chess' });
    return { ok: true, text };
  }
}
