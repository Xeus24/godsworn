/**
 * Reachability graph of everything the quest condition evaluator can gate.
 * Nodes are quests; an edge A -> B means "A needs B completed (or active)" via
 * `requires`. Reports cycles, requirements on flags / items nothing in the data
 * can ever produce, and quests no one can offer. Pure data: no game state.
 * Run: npx tsx scripts/lockgraph.ts   (also run by tests/lockgraph.test.ts)
 */
import { content, type Content } from '../src/data';
import { ZONE_RITES } from '../src/data/locks';
import { PASSES } from '../src/data/world/areas';
import type { Cond } from '../src/engine/quests/types';
import { NG_PLUS } from '../src/data/ngPlus';

export interface LockReport {
  quests: number;
  edges: number;
  cycles: string[][];
  /** Quest conditions that need a flag nothing in the data sets (the engine may set it). */
  unsetFlags: { where: string; flag: string }[];
  /** Quest conditions that need an item nothing in the data hands out. */
  unobtainableItems: { where: string; item: string }[];
  /** Quests with no giver, board or auto start. */
  noEntry: string[];
}

type Json = unknown;

function walk(node: Json, visit: (o: Record<string, unknown>) => void, seen = new Set<object>()): void {
  if (node === null || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) { for (const x of node) walk(x, visit, seen); return; }
  visit(node as Record<string, unknown>);
  for (const v of Object.values(node)) walk(v, visit, seen);
}

function condLeaves(c: Cond | undefined, out: Cond[] = []): Cond[] {
  if (!c) return out;
  if (c.kind === 'all' || c.kind === 'any') c.conds.forEach((x) => condLeaves(x, out));
  else if (c.kind === 'not') condLeaves(c.cond, out);
  else out.push(c);
  return out;
}

/** Flags the engine sets from code (not from quest data), by prefix or exact name. */
export const ENGINE_FLAG_PREFIXES = ['saint:', 'holding-open:', 'affliction:'];
export const ENGINE_FLAGS = new Set(['forsworn', 'ng-tier']);
/** Items the engine hands out (curiosities on the road, trinket drops), by prefix or exact id. */
export const ENGINE_ITEM_PREFIXES = ['trinket-'];
export const ENGINE_ITEMS = new Set(['torn-treasure-chart', 'crowned-key', 'moth-eaten-playbill', 'glass-feather']);

/**
 * Walks the world as a hero would: starting in the Meadowlands, a zone is reachable when it is next door
 * (road) or joined by a pass to a reachable zone, and its entry rite (a quest) is doable using only quests
 * set in zones already reachable. Returns zones that can never be entered.
 */
export function unreachableZones(c: Content = content): string[] {
  const zones = c.zones.all().filter((z) => !z.ngPlus);
  const road = zones.filter((z) => !z.off).sort((a, b) => a.order - b.order);
  const near = new Map<string, Set<string>>();
  const link = (a: string, b: string): void => {
    (near.get(a) ?? near.set(a, new Set()).get(a)!).add(b);
    (near.get(b) ?? near.set(b, new Set()).get(b)!).add(a);
  };
  road.forEach((z, i) => { const n = road[i + 1]; if (n) link(z.id, n.id); });
  for (const p of PASSES) link(p.a, p.b);
  const quests = new Map(c.quests.all().map((q) => [q.id, q]));
  const chainZones = (id: string, seen = new Set<string>()): string[] => {
    const q = quests.get(id);
    if (!q || seen.has(id)) return [];
    seen.add(id);
    const out = q.zone ? [q.zone] : [];
    for (const leaf of condLeaves(q.requires)) if (leaf.kind === 'quest' && leaf.state === 'complete') out.push(...chainZones(leaf.quest, seen));
    return out;
  };
  const reach = new Set<string>(['meadowlands', 'ashfold']);
  let grew = true;
  while (grew) {
    grew = false;
    for (const z of [...reach]) {
      for (const n of near.get(z) ?? []) {
        if (reach.has(n) || !zones.some((x) => x.id === n)) continue;
        const rite = ZONE_RITES[n];
        if (rite && !chainZones(rite).every((cz) => reach.has(cz))) continue;
        reach.add(n);
        grew = true;
      }
    }
  }
  return zones.filter((z) => !reach.has(z.id) && z.id !== 'shattered-isles').map((z) => z.id);
}

