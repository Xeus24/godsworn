import { grantMount, grantPet, mountOf } from '../character/stable';
import { allSecrets, secretById, secretCount, secretFlag, type SecretDef } from '../world/secrets';
import type { UtilityKind } from '../skills/generalTypes';
import { hasRule } from '../character/challenges';
import { worldLevel } from '../ngplus/ngplus';
import { content } from '../../data';
import { HOUSE_PRICE } from '../../data/world/housing';
import { characterStats, restoreFull } from '../character/stats';
import type { EncounterDef } from '../combat/types';
import { gainGatheringXp, gatherYield, gatheringLevel } from '../economy/crafting';
import { favorTiers, type DeedOccurrence } from '../gods/devotion';
import { createItem, generateGear } from '../items/generate';
import { SAINT_RELIC, SAINTS } from '../../data/saints';
import { grantSaintBoon } from '../gods/blessings';
import { godLine } from '../gods/lines';
import { addItem, canAdd, countOf, createInventory, STASH_TAB_SIZE, takeQuantity } from '../items/inventory';
import { rollLoot } from '../items/loot';
import { equippedItems } from '../items/equipment';
import { repairItem } from '../items/upkeep';
import { SIGHT } from '../world/world';
import { sightRadius } from '../world/mechanics';
import { dungeonStep } from '../world/mechanics';
import { mechanicEncounterMult, mechanicStep, moonPhase, resetMeter, tideIsHigh } from '../world/mechanics';
import { trainGeneral, utilityChance, utilityRank } from '../skills/general';
import { applyRep, FACTION_FAVOR_SHARE, judgeFactions, rankOf, repOf, type RepChange } from '../world/factions';
import { collectInvestments, investmentCost, investmentLevel, raiseInvestment } from '../world/investments';
import { AIRSHIP } from '../../data/world/ship';
import { canBuildAirship, canUpgradeShip, destinations, navalChance, nextShip, volleyPercent } from '../world/ship';
import { addFurniture, canBuyFurniture, canBuyHouse, buyHouse, roomCost, roomLevel, upgradeRoom } from '../world/housing';
import { mapFor } from '../world/mapgen';
import { grantMap, MAP_CHEST_CHANCE, treasureItemId } from '../world/treasure';
import type { MapEntity, TileMap, WorldState, ZoneDef } from '../world/types';
import {
  absMinute,
  arrival,
  DUNGEON_STEP_MINUTES,
  ENCOUNTER_GRACE,
  encounterChance,
  enterDungeon,
  entityActive,
  entityAt,
  FAST_TRAVEL_GOLD_PER_LEVEL,
  FAST_TRAVEL_HOURS,
  fightLevel,
  groupEncounter,
  isDungeon,
  passable,
  randomEncounter,
  reveal,
  runesDone,
  STEP_MINUTES,
  tileAt,
  townSpot,
  usedKey,
  weatherFor,
  zoneOf,
} from '../world/world';
import type { GameSession } from './gameState';
import type { QuestMarker } from '../quests/quests';

export type WorldResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): WorldResult => ({ ok: false, reason });

/** A fight the world started, so its result can be written back (pack gone, boss slain...). */
export interface PendingFight {
  map: string;
  entity?: string;
  kind: 'wild' | 'roaming' | 'worldBoss' | 'pack' | 'boss' | 'quest' | 'sea';
  /** A voyage in progress: where the ship was going. */
  dest?: string;
}

export type StepResult =
  | { kind: 'blocked'; message?: string }
  | { kind: 'moved'; message?: string }
  | { kind: 'map'; message?: string }
  | { kind: 'town'; town: string }
  | { kind: 'fight'; encounter: EncounterDef; level: number }
  /** Someone waits at a quest marker: open a conversation. */
  | { kind: 'talk'; marker: QuestMarker };

/** Inn and home rest buff. */
const WELL_RESTED = { id: 'inn-rested', name: 'Well Rested (inn)', modifiers: [{ stat: 'damageBonus' as const, type: 'flat' as const, value: 5 }], battlesLeft: 3 };
/** Lock picking: a failed attempt can be retried after this many minutes. */
const LOCKPICK_RETRY = 60;
/** A sprung chest trap costs this share of max HP. */
const TRAP_DAMAGE = 0.15;

/** The overworld on a running game: walking, exploring, towns, factions and your house. */
/** A slotted exploration skill, or the mount you ride when it climbs or swims for you. */
function exploreRank(p: Parameters<typeof utilityRank>[0], kind: UtilityKind): number {
  const mount = mountOf(p);
  const lent = mount?.grants?.skill === kind ? mount.grants.rank : 0;
  return Math.max(utilityRank(p, kind), lent);
}

const EXPLORATION_NAMES = { swimming: 'Swimming', climbing: 'Climbing', ancientScript: 'Read Ancient Script', animalSpeech: 'Animal Speech', lockpicking: 'Lockpicking', detectTraps: 'Detect Traps' } as const;
const GENERAL_FOR = { swimming: 'swimming', climbing: 'climbing', ancientScript: 'read-ancient-script', animalSpeech: 'animal-speech', lockpicking: 'lockpicking', detectTraps: 'detect-traps' } as const;

export class WorldActions {
  pending: PendingFight | undefined;
  /** Fractional minutes of riding not yet spent. */
  private ride = 0;

  constructor(private readonly s: GameSession) {
    // Every finished battle reports back: world fights clear their entity, defeats send you to town.
    s.bus.on('combatEnded', ({ result }) => this.afterBattle(result));
  }

  get world(): WorldState {
    return this.s.state.world;
  }

  get map(): TileMap {
    return mapFor(this.world.position.map);
  }

