import { content } from '../../data';
import { GRUDGE } from '../../data/realm/grudge';
import type { Battle } from '../combat/battle';
import type { EncounterDef } from '../combat/types';
import { FORTUNES } from '../../data/realm/fortunes';
import { fortuneOf, innMult, isFallen, lift, priceMult, tick as fortunesTick, tierOf } from '../realm/fortunes';
import { decorate, forge, fullName, grudgeBounty, hierarchy, mark, rankTitle, scheme, slay } from '../realm/grudge';
import type { GrudgeEntry, RealmState } from '../realm/types';
import { festivalOn } from '../realm/wheel';
import { doDeed, marrowRewards, talk as marrowTalk, wait as marrowWait, type MarrowResult } from '../realm/marrow';
import type { MarrowPlace } from '../../data/realm/marrow';
import type { GameSession } from './gameState';

/** How many days of scheming one long rest or voyage can run (a year away does not run a year of them). */
const MAX_DAYS_AT_ONCE = 14;
/** Foes that never become Grudgebound: the story's own bosses and their guards. */
const UNMARKED_TIERS = new Set(['boss', 'worldBoss', 'miniboss', 'punisher']);

/**
 * The living world of Vael (Innovation Pack, section A): the Grudgebound, and later the Turning Wheel, the Three
 * Days of Marrow, Fortunes of the Realm, Echoes of the Fallen and the Chronicle of Ages.
 */
export class RealmActions {
  constructor(private readonly s: GameSession) {}

  get state(): RealmState {
    return this.s.state.realm;
  }

  // ------------------------------------------------------------ the Grudgebound

  /** A wandering fight may be led by one of the region's Grudgebound. */
  decorate(encounter: EncounterDef, zone: string): EncounterDef {
    return decorate(this.state.grudge, encounter, zone, this.s.player.name, this.s.rng);
  }

  /** The Grudgebound of a region, top of the order first. */
  grudgebound(zone: string): GrudgeEntry[] {
    return hierarchy(this.state.grudge, zone);
  }

  /** Days pass: every region's pecking order schemes. */
  onDays(days: number): void {
    const today = festivalOn(this.s.state.clock.day);
    if (today) this.s.bus.emit('toast', { kind: 'quest', text: `Today is ${today.name}, the feast of ${content.gods.get(today.god).name}. Find it in ${content.towns.get(today.town).name}.` });
    for (let i = 0; i < Math.min(days, MAX_DAYS_AT_ONCE); i++) {
      const day = this.s.state.clock.day - days + i + 1;
      const news = fortunesTick(this.state.fortunes, this.state.grudge, this.s.player, day, this.s.rng);
      if (news[0]) this.s.bus.emit('toast', { kind: 'warning', text: news[0] });
      const lines = scheme(this.state.grudge, day, this.s.rng);
      const first = lines[0];
      if (first && i === Math.min(days, MAX_DAYS_AT_ONCE) - 1) this.s.bus.emit('toast', { kind: 'info', text: `Word on the road: ${first}` });
    }
  }

  /** After a fight: foes that beat you or were run from get named; Grudgebound you killed are put down. */
  afterBattle(b: Battle): void {
    const day = this.s.state.clock.day;
    const st = this.state.grudge;
    for (const x of b.combatants) {
      if (x.side !== 'enemy' || !x.grudgeId || x.alive) continue;
      const g = st.entries[x.grudgeId];
      if (!g || g.slain !== undefined) continue;
      slay(st, g.id, day);
      const bounty = grudgeBounty(g, x.level);
      this.s.addGold(bounty.gold, 'grudge');
      this.s.grantXp(bounty.xp);
      this.s.bus.emit('toast', { kind: 'quest', text: `${fullName(g)}, ${rankTitle(g.rank)}, is dead. The road pays ${bounty.gold} gold.` });
    }
    if (b.isBoss || !b.encounterId.startsWith('wild:')) return;
    const zone = b.encounterId.slice('wild:'.length);
    if (!content.zones.find(zone)) return;
    if (b.outcome !== 'defeat' && b.outcome !== 'fled') return;
    const alive = b.combatants.filter((x) => x.side === 'enemy' && x.alive && x.kind === 'enemy' && x.enemyId && !UNMARKED_TIERS.has(x.tier));
    if (!alive.length) return;
    // The Grudgebound among them, or else the toughest one standing.
    const lead = alive.find((x) => x.grudgeId) ?? [...alive].sort((p, q) => q.level - p.level)[0];
    if (!lead?.enemyId) return;
    const beat = b.outcome === 'defeat';
    if (!beat && !lead.grudgeId && !this.s.rng.chance(GRUDGE.markOnFlee)) return;
    const result = mark(st, zone, lead.enemyId, lead.grudgeId, beat ? 'beat' : 'fled', day, this.s.rng);
    if (!result) return;
    const { entry, fresh } = result;
    this.s.bus.emit('toast', { kind: 'warning', text: fresh ? `${fullName(entry)} has your scent now. The whisper gave it a name.` : `${fullName(entry)} grows another scar. It remembers.` });
  }

