import type { EncounterDef } from '../../engine/combat/types';
import type { DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { BOUNTIES } from './bounties';
import { COMPANION_DIALOGUES, COMPANION_ENCOUNTERS, COMPANION_NPCS, COMPANION_QUESTS, COMPANIONS } from './companions';
import { FACTION_DIALOGUES, FACTION_ENCOUNTERS, FACTION_QUESTS } from './factions';
import { GOD_ENCOUNTERS, GOD_QUESTS } from './gods';
import { ENDINGS, MAIN_DIALOGUES, MAIN_ENCOUNTERS, MAIN_QUESTS } from './main';
import { FIELD_NPCS, MENTOR_NPCS, NPC_TOPICS, TOWN_NPCS } from './npcs';
import { SIDE_DIALOGUES, SIDE_ENCOUNTERS, SIDE_QUESTS } from './side';
import { CLASS_QUESTS, HYBRID_QUESTS, TRIAL_DIALOGUES } from './trials';
import { TWILIGHT_DIALOGUES, TWILIGHT_ENCOUNTERS, TWILIGHT_ENDINGS, TWILIGHT_ENEMIES, TWILIGHT_NPCS, TWILIGHT_QUESTS } from './twilight';

export { COMPANIONS };
export const ALL_ENDINGS = [...ENDINGS, ...TWILIGHT_ENDINGS];
export { QUEST_ITEMS } from './items';
import { STORY_ENEMIES as BASE_STORY_ENEMIES } from './enemies';
export const STORY_ENEMIES = [...BASE_STORY_ENEMIES, ...TWILIGHT_ENEMIES];

export const QUESTS: QuestDef[] = [...MAIN_QUESTS, ...TWILIGHT_QUESTS, ...SIDE_QUESTS, ...GOD_QUESTS, ...CLASS_QUESTS, ...HYBRID_QUESTS, ...FACTION_QUESTS, ...COMPANION_QUESTS, ...BOUNTIES];

export const DIALOGUES: DialogueDef[] = [...MAIN_DIALOGUES, ...TWILIGHT_DIALOGUES, ...SIDE_DIALOGUES, ...FACTION_DIALOGUES, ...COMPANION_DIALOGUES, ...TRIAL_DIALOGUES];

export const NPCS: NpcDef[] = [...TOWN_NPCS, ...MENTOR_NPCS, ...FIELD_NPCS, ...TWILIGHT_NPCS, ...COMPANION_NPCS].map((n) => (NPC_TOPICS[n.id] ? { ...n, topics: [...(n.topics ?? []), ...(NPC_TOPICS[n.id] ?? [])] } : n));

export const QUEST_ENCOUNTERS: EncounterDef[] = [...MAIN_ENCOUNTERS, ...TWILIGHT_ENCOUNTERS, ...SIDE_ENCOUNTERS, ...GOD_ENCOUNTERS, ...FACTION_ENCOUNTERS, ...COMPANION_ENCOUNTERS];
