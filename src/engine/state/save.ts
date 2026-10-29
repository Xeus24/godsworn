import { content } from '../../data';
import { createMinigameState } from '../minigames/state';
import { createEndgameState } from '../endgame/types';
import { BUILD_SLOTS } from '../skills/treeTypes';
import { emptyBuild } from '../skills/tree';
import { createAppearanceState } from '../items/appearance';
import { createGameStats, GAME_NAME, GameSession, SAVE_VERSION, type GameState } from './gameState';

/**
 * Saving and loading. The engine never touches the browser: the UI hands in
 * a key-value store (localStorage in the game, a Map in tests). A save is
 * the game state as JSON; loading migrates older versions forward and
 * checks the result before a session is built from it.
 */

/** Where saves live: a minimal key-value store. */
export interface SaveStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

export const SAVE_PREFIX = 'godsworn:save:';
/** The autosave slot, plus manual ones. */
export const AUTOSAVE_SLOT = 'auto';
export const MANUAL_SLOTS = ['1', '2', '3'];

/** What the load screen shows for a slot without loading it. */
export interface SaveSummary {
  slot: string;
  name: string;
  level: number;
  classes: string;
  ngPlus: number;
  hardcore: boolean;
  gameOver: boolean;
  day: number;
  playTimeMs: number;
  savedAt: number;
  characterId: string;
}

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: string };

/** The save file: the state plus when it was written. */
interface SaveFile {
  savedAt: number;
  state: GameState;
}

export function serialize(session: GameSession, now = Date.now()): string {
  const file: SaveFile = { savedAt: now, state: session.snapshot() };
  return JSON.stringify(file);
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});

/**
 * Brings an older save up to this version. Every field added since the
 * save system began gets its default, so a save from any earlier version
 * of the game loads (the save version is bumped whenever the shape grows).
 */
export function migrate(raw: Json): Json {
  const state = { ...raw };
  const p = obj(state.player);
  state.player = p;
  // Version 12 (Phase 13): bestiary, title, achievements, lifetime stats, rarities found.
  p.bestiary ??= {};
  state.achievements ??= {};
  state.rarityFound ??= {};
  state.stats = { ...createGameStats(), ...obj(state.stats) };
  // Version 13 (Phase 14): legacy, heresy and pantheon politics.
  state.legacy ??= { endings: [] };
  const d = obj(p.devotion);
  p.devotion = d;
  d.heresy ??= 0;
  d.politics ??= {};
  d.titles ??= [];
  // Version 14 (Phase 15): endgame, challenge modes, pets and mounts.
  state.endgame = { ...createEndgameState(), ...obj(state.endgame) };
  p.challenges ??= [];
  p.stable ??= { pets: [], mounts: [] };
  // Version 15: difficulty tiers.
  p.difficulty ??= 'medium';
  // Version 16: achievement points on the hero (they unlock milestone bonuses).
  p.achievementPoints ??= Object.keys(obj(state.achievements)).reduce((sum, id) => sum + (content.achievements.find(id)?.points ?? 0), 0);
  // Companions are characters too.
  for (const comp of Object.values(obj(obj(state.party).companions))) {
    const ch = obj(obj(comp).character);
    ch.bestiary ??= {};
    ch.difficulty ??= 'medium';
    ch.achievementPoints ??= 0;
    obj(comp).autoTree ??= true;
    ch.challenges ??= [];
    ch.appearance = { ...createAppearanceState(), ...obj(ch.appearance) };
    ch.stable ??= { pets: [], mounts: [] };
    const cd = obj(ch.devotion);
    cd.heresy ??= 0;
    cd.politics ??= {};
  }
  // Version 17: loot set aside when the bags were full, and stash tab names.
  state.overflow ??= [];
  state.stashRules ??= [];
  const stash = obj(state.stash);
  stash.names ??= [];
  stash.reliquary ??= {};
  stash.rules ??= {};
  state.loadouts ??= {};
  // Early gear sets stored bare uids; they now keep the item's name too.
  for (const set of Object.values(obj(state.loadouts))) {
    const pieces = obj(set);
    for (const [slot, piece] of Object.entries(pieces)) if (typeof piece === 'string') pieces[slot] = { uid: piece, name: 'a saved piece' };
  }
  state.stash = stash;
  // Version 18 phase 3: five builds per class, evolved skills.
  for (const holder of [p, ...Object.values(obj(obj(state.party).companions)).map((comp) => obj(obj(comp).character))]) {
    holder.evolved ??= {};
    holder.unlockedClasses ??= [];
    holder.stolen ??= [];
    for (const st of Object.values(obj(holder.trees))) {
      const builds = (obj(st).builds as Json[]) ?? [];
      while (builds.length < BUILD_SLOTS) builds.push(emptyBuild(builds.length) as unknown as Json);
      obj(st).builds = builds;
    }
  }
  // Version 18 (The Greater Pantheon): systems start empty. Later phases add their defaults here.
  p.appearance = { ...createAppearanceState(), ...obj(p.appearance) };
  // Version 21 (New Game+): world affixes start empty.
  state.ngAffixes ??= [] as unknown as Json;
  // Version 20 (minigames): fish, cards (a starter set) and records start fresh.
  state.minigames ??= createMinigameState() as unknown as Json;
  // Version 19 (companions): camp scenes, chats and banter start at zero.
  for (const comp of Object.values(obj(obj(state.party).companions))) {
    const c = obj(comp);
    c.scenes ??= 0;
    c.lastTalk ??= -1;
    c.banter ??= 0;
  }
  const world = obj(state.world);
  world.treasureMaps ??= [];
  state.world = world;
  state.meta = { ...obj(state.meta), version: SAVE_VERSION };
  return state;
}

