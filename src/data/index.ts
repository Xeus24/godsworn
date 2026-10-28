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
import { FORBIDDEN_COMBAT_SKILLS, FORBIDDEN_SKILLS } from './general/forbidden';
import { BLESSINGS } from './blessings';
import { TREASURES, TREASURE_ITEMS } from './world/treasures';
import { DYES, FRAMES } from './appearance';
import { PANTHEON } from './pantheon';
import { PUNISHER_SKILLS, PUNISHERS } from './punishers';
import { APOSTLE_BLESSINGS, APOSTLE_TRIALS, APOSTLES, ASPECT_SKILLS, ASPECTS, DIVINE_WEAPONS, EDICTS } from './apostles';
import { CLASS_TRIALS, HYBRIDS, MENTOR_SKILLS, MENTORS, TRIAL_ENCOUNTERS } from './multiclass';
import { SONGS } from './songs';
import { DEEP_ENEMIES } from './bestiary/enemies';
import { DEEP_ENEMY_SKILLS } from './bestiary/skills';
import { BOSS_SCRIPTS, BOSS_SKILLS } from './bestiary/bossScripts';
import { ELITE_AFFIXES } from './bestiary/affixes';
import { ACHIEVEMENTS, ACHIEVEMENT_MILESTONES } from './achievements';
import { FOLLOWERS } from './followers';
import { RIFT_AFFIXES } from './rifts';
import { CHALLENGES } from './challenges';
import { MOUNTS, PETS } from './pets';
import { HERESY } from './heresy';
import { FACTIONS } from './world/factions';
import { HOUSE_ROOMS } from './world/housing';
import { LORE } from './world/lore';
import { DUNGEONS, TOWNS } from './world/places';
import { WEATHER } from './world/weather';
import { ZONES } from './world/zones';
import { PROFESSIONS, RECIPES } from './economy/recipes';
import { buildRecipeScrolls } from './economy/scrolls';
import { SHOPS } from './economy/shops';
import { STANCES } from './stances';
import { STATUSES } from './statuses';
import { ELEMENT_NAMES, STAT_INFO } from './stats';
import { ALL_ENDINGS, COMPANIONS, DIALOGUES, NPCS, QUEST_ENCOUNTERS, QUEST_ITEMS, QUESTS, STORY_ENEMIES } from './story';
import type { ActionDef, Cond, DialogueDef, ObjectiveDef, Spot } from '../engine/quests/types';

