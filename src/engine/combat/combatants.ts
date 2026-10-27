import { content, type Content } from '../../data';
import { ENEMY_GROWTH, ENEMY_LATE_GROWTH, TIER_SCALING } from '../../data/combat';
import { characterBaseStats, characterModifiers } from '../character/stats';
import type { Character } from '../character/types';
import { blessingFlags, blessingTriggers } from '../gods/blessings';
import { applyDivineCombat } from '../gods/combat';
import { equipmentFlags, equipmentTriggers, equippedGearLook, equippedWeaponTypes } from '../items/equipment';
import { generalCombatSkills, generalFlags } from '../skills/general';
import { classUltimate } from '../skills/specs';
import { hotbar, knownSkills, treeFlags, treeTriggers } from '../skills/tree';
import { baseOf, isBroken, uniqueOf } from '../items/lookup';
import { calculateStats, type StatInput } from '../stats/calculate';
import type { Modifier, ModifierSpec } from '../stats/modifiers';
import { emptyPrimaryStats, type Element, type StatId } from '../stats/types';
import type { Combatant, CombatStatsDef, EnemyDef, EnemyTier, Row, SummonDef } from './types';

const ZERO_BASELINE = new Map<number, ReturnType<typeof calculateStats>>();

/** Stats a zero-primary creature has at a level, so flat modifiers can hit exact targets. */
function baseline(level: number): ReturnType<typeof calculateStats> {
  let hit = ZERO_BASELINE.get(level);
  if (!hit) {
    hit = calculateStats({ level, base: emptyPrimaryStats(), modifiers: [] });
    ZERO_BASELINE.set(level, hit);
  }
  return hit;
}

export interface ScaledStats {
  hp: number;
  attack: number;
  magic: number;
  defense: number;
  magicResist: number;
  speed: number;
}

/**
 * Level-1 numbers grown to `level`: stat x (1 + growth x (level - 1) +
 * late growth x (level - 15)^1.6 past level 15), then tier multipliers.
 */
export function scaleCombatStats(def: CombatStatsDef, level: number, tier: EnemyTier = 'normal'): ScaledStats {
  const l = Math.max(0, level - 1);
  const late = Math.max(0, level - ENEMY_LATE_GROWTH.from) ** ENEMY_LATE_GROWTH.power;
  const t = TIER_SCALING[tier] ?? { hp: 1, damage: 1, xp: 1 };
  const grow = (k: 'hp' | 'attack' | 'magic' | 'defense' | 'magicResist'): number => 1 + ENEMY_GROWTH[k] * l + ENEMY_LATE_GROWTH[k] * late;
  return {
    hp: Math.round(def.hp * grow('hp') * t.hp),
    attack: Math.round(def.attack * grow('attack') * t.damage),
    magic: Math.round(def.magic * grow('magic') * t.damage),
    defense: Math.round(def.defense * grow('defense')),
    magicResist: Math.round(def.magicResist * grow('magicResist')),
    speed: Math.round(def.speed * (1 + ENEMY_GROWTH.speed * l)),
  };
}

/**
 * Builds a StatInput for a creature with fixed combat numbers. Primaries are
 * zero; flat modifiers land each derived stat exactly on its target, so
 * buffs and statuses still apply through the normal modifier pipeline.
 */
export function creatureStatInput(
  def: CombatStatsDef,
  level: number,
  tier: EnemyTier,
  resists: Partial<Record<Element, number>> = {},
  extra: readonly ModifierSpec[] = [],
  bonus: { attack?: number; magic?: number } = {},
): StatInput {
  const s = scaleCombatStats(def, level, tier);
  const b = baseline(level);
  const source = 'creature';
  const flat = (stat: StatId, target: number): Modifier => ({ stat, type: 'flat', value: target - b[stat], source });
  const mods: Modifier[] = [
    flat('maxHp', s.hp),
    flat('maxMp', 50 + level * 5),
    flat('physicalAttack', s.attack + (bonus.attack ?? 0)),
    flat('magicAttack', s.magic + (bonus.magic ?? 0)),
    flat('divinePower', s.magic + (bonus.magic ?? 0)),
    flat('defense', s.defense),
    flat('magicResist', s.magicResist),
    flat('speed', s.speed),
  ];
  if (def.accuracy !== undefined) mods.push(flat('accuracy', def.accuracy));
  if (def.critChance !== undefined) mods.push(flat('critChance', def.critChance));
  if (def.dodge !== undefined) mods.push(flat('dodge', def.dodge));
  for (const [el, v] of Object.entries(resists)) mods.push({ stat: `${el as Element}Resist`, type: 'flat', value: v ?? 0, source });
  for (const m of extra) mods.push({ ...m, source });
  return { level, base: emptyPrimaryStats(), modifiers: mods };
}

