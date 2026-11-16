/**
 * Skills: skills, skill trees, specializations, general skills, hybrids,
 * evolutions, the paragon board, stances and songs. Helpers live in
 * `skills/common.ts`.
 */
import { content } from '../../src/data';
import type { EvolutionDef } from '../../src/data/evolutions';
import type { ParagonNodeDef } from '../../src/data/paragon';
import type { SongDef } from '../../src/data/songs';
import type { StanceDef } from '../../src/data/stances';
import type { GeneralSkillDef, SpecializationDef } from '../../src/engine/skills/generalTypes';
import type { SkillTreeDef, TreeNodeDef } from '../../src/engine/skills/treeTypes';
import { powerAtRank, type SkillDef } from '../../src/engine/skills/types';
import type { HybridDef } from '../../src/engine/character/multiclassTypes';
import { simpleSection, type TableSpec } from '../core/generic';
import { ELEMENT_COLORS, callout, esc, h2, infobox, joinHtml, mods, navbox, prose, table, tag, ul } from '../core/html';
import type { RenderCtx } from '../core/types';
import {
  KIND_LABEL,
  PARAGON_BOARDS,
  SOURCE_LABEL,
  TARGETING,
  TREE_TIER_GATE,
  costText,
  describePatch,
  effectList,
  elementName,
  nodeRequirement,
  ownerLink,
  ownerName,
  skillIndex,
  skillName,
  treeLink,
  treeTitle,
} from './skills/common';

const skills = content.skills.all();
const trees = content.trees.all();
const specs = content.specializations.all();
const generals = content.generalSkills.all();
const hybrids = content.hybrids.all();
const evolutions = content.evolutions.all();
const paragon = content.paragon.all();
const stances = content.stances.all();
const songs = content.songs.all();

const skillLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('skill', id, skillName(id));
const elementTag = (el: string): string => tag(elementName(el), ELEMENT_COLORS[el]);

/** `<details>` group with a summary line. */
function fold(summary: string, body: string, open = false): string {
  return `<details class="fold"${open ? ' open' : ''}><summary>${summary}</summary>${body}</details>`;
}

// ================================================================ skills

function powerTable(label: string, p: NonNullable<SkillDef['damage']>, max: number): string {
  const stat = content.stats.find(p.stat)?.name ?? p.stat;
  const ranks = Array.from({ length: max }, (_, i) => i + 1);
  return table(
    ranks,
    [
      { label: 'Rank', cell: (r) => esc(r), className: 'num' },
      { label: `${label} (% of ${stat})`, cell: (r) => esc(Math.round(powerAtRank(p, r) * 100)), className: 'num' },
      { label: 'Total', cell: (r) => esc(Math.round(powerAtRank(p, r) * (p.hits ?? 1) * 100)), className: 'num' },
    ],
  );
}

