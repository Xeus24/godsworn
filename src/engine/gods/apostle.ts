import { rivalsOf } from './devotion';
import { content, type Content } from '../../data';
import { WEAPON_STAGES } from '../../data/apostles';
import { APOSTLESHIP, DEVOTION } from '../../data/devotion';
import type { Character } from '../character/types';
import type { Rng } from '../core/rng';
import { generateGear } from '../items/generate';
import type { ItemInstance } from '../items/types';
import { treeState } from '../skills/tree';
import { atLeast } from './devotion';
import type { DeedOccurrence } from './devotion';
import type { EdictDef } from './types';

export type ApostleResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): ApostleResult => ({ ok: false, reason });

export const apostleTreeId = (god: string): string => `apostle-${god}`;
export const trialEncounterId = (god: string, stage: number): string => `apostle-trial-${god}-${stage}`;

/** The level a trial stage is fought at: scales with the hero, never below 30. */
export function trialLevel(char: Character, stage: number): number {
  return Math.max(APOSTLESHIP.trialMinLevel, char.level) + (APOSTLESHIP.trialLevelOffsets[stage - 1] ?? 0);
}

/** Stage 1 opens at Exalted; each later stage needs the one before it. */
export function canAttemptTrial(char: Character, god: string, stage: number, c: Content = content): ApostleResult {
  if (char.devotion.apostle?.god === god) return fail('You are already this god’s Apostle.');
  if (!atLeast(char, god, 'exalted')) return fail(`Requires Exalted favor with ${c.gods.get(god).name}.`);
  const done = char.devotion.trialStage[god] ?? 0;
  if (stage <= done) return fail('Already completed.');
  if (stage > done + 1) return fail('Complete the previous stage first.');
  return { ok: true };
}

/** Records a won trial stage. Returns the god if the encounter was the next stage of a trial. */
export function recordTrialStage(char: Character, encounterId: string): string | undefined {
  const m = /^apostle-trial-(.+)-(\d)$/.exec(encounterId);
  if (!m) return undefined;
  const god = m[1] as string;
  const stage = Number(m[2]);
  if (stage !== (char.devotion.trialStage[god] ?? 0) + 1) return undefined;
  char.devotion.trialStage[god] = stage;
  return god;
}

export function canAscend(char: Character, god: string, c: Content = content): ApostleResult {
  const current = char.devotion.apostle;
  if (current) return fail(current.god === god ? 'You are already this god’s Apostle.' : `You serve ${c.gods.get(current.god).name}. Renounce them first.`);
  if (!atLeast(char, god, 'exalted')) return fail(`Requires Exalted favor with ${c.gods.get(god).name}.`);
  if ((char.devotion.trialStage[god] ?? 0) < 3) return fail('Complete all three stages of the Trial of Apostleship.');
  return { ok: true };
}

// ---------------------------------------------------------------- the Defender path

/** From NG+3, an Apostle who has passed a second god's trial may defend that god too (not a rival of their own). */
export function canDefend(char: Character, god: string, ngPlus: number, c: Content = content): ApostleResult {
  const a = char.devotion.apostle;
  if (ngPlus < APOSTLESHIP.defenderNgPlus) return fail(`The Defender path opens in New Game+${APOSTLESHIP.defenderNgPlus}.`);
  if (!a) return fail('Only an Apostle may defend a second god.');
  if (a.god === god) return fail('You are already this god’s Apostle.');
  if (char.devotion.defender) return fail(`You already defend ${c.gods.get(char.devotion.defender).name}.`);
  if (rivalsOf(char, a.god, c).includes(god)) return fail(`${c.gods.get(a.god).name} will not share you with a rival.`);
  if (!atLeast(char, god, 'exalted')) return fail(`Requires Exalted favor with ${c.gods.get(god).name}.`);
  if ((char.devotion.trialStage[god] ?? 0) < 3) return fail('Complete all three stages of that god’s Trial of Apostleship.');
  return { ok: true };
}