function emptyCombatant(id: string, name: string, side: Combatant['side'], row: Row, level: number, statInput: StatInput): Combatant {
  const stats = calculateStats(statInput, { inCombat: true });
  return {
    id,
    name,
    side,
    row,
    kind: 'enemy',
    level,
    statInput,
    hp: stats.maxHp,
    mp: stats.maxMp,
    maxHp: stats.maxHp,
    maxMp: stats.maxMp,
    shield: 0,
    resources: {},
    statuses: [],
    buffs: [],
    skills: [],
    cooldowns: {},
    ultimate: 0,
    alive: true,
    flags: [],
    triggers: [],
    types: [],
    tier: 'party',
    ai: 'aggressive',
    nextAt: 0,
    defending: false,
    songs: [],
    basicAttack: { element: 'physical', ranged: false, magic: false, name: 'Attack' },
    xp: 0,
    corpse: false,
    reviveUsed: false,
    lowHpFired: false,
    turnsTaken: 0,
    weaponTypes: [],
    abilities: [],
  };
}

/** Enemy skill rank rises every 10 levels, up to the skill's max. */
export function enemySkillRank(level: number, maxRank: number): number {
  return Math.min(maxRank, 1 + Math.floor(level / 10));
}

export function createEnemy(def: EnemyDef, id: string, level = def.level, row: Row = def.row, c: Content = content): Combatant {
  const input = creatureStatInput(def.stats, level, def.tier, def.resists, def.modifiers);
  const x = emptyCombatant(id, def.name, 'enemy', row, level, input);
  const t = TIER_SCALING[def.tier] ?? { xp: 1 };
  x.kind = 'enemy';
  x.enemyId = def.id;
  x.types = [...def.types];
  x.tier = def.tier;
  x.ai = def.ai;
  x.flags = [...(def.flags ?? [])];
  x.triggers = (def.triggers ?? []).map((effect) => ({ effect, source: `enemy:${def.id}` }));
  x.skills = def.skills.map((s) => ({ id: s.id, rank: enemySkillRank(level, c.skills.get(s.id).maxRank) }));
  x.basicAttack = { ...def.basicAttack, magic: def.basicAttack.magic ?? false };
  x.xp = Math.round(def.xp * t.xp);
  x.lootTable = def.lootTable;
  x.sprite = { family: def.family, main: def.palette.main, accent: def.palette.accent };
  return x;
}

/** A summon scales with its owner's level and borrows part of the owner's attack and magic. */
export function createSummon(def: SummonDef, id: string, owner: Combatant, ownerAttack: number, ownerMagic: number, c: Content = content): Combatant {
  // A summon's main damage stat borrows the owner's stronger one, so a caster's skeleton is not weak for lack of Strength.
  const borrowed = Math.max(ownerAttack, ownerMagic);
  const physical = def.stats.attack >= def.stats.magic;
  const input = creatureStatInput(def.stats, owner.level, 'normal', {}, [], {
    attack: Math.round((physical ? borrowed : ownerAttack) * def.ownerPowerShare),
    magic: Math.round((physical ? ownerMagic : borrowed) * def.ownerPowerShare),
  });
  const x = emptyCombatant(id, def.name, owner.side, 'front', owner.level, input);
  x.kind = 'summon';
  x.summonId = def.id;
  x.ownerId = owner.id;
  x.types = [...def.types];
  x.ai = def.ai;
  x.skills = def.skills.map((s) => ({ id: s.id, rank: enemySkillRank(owner.level, c.skills.get(s.id).maxRank) }));
  x.basicAttack = { ...def.basicAttack, magic: def.basicAttack.magic ?? false };
  if (def.duration !== undefined) x.expiresIn = def.duration;
  x.sprite = { family: def.family, main: def.palette.main, accent: def.palette.accent };
  return x;
}