const ALL_SKILLS = [...CLASS_STARTER_SKILLS, ...RACIAL_SKILLS, ...ULTIMATE_SKILLS, ...ENEMY_SKILLS, ...MENTOR_SKILLS, ...PUNISHER_SKILLS, ...ASPECT_SKILLS, ...DEEP_ENEMY_SKILLS, ...BOSS_SKILLS, ...CLASS_TREE_SKILLS, ...GENERAL_COMBAT_SKILLS, ...DIVINE_COMBAT_SKILLS, ...FORBIDDEN_COMBAT_SKILLS];
const skillName = (id: string): string => ALL_SKILLS.find((s) => s.id === id)?.name ?? id;
const ALL_GENERAL = [...GENERAL_SKILLS, ...grimoireSkills(skillName), ...DIVINE_SKILLS, ...FORBIDDEN_SKILLS];

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
  items: new ContentTable('item', [...ITEM_BASES, ...TREASURE_ITEMS, ...buildBooks(ALL_GENERAL), ...buildRecipeScrolls(RECIPES), ...QUEST_ITEMS]),
  uniques: new ContentTable('unique item', [...UNIQUE_ITEMS, ...DIVINE_WEAPONS]),
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
  enemies: new ContentTable('enemy', [...ENEMIES, ...DEEP_ENEMIES, ...MENTORS, ...PUNISHERS, ...ASPECTS, ...STORY_ENEMIES, ...FOLLOWERS]),
  summons: new ContentTable('summon', SUMMONS),
  bossScripts: new ContentTable('boss script', BOSS_SCRIPTS),
  eliteAffixes: new ContentTable('elite affix', ELITE_AFFIXES),
  riftAffixes: new ContentTable('rift affix', RIFT_AFFIXES),
  challenges: new ContentTable('challenge', CHALLENGES),
  pets: new ContentTable('pet', PETS),
  mounts: new ContentTable('mount', MOUNTS),
  encounters: new ContentTable('encounter', [...ENCOUNTERS, ...TRIAL_ENCOUNTERS, ...APOSTLE_TRIALS, ...QUEST_ENCOUNTERS]),
  trees: new ContentTable('skill tree', finalizeTrees(ALL_SKILLS)),
  specializations: new ContentTable('specialization', SPECIALIZATIONS),
  generalSkills: new ContentTable('general skill', ALL_GENERAL),
  grimoires: new ContentTable('grimoire', GRIMOIRES),
  hybrids: new ContentTable('hybrid class', HYBRIDS),
  pantheon: new ContentTable('pantheon entry', PANTHEON),
  blessings: new ContentTable('blessing', [...BLESSINGS, ...APOSTLE_BLESSINGS]),
  apostles: new ContentTable('apostle', APOSTLES.map((a) => ({ ...a, id: a.god }))),
  edicts: new ContentTable('edict', EDICTS),
  zones: new ContentTable('zone', ZONES),
  towns: new ContentTable('town', TOWNS),
  dungeons: new ContentTable('dungeon', DUNGEONS),
  weather: new ContentTable('weather', WEATHER),
  factions: new ContentTable('faction', FACTIONS),
  houseRooms: new ContentTable('house room', HOUSE_ROOMS),
  lore: new ContentTable('lore page', LORE),
  professions: new ContentTable('profession', PROFESSIONS),
  recipes: new ContentTable('recipe', RECIPES),
  shops: new ContentTable('shop', SHOPS),
  classTrials: new ContentTable('class trial', CLASS_TRIALS.map((t) => ({ ...t, id: t.classId }))),
  quests: new ContentTable('quest', QUESTS),
  npcs: new ContentTable('npc', NPCS),
  dialogues: new ContentTable('dialogue', DIALOGUES),
  companions: new ContentTable('companion', COMPANIONS),
  endings: new ContentTable('ending', ALL_ENDINGS),
  achievements: new ContentTable('achievement', ACHIEVEMENTS),
  treasures: new ContentTable('treasure map', TREASURES),
  dyes: new ContentTable('dye', DYES),
  frames: new ContentTable('portrait frame', FRAMES),
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

  for (const m of ACHIEVEMENT_MILESTONES) checkModifiers(v, m.modifiers, `achievement milestone ${m.points}`);

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
    if (cls.trait) checkModifiers(v, cls.trait.modifiers, `${where} trait`);
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
  for (const b of c.items.all()) {
    if (b.forbidden !== undefined) v.check(b.forbidden >= 0 && b.forbidden < HERESY.tiers.length, `item ${b.id}: forbidden tier out of range`);
  }
  for (const g of c.generalSkills.all()) {
    if (g.heresy !== undefined) v.check(g.category === 'forbidden' && g.heresy < HERESY.tiers.length, `general skill ${g.id}: heresy needs a forbidden skill and a real tier`);
  }
  for (const t of c.treasures.all()) v.ref(c.zones, t.zone, `treasure ${t.id}`);
  for (const f of c.frames.all()) if (f.achievement) v.ref(c.achievements, f.achievement, `frame ${f.id}`);
  for (const a of c.achievements.all()) {
    checkCond(v, c, a.check, `achievement ${a.id}`);
    v.check(a.points > 0, `achievement ${a.id}: needs points`);
  }
  for (const pet of c.pets.all()) checkModifiers(v, pet.modifiers, `pet ${pet.id}`);
  for (const a of c.achievements.all()) {
    if (a.pet) v.ref(c.pets, a.pet, `achievement ${a.id}`);
    if (a.mount) v.ref(c.mounts, a.mount, `achievement ${a.id}`);
  }
  for (const ch of c.challenges.all()) {
    checkModifiers(v, ch.heroModifiers ?? [], `challenge ${ch.id}`);
    checkModifiers(v, ch.enemyModifiers ?? [], `challenge ${ch.id}`);
  }
  for (const a of c.riftAffixes.all()) {
    checkModifiers(v, a.enemy ?? [], `rift affix ${a.id}`);
    checkModifiers(v, a.party ?? [], `rift affix ${a.id}`);
  }
  for (const a of c.eliteAffixes.all()) {
    const where = `elite affix ${a.id}`;
    checkModifiers(v, a.modifiers ?? [], where);
    checkTriggers(v, c, a.triggers, where);
    checkFlags(v, c, a.flags, where);
  }
  for (const script of c.bossScripts.all()) {
    const where = `boss script ${script.id}`;
    const boss = c.enemies.find(script.id);
    v.check(boss !== undefined && ['miniboss', 'boss', 'worldBoss'].includes(boss.tier), `${where}: must name a miniboss, boss or world boss`);
    let last = 100;
    for (const ph of script.phases) {
      v.check(ph.hpPct > 0 && ph.hpPct < last, `${where}: phases must go down in HP order`);
      last = ph.hpPct;
      for (const id of ph.adds ?? []) v.ref(c.enemies, id, where);
      for (const sk of ph.skills ?? []) v.ref(c.skills, sk.id, where);
      checkModifiers(v, ph.modifiers ?? [], where);
      checkEffects(v, c, ph.effects ?? [], where);
    }
    for (const t of script.telegraphs) {
      v.ref(c.skills, t.skillId, where);
      v.check(t.every >= 2, `${where}: telegraphs need at least 2 turns apart`);
    }
  }
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
    v.check(c.blessings.filter((b) => b.god === p.id && b.kind === 'major' && b.rarity !== 'divine').length === 6, `${where}: needs 6 major blessings (plus its Divine one)`);
    v.ref(c.enemies, `punisher-${p.id}`, where);
    const apostle = c.apostles.find(p.id);
    v.check(apostle !== undefined, `${where}: no apostleship`);
    if (apostle) {
      v.check(c.skills.find(apostle.avatar)?.ultimate === true, `${where}: avatar must be an ultimate`);
      const tree = c.trees.find(`apostle-${p.id}`);
      v.check(tree !== undefined && tree.nodes.length >= 20 && tree.nodes.length <= 25, `${where}: needs a 20-25 node apostle tree`);
      for (let st = 1; st <= 4; st++) v.ref(c.uniques, `divine-weapon-${p.id}-${st}`, where);
      for (let st = 1; st <= 3; st++) v.ref(c.encounters, `apostle-trial-${p.id}-${st}`, where);
      v.ref(c.blessings, `${p.id}-divine`, where);
      v.check(c.edicts.filter((e) => e.god === p.id).length > 0, `${where}: no edicts`);
    }
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

  // ---- World ----
  const groups = (where: string, list: readonly { enemies: { enemyId: string }[]; weather?: string[] }[]): void => {
    for (const gr of list) {
      v.check(gr.enemies.length > 0 && gr.enemies.length <= 6, `${where}: groups need 1-6 enemies`);
      for (const e of gr.enemies) v.ref(c.enemies, e.enemyId, where);
      for (const w of gr.weather ?? []) v.ref(c.weather, w, where);
    }
  };
  const orders = c.zones.all().map((z) => z.order).sort((a, b) => a - b);
  v.check(orders.every((o, i) => o === i + 1), 'zones: orders must run 1..n');
  for (const z of c.zones.all()) {
    const where = `zone ${z.id}`;
    groups(where, z.encounters);
    groups(`${where} roaming`, z.roaming);
    if (z.town) v.check(c.towns.find(z.town)?.zone === z.id, `${where}: town ${z.town} is not in this zone`);
    for (const d of z.dungeons) v.check(c.dungeons.find(d)?.zone === z.id, `${where}: dungeon ${d} is not in this zone`);
    v.ref(c.enemies, z.worldBoss, where);
    v.check(c.enemies.find(z.worldBoss)?.tier === 'worldBoss', `${where}: ${z.worldBoss} is not a world boss`);
    for (const s of z.shrines) v.ref(c.pantheon, s, where);
    for (const w of z.weather) v.ref(c.weather, w.id, where);
    for (const l of z.lore) v.check(c.lore.find(l)?.zone === z.id, `${where}: lore ${l} is not in this zone`);
    for (const id of [...z.gather.mining, ...z.gather.herbalism, ...z.gather.fishing]) v.ref(c.items, id, where);
  }
  for (const d of c.dungeons.all()) {
    groups(`dungeon ${d.id}`, d.encounters);
    v.ref(c.enemies, d.boss, `dungeon ${d.id}`);
    v.check(d.rooms >= 4 && d.rooms <= 8, `dungeon ${d.id}: 4-8 rooms`);
  }
  for (const t of c.towns.all()) {
    for (const god of t.temple) v.ref(c.pantheon, god, `town ${t.id}`);
    if (t.faction) v.check(c.factions.find(t.faction)?.hall === t.id, `town ${t.id}: faction hall mismatch`);
  }
  for (const f of c.factions.all()) {
    const where = `faction ${f.id}`;
    v.ref(c.towns, f.hall, where);
    v.ref(c.pantheon, f.god, where);
    for (const r of f.rivals) v.check(c.factions.find(r)?.rivals.includes(f.id) === true, `${where}: rival ${r} not mutual`);
    for (const r of f.ranks) checkModifiers(v, r.modifiers, where);
    for (const d of [...f.likes, ...f.dislikes]) if (d.tag) v.ref(c.skillTags, d.tag, where);
  }
  for (const w of c.weather.all()) checkModifiers(v, w.modifiers, `weather ${w.id}`);
  for (const r of c.houseRooms.all()) for (const lvl of r.modifiers ?? []) checkModifiers(v, lvl, `house room ${r.id}`);

  // ---- Economy ----
  for (const r of c.recipes.all()) {
    const where = `recipe ${r.id}`;
    v.ref(c.professions, r.profession, where);
    v.check(c.professions.find(r.profession)?.kind === 'crafting', `${where}: not a crafting profession`);
    for (const i of r.inputs) v.ref(c.items, i.itemId, where);
    if (r.output.kind === 'item') v.ref(c.items, r.output.itemId, where);
    v.check(r.starter === true || c.items.has(`recipe-${r.id}`), `${where}: no recipe scroll`);
  }
  for (const p of c.professions.all()) if (p.kind === 'crafting') v.check(c.recipes.filter((r) => r.profession === p.id && r.starter === true).length > 0, `profession ${p.id}: no starter recipes`);
  for (const s of c.shops.all()) {
    for (const rule of s.stock) if (rule.kind === 'items') for (const id of rule.ids) v.ref(c.items, id, `shop ${s.id}`);
  }

  // ---- Multiclassing ----
  for (const cls of c.classes.all()) {
    const trial = c.classTrials.find(cls.id);
    v.check(trial !== undefined, `class ${cls.id}: no class trial`);
    if (trial) v.ref(c.encounters, trial.encounter, `class trial ${cls.id}`);
  }
  for (const h of c.hybrids.all()) {
    const where = `hybrid ${h.id}`;
    for (const cls of h.classes) v.ref(c.classes, cls, where);
    v.check(h.classes.length >= 1 && h.classes.length <= 2 && new Set(h.classes).size === h.classes.length, `${where}: needs one or two different classes`);
    if (h.requires?.specialization) v.ref(c.specializations, h.requires.specialization, where);
    if (h.requires?.apostleOf) v.ref(c.gods, h.requires.apostleOf, where);
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

  // ---- Quests, dialogue, NPCs and companions ----
  validateStory(v, c);

  v.throwIfInvalid();
}