function renderSkill(s: SkillDef, ctx: RenderCtx): string {
  const idx = skillIndex();
  const grants = idx.grants.get(s.id) ?? [];
  const evoFrom = evolutions.filter((e) => e.from === s.id);
  const evoOf = evolutions.find((e) => e.id === s.id);
  const mod = idx.modifiers.get(s.id) ?? [];
  const finisher = s.finisher ? `Finisher: +${s.finisher.multiplierPerPoint * 100}% per ${content.resources.find(s.finisher.resource)?.name ?? s.finisher.resource}` : '';
  const generates = s.generates ? `+${s.generates.amount} ${content.resources.find(s.generates.resource)?.name ?? s.generates.resource}` : '';
  const box = infobox(
    s.name,
    [
      { label: 'Source', html: esc(SOURCE_LABEL[s.source] ?? s.source) },
      { label: 'Class / owner', html: esc(idx.group.get(s.id) ?? '') },
      { label: 'Element', html: elementTag(s.element) },
      { label: 'Targets', html: esc(TARGETING[s.targeting] ?? s.targeting) },
      { label: 'Cost', html: esc(costText(s) || 'Free') },
      { label: 'Cooldown', html: s.cooldown ? `${esc(s.cooldown)} turns` : 'None' },
      { label: 'Max rank', html: esc(s.maxRank) },
      { label: 'Hits', html: s.damage?.hits && s.damage.hits > 1 ? esc(s.damage.hits) : '' },
      { label: 'Generates', html: esc(generates) },
      { label: 'Finisher', html: esc(finisher) },
      { label: 'Always crits', html: s.alwaysCrit ? 'Yes' : '' },
      { label: 'Ultimate', html: s.ultimate ? 'Needs a full gauge' : '' },
      { label: 'Can miss', html: s.canMiss === undefined ? '' : s.canMiss ? 'Yes' : 'Never' },
      { label: 'Stances', html: s.stances?.length ? joinHtml(s.stances.map((x) => ctx.linkIf('stance', x, content.stances.find(x)?.name ?? x))) : '' },
      { label: 'Team', html: s.team ? esc(s.team.map((t) => ownerName(t)).join(' + ')) : '' },
      { label: 'Weapon art', html: s.weaponArt ? ctx.linkIf('weapon-type', s.weaponArt, content.weaponTypes.find(s.weaponArt)?.name ?? s.weaponArt) : '' },
      { label: 'Tags', html: joinHtml(s.tags.map((t) => tag(t))) },
    ],
    { color: ELEMENT_COLORS[s.element] },
  );
  const fx = effectList(s.effects, ctx);
  return [
    box,
    prose(s.description),
    s.damage ? `${h2('Damage')}${powerTable('Damage per hit', s.damage, s.maxRank)}` : '',
    s.heal ? `${h2('Healing')}${powerTable('Heal per use', s.heal, s.maxRank)}` : '',
    fx.length ? `${h2('Effects')}${ul(fx)}` : '',
    grants.length ? `${h2('Learned from')}${ul(grants.map((g) => g.html(ctx)))}` : '',
    evoOf
      ? `${h2('Evolution')}<p>${esc(evoOf.name)} replaces ${skillLink(ctx, evoOf.from)} at Grandmaster mastery once the quest ${ctx.linkIf('quest', evoOf.quest, evoOf.quest)} is complete. Damage and healing x${esc(evoOf.power)}.</p>`
      : '',
    evoFrom.length
      ? `${h2('Evolutions')}${ul(evoFrom.map((e) => `${ctx.linkIf('evolution', e.id, e.name)}: ${esc(e.description)}`))}`
      : '',
    mod.length
      ? `${h2('Modifiers')}<p>One modifier can be active on this skill at a time.</p>${table(mod, [
          { label: 'Modifier', cell: (m) => esc(m.node.name), sort: (m) => m.node.name },
          { label: 'Tree', cell: (m) => treeLink(ctx, m.tree) },
          { label: 'Change', cell: (m) => `${esc(m.node.variant!.patch.description)}<br><span class="muted">${describePatch(m.node.variant!.patch, ctx)}</span>` },
        ])}`
      : '',
    navbox('Skills', [{ label: 'Browse', html: [ctx.link('skill', 'index', 'All skills'), ctx.link('tree', 'index', 'Skill trees'), ctx.link('evolution', 'index', 'Evolutions')] }]),
  ].join('');
}

function skillRows(list: readonly SkillDef[], ctx: RenderCtx, filter: boolean): string {
  return table(
    list,
    [
      { label: 'Skill', cell: (s) => ctx.link('skill', s.id), sort: (s) => s.name },
      { label: 'Element', cell: (s) => elementTag(s.element), sort: (s) => s.element },
      { label: 'Targets', cell: (s) => esc(TARGETING[s.targeting] ?? s.targeting) },
      { label: 'Cost', cell: (s) => esc(costText(s)), sort: (s) => s.cost.mp ?? 0 },
      { label: 'CD', cell: (s) => esc(s.cooldown), sort: (s) => s.cooldown, className: 'num' },
      { label: 'Rank', cell: (s) => esc(s.maxRank), sort: (s) => s.maxRank, className: 'num' },
      { label: 'Summary', cell: (s) => esc(s.description) },
    ],
    { filter },
  );
}

function skillList(list: readonly SkillDef[], ctx: RenderCtx): string {
  const idx = skillIndex();
  const bySource = new Map<string, Map<string, SkillDef[]>>();
  for (const s of list) {
    const src = SOURCE_LABEL[s.source] ?? s.source;
    const g = idx.group.get(s.id) ?? src;
    const m = bySource.get(src) ?? new Map<string, SkillDef[]>();
    const l = m.get(g) ?? [];
    l.push(s);
    m.set(g, l);
    bySource.set(src, m);
  }
  const order = Object.values(SOURCE_LABEL);
  const sources = [...bySource.keys()].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const intro = `<p>${list.length} skills. Open a group to see its skills; use the search box in the top bar to find one by name.</p>`;
  return (
    intro +
    sources
      .map((src) => {
        const groups = bySource.get(src)!;
        const total = [...groups.values()].reduce((n, l) => n + l.length, 0);
        const inner = [...groups.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([label, l]) => (groups.size === 1 && label === src ? skillRows(l, ctx, l.length > 12) : fold(`${esc(label)} <span class="muted">(${l.length})</span>`, skillRows(l, ctx, l.length > 12))))
          .join('');
        return fold(`<b>${esc(src)}</b> <span class="muted">(${total})</span>`, inner);
      })
      .join('')
  );
}