/** Everything the data can produce: flags set, items given. */
export function producible(c: Content = content): { flagsSet: Set<string>; itemsGiven: Set<string> } {
  const flagsSet = new Set<string>();
  const itemsGiven = new Set<string>();
  for (const table of Object.values(c)) {
    const all = (table as { all?: () => unknown[] })?.all?.();
    if (!all) continue;
    walk(all, (o) => {
      if ((o.kind === 'setFlag' || o.kind === 'addCounter') && typeof o.flag === 'string') flagsSet.add(o.flag);
      if (o.kind === 'giveItem' && typeof o.itemId === 'string') itemsGiven.add(o.itemId);
      if (Array.isArray(o.items)) for (const i of o.items) if (i && typeof (i as { itemId?: unknown }).itemId === 'string') itemsGiven.add((i as { itemId: string }).itemId);
      if (Array.isArray(o.stock)) for (const i of o.stock) if (typeof i === 'string') itemsGiven.add(i);
      if (Array.isArray(o.entries)) for (const e of o.entries) if (e && typeof (e as { item?: unknown }).item === 'string') itemsGiven.add((e as { item: string }).item);
    });
  }

  return { flagsSet, itemsGiven };
}

export function buildLockReport(c: Content = content): LockReport {
  const quests = c.quests.all();
  const ids = new Set(quests.map((q) => q.id));

  const { flagsSet, itemsGiven } = producible(c);

  const edges = new Map<string, string[]>();
  const unsetFlags: LockReport['unsetFlags'] = [];
  const unobtainableItems: LockReport['unobtainableItems'] = [];
  let edgeCount = 0;
  for (const q of quests) {
    const out: string[] = [];
    for (const leaf of condLeaves(q.requires)) {
      if (leaf.kind === 'quest' && leaf.state !== 'notStarted' && ids.has(leaf.quest)) out.push(leaf.quest);
      if ((leaf.kind === 'flag' || leaf.kind === 'counter') && !flagsSet.has(leaf.flag) && !ENGINE_FLAGS.has(leaf.flag) && !ENGINE_FLAG_PREFIXES.some((p) => leaf.flag.startsWith(p))) unsetFlags.push({ where: q.id, flag: leaf.flag });
      if (leaf.kind === 'item' && !itemsGiven.has(leaf.itemId) && !ENGINE_ITEMS.has(leaf.itemId) && !ENGINE_ITEM_PREFIXES.some((p) => leaf.itemId.startsWith(p))) unobtainableItems.push({ where: q.id, item: leaf.itemId });
    }
    edges.set(q.id, out);
    edgeCount += out.length;
  }

  // Cycles by depth-first search with colouring.
  const cycles: string[][] = [];
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const dfs = (n: string): void => {
    state.set(n, 1); stack.push(n);
    for (const m of edges.get(n) ?? []) {
      if (state.get(m) === 1) cycles.push([...stack.slice(stack.indexOf(m)), m]);
      else if (!state.has(m)) dfs(m);
    }
    stack.pop(); state.set(n, 2);
  };
  for (const id of ids) if (!state.has(id)) dfs(id);

  const noEntry = quests.filter((q) => !(q.auto || q.giver || q.board)).map((q) => q.id);
  return { quests: quests.length, edges: edgeCount, cycles, unsetFlags, unobtainableItems, noEntry };
}

export interface LockGraphReport {
  locks: number;
  /** Lock-to-lock edges (an `unlocked` condition naming another lock). */
  edges: number;
  cycles: string[][];
  /** Locks no hero can ever open, walking from a new game. */
  unreachable: string[];
}