/** Every reference a condition makes. */
function checkCond(v: ContentValidator, c: Content, cond: Cond | undefined, where: string): void {
  if (!cond) return;
  switch (cond.kind) {
    case 'class':
      return v.ref(c.classes, cond.classId, where);
    case 'race':
      return v.ref(c.races, cond.raceId, where);
    case 'favor':
    case 'trialStage':
      return v.ref(c.gods, cond.god, where);
    case 'apostle':
      if (cond.god) v.ref(c.gods, cond.god, where);
      return;
    case 'rep':
      return v.ref(c.factions, cond.faction, where);
    case 'item':
      return v.ref(c.items, cond.itemId, where);
    case 'quest':
      return v.ref(c.quests, cond.quest, where);
    case 'companion':
      return v.ref(c.companions, cond.companion, where);
    case 'trialWon':
      return v.ref(c.encounters, cond.encounter, where);
    case 'hybridOpen':
      return v.ref(c.hybrids, cond.hybrid, where);
    case 'dungeonCleared':
      return v.ref(c.dungeons, cond.dungeon, where);
    case 'killed':
      return v.ref(c.enemies, cond.enemy, where);
    case 'ending':
      if (cond.ending) v.ref(c.endings, cond.ending, where);
      return;
    case 'rarity':
      return v.ref(c.rarities, cond.rarity, where);
    case 'challenge':
      return v.ref(c.challenges, cond.challenge, where);
    case 'all':
    case 'any':
      for (const x of cond.conds) checkCond(v, c, x, where);
      return;
    case 'not':
      return checkCond(v, c, cond.cond, where);
    default:
      return;
  }
}

