/**
 * Reachability graph of everything the quest condition evaluator can gate.
 * Nodes are quests; an edge A -> B means "A needs B completed (or active)" via
 * `requires`. Reports cycles, requirements on flags / items nothing in the data
 * can ever produce, and quests no one can offer. Pure data: no game state.
 * Run: npx tsx scripts/lockgraph.ts   (also run by tests/lockgraph.test.ts)
 */
import { content, type Content } from '../src/data';
import type { Cond } from '../src/engine/quests/types';

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

export function buildLockReport(c: Content = content): LockReport {
  const quests = c.quests.all();
  const ids = new Set(quests.map((q) => q.id));

  // Everything the data can produce: flags set, items given.
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

if (process.argv[1]?.endsWith('lockgraph.ts')) {
  const r = buildLockReport();
  console.log(`quests ${r.quests}, edges ${r.edges}, cycles ${r.cycles.length}, no entry ${r.noEntry.length}`);
  for (const cy of r.cycles) console.log('CYCLE', cy.join(' -> '));
  console.log(`flags needed but not set by data: ${r.unsetFlags.length}`);
  for (const f of r.unsetFlags.slice(0, 40)) console.log(`  ${f.where}: ${f.flag}`);
  console.log(`items needed but not given by data: ${r.unobtainableItems.length}`);
  for (const f of r.unobtainableItems.slice(0, 40)) console.log(`  ${f.where}: ${f.item}`);
  process.exitCode = r.cycles.length || r.noEntry.length ? 1 : 0;
}