// ================================================================ trees

function treeSkillCell(n: TreeNodeDef, ctx: RenderCtx): string {
  if (n.kind === 'active' && n.skill) return `${skillLink(ctx, n.skill)}${n.starting ? ' <span class="muted">(starting)</span>' : ''}`;
  if (n.variant) return `Changes ${skillLink(ctx, n.variant.skill)}: ${esc(n.variant.patch.description)}`;
  return '';
}

function nodeEffect(n: TreeNodeDef, ctx: RenderCtx): string {
  const parts: string[] = [];
  const sk = treeSkillCell(n, ctx);
  if (sk) parts.push(sk);
  if (n.text) parts.push(esc(n.text));
  if (n.modifiers?.length) parts.push(mods(n.modifiers) + (n.maxRank > 1 ? ' <span class="muted">per rank</span>' : ''));
  for (const t of n.triggers ?? []) parts.push(esc(t.description ?? `${t.trigger}: ${t.effects.map((e) => e.kind).join(', ')}`));
  if (n.flags?.length) parts.push(`<span class="muted">${esc(n.flags.join(', '))}</span>`);
  return parts.join('<br>');
}

function nodeTable(nodes: TreeNodeDef[], t: SkillTreeDef, gate: number, ctx: RenderCtx): string {
  return table(nodes, [
    { label: 'Node', cell: (n) => `<b>${esc(n.name)}</b>`, sort: (n) => n.name },
    { label: 'Type', cell: (n) => esc(KIND_LABEL[n.kind] ?? n.kind), sort: (n) => n.kind },
    { label: 'Tier', cell: (n) => esc(n.tier), sort: (n) => n.tier, className: 'num' },
    { label: 'Ranks', cell: (n) => esc(n.maxRank), sort: (n) => n.maxRank, className: 'num' },
    { label: 'Requires', cell: (n) => nodeRequirement(n, t.id, gate, ctx) },
    { label: 'Effect', cell: (n) => nodeEffect(n, ctx) },
  ]);
}

function renderTree(t: SkillTreeDef, ctx: RenderCtx): string {
  const owner = ownerName(t.classId);
  const classSpecs = specs.filter((s) => s.classId === t.classId);
  const hybrid = content.hybrids.find(t.id);
  const active = t.nodes.filter((n) => n.kind === 'active');
  const box = infobox(
    treeTitle(t.id),
    [
      { label: hybrid ? 'Hybrid' : 'Class', html: ownerLink(ctx, hybrid ? hybrid.id : t.classId) },
      { label: 'Branches', html: esc(t.branches.length) },
      { label: 'Nodes', html: esc(t.nodes.length) },
      { label: 'Skills taught', html: esc(new Set(active.map((n) => n.skill)).size) },
      { label: 'Specializations', html: classSpecs.length ? joinHtml(classSpecs.map((s) => ctx.link('specialization', s.id))) : '' },
    ],
    { color: t.branches[0]?.color },
  );
  const sections = t.branches.map((b) => {
    const nodes = t.nodes.filter((n) => n.branch === b.id).sort((a, c) => a.tier - c.tier || a.lane - c.lane);
    const gate = b.tierGate ?? TREE_TIER_GATE;
    const major = nodes.filter((n) => n.kind !== 'minor');
    const minor = nodes.filter((n) => n.kind === 'minor');
    const spec = b.spec ? specs.find((s) => s.id === b.spec) : undefined;
    const note = [
      b.spec ? `Opens with ${spec ? ctx.link('specialization', spec.id) : esc(b.spec)}.` : '',
      b.promotion ? `Opens at class promotion tier ${esc(b.promotion)}.` : '',
      `Each tier needs ${esc(gate)} points spent in this branch.`,
    ].filter(Boolean).join(' ');
    return [
      h2(`${b.name} (${nodes.length})`),
      prose(b.description),
      `<p class="muted">${note}</p>`,
      major.length ? nodeTable(major, t, gate, ctx) : '',
      minor.length ? fold(`Minor nodes <span class="muted">(${minor.length})</span>`, nodeTable(minor, t, gate, ctx)) : '',
    ].join('');
  });
  return [
    box,
    `<p>The skill tree of ${esc(owner)}: ${esc(t.branches.length)} branches and ${esc(t.nodes.length)} nodes.</p>`,
    sections.join(''),
    navbox('Skill trees', [{ label: 'Browse', html: [ctx.link('tree', 'index', 'All skill trees'), ctx.link('specialization', 'index', 'Specializations'), ctx.link('hybrid', 'index', 'Hybrids')] }]),
  ].join('');
}