/** Becomes Defender of a second god: its Divine blessing (in one more slot), the Apostle tier with it, and a title. */
export function defend(char: Character, god: string, ngPlus: number, c: Content = content): ApostleResult {
  const check = canDefend(char, god, ngPlus, c);
  if (!check.ok) return check;
  char.devotion.defender = god;
  char.devotion.defenderLevel = char.level;
  treeState(char, apostleTreeId(god));
  const title = `Defender of ${c.gods.get(god).name}`;
  if (!char.devotion.titles.includes(title)) char.devotion.titles.push(title);
  const blessing = `${god}-divine`;
  if (!char.devotion.majors.includes(blessing)) char.devotion.majors.push(blessing);
  if (!char.devotion.slotted.includes(blessing)) char.devotion.slotted.push(blessing);
  return { ok: true };
}

// ---------------------------------------------------------------- followers

/** The follower your god sends (if you are an Apostle and have called it). */
export function followerOf(char: Character, c: Content = content): string | undefined {
  const a = char.devotion.apostle;
  if (!a || !char.devotion.followerCalled) return undefined;
  const id = `follower-${a.god}`;
  return c.enemies.has(id) ? id : undefined;
}

/** The divine weapon stage for a character level (1-4). */
export function weaponStage(level: number): number {
  let stage = 1;
  WEAPON_STAGES.forEach((s, i) => {
    if (level >= s.level) stage = i + 1;
  });
  return stage;
}

const WEAPON_ID = /^divine-weapon-(.+)-(\d)$/;

/** The god and stage of a divine weapon item, if it is one. */
export function divineWeaponOf(item: ItemInstance): { god: string; stage: number } | undefined {
  const m = item.uniqueId ? WEAPON_ID.exec(item.uniqueId) : null;
  return m ? { god: m[1] as string, stage: Number(m[2]) } : undefined;
}

export function forgeDivineWeapon(god: string, stage: number, rng: Rng, newUid: () => string, c: Content = content): ItemInstance {
  const id = `divine-weapon-${god}-${stage}`;
  const item = generateGear({ rng, itemLevel: c.uniques.get(id).level, newUid, c }, { uniqueId: id });
  item.identified = true;
  return item;
}

/** Evolves a divine weapon in place to the stage for the level (keeping its id, sockets and upgrades). Returns true if it changed. */
export function evolveDivineWeapon(item: ItemInstance, level: number, rng: Rng, c: Content = content): boolean {
  const w = divineWeaponOf(item);
  const target = weaponStage(level);
  if (!w || target <= w.stage) return false;
  const next = forgeDivineWeapon(w.god, target, rng, () => item.uid, c);
  const sockets = item.sockets;
  Object.assign(item, { ...next, sockets: [...sockets, ...next.sockets.slice(sockets.length)], upgrade: item.upgrade });
  return true;
}

/**
 * Ascends as the god's Apostle: the apostle tree, the Divine blessing (in
 * its own extra slot), a permanent title and the first edict. Returns the
 * divine weapon to hand over: from the reliquary if you served this god
 * before, else newly forged at your level's stage.
 */
export function ascend(char: Character, god: string, rng: Rng, newUid: () => string, c: Content = content): { ok: true; weapon: ItemInstance } | { ok: false; reason: string } {
  const check = canAscend(char, god, c);
  if (!check.ok) return check;
  char.devotion.apostle = { god, level: char.level, edictsDone: 0, neglected: false };
  const title = `Apostle of ${c.gods.get(god).name}`;
  if (!char.devotion.titles.includes(title)) char.devotion.titles.push(title);
  const blessing = `${god}-divine`;
  if (!char.devotion.majors.includes(blessing)) char.devotion.majors.push(blessing);
  if (!char.devotion.slotted.includes(blessing)) char.devotion.slotted.push(blessing);
  treeState(char, apostleTreeId(god));
  const stored = char.devotion.reliquary.findIndex((i) => divineWeaponOf(i)?.god === god);
  const weapon = stored >= 0 ? (char.devotion.reliquary.splice(stored, 1)[0] as ItemInstance) : forgeDivineWeapon(god, weaponStage(char.level), rng, newUid, c);
  evolveDivineWeapon(weapon, char.level, rng, c);
  issueEdict(char, rng, c);
  return { ok: true, weapon };
}