/** How a hero attacks with no skill: depends on the weapon in the main hand. */
function heroBasicAttack(char: Character, c: Content): Combatant['basicAttack'] {
  const main = char.equipment.mainHand;
  const base = main && !isBroken(main) ? baseOf(main, c) : undefined;
  if (!base || base.category !== 'weapon') return { element: 'physical', ranged: false, magic: false, name: 'Punch' };
  const type = c.weaponTypes.get(base.weaponType);
  if (type.category === 'magic') return { element: 'arcane', ranged: true, magic: true, name: `${type.name} Bolt` };
  if (type.category === 'ranged') return { element: 'physical', ranged: true, magic: false, name: 'Shoot' };
  return { element: 'physical', ranged: false, magic: false, name: 'Attack' };
}

/** Snapshot of the player's character as a combatant. HP and MP carry over in and out of battle. */
export function createHero(char: Character, id = 'hero', c: Content = content): Combatant {
  const input: StatInput = { level: char.level, base: characterBaseStats(char, c), modifiers: characterModifiers(char, c) };
  const primary = char.classes.find((p) => p.slot === 'primary') ?? char.classes[0];
  const cls = primary ? c.classes.get(primary.classId) : undefined;
  const x = emptyCombatant(id, char.name, 'party', cls?.defaultRow ?? 'front', char.level, input);
  x.kind = 'hero';
  x.hp = Math.min(char.hp, x.maxHp);
  x.mp = Math.min(char.mp, x.maxMp);
  x.classId = cls?.id;
  x.ai = cls?.id === 'cleric' ? 'healer' : 'aggressive';
  x.flags = [...new Set([...equipmentFlags(char, c), ...treeFlags(char, c), ...generalFlags(char, c), ...blessingFlags(char, c)])];
  x.triggers = [...equipmentTriggers(char, c), ...treeTriggers(char, c), ...blessingTriggers(char, c)];
  x.weaponTypes = equippedWeaponTypes(char, c);
  x.skills = knownSkills(char, c).map((k) => ({
    id: k.id,
    rank: k.rank,
    mastery: char.mastery[k.id] ?? 0,
    ...(k.patch ? { patch: k.patch } : {}),
  }));
  // Slotted general skills (and Grimoires) add battle skills outside the hotbar.
  for (const g of generalCombatSkills(char, c)) {
    if (x.skills.some((s) => s.id === g.skillId)) continue;
    x.skills.push({ id: g.skillId, rank: g.rank, general: g.generalId, ...(g.patch ? { patch: g.patch } : {}) });
  }
  x.hotbar = hotbar(char).filter((h): h is string => h !== null);
  x.ultimateSkill = cls ? classUltimate(char, cls.id, c) : undefined;
  x.basicAttack = heroBasicAttack(char, c);
  applyDivineCombat(x, char, input.base.fai, c);
  x.portrait = { raceId: char.raceId, variant: char.portrait, color: cls?.color ?? '#888888', look: equippedGearLook(char, c) };
  // Every class resource a character has (multiclass characters can have two).
  for (const p of char.classes) {
    const res = c.classes.get(p.classId).resource;
    if (!res) continue;
    x.resources[res] = c.resources.get(res).start;
    x.resourceId ??= res;
  }
  const trinket = char.equipment.trinket;
  const trinketBase = trinket && trinket.identified ? baseOf(trinket, c) : undefined;
  const trinketUse = trinket ? (uniqueOf(trinket, c)?.activeAbility ?? (trinketBase?.category === 'accessory' ? trinketBase.onUse : undefined)) : undefined;
  if (trinketUse) x.abilities.push({ slot: 'trinket', ...trinketUse });
  const relic = char.equipment.relic;
  const relicUse = relic && relic.identified ? uniqueOf(relic, c)?.activeAbility : undefined;
  if (relicUse) x.abilities.push({ slot: 'relic', ...relicUse });
  return x;
}
