/**
 * Shared lookups and describers for the skills section: who grants a skill,
 * readable effect text, node text.
 */
import { content } from '../../../src/data';
import { PARAGON_BOARDS } from '../../../src/data/paragon';
import type { EffectSpec } from '../../../src/engine/effects/types';
import type { Feat } from '../../../src/engine/skills/feats';
import type { SkillPatch, TreeNodeDef } from '../../../src/engine/skills/treeTypes';
import type { SkillDef } from '../../../src/engine/skills/types';
import { esc, mods } from '../../core/html';
import type { RenderCtx } from '../../core/types';

export { PARAGON_BOARDS };

export const TARGETING: Record<string, string> = {
  enemy: 'One enemy',
  allEnemies: 'All enemies',
  frontRow: 'Enemy front row',
  backRow: 'Enemy back row',
  randomEnemies: 'Random enemies',
  self: 'Self',
  ally: 'One ally',
  allAllies: 'All allies',
};

export const SOURCE_LABEL: Record<string, string> = {
  class: 'Class skills',
  racial: 'Racial skills',
  general: 'General skills',
  specialization: 'Specialization skills',
  hybrid: 'Hybrid skills',
  apostle: 'Apostle skills',
  avatar: 'Avatar skills',
  ultimate: 'Ultimates',
  enemy: 'Enemy skills',
  basic: 'Basic skills',
  spirit: 'Spirit skills',
  team: 'Team techniques',
  weaponArt: 'Weapon arts',
};

export const KIND_LABEL: Record<string, string> = {
  active: 'Skill',
  modifier: 'Skill modifier',
  minor: 'Minor',
  notable: 'Notable',
  choice: 'Choice',
  keystone: 'Keystone',
  capstone: 'Capstone',
};

const TIER_GATE = 5;

const skills = content.skills.all();
const trees = content.trees.all();
const classes = content.classes.all();

export const skillName = (id: string): string => content.skills.find(id)?.name ?? id;
export const statusName = (id: string): string => content.statuses.find(id)?.name ?? id;
export const elementName = (id: string): string => content.elements.find(id)?.name ?? id;

export function ownerName(id: string): string {
  return (
    content.classes.find(id)?.name ??
    content.hybrids.find(id)?.name ??
    (id.startsWith('apostle-') ? `Apostle of ${content.gods.find(id.slice(8))?.name ?? id.slice(8)}` : undefined) ??
    id
  );
}

/** Link to the page that best represents an owner id (class, hybrid or apostle tree). */
export function ownerLink(ctx: RenderCtx, id: string): string {
  if (content.classes.find(id)) return ctx.link('class', id);
  if (content.hybrids.find(id)) return ctx.link('hybrid', id);
  if (id.startsWith('apostle-') && content.gods.find(id.slice(8))) return ctx.link('god', id.slice(8), ownerName(id));
  return esc(ownerName(id));
}

export function treeTitle(treeId: string): string {
  const t = content.trees.find(treeId);
  const owner = ownerName(t?.classId ?? treeId);
  return `${owner} skill tree`;
}

export const treeLink = (ctx: RenderCtx, id: string): string => ctx.link('tree', id, treeTitle(id));

// ---------------------------------------------------------------- grant index

export interface Grant {
  kind: 'tree' | 'starting' | 'ultimate' | 'racial' | 'general' | 'specialization' | 'evolution' | 'modifier';
  /** Trusted-HTML builder. */
  html: (ctx: RenderCtx) => string;
}

export interface SkillIndex {
  grants: Map<string, Grant[]>;
  /** Group label per skill, used on the list page. */
  group: Map<string, string>;
  modifiers: Map<string, { node: TreeNodeDef; tree: string }[]>;
}

