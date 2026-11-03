import type { DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import type { ShopDef } from '../../engine/economy/types';
import { FESTIVALS } from '../realm/wheel';
import { TOWNS } from '../world/places';
import { all, level } from './helpers';
import { build, type Row } from './sideGreater';

/** The fourteen festival hosts, quests (one a year, only on the day) and stalls for the Turning Wheel (Innovation Pack, item 6). */
const zoneOf = (town: string): string => (TOWNS.find((t) => t.id === town)?.zone as string);

const built = FESTIVALS.map((f) => {
  const row: Row = {
    id: `festival-${f.id}`, name: f.quest.name, zone: zoneOf(f.town), lvl: f.quest.level, giver: f.host.id,
    task: f.quest.task, offer: f.quest.offer, ask: f.quest.ask, a: f.quest.a, b: f.quest.b,
  };
  const b = build(row, all({ kind: 'festival', id: f.id }, level(Math.max(1, f.quest.level - 6))), 'festival', { xp: 0.45, favor: { [f.god]: 20 } });
  b.quest.repeatable = true;
  return b;
});

export const FESTIVAL_QUESTS: QuestDef[] = built.map((b) => b.quest);
export const FESTIVAL_DIALOGUES: DialogueDef[] = built.map((b) => b.dialogue);
export const FESTIVAL_NPCS: NpcDef[] = FESTIVALS.map((f) => ({ ...f.host, title: f.host.title, town: f.town, place: 'people', festival: f.id }));
export const FESTIVAL_SHOPS: ShopDef[] = FESTIVALS.map((f) => ({ id: `festival-${f.id}`, name: f.stall.name, kind: 'merchant', description: f.stall.description, markup: f.stall.markup, stock: f.stall.stock, festival: f.id }));
