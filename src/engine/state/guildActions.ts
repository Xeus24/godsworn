import { content } from '../../data';
import { ADVENTURES, GUILD, RANKS, RIVALS, RIVAL_BACKUP, TABLE_PLAYERS, TALE_STAT_KEY, TANKARDS, type Adventure, type GuildRank, type TaleScene } from '../../data/guild';
import { characterStats } from '../character/stats';
import { Rng, hashString } from '../core/rng';
import type { GauntletState } from '../endgame/types';
import { createGuild, type GuildContract, type GuildState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type GResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): GResult => ({ ok: false, reason });

/** Section I-8b: the Adventurers' Guild (226) and Tales & Tankards (227). State: `realm.marvels.guild`. */
export class GuildActions {
  constructor(private readonly s: GameSession) {
    s.specials['guild'] = (a, won) => this.fightEnded(a, won);
  }

  get t(): GuildState {
    const m = this.s.state.realm.marvels;
    return (m.guild ??= createGuild());
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  private title(t: string): void {
    if (!this.s.player.devotion.titles.includes(t)) this.s.player.devotion.titles.push(t);
  }

  // ------------------------------------------------------------------ 226: ranks

  rankIndex(points = this.t.points): number {
    let i = 0;
    RANKS.forEach((r, n) => {
      if (points >= r.points) i = n;
    });
    return i;
  }

  rank(): GuildRank {
    return RANKS[this.rankIndex()] as GuildRank;
  }

  private gain(points: number): void {
    const before = this.rankIndex();
    this.t.points += points;
    const after = this.rankIndex();
    if (after > before) {
      this.note(`Guild rank: ${RANKS[after]?.name}. ${RANKS[after]?.perk}`, 'level');
      if (after === RANKS.length - 1) this.title('Name on the Lintel');
    }
  }

  // ------------------------------------------------------------------ contracts

  /** The contracts posted in a town today. */
  board(town: string): GuildContract[] {
    const zone = content.zones.get(content.towns.get(town).zone);
    const level = this.s.player.level;
    const out: GuildContract[] = [];
    for (let slot = 0; slot < GUILD.slots; slot++) {
      const rng = new Rng(hashString(`guild:${town}:${this.day}:${slot}`));
      const kind: GuildContract['kind'] = slot === 0 ? 'hunt' : slot === 1 ? 'cull' : this.rankIndex() >= GUILD.partyRank ? 'party' : 'hunt';
      const waves: string[][] = [];
      for (let i = 0; i < GUILD.waves[kind]; i++) {
        const g = rng.pick(zone.encounters);
        waves.push(g.enemies.map((e) => e.enemyId));
      }
      const id = `${town}:${this.day}:${slot}`;
      const label = { hunt: 'Hunt', cull: 'Cull', party: 'Party contract' }[kind];
      out.push({ id, town, kind, name: `${label} near ${zone.name}${slot === 2 && kind === 'hunt' ? ' (second posting)' : ''}`, waves, level, gold: GUILD.goldPerLevel[kind] * level, points: GUILD.points[kind] });
    }
    return out.filter((c) => !this.t.finished.includes(c.id));
  }

  take(id: string): GResult {
    const town = this.s.world.inTown();
    if (!town) return fail('The Guild board is in town.');
    if (this.t.active) return fail('Finish the contract you hold first.');
    const c = this.board(town).find((x) => x.id === id);
    if (!c) return fail('That contract is gone.');
    this.t.active = c;
    this.changed('guild');
    return { ok: true, text: `Contract taken: ${c.name}.` };
  }

  abandon(): GResult {
    if (!this.t.active) return fail('No contract held.');
    delete this.t.active;
    this.changed('guild');
    return { ok: true, text: 'Contract returned.' };
  }

  partyReady(): boolean {
    return Object.values(this.s.state.party.companions).some((c) => c.inParty && !c.left);
  }

  fight(): GResult {
    const c = this.t.active;
    if (!c) return fail('You hold no contract.');
    if (c.kind === 'party' && !this.partyReady()) return fail('A party contract needs a companion at your side.');
    const waves = c.waves.map((w) => w.filter((id) => content.enemies.has(id))).filter((w) => w.length);
    const r = this.s.endgame.startSpecial({ module: 'guild', ref: `c:${c.id}`, label: c.name, level: c.level, waves, threat: c.kind === 'party' ? 12 : 0 });
    return r.ok ? { ok: true, text: 'The contract begins.' } : fail(r.reason);
  }

  // ------------------------------------------------------------------ rivals

  rivalOpen(id: string): GResult {
    const r = RIVALS.find((x) => x.id === id);
    if (!r) return fail('No such party.');
    if (this.rankIndex() < GUILD.rivalRank) return fail('Silver rank or better to meet a rival party.');
    if (this.t.rivals.includes(id)) return fail('You have already beaten them.');
    return { ok: true, text: r.name };
  }

  challenge(id: string): GResult {
    const open = this.rivalOpen(id);
    if (!open.ok) return open;
    const r = RIVALS.find((x) => x.id === id);
    if (!r) return fail('No such party.');
    const level = this.s.player.level;
    const res = this.s.endgame.startSpecial({ module: 'guild', ref: `r:${id}`, label: r.name, level, waves: [RIVAL_BACKUP], threat: 4, boss: r.leader });
    return res.ok ? { ok: true, text: `${r.name} take the field.` } : fail(res.reason);
  }

  /** How the rival parties stand against you: a slow, steady climb they all make. */
  standings(): { name: string; points: number; you?: boolean }[] {
    const rows = RIVALS.map((r, i) => ({ name: r.name, points: Math.round((i + 1) * 90 + this.day * (1 + i * 0.6)) + (this.t.rivals.includes(r.id) ? -40 : 0) }));
    rows.push({ name: this.s.player.name, points: this.t.points, you: true } as never);
    return rows.sort((a, b) => b.points - a.points);
  }

  private fightEnded(a: GauntletState, won: boolean): void {
    const ref = a.special?.ref ?? '';
    const lvl = this.s.player.level;
    if (ref.startsWith('c:') && this.t.active?.id === ref.slice(2)) {
      const c = this.t.active;
      if (won) {
        this.s.addGold(c.gold, 'guild');
        this.gain(c.points);
        this.t.finished.push(c.id);
        this.t.done++;
        delete this.t.active;
        this.note(`Contract done: +${c.gold} gold, +${c.points} Guild points.`, 'level');
      } else this.note('The contract is not done. You may try it again.', 'warning');
    } else if (ref.startsWith('r:')) {
      const id = ref.slice(2);
      if (won && !this.t.rivals.includes(id)) {
        this.t.rivals.push(id);
        this.s.addGold(GUILD.rivalGoldPerLevel * lvl, 'guild');
        this.gain(GUILD.rivalPoints);
        this.note(`${RIVALS.find((r) => r.id === id)?.name ?? 'The rivals'} concede the board.`, 'level');
        if (this.t.rivals.length === RIVALS.length) this.title(GUILD.rivalTitle);
      } else if (!won) this.note('The rivals walk off, smiling. They will be back.', 'warning');
    }
    this.changed('guild');
  }

  // ------------------------------------------------------------------ 227: Tales & Tankards

  unlocked(adv: Adventure): boolean {
    const i = ADVENTURES.indexOf(adv);
    return i === 0 || (this.t.tales.best[(ADVENTURES[i - 1] as Adventure).id] ?? -1) >= TANKARDS.passScenes;
  }

  stake(): number {
    return TANKARDS.stakePerLevel * this.s.player.level;
  }

  playedToday(adv: string): boolean {
    return this.t.tales.played[adv] === this.day;
  }

  sit(advId: string, table: string[]): GResult {
    if (!this.s.world.inTown()) return fail('Tales & Tankards is played in a tavern, so in town.');
    const adv = ADVENTURES.find((a) => a.id === advId);
    if (!adv) return fail('No such adventure.');
    if (this.t.tales.run) return fail('A game is already running.');
    if (!this.unlocked(adv)) return fail('Finish the one before it first.');
    if (this.playedToday(advId)) return fail('The table plays each tale once a day.');
    const seats = TABLE_PLAYERS.filter((p) => table.includes(p.id)).slice(0, TANKARDS.seats);
    if (this.s.state.gold < this.stake()) return fail(`The stake is ${this.stake()} gold.`);
    this.s.spendGold(this.stake(), 'tankards');
    this.t.tales.played[advId] = this.day;
    this.t.tales.run = { adv: advId, scene: 0, wins: 0, table: seats.map((p) => p.id), stake: this.stake(), log: [] };
    this.changed('guild');
    return { ok: true, text: `The Tale-Teller opens ${adv.name}.` };
  }

  scene(): TaleScene | undefined {
    const run = this.t.tales.run;
    const adv = ADVENTURES.find((a) => a.id === run?.adv);
    return run && adv ? adv.scenes[run.scene] : undefined;
  }

  choose(index: number): GResult {
    const run = this.t.tales.run;
    const adv = ADVENTURES.find((a) => a.id === run?.adv);
    const scene = this.scene();
    const opt = scene?.options[index];
    if (!run || !adv || !opt) return fail('No game is running.');
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    const base = Math.floor((stats[TALE_STAT_KEY[opt.stat]] ?? 10) / 2) - 3;
    const help = TABLE_PLAYERS.filter((p) => run.table.includes(p.id) && p.stat === opt.stat).reduce((n, p) => n + p.bonus, 0);
    const die = new Rng(hashString(`tankards:${run.adv}:${run.scene}:${this.day}:${this.s.player.level}:${index}`)).int(1, 20);
    const total = die + base + help;
    const ok = total >= opt.dc;
    const lines = ok ? adv.win : adv.lose;
    const line = lines[(run.scene + die) % lines.length] as string;
    run.log.push(`${opt.label}: d20 ${die} ${base + help >= 0 ? '+' : ''}${base + help} = ${total} against ${opt.dc}. ${ok ? 'Success.' : 'Failure.'} ${line}`);
    if (ok) run.wins++;
    run.scene++;
    if (run.scene >= adv.scenes.length) return this.finish();
    this.changed('guild');
    return { ok: true, text: run.log[run.log.length - 1] as string };
  }

  private finish(): GResult {
    const run = this.t.tales.run;
    const adv = ADVENTURES.find((a) => a.id === run?.adv);
    if (!run || !adv) return fail('No game is running.');
    const t = this.t.tales;
    const first = (t.best[adv.id] ?? -1) < TANKARDS.passScenes;
    t.best[adv.id] = Math.max(t.best[adv.id] ?? 0, run.wins);
    let text = `${adv.name} ends with ${run.wins} of ${adv.scenes.length} scenes won.`;
    if (run.wins >= TANKARDS.passScenes) {
      const gold = Math.round((adv.reward.gold + run.stake) * (run.wins === adv.scenes.length ? 1.5 : 1));
      this.s.addGold(gold, 'tankards');
      text += ` The table pays out ${gold} gold.`;
      if (first && adv.reward.title) {
        this.title(adv.reward.title);
        text += ` Title: ${adv.reward.title} (${adv.reward.modText}).`;
      }
      if (ADVENTURES.every((a) => (t.best[a.id] ?? -1) >= TANKARDS.passScenes)) this.title(TANKARDS.title);
    } else text += ' Your stake stays on the table.';
    delete t.run;
    this.note(text, 'quest');
    this.changed('guild');
    return { ok: true, text };
  }

  leave(): GResult {
    if (!this.t.tales.run) return fail('No game is running.');
    delete this.t.tales.run;
    this.changed('guild');
    return { ok: true, text: 'You push back from the table. The stake stays.' };
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (let i = 0; i <= this.rankIndex(); i++) out.push(...(RANKS[i]?.mods ?? []));
    for (const a of ADVENTURES) if ((this.t.tales.best[a.id] ?? -1) >= TANKARDS.passScenes && a.reward.mod) out.push(a.reward.mod);
    return out;
  }
}