function treeList(list: readonly SkillTreeDef[], ctx: RenderCtx): string {
  const groups: Record<string, SkillTreeDef[]> = { 'Class trees': [], 'Hybrid trees': [], 'Apostle trees': [] };
  for (const t of list) {
    if (t.id.startsWith('apostle-')) groups['Apostle trees']!.push(t);
    else if (content.hybrids.find(t.id)) groups['Hybrid trees']!.push(t);
    else groups['Class trees']!.push(t);
  }
  return Object.entries(groups)
    .filter(([, l]) => l.length)
    .map(([label, l]) =>
      fold(
        `<b>${esc(label)}</b> <span class="muted">(${l.length})</span>`,
        table(l, [
          { label: 'Tree', cell: (t) => treeLink(ctx, t.id), sort: (t) => treeTitle(t.id) },
          { label: 'Branches', cell: (t) => esc(t.branches.map((b) => b.name).join(', ')) },
          { label: 'Nodes', cell: (t) => esc(t.nodes.length), sort: (t) => t.nodes.length, className: 'num' },
        ], { filter: l.length > 12 }),
        label === 'Class trees',
      ),
    )
    .join('');
}

// ================================================================ specializations

function renderSpec(sp: SpecializationDef, ctx: RenderCtx): string {
  const tree = trees.find((t) => t.classId === sp.classId && t.branches.some((b) => b.id === sp.branch));
  const branch = tree?.branches.find((b) => b.id === sp.branch);
  const nodes = tree ? tree.nodes.filter((n) => n.branch === sp.branch).sort((a, c) => a.tier - c.tier || a.lane - c.lane) : [];
  const taught = [...new Set(nodes.filter((n) => n.kind === 'active' && n.skill).map((n) => n.skill!))];
  const siblings = specs.filter((s) => s.classId === sp.classId);
  const hybridReq = hybrids.filter((h) => h.requires?.specialization === sp.id);
  const box = infobox(sp.name, [
    { label: 'Class', html: ownerLink(ctx, sp.classId) },
    { label: 'Chosen at', html: 'Class level 20' },
    { label: 'Ultimate', html: skillLink(ctx, sp.ultimate) },
    { label: 'Tree branch', html: branch ? esc(branch.name) : '' },
    { label: 'Tree', html: tree ? treeLink(ctx, tree.id) : '' },
    { label: 'Nodes', html: nodes.length ? esc(nodes.length) : '' },
    { label: 'Hybrid', html: hybridReq.length ? joinHtml(hybridReq.map((h) => ctx.link('hybrid', h.id))) : '' },
  ], { color: branch?.color });
  return [
    box,
    prose(sp.description),
    h2('Signature ultimate'),
    `<p>${skillLink(ctx, sp.ultimate)}: ${esc(content.skills.find(sp.ultimate)?.description ?? '')}</p>`,
    branch ? `${h2('Branch')}${prose(branch.description)}` : '',
    taught.length ? `${h2('Skills taught')}${ul(taught.map((id) => `${skillLink(ctx, id)} <span class="muted">${esc(content.skills.find(id)?.description ?? '')}</span>`))}` : '',
    nodes.length ? `${h2(`Branch nodes (${nodes.length})`)}${fold('Show nodes', nodeTable(nodes, tree!, branch?.tierGate ?? 4, ctx))}` : '',
    navbox(`${ownerName(sp.classId)} specializations`, [{ label: 'Specializations', html: siblings.map((s) => ctx.link('specialization', s.id)) }]),
  ].join('');
}

function specList(list: readonly SpecializationDef[], ctx: RenderCtx): string {
  const byClass = new Map<string, SpecializationDef[]>();
  for (const s of list) byClass.set(s.classId, [...(byClass.get(s.classId) ?? []), s]);
  return [...byClass.entries()]
    .map(([c, l]) =>
      fold(`<b>${esc(ownerName(c))}</b> <span class="muted">(${l.length})</span>`,
        table(l, [
          { label: 'Specialization', cell: (s) => ctx.link('specialization', s.id), sort: (s) => s.name },
          { label: 'Ultimate', cell: (s) => skillLink(ctx, s.ultimate) },
          { label: 'Summary', cell: (s) => esc(s.description) },
        ])),
    )
    .join('');
}

