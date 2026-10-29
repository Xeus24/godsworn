import { content, type Content } from '../../data';
import { hasRule } from '../character/challenges';
import { remixFor, worldAffixModifiers } from '../ngplus/remix';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { chooseAction } from './ai';
import { Battle, type BattleHooks } from './battle';
import { createEnemy, createHero } from './combatants';
import { advance, perform, startBattle } from './turns';
import { calculateStats } from '../stats/calculate';
import type { BattleEvent, Combatant, EncounterDef } from './types';
import type { CompanionExtras } from '../party/party';
import { withSource, type ModifierSpec } from '../stats/modifiers';
import { PARTY_SCALING } from '../../data/combat';
import { affixCount, applyAffixes, rollAffixes } from './affixes';
import { ngThreat, worldLevel } from '../ngplus/ngplus';
import { challengeEnemyModifiers } from '../character/challenges';
import { getDifficulty } from '../../data/difficulty';
import { applyEnemyDifficulty, applyHeroDifficulty } from './difficulty';

/**
 * A companion as a combatant: their character plus bond perks and class
 * tuning, controlled by the player. Those can raise max HP and MP, so the
 * character's HP and MP carry in as a share of their maximum.
 */
export function createCompanionCombatant(char: Character, extras: CompanionExtras, c: Content = content): Combatant {
  const x = createHero(char, `companion:${char.id}`, c);
  const hpShare = x.hp / Math.max(1, x.maxHp);
  const mpShare = x.mp / Math.max(1, x.maxMp);
  x.kind = 'companion';
  const classId = char.classes[0]?.classId ?? '';
  const power = PARTY_SCALING.companionPower[classId] ?? PARTY_SCALING.companionPowerDefault;
  const weaker = withSource([{ stat: 'physicalAttack', type: 'more', value: power }, { stat: 'magicAttack', type: 'more', value: power }, { stat: 'divinePower', type: 'more', value: power }, ...(PARTY_SCALING.companionStats[classId] ?? [])], 'companion');
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...extras.modifiers, ...weaker] };
  x.triggers = [...x.triggers, ...extras.triggers];
  x.flags = [...new Set([...x.flags, ...extras.flags])];
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.maxMp = stats.maxMp;
  x.hp = Math.max(1, Math.round(hpShare * x.maxHp));
  x.mp = Math.round(mpShare * x.maxMp);
  return x;
}

/** An escorted NPC: fights on the party's side under AI control, at the hero's level. */
function createGuest(id: string, enemyId: string, level: number, c: Content): Combatant {
  const def = c.enemies.get(enemyId);
  const x = createEnemy(def, id, level, def.row, c);
  x.side = 'party';
  x.kind = 'summon';
  x.xp = 0;
  delete x.lootTable;
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...withSource([{ stat: 'maxHp', type: 'more', value: 50 }], 'escort')] };
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.hp = stats.maxHp;
  return x;
}

export interface EncounterOptions {
  rng: Rng;
  hooks?: BattleHooks;
  timeOfDay?: 'day' | 'night';
  /** Overrides every enemy's level (e.g. scaling an encounter to the player). */
  level?: number;
  /** A hated god's punisher joins the fight (god id). */
  punisher?: string;
  weather?: string;
  /** Phase 11: room features, gold for bribes and how the fight began. */
  features?: import('./types').FeatureKind[];
  purse?: number;
  opening?: 'ambush' | 'preemptive';
  /** A naval battle's opening broadside: share of each enemy's max HP. */
  volley?: number;
  /** Companions fighting beside the hero, with their bond perks. */
  companions?: { char: Character; extras: CompanionExtras }[];
  /** Extra modifiers on every enemy and on every party member (Rift affixes, challenge modes). */
  enemyModifiers?: ModifierSpec[];
  partyModifiers?: ModifierSpec[];
  /** New Game+ tier: enemy levels follow the world's NG+ levels, and later tiers add threat. */
  ngPlus?: number;
  /** The playthrough's world affixes (ids, see data/ngAffixes.ts). */
  ngAffixes?: readonly string[];
  /** NPCs being escorted or fighting beside you: AI-controlled allies built from enemy definitions. `ally` ones (apostle followers) count as part of a companion for party scaling. */
  guests?: { id: string; enemyId: string; ally?: boolean }[];
  c?: Content;
}

/** Adds modifiers to a combatant's base stats and refreshes its maximums (HP stays at the same share). */
function addModifiers(x: Combatant, mods: readonly ModifierSpec[], source: string): void {
  const share = x.hp / Math.max(1, x.maxHp);
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...mods.map((m) => ({ ...m, source }))] };
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.maxMp = stats.maxMp;
  x.hp = Math.max(1, Math.round(share * x.maxHp));
  x.mp = Math.min(x.mp, x.maxMp);
}

/** Zone threat (and party size): more HP and damage, through the normal modifier pipeline. */
function applyThreat(x: Combatant, threat: number, damage = threat, source = 'threat'): void {
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, { stat: 'maxHp', type: 'more', value: threat, source }, { stat: 'damageBonus', type: 'flat', value: damage, source }] };
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.hp = stats.maxHp;
  if (source === 'party') x.healScale = (x.healScale ?? 1) * (1 + threat / 100);
}

