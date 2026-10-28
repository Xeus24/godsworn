import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import { activeBuild, availablePoints, buildIsValid, treeOf, type TreeResult } from './tree';
import { ownsTree } from './treeOwners';

/**
 * Share codes: a build exported as text ("GSB1-" and base64 of a small JSON) that another hero of the
 * same class can import into their active build. Only node ranks, skill modifiers and the hotbar travel.
 */
const PREFIX = 'GSB1-';

interface Payload {
  c: string;
  r: Record<string, number>;
  v: Record<string, string>;
  h: (string | null)[];
}

const b64 = (s: string): string => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'));
const unb64 = (s: string): string => (typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'));

export function exportBuild(char: Character, classId: string): string {
  const b = activeBuild(char, classId);
  const payload: Payload = { c: classId, r: b.ranks, v: b.variants, h: b.hotbar };
  return PREFIX + b64(JSON.stringify(payload));
}

export function importBuild(char: Character, classId: string, code: string, c: Content = content): TreeResult {
  const text = code.trim();
  if (!text.startsWith(PREFIX)) return { ok: false, reason: 'That is not a Godsworn build code.' };
  let p: Payload;
  try {
    p = JSON.parse(unb64(text.slice(PREFIX.length))) as Payload;
  } catch {
    return { ok: false, reason: 'The code is damaged.' };
  }
  if (p.c !== classId) return { ok: false, reason: `That build is for ${c.classes.find(p.c)?.name ?? 'another class'}.` };
  if (!ownsTree(char, classId)) return { ok: false, reason: 'You have not learned this class.' };
  const tree = treeOf(classId, c);
  const ranks: Record<string, number> = {};
  for (const [id, r] of Object.entries(p.r ?? {})) {
    const node = tree.nodes.find((n) => n.id === id);
    if (!node) return { ok: false, reason: `Unknown node "${id}".` };
    if (!Number.isInteger(r) || r < 1 || r > node.maxRank) return { ok: false, reason: `Bad rank for ${node.name}.` };
    if (node.feat) return { ok: false, reason: `${node.name} is a secret node you have not revealed.` };
    ranks[id] = r;
  }
  const build = activeBuild(char, classId);
  const trial = { ...build, ranks };
  if (!buildIsValid(trial, tree)) return { ok: false, reason: 'That build breaks the tree’s rules (tier gates or parents).' };
  const spent = Object.values(ranks).reduce((a, b) => a + b, 0);
  if (spent > availablePoints(char, classId) + Object.values(build.ranks).reduce((a, b) => a + b, 0)) return { ok: false, reason: `That build needs ${spent} skill points.` };
  build.ranks = ranks;
  build.variants = Object.fromEntries(Object.entries(p.v ?? {}).filter(([, node]) => ranks[node] !== undefined));
  return { ok: true };
}
