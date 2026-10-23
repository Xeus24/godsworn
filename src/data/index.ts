import { ContentTable, ContentValidator } from '../engine/content/registry';
import type { ModifierSpec } from '../engine/stats/modifiers';
import { DERIVED_STATS, ELEMENTS, isPrimaryStat, isStatId, type Element } from '../engine/stats/types';
import { DERIVED_FORMULAS, STAT_CAPS } from './balance';
import { BIRTH_SIGNS } from './birthSigns';
import { CLASSES } from './classes';
import { ARMOR_WEIGHTS, WEAPON_TYPES } from './equipmentTypes';
import { GODS } from './gods';
import { PARAGON_NODES } from './paragon';
import { RACES } from './races';
import { RESOURCES } from './resources';
import { SKILL_TAGS } from './skillTags';
import { CLASS_STARTER_SKILLS, RACIAL_SKILLS } from './skills/starter';
import { ELEMENT_NAMES, STAT_INFO } from './stats';

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
  skills: new ContentTable('skill', [...CLASS_STARTER_SKILLS, ...RACIAL_SKILLS]),
  races: new ContentTable('race', RACES),
  birthSigns: new ContentTable('birth sign', BIRTH_SIGNS),
  classes: new ContentTable('class', CLASSES),
  paragon: new ContentTable('paragon node', PARAGON_NODES),
};

export type Content = typeof content;

function checkModifiers(v: ContentValidator, mods: readonly ModifierSpec[], where: string): void {
  for (const m of mods) v.check(isStatId(m.stat), `${where}: unknown stat "${m.stat}"`);
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
    for (const effect of skill.effects ?? []) {
      if (effect.kind === 'buff') checkModifiers(v, effect.modifiers, where);
      if (effect.kind === 'favor') v.ref(c.gods, effect.god, where);
    }
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
  }

  for (const node of c.paragon.all()) checkModifiers(v, node.perRank, `paragon ${node.id}`);

  v.throwIfInvalid();
}
