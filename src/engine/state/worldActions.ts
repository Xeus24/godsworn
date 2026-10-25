import { grantMount, mountOf } from '../character/stable';
import { hasRule } from '../character/challenges';
import { worldLevel } from '../ngplus/ngplus';
import { content } from '../../data';
import { HOUSE_PRICE } from '../../data/world/housing';
import { characterStats, restoreFull } from '../character/stats';
import type { EncounterDef } from '../combat/types';
import { gainGatheringXp, gatherYield, gatheringLevel } from '../economy/crafting';
import { favorTiers, type DeedOccurrence } from '../gods/devotion';
import { createItem } from '../items/generate';
import { addItem, canAdd, countOf, createInventory, STASH_TAB_SIZE, takeQuantity } from '../items/inventory';
import { rollLoot } from '../items/loot';
import { equippedItems } from '../items/equipment';
import { repairItem } from '../items/upkeep';
import { utilityChance } from '../skills/general';
import { applyRep, FACTION_FAVOR_SHARE, judgeFactions, rankOf, repOf, type RepChange } from '../world/factions';
import { canBuyHouse, buyHouse, roomCost, roomLevel, upgradeRoom } from '../world/housing';
import { mapFor } from '../world/mapgen';
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
  kind: 'wild' | 'roaming' | 'worldBoss' | 'pack' | 'boss' | 'quest';
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
    reveal(this.world, this.map, p.x, p.y);
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
    if (target && entityActive(this.world, map, target, this.day)) return this.interact(target);
    // Random encounters roam the open zones, not dungeons or towns.
    if (!isDungeon(map.id) && this.world.grace === 0) {
      const night = this.s.timeOfDay === 'night';
      const weather = this.weatherNow();
      if (this.s.rng.chance(encounterChance(this.zone, tileAt(map, nx, ny), weather, night) * (mountOf(this.s.player)?.encounterMult ?? 1))) {
        const encounter = randomEncounter(this.zone, weather, night, this.s.player.level, this.s.rng);
        this.pending = { map: map.id, kind: 'wild' };
        return { kind: 'fight', encounter, level: encounter.level };
      }
    }
    return { kind: 'moved' };
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
        this.world.lastTown = town;
        this.collectHouse();
        return { kind: 'town', town };
      }
      case 'dungeon': {
        const d = e.ref as string;
        enterDungeon(this.world, d, this.day);
        const dm = mapFor(d);
        this.placeAt(d, dm.spawns.entrance[0] + 1, dm.spawns.entrance[1]);
        this.world.grace = ENCOUNTER_GRACE;
        return { kind: 'map', message: `You enter ${dm.name}.` };
      }
      case 'exit': {
        const to = arrival(this.world, map.id, e);
        this.placeAt(to.map, to.x, to.y);
        this.world.grace = ENCOUNTER_GRACE;
        return { kind: 'map', message: `${mapFor(to.map).name}` };
      }
      case 'shrine':
        return { kind: 'moved', message: `${content.pantheon.get(e.ref as string).shrine}: you may pray to ${content.gods.get(e.ref as string).name} here (Pantheon, P).` };
      case 'waypoint': {
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
        return { kind: 'moved', message: this.openChest(e) };
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
    const qty = gatherYield(gatheringLevel(this.s.player, skill), this.s.rng);
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
    if (!this.inTown()) return fail('Find a town first.');
    if (!this.s.spendGold(this.innCost(), 'inn')) return fail(`A room costs ${this.innCost()} gold.`);
    this.sleep();
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
