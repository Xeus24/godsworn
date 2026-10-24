import { content, type Content } from '../../data';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { chooseAction } from './ai';
import { Battle, type BattleHooks } from './battle';
import { createEnemy, createHero } from './combatants';
import { advance, perform, startBattle } from './turns';
import { calculateStats } from '../stats/calculate';
import type { BattleEvent, Combatant, EncounterDef } from './types';
import type { CompanionExtras } from '../party/party';
import { withSource } from '../stats/modifiers';
import { PARTY_SCALING } from '../../data/combat';

/** A companion as a combatant: their character plus bond perks, controlled by the player. */
export function createCompanionCombatant(char: Character, extras: CompanionExtras, c: Content = content): Combatant {
  const x = createHero(char, `companion:${char.id}`, c);
  x.kind = 'companion';
  const power = PARTY_SCALING.companionPower;
  const weaker = withSource([{ stat: 'physicalAttack', type: 'more', value: power }, { stat: 'magicAttack', type: 'more', value: power }, { stat: 'divinePower', type: 'more', value: power }], 'companion');
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, ...extras.modifiers, ...weaker] };
  x.triggers = [...x.triggers, ...extras.triggers];
  x.flags = [...new Set([...x.flags, ...extras.flags])];
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.maxMp = stats.maxMp;
  x.hp = Math.max(1, Math.min(char.hp, x.maxHp));
  x.mp = Math.min(char.mp, x.maxMp);
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
  /** Companions fighting beside the hero, with their bond perks. */
  companions?: { char: Character; extras: CompanionExtras }[];
  /** NPCs being escorted: AI-controlled allies built from enemy definitions. */
  guests?: { id: string; enemyId: string }[];
  c?: Content;
}

/** Zone threat (and party size): more HP and damage, through the normal modifier pipeline. */
function applyThreat(x: Combatant, threat: number, damage = threat, source = 'threat'): void {
  x.statInput = { ...x.statInput, modifiers: [...x.statInput.modifiers, { stat: 'maxHp', type: 'more', value: threat, source }, { stat: 'damageBonus', type: 'flat', value: damage, source }] };
  const stats = calculateStats(x.statInput);
  x.maxHp = stats.maxHp;
  x.hp = stats.maxHp;
}

/** Builds a battle between the hero (with companions and escorted NPCs) and an encounter's enemies; enemies scale with the party's size. */
export function createEncounterBattle(hero: Character, encounter: EncounterDef, opts: EncounterOptions): Battle {
  const c = opts.c ?? content;
  const party = [createHero(hero, 'hero', c), ...(opts.companions ?? []).map((m) => createCompanionCombatant(m.char, m.extras, c))];
  for (const g of opts.guests ?? []) party.push(createGuest(g.id, g.enemyId, hero.level, c));
  const enemies = encounter.enemies.map((e, i) => {
    const base = c.enemies.get(e.enemyId);
    // Encounter entries may promote an enemy (roaming elites, champion packs).
    const def = e.tier ? { ...base, tier: e.tier } : base;
    const enemy = createEnemy(def, `enemy-${i + 1}`, opts.level ?? e.level ?? encounter.level, e.row ?? def.row, c);
    if (encounter.threat) applyThreat(enemy, encounter.threat);
    const mates = opts.companions?.length ?? 0;
    if (mates > 0) applyThreat(enemy, PARTY_SCALING.enemyHpPerCompanion * mates, PARTY_SCALING.enemyDamagePerCompanion * mates, 'party');
    return enemy;
  });
  if (opts.punisher) {
    const def = c.enemies.get(`punisher-${opts.punisher}`);
    const punisher = createEnemy(def, 'punisher', (opts.level ?? encounter.level) + 2, def.row, c);
    const mates = opts.companions?.length ?? 0;
    if (mates > 0) applyThreat(punisher, PARTY_SCALING.enemyHpPerCompanion * mates, PARTY_SCALING.enemyDamagePerCompanion * mates, 'party');
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
  return new Battle({
    party,
    enemies,
    rng: opts.rng,
    encounterId: encounter.id,
    canFlee: encounter.canFlee,
    isBoss: encounter.isBoss,
    timeOfDay: opts.timeOfDay,
    ...(opts.weather ? { weather: opts.weather } : {}),
    hooks: opts.hooks,
    c,
  });
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
