import { grantPet } from '../character/stable';
import { content } from '../../data';
import { RIFT_AFFIXES, RIFTS } from '../../data/rifts';
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

  /** The next fight of the run in progress. */
  nextFight(): GauntletFight | undefined {
    const a = this.e.active;
    const f = a?.fights[a.wave];
    if (!a || !f) return undefined;
    const defs = a.affixes.map((id) => content.riftAffixes.get(id));
    return { ...f, enemyModifiers: defs.flatMap((d) => d.enemy ?? []), partyModifiers: defs.flatMap((d) => d.party ?? []) };
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
    const last = a.wave === a.fights.length - 1;
    if (a.kind === 'rift') this.riftRewards(a, last);
    a.wave++;
    if (a.kind === 'bossRush') this.e.bossRush.best = Math.max(this.e.bossRush.best, a.wave);
    if (last) this.end(a, true);
    else {
      if (a.kind === 'rift') this.respite();
      this.s.bus.emit('stateChanged', { reason: 'gauntlet' });
    }
  }

  /** Between Rift waves: part of everyone's HP and MP comes back. */
  private respite(): void {
    const heal = (char: Character): void => {
      const st = characterStats(char);
      char.hp = Math.min(st.maxHp, char.hp + Math.round((st.maxHp * RIFTS.respitePct) / 100));
      char.mp = Math.min(st.maxMp, char.mp + Math.round((st.maxMp * RIFTS.respitePct) / 100));
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
