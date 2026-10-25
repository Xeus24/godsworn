import { content, type Content } from '../../data';
import { BESTIARY, CREATURE_TYPE_NAMES, KNOWLEDGE_NAMES } from '../../data/bestiary/bestiary';
import type { Character } from '../character/types';
import type { EnemyDef } from '../combat/types';
import type { Modifier } from '../stats/modifiers';

const BOSSLIKE = new Set(['miniboss', 'boss', 'worldBoss', 'punisher']);

/** Kills needed for each part of this enemy's entry. */
export function knowledgeThresholds(def: EnemyDef): number[] {
  return BOSSLIKE.has(def.tier) ? BESTIARY.bossKnowledge : BESTIARY.knowledge;
}

/**
 * How much you know about an enemy: -1 never met, 0 sighted (name and
 * description), 1 stats, 2 resistances, 3 skills, 4 mastered.
 */
export function knowledgeLevel(char: Character, def: EnemyDef): number {
  const kills = char.bestiary[def.id];
  if (kills === undefined) return -1;
  return knowledgeThresholds(def).filter((t) => kills >= t).length;
}

export const knowledgeName = (level: number): string => KNOWLEDGE_NAMES[Math.max(0, level)] ?? '';

/** Creature types that earn Slayer ranks. */
export function slayerTypes(c: Content = content): string[] {
  const types = new Set<string>();
  for (const e of c.enemies.all()) for (const t of e.types) if (!BESTIARY.noSlayer.includes(t)) types.add(t);
  return [...types].sort();
}

export const typeName = (type: string): string => CREATURE_TYPE_NAMES[type] ?? `${type[0]?.toUpperCase() ?? ''}${type.slice(1)}s`;

/** Kills per creature type. */
export function killsByType(char: Character, c: Content = content): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, kills] of Object.entries(char.bestiary)) {
    if (kills <= 0) continue;
    const def = c.enemies.find(id);
    for (const t of def?.types ?? []) out[t] = (out[t] ?? 0) + kills;
  }
  return out;
}

export function slayerRank(kills: number): number {
  return BESTIARY.slayerRanks.filter((t) => kills >= t).length;
}

/** Damage bonuses against each creature type you have Slayer ranks in. */
export function slayerModifiers(char: Character, c: Content = content): Modifier[] {
  const mods: Modifier[] = [];
  for (const [type, kills] of Object.entries(killsByType(char, c))) {
    if (BESTIARY.noSlayer.includes(type)) continue;
    const rank = slayerRank(kills);
    if (rank > 0) mods.push({ stat: 'damageBonus', type: 'flat', value: rank * BESTIARY.slayerDamagePerRank, condition: { kind: 'targetType', enemyType: type }, source: `slayer:${type}` });
  }
  return mods;
}

/**
 * Writes a battle into the bestiary: every enemy seen, every kill counted.
 * Returns what was learned (new knowledge past a first sighting, Slayer ranks), for toasts.
 */
export function recordBattle(char: Character, seen: readonly string[], killed: readonly string[], c: Content = content): string[] {
  const news: string[] = [];
  const before = killsByType(char, c);
  const knowBefore = new Map<string, number>();
  for (const id of new Set([...seen, ...killed])) {
    const def = c.enemies.find(id);
    if (!def) continue;
    knowBefore.set(id, knowledgeLevel(char, def));
    if (char.bestiary[id] === undefined) char.bestiary[id] = 0;
  }
  for (const id of killed) if (char.bestiary[id] !== undefined) char.bestiary[id]++;
  for (const [id, was] of knowBefore) {
    const def = c.enemies.get(id);
    const now = knowledgeLevel(char, def);
    if (was >= 0 && now > was) news.push(`Bestiary: ${def.name} — ${knowledgeName(now)}${now >= 4 ? '!' : ' learned.'}`);
  }
  const after = killsByType(char, c);
  for (const [type, kills] of Object.entries(after)) {
    if (BESTIARY.noSlayer.includes(type)) continue;
    const rank = slayerRank(kills);
    if (rank > slayerRank(before[type] ?? 0)) news.push(`Slayer of ${typeName(type)}, rank ${rank}: +${rank * BESTIARY.slayerDamagePerRank}% damage to them.`);
  }
  return news;
}
