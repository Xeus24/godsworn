import { content } from '../../data';
import { masteryLevel, masteryProgress, MAX_MASTERY } from '../../engine/skills/mastery';
import {
  activeBuild,
  availablePoints,
  masteryPointsLeft,
  branchPoints,
  canAllocate,
  hotbar,
  knownSkills,
  rankOf,
  resetCost,
  treeOf,
  treeState,
} from '../../engine/skills/tree';
import { APOSTLESHIP } from '../../data/devotion';
import { MULTICLASS } from '../../data/progression';
import { APOSTLE_TIER_GATE } from '../../data/trees/builder';
import { chosenSpec, SPEC_LEVEL, specChangeCost, specializationsFor } from '../../engine/skills/specs';
import type { SkillTreeDef, TreeNodeDef } from '../../engine/skills/treeTypes';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { skillCard } from '../format';
import { el, type Screen } from '../screen';
import { describeNode, KIND_LABEL } from './nodeText';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** Node radius / half-size per kind. */
const SIZE: Record<TreeNodeDef['kind'], number> = { active: 24, modifier: 15, minor: 13, notable: 19, choice: 18, keystone: 25, capstone: 28 };

export class TreeScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private classId: string;
  private selected: string | undefined;
  private search = '';
  private message = '';
  /** Pan/zoom state survives re-renders. */
  private view = { x: 10, y: 10, scale: 0.9 };
  private pickingSlot: number | undefined;
  /** Specialization branch shown before one is chosen. */
  private previewSpec: string | undefined;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {
    this.classId = session.player.classes[0]?.classId ?? 'warrior';
  }

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()), this.session.bus.on('xpGained', () => this.render()));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    this.render();
  }

  // ---------------------------------------------------------- graph

  private nodeState(node: TreeNodeDef): 'maxed' | 'allocated' | 'available' | 'locked' {
    const build = activeBuild(this.session.player, this.classId);
    const rank = rankOf(build, node.id);
    if (rank >= node.maxRank) return 'maxed';
    if (rank > 0) return 'allocated';
    return canAllocate(this.session.player, this.classId, node.id).ok ? 'available' : 'locked';
  }

  private matches(node: TreeNodeDef): boolean {
    if (!this.search) return false;
    const q = this.search.toLowerCase();
    const skill = node.skill ? content.skills.find(node.skill) : undefined;
    const text = [node.name, node.text ?? '', node.variant?.patch.description ?? '', skill?.description ?? '', ...(node.modifiers ?? []).map((m) => content.stats.find(m.stat)?.name ?? '')].join(' ');
    return text.toLowerCase().includes(q);
  }

  private shape(node: TreeNodeDef, color: string, state: string): SVGElement {
    const r = SIZE[node.kind];
    const fill = state === 'allocated' || state === 'maxed' ? color : '#1a1226';
    const stroke = state === 'locked' ? '#4a3a5a' : state === 'available' ? '#f4f0e8' : color;
    const common = { fill, stroke, 'stroke-width': node.kind === 'keystone' || node.kind === 'capstone' ? 4 : 3 };
    switch (node.kind) {
      case 'active':
        return svg('rect', { x: -r, y: -r, width: r * 2, height: r * 2, rx: 8, ...common });
      case 'modifier':
        return svg('polygon', { points: `0,${-r} ${r},0 0,${r} ${-r},0`, ...common });
      case 'keystone': {
        const pts = Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI / 4) * i + Math.PI / 8;
          return `${Math.cos(a) * r},${Math.sin(a) * r}`;
        }).join(' ');
        return svg('polygon', { points: pts, ...common, stroke: state === 'locked' ? '#5a2a3a' : '#e04050' });
      }
      case 'capstone': {
        const pts = Array.from({ length: 10 }, (_, i) => {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const rr = i % 2 === 0 ? r : r * 0.55;
          return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
        }).join(' ');
        return svg('polygon', { points: pts, ...common, stroke: state === 'locked' ? '#5a4a2a' : '#ffd84a' });
      }
      case 'choice':
        return svg('circle', { r, ...common, 'stroke-dasharray': '5 3' });
      case 'notable':
        return svg('circle', { r, ...common, stroke: state === 'locked' ? '#5a4a2a' : '#e0a63a' });
      default:
        return svg('circle', { r, ...common });
    }
  }

  /** The tree as drawn: class branches plus the chosen (or previewed) specialization branch. */
  private visibleTree(tree: SkillTreeDef): SkillTreeDef {
    const chosen = chosenSpec(this.session.player, this.classId)?.id;
    const shown = chosen ?? this.previewSpec ?? specializationsFor(this.classId)[0]?.id;
    const branches = tree.branches.filter((b) => !b.spec || b.spec === shown);
    const ids = new Set(branches.map((b) => b.id));
    return { ...tree, branches, nodes: tree.nodes.filter((n) => ids.has(n.branch)) };
  }

  private graph(full: SkillTreeDef): HTMLElement {
    const tree = this.visibleTree(full);
    const build = activeBuild(this.session.player, this.classId);
    // Tree units are screen pixels; the view transform pans and zooms.
    const root = svg('svg', { class: 'tree-svg', role: 'img', 'aria-label': 'Skill tree' });
    const layer = svg('g', { transform: `translate(${this.view.x} ${this.view.y}) scale(${this.view.scale})` });
    root.append(layer);
    const byId = new Map(tree.nodes.map((n) => [n.id, n]));
    const branchColor = new Map(tree.branches.map((b) => [b.id, b.color]));

    // Branch headers.
    tree.branches.forEach((b, i) => {
      const x = i * (4 * 110 + 80) + 60 + 165;
      const t = svg('text', { x, y: 24, 'text-anchor': 'middle', class: 'tree-branch-title', fill: b.color });
      t.textContent = b.spec && !chosenSpec(this.session.player, this.classId) ? `${b.name} (preview)` : `${b.name} (${branchPoints(build, tree, b.id)})`;
      layer.append(t);
    });

    // Edges first.
    for (const node of tree.nodes) {
      for (const pid of node.parents) {
        const parent = byId.get(pid);
        if (!parent) continue;
        const lit = rankOf(build, node.id) > 0 && rankOf(build, pid) > 0;
        layer.append(svg('line', { x1: parent.x, y1: parent.y, x2: node.x, y2: node.y, stroke: lit ? (branchColor.get(node.branch) ?? '#fff') : '#3a2e48', 'stroke-width': lit ? 4 : 2 }));
      }
    }

    for (const node of tree.nodes) {
      const state = this.nodeState(node);
      const color = branchColor.get(node.branch) ?? '#888';
      const g = svg('g', { transform: `translate(${node.x} ${node.y})`, class: `tree-node ${state}${this.selected === node.id ? ' selected' : ''}${this.search ? (this.matches(node) ? ' match' : ' dim') : ''}`, tabindex: 0 });
      if (this.selected === node.id) g.append(svg('circle', { r: SIZE[node.kind] + 9, fill: 'none', stroke: '#ffd84a', 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
      g.append(this.shape(node, color, state));
      const rank = rankOf(build, node.id);
      const label = svg('text', { y: SIZE[node.kind] + 15, 'text-anchor': 'middle', class: 'tree-node-label' });
      label.textContent = node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name;
      g.append(label);
      if (node.maxRank > 1 || node.kind === 'active') {
        const rt = svg('text', { y: 5, 'text-anchor': 'middle', class: 'tree-node-rank' });
        rt.textContent = node.starting ? `${rank + 1}/${node.maxRank + 1}` : `${rank}/${node.maxRank}`;
        g.append(rt);
      }
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selected = node.id;
        this.message = '';
        if (e.shiftKey) this.say(this.session.trees.allocate(this.classId, node.id));
        else this.render();
      });
      g.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.say(this.session.trees.allocate(this.classId, node.id));
      });
      g.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hideTooltip();
        this.say(this.session.trees.refund(this.classId, node.id));
      });
      const asHtml = g as unknown as HTMLElement;
      attachTooltip(asHtml, () => {
        const check = canAllocate(this.session.player, this.classId, node.id);
        const r = rankOf(activeBuild(this.session.player, this.classId), node.id);
        return describeNode(node, r, r < node.maxRank && !check.ok ? check.reason : undefined, node.skill ? (this.session.player.mastery[node.skill] ?? 0) : undefined);
      });
      layer.append(g);
    }

    // Pan with drag, zoom with the wheel.
    let drag: { x: number; y: number; vx: number; vy: number } | undefined;
    root.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('.tree-node')) return;
      drag = { x: e.clientX, y: e.clientY, vx: this.view.x, vy: this.view.y };
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag) return;
      this.view.x = drag.vx + (e.clientX - drag.x);
      this.view.y = drag.vy + (e.clientY - drag.y);
      layer.setAttribute('transform', `translate(${this.view.x} ${this.view.y}) scale(${this.view.scale})`);
    });
    root.addEventListener('pointerup', () => (drag = undefined));
    root.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = root.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const next = Math.min(2.2, Math.max(0.35, this.view.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
        // Zoom around the cursor.
        this.view.x = px - ((px - this.view.x) * next) / this.view.scale;
        this.view.y = py - ((py - this.view.y) * next) / this.view.scale;
        this.view.scale = next;
        layer.setAttribute('transform', `translate(${this.view.x} ${this.view.y}) scale(${this.view.scale})`);
      },
      { passive: false },
    );
    return el('div', { class: 'tree-stage' }, root as unknown as HTMLElement);
  }

  // ---------------------------------------------------------- panels

  private sidebar(tree: SkillTreeDef): HTMLElement {
    const p = this.session.player;
    const st = treeState(p, this.classId);
    const apostle = p.devotion.apostle;
    const tabs = [
      ...p.classes.map((cp) => [cp.classId, content.classes.get(cp.classId).name] as const),
      ...p.hybrids.map((id) => [id, `${content.hybrids.get(id).name} ✧`] as const),
      ...(apostle ? [[`apostle-${apostle.god}`, `Apostle of ${content.gods.get(apostle.god).name} ✦`] as const] : []),
    ];
    const classTabs = tabs.map(([id, name]) => {
      const b = el('button', { class: `tab${id === this.classId ? ' active' : ''}` }, name);
      b.addEventListener('click', () => {
        this.classId = id;
        this.selected = undefined;
        this.render();
      });
      return b;
    });
    const progress = p.classes.find((cp) => cp.classId === this.classId);
    const hybrid = content.hybrids.find(this.classId);
    const builds = st.builds.map((bd, i) => {
      const b = el('button', { class: `tab${i === st.active ? ' active' : ''}` }, bd.name);
      b.addEventListener('click', () => this.say(this.session.trees.switchBuild(this.classId, i)));
      return b;
    });
    const nameInput = el('input', { type: 'text', value: activeBuild(p, this.classId).name, maxlength: '24', 'aria-label': 'Build name' });
    nameInput.addEventListener('change', () => this.say(this.session.trees.rename(this.classId, st.active, nameInput.value)));
    const saveGear = el('button', {}, activeBuild(p, this.classId).gear ? 'Update saved gear' : 'Save current gear to build');
    saveGear.addEventListener('click', () => this.say(this.session.trees.saveGear(this.classId)));
    const reset = el('button', {}, `Reset build (${resetCost(p)}g)`);
    reset.addEventListener('click', () => this.say(this.session.trees.reset(this.classId)));
    const search = el('input', { type: 'text', placeholder: 'Search nodes…', value: this.search, 'aria-label': 'Search nodes' });
    search.addEventListener('input', () => {
      this.search = search.value;
      const pos = search.selectionStart;
      this.render();
      const again = this.root?.querySelector<HTMLInputElement>('input[aria-label="Search nodes"]');
      again?.focus();
      if (pos !== null) again?.setSelectionRange(pos, pos);
    });
    const center = el('button', {}, 'Reset view');
    center.addEventListener('click', () => {
      this.view = { x: 10, y: 10, scale: 0.9 };
      this.render();
    });
    const pts = availablePoints(p, this.classId);
    return el(
      'section',
      { class: 'panel tree-side' },
      el('div', { class: 'tabs' }, ...classTabs),
      el('div', { class: pts > 0 ? 'points-available' : 'dim' }, `${pts} ${hybrid ? 'hybrid' : this.classId.startsWith('apostle-') ? 'apostle' : 'skill'} point${pts === 1 ? '' : 's'} available`),
      ...(this.classId.startsWith('apostle-') ? [el('p', { class: 'dim small' }, `Apostle points: ${APOSTLESHIP.basePoints} on ascension, +1 per level after, +1 per 2 paragon levels. Tiers need ${APOSTLE_TIER_GATE} points each.${p.devotion.apostle?.neglected ? ' Neglected edict: passives at 75%.' : ''}`)] : []),
      ...(progress && progress.slot !== 'primary' ? [el('div', { class: 'small' }, `${masteryPointsLeft(p, this.classId)} Mastery Point(s): secondary-class keystones and capstones each need one (1 per ${MULTICLASS.masteryPointEvery} class levels).`)] : []),
      ...(hybrid ? [el('p', { class: 'dim small' }, `${hybrid.description} Points: ${MULTICLASS.hybridBasePoints} on unlock, +1 per ${MULTICLASS.hybridLevelsPerPoint} combined ${hybrid.classes.map((id) => content.classes.get(id).name).join('/')} levels above ${MULTICLASS.hybridLevel}. Tiers need ${MULTICLASS.hybridTierGate} points each.`)] : []),
      el('p', { class: 'dim small' }, 'Double-click or shift-click to learn. Right-click to refund. Drag to pan, scroll to zoom.'),
      ...(progress ? [this.specPanel()] : []),
      el('h3', {}, 'Builds'),
      el('div', { class: 'tabs' }, ...builds),
      nameInput,
      saveGear,
      reset,
      el('p', { class: 'dim small' }, 'Switching builds is free and re-equips the build’s saved gear from your bags.'),
      el('h3', {}, 'Find'),
      search,
      center,
      ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
      el('h3', {}, 'Legend'),
      el('div', { class: 'tree-legend small dim' }, ...(['active', 'modifier', 'minor', 'notable', 'choice', 'keystone', 'capstone'] as const).map((k) => el('div', {}, KIND_LABEL[k]))),
      el('p', { class: 'dim small' }, `${tree.nodes.length} nodes in ${tree.branches.length} branches.`),
    );
  }

  private specPanel(): HTMLElement {
    const p = this.session.player;
    const progress = p.classes.find((cp) => cp.classId === this.classId);
    const chosen = chosenSpec(p, this.classId);
    const unlocked = (progress?.level ?? 0) >= SPEC_LEVEL;
    const cards = specializationsFor(this.classId).map((spec) => {
      const isChosen = chosen?.id === spec.id;
      const ult = content.skills.get(spec.ultimate);
      const card = el('div', { class: `spec-card${isChosen ? ' chosen' : ''}` }, el('b', {}, spec.name), el('div', { class: 'dim small' }, spec.description), el('div', { class: 'small' }, `Ultimate: ${ult.name}`));
      attachTooltip(card, () => skillCard(ult));
      const view = el('button', { class: 'tab' }, 'View');
      view.disabled = (this.previewSpec ?? specializationsFor(this.classId)[0]?.id) === spec.id;
      view.addEventListener('click', () => {
        this.previewSpec = spec.id;
        this.render();
      });
      const pick = el('button', { class: isChosen ? 'tab' : 'tab primary' }, isChosen ? 'Chosen' : chosen ? `Switch (${specChangeCost(p)}g)` : 'Choose');
      pick.disabled = isChosen || !unlocked;
      pick.addEventListener('click', () => this.say(this.session.general.chooseSpec(this.classId, spec.id)));
      card.append(el('div', { class: 'row' }, ...(chosen ? [] : [view]), pick));
      return card;
    });
    return el(
      'div',
      {},
      el('h3', {}, 'Specialization'),
      el('p', { class: 'dim small' }, chosen ? `${chosen.name}: its branch is the fifth column. Switching refunds that branch.` : unlocked ? 'Choose one of three paths. The first choice is free.' : `Unlocks at ${content.classes.get(this.classId).name} level ${SPEC_LEVEL}. Preview the branches meanwhile.`),
      ...cards,
    );
  }

  private details(tree: SkillTreeDef): HTMLElement {
    const p = this.session.player;
    const panel = el('section', { class: 'panel tree-details' });
    const node = tree.nodes.find((n) => n.id === this.selected);
    if (node) {
      const build = activeBuild(p, this.classId);
      const rank = rankOf(build, node.id);
      const check = canAllocate(p, this.classId, node.id);
      panel.append(describeNode(node, rank, rank < node.maxRank && !check.ok ? check.reason : undefined, node.skill ? (p.mastery[node.skill] ?? 0) : undefined));
      const learn = el('button', { class: 'primary' }, rank === 0 ? 'Learn' : 'Rank up');
      learn.disabled = !check.ok;
      learn.addEventListener('click', () => this.say(this.session.trees.allocate(this.classId, node.id)));
      const unlearn = el('button', {}, 'Refund');
      unlearn.disabled = rank === 0;
      unlearn.addEventListener('click', () => this.say(this.session.trees.refund(this.classId, node.id)));
      panel.append(el('div', { class: 'row' }, learn, unlearn));
      // Modifier choice for active skills.
      const skillId = node.skill ?? node.variant?.skill;
      if (skillId) {
        const mods = tree.nodes.filter((n) => n.variant?.skill === skillId && rankOf(build, n.id) > 0);
        if (mods.length) {
          const select = el('select', { 'aria-label': 'Active modifier' });
          select.append(el('option', { value: '' }, '(no modifier)'));
          for (const m of mods) {
            const o = el('option', { value: m.id }, m.name);
            if (build.variants[skillId] === m.id) o.selected = true;
            select.append(o);
          }
          select.addEventListener('change', () => this.say(this.session.trees.setVariant(this.classId, skillId, select.value || null)));
          panel.append(el('h3', {}, 'Active modifier'), select);
        }
      }
    } else {
      panel.append(el('p', { class: 'dim small' }, 'Select a node to see its details.'));
    }
    panel.append(this.hotbarEditor());
    return panel;
  }

  private hotbarEditor(): HTMLElement {
    const p = this.session.player;
    const bar = hotbar(p);
    const known = knownSkills(p);
    const slots = bar.map((id, i) => {
      const skill = id ? content.skills.find(id) : undefined;
      const lvl = id ? masteryLevel(p.mastery[id] ?? 0) : 0;
      const b = el('button', { class: `hotbar-slot${this.pickingSlot === i ? ' picking' : ''}${lvl >= MAX_MASTERY ? ' mastered' : ''}` }, el('span', { class: 'hk' }, String(i + 1)), skill ? `${lvl >= MAX_MASTERY ? '✦ ' : ''}${skill.name}` : '(empty)');
      if (id) {
        b.append(el('div', { class: 'mastery-bar' }, el('div', { style: `width:${masteryProgress(p.mastery[id] ?? 0) * 100}%` })));
        attachTooltip(b, () => skillCard(content.skills.get(id), known.find((k) => k.id === id)?.rank ?? 1));
      }
      b.addEventListener('click', () => {
        this.pickingSlot = this.pickingSlot === i ? undefined : i;
        this.render();
      });
      return b;
    });
    const out = el('div', {}, el('h3', {}, 'Hotbar (keys 1–8 in battle)'), el('div', { class: 'hotbar-grid' }, ...slots));
    if (this.pickingSlot !== undefined) {
      const slot = this.pickingSlot;
      const choices = known
        .filter((k) => !content.skills.get(k.id).ultimate)
        .map((k) => {
          const b = el('button', { class: 'tab' }, `${content.skills.get(k.id).name} (${k.rank})`);
          b.addEventListener('click', () => {
            this.pickingSlot = undefined;
            this.say(this.session.trees.setHotbar(slot, k.id));
          });
          return b;
        });
      const clear = el('button', { class: 'tab' }, 'Clear slot');
      clear.addEventListener('click', () => {
        this.pickingSlot = undefined;
        this.say(this.session.trees.setHotbar(slot, null));
      });
      out.append(el('div', { class: 'dim small' }, `Choose a skill for slot ${slot + 1}:`), el('div', { class: 'tabs' }, ...choices, clear));
    }
    return out;
  }

  render = (): void => {
    if (!this.root) return;
    hideTooltip();
    const tree = treeOf(this.classId);
    this.root.replaceChildren(
      el('div', { class: 'sheet' }, navBar(this.session, this.nav, 'skills'), el('div', { class: 'tree-body' }, this.sidebar(tree), this.graph(tree), this.details(tree))),
    );
  };
}
