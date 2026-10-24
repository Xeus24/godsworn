import type { EnemyDef, EncounterDef } from '../../engine/combat/types';
import type { EntityKind } from '../../engine/world/types';
import type { ActionDef, ChoiceDef, Cond, DialogueDef, DialogueNode, ObjectiveDef, Spot, StageDef } from '../../engine/quests/types';

/**
 * Shorthands for writing quests, dialogue and story enemies compactly.
 * Everything here returns plain data.
 */

// ---------------------------------------------------------------- places

/** A marker a few steps from an entity on a map. */
export const near = (map: string, kind: EntityKind, ref: string | undefined, label: string, extra: Partial<Spot> = {}): Spot => ({
  map,
  near: ref === undefined ? { kind } : { kind, ref },
  label,
  ...extra,
});

/** A marker near a map's arrival point or center. */
export const at = (map: string, where: 'west' | 'east' | 'entrance' | 'center', label: string, extra: Partial<Spot> = {}): Spot => ({ map, near: where, label, ...extra });

// ---------------------------------------------------------------- objectives

type Obj<K extends ObjectiveDef['kind']> = Omit<Extract<ObjectiveDef, { kind: K }>, 'id' | 'text' | 'kind'>;

export const kill = (id: string, text: string, count: number, f: Omit<Obj<'kill'>, 'count'> = {}): ObjectiveDef => ({ id, text, kind: 'kill', count, ...f });
export const collect = (id: string, text: string, itemId: string, count: number, keep = false): ObjectiveDef => ({ id, text, kind: 'collect', itemId, count, ...(keep ? { keep } : {}) });
export const deliver = (id: string, text: string, itemId: string, count: number, npc: string): ObjectiveDef => ({ id, text, kind: 'deliver', itemId, count, npc });
export const talk = (id: string, text: string, npc: string, dialogue?: string, where?: Spot): ObjectiveDef => ({ id, text, kind: 'talk', npc, ...(dialogue ? { dialogue } : {}), ...(where ? { at: where } : {}) });
export const visit = (id: string, text: string, where: Spot): ObjectiveDef => ({ id, text, kind: 'visit', at: where });
export const fight = (id: string, text: string, encounter: string, where?: Spot, waves?: number): ObjectiveDef => ({ id, text, kind: 'fight', encounter, ...(where ? { at: where } : {}), ...(waves ? { waves } : {}) });
export const escort = (id: string, text: string, npc: string, guest: string, to: Spot): ObjectiveDef => ({ id, text, kind: 'escort', npc, guest, to });
export const clear = (id: string, text: string, dungeon: string): ObjectiveDef => ({ id, text, kind: 'clear', dungeon });
export const runes = (id: string, text: string, dungeon: string): ObjectiveDef => ({ id, text, kind: 'runes', dungeon });
export const sequence = (id: string, text: string, stones: Spot[], order: number[]): ObjectiveDef => ({ id, text, kind: 'sequence', stones, order });
export const deed = (id: string, text: string, count: number, d: Extract<ObjectiveDef, { kind: 'deed' }>['deed']): ObjectiveDef => ({ id, text, kind: 'deed', count, deed: d });
export const state = (id: string, text: string, cond: Cond): ObjectiveDef => ({ id, text, kind: 'state', cond });

export const stage = (id: string, text: string, objectives: ObjectiveDef[], extra: Partial<StageDef> = {}): StageDef => ({ id, text, objectives, ...extra });

// ---------------------------------------------------------------- conditions

export const flag = (f: string, value?: boolean | number | string): Cond => (value === undefined ? { kind: 'flag', flag: f } : { kind: 'flag', flag: f, value });
export const not = (cond: Cond): Cond => ({ kind: 'not', cond });
export const all = (...conds: Cond[]): Cond => ({ kind: 'all', conds });
export const any = (...conds: Cond[]): Cond => ({ kind: 'any', conds });
export const questDone = (quest: string): Cond => ({ kind: 'quest', quest, state: 'complete' });
export const questActive = (quest: string, stageId?: string): Cond => ({ kind: 'quest', quest, state: 'active', ...(stageId ? { stage: stageId } : {}) });
export const level = (min: number): Cond => ({ kind: 'level', min });
export const stat = (s: Extract<Cond, { kind: 'stat' }>['stat'], min: number): Cond => ({ kind: 'stat', stat: s, min });

