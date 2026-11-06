import { content } from '../../data';
import { BARGAIN, BARGAINS, PLANES, THRESHOLD, type Plane } from '../../data/realms';
import { characterStats } from '../character/stats';
import type { GauntletState } from '../endgame/types';
import { createRealms, type RealmsState } from '../realm/marvels';
import type { ModifierSpec } from '../stats/modifiers';
import type { MechanicResult } from '../world/mechanics';
import type { GameSession } from './gameState';

export type RResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): RResult => ({ ok: false, reason });
const COURT = ['gloaming-ring', 'thistle-market', 'moonlit-orchard', 'court-of-whispers', 'weavers-pool', 'hollow-hill-gate', 'briar-court', 'sunless-ballroom'];

/** Section I-8a: the Gloaming Court's fey bargains (224) and the Four Thresholds (225). State: `realm.marvels.realms`. */
export class RealmsActions {
  constructor(private readonly s: GameSession) {
    s.specials['realm'] = (a, won) => this.fightEnded(a, won);
    s.bus.on('timeChanged', () => this.tick());
  }

  get t(): RealmsState {
    const m = this.s.state.realm.marvels;
    return (m.realms ??= createRealms());
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

  here(): string {
    return this.s.state.world.position.map;
  }

  inCourt(): boolean {
    return COURT.includes(this.here());
  }

  planeAt(map = this.here()): Plane | undefined {
    return PLANES.find((p) => p.areas.includes(map as Plane['areas'][number]));
  }

  // ------------------------------------------------------------------ doors

  /** Why a door is shut, or nothing if it is open. The ring opens at night; the rest of the Court once you have stood in it; a plane once opened. */
  shut(ref: string): string | undefined {
    const t = this.t;
    if (ref === 'gloaming-ring') return t.ringSeen || this.s.timeOfDay === 'night' ? undefined : 'The ring is only mushrooms by day. Come back after dark.';
    if (COURT.includes(ref)) return t.ringSeen ? undefined : 'No path leads there. Find the ring first.';
    const plane = this.planeAt(ref);
    if (plane && !t.open.includes(plane.id)) return `${plane.name} is shut. Open it from the Codex (Realm > Pockets & Wilds).`;
    return undefined;
  }

  onMap(map: string): void {
    if (map === 'gloaming-ring' && !this.t.ringSeen) {
      this.t.ringSeen = true;
      this.note('You step into the ring, and the wood on the other side is not the wood you left. The Court is open to you.', 'quest');
    }
  }

  // ------------------------------------------------------------------ 224: bargains

  struck(): string[] {
    return Object.keys(this.t.bargains);
  }

  /** Bargains whose cost is not yet paid off. */
  owing(): string[] {
    return this.struck().filter((id) => !this.t.bargains[id]?.paid);
  }

  daysLeft(id: string): number {
    const b = this.t.bargains[id];
    return b ? Math.max(0, b.day + BARGAIN.revealDays - this.day) : 0;
  }

  buybackCost(): number {
    return BARGAIN.buybackPerLevel * this.s.player.level;
  }

  strike(id: string): RResult {
    const def = BARGAINS.find((b) => b.id === id);
    if (!def) return fail('The fey do not know that bargain.');
    if (!this.inCourt()) return fail('Bargains are struck in the Court, and only there.');
    if (this.t.bargains[id]) return fail('That bargain is already struck.');
    if (this.owing().length >= BARGAIN.maxActive) return fail(`The fey will not run a longer tab than ${BARGAIN.maxActive}. Settle one first.`);
    this.t.bargains[id] = { day: this.day, due: false, paid: false };
    this.note(`Bargain struck: ${def.name}. The fey smile and do not say what it will cost.`, 'quest');
    this.changed('realms');
    return { ok: true, text: `${def.name}: ${def.offer}` };
  }

  /** Pays off a bargain’s cost for gold. The gain stays. */
  settle(id: string): RResult {
    const b = this.t.bargains[id];
    if (!b || b.paid) return fail('Nothing owed.');
    const price = this.buybackCost();
    if (this.s.state.gold < price) return fail(`The fey want ${price} gold.`);
    this.s.spendGold(price, 'bargain');
    b.paid = true;
    if (Object.values(this.t.bargains).filter((x) => x.paid).length >= 3) this.title(BARGAIN.title);
    this.note(`The debt is struck from the ledger. ${BARGAINS.find((x) => x.id === id)?.name ?? 'The bargain'} stays yours.`, 'level');
    this.changed('realms');
    return { ok: true, text: 'Settled.' };
  }

  /** Costs come due a few days after the deal, and the fey say so once. */
  private tick(): void {
    let changed = false;
    for (const [id, b] of Object.entries(this.t.bargains)) {
      if (b.due || b.paid || this.day < b.day + BARGAIN.revealDays) continue;
      b.due = true;
      changed = true;
      const def = BARGAINS.find((x) => x.id === id);
      if (def) this.note(`${def.name} comes due: ${def.costText}`, 'warning');
    }
    if (changed) this.changed('realms');
  }

  private scale(m: ModifierSpec): ModifierSpec {
    const half = this.s.player.raceId === 'duskfae';
    return half ? ({ ...m, value: (m as { value: number }).value * BARGAIN.duskfaeCostScale } as ModifierSpec) : m;
  }

  // ------------------------------------------------------------------ 225: the thresholds

  /** Whether a mentor fight has been won (the Geomancer’s and the Summoner’s questlines end there). */
  mentorBeaten(plane: Plane): boolean {
    return (this.s.player.bestiary[plane.mentor] ?? 0) > 0;
  }

  openCost(): number {
    return THRESHOLD.tollPerLevel * this.s.player.level;
  }

  open(id: string): RResult {
    const plane = PLANES.find((p) => p.id === id);
    if (!plane) return fail('No such threshold.');
    if (this.t.open.includes(id)) return fail('Already open.');
    if (this.mentorBeaten(plane)) {
      this.t.open.push(id);
      this.note(`${plane.name} opens to the one who earned the class’s trust.`, 'quest');
    } else {
      const price = this.openCost();
      if (this.s.state.gold < price) return fail(`Without the mentor’s leave, the toll is ${price} gold.`);
      this.s.spendGold(price, 'threshold');
      this.t.tollPaid += price;
      this.t.open.push(id);
      this.note(`You pay the toll. ${plane.name} opens, grudgingly.`, 'quest');
    }
    this.changed('realms');
    return { ok: true, text: `${plane.name} is open.` };
  }

  faceWarden(id: string): RResult {
    const plane = PLANES.find((p) => p.id === id);
    if (!plane) return fail('No such threshold.');
    if (!this.t.open.includes(id)) return fail('Open the threshold first.');
    if (this.here() !== plane.areas[2]) return fail(`The Warden waits in ${content.areas.get(plane.areas[2]).name}.`);
    if (this.t.wardens.includes(id)) return fail('The Warden has already yielded.');
    const waves = [[plane.foes[0], plane.foes[1]], [plane.foes[1], plane.foes[0], plane.foes[1]]];
    const r = this.s.endgame.startSpecial({ module: 'realm', ref: id, label: plane.name, level: plane.level, waves, threat: 0, boss: plane.warden });
    return r.ok ? { ok: true, text: 'The Warden rises.' } : fail(r.reason);
  }

  private fightEnded(a: GauntletState, won: boolean): void {
    const plane = PLANES.find((p) => p.id === a.special?.ref);
    if (plane && won && !this.t.wardens.includes(plane.id)) {
      this.t.wardens.push(plane.id);
      this.title(plane.title);
      const gold = THRESHOLD.wardenGoldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'threshold');
      this.note(`The Warden yields. ${plane.title}: +${gold} gold and a lasting boon.`, 'level');
      if (this.t.wardens.length === PLANES.length) this.title(THRESHOLD.allFour);
    } else if (plane && !won) this.note('The Warden turns you out. The Threshold will wait.', 'warning');
    this.changed('realms');
  }

  /** Harm from the plane under your feet, eased by the matching resistance. */
  step(map: string): MechanicResult {
    const plane = this.planeAt(map);
    if (!plane) return {};
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    const harm = Math.max(0, THRESHOLD.harm - (stats[`${plane.element}Resist`] ?? 0) * THRESHOLD.perResist);
    return harm > 0 ? { harm, message: `The ${plane.id} presses in on you.` } : {};
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const [id, b] of Object.entries(this.t.bargains)) {
      const def = BARGAINS.find((x) => x.id === id);
      if (!def) continue;
      out.push(...def.gain);
      if (b.due && !b.paid) out.push(...def.cost.map((c) => this.scale(c)));
    }
    for (const id of this.t.wardens) out.push(...(PLANES.find((p) => p.id === id)?.boon ?? []));
    return out;
  }
}
