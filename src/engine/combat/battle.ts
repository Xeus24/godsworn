import { content, type Content } from '../../data';
import type { Rng } from '../core/rng';
import { TriggerSystem } from '../effects/triggers';
import { calculateStats } from '../stats/calculate';
import type { ConditionContext } from '../stats/conditions';
import type { Modifier } from '../stats/modifiers';
import type { StatBlock } from '../stats/types';
import type { BattleEvent, BattleOutcome, BattleTally, Combatant, Side } from './types';

export interface BattleHooks {
  /** Removes one of the item from the player's bags. Returns false if there is none. */
  consumeItem?: (itemId: string) => boolean;
  itemCount?: (itemId: string) => number;
}

export interface BattleSetup {
  party: Combatant[];
  enemies: Combatant[];
  rng: Rng;
  encounterId: string;
  canFlee: boolean;
  isBoss?: boolean;
  timeOfDay?: 'day' | 'night';
  hooks?: BattleHooks;
  c?: Content;
}

/**
 * The state of one fight. Rules live in sibling modules (hits, statuses,
 * effects, skills, turns, ai) that operate on a Battle; this class holds
 * state and the shared lookups they all need.
 */
export class Battle {
  readonly combatants: Combatant[];
  readonly rng: Rng;
  readonly triggers: TriggerSystem;
  readonly c: Content;
  readonly encounterId: string;
  readonly canFlee: boolean;
  readonly isBoss: boolean;
  readonly timeOfDay: 'day' | 'night';
  readonly hooks: BattleHooks;
  outcome: BattleOutcome = 'ongoing';
  /** Initiative clock: the time of the most recent turn. */
  time = 0;
  /** Number of turns taken so far by anyone. */
  turnCount = 0;
  /** Whose turn it is, once `advance` has handed control to an actor. */
  current: Combatant | undefined;
  /** Consecutive party hits on one target. */
  chain: { targetId?: string; count: number; lastSide?: Side } = { count: 0 };
  readonly tally: BattleTally = { kills: [], partyCrits: 0, partyHeals: 0, highestHit: 0, goldFound: 0, favor: [], itemsUsed: {}, skillUses: {}, generalUses: {}, tagUses: {}, summons: 0 };
  /** Events produced since the last drain. */
  private buffer: BattleEvent[] = [];
  private uid = 0;
  /** Guards against effects triggering effects forever. */
  depth = 0;

  constructor(setup: BattleSetup) {
    this.c = setup.c ?? content;
    this.rng = setup.rng;
    this.combatants = [...setup.party, ...setup.enemies];
    this.encounterId = setup.encounterId;
    this.canFlee = setup.canFlee;
    this.isBoss = setup.isBoss ?? false;
    this.timeOfDay = setup.timeOfDay ?? 'day';
    this.hooks = setup.hooks ?? {};
    this.triggers = new TriggerSystem(this.rng);
    for (const x of this.combatants) this.registerTriggers(x);
  }

  registerTriggers(x: Combatant): void {
    for (const t of x.triggers) this.triggers.register(x.id, t.effect, t.source);
  }

  newId(prefix: string): string {
    this.uid++;
    return `${prefix}-${this.uid}`;
  }

  emit(event: BattleEvent): void {
    this.buffer.push(event);
  }

  log(text: string): void {
    this.emit({ type: 'log', text });
  }

  drain(): BattleEvent[] {
    const out = this.buffer;
    this.buffer = [];
    return out;
  }

  get(id: string): Combatant | undefined {
    return this.combatants.find((x) => x.id === id);
  }

  alive(side?: Side): Combatant[] {
    return this.combatants.filter((x) => x.alive && (side === undefined || x.side === side));
  }

  /** Allies of `x` (including itself). A charmed combatant still counts its own side as allies. */
  allies(x: Combatant): Combatant[] {
    return this.alive(x.side);
  }

  opponents(x: Combatant): Combatant[] {
    return this.alive(x.side === 'party' ? 'enemy' : 'party');
  }

  /** Every modifier active on `x` right now: base, statuses, buffs, stance, allied songs. */
  combatModifiers(x: Combatant): Modifier[] {
    const mods: Modifier[] = [...x.statInput.modifiers];
    for (const s of x.statuses) {
      const def = this.c.statuses.get(s.id);
      const mult = def.perStack ? s.stacks : 1;
      for (const m of def.modifiers ?? []) mods.push({ ...m, value: m.value * mult, source: `status:${s.id}` });
    }
    for (const b of x.buffs) for (const m of b.modifiers) mods.push({ ...m, source: `buff:${b.id}` });
    if (x.stance) for (const m of this.c.stances.get(x.stance).modifiers) mods.push({ ...m, source: `stance:${x.stance}` });
    const songs = new Set<string>();
    for (const ally of this.alive(x.side)) for (const song of ally.songs) songs.add(song);
    for (const song of songs) for (const m of this.c.songs.get(song).aura) mods.push({ ...m, source: `song:${song}` });
    return mods;
  }

  /** Context for conditional modifiers. `extra` adds skill tags, target info, etc. */
  context(x: Combatant, extra: ConditionContext = {}): ConditionContext {
    return {
      inCombat: true,
      hpPct: (x.hp / Math.max(1, x.maxHp)) * 100,
      statuses: x.statuses.map((s) => s.id),
      stance: x.stance,
      resources: x.resources,
      timeOfDay: this.timeOfDay,
      weaponTypes: x.weaponTypes,
      ...(x.patron ? { patron: x.patron } : {}),
      ...extra,
    };
  }

  /** Full combat stats, refreshing the cached maximums. */
  stats(x: Combatant, extra: ConditionContext = {}): StatBlock {
    const s = calculateStats({ ...x.statInput, modifiers: this.combatModifiers(x) }, this.context(x, extra));
    x.maxHp = s.maxHp;
    x.maxMp = s.maxMp;
    if (x.hp > s.maxHp) x.hp = s.maxHp;
    if (x.mp > s.maxMp) x.mp = s.maxMp;
    return s;
  }

  /** Side considered "theirs" when choosing targets; charm flips it. */
  isCharmed(x: Combatant): boolean {
    return x.statuses.some((s) => this.c.statuses.get(s.id).charmed);
  }

  hasStatus(x: Combatant, id: string): boolean {
    return x.statuses.some((s) => s.id === id);
  }

  hasFlag(x: Combatant, flag: string): boolean {
    return x.flags.includes(flag);
  }

  /** The party loses when no hero or companion is standing; summons alone cannot win. */
  checkOutcome(): BattleOutcome {
    if (this.outcome !== 'ongoing') return this.outcome;
    const partyStanding = this.alive('party').some((x) => x.kind === 'hero' || x.kind === 'companion');
    if (!partyStanding) this.outcome = 'defeat';
    else if (this.alive('enemy').length === 0) this.outcome = 'victory';
    if (this.outcome !== 'ongoing') this.emit({ type: 'end', outcome: this.outcome });
    return this.outcome;
  }

  /** Party members the player commands (heroes and companions that are not charmed). */
  isPlayerControlled(x: Combatant): boolean {
    return (x.kind === 'hero' || x.kind === 'companion') && !this.isCharmed(x);
  }
}