function build(): SkillIndex {
  const grants = new Map<string, Grant[]>();
  const group = new Map<string, string>();
  const modifiers = new Map<string, { node: TreeNodeDef; tree: string }[]>();
  const add = (skill: string, g: Grant): void => {
    const l = grants.get(skill) ?? [];
    l.push(g);
    grants.set(skill, l);
  };
  const setGroup = (skill: string, label: string): void => {
    if (!group.has(skill)) group.set(skill, label);
  };

  for (const t of trees) {
    const seen = new Set<string>();
    for (const n of t.nodes) {
      if (n.kind === 'active' && n.skill && !seen.has(n.skill)) {
        seen.add(n.skill);
        const branch = t.branches.find((b) => b.id === n.branch);
        add(n.skill, {
          kind: 'tree',
          html: (ctx) => `${treeLink(ctx, t.id)}${branch ? `, ${esc(branch.name)} branch` : ''} (tier ${n.tier}${n.starting ? ', starting skill' : ''})`,
        });
        setGroup(n.skill, ownerName(t.classId));
      }
      if (n.variant) {
        const l = modifiers.get(n.variant.skill) ?? [];
        l.push({ node: n, tree: t.id });
        modifiers.set(n.variant.skill, l);
      }
    }
  }
  for (const c of classes) {
    for (const s of c.startingSkills) {
      add(s, { kind: 'starting', html: (ctx) => `Starting skill of ${ctx.link('class', c.id)}` });
      setGroup(s, c.name);
    }
    add(c.ultimate, { kind: 'ultimate', html: (ctx) => `Ultimate of ${ctx.link('class', c.id)}` });
    setGroup(c.ultimate, c.name);
  }
  for (const r of content.races.all()) {
    add(r.activeSkill, { kind: 'racial', html: (ctx) => `Racial skill of ${ctx.link('race', r.id)}` });
  }
  for (const sp of content.specializations.all()) {
    add(sp.ultimate, { kind: 'specialization', html: (ctx) => `Ultimate of ${ctx.link('specialization', sp.id)}` });
    setGroup(sp.ultimate, ownerName(sp.classId));
  }
  for (const g of content.generalSkills.all()) {
    if (g.combatSkill) add(g.combatSkill, { kind: 'general', html: (ctx) => `Combat skill of ${ctx.link('general-skill', g.id)}` });
  }
  for (const e of content.evolutions.all()) {
    add(e.from, { kind: 'evolution', html: (ctx) => `Evolves into ${ctx.linkIf('skill', e.id, e.name)}` });
    add(e.id, { kind: 'evolution', html: (ctx) => `Evolution of ${ctx.linkIf('skill', e.from, skillName(e.from))} (${ctx.link('evolution', e.id, 'details')})` });
    setGroup(e.id, `${ownerName(e.classId)} (evolved)`);
  }
  // Fall back to the source label.
  for (const s of skills) {
    if (!group.has(s.id)) {
      const label = s.team ? 'Team techniques' : s.weaponArt ? 'Weapon arts' : (SOURCE_LABEL[s.source] ?? s.source);
      group.set(s.id, label);
    }
  }
  return { grants, group, modifiers };
}

let cached: SkillIndex | undefined;
export const skillIndex = (): SkillIndex => (cached ??= build());

// ---------------------------------------------------------------- effects

const tgt = (t: string | undefined): string => {
  switch (t) {
    case 'self': return 'self';
    case 'allEnemies': return 'all enemies';
    case 'allAllies': return 'all allies';
    case 'randomEnemy': return 'a random enemy';
    case 'target': return 'the target';
    default: return '';
  }
};

const statName = (id: string): string => content.stats.find(id)?.name ?? id;

/** One readable sentence for an effect. Trusted HTML (uses ctx for links). */
export function describeEffect(e: EffectSpec, ctx: RenderCtx): string {
  const to = (t: string | undefined): string => (tgt(t) ? ` (${tgt(t)})` : '');
  const sc = (s?: { stat: string; ratio: number }): string => (s ? `${Math.round(s.ratio * 100)}% ${esc(statName(s.stat))}` : '');
  switch (e.kind) {
    case 'damage':
      return `Deals ${esc(elementName(e.element))} damage: ${[e.base ? esc(e.base) : '', sc(e.scaling)].filter(Boolean).join(' + ') || '—'}${to(e.target)}`;
    case 'heal':
      return `Heals ${[e.percentMaxHp ? `${esc(e.percentMaxHp)}% max HP` : '', e.base ? esc(e.base) : '', sc(e.scaling)].filter(Boolean).join(' + ')}${to(e.target)}`;
    case 'restoreMp':
      return `Restores ${esc(e.amount)} MP${to(e.target)}`;
    case 'gainResource':
      return `Gain ${esc(e.amount)} ${esc(content.resources.find(e.resource)?.name ?? e.resource)}`;
    case 'bind':
      return `Throws a Soul Seal (power ${esc(e.power)})${to(e.target)}`;
    case 'applyStatus':
      return `${e.chance && e.chance < 100 ? `${esc(e.chance)}% chance to apply` : 'Applies'} ${ctx.linkIf('status', e.status, statusName(e.status))}${e.stacks && e.stacks > 1 ? ` x${esc(e.stacks)}` : ''} for ${esc(e.duration)} turns${to(e.target)}`;
    case 'removeStatus':
      return `Removes ${ctx.linkIf('status', e.status, statusName(e.status))}${to(e.target)}`;
    case 'shield':
      return `Shields for ${[e.percentMaxHp ? `${esc(e.percentMaxHp)}% max HP` : '', e.base ? esc(e.base) : '', sc(e.scaling)].filter(Boolean).join(' + ')}${to(e.target)}`;
    case 'buff':
      return `Buff for ${esc(e.duration)} turns${to(e.target)}: ${mods(e.modifiers).replace(/<br>/g, '; ')}`;
    case 'favor':
      return `${e.amount >= 0 ? 'Gain' : 'Lose'} ${esc(Math.abs(e.amount))} favor with ${ctx.linkIf('god', e.god, content.gods.find(e.god)?.name ?? e.god)}`;
    case 'reduceCooldowns':
      return `Reduces cooldowns by ${esc(e.turns)}`;
    case 'castSkill':
      return `Casts ${ctx.linkIf('skill', e.skillId, skillName(e.skillId))}${to(e.target)}`;
    case 'gold':
      return `${esc(e.amount)} gold`;
    case 'setStance':
      return `Enters the ${ctx.linkIf('stance', e.stance, content.stances.find(e.stance)?.name ?? e.stance)} stance`;
    case 'startSong':
      return `Starts ${ctx.linkIf('song', e.song, content.songs.find(e.song)?.name ?? e.song)}`;
    case 'summon':
      return `Summons ${ctx.linkIf('summon', e.summonId, content.summons.find(e.summonId)?.name ?? e.summonId)}${e.consumeCorpse ? ' (consumes a corpse)' : ''}`;
    case 'guard':
      return `Guards the target, taking ${esc(e.share)}% of their damage for ${esc(e.duration)} turns`;
    case 'timeShift':
      return `${e.turns > 0 ? `Delays by ${esc(e.turns)} turn(s)` : `Advances by ${esc(-e.turns)} turn(s)`}${to(e.target)}`;
    case 'rewind':
      return `Rewinds to best recent health and cleanses harmful statuses${to(e.target)}`;
    case 'echo':
      return 'Repeats the last skill used, free';
    case 'steal':
      return `Steals up to ${esc(e.gold)} gold`;
    case 'stealSkill':
      return `Takes the target's last skill${to(e.target)}`;
    case 'castBorrowed':
      return 'Casts the held skill free';
    case 'sigil':
      return `Paints the ${esc(e.name)} sigil (${esc(e.charges)} charges): ${e.effects.map((x) => describeEffect(x, ctx)).join('; ')}`;
    case 'terrain':
      return `Changes the terrain to ${esc(e.terrain)} for ${esc(e.duration)} turns`;
    default:
      return esc((e as { kind: string }).kind);
  }
}

