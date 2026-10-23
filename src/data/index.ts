import { ContentTable, ContentValidator } from '../engine/content/registry';
import type { EffectSpec, TriggeredEffect } from '../engine/effects/types';
import { isGearBase } from '../engine/items/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import { DERIVED_STATS, ELEMENTS, GEAR_STATS, isPrimaryStat, isStatId, type Element } from '../engine/stats/types';
import { DERIVED_FORMULAS, STAT_CAPS } from './balance';
import { BIRTH_SIGNS } from './birthSigns';
import { CLASSES } from './classes';
import { ARMOR_WEIGHTS, WEAPON_TYPES } from './equipmentTypes';
import { GODS } from './gods';
import {
  AFFIXES,
  CORRUPTIONS,
  ITEM_BASES,
  ITEM_SETS,
  LOOT_TABLES,
  QUALITY_DEFS,
  RARITY_DEFS,
  RUNEWORDS,
  SOURCE_TIERS,
  STARTING_KITS,
  UNIQUE_ITEMS,
} from './items';
import { IMMUNITY_PREFIX, MECHANICS } from './mechanics';
import { PARAGON_NODES } from './paragon';
import { RACES } from './races';
import { RESOURCES } from './resources';
import { SKILL_TAGS } from './skillTags';
import { ENCOUNTERS, ENEMIES, SUMMONS } from './enemies';
import { ENEMY_SKILLS } from './skills/enemy';
import { CLASS_STARTER_SKILLS, RACIAL_SKILLS } from './skills/starter';
import { ULTIMATE_SKILLS } from './skills/ultimates';
import { CLASS_TREE_SKILLS, finalizeTrees, SPECIALIZATIONS } from './trees';
import { buildBooks } from './general/books';
import { grimoireSkills, GRIMOIRES } from './general/grimoires';
import { GENERAL_COMBAT_SKILLS, GENERAL_SKILLS } from './general/skills';
import { DIVINE_COMBAT_SKILLS, DIVINE_SKILLS } from './general/divine';
import { BLESSINGS } from './blessings';
import { PANTHEON } from './pantheon';
import { PUNISHER_SKILLS, PUNISHERS } from './punishers';
import { CLASS_TRIALS, HYBRIDS, MENTOR_SKILLS, MENTORS, TRIAL_ENCOUNTERS } from './multiclass';
import { SONGS } from './songs';
import { STANCES } from './stances';
import { STATUSES } from './statuses';
import { ELEMENT_NAMES, STAT_INFO } from './stats';

const ALL_SKILLS = [...CLASS_STARTER_SKILLS, ...RACIAL_SKILLS, ...ULTIMATE_SKILLS, ...ENEMY_SKILLS, ...MENTOR_SKILLS, ...PUNISHER_SKILLS, ...CLASS_TREE_SKILLS, ...GENERAL_COMBAT_SKILLS, ...DIVINE_COMBAT_SKILLS];
const skillName = (id: string): string => ALL_SKILLS.find((s) => s.id === id)?.name ?? id;
const ALL_GENERAL = [...GENERAL_SKILLS, ...grimoireSkills(skillName), ...DIVINE_SKILLS];

/**
 * The game's content, assembled from the data files in this folder. Engine
 * and UI code look content up here; adding an entry to a data file is all
 * it takes to add it to the game.
 */