function checkActions(v: ContentValidator, c: Content, actions: readonly ActionDef[] | undefined, where: string): void {
  for (const a of actions ?? []) {
    if (a.kind === 'startQuest' || a.kind === 'failQuest' || a.kind === 'turnIn') v.ref(c.quests, a.quest, where);
    if (a.kind === 'giveItem' || a.kind === 'takeItem') v.ref(c.items, a.itemId, where);
    if (a.kind === 'favor') v.ref(c.gods, a.god, where);
    if (a.kind === 'rep') v.ref(c.factions, a.faction, where);
    if (a.kind === 'approval' || a.kind === 'recruit' || a.kind === 'oath') v.ref(c.companions, a.companion, where);
    if (a.kind === 'fight') v.ref(c.encounters, a.encounter, where);
    if (a.kind === 'ending') v.ref(c.endings, a.ending, where);
    if (a.kind === 'completeObjective' || a.kind === 'deliver') v.ref(c.quests, a.quest, where);
    if (a.kind === 'politics') {
      v.ref(c.gods, a.a, where);
      v.ref(c.gods, a.b, where);
    }
  }
}

/** A marker's map must exist (whether its anchor is on the map is checked by the quest tests). */
function checkSpot(v: ContentValidator, c: Content, spot: Spot, where: string): void {
  v.check(c.zones.has(spot.map) || c.dungeons.has(spot.map), `${where}: unknown map "${spot.map}"`);
  if (typeof spot.near === 'object' && spot.near.ref) {
    const ref = spot.near.ref;
    if (spot.near.kind === 'shrine') v.ref(c.gods, ref, where);
    if (spot.near.kind === 'dungeon') v.check(c.dungeons.find(ref)?.zone === spot.map, `${where}: dungeon ${ref} is not on ${spot.map}`);
    if (spot.near.kind === 'town') v.check(c.towns.find(ref)?.zone === spot.map, `${where}: town ${ref} is not on ${spot.map}`);
    if (spot.near.kind === 'shrine') v.check(c.zones.find(spot.map)?.shrines.includes(ref) === true, `${where}: no shrine of ${ref} on ${spot.map}`);
  }
}