  get zone(): ZoneDef {
    return zoneOf(this.world.position.map);
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  private changed(reason: string): void {
    this.s.bus.emit('stateChanged', { reason });
  }

  private toast(kind: 'info' | 'loot' | 'warning' | 'quest' | 'favor', text: string): void {
    this.s.bus.emit('toast', { kind, text });
  }

  weatherNow(): string {
    return weatherFor(this.world, this.zone, this.s.state.clock, this.s.rng);
  }

  /** The entity you are standing on, if any. */
  here(): MapEntity | undefined {
    const p = this.world.position;
    return entityAt(this.map, p.x, p.y);
  }

  /** The town you are in (standing on its gate), if any. */
  inTown(): string | undefined {
    const e = this.here();
    return e?.kind === 'town' ? e.ref : undefined;
  }

  /** Gods you can worship here: a town's temple, a shrine, or your patron at home with a Shrine Room. */
  shrineGods(): string[] {
    const town = this.inTown();
    const gods = new Set<string>(town ? content.towns.get(town).temple : []);
    const e = this.here();
    if (e?.kind === 'shrine' && e.ref) gods.add(e.ref);
    const house = this.s.player.world.house;
    const patron = this.s.player.devotion.patron;
    if (town && house?.town === town && patron && roomLevel(this.s.player, 'shrine-room') > 0) gods.add(patron);
    return [...gods];
  }

  canWorship(god: string): boolean {
    return this.shrineGods().includes(god);
  }

  /** Reveals the area around you (call after arriving anywhere). */
  look(): void {
    const p = this.world.position;
    reveal(this.world, this.map, p.x, p.y, sightRadius(this.s.player, this.zone, SIGHT, content.dungeons.find(this.world.position.map)?.gimmick === 'dark', this.day));
  }

  private placeAt(map: string, x: number, y: number): void {
    this.world.position = { map, x, y };
    this.look();
  }

  /**
   * Takes one step. Walking passes time and may start a random fight;
   * stepping onto something interacts with it.
   */
  step(dx: number, dy: number): StepResult {
    const p = this.world.position;
    const map = this.map;
    const nx = p.x + dx;
    const ny = p.y + dy;
    const target = entityAt(map, nx, ny);
    const marker = this.s.quests.markerAt(map.id, nx, ny);
    if (marker && passable(this.world, map, nx, ny)) {
      this.placeAt(map.id, nx, ny);
      this.s.advanceTime(isDungeon(map.id) ? DUNGEON_STEP_MINUTES : STEP_MINUTES);
      if (this.world.grace > 0) this.world.grace--;
      return this.useMarker(marker);
    }
    const exit = target?.kind === 'exit';
    if (!exit && !passable(this.world, map, nx, ny)) {
      return { kind: 'blocked', ...(tileAt(map, nx, ny) === 'D' ? { message: 'A sealed door. Three rune stones must be lit to open it.' } : {}) };
    }
    if (tileAt(map, nx, ny) === 'X' && !this.world.used[usedKey(map.id, `crack-${nx}-${ny}`)]) {
      this.world.used[usedKey(map.id, `crack-${nx}-${ny}`)] = this.day;
      this.toast('info', 'The wall crumbles: a hidden passage!');
    }
    if (!exit) this.placeAt(map.id, nx, ny);
    this.s.advanceTime(this.stepMinutes(map.id));
    if (this.world.grace > 0) this.world.grace--;
    this.world.tideHigh = tideIsHigh(this.s.state.clock.minute);
    this.world.moonFull = moonPhase(this.day) === 4;
    this.world.night = this.s.timeOfDay === 'night';
    this.world.bloodMoon = this.world.night && this.weatherNow() === 'blood-moon';
    this.s.party.ambientBanter();
    if (isDungeon(map.id)) this.world.dsteps = (this.world.dsteps ?? 0) + 1;
    if (target && entityActive(this.world, map, target, this.day)) return this.interact(target);
    // The region's own rule: meters, vents and getting lost.
    const dungeon = content.dungeons.find(map.id);
    const mech = dungeon ? dungeonStep(this.s.player, dungeon.gimmick) : mechanicStep(this.s.player, this.zone, this.s.timeOfDay === 'night', tileAt(map, nx, ny) === '=', this.s.rng);
    if (mech.harm) {
      const stats = characterStats(this.s.player);
      this.s.player.hp = Math.max(1, this.s.player.hp - Math.max(1, Math.round(stats.maxHp * mech.harm)));
      this.changed('mechanic');
    }
    if (mech.lost) this.loseBearings();
    if (mech.message) this.toast('warning', mech.message);
    // Random encounters roam the open zones, not dungeons or towns.
    if (!isDungeon(map.id) && this.world.grace === 0) {
      const night = this.s.timeOfDay === 'night';
      const weather = this.weatherNow();
      if (this.s.rng.chance(encounterChance(this.zone, tileAt(map, nx, ny), weather, night) * (mountOf(this.s.player)?.encounterMult ?? 1) * mechanicEncounterMult(this.s.player, this.zone, !!this.world.tideHigh, night, this.day))) {
        const encounter = randomEncounter(this.zone, weather, night, this.s.player.level, this.s.rng, Boolean(this.s.state.flags['world-darkened']));
        this.pending = { map: map.id, kind: 'wild' };
        return { kind: 'fight', encounter, level: encounter.level };
      }
    }
    return { kind: 'moved' };
  }

  /** Lost in the wood: turned around to a random open spot a few tiles away. */
  private loseBearings(): void {
    const p = this.world.position;
    const map = this.map;
    for (let tries = 0; tries < 40; tries++) {
      const x = p.x + this.s.rng.int(-9, 9);
      const y = p.y + this.s.rng.int(-9, 9);
      if (Math.abs(x - p.x) + Math.abs(y - p.y) < 5 || !passable(this.world, map, x, y) || entityAt(map, x, y)) continue;
      this.placeAt(map.id, x, y);
      return;
    }
  }

  /** Steps onto (or uses) a quest marker. */
  useMarker(marker: QuestMarker): StepResult {
    const r = this.s.quests.useMarker(marker);
    if (r.kind === 'fight') {
      this.pending = { map: this.map.id, kind: 'quest' };
      return r;
    }
    if (r.kind === 'talk') return r;
    this.changed('marker');
    return { kind: 'moved', ...(r.message ? { message: r.message } : {}) };
  }

  /** A quest marker on your tile, if any. */
  markerHere(): QuestMarker | undefined {
    const p = this.world.position;
    return this.s.quests.markerAt(p.map, p.x, p.y);
  }

  /** Minutes a step takes: riding is faster on the overworld (fractions carry over to the next step). */
  private stepMinutes(map: string): number {
    if (isDungeon(map)) return DUNGEON_STEP_MINUTES;
    this.ride += mountOf(this.s.player)?.stepMinutes ?? STEP_MINUTES;
    const whole = Math.floor(this.ride);
    this.ride -= whole;
    return whole;
  }

  // ------------------------------------------------------------ pets and mounts

  /** Buys a mount at a town's stables. */
  buyMount(id: string): WorldResult {
    const def = content.mounts.find(id);
    if (!def?.price) return fail('That mount is not for sale.');
    if (hasRule(this.s.player, 'noShopping')) return fail('Ironman: no merchant will sell to you.');
    if (!this.inTown()) return fail('Stables are in towns.');
    if (this.s.player.stable.mounts.includes(id)) return fail('You already own one.');
    if (!this.s.spendGold(def.price, 'mount')) return fail(`${def.name} costs ${def.price} gold.`);
    grantMount(this.s.player, id);
    this.s.player.stable.mount = id;
    this.toast('loot', `You bought a ${def.name}.`);
    this.changed('mount');
    return { ok: true };
  }

  setMount(id: string | undefined): WorldResult {
    if (id !== undefined && !this.s.player.stable.mounts.includes(id)) return fail('You do not own that mount.');
    if (id === undefined) delete this.s.player.stable.mount;
    else this.s.player.stable.mount = id;
    this.changed('mount');
    return { ok: true };
  }

  setPet(id: string | undefined): WorldResult {
    if (id !== undefined && !this.s.player.stable.pets.includes(id)) return fail('You do not have that pet.');
    if (id === undefined) delete this.s.player.stable.pet;
    else this.s.player.stable.pet = id;
    this.changed('pet');
    return { ok: true };
  }

  private fight(e: MapEntity, kind: PendingFight['kind']): StepResult {
    const map = this.map;
    const zoneLevels = map.level;
    let encounter: EncounterDef;
    if (kind === 'worldBoss' || kind === 'boss') {
      const def = content.enemies.get(e.ref as string);
      encounter = groupEncounter({ weight: 1, enemies: [{ enemyId: def.id }] }, `${kind}:${def.id}`, def.name, Math.max(def.level, this.s.player.level - 2), { canFlee: false, isBoss: true });
      if (kind === 'boss') {
        // Dungeon bosses bring a guard from the dungeon's packs.
        const d = content.dungeons.get(map.id);
        const guard = d.encounters[0]?.enemies[0];
        if (guard) encounter.enemies.push({ ...guard, row: 'back' });
      }
    } else {
      const group = e.group ?? { weight: 1, enemies: [] };
      encounter = groupEncounter(group, `${kind}:${map.id}:${e.id}`, e.label ?? 'Enemies', fightLevel(zoneLevels, this.s.player.level, this.s.rng), { threat: this.zone.threat ?? 0 });
    }
    this.pending = { map: map.id, entity: e.id, kind };
    return { kind: 'fight', encounter, level: encounter.level };
  }

  /** What happens when you step onto (or use) an entity. */
  interact(e: MapEntity): StepResult {
    const map = this.map;
    switch (e.kind) {
      case 'town': {
        const town = e.ref as string;
        resetMeter(this.s.player);
        this.world.lastTown = town;
        this.collectHouse();
        this.s.items.applyStashRules();
        this.s.items.settleOverflow();
        return { kind: 'town', town };
      }
      case 'dungeon': {
        const d = e.ref as string;
        enterDungeon(this.world, d, this.day);
        this.world.dsteps = 0;
        delete this.world.checkpoint;
        const dm = mapFor(d);
        this.placeAt(d, dm.spawns.entrance[0] + 1, dm.spawns.entrance[1]);
        this.world.grace = ENCOUNTER_GRACE;
        return { kind: 'map', message: `You enter ${dm.name}.` };
      }
      case 'area': {
        const am = mapFor(e.ref as string);
        this.placeAt(am.id, am.spawns.entrance[0] + 1, am.spawns.entrance[1]);
        this.world.grace = ENCOUNTER_GRACE;
        return { kind: 'map', message: `You come to ${am.name}.` };
      }
      case 'exit': {
        const to = arrival(this.world, map.id, e);
        this.placeAt(to.map, to.x, to.y);
        this.world.grace = ENCOUNTER_GRACE;
        return { kind: 'map', message: `${mapFor(to.map).name}` };
      }
      case 'shrine':
        if (e.saint) return { kind: 'moved', message: this.saintShrine(e) };
        if (e.gate && !this.world.used[usedKey(map.id, e.id)]) return { kind: 'moved', message: this.openShrine(e) };
        return { kind: 'moved', message: `${content.pantheon.get(e.ref as string).shrine}: you may pray to ${content.gods.get(e.ref as string).name} here (Pantheon, P). ${godLine(this.s.player, e.ref as string, this.s.rng)}`.trim() };
      case 'waypoint': {
        resetMeter(this.s.player);
        if (isDungeon(map.id)) {
          if (this.world.checkpoint?.x !== e.x || this.world.checkpoint.map !== map.id) {
            this.world.checkpoint = { map: map.id, x: e.x, y: e.y };
            this.toast('info', 'Checkpoint: if you fall here, you will wake at this spot.');
          }
          return { kind: 'moved' };
        }
        if (!this.world.waypoints.includes(map.id)) {
          this.world.waypoints.push(map.id);
          this.toast('info', `Waypoint attuned: ${map.name}. Fast travel from the world map (M).`);
          this.changed('waypoint');
        }
        return { kind: 'moved' };
      }
      case 'lore': {
        this.world.used[usedKey(map.id, e.id)] = this.day;
        const lore = content.lore.get(e.ref as string);
        if (!this.world.lore.includes(lore.id)) this.world.lore.push(lore.id);
        this.toast('quest', `Lore found: ${lore.title}`);
        this.changed('lore');
        return { kind: 'moved', message: `${lore.title}: “${lore.text}”` };
      }
      case 'chest':
        return { kind: 'moved', message: e.gate ? this.openCache(e) : this.openChest(e) };
      case 'dig':
        return { kind: 'moved', message: this.dig(e) };
      case 'secret':
        return this.secret(e);
      case 'rune': {
        this.world.used[usedKey(map.id, e.id)] = this.day;
        const done = runesDone(this.world, map);
        this.changed('rune');
        return { kind: 'moved', message: done ? 'The last rune flares. Somewhere, a sealed door grinds open.' : 'The rune stone glows.' };
      }
      case 'enemies':
        return this.fight(e, isDungeon(map.id) ? 'pack' : 'roaming');
      case 'node':
        return { kind: 'moved', message: this.gather(e) };
      case 'worldBoss':
        return this.fight(e, 'worldBoss');
      case 'boss':
        return this.fight(e, 'boss');
    }
  }

  /** Mining, Herbalism and Fishing: open to everyone, better yields with practice. Nodes refill each day. */
  private gather(e: MapEntity): string {
    const skill = e.gather;
    if (!skill) return '';
    const map = this.map;
    const pool = this.zone.gather[skill];
    const itemId = this.s.rng.pick(pool);
    const qty = gatherYield(gatheringLevel(this.s.player, skill), this.s.rng) + (this.zone.mechanic === 'harvest' && skill === 'herbalism' ? 1 : 0);
    const item = createItem(itemId, qty, () => this.s.newUid());
    if (!canAdd(this.s.state.inventory, item)) return 'Your bags are full.';
    addItem(this.s.state.inventory, item);
    this.world.used[usedKey(map.id, e.id)] = this.day;
    this.s.advanceTime(20);
    const up = gainGatheringXp(this.s.player, skill);
    if (up) this.toast('info', `${content.professions.get(skill).name} rises to ${up}.`);
    this.changed('gather');
    return `${e.label}: ${qty}× ${content.items.get(itemId).name}.`;
  }

  /** A secret: gated finds need their skill, puzzles want their stones in order, eggs may fight. Each is found once. */
  private secret(e: MapEntity): StepResult {
    const def = secretById(e.secret as string);
    if (!def) return { kind: 'moved' };
    const map = this.map;
    if (e.gate) {
      const have = exploreRank(this.s.player, e.gate.skill);
      if (have < e.gate.rank) return { kind: 'moved', message: `Something is here, out of reach. It needs ${EXPLORATION_NAMES[e.gate.skill]} at rank ${e.gate.rank}${have > 0 ? ` (you have ${have})` : ' (slot it in the General skills)'}.` };
      trainGeneral(this.s.player, GENERAL_FOR[e.gate.skill], 10);
    }
    if (def.stones) {
      const puzzles = (this.world.puzzles ??= {});
      const step = e.step as number;
      const progress = puzzles[def.id] ?? 0;
      if (step !== progress + 1) {
        puzzles[def.id] = step === 1 ? 1 : 0;
        return { kind: 'moved', message: step === 1 ? `${e.label}: the stone hums. (${def.puzzleHint})` : `${e.label}: the stones fall silent. ${def.puzzleHint} Begin again from the west.` };
      }
      puzzles[def.id] = step;
      if (step < 3) return { kind: 'moved', message: `${e.label}: the stone hums, and the next one answers.` };
      for (let i = 1; i <= 3; i++) this.world.used[usedKey(map.id, `secret-${def.id}#${i}`)] = this.day;
      delete puzzles[def.id];
      return { kind: 'moved', message: this.revealSecret(def) };
    }
    if (def.fight) {
      this.pending = { map: map.id, entity: e.id, kind: 'roaming' };
      const enc = content.encounters.get(def.fight);
      this.s.setFlag(secretFlag(def.id), true);
      this.changed('secret');
      return { kind: 'fight', encounter: enc, level: Math.max(enc.level, this.s.player.level) };
    }
    this.world.used[usedKey(map.id, e.id)] = this.day;
    return { kind: 'moved', message: this.revealSecret(def) };
  }

  /** The reward for a secret: what is found, gold, XP and a gem, rune or material; and the sets when they fill. */
  private revealSecret(def: SecretDef): string {
    const s = this.s;
    s.setFlag(secretFlag(def.id), true);
    const gold = Math.round(def.level * (def.kind === 'puzzle' ? 90 : 55));
    const pool = content.items.filter((b) => ['gem', 'rune', 'material'].includes(b.category) && b.level <= def.level + 3 && b.level >= Math.max(1, def.level - 20));
    const items = pool.length ? [createItem(s.rng.pick(pool).id, 1, () => s.newUid())] : [];
    s.items.receiveLoot(items, gold);
    s.grantXp(def.level * 30, true);
    s.advanceTime(10);
    const count = secretCount(s.state, def.zone);
    s.bus.emit('toast', { kind: 'quest', text: `Secret found: ${def.name} (${count.found}/${count.total} in ${content.zones.get(def.zone).name}).` });
    if (def.set === 'beetle') this.completeSet('beetle', 'beetles-complete', 12, 'Beetle-Keeper', 2400);
    if (def.set === 'fragment') this.completeSet('fragment', 'fragments-complete', 14, 'Fragment-Gatherer', 4200);
    this.changed('secret');
    return `${def.name}: ${def.found} (${gold} gold${items[0] ? `, ${content.items.get(items[0].baseId).name}` : ''}).`;
  }

  private completeSet(set: 'beetle' | 'fragment', flag: string, size: number, title: string, gold: number): void {
    const s = this.s;
    if (s.state.flags[flag]) return;
    const members = allSecrets().filter((d) => d.set === set);
    if (members.length < size || !members.every((d) => s.state.flags[secretFlag(d.id)])) return;
    s.setFlag(flag, true);
    s.addGold(gold, 'quest');
    if (!s.player.devotion.titles.includes(title)) s.player.devotion.titles.push(title);
    s.bus.emit('toast', { kind: 'quest', text: set === 'beetle' ? 'All twelve golden beetles found: they gather in your pack and sing. Title earned: Beetle-Keeper.' : 'All fourteen god fragments found: they fit together into a small, warm key. Title earned: Fragment-Gatherer.' });
  }

  /** Digs up a treasure: its one-of-a-kind curiosity, gold, and a gem, rune, material or consumable. */
  private dig(e: MapEntity): string {
    const t = content.treasures.find(e.ref as string);
    if (!t) return '';
    const map = this.map;
    const key = usedKey(map.id, e.id);
    const prize = createItem(treasureItemId(t), 1, () => this.s.newUid());
    const level = worldLevel(map.level[1], this.s.state.ngPlus);
    const pool = content.items.filter((b) => b.category === t.bonus && b.level <= level + 3 && b.level >= Math.max(1, level - 20));
    const bonus = pool.length ? createItem(this.s.rng.pick(pool).id, 1, () => this.s.newUid()) : undefined;
    const gold = Math.round(120 * level * (0.8 + this.s.rng.float(0, 0.4)));
    const items = bonus ? [prize, bonus] : [prize];
    this.world.used[key] = this.day;
    this.s.advanceTime(30);
    this.s.items.receiveLoot(items, gold);
    this.changed('dig');
    return `You dig up ${t.name}: ${content.items.get(prize.baseId).name}${bonus ? `, ${content.items.get(bonus.baseId).name}` : ''} and ${gold} gold.`;
  }

  /** A puzzle-locked shrine: the right exploration skill at the right rank breaks its seal for good. */
  private openShrine(e: MapEntity): string {
    const gate = e.gate!;
    const have = exploreRank(this.s.player, gate.skill);
    if (have < gate.rank) return `${e.label ?? 'A sealed shrine'}: a seal holds it shut. It needs ${EXPLORATION_NAMES[gate.skill]} at rank ${gate.rank}${have > 0 ? ` (you have ${have})` : ' (slot it in the General skills)'}.`;
    this.world.used[usedKey(this.map.id, e.id)] = this.day;
    trainGeneral(this.s.player, GENERAL_FOR[gate.skill], 15);
    this.toast('info', `The seal on ${e.label ?? 'the shrine'} gives way.`);
    this.changed('shrine');
    return `The seal gives way. ${content.pantheon.get(e.ref as string).shrine}: you may pray to ${content.gods.get(e.ref as string).name} here (Pantheon, P). ${godLine(this.s.player, e.ref as string, this.s.rng)}`.trim();
  }

  /** A hidden saint's shrine: a free stacking boon once a day, and the Reliquary when all eight are found. */
  private saintShrine(e: MapEntity): string {
    const saint = SAINTS.find((x) => x.id === e.saint);
    if (!saint) return '';
    const p = this.s.player;
    const key = usedKey(this.map.id, e.id);
    const first = !this.s.state.flags[`saint:${saint.id}`];
    if (first) {
      this.s.setFlag(`saint:${saint.id}`, true);
      this.toast('quest', `A saint’s shrine: ${saint.name}.`);
    }
    const notes: string[] = [first ? `${saint.name}, ${saint.title.toLowerCase()}.` : `${saint.name} remembers you.`];
    if (this.world.used[key] === this.day) {
      notes.push('You have already been blessed today.');
    } else {
      this.world.used[key] = this.day;
      const blessings = content.blessings.filter((b) => b.saint === saint.id);
      const pick = blessings[this.day % blessings.length];
      if (pick) {
        grantSaintBoon(p, pick.id, 1);
        notes.push(`${pick.name}: ${pick.description} (10 battles, stacks with other saints).`);
      }
    }
    const found = SAINTS.filter((x) => this.s.state.flags[`saint:${x.id}`]).length;
    if (found === SAINTS.length && !this.s.state.flags['saint:relic']) {
      this.s.setFlag('saint:relic', true);
      const relic = generateGear({ rng: this.s.rng, itemLevel: 30, newUid: () => this.s.newUid() }, { uniqueId: SAINT_RELIC.id });
      this.s.items.receiveLoot([relic], 0);
      this.toast('quest', 'All eight saints found: the Reliquary of the Eight is yours.');
      notes.push('All eight saints are found. The Reliquary of the Eight is yours.');
    } else {
      notes.push(`Saints found: ${found}/${SAINTS.length}.`);
    }
    this.changed('shrine');
    return notes.join(' ');
  }

  /** An exploration cache: the matching skill at the right rank opens it; the haul is two chests' worth. */
  private openCache(e: MapEntity): string {
    const gate = e.gate!;
    const p = this.s.player;
    const have = exploreRank(p, gate.skill);
    const name = e.label ?? 'Cache';
    if (have < gate.rank) return `${name}: this needs ${EXPLORATION_NAMES[gate.skill]} at rank ${gate.rank}${have > 0 ? ` (you have ${have})` : ' (slot it in the General skills)'}.`;
    const map = this.map;
    this.world.used[usedKey(map.id, e.id)] = this.day;
    const level = worldLevel(map.level[1], this.s.state.ngPlus);
    const stats = characterStats(p);
    let gold = 0;
    let kept = 0;
    for (let i = 0; i < 2; i++) {
      const loot = rollLoot('chest', { rng: this.s.rng, itemLevel: level + 2, newUid: () => this.s.newUid(), magicFind: stats.magicFind + 25, goldFind: stats.goldFind, ngPlus: this.s.state.ngPlus, sourceTier: 'chest', favorTiers: favorTiers(p) });
      const got = this.s.items.receiveLoot(loot.items, loot.gold);
      gold += loot.gold;
      kept += got.kept.length;
    }
    trainGeneral(p, GENERAL_FOR[gate.skill], 20);
    this.changed('chest');
    return `${name}: your ${EXPLORATION_NAMES[gate.skill]} pays off. ${gold} gold and ${kept} item${kept === 1 ? '' : 's'}.`;
  }

  /** Opens a chest: locked chests need a Skeleton Key or Lockpicking; traps hurt unless detected. */
  private openChest(e: MapEntity): string {
    const map = this.map;
    const key = usedKey(map.id, e.id);
    const p = this.s.player;
    const notes: string[] = [];
    if (e.locked) {
      const now = absMinute(this.s.state.clock);
      const lastFail = this.world.lockpickFailed[key];
      if (countOf(this.s.state.inventory, 'skeleton-key') > 0) {
        takeQuantity(this.s.state.inventory, 'skeleton-key', 1);
        notes.push('Your Skeleton Key turns, and snaps.');
      } else if (lastFail !== undefined && now - lastFail < LOCKPICK_RETRY) {
        return 'Locked. Your last attempt bent your picks; try again in an hour.';
      } else if (this.s.rng.chance(utilityChance(p, 'lockpicking'))) {
        notes.push('You pick the lock.');
      } else {
        this.world.lockpickFailed[key] = now;
        return utilityChance(p, 'lockpicking') > 0 ? 'Locked. Your picks slip.' : 'Locked. You need a Skeleton Key or the Lockpicking skill.';
      }
    }
    if (e.trapped) {
      if (this.s.rng.chance(utilityChance(p, 'detectTraps'))) notes.push('You spot and disarm a trap.');
      else {
        const dmg = Math.round(characterStats(p).maxHp * TRAP_DAMAGE);
        p.hp = Math.max(1, p.hp - dmg);
        notes.push(`A trap! You take ${dmg} damage.`);
      }
    }
    this.world.used[key] = this.day;
    const level = worldLevel(map.level[1], this.s.state.ngPlus);
    const stats = characterStats(p);
    const loot = rollLoot('chest', { rng: this.s.rng, itemLevel: level, newUid: () => this.s.newUid(), magicFind: stats.magicFind, goldFind: stats.goldFind, ngPlus: this.s.state.ngPlus, sourceTier: 'chest', favorTiers: favorTiers(p) });
    const got = this.s.items.receiveLoot(loot.items, loot.gold);
    notes.push(`Chest: ${loot.gold} gold${got.kept.length ? ` and ${got.kept.length} item${got.kept.length > 1 ? 's' : ''}` : ''}.`);
    const found = this.s.rng.chance(MAP_CHEST_CHANCE) ? grantMap(this.world, this.zone.id, this.s.rng) : undefined;
    if (found) {
      notes.push(`Among the contents: a treasure map, "${found.name}".`);
      this.toast('quest', `Treasure map found: ${found.name}`);
    }
    this.changed('chest');
    return notes.join(' ');
  }

  /**
   * After a world fight: the pack or boss is gone (for now), world bosses
   * leave a trophy, dungeon bosses clear the dungeon. Defeat sends you back
   * to the last town you visited.
   */
  afterBattle(outcome: 'victory' | 'defeat' | 'fled' | 'ongoing'): void {
    const pending = this.pending;
    this.pending = undefined;
    this.world.grace = ENCOUNTER_GRACE;
    if (pending?.kind === 'sea' && pending.dest && outcome !== 'defeat') {
      this.arriveAt(pending.dest);
      return;
    }
    if (outcome === 'defeat' && this.world.checkpoint && isDungeon(this.world.position.map) && this.world.checkpoint.map === this.world.position.map) {
      const cp = this.world.checkpoint;
      this.placeAt(cp.map, cp.x, cp.y);
      this.toast('warning', 'You wake at the dungeon checkpoint.');
      this.changed('respawn');
      return;
    }
    if (outcome === 'defeat') {
      const spot = townSpot(this.world.lastTown);
      this.placeAt(spot.map, spot.x, spot.y);
      this.toast('warning', `You wake in ${content.towns.get(this.world.lastTown).name}.`);
      this.changed('respawn');
      return;
    }
    if (outcome !== 'victory' || !pending?.entity) return;
    const map = mapFor(pending.map);
    const e = map.entities.find((x) => x.id === pending.entity);
    this.world.used[usedKey(pending.map, pending.entity)] = this.day;
    if (pending.kind === 'worldBoss' && e?.ref) {
      const t = this.s.player.world.trophies;
      t[e.ref] = (t[e.ref] ?? 0) + 1;
      this.toast('loot', `Trophy taken: ${content.enemies.get(e.ref).name}.`);
      const found = grantMap(this.world, this.zone.id, this.s.rng);
      if (found) this.toast('quest', `The beast carried a treasure map: ${found.name}`);
    }
    if (pending.kind === 'boss' && !this.world.dungeonsCleared.includes(pending.map)) {
      this.world.dungeonsCleared.push(pending.map);
      this.toast('quest', `${map.name} cleared!`);
    }
    this.changed('world');
  }

  /** Fast travel to another zone's waypoint (both attuned). Costs gold and a few hours. */
  fastTravel(zone: string): WorldResult {
    if (hasRule(this.s.player, 'noFastTravel')) return fail('Ironman: the waypoints will not carry you.');
    if (!this.world.waypoints.includes(zone)) return fail('You have not attuned that waypoint.');
    if (isDungeon(this.world.position.map)) return fail('Leave the dungeon first.');
    if (zone === this.world.position.map) return fail('You are already here.');
    const cost = FAST_TRAVEL_GOLD_PER_LEVEL * this.s.player.level;
    if (!this.s.spendGold(cost, 'travel')) return fail(`Travel costs ${cost} gold.`);
    const wp = mapFor(zone).entities.find((e) => e.kind === 'waypoint');
    if (!wp) return fail('No waypoint there.');
    this.placeAt(zone, wp.x, wp.y);
    this.s.advanceTime(FAST_TRAVEL_HOURS * 60);
    this.world.grace = ENCOUNTER_GRACE;
    this.changed('travel');
    return { ok: true };
  }

  // ------------------------------------------------------------ towns

  innCost(): number {
    const town = this.inTown();
    return town ? content.towns.get(town).innCostPerLevel * this.s.player.level : 0;
  }

  /** A night at the inn: full HP/MP, 8 hours, and Well Rested (+5% damage, 3 battles). */
  stayAtInn(): WorldResult {
    const town = this.inTown();
    if (!town) return fail('Find a town first.');
    if (!this.s.spendGold(this.innCost(), 'inn')) return fail(`A room costs ${this.innCost()} gold.`);
    this.sleep();
    this.s.setFlag(`inn:${town}`, true);
    this.toast('info', 'You sleep in a warm bed and wake Well Rested.');
    return { ok: true };
  }

  private sleep(): void {
    const p = this.s.player;
    restoreFull(p);
    this.s.party.restoreAll();
    this.s.advanceTime(8 * 60);
    p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== WELL_RESTED.id), { ...WELL_RESTED, modifiers: [...WELL_RESTED.modifiers] }];
    this.s.devotion.onRest();
    this.changed('rest');
  }

  // ------------------------------------------------------------ house

  buyHouse(): WorldResult {
    const town = this.inTown();
    if (!town) return fail('Find a town first.');
    const check = canBuyHouse(this.s.player, town);
    if (!check.ok) return check;
    if (!this.s.spendGold(HOUSE_PRICE, 'house')) return fail(`A house costs ${HOUSE_PRICE} gold.`);
    buyHouse(this.s.player, town, this.day);
    this.toast('quest', `You bought a house in ${content.towns.get(town).name}!`);
    this.changed('house');
    return { ok: true };
  }

  // ------------------------------------------------------------ ship and airship

  /** Builds the first ship or upgrades it, at the harbor in Saltmere. */
  upgradeShip(): WorldResult {
    if (this.inTown() !== 'saltmere') return fail('The shipwrights are in Saltmere.');
    const next = nextShip(this.s.player);
    const check = canUpgradeShip(this.s.player, this.s.state.gold, this.s.state.inventory);
    if (!next || !check.ok) return check.ok ? fail('Nothing to build.') : check;
    this.s.spendGold(next.gold, 'ship');
    for (const m of next.materials) takeQuantity(this.s.state.inventory, m.itemId, m.qty);
    this.s.player.world.ship = { level: next.level, airship: this.s.player.world.ship?.airship ?? false, voyages: this.s.player.world.ship?.voyages ?? 0 };
    this.toast('quest', next.level === 1 ? `The ${next.name} is yours. Where will you sail?` : `Your ship is now a ${next.name}.`);
    this.changed('ship');
    return { ok: true };
  }

  buildAirship(): WorldResult {
    if (this.inTown() !== 'saltmere') return fail('The shipwrights are in Saltmere.');
    const done = this.s.state.quests.completed[AIRSHIP.needsQuest] !== undefined;
    const check = canBuildAirship(this.s.player, this.s.state.gold, this.s.state.inventory, done);
    if (!check.ok) return check;
    this.s.spendGold(AIRSHIP.gold, 'ship');
    for (const m of AIRSHIP.materials) takeQuantity(this.s.state.inventory, m.itemId, m.qty);
    const ship = this.s.player.world.ship as NonNullable<typeof this.s.player.world.ship>;
    ship.airship = true;
    this.toast('quest', `${AIRSHIP.name} rises from the dry dock. The sky is open.`);
    this.changed('ship');
    return { ok: true };
  }

  /**
   * Sails (or flies) to a ship-only (or sky-only) area from Saltmere. A voyage by ship may meet a naval
   * battle on the way: the result carries the encounter, and the voyage finishes when it is won or fled.
   */
  voyage(areaId: string): WorldResult | { ok: true; fight: { encounter: EncounterDef; level: number; volley: number } } {
    if (this.inTown() !== 'saltmere') return fail('Voyages leave from the harbor at Saltmere.');
    const dest = destinations(this.s.player).find((d) => d.id === areaId);
    if (!dest) return fail('You do not know of such a place.');
    if (dest.locked) return fail(dest.locked);
    const area = content.areas.get(areaId);
    const ship = this.s.player.world.ship as NonNullable<typeof this.s.player.world.ship>;
    this.s.advanceTime(Math.round(dest.hours * 60));
    if (area.access?.by === 'ship') {
      ship.voyages++;
      if (this.s.rng.chance(navalChance(this.s.player))) {
        const zone = content.zones.get('stormcoast');
        const encounter = randomEncounter(zone, this.weatherNow(), this.s.timeOfDay === 'night', this.s.player.level, this.s.rng, Boolean(this.s.state.flags['world-darkened']));
        encounter.id = `sea:${areaId}`;
        encounter.name = 'Naval battle';
        encounter.description = 'Something rises out of the swell beside your ship.';
        this.pending = { map: this.world.position.map, kind: 'sea', dest: areaId };
        return { ok: true, fight: { encounter, level: encounter.level, volley: volleyPercent(this.s.player) } };
      }
    }
    this.arriveAt(areaId);
    this.toast('info', `You arrive at ${area.name}.`);
    return { ok: true };
  }

  private arriveAt(areaId: string): void {
    const am = mapFor(areaId);
    this.placeAt(am.id, am.spawns.entrance[0] + 1, am.spawns.entrance[1]);
    this.world.grace = ENCOUNTER_GRACE;
    this.changed('voyage');
  }

  /** Puts money into a town business (or raises it). */
  invest(id: string): WorldResult {
    const def = content.investments.find(id);
    if (!def) return fail('Unknown business.');
    if (this.inTown() !== def.town) return fail(`That business is in ${content.towns.get(def.town).name}.`);
    if (hasRule(this.s.player, 'noShopping')) return fail('Ironman: no merchant will deal with you.');
    const cost = investmentCost(this.s.player, id);
    if (cost === undefined) return fail('Already at its best.');
    if (!this.s.spendGold(cost, 'invest')) return fail(`Costs ${cost} gold.`);
    raiseInvestment(this.s.player, id, this.s.state.clock.day);
    this.toast('quest', `${def.name} ${investmentLevel(this.s.player, id) > 1 ? `grows to level ${investmentLevel(this.s.player, id)}` : 'is yours'}.`);
    this.changed('invest');
    return { ok: true };
  }

  /** Collects the earnings of every business in this town. */
  collectInvestments(): WorldResult {
    const town = this.inTown();
    if (!town) return fail('Go to the town whose businesses you own.');
    const gold = collectInvestments(this.s.player, town, this.s.state.clock.day);
    if (gold <= 0) return fail('Nothing has been earned yet.');
    this.s.addGold(gold, 'invest');
    this.toast('loot', `Your businesses paid ${gold} gold.`);
    this.changed('invest');
    return { ok: true };
  }

  /** Buys a piece of furniture for a built room. */
  buyFurniture(id: string): WorldResult {
    const def = content.furniture.find(id);
    if (!def) return fail('Unknown furniture.');
    const check = canBuyFurniture(this.s.player, id);
    if (!check.ok) return check;
    if (!this.s.spendGold(def.price, 'house')) return fail(`${def.name} costs ${def.price} gold.`);
    addFurniture(this.s.player, id);
    this.toast('loot', `${def.name} is yours.`);
    this.changed('house');
    return { ok: true };
  }

  /** Buys a pet at a town's stables. */
  buyPet(id: string): WorldResult {
    const def = content.pets.find(id);
    if (!def?.price) return fail('That pet is not for sale.');
    if (hasRule(this.s.player, 'noShopping')) return fail('Ironman: no merchant will sell to you.');
    if (!this.inTown()) return fail('Stables are in towns.');
    if (this.s.player.stable.pets.includes(id)) return fail('You already have one.');
    if (!this.s.spendGold(def.price, 'pet')) return fail(`${def.name} costs ${def.price} gold.`);
    grantPet(this.s.player, id);
    this.toast('loot', `${def.name} follows you home.`);
    this.changed('pet');
    return { ok: true };
  }

  upgradeRoom(room: string): WorldResult {
    const cost = roomCost(this.s.player, room);
    if (cost === undefined) return fail('Already at its best.');
    if (this.s.state.gold < cost) return fail(`Costs ${cost} gold.`);
    const result = upgradeRoom(this.s.player, room);
    if (!result.ok) return result;
    this.s.spendGold(cost, 'house');
    // The Vault adds a stash tab when first built.
    if (room === 'vault' && roomLevel(this.s.player, 'vault') === 1) this.s.state.stash.tabs.push(createInventory(STASH_TAB_SIZE));
    this.toast('quest', `${content.houseRooms.get(room).name} ${roomLevel(this.s.player, room) > 1 ? `upgraded to level ${roomLevel(this.s.player, room)}` : 'built'}.`);
    this.changed('house');
    return { ok: true };
  }

  atHome(): boolean {
    const town = this.inTown();
    return town !== undefined && this.s.player.world.house?.town === town;
  }

  /** Free rest in your Bedroom. */
  restAtHome(): WorldResult {
    if (!this.atHome()) return fail('You are not at home.');
    if (roomLevel(this.s.player, 'bedroom') === 0) return fail('Build a Bedroom first.');
    this.sleep();
    this.toast('info', 'You sleep in your own bed. Nothing beats it.');
    return { ok: true };
  }

  /** Visiting home: the Forge repairs your gear, the Alchemy Lab hands over what it brewed (up to 3 days' worth). */
  collectHouse(): void {
    const house = this.s.player.world.house;
    if (!house || !this.atHome()) return;
    const forge = roomLevel(this.s.player, 'forge');
    if (forge > 0) for (const [, item] of equippedItems(this.s.player)) repairItem(item);
    const lab = roomLevel(this.s.player, 'alchemy-lab');
    const days = Math.min(3, this.day - house.lastCollected);
    house.lastCollected = this.day;
    if (lab > 0 && days > 0) {
      const tier = this.s.player.level >= 40 ? 'major' : this.s.player.level >= 25 ? 'greater' : this.s.player.level >= 12 ? 'lesser' : 'minor';
      let made = 0;
      for (let i = 0; i < lab * days; i++) {
        const potion = createItem(`${this.s.rng.chance(0.6) ? 'health' : 'mana'}-potion-${tier}`, 1, () => this.s.newUid());
        if (!canAdd(this.s.state.inventory, potion)) break;
        addItem(this.s.state.inventory, potion);
        made++;
      }
      if (made) this.toast('loot', `Your Alchemy Lab brewed ${made} potion${made > 1 ? 's' : ''}.`);
    }
  }

  // ------------------------------------------------------------ factions

  /** Faction reputation from a batch of deeds; each faction's god takes a little favor too. */
  factionDeeds(occ: readonly DeedOccurrence[]): RepChange[] {
    return this.addRep(judgeFactions(occ));
  }

  /** Reputation changes (quests, deeds); announces new ranks and shares favor with each faction's god. */
  addRep(deltas: Record<string, number>): RepChange[] {
    if (Object.keys(deltas).length === 0) return [];
    const p = this.s.player;
    const before = Object.fromEntries(content.factions.all().map((f) => [f.id, rankOf(f, repOf(p, f.id))?.name]));
    const changes = applyRep(p, deltas);
    const favor: Record<string, number> = {};
    for (const ch of changes) {
      const f = content.factions.get(ch.faction);
      if (ch.after > ch.before) favor[f.god] = (favor[f.god] ?? 0) + (ch.after - ch.before) * FACTION_FAVOR_SHARE;
      const rank = rankOf(f, ch.after)?.name;
      if (rank && rank !== before[f.id] && ch.after > ch.before) this.toast('quest', `${f.name}: you are now a ${rank}.`);
    }
    if (Object.keys(favor).length) this.s.devotion.apply(favor, 'faction', false, true);
    return changes;
  }
}