export const content = {
  stats: new ContentTable('stat', STAT_INFO),
  elements: new ContentTable(
    'element',
    ELEMENTS.map((id: Element) => ({ id, name: ELEMENT_NAMES[id] })),
  ),
  gods: new ContentTable('god', GODS),
  weaponTypes: new ContentTable('weapon type', WEAPON_TYPES),
  armorWeights: new ContentTable('armor weight', ARMOR_WEIGHTS),
  resources: new ContentTable('resource', RESOURCES),
  skillTags: new ContentTable(
    'skill tag',
    SKILL_TAGS.map((id) => ({ id })),
  ),
  skills: new ContentTable('skill', ALL_SKILLS),
  races: new ContentTable('race', RACES),
  birthSigns: new ContentTable('birth sign', BIRTH_SIGNS),
  classes: new ContentTable('class', CLASSES),
  paragon: new ContentTable('paragon node', PARAGON_NODES),
  mechanics: new ContentTable('mechanic', MECHANICS),
  rarities: new ContentTable('rarity', RARITY_DEFS),
  qualities: new ContentTable('quality', QUALITY_DEFS),
  items: new ContentTable('item', [...ITEM_BASES, ...buildBooks(ALL_GENERAL)]),
  uniques: new ContentTable('unique item', UNIQUE_ITEMS),
  itemSets: new ContentTable('item set', ITEM_SETS),
  runewords: new ContentTable('runeword', RUNEWORDS),
  affixes: new ContentTable('affix', AFFIXES),
  corruptions: new ContentTable('corruption', CORRUPTIONS),
  lootTables: new ContentTable('loot table', LOOT_TABLES),
  sourceTiers: new ContentTable('source tier', SOURCE_TIERS),
  startingKits: STARTING_KITS,
  statuses: new ContentTable('status', STATUSES),
  songs: new ContentTable('song', SONGS),
  stances: new ContentTable('stance', STANCES),
  enemies: new ContentTable('enemy', [...ENEMIES, ...MENTORS, ...PUNISHERS]),
  summons: new ContentTable('summon', SUMMONS),
  encounters: new ContentTable('encounter', [...ENCOUNTERS, ...TRIAL_ENCOUNTERS]),
  trees: new ContentTable('skill tree', finalizeTrees(ALL_SKILLS)),
  specializations: new ContentTable('specialization', SPECIALIZATIONS),
  generalSkills: new ContentTable('general skill', ALL_GENERAL),
  grimoires: new ContentTable('grimoire', GRIMOIRES),
  hybrids: new ContentTable('hybrid class', HYBRIDS),
  pantheon: new ContentTable('pantheon entry', PANTHEON),
  blessings: new ContentTable('blessing', BLESSINGS),
  classTrials: new ContentTable('class trial', CLASS_TRIALS.map((t) => ({ ...t, id: t.classId }))),
};

export type Content = typeof content;

/**
 * Stats that always start at 0 (elemental damage/resist, damage bonus,
 * lifesteal...). A percent or "more" modifier on them multiplies zero, so
 * content must use flat modifiers instead.
 */
function startsAtZero(stat: string): boolean {
  if (stat.endsWith('Damage') && stat !== 'weaponDamage' && stat !== 'critDamage') return true;
  if (stat.endsWith('Resist') && stat !== 'magicResist' && stat !== 'statusResist' && stat !== 'armorResist') return true;
  const formula = (DERIVED_FORMULAS as Record<string, { base: number; perLevel?: number; coefficients?: object }>)[stat];
  return formula !== undefined && formula.base === 0 && !formula.perLevel && Object.keys(formula.coefficients ?? {}).length === 0;
}

function checkModifiers(v: ContentValidator, mods: readonly ModifierSpec[], where: string): void {
  for (const m of mods) {
    v.check(isStatId(m.stat), `${where}: unknown stat "${m.stat}"`);
    if (m.per) {
      v.check(isPrimaryStat(m.per.stat) || (GEAR_STATS as readonly string[]).includes(m.per.stat), `${where}: "per" must reference a primary or gear stat`);
      v.check(!isPrimaryStat(m.stat) && !(GEAR_STATS as readonly string[]).includes(m.stat), `${where}: "per" modifiers can only target derived or elemental stats`);
    }
    v.check(
      !((m.type === 'percent' || m.type === 'more') && startsAtZero(m.stat)),
      `${where}: "${m.type}" modifier on ${m.stat} does nothing (it starts at 0); use "flat"`,
    );
  }
}