// ================================================================ general skills

function renderGeneral(g: GeneralSkillDef, ctx: RenderCtx): string {
  const combat = g.combatSkill ? content.skills.find(g.combatSkill) : undefined;
  const r = g.requirements;
  const item = content.items.find(`book-${g.id}`) ?? content.items.all().find((i) => (i as { teaches?: string }).teaches === g.id);
  const box = infobox(g.name, [
    { label: 'Category', html: esc(g.category) },
    { label: 'Skillbook rarity', html: ctx.linkIf('rarity', g.rarity, content.rarities.find(g.rarity)?.name ?? g.rarity) },
    { label: 'Max rank', html: esc(g.maxRank) },
    { label: 'Combat skill', html: combat ? skillLink(ctx, combat.id) : '' },
    { label: 'God', html: g.god ? ctx.linkIf('god', g.god, content.gods.find(g.god)?.name ?? g.god) : '' },
    { label: 'Heresy tier', html: g.heresy !== undefined ? esc(g.heresy) : '' },
    { label: 'Level', html: r?.level ? esc(r.level) : '' },
    { label: 'Stats', html: r?.stats ? esc(Object.entries(r.stats).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')) : '' },
    { label: 'Races', html: r?.races?.length ? joinHtml(r.races.map((x) => ctx.linkIf('race', x, content.races.find(x)?.name ?? x))) : '' },
    { label: 'Backgrounds', html: r?.backgrounds?.length ? joinHtml(r.backgrounds.map((x) => ctx.linkIf('background', x, content.backgrounds.find(x)?.name ?? x))) : '' },
    { label: 'Skillbook', html: item ? ctx.linkIf('item', item.id, item.name) : '' },
  ]);
  return [
    box,
    prose(g.description),
    g.passive?.length ? `${h2('Passive (per rank)')}${callout('note', `<p>${mods(g.passive)}</p>`)}` : '',
    g.utility ? `${h2('Out of combat')}<p>${esc(g.utility.kind)}: +${esc(g.utility.perRank)} per rank.</p>` : '',
    g.flags?.length ? `<p>Grants: ${esc(g.flags.join(', '))}.</p>` : '',
    combat ? `${h2('Combat skill')}<p>${skillLink(ctx, combat.id)}: ${esc(combat.description)}</p>${g.patch ? `<p>${esc(g.patch.description)} <span class="muted">${describePatch(g.patch, ctx)}</span></p>` : ''}` : '',
    navbox('General skills', [{ label: 'Browse', html: [ctx.link('general-skill', 'index', 'All general skills')] }]),
  ].join('');
}

function generalList(list: readonly GeneralSkillDef[], ctx: RenderCtx): string {
  const byCat = new Map<string, GeneralSkillDef[]>();
  for (const g of list) byCat.set(g.category, [...(byCat.get(g.category) ?? []), g]);
  return [...byCat.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cat, l]) =>
      fold(`<b>${esc(cat)}</b> <span class="muted">(${l.length})</span>`,
        table(l, [
          { label: 'Skill', cell: (g) => ctx.link('general-skill', g.id), sort: (g) => g.name },
          { label: 'Rarity', cell: (g) => esc(g.rarity) },
          { label: 'Ranks', cell: (g) => esc(g.maxRank), className: 'num' },
          { label: 'Summary', cell: (g) => esc(g.description) },
        ], { filter: l.length > 12 })),
    )
    .join('');
}

// ================================================================ hybrids

