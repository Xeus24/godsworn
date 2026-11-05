import { content } from '../../data';
import { GREAT_FOES } from '../../data/greatFoes';
import type { GauntletState } from '../endgame/types';
import { createFoes, type FoesState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type FResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): FResult => ({ ok: false, reason });

/**
 * The great foes (items 113-120): eight named bosses sought out in the region where they lurk. Each is a short special fight; the
 * first victory gives gold, a title and a permanent boon. Their tricks live in `combat/rules.ts`. State: `realm.marvels.foes`.
 */
export class FoesActions {
  constructor(private readonly s: GameSession) {
    s.specials['greatfoe'] = (a, won) => this.ended(a, won);
  }

  get f(): FoesState {
    const m = this.s.state.realm.marvels;
    return (m.foes ??= createFoes());
  }

  mods(): ModifierSpec[] {
    return GREAT_FOES.filter((g) => this.f.defeated[g.id] !== undefined).map((g) => g.boon);
  }

  /** The three strongest Grudgebound still alive, across all regions. */
  court() {
    return Object.values(this.s.state.realm.grudge.entries)
      .filter((g) => g.slain === undefined)
      .sort((a, b) => b.scars - a.scars)
      .slice(0, 3);
  }

  seek(id: string): FResult {
    const g = GREAT_FOES.find((x) => x.id === id);
    if (!g) return fail('No such foe.');
    const p = this.s.player;
    if (g.zone && this.s.world.zone.id !== g.zone) return fail(`${g.hint}`);
    let waves = g.waves;
    let level = p.level + 1;
    let threat = 0;
    if (id === 'grudgebound-emperor') {
      const court = this.court();
      if (court.length < 3) return fail('The Emperor needs three living Grudgebound to rule. You have not made enough enemies.');
      waves = [court.map((c) => c.enemyId)];
      threat = court.reduce((n, c) => n + c.scars, 0) * 3;
      level = p.level + 2;
    }
    const r = this.s.endgame.startSpecial({ module: 'greatfoe', ref: id, label: `Great Foe: ${content.enemies.get(g.enemy).name}`, level, waves, ...(g.boss ? { boss: g.boss } : {}), threat });
    return r.ok ? { ok: true } : { ok: false, reason: r.reason };
  }

  private ended(a: GauntletState, won: boolean): void {
    const id = a.special?.ref ?? '';
    const g = GREAT_FOES.find((x) => x.id === id);
    if (!g) return;
    const f = this.f;
    if (!won) {
      this.s.bus.emit('toast', { kind: 'warning', text: 'The great foe stands. You will have to try again.' });
      return;
    }
    f.wins[id] = (f.wins[id] ?? 0) + 1;
    if (f.defeated[id] === undefined) {
      f.defeated[id] = this.s.state.clock.day;
      const gold = g.goldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'greatfoe');
      this.s.grantXp(30 * this.s.player.level, true);
      if (!this.s.player.devotion.titles.includes(g.title)) this.s.player.devotion.titles.push(g.title);
      this.s.bus.emit('toast', { kind: 'level', text: `${g.title}: +${gold} gold. ${g.boonText}` });
      this.s.wonders.refresh();
    }
    this.s.bus.emit('stateChanged', { reason: 'greatfoe' });
  }
}