/** Resource ids effects may name: real resources plus "class" (the user's own). */
function checkEffects(v: ContentValidator, c: Content, effects: readonly EffectSpec[], where: string): void {
  for (const e of effects) {
    if (e.kind === 'buff') checkModifiers(v, e.modifiers, where);
    if (e.kind === 'favor') v.ref(c.gods, e.god, where);
    if (e.kind === 'gainResource' && e.resource !== 'class') v.ref(c.resources, e.resource, where);
    if (e.kind === 'castSkill') v.ref(c.skills, e.skillId, where);
    if (e.kind === 'damage' && e.scaling) v.check(isStatId(e.scaling.stat), `${where}: unknown scaling stat "${e.scaling.stat}"`);
    if (e.kind === 'applyStatus' || e.kind === 'removeStatus') v.ref(c.statuses, e.status, where);
    if (e.kind === 'summon') v.ref(c.summons, e.summonId, where);
    if (e.kind === 'setStance') v.ref(c.stances, e.stance, where);
    if (e.kind === 'startSong') v.ref(c.songs, e.song, where);
  }
}

function checkTriggers(v: ContentValidator, c: Content, triggers: readonly TriggeredEffect[] | undefined, where: string): void {
  for (const t of triggers ?? []) checkEffects(v, c, t.effects, `${where} trigger ${t.id}`);
}

function checkFlags(v: ContentValidator, c: Content, flags: readonly string[] | undefined, where: string): void {
  for (const flag of flags ?? []) {
    if (flag.startsWith(IMMUNITY_PREFIX)) {
      v.ref(c.statuses, flag.slice(IMMUNITY_PREFIX.length), where);
      continue;
    }
    v.ref(c.mechanics, flag, where);
  }
}