// ---------------------------------------------------------------- edicts

export function currentEdict(char: Character, c: Content = content): EdictDef | undefined {
  const id = char.devotion.apostle?.edict?.id;
  return id ? c.edicts.find(id) : undefined;
}

/** The god issues a new edict (never the same as the last one if it has others). */
export function issueEdict(char: Character, rng: Rng, c: Content = content): EdictDef | undefined {
  const a = char.devotion.apostle;
  if (!a) return undefined;
  const pool = c.edicts.filter((e) => e.god === a.god && e.id !== a.edict?.id);
  if (pool.length === 0) return undefined;
  const edict = rng.pick(pool);
  a.edict = { id: edict.id, progress: 0, battlesLeft: edict.battles };
  return edict;
}

/** How many times a batch of occurrences fulfils an edict's deed. */
function edictMatches(e: EdictDef, occ: readonly DeedOccurrence[]): number {
  const d = e.deed;
  let n = 0;
  for (const o of occ) {
    if (o.event !== d.event) continue;
    if (d.enemyType && !o.enemyTypes?.includes(d.enemyType)) continue;
    if (d.tiers && (!o.tier || !d.tiers.includes(o.tier))) continue;
    if (d.elements && (!o.element || !d.elements.includes(o.element as never))) continue;
    if (d.tag && d.tag !== o.tag) continue;
    if (d.timeOfDay && d.timeOfDay !== o.timeOfDay) continue;
    n += o.count ?? 1;
  }
  return n;
}

/** Adds progress to the current edict. Returns the edict if this completed it. */
export function progressEdict(char: Character, occ: readonly DeedOccurrence[], c: Content = content): EdictDef | undefined {
  const a = char.devotion.apostle;
  const edict = currentEdict(char, c);
  if (!a?.edict || !edict) return undefined;
  a.edict.progress = Math.min(edict.count, a.edict.progress + edictMatches(edict, occ));
  return a.edict.progress >= edict.count ? edict : undefined;
}

/** Counts a battle down on the current edict. Returns true if it just expired. */
export function tickEdict(char: Character): boolean {
  const e = char.devotion.apostle?.edict;
  if (!e) return false;
  e.battlesLeft--;
  return e.battlesLeft <= 0;
}

// ---------------------------------------------------------------- apostasy

/**
 * Renounces Apostleship. The god becomes Hated and its heralds hunt you;
 * the apostle tree is kept but no longer yours, the Divine blessing goes
 * quiet, and the divine weapon is returned (the caller moves it to the
 * reliquary). Titles stay.
 */
export function renounce(char: Character): { ok: true; god: string } | { ok: false; reason: string } {
  const a = char.devotion.apostle;
  if (!a) return { ok: false, reason: 'You are no one’s Apostle.' };
  delete char.devotion.apostle;
  char.devotion.favor[a.god] = DEVOTION.minFavor;
  char.devotion.slotted = char.devotion.slotted.filter((id) => id !== `${a.god}-divine`);
  // The Defender path rests on Apostleship.
  const defended = char.devotion.defender;
  if (defended) {
    delete char.devotion.defender;
    delete char.devotion.defenderLevel;
    char.devotion.slotted = char.devotion.slotted.filter((id) => id !== `${defended}-divine`);
  }
  delete char.devotion.followerCalled;
  char.devotion.hunt = { god: a.god, battles: APOSTLESHIP.huntBattles };
  return { ok: true, god: a.god };
}