/** Builds a battle between the hero (with companions and escorted NPCs) and an encounter's enemies; enemies scale with the party's size. */
export function createEncounterBattle(hero: Character, encounter: EncounterDef, opts: EncounterOptions): Battle {
  const c = opts.c ?? content;
  const party = [createHero(hero, 'hero', c), ...(opts.companions ?? []).map((m) => createCompanionCombatant(m.char, m.extras, c))];
  for (const member of party) applyHeroDifficulty(member, hero.difficulty);
  const difficulty = getDifficulty(hero.difficulty);
  for (const g of opts.guests ?? []) party.push(createGuest(g.id, g.enemyId, hero.level, c));
  const ng = opts.ngPlus ?? 0;
  const hardMode = challengeEnemyModifiers(hero, c);
  const worldMods = worldAffixModifiers(opts.ngAffixes ?? []);
  // Champion packs share one roll of affixes; each elite rolls its own.
  let packAffixes: string[] | undefined;
  const enemies = encounter.enemies.map((e, i) => {
    const base = c.enemies.get(e.enemyId);
    // Encounter entries may promote an enemy (roaming elites, champion packs).
    const def = e.tier ? { ...base, tier: e.tier } : base;
    const enemy = createEnemy(def, `enemy-${i + 1}`, worldLevel(opts.level ?? e.level ?? encounter.level, ng) + difficulty.enemy.levelBonus, e.row ?? def.row, c);
    if (encounter.threat) applyThreat(enemy, encounter.threat);
    if (ngThreat(ng) > 0) applyThreat(enemy, ngThreat(ng), ngThreat(ng), 'ngPlus');
    if (worldMods.enemy.length) addModifiers(enemy, worldMods.enemy, 'ngPlus');
    if (ng >= 2 && (def.tier === 'boss' || def.tier === 'worldBoss')) applyAffixes(enemy, remixFor(def.id, ng), c);
    const mates = (opts.companions?.length ?? 0) + (opts.guests ?? []).filter((g) => g.ally).length * PARTY_SCALING.followerShare;
    const n = affixCount(def.tier);
    if (n > 0) {
      const ids = def.tier === 'champion' ? (packAffixes ??= rollAffixes(opts.rng, def.types, n, c)) : rollAffixes(opts.rng, def.types, n, c);
      applyAffixes(enemy, ids, c);
    }
    if (mates > 0) applyThreat(enemy, PARTY_SCALING.enemyHpPerCompanion * mates, PARTY_SCALING.enemyDamagePerCompanion * mates, 'party');
    if (opts.enemyModifiers?.length) addModifiers(enemy, opts.enemyModifiers, 'rift');
    if (hardMode.length) addModifiers(enemy, hardMode, 'challenge');
    applyEnemyDifficulty(enemy, hero.difficulty);
    return enemy;
  });
  if (opts.partyModifiers?.length) for (const x of party) addModifiers(x, opts.partyModifiers, 'rift');
  if (worldMods.party.length) for (const x of party) addModifiers(x, worldMods.party, 'ngPlus');
  if (opts.punisher) {
    const def = c.enemies.get(`punisher-${opts.punisher}`);
    const punisher = createEnemy(def, 'punisher', worldLevel(opts.level ?? encounter.level, ng) + 2 + difficulty.enemy.levelBonus, def.row, c);
    if (ngThreat(ng) > 0) applyThreat(punisher, ngThreat(ng), ngThreat(ng), 'ngPlus');
    const mates = (opts.companions?.length ?? 0) + (opts.guests ?? []).filter((g) => g.ally).length * PARTY_SCALING.followerShare;
    if (mates > 0) applyThreat(punisher, PARTY_SCALING.enemyHpPerCompanion * mates, PARTY_SCALING.enemyDamagePerCompanion * mates, 'party');
    applyEnemyDifficulty(punisher, hero.difficulty);
    enemies.push(punisher);
  }
  // Number duplicate names: "Green Slime A", "Green Slime B".
  const counts = new Map<string, number>();
  for (const e of enemies) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const e of enemies) {
    if ((counts.get(e.name) ?? 0) < 2) continue;
    const n = seen.get(e.name) ?? 0;
    seen.set(e.name, n + 1);
    e.name = `${e.name} ${String.fromCharCode(65 + n)}`;
  }
  const battle = new Battle({
    party,
    enemies,
    rng: opts.rng,
    encounterId: encounter.id,
    canFlee: encounter.canFlee,
    isBoss: encounter.isBoss,
    timeOfDay: opts.timeOfDay,
    ...(opts.weather ? { weather: opts.weather } : {}),
    ...(opts.features ? { features: opts.features } : {}),
    ...(opts.purse !== undefined ? { purse: opts.purse } : {}),
    ...(opts.opening ? { opening: opts.opening } : {}),
    ...(opts.volley ? { volley: opts.volley } : {}),
    hooks: opts.hooks,
    aiSharpness: difficulty.enemy.aiSharpness,
    c,
  });
  battle.pacifist = hasRule(hero, 'pacifist', c);
  return battle;
}

/** Plays a whole battle with AI on both sides (simulations, tests, auto-battle). */
export function runAutoBattle(b: Battle): BattleEvent[] {
  const events = [...startBattle(b)];
  while (b.outcome === 'ongoing') {
    events.push(...advance(b));
    const x = b.current;
    if (!x) break;
    const result = perform(b, chooseAction(b, x));
    if (result.ok) events.push(...result.events);
    else {
      // An AI choice that turned out invalid: fall back to defending.
      const fallback = perform(b, { kind: 'defend', actorId: x.id });
      if (fallback.ok) events.push(...fallback.events);
    }
  }
  return events;
}