function renderHybrid(h: HybridDef, ctx: RenderCtx): string {
  const tree = content.trees.find(h.id);
  const trial = content.encounters.find(h.trial);
  const req = h.requires;
  const box = infobox(h.name, [
    { label: 'Classes', html: joinHtml(h.classes.map((c) => ctx.link('class', c))) },
    { label: 'Specialization', html: req?.specialization ? ctx.linkIf('specialization', req.specialization) : '' },
    { label: 'Apostle of', html: req?.apostleOf ? ctx.linkIf('god', req.apostleOf, content.gods.find(req.apostleOf)?.name ?? req.apostleOf) : '' },
    { label: 'Trial', html: trial ? ctx.linkIf('encounter', trial.id, trial.name) : esc(h.trial) },
    { label: 'Skill tree', html: tree ? treeLink(ctx, tree.id) : '' },
  ]);
  const nodes = tree?.nodes.filter((n) => n.kind === 'active' && n.skill) ?? [];
  return [
    box,
    prose(h.description),
    h2('How to unlock'),
    ul([
      `Master both classes: ${h.classes.map((c) => ctx.link('class', c)).join(' and ')}.`,
      ...(req?.specialization ? [`Choose the ${ctx.linkIf('specialization', req.specialization)} specialization.`] : []),
      ...(req?.apostleOf ? [`Be sworn as an apostle of ${ctx.linkIf('god', req.apostleOf, content.gods.find(req.apostleOf)?.name ?? req.apostleOf)}.`] : []),
      `Win the trial${trial ? `: ${ctx.linkIf('encounter', trial.id, trial.name)}` : ''}.`,
    ]),
    nodes.length ? `${h2('Skills')}${ul(nodes.map((n) => `${skillLink(ctx, n.skill!)} <span class="muted">${esc(content.skills.find(n.skill!)?.description ?? '')}</span>`))}` : '',
    tree ? `${h2('Skill tree')}<p>${treeLink(ctx, tree.id)}: ${esc(tree.nodes.length)} nodes.</p>` : '',
    navbox('Hybrid classes', [{ label: 'Related', html: hybrids.filter((x) => x.id !== h.id && x.classes.some((c) => h.classes.includes(c))).slice(0, 14).map((x) => ctx.link('hybrid', x.id)) }, { label: 'Browse', html: [ctx.link('hybrid', 'index', 'All hybrid classes')] }]),
  ].join('');
}

function hybridList(list: readonly HybridDef[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Hybrid', cell: (h) => ctx.link('hybrid', h.id), sort: (h) => h.name },
    { label: 'Classes', cell: (h) => joinHtml(h.classes.map((c) => ctx.link('class', c))) },
    { label: 'Requires', cell: (h) => esc(h.requires ? `${h.requires.specialization ?? ''} + apostle of ${h.requires.apostleOf ?? ''}` : '') },
    { label: 'Summary', cell: (h) => esc(h.description) },
  ], { filter: true });
}

// ================================================================ evolutions

function renderEvolution(e: EvolutionDef, ctx: RenderCtx): string {
  const base = content.skills.find(e.from);
  const evolved = content.skills.find(e.id);
  const box = infobox(e.name, [
    { label: 'Class', html: ownerLink(ctx, e.classId) },
    { label: 'Evolves', html: skillLink(ctx, e.from) },
    { label: 'Quest', html: ctx.linkIf('quest', e.quest, content.quests.find(e.quest)?.name ?? e.quest) },
    { label: 'Mastery', html: 'Grandmaster (10)' },
    { label: 'Power', html: `x${esc(e.power)}` },
    { label: 'Element', html: base ? elementTag(base.element) : '' },
  ]);
  const fx = effectList(e.addEffects, ctx);
  return [
    box,
    prose(e.description),
    h2('Requirements'),
    ul([
      `${skillLink(ctx, e.from)} at Grandmaster mastery (10).`,
      `The ${ownerLink(ctx, e.classId)} questline has reached ${ctx.linkIf('quest', e.quest, content.quests.find(e.quest)?.name ?? e.quest)}.`,
    ]),
    h2('Changes'),
    ul([`Damage and healing x${esc(e.power)}.`, ...fx.map((f) => `Adds: ${f}`)]),
    evolved ? `<p>Full skill page: ${ctx.link('skill', e.id)}. Replaces ${skillLink(ctx, e.from)} on the hotbar, in the tree and in mastery.</p>` : '',
    navbox('Evolutions', [{ label: ownerName(e.classId), html: evolutions.filter((x) => x.classId === e.classId).map((x) => ctx.link('evolution', x.id)) }]),
  ].join('');
}

function evolutionList(list: readonly EvolutionDef[], ctx: RenderCtx): string {
  const byClass = new Map<string, EvolutionDef[]>();
  for (const e of list) byClass.set(e.classId, [...(byClass.get(e.classId) ?? []), e]);
  return [...byClass.entries()]
    .map(([c, l]) =>
      fold(`<b>${esc(ownerName(c))}</b> <span class="muted">(${l.length})</span>`,
        table(l, [
          { label: 'Evolution', cell: (e) => ctx.link('evolution', e.id), sort: (e) => e.name },
          { label: 'From', cell: (e) => skillLink(ctx, e.from) },
          { label: 'Quest', cell: (e) => ctx.linkIf('quest', e.quest, e.quest) },
          { label: 'Power', cell: (e) => `x${esc(e.power)}`, sort: (e) => e.power, className: 'num' },
          { label: 'Adds', cell: (e) => effectList(e.addEffects, ctx).join('<br>') },
        ])),
    )
    .join('');
}