/** Parses a save, checks it is a Godsworn save this version can read, and migrates it. */
export function deserialize(text: string): LoadResult {
  let file: Json;
  try {
    file = obj(JSON.parse(text));
  } catch {
    return { ok: false, reason: 'The save is damaged (not readable).' };
  }
  const raw = obj(file.state);
  const meta = obj(raw.meta);
  if (meta.game !== GAME_NAME) return { ok: false, reason: 'That is not a Godsworn save.' };
  const version = Number(meta.version);
  if (!Number.isFinite(version)) return { ok: false, reason: 'The save has no version.' };
  if (version > SAVE_VERSION) return { ok: false, reason: 'That save comes from a newer version of the game.' };
  const state = migrate(raw) as unknown as GameState;
  const problem = check(state);
  return problem ? { ok: false, reason: `The save is damaged (${problem}).` } : { ok: true, state };
}

/** A few sanity checks so a broken save fails to load instead of breaking the game. */
function check(state: GameState): string | undefined {
  const p = state.player;
  if (!p || typeof p.name !== 'string' || !Array.isArray(p.classes) || p.classes.length === 0) return 'no hero';
  if (!content.races.has(p.raceId)) return `unknown race ${p.raceId}`;
  for (const cl of p.classes) if (!content.classes.has(cl.classId)) return `unknown class ${cl.classId}`;
  if (!state.inventory || !Array.isArray(state.inventory.slots)) return 'no inventory';
  if (!state.world?.position || !state.quests || !state.party || !state.clock) return 'missing world, quests, party or clock';
  return undefined;
}

export function summarize(slot: string, text: string): SaveSummary | undefined {
  try {
    const file = obj(JSON.parse(text));
    const s = obj(file.state);
    const p = obj(s.player);
    const classes = (Array.isArray(p.classes) ? p.classes : []).map((cl) => content.classes.find(String(obj(cl).classId))?.name ?? '?').join(' / ');
    return {
      slot,
      name: String(p.name ?? '?'),
      level: Number(p.level ?? 1),
      classes,
      ngPlus: Number(s.ngPlus ?? 0),
      hardcore: p.hardcore === true,
      gameOver: s.gameOver === true,
      day: Number(obj(s.clock).day ?? 1),
      playTimeMs: Number(obj(s.meta).playTimeMs ?? 0),
      savedAt: Number(file.savedAt ?? 0),
      characterId: String(p.id ?? ''),
    };
  } catch {
    return undefined;
  }
}

/** Save slots on a store: list, save, load, delete. */
export class SaveSlots {
  constructor(private readonly store: SaveStore) {}

  private key(slot: string): string {
    return `${SAVE_PREFIX}${slot}`;
  }

  list(): SaveSummary[] {
    return this.store
      .keys()
      .filter((k) => k.startsWith(SAVE_PREFIX))
      .map((k) => {
        const text = this.store.getItem(k);
        return text ? summarize(k.slice(SAVE_PREFIX.length), text) : undefined;
      })
      .filter((x): x is SaveSummary => x !== undefined)
      .sort((a, b) => b.savedAt - a.savedAt);
  }

  /** The most recent save, for Continue. */
  latest(): SaveSummary | undefined {
    return this.list().find((s) => !s.gameOver);
  }

  save(slot: string, session: GameSession, now = Date.now()): void {
    this.store.setItem(this.key(slot), serialize(session, now));
  }

  load(slot: string): { ok: true; session: GameSession } | { ok: false; reason: string } {
    const text = this.store.getItem(this.key(slot));
    if (!text) return { ok: false, reason: 'That slot is empty.' };
    const result = deserialize(text);
    if (!result.ok) return result;
    if (result.state.gameOver) return { ok: false, reason: 'This hero’s legend has ended.' };
    return { ok: true, session: new GameSession(result.state) };
  }

  remove(slot: string): void {
    this.store.removeItem(this.key(slot));
  }

  /** Hardcore death: every save of that hero goes. */
  removeCharacter(characterId: string): void {
    for (const s of this.list()) if (s.characterId === characterId) this.remove(s.slot);
  }

  /** The raw save text of a slot (to export to a file). */
  exportSlot(slot: string): string | undefined {
    return this.store.getItem(this.key(slot)) ?? undefined;
  }

  /** Imports save text into a slot after checking it loads. */
  importInto(slot: string, text: string): { ok: true } | { ok: false; reason: string } {
    const result = deserialize(text);
    if (!result.ok) return result;
    this.store.setItem(this.key(slot), text);
    return { ok: true };
  }
}