/**
 * The lock graph. Nodes are locks; an edge A -> B means A's requirement names lock B (`unlocked`).
 * Walks from a new game: a lock opens once its requirement can hold given the locks already open.
 * A leaf is achievable when it is within the game's limits (levels up to the cap of the last walk of the
 * Road, tiers up to the last) and names something the data can produce (a quest someone offers, an item
 * or flag something hands out). `not` leaves are taken as achievable (they only ever narrow, never gate).
 */
export function lockReachability(c: Content = content): LockGraphReport {
  const locks = c.locks.all();
  const { flagsSet, itemsGiven } = producible(c);
  const offered = new Set(c.quests.all().filter((q) => q.auto || q.giver || q.board).map((q) => q.id));
  const edges = new Map<string, string[]>();
  let edgeCount = 0;
  for (const l of locks) {
    const out = condLeaves(l.requirement).flatMap((x) => (x.kind === 'unlocked' ? [x.lock] : []));
    edges.set(l.id, out);
    edgeCount += out.length;
  }
  const cycles: string[][] = [];
  const colour = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const dfs = (n: string): void => {
    colour.set(n, 1); stack.push(n);
    for (const m of edges.get(n) ?? []) {
      if (colour.get(m) === 1) cycles.push([...stack.slice(stack.indexOf(m)), m]);
      else if (!colour.has(m)) dfs(m);
    }
    stack.pop(); colour.set(n, 2);
  };
  for (const l of locks) if (!colour.has(l.id)) dfs(l.id);

  const open = new Set<string>();
  const can = (x: Cond): boolean => {
    switch (x.kind) {
      case 'all': return x.conds.every(can);
      case 'any': return x.conds.some(can);
      case 'not': return true;
      case 'unlocked': return open.has(x.lock);
      case 'level': return x.min <= NG_PLUS.levelToMax;
      case 'ngPlus': return x.min <= NG_PLUS.maxTier;
      case 'quest': return x.state === 'notStarted' || offered.has(x.quest);
      case 'item': return itemsGiven.has(x.itemId) || ENGINE_ITEMS.has(x.itemId) || ENGINE_ITEM_PREFIXES.some((p) => x.itemId.startsWith(p));
      case 'flag':
      case 'counter': return flagsSet.has(x.flag) || ENGINE_FLAGS.has(x.flag) || ENGINE_FLAG_PREFIXES.some((p) => x.flag.startsWith(p));
      default: return true;
    }
  };
  for (let grew = true; grew; ) {
    grew = false;
    for (const l of locks) if (!open.has(l.id) && can(l.requirement)) { open.add(l.id); grew = true; }
  }
  return { locks: locks.length, edges: edgeCount, cycles, unreachable: locks.filter((l) => !open.has(l.id)).map((l) => l.id) };
}

if (process.argv[1]?.endsWith('lockgraph.ts')) {
  const g = lockReachability();
  console.log(`locks ${g.locks}, lock edges ${g.edges}, lock cycles ${g.cycles.length}, never open ${g.unreachable.join(', ') || 'none'}`);
  const r = buildLockReport();
  console.log(`quests ${r.quests}, edges ${r.edges}, cycles ${r.cycles.length}, no entry ${r.noEntry.length}`);
  for (const cy of r.cycles) console.log('CYCLE', cy.join(' -> '));
  console.log('unreachable zones:', unreachableZones().join(', ') || 'none');
  console.log(`flags needed but not set by data: ${r.unsetFlags.length}`);
  for (const f of r.unsetFlags.slice(0, 40)) console.log(`  ${f.where}: ${f.flag}`);
  console.log(`items needed but not given by data: ${r.unobtainableItems.length}`);
  for (const f of r.unobtainableItems.slice(0, 40)) console.log(`  ${f.where}: ${f.item}`);
  process.exitCode = r.cycles.length || r.noEntry.length ? 1 : 0;
}
