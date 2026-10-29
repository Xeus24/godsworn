import { grantPet } from '../character/stable';
import { content } from '../../data';
import { RIFT_AFFIXES, RIFTS } from '../../data/rifts';
import { DIVINE_TRIALS, LEAGUE, SPIRE, WEEKLY } from '../../data/endgameModes';
import { Rng } from '../core/rng';
import { atLeast } from '../gods/devotion';
import { createItem } from '../items/generate';
import { characterStats } from '../character/stats';
import type { Character } from '../character/types';
import type { Battle } from '../combat/battle';
import type { EncounterDef } from '../combat/types';
import type { GauntletState } from '../endgame/types';
import { favorTiers } from '../gods/devotion';
import { countHeld, takeHeld } from '../items/inventory';
import { rollLoot } from '../items/loot';
import type { ItemInstance } from '../items/types';
import type { ModifierSpec } from '../stats/modifiers';
import { groupEncounter } from '../world/world';
import type { GameSession } from './gameState';

export type EndgameResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): EndgameResult => ({ ok: false, reason });

/** Boss Rush: the dungeon bosses in road order, fought back to back at your level. */
export const BOSS_RUSH = {
  minLevel: 30,
  goldPerLevel: 40,
};

/** What the next fight of a run looks like, for the battle setup. */
export interface GauntletFight {
  encounter: EncounterDef;
  level: number;
  enemyModifiers: ModifierSpec[];
  partyModifiers: ModifierSpec[];
}

/**
 * Endgame runs: Rifts (tiered, opened with a Rift Map at a town's Rift
 * Gate) and the Boss Rush (at a town's arena). A run is a list of fights
 * fought in a row; HP and MP carry over, so only potions and skills heal
 * between waves. Losing or fleeing ends the run.
 */
export class EndgameActions {
  constructor(private readonly s: GameSession) {}

  private get e() {
    return this.s.state.endgame;
  }

  get active(): GauntletState | undefined {
    return this.e.active;
  }

  private toast(kind: 'info' | 'loot' | 'warning' | 'quest' | 'level', text: string): void {
    this.s.bus.emit('toast', { kind, text });
  }

  /** The highest Rift tier you may open now. */
  maxRiftTier(): number {
    return Math.min(RIFTS.maxTier, this.e.riftTier + 1);
  }

  /** Enemy level in a Rift of this tier. */
  riftLevel(tier: number): number {
    return Math.max(1, this.s.player.level + RIFTS.levelOffset + Math.floor((tier - 1) / RIFTS.tiersPerLevel));
  }

  /** How many Rift affixes a tier rolls. */
  affixCount(tier: number): number {
    return RIFTS.affixTiers.filter((t) => tier >= t).length;
  }

  canOpenRift(tier: number): EndgameResult {
    if (this.e.active) return fail('Finish (or abandon) the run you are on first.');
    if (!this.s.world.inTown()) return fail('Rifts open at a town’s Rift Gate.');
    if (this.s.player.level < RIFTS.minLevel) return fail(`Rifts open to heroes of level ${RIFTS.minLevel}.`);
    if (tier < 1 || tier > this.maxRiftTier()) return fail(`Clear tier ${tier - 1} first.`);
    if (countHeld(this.s.state, 'rift-map') < 1) return fail('You need a Rift Map (the Black Market sells them, and they turn up in loot).');
    return { ok: true };
  }