// ================================================================ paragon

const boardName = (id: string): string => PARAGON_BOARDS.find((b) => b.id === id)?.name ?? id;

function renderParagon(n: ParagonNodeDef, ctx: RenderCtx): string {
  const board = PARAGON_BOARDS.find((b) => b.id === n.board);
  const siblings = paragon.filter((p) => p.board === n.board);
  const box = infobox(n.name, [
    { label: 'Board', html: esc(boardName(n.board)) },
    { label: 'Gate', html: n.gate ? `${esc(n.gate)} points on the board` : 'Open' },
    { label: 'Max rank', html: esc(n.maxRank) },
    { label: 'Difficulty', html: n.minDifficulty ? esc(n.minDifficulty) : '' },
  ]);
  return [
    box,
    prose(n.description),
    h2('Per rank'),
    callout('note', `<p>${mods(n.perRank)}</p>`),
    h2('At max rank'),
    callout('tip', `<p>${n.perRank.map((m) => esc(`${m.type === 'flat' ? '' : ''}${mods([{ ...m, value: m.value * n.maxRank }])}`)).join('<br>')}</p>`),
    board ? `<p class="muted">${esc(board.name)} board: ${esc(board.blurb)} One point is earned per level after the level cap.</p>` : '',
    navbox(`${boardName(n.board)} board`, [{ label: 'Nodes', html: siblings.map((p) => ctx.link('paragon', p.id)) }]),
  ].join('');
}

function paragonList(list: readonly ParagonNodeDef[], ctx: RenderCtx): string {
  return (
    '<p>After the level cap each level grants one Paragon point. Deeper tiers open after more points are spent on their board.</p>' +
    PARAGON_BOARDS.map((b) => {
      const l = list.filter((n) => n.board === b.id).sort((x, y) => x.gate - y.gate || x.name.localeCompare(y.name));
      return fold(`<b>${esc(b.name)}</b> <span class="muted">(${l.length}) ${esc(b.blurb)}</span>`,
        table(l, [
          { label: 'Node', cell: (n) => ctx.link('paragon', n.id), sort: (n) => n.name },
          { label: 'Gate', cell: (n) => esc(n.gate), sort: (n) => n.gate, className: 'num' },
          { label: 'Max', cell: (n) => esc(n.maxRank), sort: (n) => n.maxRank, className: 'num' },
          { label: 'Per rank', cell: (n) => mods(n.perRank) },
        ], { filter: true }));
    }).join('')
  );
}

// ================================================================ stances

function renderStance(s: StanceDef, ctx: RenderCtx): string {
  const grantedBy = skills.filter((k) => k.effects?.some((e) => e.kind === 'setStance' && e.stance === s.id));
  const usable = skills.filter((k) => k.stances?.includes(s.id));
  const box = infobox(s.name, [
    { label: 'Basic attack', html: `${esc(Math.round(s.basicAttack.multiplier * 100))}% damage` },
    { label: 'Entered by', html: grantedBy.length ? joinHtml(grantedBy.slice(0, 6).map((k) => ctx.link('skill', k.id))) : '' },
  ]);
  return [
    box,
    prose(s.description),
    h2('Passive modifiers'),
    callout('note', `<p>${mods(s.modifiers) || '—'}</p>`),
    h2('Basic attack'),
    ul([`${esc(Math.round(s.basicAttack.multiplier * 100))}% damage`, ...effectList(s.basicAttack.effects, ctx)]),
    grantedBy.length ? `${h2(`Skills that enter it (${grantedBy.length})`)}${fold('Show skills', ul(grantedBy.map((k) => ctx.link('skill', k.id))))}` : '',
    usable.length ? `${h2(`Skills that need it (${usable.length})`)}${fold('Show skills', ul(usable.map((k) => ctx.link('skill', k.id))))}` : '',
    navbox('Stances', [{ label: 'All', html: stances.map((x) => ctx.link('stance', x.id)) }]),
  ].join('');
}

function stanceList(list: readonly StanceDef[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Stance', cell: (s) => ctx.link('stance', s.id), sort: (s) => s.name },
    { label: 'Modifiers', cell: (s) => mods(s.modifiers) },
    { label: 'Basic attack', cell: (s) => `${esc(Math.round(s.basicAttack.multiplier * 100))}%${s.basicAttack.effects.length ? `<br>${effectList(s.basicAttack.effects, ctx).join('<br>')}` : ''}` },
  ], { filter: list.length > 12 });
}

