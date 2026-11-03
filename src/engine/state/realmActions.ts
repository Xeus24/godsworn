import { content } from '../../data';
import { GRUDGE } from '../../data/realm/grudge';
import type { Battle } from '../combat/battle';
import type { EncounterDef } from '../combat/types';
import { decorate, forge, fullName, grudgeBounty, hierarchy, mark, rankTitle, scheme, slay } from '../realm/grudge';
import type { GrudgeEntry, RealmState } from '../realm/types';
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
    for (let i = 0; i < Math.min(days, MAX_DAYS_AT_ONCE); i++) {
      const lines = scheme(this.state.grudge, this.s.state.clock.day - days + i + 1, this.s.rng);
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
}