  /** Opens a Rift: spends a Rift Map, rolls its affixes, waves and Guardian. */
  openRift(tier: number): EndgameResult {
    const check = this.canOpenRift(tier);
    if (!check.ok) return check;
    takeHeld(this.s.state, 'rift-map', 1);
    const rng = this.s.rng;
    const level = this.riftLevel(tier);
    const threat = (tier - 1) * RIFTS.threatPerTier;
    const fights: GauntletState['fights'] = [];
    const zones = content.zones.all();
    for (let i = 0; i < RIFTS.waves; i++) {
      const zone = rng.pick(zones);
      const group = rng.weighted(zone.encounters, (g) => g.weight);
      fights.push({ encounter: groupEncounter(group, `gauntlet:rift:${i}`, `Rift wave ${i + 1}`, level, { canFlee: true, threat }), level });
    }
    // World bosses (party fights) guard only the deeper tiers.
    const guardians = [...content.dungeons.all().map((d) => d.boss), ...(tier >= RIFTS.worldBossTier ? zones.map((z) => z.worldBoss) : [])];
    const guardian = rng.pick(guardians);
    fights.push({ encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: guardian }] }, `gauntlet:rift:${RIFTS.waves}`, `Rift Guardian: ${content.enemies.get(guardian).name}`, level, { canFlee: false, isBoss: true, threat }), level });
    const affixes = rng.sample(RIFT_AFFIXES.map((a) => a.id), this.affixCount(tier));
    this.e.active = { kind: 'rift', tier, fights, wave: 0, affixes, turns: 0, gold: 0 };
    this.toast('quest', `Rift tier ${tier} opens${affixes.length ? `: ${affixes.map((id) => content.riftAffixes.get(id).name).join(', ')}` : ''}.`);
    this.s.bus.emit('stateChanged', { reason: 'rift' });
    return { ok: true };
  }

  canStartBossRush(): EndgameResult {
    if (this.e.active) return fail('Finish (or abandon) the run you are on first.');
    if (!this.s.world.inTown()) return fail('The Boss Rush is fought at a town’s arena.');
    if (this.s.player.level < BOSS_RUSH.minLevel) return fail(`The Boss Rush opens to heroes of level ${BOSS_RUSH.minLevel}.`);
    return { ok: true };
  }

  /** The Boss Rush: every dungeon boss in road order, at your level, back to back. */
  startBossRush(): EndgameResult {
    const check = this.canStartBossRush();
    if (!check.ok) return check;
    const level = this.s.player.level;
    const bosses = [...content.dungeons.all()].sort((a, b) => a.level - b.level);
    const fights = bosses.map((d, i) => ({ encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: d.boss }] }, `gauntlet:bossRush:${i}`, `Boss Rush ${i + 1}/${bosses.length}: ${content.enemies.get(d.boss).name}`, level, { canFlee: false, isBoss: true }), level }));
    this.e.active = { kind: 'bossRush', tier: 1, fights, wave: 0, affixes: [], turns: 0, gold: 0 };
    this.toast('quest', `The Boss Rush begins: ${fights.length} bosses, no rest.`);
    this.s.bus.emit('stateChanged', { reason: 'bossRush' });
    return { ok: true };
  }

  // ------------------------------------------------------------ the Endless Spire

  private canStartMode(minLevel: number, what: string): EndgameResult {
    if (this.e.active) return fail('Finish (or abandon) the run you are on first.');
    if (!this.s.world.inTown()) return fail(`${what} is entered from a town.`);
    if (this.s.player.level < minLevel) return fail(`${what} opens to heroes of level ${minLevel}.`);
    return { ok: true };
  }

  canStartSpire(): EndgameResult {
    return this.canStartMode(SPIRE.minLevel, 'The Endless Spire');
  }

  /** The fight on one floor: level and threat climb, every fifth floor is a guardian. */
  spireFight(floor: number): GauntletState['fights'][number] {
    const rng = this.s.rng;
    const level = Math.min(this.s.state.levelCap, this.s.player.level + Math.floor(floor / SPIRE.levelEvery));
    const threat = floor * SPIRE.threatPerFloor;
    const zones = content.zones.all().filter((z) => !z.ngPlus || this.s.state.ngPlus >= z.ngPlus);
    if (floor % SPIRE.guardianEvery === 0) {
      const pool = [...content.dungeons.all().map((d) => d.boss), ...zones.map((z) => z.worldBoss)];
      const id = rng.pick(pool);
      return { encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: id }] }, `gauntlet:spire:${floor}`, `Floor ${floor}, guardian: ${content.enemies.get(id).name}`, level, { canFlee: false, isBoss: true, threat }), level };
    }
    const zone = rng.pick(zones);
    return { encounter: groupEncounter(rng.weighted(zone.encounters, (g) => g.weight), `gauntlet:spire:${floor}`, `Floor ${floor}`, level, { canFlee: true, threat }), level };
  }

  startSpire(): EndgameResult {
    const check = this.canStartSpire();
    if (!check.ok) return check;
    this.e.spire.runs++;
    this.e.active = { kind: 'spire', tier: 1, fights: [this.spireFight(1)], wave: 0, affixes: [], turns: 0, gold: 0, floor: 1 };
    this.toast('quest', 'You climb the Endless Spire. There is no top, only the next floor.');
    this.s.bus.emit('stateChanged', { reason: 'spire' });
    return { ok: true };
  }

  /** After a floor is cleared: record it, maybe add a twist, and lay out the next floor. */
  private nextFloor(a: GauntletState): void {
    const cleared = a.floor ?? 1;
    this.e.spire.best = Math.max(this.e.spire.best, cleared);
    a.floor = cleared + 1;
    a.tier = Math.min(RIFTS.maxTier, Math.ceil(a.floor / 2));
    if (cleared % SPIRE.affixEvery === 0 && a.affixes.length < SPIRE.maxAffixes) {
      const left = RIFT_AFFIXES.map((x) => x.id).filter((id) => !a.affixes.includes(id));
      const id = this.s.rng.pick(left);
      a.affixes.push(id);
      this.toast('warning', `The Spire twists: ${content.riftAffixes.get(id).name}.`);
    }
    a.fights.push(this.spireFight(a.floor));
  }

  /** Leaves the Spire standing: what you won is yours. */
  leaveSpire(): EndgameResult {
    const a = this.e.active;
    if (a?.kind !== 'spire') return fail('You are not in the Spire.');
    this.end(a, true);
    return { ok: true };
  }

  // ------------------------------------------------------------ the Divine Trials

  canStartDivine(god: string): EndgameResult {
    const base = this.canStartMode(50, 'A Divine Trial');
    if (!base.ok) return base;
    if (!DIVINE_TRIALS.some((t) => t.god === god)) return fail('No such trial.');
    if (!atLeast(this.s.player, god, 'acknowledged')) return fail(`${content.gods.get(god).name} has not yet taken notice of you (Acknowledged favor).`);
    return { ok: true };
  }

  startDivine(god: string): EndgameResult {
    const check = this.canStartDivine(god);
    if (!check.ok) return check;
    const trial = DIVINE_TRIALS.find((t) => t.god === god) as (typeof DIVINE_TRIALS)[number];
    const level = this.s.player.level + trial.levelBonus;
    const name = content.gods.get(god).name;
    const encounter = groupEncounter({ weight: 1, enemies: [{ enemyId: `aspect-${god}` }] }, 'gauntlet:divine:0', `${trial.name}: ${name}'s Aspect`, level, { canFlee: false, isBoss: true });
    this.e.active = { kind: 'divine', tier: 12, fights: [{ encounter, level }], wave: 0, affixes: [], turns: 0, gold: 0, god };
    this.toast('quest', `${trial.name} begins. ${trial.description}`);
    this.s.bus.emit('stateChanged', { reason: 'divine' });
    return { ok: true };
  }

  // ------------------------------------------------------------ the Arena Champions league

  canStartLeague(): EndgameResult {
    const base = this.canStartMode(LEAGUE.minLevel, 'The Champions league');
    if (!base.ok) return base;
    if (this.e.league.rank >= LEAGUE.ranks.length - 1) return fail('You are the Champion of Champions. There is no one left to fight.');
    return { ok: true };
  }

  /** A season: eight class champions (the arena’s mentors), the better ones the higher your rank, one after another. */
  startLeague(): EndgameResult {
    const check = this.canStartLeague();
    if (!check.ok) return check;
    const rank = this.e.league.rank;
    const mine = new Set(this.s.player.classes.map((c) => `mentor-${c.classId}`));
    const champions = this.s.rng.sample(content.enemies.all().filter((x) => x.id.startsWith('mentor-') && !mine.has(x.id)).map((x) => x.id), LEAGUE.fightsPerSeason);
    const fights = champions.map((id, i) => {
      const level = this.s.player.level + rank + Math.floor(i / 2);
      const def = content.enemies.get(id);
      return { encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: id, tier: 'boss' as const }] }, `gauntlet:league:${i}`, `Season fight ${i + 1}/${LEAGUE.fightsPerSeason}: ${def.name}`, level, { canFlee: false, isBoss: true, threat: rank * 6 + i * 3 }), level };
    });
    this.e.active = { kind: 'league', tier: rank + 8, fights, wave: 0, affixes: [], turns: 0, gold: 0 };
    this.toast('quest', `A new season begins. You are ${LEAGUE.ranks[rank]}.`);
    this.s.bus.emit('stateChanged', { reason: 'league' });
    return { ok: true };
  }

  // ------------------------------------------------------------ the weekly run

  /** The seed of the week (year and ISO week), the same for everyone. */
  static weeklySeed(date: Date): number {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
    return d.getUTCFullYear() * 100 + week;
  }

  canStartWeekly(): EndgameResult {
    return this.canStartMode(WEEKLY.minLevel, 'The weekly run');
  }

  /** The week's run: the same fights and twists for everyone who plays this seed. */
  startWeekly(seed: number): EndgameResult {
    const check = this.canStartWeekly();
    if (!check.ok) return check;
    const w = this.e.weekly;
    if (w.seed !== seed) this.e.weekly = { seed, best: 0, bestTurns: 0, claimed: false };
    const rng = new Rng(seed * 2654435761);
    const zones = content.zones.all().filter((z) => !z.ngPlus || this.s.state.ngPlus >= z.ngPlus);
    const level = this.s.player.level + 2;
    const fights: GauntletState['fights'] = [];
    for (let i = 0; i < WEEKLY.fights - 1; i++) {
      const zone = rng.pick(zones);
      fights.push({ encounter: groupEncounter(rng.weighted(zone.encounters, (g) => g.weight), `gauntlet:weekly:${i}`, `Week ${seed}, fight ${i + 1}`, level, { canFlee: false, threat: i * 8 }), level });
    }
    const pool = [...content.dungeons.all().map((d) => d.boss), ...zones.map((z) => z.worldBoss)];
    const boss = rng.pick(pool);
    fights.push({ encounter: groupEncounter({ weight: 1, enemies: [{ enemyId: boss }] }, `gauntlet:weekly:${WEEKLY.fights - 1}`, `Week ${seed}, guardian: ${content.enemies.get(boss).name}`, level, { canFlee: false, isBoss: true, threat: 40 }), level });
    const affixes = rng.sample(RIFT_AFFIXES.map((a) => a.id), WEEKLY.affixes);
    this.e.active = { kind: 'weekly', tier: 10, fights, wave: 0, affixes, turns: 0, gold: 0, seed };
    this.toast('quest', `Weekly run ${seed}: the same fights for everyone this week.`);
    this.s.bus.emit('stateChanged', { reason: 'weekly' });
    return { ok: true };
  }

  /** The next fight of the run in progress. */
  nextFight(): GauntletFight | undefined {
    const a = this.e.active;
    const f = a?.fights[a.wave];
    if (!a || !f) return undefined;
    const defs = a.affixes.map((id) => content.riftAffixes.get(id));
    const trial = a.kind === 'divine' ? DIVINE_TRIALS.find((x) => x.god === a.god) : undefined;
    return { ...f, enemyModifiers: [...defs.flatMap((d) => d.enemy ?? []), ...(trial?.enemy ?? [])], partyModifiers: [...defs.flatMap((d) => d.party ?? []), ...(trial?.party ?? [])] };
  }

  abandon(): EndgameResult {
    const a = this.e.active;
    if (!a) return fail('No run in progress.');
    this.end(a, false);
    return { ok: true };
  }

  /** After a battle: a run's fight was won (rewards, next wave) or lost (the run ends). Called by settleBattle. */
  afterBattle(b: Battle): void {
    const a = this.e.active;
    if (!a || b.encounterId !== a.fights[a.wave]?.encounter.id) return;
    a.turns += b.turnCount;
    if (b.outcome !== 'victory') {
      this.end(a, false);
      return;
    }
    const last = a.kind === 'spire' ? false : a.wave === a.fights.length - 1;
    if (a.kind !== 'bossRush') this.riftRewards(a, a.kind === 'spire' ? (a.floor ?? 1) % SPIRE.guardianEvery === 0 : last);
    a.wave++;
    if (a.kind === 'bossRush') this.e.bossRush.best = Math.max(this.e.bossRush.best, a.wave);
    if (a.kind === 'league') this.e.league.fights++;
    if (a.kind === 'spire') this.nextFloor(a);
    if (last) this.end(a, true);
    else {
      if (a.kind !== 'bossRush') this.respite(a.kind === 'league' ? LEAGUE.respitePct : a.kind === 'weekly' ? WEEKLY.respitePct : RIFTS.respitePct);
      this.s.bus.emit('stateChanged', { reason: 'gauntlet' });
    }
  }

  /** Between Rift waves: part of everyone's HP and MP comes back. */
  private respite(pct: number = RIFTS.respitePct): void {
    const heal = (char: Character): void => {
      const st = characterStats(char);
      char.hp = Math.min(st.maxHp, char.hp + Math.round((st.maxHp * pct) / 100));
      char.mp = Math.min(st.maxMp, char.mp + Math.round((st.maxMp * pct) / 100));
    };
    heal(this.s.player);
    for (const comp of Object.values(this.s.state.party.companions)) if (comp.inParty && comp.character.hp > 0) heal(comp.character);
  }

  private riftRewards(a: GauntletState, guardian: boolean): void {
    const s = this.s;
    const p = s.player;
    const level = a.fights[a.wave]?.level ?? p.level;
    const bounty = a.affixes.reduce((sum, id) => sum + (content.riftAffixes.get(id).bounty ?? 0), 0);
    const stats = characterStats(p);
    const items: ItemInstance[] = [];
    let gold = Math.round(RIFTS.goldPerLevelPerTier * level * a.tier * (1 + bounty / 100) * (guardian ? 3 : 1));
    for (let i = 0; i < (guardian ? RIFTS.guardianLootRolls : RIFTS.waveLootRolls); i++) {
      const loot = rollLoot(guardian ? 'boss' : 'elite-enemy', {
        rng: s.rng,
        itemLevel: level,
        newUid: () => s.newUid(),
        magicFind: stats.magicFind + a.tier * RIFTS.magicFindPerTier + bounty,
        goldFind: stats.goldFind,
        ngPlus: guardian && a.tier >= RIFTS.primordialTier ? Math.max(5, s.state.ngPlus) : s.state.ngPlus,
        sourceTier: guardian ? 'boss' : 'elite',
        favorClassId: p.classes[0]?.classId,
        favorTiers: favorTiers(p),
      });
      gold += loot.gold;
      items.push(...loot.items);
    }
    a.gold += gold;
    if (guardian && s.rng.chance(RIFTS.petChance + a.tier * RIFTS.petChancePerTier)) {
      const pets = content.pets.filter((x) => x.rift === true && !p.stable.pets.includes(x.id));
      const pet = pets.length ? s.rng.pick(pets) : undefined;
      if (pet && grantPet(p, pet.id)) this.toast('loot', `Something followed you out of the Rift: ${pet.name}!`);
    }
    const got = s.items.receiveLoot(items, gold);
    this.toast('loot', `Rift ${guardian ? 'Guardian' : `wave ${a.wave + 1}`}: +${gold} gold${got.kept.length ? `, ${got.kept.length} item${got.kept.length > 1 ? 's' : ''}` : ''}.`);
  }

  private end(a: GauntletState, won: boolean): void {
    const e = this.e;
    delete e.active;
    if (a.kind === 'rift') {
      if (won) {
        e.riftTier = Math.max(e.riftTier, a.tier);
        e.riftsCleared++;
        this.toast('level', a.tier >= RIFTS.maxTier ? `Rift tier ${a.tier} cleared: the deepest Rift is yours.` : `Rift tier ${a.tier} cleared! Tier ${Math.min(RIFTS.maxTier, e.riftTier + 1)} is open.`);
      } else this.toast('warning', `The Rift closes on you at wave ${a.wave + 1}. The map is spent.`);
    } else if (a.kind === 'spire') {
      e.spire.best = Math.max(e.spire.best, (a.floor ?? 1) - 1);
      this.toast(a.wave > 0 ? 'level' : 'warning', `The Spire lets you go after ${a.wave} floor${a.wave === 1 ? '' : 's'}. Your best: ${e.spire.best}.`);
    } else if (a.kind === 'divine') {
      const god = a.god as string;
      if (won) {
        const rec = (e.divine[god] ??= { clears: 0, bestTurns: Infinity });
        rec.clears++;
        rec.bestTurns = Math.min(rec.bestTurns, a.turns);
        const name = content.gods.get(god).name;
        this.toast('level', `${name}'s trial is passed.`);
        if (DIVINE_TRIALS.every((t) => (e.divine[t.god]?.clears ?? 0) > 0) && !this.s.player.devotion.titles.includes('Trialsworn')) {
          this.s.player.devotion.titles.push('Trialsworn');
          this.toast('level', 'All fourteen gods have tested you. Title earned: Trialsworn.');
        }
      } else this.toast('warning', `${content.gods.get(god).name}'s Aspect turns away from you, unmoved.`);
    } else if (a.kind === 'league') {
      if (won) {
        e.league.rank = Math.min(LEAGUE.ranks.length - 1, e.league.rank + 1);
        e.league.seasons++;
        const gold = LEAGUE.goldPerLevelPerRank * e.league.rank * this.s.player.level;
        this.s.addGold(gold, 'league');
        this.toast('level', `Season won! You are now ${LEAGUE.ranks[e.league.rank]}. +${gold} gold.`);
        if (e.league.rank === LEAGUE.ranks.length - 1 && !this.s.player.devotion.titles.includes('Arena Champion of Champions')) this.s.player.devotion.titles.push('Arena Champion of Champions');
      } else this.toast('warning', `The season ends: ${a.wave} of ${a.fights.length} champions beaten. Your rank holds.`);
    } else if (a.kind === 'weekly') {
      const w = e.weekly;
      if (a.wave > w.best || (a.wave === w.best && a.turns < w.bestTurns)) {
        w.best = a.wave;
        w.bestTurns = a.turns;
      }
      if (won && !w.claimed) {
        w.claimed = true;
        const gold = WEEKLY.goldPerLevel * this.s.player.level;
        this.s.items.receiveLoot([createItem('rift-map', WEEKLY.riftMaps, () => this.s.newUid())], gold);
        this.toast('level', `The weekly run is done: +${gold} gold and ${WEEKLY.riftMaps} Rift Maps.`);
      } else this.toast(won ? 'info' : 'warning', won ? 'Weekly run cleared again. The prize was already claimed.' : `The weekly run ends after ${a.wave} of ${a.fights.length} fights.`);
    } else if (won) {
      e.bossRush.clears++;
      e.bossRush.bestTurns = Math.min(e.bossRush.bestTurns ?? Infinity, a.turns);
      const gold = BOSS_RUSH.goldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'bossRush');
      this.toast('level', `Boss Rush cleared in ${a.turns} turns! +${gold} gold.`);
    } else this.toast('warning', `The Boss Rush ends: ${a.wave} of ${a.fights.length} bosses beaten.`);
    this.s.bus.emit('stateChanged', { reason: 'gauntlet' });
  }
}