function checkObjective(v: ContentValidator, c: Content, o: ObjectiveDef, where: string): void {
  switch (o.kind) {
    case 'kill':
      if (o.enemyId) v.ref(c.enemies, o.enemyId, where);
      if (o.zone) v.ref(c.zones, o.zone, where);
      v.check(o.count > 0, `${where}: count must be positive`);
      return;
    case 'collect':
      return v.ref(c.items, o.itemId, where);
    case 'deliver':
      v.ref(c.items, o.itemId, where);
      v.ref(c.npcs, o.npc, where);
      v.check(c.npcs.find(o.npc)?.place !== 'field', `${where}: deliveries go to NPCs you can visit`);
      return;
    case 'talk':
      v.ref(c.npcs, o.npc, where);
      if (o.dialogue) v.ref(c.dialogues, o.dialogue, where);
      if (o.at) checkSpot(v, c, o.at, where);
      else v.check(c.npcs.find(o.npc)?.place !== 'field', `${where}: field NPCs need a marker`);
      return;
    case 'visit':
      return checkSpot(v, c, o.at, where);
    case 'fight':
      v.ref(c.encounters, o.encounter, where);
      if (o.at) checkSpot(v, c, o.at, where);
      return;
    case 'escort':
      v.ref(c.enemies, o.guest, where);
      return checkSpot(v, c, o.to, where);
    case 'clear':
      return v.ref(c.dungeons, o.dungeon, where);
    case 'runes':
      v.ref(c.dungeons, o.dungeon, where);
      v.check(c.dungeons.find(o.dungeon)?.puzzle === true, `${where}: ${o.dungeon} has no rune puzzle`);
      return;
    case 'sequence':
      for (const s of o.stones) checkSpot(v, c, s, where);
      v.check(o.order.every((i) => i >= 0 && i < o.stones.length), `${where}: sequence order out of range`);
      return;
    case 'deed':
      if (o.deed.tag) v.ref(c.skillTags, o.deed.tag, where);
      return;
    case 'state':
      return checkCond(v, c, o.cond, where);
  }
}