  /** For tests and the debug panel: forges a Grudgebound outright. */
  forge(zone: string, enemyId: string, cause: GrudgeEntry['cause'] = 'beat'): GrudgeEntry | null {
    return forge(this.state.grudge, zone, enemyId, cause, this.s.state.clock.day, this.s.rng);
  }

  // ------------------------------------------------------------ the Three Days of Marrow

  private marrowEnd(result: MarrowResult): MarrowResult {
    if (result.ok && (result.ended === 'mended' || result.ended === 'emptied')) {
      const r = marrowRewards(result.ended);
      this.s.addGold(r.gold, 'marrow');
      this.s.grantXp(r.xp);
      this.s.devotion.apply(r.favor as Record<string, number>, 'quest');
      if (result.ended === 'mended') this.s.bus.emit('toast', { kind: 'level', text: 'Marrow is mended. The loop is broken for good.' });
      else this.s.bus.emit('toast', { kind: 'level', text: 'Marrow is emptied, but alive. The loop is broken.' });
      this.s.setFlag(`marrow-${result.ended}`, true);
      this.s.bus.emit('stateChanged', { reason: 'marrow' });
    }
    return result;
  }

  marrowTalk(villager: string, place: MarrowPlace): MarrowResult {
    const r = this.marrowEnd(marrowTalk(this.state.marrow, villager, place));
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }

  marrowDeed(deed: string, place: MarrowPlace): MarrowResult {
    const r = this.marrowEnd(doDeed(this.state.marrow, deed, place));
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }

  marrowWait(): MarrowResult {
    const r = marrowWait(this.state.marrow);
    this.s.bus.emit('stateChanged', { reason: 'marrow' });
    return r;
  }


  // ------------------------------------------------------------ Fortunes of the Realm

  priceMult(town: string): number {
    return priceMult(this.state.fortunes, town);
  }

  innMult(town: string): number {
    return innMult(this.state.fortunes, town);
  }

  isFallen(town: string): boolean {
    return isFallen(this.state.fortunes, town);
  }

  /** Raises (or lowers) a town's prosperity; a change of fortune is news. */
  lift(town: string, amount: number): void {
    const line = lift(this.state.fortunes, town, amount, this.s.state.clock.day);
    if (line) this.s.bus.emit('toast', { kind: amount >= 0 ? 'quest' : 'warning', text: line });
  }

  fortune(town: string) {
    const f = fortuneOf(this.state.fortunes, town);
    return { ...f, tier: tierOf(f) };
  }

  fundCost(): number {
    return FORTUNES.fundCostPerLevel * Math.max(5, this.s.player.level);
  }

  /** Gives gold to the town's repairs. */
  fund(town: string): { ok: boolean; reason?: string } {
    const cost = this.fundCost();
    if (!this.s.spendGold(cost, 'fortune')) return { ok: false, reason: `Repairs need ${cost} gold.` };
    this.lift(town, FORTUNES.fundGain);
    this.s.bus.emit('stateChanged', { reason: 'fortune' });
    return { ok: true };
  }
}