/** Cross-checks references between content tables. Throws on any problem. */
export function validateContent(c: Content = content): void {
  const v = new ContentValidator();

  for (const stat of DERIVED_STATS) {
    v.ref(c.stats, stat, `formula ${stat}`);
    for (const input of Object.keys(DERIVED_FORMULAS[stat].coefficients ?? {})) {
      v.check(isStatId(input), `formula ${stat}: unknown input stat "${input}"`);
    }
  }
  for (const stat of Object.keys(STAT_CAPS)) v.check(isStatId(stat), `cap: unknown stat "${stat}"`);

  for (const skill of c.skills.all()) {
    const where = `skill ${skill.id}`;
    for (const tag of skill.tags) v.ref(c.skillTags, tag, where);
    if (skill.cost.resource) v.ref(c.resources, skill.cost.resource.id, where);
    if (skill.generates) v.ref(c.resources, skill.generates.resource, where);
    if (skill.finisher) v.ref(c.resources, skill.finisher.resource, where);
    v.check(skill.maxRank >= 1, `${where}: maxRank must be at least 1`);
    checkEffects(v, c, skill.effects ?? [], where);
  }

  for (const race of c.races.all()) {
    const where = `race ${race.id}`;
    v.ref(c.skills, race.activeSkill, where);
    checkModifiers(v, race.passive.modifiers, where);
    for (const stat of Object.keys(race.statBonus)) v.check(isPrimaryStat(stat), `${where}: "${stat}" is not a primary stat`);
  }

  for (const sign of c.birthSigns.all()) {
    v.ref(c.gods, sign.god, `birth sign ${sign.id}`);
    checkModifiers(v, sign.modifiers, `birth sign ${sign.id}`);
  }

  for (const cls of c.classes.all()) {
    const where = `class ${cls.id}`;
    if (cls.resource) v.ref(c.resources, cls.resource, where);
    for (const w of cls.weapons) v.ref(c.weaponTypes, w, where);
    for (const a of cls.armor) v.ref(c.armorWeights, a, where);
    for (const s of cls.startingSkills) v.ref(c.skills, s, where);
    v.check(c.startingKits[cls.id] !== undefined, `${where}: no starting kit`);
    v.ref(c.skills, cls.ultimate, where);
    if (cls.startingSummon) v.ref(c.summons, cls.startingSummon, where);
    v.check(c.skills.find(cls.ultimate)?.ultimate === true, `${where}: ${cls.ultimate} is not an ultimate`);
  }

  for (const node of c.paragon.all()) checkModifiers(v, node.perRank, `paragon ${node.id}`);

  // ---- Items ----
  for (const base of c.items.all()) {
    const where = `item ${base.id}`;
    if (base.category === 'weapon') {
      v.ref(c.weaponTypes, base.weaponType, where);
      checkModifiers(v, base.implicit, where);
    } else if (base.category === 'armor') {
      v.ref(c.armorWeights, base.weight, where);
      checkModifiers(v, base.implicit, where);
    } else if (base.category === 'accessory') {
      checkModifiers(v, base.implicit, where);
      if (base.onUse) checkEffects(v, c, base.onUse.effects, where);
    } else if (base.category === 'gem') {
      checkModifiers(v, [...base.weapon, ...base.armor, ...base.jewelry], where);
    } else if (base.category === 'rune') {
      checkModifiers(v, [...base.weapon, ...base.armor], where);
    } else if (base.category === 'consumable') {
      if (base.action.kind === 'effects') checkEffects(v, c, base.action.effects, where);
      if (base.action.kind === 'timedBuff') checkModifiers(v, base.action.modifiers, where);
    } else if (base.category === 'curiosity') {
      for (const god of base.lovedBy ?? []) v.ref(c.gods, god, where);
    }
  }

  for (const u of c.uniques.all()) {
    const where = `unique ${u.id}`;
    const base = c.items.find(u.baseId);
    v.check(base !== undefined && isGearBase(base), `${where}: base "${u.baseId}" is not gear`);
    if (u.rarity === 'relic') v.check(base?.category === 'relic', `${where}: relics must use a relic base`);
    checkModifiers(v, u.modifiers, where);
    checkTriggers(v, c, u.triggers, where);
    checkFlags(v, c, u.flags, where);
    if (u.setId) v.ref(c.itemSets, u.setId, where);
    if (u.activeAbility) checkEffects(v, c, u.activeAbility.effects, where);
    if (u.awakening) checkModifiers(v, u.awakening.modifiers, where);
    for (const cls of u.requirements?.classes ?? []) v.ref(c.classes, cls, where);
    if (u.requirements?.favor) v.ref(c.gods, u.requirements.favor.god, where);
  }

  for (const set of c.itemSets.all()) {
    const where = `set ${set.id}`;
    if (set.classId) v.ref(c.classes, set.classId, where);
    for (const piece of set.pieces) {
      v.ref(c.uniques, piece, where);
      v.check(c.uniques.find(piece)?.setId === set.id, `${where}: piece ${piece} does not point back to the set`);
    }
    for (const bonus of set.bonuses) {
      v.check(bonus.pieces <= set.pieces.length, `${where}: ${bonus.pieces}-piece bonus but only ${set.pieces.length} pieces`);
      checkModifiers(v, bonus.modifiers, where);
      checkTriggers(v, c, bonus.triggers, where);
      checkFlags(v, c, bonus.flags, where);
    }
  }

  for (const rw of c.runewords.all()) {
    const where = `runeword ${rw.id}`;
    for (const r of rw.runes) v.check(c.items.find(r)?.category === 'rune', `${where}: "${r}" is not a rune`);
    checkModifiers(v, rw.modifiers, where);
    checkTriggers(v, c, rw.triggers, where);
    checkFlags(v, c, rw.flags, where);
  }

  for (const a of c.affixes.all()) {
    const where = `affix ${a.id}`;
    checkModifiers(v, a.stats.map((s) => ({ ...s, value: 1 })), where);
    for (const tier of a.tiers) v.check(tier.ranges.length === a.stats.length, `${where}: tier ranges do not match stats`);
  }
  for (const corr of c.corruptions.all()) checkModifiers(v, corr.modifiers, `corruption ${corr.id}`);

  for (const table of c.lootTables.all()) {
    const where = `loot table ${table.id}`;
    for (const e of table.entries) {
      if (e.kind === 'item') v.ref(c.items, e.itemId, where);
      if (e.kind === 'table') v.ref(c.lootTables, e.tableId, where);
      if (e.kind === 'gear' && e.minRarity) v.ref(c.rarities, e.minRarity, where);
    }
  }

  for (const [classId, kit] of Object.entries(c.startingKits)) {
    const where = `starting kit ${classId}`;
    v.ref(c.classes, classId, where);
    for (const entry of kit) {
      v.ref(c.items, entry.itemId, where);
      const base = c.items.find(entry.itemId);
      if (entry.equip) v.check(base !== undefined && isGearBase(base), `${where}: ${entry.itemId} cannot be equipped`);
    }
  }

  // ---- Combat ----
  for (const st of c.statuses.all()) checkModifiers(v, st.modifiers ?? [], `status ${st.id}`);
  for (const song of c.songs.all()) {
    checkModifiers(v, song.aura, `song ${song.id}`);
    checkEffects(v, c, song.crescendo.effects, `song ${song.id}`);
  }
  for (const stance of c.stances.all()) {
    checkModifiers(v, stance.modifiers, `stance ${stance.id}`);
    checkEffects(v, c, stance.basicAttack.effects, `stance ${stance.id}`);
  }
  for (const e of c.enemies.all()) {
    const where = `enemy ${e.id}`;
    for (const sk of e.skills) v.ref(c.skills, sk.id, where);
    v.ref(c.lootTables, e.lootTable, where);
    checkModifiers(v, e.modifiers ?? [], where);
    checkTriggers(v, c, e.triggers, where);
    checkFlags(v, c, e.flags, where);
  }
  for (const s of c.summons.all()) for (const sk of s.skills) v.ref(c.skills, sk.id, `summon ${s.id}`);
  for (const enc of c.encounters.all()) {
    v.check(enc.enemies.length > 0 && enc.enemies.length <= 6, `encounter ${enc.id}: needs 1-6 enemies`);
    for (const e of enc.enemies) v.ref(c.enemies, e.enemyId, `encounter ${enc.id}`);
  }

  // ---- Specializations and general skills ----
  for (const sp of c.specializations.all()) {
    const where = `specialization ${sp.id}`;
    v.ref(c.classes, sp.classId, where);
    v.check(c.skills.find(sp.ultimate)?.ultimate === true, `${where}: ${sp.ultimate} is not an ultimate`);
    v.check(c.trees.find(sp.classId)?.branches.some((b) => b.spec === sp.id) === true, `${where}: no tree branch`);
  }
  for (const cls of c.classes.all()) v.check(c.specializations.filter((s) => s.classId === cls.id).length === 3, `class ${cls.id}: needs 3 specializations`);
  for (const g of c.generalSkills.all()) {
    const where = `general skill ${g.id}`;
    if (g.combatSkill) v.ref(c.skills, g.combatSkill, where);
    checkModifiers(v, g.passive ?? [], where);
    checkFlags(v, c, g.flags, where);
    v.check(g.combatSkill !== undefined || (g.passive?.length ?? 0) > 0 || g.utility !== undefined || (g.flags?.length ?? 0) > 0, `${where}: does nothing`);
    v.ref(c.items, `book-${g.id}`, where);
  }
  // ---- Gods ----
  for (const p of c.pantheon.all()) {
    const where = `god ${p.id}`;
    v.ref(c.gods, p.id, where);
    for (const r of p.rivals) v.check(c.pantheon.find(r)?.rivals.includes(p.id) === true, `${where}: rival ${r} is not mutual`);
    for (const a of p.allies) v.ref(c.gods, a, where);
    for (const d of [...p.likes, ...p.dislikes]) if (d.tag) v.ref(c.skillTags, d.tag, where);
    v.check(p.likes.every((d) => d.amount > 0) && p.dislikes.every((d) => d.amount < 0), `${where}: likes must be positive, dislikes negative`);
    checkEffects(v, c, p.prayer.effects, `${where} prayer`);
    checkEffects(v, c, p.intervention.effects, `${where} intervention`);
    v.check(c.blessings.filter((b) => b.god === p.id && b.kind === 'minor').length === 3, `${where}: needs 3 minor blessings`);
    v.check(c.blessings.filter((b) => b.god === p.id && b.kind === 'major').length === 6, `${where}: needs 6 major blessings`);
    v.ref(c.enemies, `punisher-${p.id}`, where);
  }
  for (const g of c.gods.all()) v.check(g.hidden === true || c.pantheon.has(g.id), `god ${g.id}: no pantheon entry`);
  for (const b of c.blessings.all()) {
    const where = `blessing ${b.id}`;
    v.ref(c.gods, b.god, where);
    checkModifiers(v, b.modifiers, where);
    checkTriggers(v, c, b.triggers, where);
    checkFlags(v, c, b.flags, where);
    v.check(b.kind === 'minor' ? (b.battles ?? 0) > 0 && (b.favorCost ?? 0) > 0 : b.minTier !== undefined, `${where}: minor needs battles and cost, major a tier`);
  }
  for (const u of c.uniques.all()) if (u.requirements?.favor) v.ref(c.gods, u.requirements.favor.god, `unique ${u.id}`);
  for (const g of c.generalSkills.all()) v.check((g.category === 'divine') === (g.god !== undefined), `general skill ${g.id}: divine skills need a god (and only they)`);

  // ---- Multiclassing ----
  for (const cls of c.classes.all()) {
    const trial = c.classTrials.find(cls.id);
    v.check(trial !== undefined, `class ${cls.id}: no class trial`);
    if (trial) v.ref(c.encounters, trial.encounter, `class trial ${cls.id}`);
  }
  for (const h of c.hybrids.all()) {
    const where = `hybrid ${h.id}`;
    for (const cls of h.classes) v.ref(c.classes, cls, where);
    v.check(h.classes[0] !== h.classes[1], `${where}: needs two different classes`);
    v.ref(c.encounters, h.trial, where);
    const tree = c.trees.find(h.id);
    v.check(tree !== undefined && tree.nodes.length >= 15 && tree.nodes.length <= 20, `${where}: needs a 15-20 node tree`);
  }
  for (const gr of c.grimoires.all()) {
    v.ref(c.skills, gr.skill, `grimoire ${gr.id}`);
    v.ref(c.classes, gr.classId, `grimoire ${gr.id}`);
  }

  // ---- Skill trees ----
  for (const cls of c.classes.all()) v.check(c.trees.has(cls.id), `class ${cls.id}: no skill tree`);
  for (const tree of c.trees.all()) {
    const ids = new Set<string>();
    const branchIds = new Set(tree.branches.map((b) => b.id));
    for (const n of tree.nodes) {
      const where = `tree node ${n.id}`;
      v.check(!ids.has(n.id), `${where}: duplicate id`);
      ids.add(n.id);
      v.check(branchIds.has(n.branch), `${where}: unknown branch`);
      if (n.skill) v.ref(c.skills, n.skill, where);
      if (n.variant) {
        v.ref(c.skills, n.variant.skill, where);
        checkEffects(v, c, n.variant.patch.addEffects ?? [], where);
        checkEffects(v, c, n.variant.patch.replaceEffects ?? [], where);
        for (const t of n.variant.patch.addTags ?? []) v.ref(c.skillTags, t, where);
      }
      checkModifiers(v, n.modifiers ?? [], where);
      checkTriggers(v, c, n.triggers, where);
      checkFlags(v, c, n.flags, where);
    }
    for (const n of tree.nodes) for (const p of n.parents) v.check(ids.has(p), `tree node ${n.id}: unknown parent ${p}`);
  }

  v.throwIfInvalid();
}