function checkDialogue(v: ContentValidator, c: Content, d: DialogueDef): void {
  const where = `dialogue ${d.id}`;
  v.check(d.nodes[d.start] !== undefined, `${where}: no start node ${d.start}`);
  for (const [id, n] of Object.entries(d.nodes)) {
    const w = `${where} node ${id}`;
    if (n.speaker && n.speaker !== 'hero' && n.speaker !== 'narrator') v.ref(c.npcs, n.speaker, w);
    if (n.next) v.check(d.nodes[n.next] !== undefined, `${w}: unknown next ${n.next}`);
    checkActions(v, c, n.actions, w);
    for (const ch of n.choices ?? []) {
      if (ch.next) v.check(d.nodes[ch.next] !== undefined, `${w}: choice "${ch.text}" goes to unknown node ${ch.next}`);
      checkCond(v, c, ch.cond, w);
      checkActions(v, c, ch.actions, w);
    }
  }
}

function validateStory(v: ContentValidator, c: Content): void {
  for (const q of c.quests.all()) {
    const where = `quest ${q.id}`;
    if (q.giver) v.ref(c.npcs, q.giver, where);
    if (q.board) v.ref(c.towns, q.board, where);
    if (q.zone) v.ref(c.zones, q.zone, where);
    v.check(q.stages.length > 0, `${where}: no stages`);
    v.check(q.auto === true || q.giver !== undefined || q.board !== undefined, `${where}: needs a giver, a board or auto`);
    checkCond(v, c, q.requires, where);
    const stages = new Set(q.stages.map((s) => s.id));
    v.check(stages.size === q.stages.length, `${where}: duplicate stage ids`);
    for (const st of q.stages) {
      const w = `${where} stage ${st.id}`;
      const ids = new Set(st.objectives.map((o) => o.id));
      v.check(ids.size === st.objectives.length, `${w}: duplicate objective ids`);
      for (const o of st.objectives) checkObjective(v, c, o, `${w} objective ${o.id}`);
      if (st.turnIn) v.ref(c.npcs, st.turnIn, w);
      if (typeof st.next === 'string' && st.next !== 'complete') v.check(stages.has(st.next), `${w}: unknown next stage ${st.next}`);
      if (Array.isArray(st.next)) for (const b of st.next) {
        v.check(stages.has(b.stage), `${w}: unknown branch stage ${b.stage}`);
        checkCond(v, c, b.cond, w);
      }
      checkActions(v, c, st.onStart, w);
      checkActions(v, c, st.onComplete, w);
    }
    for (const it of q.rewards.items ?? []) v.ref(c.items, it.itemId, where);
    for (const g of Object.keys(q.rewards.favor ?? {})) v.ref(c.gods, g, where);
    for (const f of Object.keys(q.rewards.rep ?? {})) v.ref(c.factions, f, where);
    if (q.rewards.gear) v.ref(c.rarities, q.rewards.gear.rarity, where);
  }
  for (const d of c.dialogues.all()) checkDialogue(v, c, d);
  for (const n of c.npcs.all()) {
    const where = `npc ${n.id}`;
    if (n.town) v.ref(c.towns, n.town, where);
    v.ref(c.races, n.race, where);
    v.check(n.place === 'field' || n.place === 'arena' || n.town !== undefined, `${where}: needs a town`);
    if (n.companion) v.ref(c.companions, n.companion, where);
    for (const t of n.topics ?? []) {
      v.ref(c.dialogues, t.dialogue, where);
      checkCond(v, c, t.cond, where);
    }
  }
  for (const comp of c.companions.all()) {
    const where = `companion ${comp.id}`;
    v.ref(c.races, comp.raceId, where);
    v.ref(c.classes, comp.classId, where);
    v.ref(c.birthSigns, comp.birthSignId, where);
    v.ref(c.gods, comp.god, where);
    v.ref(c.towns, comp.town, where);
    v.ref(c.quests, comp.recruitQuest, where);
    v.ref(c.quests, comp.personalQuest, where);
    v.ref(c.npcs, comp.id, where);
    v.check(c.specializations.find(comp.specialization)?.classId === comp.classId, `${where}: specialization ${comp.specialization} is not a ${comp.classId} specialization`);
    v.check(comp.bond.length === 4, `${where}: needs 4 bond tiers`);
    for (const node of [...comp.bond.flatMap((t) => t.options), comp.oath]) {
      checkModifiers(v, node.modifiers ?? [], `${where} bond ${node.id}`);
      checkTriggers(v, c, node.triggers, `${where} bond ${node.id}`);
      checkFlags(v, c, node.flags, `${where} bond ${node.id}`);
    }
    for (const d of [...comp.likes, ...comp.dislikes]) if (d.tag) v.ref(c.skillTags, d.tag, where);
  }
}