// ---------------------------------------------------------------- actions

export const setFlag = (f: string, value: boolean | number | string = true): ActionDef => ({ kind: 'setFlag', flag: f, value });
export const approve = (companion: string, amount: number): ActionDef => ({ kind: 'approval', companion, amount });
export const favor = (god: string, amount: number): ActionDef => ({ kind: 'favor', god, amount });
export const rep = (faction: string, amount: number): ActionDef => ({ kind: 'rep', faction, amount });
export const give = (itemId: string, qty = 1): ActionDef => ({ kind: 'giveItem', itemId, qty });
export const take = (itemId: string, qty = 1): ActionDef => ({ kind: 'takeItem', itemId, qty });
export const gold = (amount: number): ActionDef => ({ kind: 'gold', amount });
export const startFight = (encounter: string): ActionDef => ({ kind: 'fight', encounter });
export const mercy = (): ActionDef[] => [{ kind: 'deed', event: 'mercy' }, { kind: 'addCounter', flag: 'mercy' }];

// ---------------------------------------------------------------- dialogue

export const choice = (text: string, next?: string, actions?: ActionDef[], extra: Partial<ChoiceDef> = {}): ChoiceDef => ({ text, ...(next ? { next } : {}), ...(actions ? { actions } : {}), ...extra });
/** A choice that needs a condition. */
export const check = (cond: Cond, text: string, next?: string, actions?: ActionDef[], extra: Partial<ChoiceDef> = {}): ChoiceDef => ({ text, cond, ...(next ? { next } : {}), ...(actions ? { actions } : {}), ...extra });
export const leave = (text = 'Not yet.'): ChoiceDef => ({ text, leave: true });

export const node = (text: string, extra: Partial<DialogueNode> = {}): DialogueNode => ({ text, ...extra });
export const say = (speaker: string, text: string, extra: Partial<DialogueNode> = {}): DialogueNode => ({ speaker, text, ...extra });

export const dialogue = (id: string, nodes: Record<string, DialogueNode>, start = 'start'): DialogueDef => ({ id, start, nodes });

/** A straight run of lines, the last one ending the thread (with optional actions on it). */
export function lines(id: string, parts: (DialogueNode | string)[], endActions: ActionDef[] = []): DialogueDef {
  const nodes: Record<string, DialogueNode> = {};
  parts.forEach((p, i) => {
    const n: DialogueNode = typeof p === 'string' ? { text: p } : { ...p };
    if (i < parts.length - 1) n.next = `n${i + 1}`;
    else if (endActions.length) n.actions = [...(n.actions ?? []), ...endActions];
    nodes[`n${i}`] = n;
  });
  return { id, start: 'n0', nodes };
}

// ---------------------------------------------------------------- enemies and fights

type Foe = Omit<EnemyDef, 'tier' | 'row' | 'ai' | 'lootTable' | 'xp'> & Partial<Pick<EnemyDef, 'tier' | 'row' | 'ai' | 'lootTable' | 'xp'>>;

/** A story enemy: front row and aggressive unless said otherwise; XP and loot follow the tier. */
export function foe(e: Foe): EnemyDef {
  const tier = e.tier ?? 'normal';
  const boss = tier === 'boss' || tier === 'worldBoss' || tier === 'miniboss';
  return { row: 'front', ai: 'aggressive', lootTable: boss ? 'boss' : tier === 'normal' ? 'normal-enemy' : 'elite-enemy', xp: 20 + e.level * 2, ...e, tier };
}

/** A quest encounter: enemy ids, '^' for the back row. Boss encounters cannot be fled. */
export function encounter(id: string, name: string, levelN: number, enemies: string[], boss = false): EncounterDef {
  return {
    id,
    name,
    description: name,
    level: levelN,
    enemies: enemies.map((raw) => (raw.startsWith('^') ? { enemyId: raw.slice(1), row: 'back' as const } : { enemyId: raw })),
    canFlee: !boss,
    ...(boss ? { isBoss: true } : {}),
  };
}