// ================================================================ songs

function renderSong(s: SongDef, ctx: RenderCtx): string {
  const grantedBy = skills.filter((k) => k.effects?.some((e) => e.kind === 'startSong' && e.song === s.id));
  const box = infobox(s.name, [{ label: 'Played by', html: grantedBy.length ? joinHtml(grantedBy.slice(0, 6).map((k) => ctx.link('skill', k.id))) : '' }]);
  return [
    box,
    prose(s.description),
    h2('Aura'),
    callout('note', `<p>${mods(s.aura)}</p><p class="muted">Applies to every ally of the singer while the song plays.</p>`),
    h2('Crescendo'),
    prose(s.crescendo.description),
    ul(effectList(s.crescendo.effects, ctx)),
    grantedBy.length ? `${h2('Skills that start it')}${ul(grantedBy.map((k) => ctx.link('skill', k.id)))}` : '',
    navbox('Songs', [{ label: 'All', html: songs.map((x) => ctx.link('song', x.id)) }]),
  ].join('');
}

function songList(list: readonly SongDef[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Song', cell: (s) => ctx.link('song', s.id), sort: (s) => s.name },
    { label: 'Aura', cell: (s) => mods(s.aura) },
    { label: 'Crescendo', cell: (s) => esc(s.crescendo.description) },
  ], { filter: list.length > 12 });
}

// ================================================================ section

const tables: TableSpec<any>[] = [
  {
    ns: 'skill',
    label: 'Skills',
    blurb: 'Every skill, grouped by source and class.',
    category: 'Skills',
    entries: skills,
    summary: (s: SkillDef) => s.description,
    categories: (s: SkillDef) => [SOURCE_LABEL[s.source] ?? s.source],
    render: renderSkill,
    list: skillList,
  },
  {
    ns: 'tree',
    label: 'Skill trees',
    blurb: 'One tree per class, hybrid and apostle path.',
    category: 'Skill trees',
    entries: trees,
    title: (t: SkillTreeDef) => treeTitle(t.id),
    summary: (t: SkillTreeDef) => `${t.branches.map((b) => b.name).join(', ')}.`,
    render: renderTree,
    list: treeList,
  },
  {
    ns: 'specialization',
    label: 'Specializations',
    blurb: 'Chosen at class level 20: a new branch and a signature ultimate.',
    category: 'Specializations',
    entries: specs,
    render: renderSpec,
    list: specList,
  },
  {
    ns: 'general-skill',
    label: 'General skills',
    blurb: 'Class-agnostic skills learned from skillbooks.',
    category: 'General skills',
    entries: generals,
    categories: (g: GeneralSkillDef) => [`${g.category} general skills`],
    render: renderGeneral,
    list: generalList,
  },
  {
    ns: 'hybrid',
    label: 'Hybrid classes',
    blurb: 'Prestige classes from class pairs.',
    category: 'Hybrid classes',
    entries: hybrids,
    render: renderHybrid,
    list: hybridList,
  },
  {
    ns: 'evolution',
    label: 'Skill evolutions',
    blurb: 'Grandmaster skills that become stronger, renamed forms.',
    category: 'Skill evolutions',
    entries: evolutions,
    render: renderEvolution,
    list: evolutionList,
  },
  {
    ns: 'paragon',
    label: 'Paragon board',
    blurb: 'Endless post-cap bonuses in four boards.',
    category: 'Paragon board',
    entries: paragon,
    render: renderParagon,
    list: paragonList,
  },
  {
    ns: 'stance',
    label: 'Stances',
    blurb: 'Passive postures that change basic attacks.',
    category: 'Stances',
    entries: stances,
    render: renderStance,
    list: stanceList,
  },
  {
    ns: 'song',
    label: 'Songs',
    blurb: 'Bard songs: party auras with a crescendo.',
    category: 'Songs',
    entries: songs,
    render: renderSong,
    list: songList,
  },
];

export const skillsSection = simpleSection({
  id: 'skills',
  title: 'Skills',
  group: 'Skills',
  blurb: 'Every skill, skill tree, specialization, hybrid and evolution.',
  intro:
    '<p>Every skill in the game, the trees that teach them, and the systems that reshape them: specializations at class level 20, hybrid classes, Grandmaster evolutions, the Paragon board, stances and songs.</p>',
  tables,
});