export const effectList = (list: readonly EffectSpec[] | undefined, ctx: RenderCtx): string[] => (list ?? []).map((e) => describeEffect(e, ctx));

/** Readable summary of a skill modifier patch. */
export function describePatch(p: SkillPatch, ctx: RenderCtx): string {
  const parts: string[] = [];
  if (p.powerMult) parts.push(`${esc(Math.round(p.powerMult * 100))}% power`);
  if (p.hitsAdd) parts.push(`${p.hitsAdd > 0 ? '+' : ''}${esc(p.hitsAdd)} hits`);
  if (p.targeting) parts.push(`targets: ${esc(TARGETING[p.targeting] ?? p.targeting)}`);
  if (p.element) parts.push(`element: ${esc(elementName(p.element))}`);
  if (p.costMult) parts.push(`${esc(Math.round(p.costMult * 100))}% cost`);
  if (p.cooldownDelta) parts.push(`${p.cooldownDelta > 0 ? '+' : ''}${esc(p.cooldownDelta)} cooldown`);
  if (p.generatesDelta) parts.push(`${p.generatesDelta > 0 ? '+' : ''}${esc(p.generatesDelta)} resource generated`);
  if (p.alwaysCrit) parts.push('always crits');
  if (p.staggerMult) parts.push(`${esc(p.staggerMult)}x stagger`);
  if (p.addTags?.length) parts.push(`adds ${esc(p.addTags.join(', '))}`);
  for (const e of p.addEffects ?? []) parts.push(`adds: ${describeEffect(e, ctx)}`);
  if (p.replaceEffects) parts.push(`replaces effects: ${p.replaceEffects.map((e) => describeEffect(e, ctx)).join('; ') || 'none'}`);
  return parts.join('; ');
}

export function describeFeat(f: Feat): string {
  switch (f.kind) {
    case 'kills': return `Defeat ${f.count} ${content.enemies.find(f.enemy)?.name ?? f.enemy}`;
    case 'mastery': return `Mastery ${f.level} in ${skillName(f.skill)}`;
    case 'classLevel': return `Class level ${f.level}`;
    case 'trophies': return `${f.count} trophies`;
    case 'paragon': return `Paragon level ${f.level}`;
  }
}

/** Costs as one line, e.g. `12 MP, 5 Rage`. */
export function costText(s: SkillDef): string {
  const c = s.cost;
  const parts: string[] = [];
  if (c.mp) parts.push(`${c.mp} MP`);
  if (c.hpPct) parts.push(`${c.hpPct}% max HP`);
  if (c.resource) parts.push(`${c.resource.amount} ${content.resources.find(c.resource.id)?.name ?? c.resource.id}`);
  if (c.tactic) parts.push(`${c.tactic} Tactic`);
  return parts.join(', ');
}

/** Requirement text for one tree node. */
export function nodeRequirement(n: TreeNodeDef, treeId: string, gate: number, ctx: RenderCtx): string {
  const t = content.trees.get(treeId);
  const parts: string[] = [];
  const need = (n.tier - 1) * gate;
  if (need > 0) parts.push(`${need} points in branch`);
  if (n.parents.length) {
    const names = n.parents.map((p) => {
      const pn = t.nodes.find((x) => x.id === p);
      return esc(pn?.name ?? p);
    });
    parts.push(`${names.join(' or ')}`);
  }
  if (n.feat) parts.push(`Secret: ${esc(describeFeat(n.feat))}`);
  if (n.choiceGroup) parts.push('one of its choice group');
  void ctx;
  return parts.join('<br>');
}

export const TREE_TIER_GATE = TIER_GATE;
