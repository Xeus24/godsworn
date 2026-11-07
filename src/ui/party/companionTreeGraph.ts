import { featMet } from '../../engine/skills/feats';
import { activeBuild, branchPoints, canAllocate, rankOf, treeOf } from '../../engine/skills/tree';
import { chosenSpec } from '../../engine/skills/specs';
import type { TreeNodeDef } from '../../engine/skills/treeTypes';
import type { Character } from '../../engine/character/types';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { el } from '../screen';
import { describeNode } from '../tree/nodeText';

const NS = 'http://www.w3.org/2000/svg';
const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

/** The pan and zoom of a companion's graph, kept by the party screen so a re-render does not reset it. */
export interface GraphView {
  x: number;
  y: number;
  scale: number;
  fitted: boolean;
}

export interface CompanionGraphOptions {
  char: Character;
  classId: string;
  /** Auto-allocate is on: the graph is read-only. */
  auto: boolean;
  view: GraphView;
  allocate(nodeId: string): void;
  refund(nodeId: string): void;
}

const SIZE: Record<TreeNodeDef['kind'], number> = { active: 22, modifier: 14, minor: 12, notable: 18, choice: 17, keystone: 22, capstone: 26 };

/** Which nodes a companion's graph shows: no keystones (they cost Mastery Points), only their specialization, no secrets still hidden. */
export function graphNodes(char: Character, classId: string): { branches: { id: string; name: string; color: string }[]; nodes: TreeNodeDef[] } {
  const tree = treeOf(classId);
  const spec = chosenSpec(char, classId)?.id;
  const build = activeBuild(char, classId);
  const shown = (n: TreeNodeDef): boolean => n.kind !== 'keystone' && (!n.feat || featMet(char, n.feat, classId) || rankOf(build, n.id) > 0);
  const branches = tree.branches.filter((b) => (!b.spec || b.spec === spec) && !b.promotion);
  const ids = new Set(branches.map((b) => b.id));
  const nodes = tree.nodes.filter((n) => ids.has(n.branch) && shown(n));
  return { branches: branches.filter((b) => nodes.some((n) => n.branch === b.id)), nodes };
}

/** An editable graph of a companion's skill tree: click a node to spend a point, right-click or shift-click to take one back. */
export function companionTreeGraph(o: CompanionGraphOptions): HTMLElement {
  const { branches, nodes } = graphNodes(o.char, o.classId);
  const tree = treeOf(o.classId);
  const build = activeBuild(o.char, o.classId);
  const color = new Map(branches.map((b) => [b.id, b.color]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const root = svg('svg', { class: 'tree-svg', role: 'group', 'aria-label': 'Companion skill tree' });
  const layer = svg('g');
  root.append(layer);
  const apply = (): void => layer.setAttribute('transform', `translate(${o.view.x} ${o.view.y}) scale(${o.view.scale})`);

  for (const n of nodes) {
    for (const pid of n.parents) {
      const p = byId.get(pid);
      if (!p) continue;
      const lit = rankOf(build, n.id) > 0 && rankOf(build, pid) > 0;
      layer.append(svg('line', { x1: p.x, y1: p.y, x2: n.x, y2: n.y, stroke: lit ? (color.get(n.branch) ?? '#fff') : '#76679a', 'stroke-width': lit ? 4 : 2.5 }));
    }
  }
  for (const b of branches) {
    const xs = nodes.filter((n) => n.branch === b.id).map((n) => n.x);
    const t = svg('text', { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: 24, 'text-anchor': 'middle', class: 'tree-branch-title', fill: b.color });
    t.textContent = `${b.name} (${branchPoints(build, tree, b.id)})`;
    layer.append(t);
  }
  for (const n of nodes) {
    const rank = rankOf(build, n.id);
    const ok = canAllocate(o.char, o.classId, n.id).ok;
    const state = rank >= n.maxRank ? 'maxed' : rank > 0 ? 'allocated' : ok ? 'available' : 'locked';
    const c = color.get(n.branch) ?? '#888';
    const r = SIZE[n.kind];
    const fill = state === 'allocated' || state === 'maxed' ? c : state === 'locked' ? '#261b36' : '#1a1226';
    const stroke = state === 'locked' ? '#7a6a92' : state === 'available' ? '#f4f0e8' : c;
    const common = { fill, stroke, 'stroke-width': 3 };
    const g = svg('g', { transform: `translate(${n.x} ${n.y})`, class: `tree-node ${state}`, tabindex: 0, role: 'button', 'aria-label': `${n.name}, rank ${rank} of ${n.maxRank}` });
    g.append(n.kind === 'active' ? svg('rect', { x: -r, y: -r, width: r * 2, height: r * 2, rx: 8, ...common }) : n.kind === 'modifier' ? svg('polygon', { points: `0,${-r} ${r},0 0,${r} ${-r},0`, ...common }) : svg('circle', { r, ...common, ...(n.kind === 'choice' ? { 'stroke-dasharray': '5 3' } : {}) }));
    const label = svg('text', { y: r + 16, 'text-anchor': 'middle', class: 'tree-node-label' });
    label.textContent = n.name.length > 14 ? `${n.name.slice(0, 13)}…` : n.name;
    g.append(label);
    const rt = svg('text', { y: 5, 'text-anchor': 'middle', class: 'tree-node-rank' });
    rt.textContent = `${rank}/${n.maxRank}`;
    g.append(rt);
    if (!o.auto) {
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.shiftKey) o.refund(n.id);
        else o.allocate(n.id);
      });
      g.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hideTooltip();
        o.refund(n.id);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          o.allocate(n.id);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          o.refund(n.id);
        }
      });
    }
    attachTooltip(g as unknown as HTMLElement, () => describeNode(n, rank, rank < n.maxRank && !ok ? (() => { const r = canAllocate(o.char, o.classId, n.id); return r.ok ? undefined : r.reason; })() : undefined));
    layer.append(g);
  }

  let drag: { x: number; y: number; vx: number; vy: number } | undefined;
  root.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('.tree-node')) return;
    drag = { x: e.clientX, y: e.clientY, vx: o.view.x, vy: o.view.y };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag) return;
    o.view.x = drag.vx + (e.clientX - drag.x);
    o.view.y = drag.vy + (e.clientY - drag.y);
    apply();
  });
  root.addEventListener('pointerup', () => (drag = undefined));
  root.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const next = Math.min(2.2, Math.max(0.12, o.view.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
      o.view.x = px - ((px - o.view.x) * next) / o.view.scale;
      o.view.y = py - ((py - o.view.y) * next) / o.view.scale;
      o.view.scale = next;
      apply();
    },
    { passive: false },
  );
  const fit = (): void => {
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height || !nodes.length) return;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 50;
    const maxX = Math.max(...xs) + 50;
    const maxY = Math.max(...ys) + 50;
    const scale = Math.min(1.1, Math.max(0.12, Math.min(rect.width / (maxX - minX), rect.height / (maxY + 10))));
    o.view.scale = scale;
    o.view.x = Math.max(0, (rect.width - (maxX - minX) * scale) / 2) - minX * scale;
    o.view.y = 0;
    o.view.fitted = true;
    apply();
  };
  apply();
  if (!o.view.fitted) requestAnimationFrame(fit);
  const stage = el('div', { class: 'tree-stage party-tree-stage' }, root as unknown as HTMLElement);
  stage.append(el('button', { class: 'tiny party-tree-fit', type: 'button' }, 'Fit'));
  stage.querySelector('.party-tree-fit')?.addEventListener('click', fit);
  return stage;
}
